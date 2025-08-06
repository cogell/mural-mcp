import type { MuralWorkspace, MuralWorkspacesResponse, MuralBoard, MuralUser, ScopeCheckResult, RateLimitConfig } from './types.js';
import { MuralOAuth } from './oauth.js';
import { MuralRateLimiter } from './rate-limiter.js';

const MURAL_API_BASE = 'https://app.mural.co/api/public/v1';

// Global authentication promise to prevent multiple concurrent auth flows
let globalAuthPromise: Promise<string> | null = null;

export class MuralClient {
  private oauth: MuralOAuth;
  private baseUrl: string;
  private rateLimiter: MuralRateLimiter;

  constructor(clientId: string, clientSecret?: string, redirectUri?: string, rateLimitConfig?: Partial<RateLimitConfig>) {
    this.oauth = new MuralOAuth(clientId, clientSecret, redirectUri);
    this.baseUrl = MURAL_API_BASE;
    this.rateLimiter = new MuralRateLimiter(rateLimitConfig);
  }

  private async getAccessToken(): Promise<string> {
    // If authentication is already in progress globally, wait for it
    if (globalAuthPromise) {
      return globalAuthPromise;
    }

    // Start new authentication and store globally
    globalAuthPromise = this.oauth.getValidAccessToken();
    
    try {
      const token = await globalAuthPromise;
      return token;
    } finally {
      // Clear the global promise when done (success or failure)
      globalAuthPromise = null;
    }
  }

