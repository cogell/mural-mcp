import type { MuralWorkspace, MuralWorkspacesResponse } from './types.js';
import { MuralOAuth } from './oauth.js';

const MURAL_API_BASE = 'https://app.mural.co/api/public/v1';

export class MuralClient {
  private oauth: MuralOAuth;
  private baseUrl: string;

  constructor(clientId: string, clientSecret?: string, redirectUri?: string) {
    this.oauth = new MuralOAuth(clientId, clientSecret, redirectUri);
    this.baseUrl = MURAL_API_BASE;
  }

  private async makeAuthenticatedRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const accessToken = await this.oauth.getValidAccessToken();
    
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

      throw new Error(`Mural API request failed: ${errorMessage}`);
    }

    const data = await response.json();
    return data as T;
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
      const response = await this.makeAuthenticatedRequest<MuralWorkspacesResponse>(endpoint);
      return response.data || [];
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
    await this.oauth.clearTokens();
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
        response: responseData,
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