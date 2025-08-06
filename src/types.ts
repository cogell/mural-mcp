export interface MuralWorkspace {
  id: string;
  name: string;
  url?: string;
  created?: string;
  memberCount?: number;
  guestsAllowed?: boolean;
  visitorsAllowed?: boolean;
  deleted?: boolean;
}

export interface MuralWorkspacesResponse {
  data: MuralWorkspace[];
  total?: number;
  limit?: number;
  offset?: number;
}

export interface OAuthTokens {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  scope?: string;
  expires_at?: number;
}

export interface OAuthError {
  error: string;
  error_description?: string;
}

export interface PKCEChallenge {
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: string;
}

export interface AuthorizationParams {
  client_id: string;
  redirect_uri: string;
  scope: string;
  response_type: string;
  code_challenge: string;
  code_challenge_method: string;
  state?: string;
}

export interface TokenExchangeParams {
  client_id: string;
  client_secret?: string;
  code: string;
  code_verifier: string;
  grant_type: string;
  redirect_uri: string;
}

export interface RefreshTokenParams {
  client_id: string;
  client_secret?: string;
  refresh_token: string;
  grant_type: string;
}

export interface RateLimitBucket {
  capacity: number;
  tokens: number;
  refillRate: number;
  lastRefill: number;
  refillIntervalMs: number;
}

export interface RateLimitState {
  userBucket: RateLimitBucket;
  appBucket: RateLimitBucket;
  lastUpdated: number;
}

export interface RateLimitConfig {
  userRequestsPerSecond: number;
  appRequestsPerMinute: number;
  persistState: boolean;
}

export interface RateLimitStatus {
  user: {
    tokensRemaining: number;
    capacity: number;
    refillRate: number;
    nextRefillIn: number;
  };
  app: {
    tokensRemaining: number;
    capacity: number;
    refillRate: number;
    nextRefillIn: number;
  };
  lastUpdated: number;
}

export interface MuralBoard {
  id: string;
  title: string;
  createdOn?: string;
  updatedOn?: string;
  createdBy?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  workspaceId?: string;
  roomId?: string;
  thumbnail?: string;
  url?: string;
}