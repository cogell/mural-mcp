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

export interface MuralUser {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  type?: string;
  scopes?: string[];
}

export interface ScopeCheckResult {
  hasScope: boolean;
  requiredScope: string;
  availableScopes: string[];
  message: string;
}

// ============================================================================
// MURAL CONTENTS API TYPES
// ============================================================================

// Base widget interface
export interface MuralWidget {
  id: string;
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  muralId: string;
  createdBy?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  createdOn?: string;
  updatedOn?: string;
}

// Widget style interfaces
export interface WidgetTextStyle {
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
  fontFamily?: string;
  alignment?: 'left' | 'center' | 'right';
}

export interface WidgetBorderStyle {
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
}

export interface WidgetArrowStyle {
  color?: string;
  width?: number;
  arrowheadType?: string;
}

// Specific widget types
export interface StickyNoteWidget extends MuralWidget {
  type: 'sticky note';
  text: string;
  style: WidgetTextStyle;
}

export interface TextBoxWidget extends MuralWidget {
  type: 'text box';
  text: string;
  style: WidgetTextStyle;
}

export interface TitleWidget extends MuralWidget {
  type: 'title';
  text: string;
  style: {
    fontSize?: number;
    fontFamily?: string;
    textColor?: string;
  };
}

export interface ShapeWidget extends MuralWidget {
  type: 'shape';
  shape: 'rectangle' | 'circle' | 'triangle' | 'diamond';
  style: WidgetBorderStyle;
}

export interface ImageWidget extends MuralWidget {
  type: 'image';
  url: string;
  title?: string;
  filename?: string;
}

export interface FileWidget extends MuralWidget {
  type: 'file';
  filename: string;
  url: string;
  fileSize?: number;
  mimeType?: string;
}

export interface TableWidget extends MuralWidget {
  type: 'table';
  rows: number;
  columns: number;
  data: string[][];
  style?: {
    headerBackgroundColor?: string;
    borderColor?: string;
  };
}

export interface AreaWidget extends MuralWidget {
  type: 'area';
  title?: string;
  style: WidgetBorderStyle;
}

export interface ArrowWidget extends MuralWidget {
  type: 'arrow';
  startWidget?: string;
  endWidget?: string;
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number;
  style: WidgetArrowStyle;
}

// Union type for all widgets
export type AnyMuralWidget =
  | StickyNoteWidget
  | TextBoxWidget
  | TitleWidget
  | ShapeWidget
  | ImageWidget
  | FileWidget
  | TableWidget
  | AreaWidget
  | ArrowWidget;

// Widget creation requests and responses
export interface CreateWidgetRequest {
  widgets: Partial<AnyMuralWidget>[];
}

// Widget creation helpers
export interface CreateStickyNoteRequest {
  x: number;
  y: number;
  text: string;
  shape: 'rectangle'; // Required field for sticky notes
  width?: number;
  height?: number;
  style?: WidgetTextStyle;
}

// ============================================================================
// UPDATE REQUEST TYPES FOR PATCH OPERATIONS
// ============================================================================

// Widget update request interfaces
export interface UpdateStickyNoteRequest extends Partial<CreateStickyNoteRequest> {
  id?: string; // Widget ID for updates
}

