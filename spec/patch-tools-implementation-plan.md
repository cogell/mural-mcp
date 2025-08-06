# PATCH Tools Implementation Plan for Mural MCP Server

## Overview

This specification outlines the implementation plan for adding comprehensive UPDATE (PATCH) operations to the Mural MCP Server. The server already has extensive CREATE (POST), READ (GET), and DELETE operations implemented. This plan focuses on completing the CRUD operations by adding UPDATE functionality through PATCH endpoints.

## Current State Analysis

### Existing Architecture Strengths
- **Comprehensive Types**: All widget types and data structures already defined in `src/types.ts`
- **Robust MuralClient**: Full OAuth, rate limiting, error handling, and scope validation
- **Complete CREATE Tools**: All widget creation tools implemented (sticky notes, text boxes, shapes, etc.)
- **Complete READ Tools**: All content reading tools implemented (widgets, chat, tags, etc.)
- **DELETE Operations**: Widget deletion already implemented
- **Infrastructure**: MCP server architecture, request handlers, and validation patterns established

### Missing Components
The server lacks UPDATE (PATCH) operations for:
1. **Widget Updates**: All 9 widget types (sticky notes, text boxes, titles, shapes, images, files, areas, arrows, comments)
2. **Content Updates**: Tags, mural visitor settings, timer controls
3. **Permission Updates**: Room and mural member permissions

## Implementation Plan

### Phase 1: Type Definitions for Update Operations

#### 1.1 Add Update Request Types

Add to `src/types.ts`:

```typescript
// Update request interfaces for all widget types
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
```

### Phase 2: MuralClient Method Extensions

#### 2.1 Add PATCH Methods to MuralClient

Add to `src/mural-client.ts`:

```typescript
// Widget update methods
async updateStickyNote(muralId: string, widgetId: string, updates: UpdateStickyNoteRequest): Promise<StickyNoteWidget> {
  try {
    const scopeCheck = await this.checkScope('murals:write');
    if (!scopeCheck.hasScope) {
      throw new Error(`Permission denied: ${scopeCheck.message}`);
    }

    const response = await this.makeAuthenticatedRequest<any>(
      `/murals/${encodeURIComponent(muralId)}/widgets/sticky-note/${encodeURIComponent(widgetId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(updates)
      }
    );
    return response.value || response;
  } catch (error) {
    console.error(`Failed to update sticky note ${widgetId} in mural ${muralId}:`, error);
    throw error;
  }
}

async updateTextBox(muralId: string, widgetId: string, updates: UpdateTextBoxRequest): Promise<TextBoxWidget> {
  // Similar implementation pattern...
}

// Continue for all widget types: updateTitle, updateShape, updateImage, updateFile, updateArea, updateArrow, updateComment

