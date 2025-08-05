# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Package Manager
Use `pnpm` for all package management operations.

## Common Development Commands

### Building and Development
- `pnpm run build` - Compile TypeScript to JavaScript in `build/` directory
- `pnpm run dev` - Watch mode compilation with TypeScript
- `pnpm start` - Run the compiled MCP server
- `pnpm run prepublishOnly` - Pre-publish build step

### Testing and Debugging
- Test the MCP server manually: `node build/index.js`
- Use MCP inspector: `npx @modelcontextprotocol/inspector node build/index.js`
- Test OAuth flow: Set environment variables and run `pnpm start`

## Architecture Overview

This is a Model Context Protocol (MCP) server that provides integration with the Mural visual collaboration platform through OAuth 2.0 authentication.

### Core Components

1. **MCP Server** (`src/index.ts`) - Main entry point that:
   - Uses stdio transport for MCP communication
   - Implements 4 tools: `list-workspaces`, `get-workspace`, `test-connection`, `clear-auth`
   - Handles environment variable validation for `MURAL_CLIENT_ID`
   - Uses Zod for input validation

2. **OAuth Handler** (`src/oauth.ts`) - Manages authentication:
   - Implements OAuth 2.0 with PKCE (Proof Key for Code Exchange)
   - Stores tokens in `~/.mural-mcp-tokens.json`
   - Automatically refreshes expired tokens
   - Runs temporary HTTP server on port 3000 for OAuth callback

3. **Mural API Client** (`src/mural-client.ts`) - API interaction:
   - Makes authenticated requests to `https://app.mural.co/api/public/v1`
   - Handles token refresh automatically
   - Provides workspace listing and retrieval methods

4. **TypeScript Types** (`src/types.ts`) - Type definitions for:
   - Mural API responses (`MuralWorkspace`, `MuralWorkspacesResponse`)
   - OAuth flow data (`OAuthTokens`, `PKCEChallenge`, etc.)

### Environment Variables

Required:
- `MURAL_CLIENT_ID` - OAuth client ID from Mural Developer Portal

Optional:
- `MURAL_CLIENT_SECRET` - OAuth client secret (recommended)
- `MURAL_REDIRECT_URI` - Defaults to `http://localhost:3000/callback`

### Authentication Flow

1. First run triggers OAuth browser authentication
2. Tokens stored locally in user's home directory
3. Automatic token refresh when expired
4. Manual token clearing available via `clear-auth` tool

### MCP Tools Available

- `list-workspaces` - Returns array of user's workspaces with optional pagination
- `get-workspace` - Get detailed workspace info by ID
- `test-connection` - Verify API connectivity
- `clear-auth` - Clear stored authentication tokens

### Development Notes

- Uses ES modules (`"type": "module"` in package.json)
- TypeScript compilation target: ES2022 with Node16 module resolution
- Executable shebang in compiled output (`chmod +x build/index.js`)
- Graceful shutdown handlers for SIGINT/SIGTERM
- Error responses include structured JSON with error details