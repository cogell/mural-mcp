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

export interface CreateWidgetResponse {
  value: AnyMuralWidget[];
}

// Chat messages
export interface MuralChatMessage {
  id: string;
  text: string;
  createdBy: {
    id: string;
    firstName?: string;
    lastName?: string;
  };
  createdOn: string;
  muralId: string;
}

export interface MuralChatResponse {
  value: MuralChatMessage[];
}

// Tags
export interface MuralTag {
  id: string;
  name: string;
  color?: string;
  muralId: string;
  createdOn?: string;
}

export interface MuralTagsResponse {
  value: MuralTag[];
}

export interface CreateTagRequest {
  name: string;
  color?: string;
}

// Comments
export interface MuralComment {
  id: string;
  text: string;
  x: number;
  y: number;
  targetWidgetId?: string;
  createdBy: {
    id: string;
    firstName?: string;
    lastName?: string;
  };
  createdOn: string;
  muralId: string;
}

export interface CreateCommentRequest {
  text: string;
  x: number;
  y: number;
  targetWidgetId?: string;
}

export interface CreateCommentResponse {
  value: MuralComment[];
}

// Voting sessions
export interface VotingSession {
  id: string;
  name: string;
  status: 'active' | 'completed';
  widgetIds: string[];
  votes: {
    widgetId: string;
    count: number;
  }[];
  createdOn: string;
  muralId: string;
}

export interface CreateVotingSessionRequest {
  name: string;
  widgetIds: string[];
}

export interface VoteRequest {
  widgetIds: string[];
}

// Timer
export interface TimerStatus {
  id: string;
  status: 'running' | 'paused' | 'stopped';
  duration: number;
  elapsed: number;
  createdOn: string;
  muralId: string;
}

export interface StartTimerRequest {
  duration: number;
}

// Visitor settings
export interface MuralVisitorSettings {
  allowVisitors?: boolean;
  visitorSettings?: {
    canEdit?: boolean;
    canComment?: boolean;
    canVote?: boolean;
  };
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

export interface CreateTextBoxRequest {
  x: number;
  y: number;
  text: string;
  width?: number;
  height?: number;
  style?: WidgetTextStyle;
}

export interface CreateTitleRequest {
  x: number;
  y: number;
  text: string;
  style?: {
    fontSize?: number;
    fontFamily?: string;
    textColor?: string;
  };
}

export interface CreateShapeRequest {
  x: number;
  y: number;
  width: number;
  height: number;
  shape: 'rectangle' | 'circle' | 'triangle' | 'diamond';
  style?: WidgetBorderStyle;
}

export interface CreateImageRequest {
  x: number;
  y: number;
  url: string;
  width?: number;
  height?: number;
  title?: string;
}

export interface CreateFileRequest {
  x: number;
  y: number;
  filename: string;
  url: string;
}

export interface CreateTableRequest {
  x: number;
  y: number;
  rows: number;
  columns: number;
  data?: string[][];
  style?: {
    headerBackgroundColor?: string;
    borderColor?: string;
  };
}

export interface CreateAreaRequest {
  x: number;
  y: number;
  width: number;
  height: number;
  title?: string;
  style?: WidgetBorderStyle;
}

export interface CreateArrowRequest {
  startWidget?: string;
  endWidget?: string;
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number;
  style?: WidgetArrowStyle;
}

// ============================================================================
// UPDATE REQUEST TYPES FOR PATCH OPERATIONS
// ============================================================================

// Widget update request interfaces
export interface UpdateStickyNoteRequest extends Partial<CreateStickyNoteRequest> {
  id?: string; // Widget ID for updates
}

export interface UpdateTextBoxRequest extends Partial<CreateTextBoxRequest> {
  id?: string;
}

export interface UpdateTitleRequest extends Partial<CreateTitleRequest> {
  id?: string;
}

export interface UpdateShapeRequest extends Partial<CreateShapeRequest> {
  id?: string;
}

export interface UpdateImageRequest extends Partial<CreateImageRequest> {
  id?: string;
}

export interface UpdateFileRequest extends Partial<CreateFileRequest> {
  id?: string;
}

export interface UpdateTableRequest extends Partial<CreateTableRequest> {
  id?: string;
}

export interface UpdateAreaRequest extends Partial<CreateAreaRequest> {
  id?: string;
}

export interface UpdateArrowRequest extends Partial<CreateArrowRequest> {
  id?: string;
}

export interface UpdateCommentRequest {
  id?: string;
  text?: string;
  x?: number;
  y?: number;
}

// Tag update request
export interface UpdateTagRequest {
  name?: string;
  color?: string;
}

// Permission update requests
export interface UpdateRoomMemberPermissions {
  members: Array<{
    userId: string;
    permissions: Array<'read' | 'write' | 'admin'>;
  }>;
}

export interface UpdateMuralMemberPermissions {
  members: Array<{
    userId: string;
    permissions: Array<'read' | 'write' | 'comment'>;
  }>;
}

// Timer update request
export interface UpdateTimerRequest {
  action: 'pause' | 'resume';
}

// Room and mural update requests
export interface UpdateRoomRequest {
  name?: string;
  description?: string;
}

export interface UpdateMuralRequest {
  title?: string;
  description?: string;
}