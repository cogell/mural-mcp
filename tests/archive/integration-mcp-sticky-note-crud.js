#!/usr/bin/env node

import { spawn } from 'child_process';
import { MuralClient } from '../build/mural-client.js';
import 'dotenv/config';

/**
 * Integration test for sticky note CRUD operations via MCP tools
 * Tests the complete flow through MCP server JSON-RPC interface
 * 
 * Assumes:
 * - Workspace named "root" exists
 * - Board named "mural-mcp-test-board" exists in the root workspace
 * - User has murals:read and murals:write scopes
 */
async function integrationTestMCPStickyNoteCRUD() {
  console.log('🛠️  Integration Test: MCP Tools Sticky Note CRUD Operations');
  console.log('=' .repeat(65));
  console.log(`📅 Started at: ${new Date().toISOString()}`);
  console.log('');
  
  const testMetadata = {
    startTime: Date.now(),
    workspace: null,
    board: null,
    createdWidget: null,
    testResults: {
      setup: false,
      mcpCreate: false,
      mcpRead: false,
      mcpUpdate: false,
      mcpDelete: false,
      cleanup: false
    },
    timings: {},
    requestId: 1
  };
  
  try {
    // Setup phase using direct client (to find workspace/board)
    console.log('🔧 Setup Phase: Locating test environment...');
    const setupStart = Date.now();
    
    const clientId = process.env.MURAL_CLIENT_ID;
    const clientSecret = process.env.MURAL_CLIENT_SECRET;
    
    if (!clientId) {
      throw new Error('MURAL_CLIENT_ID environment variable is required');
    }
    
    const client = new MuralClient(clientId, clientSecret);
    
    // Find workspace and board
    console.log('   🏢 Finding "root" workspace...');
    const workspaces = await client.getWorkspaces();
    const rootWorkspace = workspaces.find(ws => 
      ws.name.toLowerCase().includes('root')
    );
    
    if (!rootWorkspace) {
      throw new Error('Could not find "root" workspace');
    }
    
    testMetadata.workspace = rootWorkspace;
    console.log(`   ✅ Found root workspace: "${rootWorkspace.name}" (${rootWorkspace.id})`);
    
    console.log('   🎨 Finding test board...');
    const boards = await client.getWorkspaceMurals(rootWorkspace.id);
    const testBoard = boards.find(board => 
      board.title.toLowerCase().includes('mural-mcp-test-board') ||
      board.title.toLowerCase().includes('test')
    );
    
    if (!testBoard) {
      throw new Error('Could not find test board');
    }
    
    testMetadata.board = testBoard;
    console.log(`   ✅ Found test board: "${testBoard.title}" (${testBoard.id})`);
    
    testMetadata.timings.setup = Date.now() - setupStart;
    testMetadata.testResults.setup = true;
    console.log(`   ⏱️  Setup completed in ${testMetadata.timings.setup}ms`);
    
    // TEST 1: CREATE STICKY NOTE via MCP
    console.log('\n📝 TEST 1: Create Sticky Note via MCP Tool...');
    const createStart = Date.now();
    
    const testTimestamp = new Date().toISOString();
    const createRequest = {
      jsonrpc: '2.0',
      id: testMetadata.requestId++,
      method: 'tools/call',
      params: {
        name: 'create-sticky-notes',
        arguments: {
          muralId: testBoard.id,
          stickyNotes: [{
            x: 150,
            y: 150,
            text: `MCP Integration Test - ${testTimestamp}`,
            width: 220,
            height: 160,
            style: {
              backgroundColor: '#66FFE0',
              textColor: '#000000',
              fontSize: 15
            }
          }]
        }
      }
    };
    
    console.log('   📤 Calling create-sticky-notes MCP tool...');
    const createResponse = await callMCPTool(createRequest);
    
    if (createResponse.error) {
      throw new Error(`MCP create failed: ${createResponse.error.message}`);
    }
    
    // Parse the response to get widget info
    const createContent = createResponse.result.content[0];
    const createData = JSON.parse(createContent.text);
    
    if (!createData.widgets || createData.widgets.length === 0) {
      throw new Error('No widgets returned from MCP create operation');
    }
    
    testMetadata.createdWidget = createData.widgets[0];
    console.log('   ✅ MCP create successful!');
    console.log(`      Widget ID: ${testMetadata.createdWidget.id}`);
    console.log(`      Message: ${createData.message}`);
    
    testMetadata.timings.mcpCreate = Date.now() - createStart;
    testMetadata.testResults.mcpCreate = true;
    console.log(`   ⏱️  MCP create completed in ${testMetadata.timings.mcpCreate}ms`);
    
    // TEST 2: READ STICKY NOTE via MCP
    console.log('\n📖 TEST 2: Read Sticky Note via MCP Tool...');
    const readStart = Date.now();
    
    const readRequest = {
      jsonrpc: '2.0',
      id: testMetadata.requestId++,
      method: 'tools/call',
      params: {
        name: 'get-mural-widget',
        arguments: {
          muralId: testBoard.id,
          widgetId: testMetadata.createdWidget.id
        }
      }
    };
    
    console.log(`   📥 Calling get-mural-widget MCP tool for ${testMetadata.createdWidget.id}...`);
    const readResponse = await callMCPTool(readRequest);
    
    if (readResponse.error) {
      throw new Error(`MCP read failed: ${readResponse.error.message}`);
    }
    
    const readContent = readResponse.result.content[0];
    const readData = JSON.parse(readContent.text);
    
    console.log('   ✅ MCP read successful!');
    console.log(`      Widget Type: ${readData.widget.type || 'N/A'}`);
    console.log(`      Widget Text: "${readData.widget.text || 'N/A'}"`);
    console.log(`      Position: (${readData.widget.x || 'N/A'}, ${readData.widget.y || 'N/A'})`);
    
    testMetadata.timings.mcpRead = Date.now() - readStart;
    testMetadata.testResults.mcpRead = true;
    console.log(`   ⏱️  MCP read completed in ${testMetadata.timings.mcpRead}ms`);
    
    // TEST 3: UPDATE STICKY NOTE via MCP
    console.log('\n✏️  TEST 3: Update Sticky Note via MCP Tool...');
    const updateStart = Date.now();
    
    const updatedText = `UPDATED via MCP - ${new Date().toISOString()}`;
    const updateRequest = {
      jsonrpc: '2.0',
      id: testMetadata.requestId++,
      method: 'tools/call',
      params: {
        name: 'update-sticky-note',
        arguments: {
          muralId: testBoard.id,
          widgetId: testMetadata.createdWidget.id,
          updates: {
            text: updatedText,
            style: {
              backgroundColor: '#FF9999',
              fontSize: 16
            }
          }
        }
      }
    };
    
    console.log(`   🔄 Calling update-sticky-note MCP tool...`);
    console.log(`      New text: "${updatedText}"`);
    
    const updateResponse = await callMCPTool(updateRequest);
    
    if (updateResponse.error) {
      throw new Error(`MCP update failed: ${updateResponse.error.message}`);
    }
    
    const updateContent = updateResponse.result.content[0];
    const updateData = JSON.parse(updateContent.text);
    
    console.log('   ✅ MCP update successful!');
    console.log(`      Message: ${updateData.message}`);
    console.log(`      Updated text: "${updateData.widget?.text || 'N/A'}"`);
    
    // Verify the update by reading again
    console.log('   🔍 Verifying update with another read...');
    const verifyRequest = {
      jsonrpc: '2.0',
      id: testMetadata.requestId++,
      method: 'tools/call',
      params: {
        name: 'get-mural-widget',
        arguments: {
          muralId: testBoard.id,
          widgetId: testMetadata.createdWidget.id
        }
      }
    };
    
    const verifyResponse = await callMCPTool(verifyRequest);
    if (!verifyResponse.error) {
      const verifyContent = verifyResponse.result.content[0];
      const verifyData = JSON.parse(verifyContent.text);
      const textMatches = verifyData.widget.text === updatedText;
      console.log(`      Update verified: ${textMatches ? '✅' : '❌'}`);
    }
    
    testMetadata.timings.mcpUpdate = Date.now() - updateStart;
    testMetadata.testResults.mcpUpdate = true;
    console.log(`   ⏱️  MCP update completed in ${testMetadata.timings.mcpUpdate}ms`);
    
    // TEST 4: DELETE STICKY NOTE via MCP
    console.log('\n🗑️  TEST 4: Delete Sticky Note via MCP Tool...');
    const deleteStart = Date.now();
    
    const deleteRequest = {
      jsonrpc: '2.0',
      id: testMetadata.requestId++,
      method: 'tools/call',
      params: {
        name: 'delete-widget',
        arguments: {
          muralId: testBoard.id,
          widgetId: testMetadata.createdWidget.id
        }
      }
    };
    
    console.log(`   🗑️  Calling delete-widget MCP tool...`);
    const deleteResponse = await callMCPTool(deleteRequest);
    
    if (deleteResponse.error) {
      throw new Error(`MCP delete failed: ${deleteResponse.error.message}`);
    }
    
    const deleteContent = deleteResponse.result.content[0];
    const deleteData = JSON.parse(deleteContent.text);
    
    console.log('   ✅ MCP delete successful!');
    console.log(`      Message: ${deleteData.message}`);
    
    // Verify deletion by attempting to read (should fail)
    console.log('   🔍 Verifying deletion...');
    const verifyDeleteRequest = {
      jsonrpc: '2.0',
      id: testMetadata.requestId++,
      method: 'tools/call',
      params: {
        name: 'get-mural-widget',
        arguments: {
          muralId: testBoard.id,
          widgetId: testMetadata.createdWidget.id
        }
      }
    };
    
    const verifyDeleteResponse = await callMCPTool(verifyDeleteRequest);
    if (verifyDeleteResponse.error) {
      console.log('   ✅ Deletion verified (read attempt failed as expected)');
      testMetadata.testResults.mcpDelete = true;
    } else {
      console.log('   ❌ Widget still exists after deletion!');
      testMetadata.testResults.mcpDelete = false;
    }
    
    testMetadata.timings.mcpDelete = Date.now() - deleteStart;
    console.log(`   ⏱️  MCP delete completed in ${testMetadata.timings.mcpDelete}ms`);
    
    // Mark as cleaned up since we successfully deleted via MCP
    testMetadata.createdWidget = null;
    testMetadata.testResults.cleanup = true;
    
  } catch (error) {
    console.error(`\n❌ MCP integration test failed: ${error.message}`);
    
    // Attempt cleanup if we have a created widget
    if (testMetadata.createdWidget && testMetadata.board) {
      console.log('\n🧹 Attempting emergency cleanup...');
      try {
        const client = new MuralClient(process.env.MURAL_CLIENT_ID, process.env.MURAL_CLIENT_SECRET);
        await client.deleteWidget(testMetadata.board.id, testMetadata.createdWidget.id);
        console.log('   ✅ Emergency cleanup successful');
        testMetadata.testResults.cleanup = true;
      } catch (cleanupError) {
        console.log(`   ❌ Emergency cleanup failed: ${cleanupError.message}`);
        console.log(`   ⚠️  Please manually delete widget ${testMetadata.createdWidget.id} from board ${testMetadata.board.id}`);
      }
    }
  }
  
  // FINAL RESULTS
  const totalTime = Date.now() - testMetadata.startTime;
  
  console.log('\n' + '='.repeat(65));
  console.log('📊 MCP INTEGRATION TEST RESULTS');
  console.log('='.repeat(65));
  
  console.log('\n🏢 Test Environment:');
  if (testMetadata.workspace) {
    console.log(`   Workspace: ${testMetadata.workspace.name} (${testMetadata.workspace.id})`);
  }
  if (testMetadata.board) {
    console.log(`   Board: ${testMetadata.board.title} (${testMetadata.board.id})`);
  }
  
  console.log('\n📋 MCP Tool Test Results:');
  const results = testMetadata.testResults;
  console.log(`   📋 Setup:              ${results.setup ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   📝 MCP Create Sticky:  ${results.mcpCreate ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   📖 MCP Read Sticky:    ${results.mcpRead ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   ✏️  MCP Update Sticky:  ${results.mcpUpdate ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   🗑️  MCP Delete Sticky:  ${results.mcpDelete ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   🧹 Cleanup:            ${results.cleanup ? '✅ PASS' : '❌ FAIL'}`);
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  const successRate = (passedTests / totalTests * 100).toFixed(1);
  
  console.log(`\n📈 Summary: ${passedTests}/${totalTests} tests passed (${successRate}%)`);
  
  console.log('\n⏱️  Performance:');
  if (testMetadata.timings.setup) console.log(`   Setup:      ${testMetadata.timings.setup}ms`);
  if (testMetadata.timings.mcpCreate) console.log(`   MCP Create: ${testMetadata.timings.mcpCreate}ms`);
  if (testMetadata.timings.mcpRead) console.log(`   MCP Read:   ${testMetadata.timings.mcpRead}ms`);
  if (testMetadata.timings.mcpUpdate) console.log(`   MCP Update: ${testMetadata.timings.mcpUpdate}ms`);
  if (testMetadata.timings.mcpDelete) console.log(`   MCP Delete: ${testMetadata.timings.mcpDelete}ms`);
  console.log(`   Total:      ${totalTime}ms`);
  
  console.log('\n💡 Tools Tested:');
  console.log('   • create-sticky-notes');
  console.log('   • get-mural-widget');  
  console.log('   • update-sticky-note');
  console.log('   • delete-widget');
  
  if (passedTests === totalTests) {
    console.log('\n🎉 ALL MCP TOOL TESTS PASSED! MCP server is working correctly.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some MCP tool tests failed. Please review the output above.');
    process.exit(1);
  }
}

