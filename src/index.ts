#!/usr/bin/env node

import 'dotenv/config';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { MuralClient } from './mural-client.js';

const REQUIRED_ENV_VARS = ['MURAL_CLIENT_ID'] as const;

function validateEnvironment(): { clientId: string; clientSecret?: string; redirectUri?: string } {
  const clientId = process.env.MURAL_CLIENT_ID;
  if (!clientId) {
    throw new Error(
      'Missing required environment variable: MURAL_CLIENT_ID. ' +
      'Please set this in your environment or .env file.'
    );
  }

  return {
    clientId,
    clientSecret: process.env.MURAL_CLIENT_SECRET,
    redirectUri: process.env.MURAL_REDIRECT_URI
  };
}

async function main() {
  const { clientId, clientSecret, redirectUri } = validateEnvironment();

  const muralClient = new MuralClient(clientId, clientSecret, redirectUri);

  const server = new Server(
    {
      name: 'mural-mcp-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'list-workspaces',
          description: 'List all workspaces the authenticated user has access to',
          inputSchema: {
            type: 'object',
            properties: {
              limit: {
                type: 'number',
                description: 'Maximum number of workspaces to return (optional)',
                minimum: 1,
                maximum: 100
              },
              offset: {
                type: 'number',
                description: 'Number of workspaces to skip for pagination (optional)',
                minimum: 0
              }
            },
            additionalProperties: false
          },
        },
        {
          name: 'get-workspace',
          description: 'Get detailed information about a specific workspace',
          inputSchema: {
            type: 'object',
            properties: {
              workspaceId: {
                type: 'string',
                description: 'The unique identifier of the workspace'
              }
            },
            required: ['workspaceId'],
            additionalProperties: false
          },
        },
        {
          name: 'test-connection',
          description: 'Test the connection to Mural API and verify authentication',
          inputSchema: {
            type: 'object',
            properties: {},
            additionalProperties: false
          },
        },
        {
          name: 'clear-auth',
          description: 'Clear stored authentication tokens (requires re-authentication)',
          inputSchema: {
            type: 'object',
            properties: {},
            additionalProperties: false
          },
        },
        {
          name: 'debug-api-response',
          description: 'Debug tool: Show raw API response from workspaces endpoint for troubleshooting',
          inputSchema: {
            type: 'object',
            properties: {},
            additionalProperties: false
          },
        },
        {
          name: 'get-rate-limit-status',
          description: 'Get current rate limiting status including remaining tokens and refresh times',
          inputSchema: {
            type: 'object',
            properties: {},
            additionalProperties: false
          },
        },
        {
          name: 'list-workspace-boards',
          description: 'List all boards (murals) within a specific workspace',
          inputSchema: {
            type: 'object',
            properties: {
              workspaceId: {
                type: 'string',
                description: 'The unique identifier of the workspace'
              }
            },
            required: ['workspaceId'],
            additionalProperties: false
          },
        },
        {
          name: 'list-room-boards',
          description: 'List all boards (murals) within a specific room',
          inputSchema: {
            type: 'object',
            properties: {
              roomId: {
                type: 'string',
                description: 'The unique identifier of the room'
              }
            },
            required: ['roomId'],
            additionalProperties: false
          },
        },
        {
          name: 'get-board',
          description: 'Get detailed information about a specific board (mural)',
          inputSchema: {
            type: 'object',
            properties: {
              boardId: {
                type: 'string',
                description: 'The unique identifier of the board/mural'
              }
            },
            required: ['boardId'],
            additionalProperties: false
          },
        },
        {
          name: 'check-user-scopes',
          description: 'Check the current user\'s OAuth scopes and permissions',
          inputSchema: {
            type: 'object',
            properties: {},
            additionalProperties: false
          },
        },
        // Content reading tools
        {
          name: 'get-mural-widgets',
          description: 'Get all widgets from a mural',
          inputSchema: {
            type: 'object',
            properties: {
              muralId: {
                type: 'string',
                description: 'The unique identifier of the mural'
              }
            },
            required: ['muralId'],
            additionalProperties: false
          },
        },
        {
          name: 'get-mural-widget',
          description: 'Get details of a specific widget by ID',
          inputSchema: {
            type: 'object',
            properties: {
              muralId: {
                type: 'string',
                description: 'The unique identifier of the mural'
              },
              widgetId: {
                type: 'string',
                description: 'The unique identifier of the widget'
              }
            },
            required: ['muralId', 'widgetId'],
            additionalProperties: false
          },
        },
        {
          name: 'delete-widget',
          description: 'Delete a widget by ID',
          inputSchema: {
            type: 'object',
            properties: {
              muralId: {
                type: 'string',
                description: 'The unique identifier of the mural'
              },
              widgetId: {
                type: 'string',
                description: 'The unique identifier of the widget to delete'
              }
            },
            required: ['muralId', 'widgetId'],
            additionalProperties: false
          },
        },
        // Widget creation tools
        {
          name: 'create-sticky-notes',
          description: 'Create sticky notes on a mural (max 1000 per request)',
          inputSchema: {
            type: 'object',
            properties: {
              muralId: {
                type: 'string',
                description: 'The unique identifier of the mural'
              },
              stickyNotes: {
                type: 'array',
                description: 'Array of sticky notes to create',
                items: {
                  type: 'object',
                  properties: {
                    x: { type: 'number', description: 'X coordinate position' },
                    y: { type: 'number', description: 'Y coordinate position' },
                    text: { type: 'string', description: 'Text content of the sticky note' },
                    width: { type: 'number', description: 'Width in pixels (optional)' },
                    height: { type: 'number', description: 'Height in pixels (optional)' },
                    style: {
                      type: 'object',
                      description: 'Visual styling properties (optional)',
                      properties: {
                        backgroundColor: { type: 'string', description: 'Background color' },
                        textColor: { type: 'string', description: 'Text color' },
                        fontSize: { type: 'number', description: 'Font size' }
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
          },
        },
        // PATCH/Update tools
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
          },
        },
      ],
    };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'list-workspaces': {
          const schema = z.object({
            limit: z.number().min(1).max(100).optional(),
            offset: z.number().min(0).optional()
          });

          const { limit, offset } = schema.parse(args || {});
          const workspaces = await muralClient.getWorkspaces(limit, offset);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  workspaces,
                  count: workspaces.length,
                  message: workspaces.length === 0
                    ? 'No workspaces found'
                    : `Found ${workspaces.length} workspace${workspaces.length === 1 ? '' : 's'}`
                }, null, 2)
              }
            ],
          };
        }

        case 'get-workspace': {
          const schema = z.object({
            workspaceId: z.string().min(1)
          });

          const { workspaceId } = schema.parse(args);
          const workspace = await muralClient.getWorkspace(workspaceId);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(workspace, null, 2)
              }
            ],
          };
        }

        case 'test-connection': {
          const isConnected = await muralClient.testConnection();

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  connected: isConnected,
                  message: isConnected
                    ? 'Successfully connected to Mural API'
                    : 'Failed to connect to Mural API'
                }, null, 2)
              }
            ],
          };
        }

        case 'clear-auth': {
          await muralClient.clearAuthentication();

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  message: 'Authentication tokens cleared. You will need to re-authenticate on the next API call.'
                }, null, 2)
              }
            ],
          };
        }

        case 'debug-api-response': {
          const debugInfo = await muralClient.debugWorkspacesAPI();

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  debug: debugInfo,
                  message: 'Raw API response data for troubleshooting'
                }, null, 2)
              }
            ],
          };
        }

        case 'get-rate-limit-status': {
          const rateLimitStatus = await muralClient.getRateLimitStatus();

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  rateLimits: rateLimitStatus,
                  message: 'Current rate limiting status',
                  explanation: {
                    user: `${rateLimitStatus.user.tokensRemaining}/${rateLimitStatus.user.capacity} requests available (${rateLimitStatus.user.refillRate}/second)`,
                    app: `${rateLimitStatus.app.tokensRemaining}/${rateLimitStatus.app.capacity} requests available (${rateLimitStatus.app.refillRate}/minute)`
                  }
                }, null, 2)
              }
            ],
          };
        }

        case 'list-workspace-boards': {
          const schema = z.object({
            workspaceId: z.string().min(1)
          });

          const { workspaceId } = schema.parse(args);
          const boards = await muralClient.getWorkspaceMurals(workspaceId);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  boards,
                  count: boards.length,
                  workspaceId,
                  message: boards.length === 0
                    ? `No boards found in workspace ${workspaceId}`
                    : `Found ${boards.length} board${boards.length === 1 ? '' : 's'} in workspace`
                }, null, 2)
              }
            ],
          };
        }

        case 'list-room-boards': {
          const schema = z.object({
            roomId: z.string().min(1)
          });

          const { roomId } = schema.parse(args);
          const boards = await muralClient.getRoomMurals(roomId);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  boards,
                  count: boards.length,
                  roomId,
                  message: boards.length === 0
                    ? `No boards found in room ${roomId}`
                    : `Found ${boards.length} board${boards.length === 1 ? '' : 's'} in room`
                }, null, 2)
              }
            ],
          };
        }

        case 'get-board': {
          const schema = z.object({
            boardId: z.string().min(1)
          });

          const { boardId } = schema.parse(args);
          const board = await muralClient.getMural(boardId);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(board, null, 2)
              }
            ],
          };
        }

        case 'check-user-scopes': {
          const scopes = await muralClient.getUserScopes();

          // Only try to get user info if we have identity:read scope
          let user = null;
          if (scopes.includes('identity:read')) {
            user = await muralClient.getCurrentUser().catch(() => null);
          }

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  user: user ? { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email } : 'User info unavailable (requires identity:read scope)',
                  scopes,
                  scopeCount: scopes.length,
                  message: scopes.length === 0
                    ? 'No OAuth scopes available. Please re-authenticate or check your Mural app configuration.'
                    : `User has ${scopes.length} OAuth scope${scopes.length === 1 ? '' : 's'}`,
                  recommendations: {
                    'workspaces:read': scopes.includes('workspaces:read') ? 'Required for listing workspaces (✓ available)' : 'Required for listing workspaces (✗ missing)',
                    'rooms:read': scopes.includes('rooms:read') ? 'Required for listing rooms (✓ available)' : 'Required for listing rooms (✗ missing)',
                    'rooms:write': scopes.includes('rooms:write') ? 'Required for creating/modifying rooms (✓ available)' : 'Required for creating/modifying rooms (✗ missing)',
                    'murals:read': scopes.includes('murals:read') ? 'Required for reading boards/murals (✓ available)' : 'Required for reading boards/murals (✗ missing)',
                    'murals:write': scopes.includes('murals:write') ? 'Required for creating/modifying boards/murals (✓ available)' : 'Required for creating/modifying boards/murals (✗ missing)',
                    'templates:read': scopes.includes('templates:read') ? 'Required for reading templates (✓ available)' : 'Required for reading templates (✗ missing)',
                    'templates:write': scopes.includes('templates:write') ? 'Required for creating/modifying templates (✓ available)' : 'Required for creating/modifying templates (✗ missing)',
                    'identity:read': scopes.includes('identity:read') ? 'Required for user info (✓ available)' : 'Required for user info (✗ missing)'
                  },
                  nextSteps: scopes.length === 0
                    ? ['Run clear-auth tool', 'Update your Mural app to include all required scopes', 'Re-authenticate when prompted']
                    : (scopes.includes('murals:read') && scopes.includes('murals:write') && scopes.includes('workspaces:read') && scopes.includes('rooms:read') && scopes.includes('rooms:write') && scopes.includes('templates:read'))
                      ? ['You have comprehensive scopes for full workspace/room/board/template operations']
                      : ['Add missing scopes to your Mural app: workspaces:read, rooms:read, rooms:write, murals:read, murals:write, templates:read, templates:write, identity:read', 'Run clear-auth tool', 'Re-authenticate to get new scopes']
                }, null, 2)
              }
            ],
          };
        }

        // Content reading tools
        case 'get-mural-widgets': {
          const schema = z.object({
            muralId: z.string().min(1)
          });

          const { muralId } = schema.parse(args);
          const widgets = await muralClient.getMuralWidgets(muralId);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  widgets,
                  count: widgets.length,
                  muralId,
                  message: widgets.length === 0
                    ? `No widgets found in mural ${muralId}`
                    : `Found ${widgets.length} widget${widgets.length === 1 ? '' : 's'} in mural`
                }, null, 2)
              }
            ],
          };
        }

        case 'get-mural-widget': {
          const schema = z.object({
            muralId: z.string().min(1),
            widgetId: z.string().min(1)
          });

          const { muralId, widgetId } = schema.parse(args);
          const widget = await muralClient.getMuralWidget(muralId, widgetId);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  widget,
                  muralId,
                  widgetId,
                  message: `Widget details retrieved successfully`
                }, null, 2)
              }
            ],
          };
        }

        // Widget creation tools
        case 'create-sticky-notes': {
          const schema = z.object({
            muralId: z.string().min(1),
            stickyNotes: z.array(z.object({
              x: z.number(),
              y: z.number(),
              text: z.string().min(1),
              width: z.number().optional(),
              height: z.number().optional(),
              style: z.object({
                backgroundColor: z.string().optional(),
                textColor: z.string().optional(),
                fontSize: z.number().optional()
              }).optional()
            })).min(1).max(1000)
          });

          const { muralId, stickyNotes } = schema.parse(args);

          // Helper function to calculate text-based dimensions
          function calculateTextDimensions(text: string, fontSize = 14) {
            const charWidth = fontSize * 0.6; // Approximate character width
            const lineHeight = fontSize * 1.4; // Standard line height
            const padding = 20; // Padding for sticky note
            const minWidth = 120; // Minimum sticky note width
            const maxWidth = 400; // Maximum sticky note width
            
            // Estimate text width and wrap to calculate height
            const words = text.split(' ');
            let currentLineWidth = 0;
            let lines = 1;
            
            for (const word of words) {
              const wordWidth = (word.length + 1) * charWidth; // +1 for space
              
              if (currentLineWidth + wordWidth > maxWidth - padding) {
                // Word doesn't fit, start new line
                lines++;
                currentLineWidth = word.length * charWidth;
              } else {
                currentLineWidth += wordWidth;
              }
            }
            
            const calculatedWidth = Math.min(Math.max(currentLineWidth + padding, minWidth), maxWidth);
            const calculatedHeight = Math.max(lines * lineHeight + padding, 60); // Minimum height of 60
            
            return { width: calculatedWidth, height: calculatedHeight };
          }

          // Add required shape field and calculate dimensions for each sticky note
          const stickyNotesWithShape = stickyNotes.map(note => {
            const fontSize = note.style?.fontSize || 14;
            const dimensions = calculateTextDimensions(note.text, fontSize);
            
            return {
              ...note,
              shape: 'rectangle' as const,
              // Use provided dimensions if available, otherwise use calculated ones
              width: note.width || dimensions.width,
              height: note.height || dimensions.height
            };
          });

          const createdWidgets = await muralClient.createStickyNotes(muralId, stickyNotesWithShape);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  widgets: createdWidgets,
                  count: createdWidgets.length,
                  muralId,
                  message: `Successfully created ${createdWidgets.length} sticky note${createdWidgets.length === 1 ? '' : 's'} in mural ${muralId}`
                }, null, 2)
              }
            ],
          };
        }

        // PATCH/Update tool handlers
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

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: true,
              message: errorMessage,
              tool: name
            }, null, 2)
          }
        ],
        isError: true,
      };
    }
  });

  // Start the server
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('Mural MCP Server running on stdio');
  console.error(`Required environment variables: ${REQUIRED_ENV_VARS.join(', ')}`);
  console.error('Server ready to accept requests...');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.error('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Start the server
main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});