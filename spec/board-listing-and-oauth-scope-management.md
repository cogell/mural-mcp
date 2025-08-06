# Mural MCP Server Development Specification

## Overview

This document outlines the development of board (mural) listing tools and comprehensive OAuth scope management for the Mural Model Context Protocol (MCP) server.

## Project Context

The Mural MCP server provides integration with the Mural visual collaboration platform through OAuth 2.0 authentication. This specification covers the enhancement of the server to support board operations with proper scope checking and user-friendly error handling.

## Development Goals

1. **Add Board Listing Capabilities**: Implement MCP tools to list boards within workspaces and rooms
2. **Implement Scope Checking**: Add comprehensive OAuth scope validation with actionable error messages
3. **Ensure Complete API Coverage**: Include all available Mural API OAuth scopes for full read/write operations

## Implementation Details

### Phase 1: Board Listing Tools Implementation

#### New Types Added (`src/types.ts`)

```typescript
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
```

#### New MCP Tools Added (`src/index.ts`)

1. **`list-workspace-boards`**
   - Description: List all boards (murals) within a specific workspace
   - Input: `workspaceId` (string, required)
   - Output: Array of boards with count and status message

2. **`list-room-boards`**
   - Description: List all boards (murals) within a specific room
   - Input: `roomId` (string, required)
   - Output: Array of boards with count and status message

3. **`get-board`**
   - Description: Get detailed information about a specific board (mural)
   - Input: `boardId` (string, required)
   - Output: Complete board object with metadata

4. **`check-user-scopes`**
   - Description: Check the current user's OAuth scopes and permissions
   - Input: None
   - Output: Comprehensive scope analysis with recommendations

#### New Client Methods (`src/mural-client.ts`)

1. **`getWorkspaceMurals(workspaceId: string): Promise<MuralBoard[]>`**
   - Fetches boards from workspace using RESTful endpoint `/workspaces/{workspaceId}/murals`
   - Includes proactive scope checking for `murals:read`
   - Enhanced error handling with scope-specific guidance

2. **`getRoomMurals(roomId: string): Promise<MuralBoard[]>`**
   - Fetches boards from room using RESTful endpoint `/rooms/{roomId}/murals`
   - Includes proactive scope checking for `murals:read`
   - Enhanced error handling with scope-specific guidance

3. **`getMural(muralId: string): Promise<MuralBoard>`**
   - Fetches individual board details using `/murals/{muralId}`
   - Includes proactive scope checking for `murals:read`
   - Enhanced error handling with scope-specific guidance

4. **`getCurrentUser(): Promise<MuralUser>`**
   - Fetches current authenticated user information
   - Used for scope validation and user context

5. **`getUserScopes(): Promise<string[]>`**
   - Extracts OAuth scopes from stored tokens
   - Primary method for scope validation
   - Fallback to empty array if no scopes available

6. **`checkScope(requiredScope: string): Promise<ScopeCheckResult>`**
   - Validates if user has specific OAuth scope
   - Returns detailed result with recommendations
   - Used for proactive permission checking

### Phase 2: OAuth Scope Management

#### OAuth Configuration Updates (`src/oauth.ts`)

**Complete OAuth Scopes Coverage**:
```typescript
scopes = [
  'workspaces:read',     // Read workspace information
  'rooms:read',          // Read room information
  'rooms:write',         // Create, update, and delete rooms
  'murals:read',         // Read mural information
  'murals:write',        // Create, update, and delete murals
  'templates:read',      // Read template information
  'templates:write',     // Create and delete templates
  'identity:read'        // Read user profile information
]
```

**New OAuth Method**:
- `getStoredTokens(): Promise<OAuthTokens | null>` - Access stored authentication tokens for scope extraction

#### API Endpoint Strategy

**RESTful Endpoints Used**:
- `/workspaces/{workspaceId}/murals` - List boards in workspace
- `/rooms/{roomId}/murals` - List boards in room  
- `/murals/{muralId}` - Get individual board details
- `/users/me` - Get current user information

**Legacy Endpoints Rejected**:
- `/getworkspacemurals` - Returns 404 (deprecated/non-existent)
- `/getroommurals` - Returns 404 (deprecated/non-existent)

### Phase 3: Enhanced Error Handling

#### Scope-Aware Error Messages

**Before**:
```
HTTP 403: Forbidden - Logged in user does not have the right scope(s) to access this resource
```

**After**:
```
Permission denied: User missing required scope: murals:read. Available scopes: workspaces:read. 
Please ensure your Mural OAuth app has 'murals:read' scope and re-authenticate.
```

