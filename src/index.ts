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