  private async makeAuthenticatedRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    maxRetries: number = 3
  ): Promise<T> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      // Check rate limits before making request
      const rateLimitCheck = await this.rateLimiter.canMakeRequest();
      if (!rateLimitCheck.allowed) {
        if (rateLimitCheck.waitTimeMs && rateLimitCheck.waitTimeMs <= 5000) {
          // If wait time is reasonable (≤5s), wait and retry
          console.warn(`Rate limit hit: ${rateLimitCheck.reason}. Waiting ${rateLimitCheck.waitTimeMs}ms...`);
          await new Promise(resolve => setTimeout(resolve, rateLimitCheck.waitTimeMs!));
          continue;
        } else {
          // If wait time is too long or not available, throw error
          throw new Error(`Rate limit exceeded: ${rateLimitCheck.reason}`);
        }
      }

      // Consume rate limit token
      const consumed = await this.rateLimiter.consumeRequest();
      if (!consumed) {
        throw new Error('Failed to consume rate limit token');
      }

      try {
        const accessToken = await this.getAccessToken();
        
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...options.headers
        };

        const response = await fetch(url, {
          ...options,
          headers
        });

        // Handle rate limit responses from the API
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt) * 1000;
          
          if (attempt < maxRetries && waitTime <= 30000) {
            console.warn(`API rate limit hit (HTTP 429). Retrying after ${waitTime}ms... (attempt ${attempt + 1}/${maxRetries + 1})`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          } else {
            throw new Error(`API rate limit exceeded (HTTP 429). Max retries reached or wait time too long.`);
          }
        }

        if (!response.ok) {
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          
          try {
            const errorData = await response.json();
            if (errorData.message) {
              errorMessage += ` - ${errorData.message}`;
            }
            if (errorData.errors && Array.isArray(errorData.errors)) {
              errorMessage += ` - ${errorData.errors.join(', ')}`;
            }
          } catch {
            // If error response isn't JSON, use status text
          }

          // Don't retry on client errors (4xx except 429) or auth errors
          if (response.status >= 400 && response.status < 500 && response.status !== 429) {
            throw new Error(`Mural API request failed: ${errorMessage}`);
          }

          // Retry on server errors (5xx) with exponential backoff
          if (attempt < maxRetries && response.status >= 500) {
            const backoffTime = Math.pow(2, attempt) * 1000;
            console.warn(`Server error (${response.status}). Retrying after ${backoffTime}ms... (attempt ${attempt + 1}/${maxRetries + 1})`);
            await new Promise(resolve => setTimeout(resolve, backoffTime));
            continue;
          }

          throw new Error(`Mural API request failed: ${errorMessage}`);
        }

        const data = await response.json();
        return data as T;
        
      } catch (error) {
        // If it's our last attempt or a non-retryable error, throw
        if (attempt === maxRetries || error instanceof Error && (
          error.message.includes('Rate limit exceeded') ||
          error.message.includes('authentication') ||
          error.message.includes('authorization')
        )) {
          throw error;
        }

        // Otherwise, wait and retry with exponential backoff
        const backoffTime = Math.pow(2, attempt) * 1000;
        console.warn(`Request failed: ${error}. Retrying after ${backoffTime}ms... (attempt ${attempt + 1}/${maxRetries + 1})`);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
      }
    }

    throw new Error('Max retries exceeded');
  }

  async getWorkspaces(limit?: number, offset?: number): Promise<MuralWorkspace[]> {
    const params = new URLSearchParams();
    if (limit !== undefined) {
      params.append('limit', limit.toString());
    }
    if (offset !== undefined) {
      params.append('offset', offset.toString());
    }

    const queryString = params.toString();
    const endpoint = `/workspaces${queryString ? `?${queryString}` : ''}`;

    try {
      const response = await this.makeAuthenticatedRequest<any>(endpoint);
      // The API returns workspaces in a "value" property
      return response.value && Array.isArray(response.value) ? response.value : [];
    } catch (error) {
      console.error('Failed to fetch workspaces:', error);
      throw error;
    }
  }

  async getWorkspace(workspaceId: string): Promise<MuralWorkspace> {
    try {
      const workspace = await this.makeAuthenticatedRequest<MuralWorkspace>(`/workspaces/${workspaceId}`);
      return workspace;
    } catch (error) {
      console.error(`Failed to fetch workspace ${workspaceId}:`, error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.getWorkspaces(1);
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  async clearAuthentication(): Promise<void> {
    // Clear the global auth promise
    globalAuthPromise = null;
    await this.oauth.clearTokens();
  }

  async getRateLimitStatus() {
    return await this.rateLimiter.getRateLimitStatus();
  }

  async resetRateLimits(): Promise<void> {
    await this.rateLimiter.reset();
  }

  async getWorkspaceMurals(workspaceId: string): Promise<MuralBoard[]> {
    try {
      // Check if user has required scope first
      const scopeCheck = await this.checkScope('murals:read');
      if (!scopeCheck.hasScope) {
        throw new Error(`Permission denied: ${scopeCheck.message}. Please ensure your Mural OAuth app has 'murals:read' scope and re-authenticate.`);
      }

      // Try RESTful endpoint (legacy endpoints appear to be deprecated/non-existent)
      const response = await this.makeAuthenticatedRequest<any>(`/workspaces/${workspaceId}/murals`);
      
      // The API response structure may vary, handle both direct array and wrapped response
      const murals = response.value || response.murals || response;
      return Array.isArray(murals) ? murals : [];
    } catch (error) {
      // Check if error is scope-related and provide helpful message
      if (error instanceof Error) {
        if (error.message.includes('403') || error.message.includes('scope')) {
          const scopeCheck = await this.checkScope('murals:read');
          throw new Error(`Permission denied: ${scopeCheck.message}. Please ensure your Mural OAuth app has 'murals:read' scope and re-authenticate.`);
        }
      }
      console.error(`Failed to fetch murals for workspace ${workspaceId}:`, error);
      throw error;
    }
  }

  async getRoomMurals(roomId: string): Promise<MuralBoard[]> {
    try {
      // Check if user has required scope first
      const scopeCheck = await this.checkScope('murals:read');
      if (!scopeCheck.hasScope) {
        throw new Error(`Permission denied: ${scopeCheck.message}. Please ensure your Mural OAuth app has 'murals:read' scope and re-authenticate.`);
      }

      // Try RESTful endpoint (legacy endpoints appear to be deprecated/non-existent)
      const response = await this.makeAuthenticatedRequest<any>(`/rooms/${roomId}/murals`);
      
      // The API response structure may vary, handle both direct array and wrapped response
      const murals = response.value || response.murals || response;
      return Array.isArray(murals) ? murals : [];
    } catch (error) {
      // Check if error is scope-related and provide helpful message
      if (error instanceof Error) {
        if (error.message.includes('403') || error.message.includes('scope')) {
          const scopeCheck = await this.checkScope('murals:read');
          throw new Error(`Permission denied: ${scopeCheck.message}. Please ensure your Mural OAuth app has 'murals:read' scope and re-authenticate.`);
        }
      }
      console.error(`Failed to fetch murals for room ${roomId}:`, error);
      throw error;
    }
  }

  async getMural(muralId: string): Promise<MuralBoard> {
    try {
      // Check if user has required scope first
      const scopeCheck = await this.checkScope('murals:read');
      if (!scopeCheck.hasScope) {
        throw new Error(`Permission denied: ${scopeCheck.message}. Please ensure your Mural OAuth app has 'murals:read' scope and re-authenticate.`);
      }

      const mural = await this.makeAuthenticatedRequest<MuralBoard>(`/murals/${muralId}`);
      return mural;
    } catch (error) {
      // Check if error is scope-related and provide helpful message
      if (error instanceof Error) {
        if (error.message.includes('403') || error.message.includes('scope')) {
          const scopeCheck = await this.checkScope('murals:read');
          throw new Error(`Permission denied: ${scopeCheck.message}. Please ensure your Mural OAuth app has 'murals:read' scope and re-authenticate.`);
        }
      }
      console.error(`Failed to fetch mural ${muralId}:`, error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<MuralUser> {
    try {
      const user = await this.makeAuthenticatedRequest<MuralUser>(`/users/me`);
      return user;
    } catch (error) {
      console.error('Failed to fetch current user:', error);
      throw error;
    }
  }

  async getUserScopes(): Promise<string[]> {
    try {
      // Extract scopes from the stored OAuth token (primary method)
      const tokens = await this.oauth.getStoredTokens();
      if (tokens && tokens.scope) {
        return tokens.scope.split(' ').filter(scope => scope.trim() !== '');
      }
      
      // If no stored tokens or scope information, return empty array
      // Don't try to fetch from API as that might require scopes we don't have
      return [];
    } catch (error) {
      console.error('Failed to get user scopes:', error);
      return [];
    }
  }

  async checkScope(requiredScope: string): Promise<ScopeCheckResult> {
    try {
      const availableScopes = await this.getUserScopes();
      const hasScope = availableScopes.includes(requiredScope);
      
      return {
        hasScope,
        requiredScope,
        availableScopes,
        message: hasScope 
          ? `User has required scope: ${requiredScope}` 
          : `User missing required scope: ${requiredScope}. Available scopes: ${availableScopes.join(', ') || 'none'}`
      };
    } catch (error) {
      return {
        hasScope: false,
        requiredScope,
        availableScopes: [],
        message: `Failed to check scopes: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async debugWorkspacesAPI(): Promise<any> {
    const accessToken = await this.oauth.getValidAccessToken();
    
    const url = `${this.baseUrl}/workspaces`;
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };

    try {
      const response = await fetch(url, { headers });
      
      const debugInfo = {
        url,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        timestamp: new Date().toISOString()
      };

      let responseData;
      try {
        responseData = await response.json();
      } catch (e) {
        responseData = await response.text();
      }

      return {
        request: debugInfo,
        response: {
          value: responseData,
          raw: responseData
        },
        success: response.ok
      };
    } catch (error) {
      return {
        request: { url, headers: { ...headers, Authorization: '[REDACTED]' } },
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      };
    }
  }
}