#### Proactive Scope Checking

All board operation methods now:
1. Check for required OAuth scope before making API calls
2. Provide specific error messages when scopes are missing
3. Include actionable guidance for resolving scope issues
4. Maintain existing retry logic for transient errors

#### Scope Analysis Tool

The `check-user-scopes` tool provides:
- Current user information (when `identity:read` scope available)
- Complete list of available OAuth scopes
- Per-scope status with ✓/✗ indicators
- Specific recommendations for missing scopes
- Step-by-step guidance for re-authentication

## Testing & Validation

### Test Commands Used

1. **Tool Listing**: Verify all tools are properly registered
   ```bash
   echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}' | node build/index.js
   ```

2. **Workspace Listing**: Validate existing functionality
   ```bash
   echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "list-workspaces", "arguments": {}}}' | node build/index.js
   ```

3. **Board Listing**: Test new functionality with scope checking
   ```bash
   echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "list-workspace-boards", "arguments": {"workspaceId": "next4904"}}}' | node build/index.js
   ```

4. **Scope Checking**: Validate OAuth scope analysis
   ```bash
   echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "check-user-scopes", "arguments": {}}}' | node build/index.js
   ```

5. **Authentication Reset**: Clear tokens for re-authentication
   ```bash
   echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "clear-auth", "arguments": {}}}' | node build/index.js
   ```

### Test Results

- ✅ **Server Startup**: All 10 tools listed correctly (6 existing + 4 new)
- ✅ **Authentication**: OAuth flow works with existing credentials
- ✅ **Error Handling**: Scope-related errors provide actionable guidance
- ✅ **Scope Detection**: Tool correctly identifies missing `murals:read` scope
- ✅ **Build Process**: TypeScript compilation successful without errors

## Architecture Decisions

### Endpoint Strategy
- **Chose RESTful over Legacy**: Modern `/workspaces/{id}/murals` format over deprecated `/getworkspacemurals`
- **Removed Fallback Logic**: Legacy endpoints return 404, so fallback was removed for cleaner code

### Scope Management
- **Proactive Checking**: Check scopes before API calls to provide better error messages
- **Token-Based Scope Detection**: Extract scopes from stored OAuth tokens rather than additional API calls
- **Comprehensive Coverage**: Include all 8 available Mural API scopes for future functionality

### Error Handling
- **Layered Approach**: Check scopes first, then handle API errors with scope context
- **User-Centric Messages**: Focus on actionable steps rather than technical details
- **Preserve Existing Logic**: Maintain existing retry and rate limiting functionality

## Git Commit History

1. **`feat: add board (mural) listing tools for workspaces and rooms`**
   - Initial implementation of 3 board listing tools
   - Basic API integration with error handling
   - Added MuralBoard interface

2. **`feat: add comprehensive OAuth scope checking with enhanced error messages`**
   - Added scope checking functionality
   - Enhanced error messages with actionable guidance
   - Added check-user-scopes tool
   - Updated OAuth scopes to include read/write permissions

3. **`feat: complete OAuth scope coverage with templates support`**
   - Added templates:read and templates:write scopes
   - Removed non-existent workspaces:write scope
   - Complete coverage of all 8 available Mural API scopes

## Future Considerations

### Potential Enhancements
1. **Template Operations**: Implement tools for template listing and creation using `templates:read/write` scopes
2. **Room Management**: Add room creation and modification tools using `rooms:write` scope
3. **Board Creation**: Implement board/mural creation tools using `murals:write` scope
4. **Widget Operations**: Add widget manipulation within boards (requires additional API research)

### Scope Expansion
- Monitor Mural API updates for new OAuth scopes
- Consider workspace creation if `workspaces:write` becomes available
- Evaluate need for additional permission granularity

### Error Handling
- Add retry logic specific to scope-related errors
- Implement automatic scope detection and re-authentication flow
- Consider caching scope information to reduce API calls

## Summary

This implementation successfully adds comprehensive board listing capabilities to the Mural MCP server with enterprise-grade OAuth scope management. The solution provides:

- **4 new MCP tools** for board operations
- **Complete OAuth scope coverage** (8 scopes total)
- **Enhanced error handling** with actionable user guidance
- **Proactive permission checking** to prevent failed API calls
- **Future-ready architecture** for additional Mural API operations

The implementation maintains backward compatibility while significantly expanding the server's capabilities for workspace, room, and board management within the Mural platform.