// Content update methods
async updateMuralTag(muralId: string, tagId: string, updates: UpdateTagRequest): Promise<MuralTag> {
  try {
    const scopeCheck = await this.checkScope('murals:write');
    if (!scopeCheck.hasScope) {
      throw new Error(`Permission denied: ${scopeCheck.message}`);
    }

    const response = await this.makeAuthenticatedRequest<any>(
      `/murals/${encodeURIComponent(muralId)}/tags/${encodeURIComponent(tagId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(updates)
      }
    );
    return response.value || response;
  } catch (error) {
    console.error(`Failed to update tag ${tagId} in mural ${muralId}:`, error);
    throw error;
  }
}

async updateRoomMemberPermissions(roomId: string, updates: UpdateRoomMemberPermissions): Promise<void> {
  try {
    const scopeCheck = await this.checkScope('rooms:write');
    if (!scopeCheck.hasScope) {
      throw new Error(`Permission denied: ${scopeCheck.message}`);
    }

    await this.makeAuthenticatedRequest<void>(
      `/room/${encodeURIComponent(roomId)}/members`,
      {
        method: 'PATCH',
        body: JSON.stringify(updates)
      }
    );
  } catch (error) {
    console.error(`Failed to update room member permissions for room ${roomId}:`, error);
    throw error;
  }
}

async updateMuralMemberPermissions(muralId: string, updates: UpdateMuralMemberPermissions): Promise<void> {
  try {
    const scopeCheck = await this.checkScope('murals:write');
    if (!scopeCheck.hasScope) {
      throw new Error(`Permission denied: ${scopeCheck.message}`);
    }

    await this.makeAuthenticatedRequest<void>(
      `/mural/${encodeURIComponent(muralId)}/members`,
      {
        method: 'PATCH',
        body: JSON.stringify(updates)
      }
    );
  } catch (error) {
    console.error(`Failed to update mural member permissions for mural ${muralId}:`, error);
    throw error;
  }
}

// Timer update method (already partially implemented as pauseTimer)
async updateTimer(muralId: string, updates: UpdateTimerRequest): Promise<TimerStatus> {
  try {
    const scopeCheck = await this.checkScope('murals:write');
    if (!scopeCheck.hasScope) {
      throw new Error(`Permission denied: ${scopeCheck.message}`);
    }

    const response = await this.makeAuthenticatedRequest<any>(
      `/murals/${encodeURIComponent(muralId)}/timer`,
      {
        method: 'PATCH',
        body: JSON.stringify(updates)
      }
    );
    return response.value || response;
  } catch (error) {
    console.error(`Failed to update timer for mural ${muralId}:`, error);
    throw error;
  }
}

// Room update method
async updateRoom(roomId: string, updates: { name?: string; description?: string }): Promise<void> {
  try {
    const scopeCheck = await this.checkScope('rooms:write');
    if (!scopeCheck.hasScope) {
      throw new Error(`Permission denied: ${scopeCheck.message}`);
    }

    await this.makeAuthenticatedRequest<void>(
      `/rooms/${encodeURIComponent(roomId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(updates)
      }
    );
  } catch (error) {
    console.error(`Failed to update room ${roomId}:`, error);
    throw error;
  }
}

// Mural update method  
async updateMural(muralId: string, updates: { title?: string; description?: string }): Promise<MuralBoard> {
  try {
    const scopeCheck = await this.checkScope('murals:write');
    if (!scopeCheck.hasScope) {
      throw new Error(`Permission denied: ${scopeCheck.message}`);
    }

    const response = await this.makeAuthenticatedRequest<any>(
      `/murals/${encodeURIComponent(muralId)}`,
      {
        method: 'PATCH', 
        body: JSON.stringify(updates)
      }
    );
    return response.value || response;
  } catch (error) {
    console.error(`Failed to update mural ${muralId}:`, error);
    throw error;
  }
}
```

### Phase 3: MCP Tool Registration

#### 3.1 Add Widget Update Tools

Add to the tools array in `src/index.ts`:

```typescript
// Widget update tools
{
  name: 'update-sticky-note',
  description: 'Update a sticky note widget in a mural',
  inputSchema: {
    type: 'object',
    properties: {
      muralId: {
        type: 'string',
        description: 'The unique identifier of the mural'
      },
      widgetId: {
        type: 'string', 
        description: 'The unique identifier of the sticky note widget to update'
      },
      updates: {
        type: 'object',
        description: 'The properties to update',
        properties: {
          x: { type: 'number', description: 'X coordinate position' },
          y: { type: 'number', description: 'Y coordinate position' },
          text: { type: 'string', description: 'Text content of the sticky note' },
          width: { type: 'number', description: 'Width in pixels' },
          height: { type: 'number', description: 'Height in pixels' },
          style: {
            type: 'object',
            description: 'Visual styling properties',
            properties: {
              backgroundColor: { type: 'string', description: 'Background color' },
              textColor: { type: 'string', description: 'Text color' },
              fontSize: { type: 'number', description: 'Font size' }
            },
            additionalProperties: false
          }
        },
        additionalProperties: false
      }
    },
    required: ['muralId', 'widgetId', 'updates'],
    additionalProperties: false
  }
},

{
  name: 'update-text-box',
  description: 'Update a text box widget in a mural',
  inputSchema: {
    type: 'object',
    properties: {
      muralId: { type: 'string', description: 'The unique identifier of the mural' },
      widgetId: { type: 'string', description: 'The unique identifier of the text box widget to update' },
      updates: {
        type: 'object',
        description: 'The properties to update',
        properties: {
          x: { type: 'number', description: 'X coordinate position' },
          y: { type: 'number', description: 'Y coordinate position' },
          text: { type: 'string', description: 'Text content of the text box' },
          width: { type: 'number', description: 'Width in pixels' },
          height: { type: 'number', description: 'Height in pixels' },
          style: {
            type: 'object',
            description: 'Visual styling properties',
            properties: {
              backgroundColor: { type: 'string', description: 'Background color' },
              textColor: { type: 'string', description: 'Text color' },
              fontSize: { type: 'number', description: 'Font size' },
              alignment: { type: 'string', enum: ['left', 'center', 'right'], description: 'Text alignment' }
            },
            additionalProperties: false
          }
        },
        additionalProperties: false
      }
    },
    required: ['muralId', 'widgetId', 'updates'],
    additionalProperties: false
  }
},

// Continue with similar schemas for: update-title, update-shape, update-image, update-file, update-area, update-arrow, update-comment
```

#### 3.2 Add Content Update Tools

```typescript
{
  name: 'update-mural-tag',
  description: 'Update a tag in a mural',
  inputSchema: {
    type: 'object',
    properties: {
      muralId: {
        type: 'string',
        description: 'The unique identifier of the mural'
      },
      tagId: {
        type: 'string',
        description: 'The unique identifier of the tag to update'
      },
      updates: {
        type: 'object',
        description: 'The tag properties to update',
        properties: {
          name: { type: 'string', description: 'Name of the tag' },
          color: { type: 'string', description: 'Color of the tag' }
        },
        additionalProperties: false
      }
    },
    required: ['muralId', 'tagId', 'updates'],
    additionalProperties: false
  }
},

{
  name: 'update-room-member-permissions',
  description: 'Update room member permissions',
  inputSchema: {
    type: 'object',
    properties: {
      roomId: {
        type: 'string',
        description: 'The unique identifier of the room'
      },
      members: {
        type: 'array',
        description: 'Array of member permission updates',
        items: {
          type: 'object',
          properties: {
            userId: { type: 'string', description: 'User ID' },
            permissions: {
              type: 'array',
              items: { type: 'string', enum: ['read', 'write', 'admin'] },
              description: 'Array of permissions to grant'
            }
          },
          required: ['userId', 'permissions'],
          additionalProperties: false
        },
        minItems: 1
      }
    },
    required: ['roomId', 'members'],
    additionalProperties: false
  }
},

{
  name: 'update-mural-member-permissions',
  description: 'Update mural member permissions',
  inputSchema: {
    type: 'object',
    properties: {
      muralId: {
        type: 'string',
        description: 'The unique identifier of the mural'
      },
      members: {
        type: 'array',
        description: 'Array of member permission updates',
        items: {
          type: 'object',
          properties: {
            userId: { type: 'string', description: 'User ID' },
            permissions: {
              type: 'array',
              items: { type: 'string', enum: ['read', 'write', 'comment'] },
              description: 'Array of permissions to grant'
            }
          },
          required: ['userId', 'permissions'],
          additionalProperties: false
        },
        minItems: 1
      }
    },
    required: ['muralId', 'members'],
    additionalProperties: false
  }
},

{
  name: 'update-timer',
  description: 'Update (pause/resume) mural timer',
  inputSchema: {
    type: 'object',
    properties: {
      muralId: {
        type: 'string',
        description: 'The unique identifier of the mural'
      },
      action: {
        type: 'string',
        enum: ['pause', 'resume'],
        description: 'Action to perform on the timer'
      }
    },
    required: ['muralId', 'action'],
    additionalProperties: false
  }
},

{
  name: 'update-room',
  description: 'Update room details',
  inputSchema: {
    type: 'object',
    properties: {
      roomId: {
        type: 'string',
        description: 'The unique identifier of the room'
      },
      updates: {
        type: 'object',
        description: 'The room properties to update',
        properties: {
          name: { type: 'string', description: 'Room name' },
          description: { type: 'string', description: 'Room description' }
        },
        additionalProperties: false
      }
    },
    required: ['roomId', 'updates'],
    additionalProperties: false
  }
},

{
  name: 'update-mural',
  description: 'Update mural details',
  inputSchema: {
    type: 'object',
    properties: {
      muralId: {
        type: 'string',
        description: 'The unique identifier of the mural'
      },
      updates: {
        type: 'object',
        description: 'The mural properties to update',
        properties: {
          title: { type: 'string', description: 'Mural title' },
          description: { type: 'string', description: 'Mural description' }
        },
        additionalProperties: false
      }
    },
    required: ['muralId', 'updates'],
    additionalProperties: false
  }
}
```

### Phase 4: Request Handler Implementation

#### 4.1 Add PATCH Tool Handlers

Add to the switch statement in `src/index.ts`:

```typescript
// Widget update handlers
case 'update-sticky-note': {
  const schema = z.object({
    muralId: z.string().min(1),
    widgetId: z.string().min(1),
    updates: z.object({
      x: z.number().optional(),
      y: z.number().optional(),
      text: z.string().min(1).optional(),
      width: z.number().optional(),
      height: z.number().optional(),
      style: z.object({
        backgroundColor: z.string().optional(),
        textColor: z.string().optional(),
        fontSize: z.number().optional()
      }).optional()
    })
  });
  
  const { muralId, widgetId, updates } = schema.parse(args);
  const updatedWidget = await muralClient.updateStickyNote(muralId, widgetId, updates);
  
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          widget: updatedWidget,
          muralId,
          widgetId,
          message: `Successfully updated sticky note ${widgetId} in mural ${muralId}`
        }, null, 2)
      }
    ],
  };
}

