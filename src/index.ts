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
          name: 'get-mural-chat',
          description: 'Get chat messages from a mural',
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
          name: 'get-mural-tags',
          description: 'Get tags from a mural',
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
        {
          name: 'create-text-boxes',
          description: 'Create text boxes on a mural',
          inputSchema: {
            type: 'object',
            properties: {
              muralId: {
                type: 'string',
                description: 'The unique identifier of the mural'
              },
              textBoxes: {
                type: 'array',
                description: 'Array of text boxes to create',
                items: {
                  type: 'object',
                  properties: {
                    x: { type: 'number', description: 'X coordinate position' },
                    y: { type: 'number', description: 'Y coordinate position' },
                    text: { type: 'string', description: 'Text content of the text box' },
                    width: { type: 'number', description: 'Width in pixels (optional)' },
                    height: { type: 'number', description: 'Height in pixels (optional)' },
                    style: {
                      type: 'object',
                      description: 'Visual styling properties (optional)',
                      properties: {
                        backgroundColor: { type: 'string', description: 'Background color' },
                        textColor: { type: 'string', description: 'Text color' },
                        fontSize: { type: 'number', description: 'Font size' },
                        alignment: { type: 'string', enum: ['left', 'center', 'right'], description: 'Text alignment' }
                      },
                      additionalProperties: false
                    }
                  },
                  required: ['x', 'y', 'text'],
                  additionalProperties: false
                },
                minItems: 1
              }
            },
            required: ['muralId', 'textBoxes'],
            additionalProperties: false
          },
        },
        {
          name: 'create-titles',
          description: 'Create title widgets on a mural',
          inputSchema: {
            type: 'object',
            properties: {
              muralId: {
                type: 'string',
                description: 'The unique identifier of the mural'
              },
              titles: {
                type: 'array',
                description: 'Array of titles to create',
                items: {
                  type: 'object',
                  properties: {
                    x: { type: 'number', description: 'X coordinate position' },
                    y: { type: 'number', description: 'Y coordinate position' },
                    text: { type: 'string', description: 'Title text' },
                    style: {
                      type: 'object',
                      description: 'Visual styling properties (optional)',
                      properties: {
                        fontSize: { type: 'number', description: 'Font size' },
                        fontFamily: { type: 'string', description: 'Font family' },
                        textColor: { type: 'string', description: 'Text color' }
                      },
                      additionalProperties: false
                    }
                  },
                  required: ['x', 'y', 'text'],
                  additionalProperties: false
                },
                minItems: 1
              }
            },
            required: ['muralId', 'titles'],
            additionalProperties: false
          },
        },
        {
          name: 'create-shapes',
          description: 'Create shape widgets on a mural',
          inputSchema: {
            type: 'object',
            properties: {
              muralId: {
                type: 'string',
                description: 'The unique identifier of the mural'
              },
              shapes: {
                type: 'array',
                description: 'Array of shapes to create',
                items: {
                  type: 'object',
                  properties: {
                    x: { type: 'number', description: 'X coordinate position' },
                    y: { type: 'number', description: 'Y coordinate position' },
                    width: { type: 'number', description: 'Width in pixels' },
                    height: { type: 'number', description: 'Height in pixels' },
                    shape: { 
                      type: 'string', 
                      enum: ['rectangle', 'circle', 'triangle', 'diamond'],
                      description: 'Shape type' 
                    },
                    style: {
                      type: 'object',
                      description: 'Visual styling properties (optional)',
                      properties: {
                        backgroundColor: { type: 'string', description: 'Background color' },
                        borderColor: { type: 'string', description: 'Border color' },
                        borderWidth: { type: 'number', description: 'Border width' }
                      },
                      additionalProperties: false
                    }
                  },
                  required: ['x', 'y', 'width', 'height', 'shape'],
                  additionalProperties: false
                },
                minItems: 1
              }
            },
            required: ['muralId', 'shapes'],
            additionalProperties: false
          },
        },
        {
          name: 'create-mural-tag',
          description: 'Create a tag for a mural',
          inputSchema: {
            type: 'object',
            properties: {
              muralId: {
                type: 'string',
                description: 'The unique identifier of the mural'
              },
              name: {
                type: 'string',
                description: 'Name of the tag'
              },
              color: {
                type: 'string',
                description: 'Color of the tag (optional)'
              }
            },
            required: ['muralId', 'name'],
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
          },
        },
        {
          name: 'update-title',
          description: 'Update a title widget in a mural',
          inputSchema: {
            type: 'object',
            properties: {
              muralId: { type: 'string', description: 'The unique identifier of the mural' },
              widgetId: { type: 'string', description: 'The unique identifier of the title widget to update' },
              updates: {
                type: 'object',
                description: 'The properties to update',
                properties: {
                  x: { type: 'number', description: 'X coordinate position' },
                  y: { type: 'number', description: 'Y coordinate position' },
                  text: { type: 'string', description: 'Title text' },
                  style: {
                    type: 'object',
                    description: 'Visual styling properties',
                    properties: {
                      fontSize: { type: 'number', description: 'Font size' },
                      fontFamily: { type: 'string', description: 'Font family' },
                      textColor: { type: 'string', description: 'Text color' }
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
        {
          name: 'update-shape',
          description: 'Update a shape widget in a mural',
          inputSchema: {
            type: 'object',
            properties: {
              muralId: { type: 'string', description: 'The unique identifier of the mural' },
              widgetId: { type: 'string', description: 'The unique identifier of the shape widget to update' },
              updates: {
                type: 'object',
                description: 'The properties to update',
                properties: {
                  x: { type: 'number', description: 'X coordinate position' },
                  y: { type: 'number', description: 'Y coordinate position' },
                  width: { type: 'number', description: 'Width in pixels' },
                  height: { type: 'number', description: 'Height in pixels' },
                  shape: { 
                    type: 'string', 
                    enum: ['rectangle', 'circle', 'triangle', 'diamond'],
                    description: 'Shape type' 
                  },
                  style: {
                    type: 'object',
                    description: 'Visual styling properties',
                    properties: {
                      backgroundColor: { type: 'string', description: 'Background color' },
                      borderColor: { type: 'string', description: 'Border color' },
                      borderWidth: { type: 'number', description: 'Border width' }
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
          },
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
          },
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
          },
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
          },
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
          },
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
          },
        }
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

        case 'get-mural-chat': {
          const schema = z.object({
            muralId: z.string().min(1)
          });
          
          const { muralId } = schema.parse(args);
          const chat = await muralClient.getMuralChat(muralId);
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  chat,
                  count: chat.length,
                  muralId,
                  message: chat.length === 0 
                    ? `No chat messages found in mural ${muralId}` 
                    : `Found ${chat.length} chat message${chat.length === 1 ? '' : 's'} in mural`
                }, null, 2)
              }
            ],
          };
        }

        case 'get-mural-tags': {
          const schema = z.object({
            muralId: z.string().min(1)
          });
          
          const { muralId } = schema.parse(args);
          const tags = await muralClient.getMuralTags(muralId);
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  tags,
                  count: tags.length,
                  muralId,
                  message: tags.length === 0 
                    ? `No tags found in mural ${muralId}` 
                    : `Found ${tags.length} tag${tags.length === 1 ? '' : 's'} in mural`
                }, null, 2)
              }
            ],
          };
        }

        case 'delete-widget': {
          const schema = z.object({
            muralId: z.string().min(1),
            widgetId: z.string().min(1)
          });
          
          const { muralId, widgetId } = schema.parse(args);
          await muralClient.deleteWidget(muralId, widgetId);
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  muralId,
                  widgetId,
                  message: `Widget ${widgetId} deleted successfully from mural ${muralId}`
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
          
          // Add required shape field to each sticky note
          const stickyNotesWithShape = stickyNotes.map(note => ({
            ...note,
            shape: 'rectangle' as const
          }));
          
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

        case 'create-text-boxes': {
          const schema = z.object({
            muralId: z.string().min(1),
            textBoxes: z.array(z.object({
              x: z.number(),
              y: z.number(),
              text: z.string().min(1),
              width: z.number().optional(),
              height: z.number().optional(),
              style: z.object({
                backgroundColor: z.string().optional(),
                textColor: z.string().optional(),
                fontSize: z.number().optional(),
                alignment: z.enum(['left', 'center', 'right']).optional()
              }).optional()
            })).min(1)
          });
          
          const { muralId, textBoxes } = schema.parse(args);
          const createdWidgets = await muralClient.createTextBoxes(muralId, textBoxes);
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  widgets: createdWidgets,
                  count: createdWidgets.length,
                  muralId,
                  message: `Successfully created ${createdWidgets.length} text box${createdWidgets.length === 1 ? '' : 'es'} in mural ${muralId}`
                }, null, 2)
              }
            ],
          };
        }

        case 'create-titles': {
          const schema = z.object({
            muralId: z.string().min(1),
            titles: z.array(z.object({
              x: z.number(),
              y: z.number(),
              text: z.string().min(1),
              style: z.object({
                fontSize: z.number().optional(),
                fontFamily: z.string().optional(),
                textColor: z.string().optional()
              }).optional()
            })).min(1)
          });
          
          const { muralId, titles } = schema.parse(args);
          const createdWidgets = await muralClient.createTitles(muralId, titles);
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  widgets: createdWidgets,
                  count: createdWidgets.length,
                  muralId,
                  message: `Successfully created ${createdWidgets.length} title${createdWidgets.length === 1 ? '' : 's'} in mural ${muralId}`
                }, null, 2)
              }
            ],
          };
        }

        case 'create-shapes': {
          const schema = z.object({
            muralId: z.string().min(1),
            shapes: z.array(z.object({
              x: z.number(),
              y: z.number(),
              width: z.number(),
              height: z.number(),
              shape: z.enum(['rectangle', 'circle', 'triangle', 'diamond']),
              style: z.object({
                backgroundColor: z.string().optional(),
                borderColor: z.string().optional(),
                borderWidth: z.number().optional()
              }).optional()
            })).min(1)
          });
          
          const { muralId, shapes } = schema.parse(args);
          const createdWidgets = await muralClient.createShapes(muralId, shapes);
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  widgets: createdWidgets,
                  count: createdWidgets.length,
                  muralId,
                  message: `Successfully created ${createdWidgets.length} shape${createdWidgets.length === 1 ? '' : 's'} in mural ${muralId}`
                }, null, 2)
              }
            ],
          };
        }

        case 'create-mural-tag': {
          const schema = z.object({
            muralId: z.string().min(1),
            name: z.string().min(1),
            color: z.string().optional()
          });
          
          const { muralId, name, color } = schema.parse(args);
          const createdTag = await muralClient.createMuralTag(muralId, { name, color });
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  tag: createdTag,
                  muralId,
                  message: `Successfully created tag "${name}" in mural ${muralId}`
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

        case 'update-text-box': {
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
                fontSize: z.number().optional(),
                alignment: z.enum(['left', 'center', 'right']).optional()
              }).optional()
            })
          });
          
          const { muralId, widgetId, updates } = schema.parse(args);
          const updatedWidget = await muralClient.updateTextBox(muralId, widgetId, updates);
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  widget: updatedWidget,
                  muralId,
                  widgetId,
                  message: `Successfully updated text box ${widgetId} in mural ${muralId}`
                }, null, 2)
              }
            ],
          };
        }

        case 'update-title': {
          const schema = z.object({
            muralId: z.string().min(1),
            widgetId: z.string().min(1),
            updates: z.object({
              x: z.number().optional(),
              y: z.number().optional(),
              text: z.string().min(1).optional(),
              style: z.object({
                fontSize: z.number().optional(),
                fontFamily: z.string().optional(),
                textColor: z.string().optional()
              }).optional()
            })
          });
          
          const { muralId, widgetId, updates } = schema.parse(args);
          const updatedWidget = await muralClient.updateTitle(muralId, widgetId, updates);
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  widget: updatedWidget,
                  muralId,
                  widgetId,
                  message: `Successfully updated title ${widgetId} in mural ${muralId}`
                }, null, 2)
              }
            ],
          };
        }

        case 'update-shape': {
          const schema = z.object({
            muralId: z.string().min(1),
            widgetId: z.string().min(1),
            updates: z.object({
              x: z.number().optional(),
              y: z.number().optional(),
              width: z.number().optional(),
              height: z.number().optional(),
              shape: z.enum(['rectangle', 'circle', 'triangle', 'diamond']).optional(),
              style: z.object({
                backgroundColor: z.string().optional(),
                borderColor: z.string().optional(),
                borderWidth: z.number().optional()
              }).optional()
            })
          });
          
          const { muralId, widgetId, updates } = schema.parse(args);
          const updatedWidget = await muralClient.updateShape(muralId, widgetId, updates);
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  widget: updatedWidget,
                  muralId,
                  widgetId,
                  message: `Successfully updated shape ${widgetId} in mural ${muralId}`
                }, null, 2)
              }
            ],
          };
        }

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

        case 'update-timer': {
          const schema = z.object({
            muralId: z.string().min(1),
            action: z.enum(['pause', 'resume'])
          });
          
          const { muralId, action } = schema.parse(args);
          const updatedTimer = await muralClient.updateTimer(muralId, { action });
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  timer: updatedTimer,
                  muralId,
                  action,
                  message: `Successfully ${action}d timer in mural ${muralId}`
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

        case 'update-mural-member-permissions': {
          const schema = z.object({
            muralId: z.string().min(1),
            members: z.array(z.object({
              userId: z.string().min(1),
              permissions: z.array(z.enum(['read', 'write', 'comment'])).min(1)
            })).min(1)
          });
          
          const { muralId, members } = schema.parse(args);
          await muralClient.updateMuralMemberPermissions(muralId, { members });
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  muralId,
                  membersUpdated: members.length,
                  message: `Successfully updated permissions for ${members.length} member${members.length === 1 ? '' : 's'} in mural ${muralId}`
                }, null, 2)
              }
            ],
          };
        }

        case 'update-room': {
          const schema = z.object({
            roomId: z.string().min(1),
            updates: z.object({
              name: z.string().optional(),
              description: z.string().optional()
            }).refine(obj => Object.keys(obj).length > 0, {
              message: "At least one update field must be provided"
            })
          });
          
          const { roomId, updates } = schema.parse(args);
          await muralClient.updateRoom(roomId, updates);
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  roomId,
                  updates,
                  message: `Successfully updated room ${roomId}`
                }, null, 2)
              }
            ],
          };
        }

        case 'update-mural': {
          const schema = z.object({
            muralId: z.string().min(1),
            updates: z.object({
              title: z.string().optional(),
              description: z.string().optional()
            }).refine(obj => Object.keys(obj).length > 0, {
              message: "At least one update field must be provided"
            })
          });
          
          const { muralId, updates } = schema.parse(args);
          const updatedMural = await muralClient.updateMural(muralId, updates);
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  mural: updatedMural,
                  muralId,
                  updates,
                  message: `Successfully updated mural ${muralId}`
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