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