case 'update-text-box': {
  // Similar implementation pattern for all widget types...
}

// Content update handlers
case 'update-mural-tag': {
  const schema = z.object({
    muralId: z.string().min(1),
    tagId: z.string().min(1),
    updates: z.object({
      name: z.string().min(1).optional(),
      color: z.string().optional()
    })
  });
  
  const { muralId, tagId, updates } = schema.parse(args);
  const updatedTag = await muralClient.updateMuralTag(muralId, tagId, updates);
  
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          tag: updatedTag,
          muralId,
          tagId,
          message: `Successfully updated tag ${tagId} in mural ${muralId}`
        }, null, 2)
      }
    ],
  };
}

case 'update-room-member-permissions': {
  const schema = z.object({
    roomId: z.string().min(1),
    members: z.array(z.object({
      userId: z.string().min(1),
      permissions: z.array(z.enum(['read', 'write', 'admin'])).min(1)
    })).min(1)
  });
  
  const { roomId, members } = schema.parse(args);
  await muralClient.updateRoomMemberPermissions(roomId, { members });
  
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          roomId,
          membersUpdated: members.length,
          message: `Successfully updated permissions for ${members.length} member${members.length === 1 ? '' : 's'} in room ${roomId}`
        }, null, 2)
      }
    ],
  };
}

