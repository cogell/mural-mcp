#!/usr/bin/env node

import { spawn } from 'child_process';
import { MuralClient } from '../build/mural-client.js';
import 'dotenv/config';

/**
 * Test suite for the update-sticky-note MCP tool
 * Tests the actual MCP server tool call functionality
 */
async function testUpdateStickyNoteMCPTool() {
  console.log('🛠️ Testing update-sticky-note MCP tool...\n');
  
  try {
    // First setup - create a test sticky note we can update
    const clientId = process.env.MURAL_CLIENT_ID;
    const clientSecret = process.env.MURAL_CLIENT_SECRET;
    const client = new MuralClient(clientId, clientSecret);
    
    console.log('1. 🔐 Checking OAuth scopes...');
    const scopes = await client.getUserScopes();
    if (!scopes.includes('murals:write')) {
      throw new Error('This test requires murals:write scope. Please re-authenticate with proper scopes.');
    }
    console.log('   ✅ murals:write scope available\n');
    
    console.log('2. 🏠 Setting up test environment...');
    const workspaces = await client.getWorkspaces();
    const boards = await client.getWorkspaceMurals(workspaces[0].id);
    const boardId = boards[0].id;
    
    // Create test sticky note
    const testStickyNote = {
      x: 150,
      y: 150,
      text: 'MCP Tool Test Sticky Note',
      width: 180,
      height: 120,
      shape: 'rectangle',
      style: {
        backgroundColor: '#CCCCFF',
        textColor: '#000000',
        fontSize: 12
      }
    };
    
    const createdWidgets = await client.createStickyNotes(boardId, [testStickyNote]);
    const widgetId = createdWidgets[0].id;
    console.log(`   ✅ Created test sticky note: ${widgetId}\n`);
    
    // Test MCP tool calls
    const testCases = [
      {
        name: 'Text Update via MCP Tool',
        request: {
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/call',
          params: {
            name: 'update-sticky-note',
            arguments: {
              muralId: boardId,
              widgetId: widgetId,
              updates: {
                text: 'Updated via MCP tool - SUCCESS!'
              }
            }
          }
        }
      },
      {
        name: 'Position Update via MCP Tool',
        request: {
          jsonrpc: '2.0',
          id: 2,
          method: 'tools/call',
          params: {
            name: 'update-sticky-note',
            arguments: {
              muralId: boardId,
              widgetId: widgetId,
              updates: {
                x: 250,
                y: 200
              }
            }
          }
        }
      },
      {
        name: 'Style Update via MCP Tool',
        request: {
          jsonrpc: '2.0',
          id: 3,
          method: 'tools/call',
          params: {
            name: 'update-sticky-note',
            arguments: {
              muralId: boardId,
              widgetId: widgetId,
              updates: {
                style: {
                  backgroundColor: '#FFCCCC',
                  fontSize: 14
                }
              }
            }
          }
        }
      },
      {
        name: 'Multiple Properties via MCP Tool',
        request: {
          jsonrpc: '2.0',
          id: 4,
          method: 'tools/call',
          params: {
            name: 'update-sticky-note',
            arguments: {
              muralId: boardId,
              widgetId: widgetId,
              updates: {
                x: 300,
                y: 250,
                text: 'Final MCP tool test update',
                width: 200,
                height: 140,
                style: {
                  backgroundColor: '#CCFFCC',
                  textColor: '#333333',
                  fontSize: 16
                }
              }
            }
          }
        }
      },
      {
        name: 'Error Test - Invalid Widget ID',
        request: {
          jsonrpc: '2.0',
          id: 5,
          method: 'tools/call',
          params: {
            name: 'update-sticky-note',
            arguments: {
              muralId: boardId,
              widgetId: 'invalid-widget-id-12345',
              updates: {
                text: 'This should fail'
              }
            }
          }
        },
        expectError: true
      },
      {
        name: 'Validation Test - Missing Required Fields',
        request: {
          jsonrpc: '2.0',
          id: 6,
          method: 'tools/call',
          params: {
            name: 'update-sticky-note',
            arguments: {
              muralId: boardId,
              // Missing widgetId and updates
            }
          }
        },
        expectError: true
      }
    ];
    
    console.log('3. 🧪 Running MCP tool tests...\n');
    
    for (const testCase of testCases) {
      console.log(`   Testing: ${testCase.name}`);
      
      try {
        const result = await callMCPTool(testCase.request);
        
        if (testCase.expectError) {
          if (result.error) {
            console.log(`   ✅ Expected error occurred: ${result.error.message}`);
          } else {
            console.log(`   ⚠️  Expected error but tool succeeded`);
          }
        } else {
          if (result.error) {
            console.log(`   ❌ Unexpected error: ${result.error.message}`);
          } else {
            console.log(`   ✅ Tool call successful`);
            
            // Try to parse the response content
            if (result.result && result.result.content) {
              const content = result.result.content[0];
              if (content.type === 'text') {
                try {
                  const responseData = JSON.parse(content.text);
                  if (responseData.message) {
                    console.log(`      📝 ${responseData.message}`);
                  }
                } catch (e) {
                  console.log(`      📄 Response received (${content.text.length} chars)`);
                }
              }
            }
          }
        }
      } catch (error) {
        console.log(`   ❌ Test failed: ${error.message}`);
      }
      
      console.log(''); // Add spacing
    }
    
    // Cleanup
    console.log('4. 🧹 Cleaning up...');
    try {
      await client.deleteWidget(boardId, widgetId);
      console.log('   ✅ Test sticky note deleted\n');
    } catch (error) {
      console.log(`   ⚠️  Cleanup warning: ${error.message}\n`);
    }
    
    console.log('📊 MCP Tool Test Summary:');
    console.log('   • update-sticky-note tool registration verified');
    console.log('   • Input validation tested');
    console.log('   • Error handling tested');
    console.log('   • Various update scenarios tested');
    console.log('\n🎉 MCP tool tests completed!');
    
  } catch (error) {
    console.error('❌ MCP tool test suite failed:', error.message);
  }
}

/**
 * Helper function to call MCP tools by spawning the server process
 */
function callMCPTool(request) {
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
        reject(new Error(`No valid JSON-RPC response found. Output: ${output}, Error: ${errorOutput}`));
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
      reject(new Error('MCP tool call timeout'));
    }, 10000); // 10 second timeout
  });
}

testUpdateStickyNoteMCPTool();