# Mural Contents API Implementation Specification

## Overview

This specification outlines the implementation plan for extending the Mural MCP Server with comprehensive Contents API support. The Contents API enables full CRUD operations on mural content including widgets, chat, tags, voting, and interactive features.

## Current State Analysis

### Existing Architecture
- **MCP Server** (`src/index.ts`): Handles tool registration and request routing
- **MuralClient** (`src/mural-client.ts`): Manages API communication with OAuth, rate limiting, and error handling
- **OAuth Handler** (`src/oauth.ts`): Implements OAuth 2.0 with PKCE
- **Rate Limiter** (`src/rate-limiter.ts`): Manages API rate limits
- **Types** (`src/types.ts`): TypeScript definitions for existing data structures

### Current Tools
- `list-workspaces` - List user workspaces
- `get-workspace` - Get workspace details
- `list-workspace-boards` - List boards in workspace
- `list-room-boards` - List boards in room
- `get-board` - Get board details
- `test-connection` - Test API connectivity
- `clear-auth` - Clear authentication tokens
- `check-user-scopes` - Verify OAuth scopes

## Implementation Plan

### Phase 1: Type Definitions and Data Models

#### 1.1 Widget Type Definitions

Add comprehensive interfaces for all widget types to `src/types.ts`:

```typescript
// Base widget interface
export interface MuralWidget {
  id: string;
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  muralId: string;
  createdBy?: string;
  createdOn?: string;
  updatedOn?: string;
}

// Specific widget types
export interface StickyNoteWidget extends MuralWidget {
  type: 'sticky note';
  text: string;
  style: {
    backgroundColor?: string;
    textColor?: string;
    fontSize?: number;
    fontFamily?: string;
  };
}

export interface TextBoxWidget extends MuralWidget {
  type: 'text box';
  text: string;
  style: {
    backgroundColor?: string;
    textColor?: string;
    fontSize?: number;
    fontFamily?: string;
    alignment?: 'left' | 'center' | 'right';
  };
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
  style: {
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
  };
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
  style: {
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
  };
}

export interface ArrowWidget extends MuralWidget {
  type: 'arrow';
  startWidget?: string;
  endWidget?: string;
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number;
  style: {
    color?: string;
    width?: number;
    arrowheadType?: string;
  };
}
```

#### 1.2 Content Management Types

```typescript
// Widget creation requests
export interface CreateWidgetRequest {
  widgets: Partial<MuralWidget>[];
}

export interface CreateWidgetResponse {
  value: MuralWidget[];
}

// Chat and tags
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

export interface MuralTag {
  id: string;
  name: string;
  color?: string;
  muralId: string;
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
}

// Voting and timer
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
}

export interface TimerStatus {
  id: string;
  status: 'running' | 'paused' | 'stopped';
  duration: number;
  elapsed: number;
  createdOn: string;
}
```

### Phase 2: MuralClient Extensions

#### 2.1 Content Reading Methods

Add methods to `MuralClient` class for reading content:

```typescript
// Widget operations
async getMuralWidgets(muralId: string): Promise<MuralWidget[]>
async getMuralWidget(muralId: string, widgetId: string): Promise<MuralWidget>

// Chat and tags  
async getMuralChat(muralId: string): Promise<MuralChatMessage[]>
async getMuralTags(muralId: string): Promise<MuralTag[]>

// Interactive features
async getVotingSession(muralId: string, sessionId: string): Promise<VotingSession>
async getTimer(muralId: string): Promise<TimerStatus>
```

#### 2.2 Content Creation Methods

```typescript
// Widget creation
async createStickyNotes(muralId: string, stickyNotes: Partial<StickyNoteWidget>[]): Promise<StickyNoteWidget[]>
async createTextBoxes(muralId: string, textBoxes: Partial<TextBoxWidget>[]): Promise<TextBoxWidget[]>
async createTitles(muralId: string, titles: Partial<TitleWidget>[]): Promise<TitleWidget[]>
async createShapes(muralId: string, shapes: Partial<ShapeWidget>[]): Promise<ShapeWidget[]>
async createImages(muralId: string, images: Partial<ImageWidget>[]): Promise<ImageWidget[]>
async createFiles(muralId: string, files: Partial<FileWidget>[]): Promise<FileWidget[]>
async createTables(muralId: string, tables: Partial<TableWidget>[]): Promise<TableWidget[]>
async createAreas(muralId: string, areas: Partial<AreaWidget>[]): Promise<AreaWidget[]>
async createArrows(muralId: string, arrows: Partial<ArrowWidget>[]): Promise<ArrowWidget[]>
async createComments(muralId: string, comments: Partial<MuralComment>[]): Promise<MuralComment[]>

// Tags and interactive features
async createMuralTag(muralId: string, tag: Partial<MuralTag>): Promise<MuralTag>
async startVotingSession(muralId: string, name: string, widgetIds: string[]): Promise<VotingSession>
async startTimer(muralId: string, duration: number): Promise<TimerStatus>

// Content management
async deleteWidget(muralId: string, widgetId: string): Promise<void>
async updateMuralVisitorSettings(muralId: string, settings: any): Promise<void>
```

#### 2.3 Implementation Details

