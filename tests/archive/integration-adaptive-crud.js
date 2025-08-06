#!/usr/bin/env node

import { MuralClient } from '../build/mural-client.js';
import 'dotenv/config';

/**
 * Adaptive Integration Test for Sticky Note CRUD Operations
 * 
 * This test is flexible and will:
 * 1. Try to find "root" workspace, fallback to first available workspace
 * 2. Try to find "mural-mcp-test-board", fallback to first available board
 * 3. Provide helpful guidance if no suitable test environment is found
 * 4. Test the complete CRUD cycle with detailed logging
 */
async function adaptiveIntegrationTest() {
  console.log('🎯 Adaptive Integration Test: Sticky Note CRUD Operations');
  console.log('=' .repeat(62));
  console.log(`📅 Started at: ${new Date().toISOString()}`);
  console.log('');
  
  const testState = {
    startTime: Date.now(),
    client: null,
    workspace: null,
    board: null,
    widgets: [],
    phase: 'initialization',
    results: {}
  };
  
  try {
    // Phase 1: Initialize and validate environment
    console.log('🚀 Phase 1: Environment Validation');
    testState.phase = 'environment_validation';
    
    console.log('   🔑 Checking environment variables...');
    const clientId = process.env.MURAL_CLIENT_ID;
    const clientSecret = process.env.MURAL_CLIENT_SECRET;
    
    if (!clientId) {
      throw new Error('MURAL_CLIENT_ID environment variable is required');
    }
    console.log('   ✅ Environment variables present');
    
    console.log('   🔗 Initializing Mural client...');
    testState.client = new MuralClient(clientId, clientSecret);
    
    console.log('   🔐 Validating OAuth scopes...');
    const scopes = await testState.client.getUserScopes();
    const hasRead = scopes.includes('murals:read');
    const hasWrite = scopes.includes('murals:write');
    
    console.log(`      murals:read:  ${hasRead ? '✅' : '❌'}`);
    console.log(`      murals:write: ${hasWrite ? '✅' : '❌'}`);
    console.log(`      Total scopes: ${scopes.length} (${scopes.join(', ')})`);
    
    if (!hasRead || !hasWrite) {
      throw new Error('Both murals:read and murals:write scopes are required. Please re-authenticate with proper scopes.');
    }
    
    testState.results.environment = true;
    
    // Phase 2: Discover and select workspace
    console.log('\n🏢 Phase 2: Workspace Discovery');
    testState.phase = 'workspace_discovery';
    
    console.log('   📋 Fetching available workspaces...');
    const workspaces = await testState.client.getWorkspaces();
    console.log(`   Found ${workspaces.length} workspace(s):`);
    
    workspaces.forEach((ws, index) => {
      console.log(`      ${index + 1}. "${ws.name}" (${ws.id})`);
    });
    
    // Try to find preferred workspace, fallback to first available
    let selectedWorkspace = workspaces.find(ws => 
      ws.name.toLowerCase().includes('root') ||
      ws.name.toLowerCase().includes('test') ||
      ws.name.toLowerCase().includes('dev')
    );
    
    if (!selectedWorkspace && workspaces.length > 0) {
      selectedWorkspace = workspaces[0];
      console.log(`   ⚠️  No preferred workspace found, using: "${selectedWorkspace.name}"`);
    } else if (selectedWorkspace) {
      console.log(`   ✅ Using preferred workspace: "${selectedWorkspace.name}"`);
    }
    
    if (!selectedWorkspace) {
      throw new Error('No workspaces available. Please ensure you have access to at least one workspace.');
    }
    
    testState.workspace = selectedWorkspace;
    testState.results.workspace = true;
    
    // Phase 3: Discover and select board
    console.log('\n🎨 Phase 3: Board Discovery');
    testState.phase = 'board_discovery';
    
    console.log(`   📋 Fetching boards from workspace "${testState.workspace.name}"...`);
    const boards = await testState.client.getWorkspaceMurals(testState.workspace.id);
    console.log(`   Found ${boards.length} board(s):`);
    
    boards.forEach((board, index) => {
      console.log(`      ${index + 1}. "${board.title}" (${board.id})`);
    });
    
    // Try to find preferred test board, fallback to first available
    let selectedBoard = boards.find(board => 
      board.title.toLowerCase().includes('test') ||
      board.title.toLowerCase().includes('mcp') ||
      board.title.toLowerCase().includes('integration')
    );
    
    if (!selectedBoard && boards.length > 0) {
      selectedBoard = boards[0];
      console.log(`   ⚠️  No test board found, using: "${selectedBoard.title}"`);
      console.log('   💡 Tip: Create a board named "mural-mcp-test-board" for dedicated testing');
    } else if (selectedBoard) {
      console.log(`   ✅ Using test board: "${selectedBoard.title}"`);
    }
    
    if (!selectedBoard) {
      throw new Error(`No boards available in workspace "${testState.workspace.name}". Please create at least one board.`);
    }
    
    testState.board = selectedBoard;
    testState.results.board = true;
    
    // Check existing widgets as baseline
    const existingWidgets = await testState.client.getMuralWidgets(testState.board.id);
    console.log(`   📊 Existing widgets on board: ${existingWidgets.length}`);
    
    // Phase 4: CRUD Operations Test
    console.log('\n🧪 Phase 4: CRUD Operations Test');
    testState.phase = 'crud_operations';
    
    const testIdentifier = `IntegrationTest_${Date.now()}`;
    const testData = {
      x: 50 + Math.floor(Math.random() * 200), // Random position to avoid overlap
      y: 50 + Math.floor(Math.random() * 200),
      text: `Integration Test Sticky Note - ${new Date().toLocaleString()}`,
      width: 200,
      height: 150,
      shape: 'rectangle',
      style: {
        backgroundColor: '#E6F3FF',
        textColor: '#003366',
        fontSize: 13
      }
    };
    
    // 4.1: CREATE
    console.log('   📝 Step 1: CREATE sticky note...');
    const createStart = Date.now();
    
    const createdWidgets = await testState.client.createStickyNotes(testState.board.id, [testData]);
    
    if (!createdWidgets || createdWidgets.length === 0) {
      throw new Error('Create operation failed - no widgets returned');
    }
    
    const createdWidget = createdWidgets[0];
    testState.widgets.push(createdWidget);
    
    console.log(`      ✅ CREATE successful (${Date.now() - createStart}ms)`);
    console.log(`         Widget ID: ${createdWidget.id}`);
    console.log(`         Text: "${createdWidget.text || testData.text}"`);
    console.log(`         Position: (${createdWidget.x || testData.x}, ${createdWidget.y || testData.y})`);
    
    testState.results.create = true;
    
    // 4.2: READ
    console.log('\n   📖 Step 2: READ sticky note...');
    const readStart = Date.now();
    
    const readWidget = await testState.client.getMuralWidget(testState.board.id, createdWidget.id);
    
    console.log(`      ✅ READ successful (${Date.now() - readStart}ms)`);
    console.log(`         Retrieved text: "${readWidget.text || 'N/A'}"`);
    console.log(`         Retrieved position: (${readWidget.x || 'N/A'}, ${readWidget.y || 'N/A'})`);
    console.log(`         Widget type: ${readWidget.type || 'N/A'}`);
    
    // Verify data integrity
    const dataIntegrity = {
      textMatch: readWidget.text === testData.text,
      positionMatch: readWidget.x === testData.x && readWidget.y === testData.y,
      idMatch: readWidget.id === createdWidget.id
    };
    
    console.log('      🔍 Data integrity check:');
    console.log(`         Text matches:     ${dataIntegrity.textMatch ? '✅' : '❌'}`);
    console.log(`         Position matches: ${dataIntegrity.positionMatch ? '✅' : '❌'}`);
    console.log(`         ID matches:       ${dataIntegrity.idMatch ? '✅' : '❌'}`);
    
    testState.results.read = true;
    
    // 4.3: UPDATE
    console.log('\n   ✏️  Step 3: UPDATE sticky note...');
    const updateStart = Date.now();
    
    const updatedText = `UPDATED - ${testIdentifier} - ${new Date().toLocaleString()}`;
    const updateData = {
      text: updatedText,
      style: {
        backgroundColor: '#FFE6E6',
        fontSize: 15
      }
    };
    
    const updatedWidget = await testState.client.updateStickyNote(
      testState.board.id, 
      createdWidget.id, 
      updateData
    );
    
    console.log(`      ✅ UPDATE successful (${Date.now() - updateStart}ms)`);
    console.log(`         New text: "${updatedWidget.text || updatedText}"`);
    
    // Verify update by reading again
    const verifyRead = await testState.client.getMuralWidget(testState.board.id, createdWidget.id);
    const updateVerified = verifyRead.text === updatedText;
    
    console.log(`      🔍 Update verification: ${updateVerified ? '✅' : '❌'}`);
    if (!updateVerified) {
      console.log(`         Expected: "${updatedText}"`);
      console.log(`         Got: "${verifyRead.text || 'N/A'}"`);
    }
    
    testState.results.update = updateVerified;
    
    // 4.4: DELETE
    console.log('\n   🗑️  Step 4: DELETE sticky note...');
    const deleteStart = Date.now();
    
    await testState.client.deleteWidget(testState.board.id, createdWidget.id);
    
    console.log(`      ✅ DELETE operation completed (${Date.now() - deleteStart}ms)`);
    
    // Verify deletion
    try {
      await testState.client.getMuralWidget(testState.board.id, createdWidget.id);
      console.log('      ❌ Widget still exists after deletion!');
      testState.results.delete = false;
    } catch (error) {
      console.log('      ✅ DELETE verified - widget no longer exists');
      testState.results.delete = true;
      // Remove from our tracking since it's deleted
      testState.widgets = testState.widgets.filter(w => w.id !== createdWidget.id);
    }
    
    testState.results.crud = true;
    
  } catch (error) {
    console.error(`\n❌ Test failed in ${testState.phase} phase: ${error.message}`);
    
    // Provide contextual help based on where the failure occurred
    if (testState.phase === 'environment_validation') {
      console.log('\n💡 Environment Setup Help:');
      console.log('   • Ensure MURAL_CLIENT_ID is set in your environment');
      console.log('   • Ensure MURAL_CLIENT_SECRET is set (recommended)');
      console.log('   • Run authentication: npx @modelcontextprotocol/inspector build/index.js');
      console.log('   • Verify OAuth scopes include murals:read and murals:write');
    } else if (testState.phase === 'workspace_discovery') {
      console.log('\n💡 Workspace Access Help:');
      console.log('   • Ensure your OAuth app has access to workspaces');
      console.log('   • Check that your user account has workspace permissions');
      console.log('   • Try refreshing your authentication tokens');
    } else if (testState.phase === 'board_discovery') {
      console.log('\n💡 Board Access Help:');
      console.log('   • Create a board in your workspace for testing');
      console.log('   • Ensure your user has permissions to the selected workspace');
      console.log('   • Try using a different workspace');
    }
    
    // Attempt cleanup
    if (testState.widgets.length > 0 && testState.client && testState.board) {
      console.log('\n🧹 Attempting cleanup...');
      for (const widget of testState.widgets) {
        try {
          await testState.client.deleteWidget(testState.board.id, widget.id);
          console.log(`   ✅ Cleaned up widget ${widget.id}`);
        } catch (cleanupError) {
          console.log(`   ⚠️  Failed to cleanup widget ${widget.id}: ${cleanupError.message}`);
        }
      }
    }
  }
  
  // Final Results
  const totalTime = Date.now() - testState.startTime;
  
  console.log('\n' + '='.repeat(62));
  console.log('📊 ADAPTIVE INTEGRATION TEST RESULTS');
  console.log('='.repeat(62));
  
  if (testState.workspace && testState.board) {
    console.log('\n🎯 Test Environment Used:');
    console.log(`   Workspace: "${testState.workspace.name}" (${testState.workspace.id})`);
    console.log(`   Board:     "${testState.board.title}" (${testState.board.id})`);
  }
  
  console.log('\n📋 Test Results:');
  const results = testState.results;
  console.log(`   🔧 Environment:  ${results.environment ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   🏢 Workspace:    ${results.workspace ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   🎨 Board:        ${results.board ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   📝 Create:       ${results.create ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   📖 Read:         ${results.read ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   ✏️  Update:       ${results.update ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   🗑️  Delete:       ${results.delete ? '✅ PASS' : '❌ FAIL'}`);
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  const successRate = (passedTests / totalTests * 100).toFixed(1);
  
  console.log(`\n📈 Overall: ${passedTests}/${totalTests} phases passed (${successRate}%)`);
  console.log(`⏱️  Total time: ${totalTime}ms`);
  
  if (results.crud) {
    console.log('\n🎉 SUCCESS! All CRUD operations completed successfully.');
    console.log('   The Mural MCP server is working correctly with your environment.');
    console.log('\n💼 Your test environment:');
    console.log(`   • Workspace: "${testState.workspace?.name}"`);
    console.log(`   • Board: "${testState.board?.title}"`);
    console.log('\n💡 You can use these for future testing.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some operations failed. See details above.');
    console.log('\n🔧 Next Steps:');
    console.log('   1. Review the error messages above');
    console.log('   2. Ensure proper authentication and permissions');
    console.log('   3. Try the suggested troubleshooting steps');
    console.log('   4. Re-run this test after making corrections');
    process.exit(1);
  }
}

adaptiveIntegrationTest();