// Continue with handlers for all other PATCH tools...
```

## Implementation Strategy

### Priority Order

1. **High Priority (Core Widget Updates)**:
   - update-sticky-note
   - update-text-box
   - update-title
   - update-shape

2. **Medium Priority (Advanced Widget Updates)**:
   - update-image
   - update-file
   - update-area
   - update-arrow
   - update-comment

3. **Medium Priority (Content Updates)**:
   - update-mural-tag
   - update-timer

4. **Lower Priority (Permission Updates)**:
   - update-room-member-permissions
   - update-mural-member-permissions
   - update-room
   - update-mural

### Development Approach

1. **Incremental Implementation**: Implement 2-3 tools at a time and test thoroughly
2. **Pattern Reuse**: Leverage existing patterns from CREATE and READ operations
3. **Validation First**: Ensure robust input validation with Zod schemas
4. **Error Handling**: Maintain consistency with existing error handling patterns
5. **Testing**: Test each tool with various input combinations and error scenarios

## OAuth Scope Requirements

All PATCH operations require appropriate write scopes:
- **Widget Updates**: `murals:write`
- **Content Updates**: `murals:write`
- **Room Updates**: `rooms:write`
- **Member Permissions**: `rooms:write` (rooms) or `murals:write` (murals)

## Testing Strategy

### Unit Testing
- Schema validation for all input types
- Error handling for invalid inputs
- Scope validation for each operation
- API client method testing

### Integration Testing
- End-to-end tool execution
- Error propagation from API to tool response
- Rate limiting behavior
- Token refresh during long operations

### Manual Testing
- Test with different OAuth scopes
- Test with various widget types and properties
- Test error conditions (invalid IDs, insufficient permissions)
- Test batch operations where applicable

## Success Criteria

1. **Completeness**: All 15+ PATCH operations implemented and functional
2. **Consistency**: All tools follow established patterns and conventions
3. **Validation**: Robust input validation prevents API errors
4. **Error Handling**: Clear, actionable error messages for all failure modes  
5. **Performance**: Operations complete within reasonable time limits
6. **Documentation**: All tools properly documented with clear examples

## Security Considerations

1. **Input Sanitization**: All user inputs properly validated and sanitized
2. **Scope Enforcement**: Strict OAuth scope checking for all operations
3. **Rate Limiting**: Respect API rate limits to prevent abuse
4. **Error Disclosure**: Avoid exposing sensitive information in error messages
5. **Permission Validation**: Verify user permissions before allowing updates

## Future Enhancements

1. **Batch Updates**: Support updating multiple widgets in a single operation
2. **Conditional Updates**: Support conditional updates based on current state
3. **Rollback Operations**: Ability to undo recent updates
4. **Audit Logging**: Track update history for compliance
5. **Real-time Sync**: WebSocket-based real-time updates

---

*Implementation Target: Complete PATCH tools implementation*  
*Priority: High - Completes CRUD operations for comprehensive mural management*