/**
 * Helper function to call MCP tools by spawning the server process
 */
function callMCPTool(request, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const serverProcess = spawn('node', ['build/index.js'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: process.env
    });
    
    let output = '';
    let errorOutput = '';
    
    serverProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    serverProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    serverProcess.on('close', (code) => {
      try {
        // Parse the JSON-RPC response from stdout
        const lines = output.trim().split('\n');
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.jsonrpc && parsed.id === request.id) {
              resolve(parsed);
              return;
            }
          } catch (e) {
            // Not JSON, skip
          }
        }
        
        // If we get here, we didn't find a valid response
        reject(new Error(`No valid JSON-RPC response found. Request ID: ${request.id}, Output: ${output.substring(0, 500)}, Error: ${errorOutput.substring(0, 500)}`));
      } catch (error) {
        reject(error);
      }
    });
    
    serverProcess.on('error', (error) => {
      reject(error);
    });
    
    // Send the request
    serverProcess.stdin.write(JSON.stringify(request) + '\n');
    serverProcess.stdin.end();
    
    // Set a timeout
    setTimeout(() => {
      serverProcess.kill();
      reject(new Error(`MCP tool call timeout after ${timeout}ms`));
    }, timeout);
  });
}

integrationTestMCPStickyNoteCRUD();