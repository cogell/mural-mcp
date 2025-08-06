#!/usr/bin/env node

import { MuralClient } from '../../build/mural-client.js';
import { MCPTestClient } from './mcp-client.js';

/**
 * Test Setup Utilities
 * 
 * Provides common setup patterns extracted from existing integration tests.
 * Handles environment validation, workspace/board discovery, and cleanup.
 */

/**
 * Validate environment variables and create clients
 */
export async function validateEnvironment() {
  const clientId = process.env.MURAL_CLIENT_ID;
  const clientSecret = process.env.MURAL_CLIENT_SECRET;

  if (!clientId) {
    throw new Error(
      'MURAL_CLIENT_ID environment variable is required.\n' +
      'Please:\n' +
      '1. Copy .env.template to .env\n' +
      '2. Fill in your Mural OAuth credentials\n' +
      '3. Get credentials from https://developers.mural.co/\n' +
      'Or set environment variables: export MURAL_CLIENT_ID=your-id'
    );
  }

  return {
    clientId,
    clientSecret,
    redirectUri: process.env.MURAL_REDIRECT_URI
  };
}

/**
 * Check OAuth scopes and validate permissions
 */
export async function validateScopes(client, requiredScopes = []) {
  const scopes = await client.getUserScopes();
  
  console.log(`   Available scopes: ${scopes.length} (${scopes.join(', ')})`);
  
  const missingScopes = requiredScopes.filter(scope => !scopes.includes(scope));
  
  if (missingScopes.length > 0) {
    throw new Error(
      `Missing required OAuth scopes: ${missingScopes.join(', ')}. ` +
      'Please re-authenticate with proper scopes.'
    );
  }

  return scopes;
}

/**
 * Find suitable workspace for testing
 * Prefers workspaces named with "root", "test", or "dev"
 */
export async function findTestWorkspace(client) {
  const workspaces = await client.getWorkspaces();
  
  if (workspaces.length === 0) {
    throw new Error(
      'No workspaces available. Please ensure you have access to at least one workspace.'
    );
  }

  // Try to find preferred workspace
  let selectedWorkspace = workspaces.find(ws => 
    ws.name.toLowerCase().includes('root') ||
    ws.name.toLowerCase().includes('test') ||  
    ws.name.toLowerCase().includes('dev')
  );

  // Fallback to first available workspace
  if (!selectedWorkspace) {
    selectedWorkspace = workspaces[0];
    console.log(`   ⚠️  No preferred workspace found, using: "${selectedWorkspace.name}"`);
  } else {
    console.log(`   ✅ Using preferred workspace: "${selectedWorkspace.name}"`);
  }

  return selectedWorkspace;
}

/**
 * Find suitable board for testing within a workspace
 * Prefers boards named with "test", "mcp", or "integration"  
 */
export async function findTestBoard(client, workspaceId) {
  const boards = await client.getWorkspaceMurals(workspaceId);
  
  if (boards.length === 0) {
    throw new Error(
      `No boards available in workspace. Please create at least one board.`
    );
  }

  // Try to find preferred test board
  let selectedBoard = boards.find(board => 
    board.title.toLowerCase().includes('test') ||
    board.title.toLowerCase().includes('mcp') ||
    board.title.toLowerCase().includes('integration')
  );

  // Fallback to first available board
  if (!selectedBoard) {
    selectedBoard = boards[0];
    console.log(`   ⚠️  No test board found, using: "${selectedBoard.title}"`);
    console.log('   💡 Tip: Create a board named "mural-mcp-test-board" for dedicated testing');
  } else {
    console.log(`   ✅ Using test board: "${selectedBoard.title}"`);
  }

  return selectedBoard;
}

/**
 * Get a complete test environment ready for testing
 * Returns both direct client and MCP client along with workspace/board
 */
export async function getTestEnvironment(requiredScopes = ['murals:read']) {
  console.log('🔧 Setting up test environment...');
  
  // Validate environment
  const { clientId, clientSecret, redirectUri } = await validateEnvironment();
  console.log('   ✅ Environment variables validated');

  // Create clients
  const directClient = new MuralClient(clientId, clientSecret, redirectUri);
  const mcpClient = new MCPTestClient();
  
  console.log('   ✅ Clients initialized');

  // Validate scopes
  await validateScopes(directClient, requiredScopes);
  console.log('   ✅ OAuth scopes validated');

  // Find workspace and board
  const workspace = await findTestWorkspace(directClient);
  const board = await findTestBoard(directClient, workspace.id);
  
  console.log('   ✅ Test environment ready');
  console.log(`   📍 Using: "${workspace.name}" → "${board.title}"`);
  console.log('');

  return {
    directClient,
    mcpClient, 
    workspace,
    board,
    environment: {
      clientId,
      clientSecret,
      redirectUri
    }
  };
}

/**
 * Create minimal test environment for tools that don't need boards
 */
export async function getBasicTestEnvironment(requiredScopes = []) {
  console.log('🔧 Setting up basic test environment...');
  
  const { clientId, clientSecret, redirectUri } = await validateEnvironment();
  const directClient = new MuralClient(clientId, clientSecret, redirectUri);
  const mcpClient = new MCPTestClient();
  
  if (requiredScopes.length > 0) {
    await validateScopes(directClient, requiredScopes);
    console.log('   ✅ OAuth scopes validated');
  }
  
  console.log('   ✅ Basic environment ready');
  console.log('');

  return {
    directClient,
    mcpClient,
    environment: {
      clientId, 
      clientSecret,
      redirectUri
    }
  };
}

/**
 * Test that a basic connection works
 */
export async function testConnection(client) {
  const connected = await client.testConnection();
  
  if (!connected) {
    throw new Error(
      'Cannot connect to Mural API. Please check your credentials and authentication.'
    );
  }
  
  return connected;
}