Each method will:
1. Validate required OAuth scopes (`murals:read` or `murals:write`)
2. Use existing rate limiting and retry mechanisms
3. Handle API-specific error responses
4. Support both RESTful and legacy endpoint formats where available
5. Maintain consistent error handling patterns

### Phase 3: MCP Tool Registration

#### 3.1 Content Reading Tools

Register new MCP tools in `src/index.ts`:

```typescript
// Widget operations
{
  name: 'get-mural-widgets',
  description: 'Get all widgets from a mural',
  inputSchema: {
    type: 'object',
    properties: {
      muralId: { type: 'string', description: 'The mural ID' }
    },
    required: ['muralId'],
    additionalProperties: false
  }
}

{
  name: 'get-mural-widget', 
  description: 'Get details of a specific widget',
  inputSchema: {
    type: 'object',
    properties: {
      muralId: { type: 'string', description: 'The mural ID' },
      widgetId: { type: 'string', description: 'The widget ID' }
    },
    required: ['muralId', 'widgetId'],
    additionalProperties: false
  }
}

// Content operations
{
  name: 'get-mural-chat',
  description: 'Get chat messages from a mural',
  inputSchema: {
    type: 'object', 
    properties: {
      muralId: { type: 'string', description: 'The mural ID' }
    },
    required: ['muralId'],
    additionalProperties: false
  }
}

{
  name: 'get-mural-tags',
  description: 'Get tags from a mural',
  inputSchema: {
    type: 'object',
    properties: {
      muralId: { type: 'string', description: 'The mural ID' }
    },
    required: ['muralId'], 
    additionalProperties: false
  }
}
```

#### 3.2 Content Creation Tools

```typescript
// Widget creation tools
{
  name: 'create-sticky-notes',
  description: 'Create sticky notes on a mural (max 1000 per request)',
  inputSchema: {
    type: 'object',
    properties: {
      muralId: { type: 'string', description: 'The mural ID' },
      stickyNotes: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            x: { type: 'number', description: 'X coordinate' },
            y: { type: 'number', description: 'Y coordinate' },
            text: { type: 'string', description: 'Sticky note text' },
            width: { type: 'number', description: 'Width in pixels' },
            height: { type: 'number', description: 'Height in pixels' },
            style: {
              type: 'object',
              properties: {
                backgroundColor: { type: 'string' },
                textColor: { type: 'string' },
                fontSize: { type: 'number' }
              },
              additionalProperties: false
            }
          },
          required: ['x', 'y', 'text'],
          additionalProperties: false
        },
        maxItems: 1000,
        minItems: 1
      }
    },
    required: ['muralId', 'stickyNotes'],
    additionalProperties: false
  }
}

// Similar schemas for other widget types...
```

#### 3.3 Request Handlers

Implement request handlers with:
- Zod schema validation
- Scope checking with helpful error messages
- Consistent response formatting
- Proper error handling

### Phase 4: Testing and Validation

#### 4.1 Scope Validation
- Verify all tools properly check required OAuth scopes
- Provide clear error messages for missing scopes
- Test with limited scope configurations

#### 4.2 Rate Limiting
- Ensure content operations respect existing rate limits
- Test batch operations (especially 1000 sticky notes)
- Verify proper retry behavior

#### 4.3 Error Handling
- Test API error responses
- Verify proper error message formatting
- Test network failure scenarios

## OAuth Scope Requirements

### Required Scopes
- `murals:read` - Required for all content reading operations
- `murals:write` - Required for all content creation/modification operations
- `identity:read` - Optional, for user information in created content

### Scope Validation
All content operations will validate required scopes before execution and provide helpful error messages when scopes are missing.

## Security Considerations

1. **Input Validation**: All user inputs validated with Zod schemas
2. **Scope Enforcement**: Strict OAuth scope checking
3. **Rate Limiting**: Respect API rate limits to prevent abuse
4. **Error Disclosure**: Avoid exposing sensitive information in error messages
5. **Content Sanitization**: Ensure text content is properly handled

## Performance Considerations

1. **Batch Operations**: Support bulk creation where possible (sticky notes)
2. **Rate Limiting**: Intelligent rate limit management with queuing
3. **Error Retry**: Exponential backoff for transient failures
4. **Caching**: Consider caching for frequently accessed read operations

## Implementation Order

1. **Types** - Add all type definitions
2. **Client Methods** - Implement MuralClient methods for content operations
3. **Core Tools** - Add basic content reading tools (widgets, chat, tags)
4. **Creation Tools** - Add content creation tools (sticky notes, text boxes, etc.)
5. **Advanced Features** - Add voting, timer, and comment tools
6. **Testing** - Comprehensive testing with various configurations

## Success Criteria

1. All content reading operations work with proper scope validation
2. Content creation operations support batch operations where applicable
3. Error handling provides clear, actionable messages
4. Rate limiting prevents API abuse while maintaining performance
5. OAuth scope management is transparent and helpful
6. All operations maintain consistency with existing architecture patterns

## Future Enhancements

1. **Content Updates**: PATCH operations for modifying existing widgets
2. **Advanced Search**: Filtering and searching widgets by type/properties  
3. **Bulk Operations**: More efficient bulk operations for large content sets
4. **Real-time Events**: WebSocket support for real-time content updates
5. **Content Templates**: Predefined widget templates for common patterns