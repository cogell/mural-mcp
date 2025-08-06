import { randomBytes, createHash } from 'crypto';
import { URL, URLSearchParams } from 'url';
import http from 'http';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import type {
  PKCEChallenge,
  AuthorizationParams,
  TokenExchangeParams,
  RefreshTokenParams,
  OAuthTokens,
  OAuthError
} from './types.js';

const MURAL_OAUTH_BASE = 'https://app.mural.co/api/public/v1/authorization/oauth2';
const TOKEN_FILE_PATH = path.join(os.homedir(), '.mural-mcp-tokens.json');

export class MuralOAuth {
  private clientId: string;
  private clientSecret?: string;
  private redirectUri: string;
  private scopes: string[];

  constructor(
    clientId: string,
    clientSecret?: string,
    redirectUri = 'http://localhost:3000/callback',
    scopes = [
      'workspaces:read',
      'workspaces:write',
      'rooms:read', 
      'rooms:write',
      'murals:read',
      'murals:write',
      'identity:read'
    ]
  ) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri;
    this.scopes = scopes;
  }

  private generatePKCEChallenge(): PKCEChallenge {
    const codeVerifier = randomBytes(32).toString('base64url');
    const codeChallenge = createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');
    
    return {
      codeVerifier,
      codeChallenge,
      codeChallengeMethod: 'S256'
    };
  }

  private generateAuthorizationUrl(pkce: PKCEChallenge, state?: string): string {
    const params: AuthorizationParams = {
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: this.scopes.join(' '),
      response_type: 'code',
      code_challenge: pkce.codeChallenge,
      code_challenge_method: pkce.codeChallengeMethod,
      ...(state && { state })
    };

    const url = new URL(MURAL_OAUTH_BASE);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    return url.toString();
  }

  private async exchangeCodeForTokens(
    code: string,
    codeVerifier: string
  ): Promise<OAuthTokens> {
    const params: TokenExchangeParams = {
      client_id: this.clientId,
      ...(this.clientSecret && { client_secret: this.clientSecret }),
      code,
      code_verifier: codeVerifier,
      grant_type: 'authorization_code',
      redirect_uri: this.redirectUri
    };

    const response = await fetch(`${MURAL_OAUTH_BASE}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams(Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== undefined)
      ))
    });

    const data = await response.json();

    if (!response.ok) {
      const error = data as OAuthError;
      throw new Error(`OAuth token exchange failed: ${error.error} - ${error.error_description || 'Unknown error'}`);
    }

    const tokens = data as OAuthTokens;
    tokens.expires_at = Date.now() + (tokens.expires_in * 1000);
    
    return tokens;
  }

  private async refreshAccessToken(refreshToken: string): Promise<OAuthTokens> {
    const params: RefreshTokenParams = {
      client_id: this.clientId,
      ...(this.clientSecret && { client_secret: this.clientSecret }),
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    };

    const response = await fetch(`${MURAL_OAUTH_BASE}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams(Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== undefined)
      ))
    });

    const data = await response.json();

    if (!response.ok) {
      const error = data as OAuthError;
      throw new Error(`OAuth token refresh failed: ${error.error} - ${error.error_description || 'Unknown error'}`);
    }

    const tokens = data as OAuthTokens;
    tokens.expires_at = Date.now() + (tokens.expires_in * 1000);
    
    return tokens;
  }

  private async saveTokens(tokens: OAuthTokens): Promise<void> {
    try {
      await fs.writeFile(TOKEN_FILE_PATH, JSON.stringify(tokens, null, 2));
    } catch (error) {
      console.error('Failed to save tokens:', error);
      throw new Error('Failed to save authentication tokens');
    }
  }

  private async loadTokens(): Promise<OAuthTokens | null> {
    try {
      const data = await fs.readFile(TOKEN_FILE_PATH, 'utf-8');
      return JSON.parse(data) as OAuthTokens;
    } catch (error) {
      return null;
    }
  }

  private async startCallbackServer(expectedState?: string): Promise<{ code: string; state?: string }> {
    return new Promise((resolve, reject) => {
      const server = http.createServer((req, res) => {
        if (req.url?.startsWith('/callback')) {
          const url = new URL(req.url, `http://localhost:3000`);
          const code = url.searchParams.get('code');
          const state = url.searchParams.get('state');
          const error = url.searchParams.get('error');

          if (error) {
            res.writeHead(400, { 'Content-Type': 'text/html' });
            res.end(`<h1>Authentication Error</h1><p>${error}</p>`);
            server.close();
            reject(new Error(`OAuth error: ${error}`));
            return;
          }

          if (!code) {
            res.writeHead(400, { 'Content-Type': 'text/html' });
            res.end('<h1>Error</h1><p>No authorization code received</p>');
            server.close();
            reject(new Error('No authorization code received'));
            return;
          }

          if (expectedState && state !== expectedState) {
            res.writeHead(400, { 'Content-Type': 'text/html' });
            res.end('<h1>Error</h1><p>Invalid state parameter</p>');
            server.close();
            reject(new Error('Invalid state parameter'));
            return;
          }

          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end('<h1>Success!</h1><p>Authentication successful. You can close this window.</p>');
          server.close();
          resolve({ code, state: state || undefined });
        } else {
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end('<h1>Not Found</h1>');
        }
      });

      server.listen(3000, () => {
        console.log('OAuth callback server started on http://localhost:3000');
      });

      server.on('error', (error) => {
        reject(error);
      });
    });
  }

  async authenticate(): Promise<OAuthTokens> {
    // Check for existing valid tokens
    const existingTokens = await this.loadTokens();
    if (existingTokens && existingTokens.expires_at && existingTokens.expires_at > Date.now()) {
      return existingTokens;
    }

    // Try to refresh if we have a refresh token
    if (existingTokens?.refresh_token) {
      try {
        const refreshedTokens = await this.refreshAccessToken(existingTokens.refresh_token);
        await this.saveTokens(refreshedTokens);
        return refreshedTokens;
      } catch (error) {
        console.warn('Token refresh failed, starting new authentication flow');
      }
    }

    // Start new authentication flow
    const pkce = this.generatePKCEChallenge();
    const state = randomBytes(16).toString('hex');
    const authUrl = this.generateAuthorizationUrl(pkce, state);

    console.log('Please open the following URL in your browser to authenticate:');
    console.log(authUrl);
    console.log('\nWaiting for authentication callback...');

    // Start callback server and wait for response
    const callbackPromise = this.startCallbackServer(state);
    
    // Open browser automatically if possible
    const { spawn } = await import('child_process');
    const platform = process.platform;
    const command = platform === 'darwin' ? 'open' : platform === 'win32' ? 'start' : 'xdg-open';
    
    try {
      spawn(command, [authUrl], { stdio: 'ignore', detached: true }).unref();
    } catch (error) {
      // Browser opening failed, user will need to open manually
    }

    const { code } = await callbackPromise;
    
    // Exchange code for tokens
    const tokens = await this.exchangeCodeForTokens(code, pkce.codeVerifier);
    await this.saveTokens(tokens);
    
    console.log('Authentication successful!');
    return tokens;
  }

  async getValidAccessToken(): Promise<string> {
    const tokens = await this.authenticate();
    return tokens.access_token;
  }

  async getStoredTokens(): Promise<OAuthTokens | null> {
    return await this.loadTokens();
  }

  async clearTokens(): Promise<void> {
    try {
      await fs.unlink(TOKEN_FILE_PATH);
      console.log('Authentication tokens cleared');
    } catch (error) {
      // File doesn't exist, which is fine
    }
  }
}