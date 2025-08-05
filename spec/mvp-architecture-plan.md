# Mural MCP Server - MVP Architecture Plan

## Overview

This document outlines the Minimum Viable Product (MVP) architecture for a Model Context Protocol (MCP) server that integrates with the Mural visual collaboration platform. The primary goal is to authenticate with Mural's API and provide workspace listing functionality through the MCP protocol.

## Research Findings

### Model Context Protocol (MCP)
- **Purpose**: Open protocol that standardizes how applications provide context to LLMs
- **Implementation**: Uses `@modelcontextprotocol/sdk` package for JavaScript/TypeScript
- **Capabilities**: Supports tools, resources, prompts, and logging
- **Communication**: JSON-RPC based over various transports (stdio, HTTP, SSE)
- **Architecture**: Server implements request handlers for different capabilities

### Mural API
- **Authentication**: OAuth 2.0 with Authorization Code Grant and PKCE support
- **Token Lifecycle**: 15-minute access token expiry with refresh token capability
- **Key Endpoints**:
  - Authorization: `https://app.mural.co/api/public/v1/authorization/oauth2/`
  - Token Exchange: `https://app.mural.co/api/public/v1/authorization/oauth2/token`
  - Workspaces: `https://developers.mural.co/public/reference/getworkspaces`
- **Scopes**: `workspaces:read` required for workspace listing
- **Status**: Currently in beta

## MVP Goals

1. **Primary Objective**: Authenticate with Mural API using OAuth 2.0 flow
2. **Core Functionality**: List user's workspaces through MCP tool interface
3. **Integration**: Seamless MCP server that can be used by Claude Code and other MCP clients
4. **Security**: Implement PKCE for OAuth security best practices

## Architecture Design

### System Components

#### 1. MCP Server (`src/index.ts`)
- **Transport**: Standard I/O (stdio) for local development and CLI usage
- **Capabilities**: Tools capability for workspace operations
- **Request Handling**: Implements `ListToolsRequestSchema` and `CallToolRequestSchema`
- **Error Handling**: Graceful handling of authentication and API errors

#### 2. OAuth Handler (`src/oauth.ts`)
- **Flow**: Authorization Code Grant with PKCE implementation
- **Local Server**: Temporary HTTP server for OAuth callback handling
- **Token Management**: Storage and automatic refresh of access tokens
- **Security**: Secure random PKCE code generation and validation

#### 3. Mural API Client (`src/mural-client.ts`)
- **HTTP Client**: Configured for Mural API base URL and headers
- **Authentication**: Automatic token attachment and refresh handling
- **Rate Limiting**: Respect Mural API rate limits
- **Error Handling**: Comprehensive API error response handling

#### 4. Type Definitions (`src/types.ts`)
- **Mural Types**: Workspace, authentication response interfaces
- **MCP Types**: Tool definitions and response structures
- **OAuth Types**: Token, authorization request/response types

### File Structure
```
mural-mcp/
├── package.json              # Dependencies and build scripts
├── tsconfig.json            # TypeScript configuration
├── README.md                # Setup and usage instructions
├── spec/
│   └── mvp-architecture-plan.md  # This document
├── src/
│   ├── index.ts             # Main MCP server entry point
│   ├── oauth.ts             # OAuth 2.0 flow implementation
│   ├── mural-client.ts      # Mural API client wrapper
│   └── types.ts             # TypeScript type definitions
├── build/                   # Compiled JavaScript output
└── .env.example            # Environment variables template
```

### Core Tool Implementation

#### `list-workspaces` Tool
- **Description**: "List all workspaces the authenticated user has access to"
- **Input Schema**: No parameters required (uses stored credentials)
- **Output**: Array of workspace objects with:
  - Workspace ID
  - Name
  - URL
  - Creation date
  - Member count
  - Permission level
- **Error Handling**: Authentication errors, expired tokens, API failures

## Technical Implementation Details

### Dependencies
```json
{
  "@modelcontextprotocol/sdk": "^latest",
  "zod": "^3.x",
  "node-fetch": "^3.x",
  "express": "^4.x"
}
```

### OAuth Flow Sequence
1. **Initialization**: Generate PKCE code verifier and challenge
2. **Authorization**: Open browser to Mural authorization URL
3. **Callback**: Handle OAuth callback on local server
4. **Token Exchange**: Exchange authorization code for access token
5. **Storage**: Securely store tokens for future use
6. **Refresh**: Automatically refresh expired tokens

### Environment Configuration
```bash
MURAL_CLIENT_ID=your_client_id
MURAL_CLIENT_SECRET=your_client_secret
MURAL_REDIRECT_URI=http://localhost:3000/callback
```

### MCP Server Capabilities
```typescript
{
  name: "mural-mcp-server",
  version: "1.0.0",
  capabilities: {
    tools: {
      listChanged: true
    }
  }
}
```

## Security Considerations

1. **PKCE Implementation**: Prevents authorization code interception attacks
2. **Token Storage**: Secure local storage of sensitive tokens
3. **HTTPS Enforcement**: All Mural API calls over HTTPS
4. **Scope Limitation**: Request only necessary OAuth scopes
5. **Token Refresh**: Automatic handling of token expiration

## Development Phases

### Phase 1: Setup & Authentication
- [ ] Project scaffolding and dependencies
- [ ] OAuth 2.0 flow implementation
- [ ] Token storage and refresh mechanism
- [ ] Basic Mural API client

### Phase 2: MCP Integration
- [ ] MCP server setup with stdio transport
- [ ] Tool registration and request handling
- [ ] Error handling and logging
- [ ] Integration testing

### Phase 3: Workspace Operations
- [ ] Workspace listing implementation
- [ ] Data formatting and response structure
- [ ] Comprehensive error handling
- [ ] Documentation and examples

## Future Enhancements

Beyond the MVP, potential expansions include:
- Room and mural listing within workspaces
- Mural creation and modification tools
- Member management operations
- Template and asset management
- Real-time collaboration features

## Success Criteria

The MVP is considered successful when:
1. ✅ OAuth authentication completes successfully
2. ✅ Access tokens are properly stored and refreshed
3. ✅ MCP server responds to tool calls correctly
4. ✅ Workspace listing returns accurate data
5. ✅ Error handling provides meaningful feedback
6. ✅ Integration works with Claude Code or other MCP clients

---

*Last Updated: August 5, 2025*  
*Version: 1.0*