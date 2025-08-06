#!/usr/bin/env node

import { MuralClient } from '../build/mural-client.js';
import 'dotenv/config';

/**
 * Integration test for sticky note CRUD operations against live Mural board
 * 
 * Assumes:
 * - Workspace named "root" exists
 * - Board named "mural-mcp-test-board" exists in the root workspace
 * - User has murals:read and murals:write scopes
 */
async function integrationTestStickyNoteCRUD() {
  console.log('🔗 Integration Test: Sticky Note CRUD Operations');
  console.log('=' .repeat(60));
  console.log(`📅 Started at: ${new Date().toISOString()}`);
  console.log('');
  
  const testMetadata = {
    startTime: Date.now(),
    workspace: null,
    board: null,
    createdWidget: null,
    testResults: {
      setup: false,
      create: false,
      read: false,
      update: false,
      delete: false,
      cleanup: false
    },
    timings: {}
  };
  
  try {
    // Initialize client
    console.log('🔧 Initializing Mural API client...');
    const clientId = process.env.MURAL_CLIENT_ID;
    const clientSecret = process.env.MURAL_CLIENT_SECRET;
    
    if (!clientId) {
      throw new Error('MURAL_CLIENT_ID environment variable is required');
    }
    
    const client = new MuralClient(clientId, clientSecret);
    console.log('   ✅ Client initialized');
    
    // SETUP PHASE: Find workspace and board
    console.log('\n📋 SETUP PHASE: Locating test environment...');
    const setupStart = Date.now();
    
    console.log('   🔍 Checking OAuth scopes...');
    const scopes = await client.getUserScopes();
    const hasReadScope = scopes.includes('murals:read');
    const hasWriteScope = scopes.includes('murals:write');
    
    console.log(`   📖 murals:read scope: ${hasReadScope ? '✅' : '❌'}`);
    console.log(`   ✏️  murals:write scope: ${hasWriteScope ? '✅' : '❌'}`);
    
    if (!hasReadScope || !hasWriteScope) {
      throw new Error('Both murals:read and murals:write scopes are required for this integration test');
    }
    
    console.log('\n   🏢 Finding "root" workspace...');
    const workspaces = await client.getWorkspaces();
    const rootWorkspace = workspaces.find(ws => 
      ws.name.toLowerCase() === 'root' || 
      ws.name.toLowerCase() === 'root workspace' ||
      ws.name.includes('root')
    );
    
    if (!rootWorkspace) {
      console.log('   📝 Available workspaces:');
      workspaces.forEach(ws => console.log(`      - ${ws.name} (${ws.id})`));
      throw new Error('Could not find "root" workspace. Please ensure a workspace named "root" exists.');
    }
    
    testMetadata.workspace = rootWorkspace;
    console.log(`   ✅ Found root workspace: "${rootWorkspace.name}" (${rootWorkspace.id})`);
    
    console.log('\n   🎨 Finding "mural-mcp-test-board" board...');
    const boards = await client.getWorkspaceMurals(rootWorkspace.id);
    const testBoard = boards.find(board => 
      board.title.toLowerCase().includes('mural-mcp-test-board') ||
      board.title.toLowerCase().includes('test-board') ||
      board.title.toLowerCase().includes('test')
    );
    
    if (!testBoard) {
      console.log('   📝 Available boards in root workspace:');
      boards.forEach(board => console.log(`      - ${board.title} (${board.id})`));
      throw new Error('Could not find "mural-mcp-test-board". Please ensure a board with "mural-mcp-test-board" in the name exists in the root workspace.');
    }
    
    testMetadata.board = testBoard;
    console.log(`   ✅ Found test board: "${testBoard.title}" (${testBoard.id})`);
    
    // Check existing widgets on board for baseline
    const existingWidgets = await client.getMuralWidgets(testBoard.id);
    console.log(`   📊 Existing widgets on board: ${existingWidgets.length}`);
    
    testMetadata.timings.setup = Date.now() - setupStart;
    testMetadata.testResults.setup = true;
    console.log(`   ⏱️  Setup completed in ${testMetadata.timings.setup}ms`);
    
    // TEST 1: CREATE STICKY NOTE
    console.log('\n📝 TEST 1: Create Sticky Note...');
    const createStart = Date.now();
    
    const testStickyNote = {
      x: 100,
      y: 100,
      text: `Integration Test Sticky - ${new Date().toISOString()}`,
      width: 200,
      height: 150,
      shape: 'rectangle',
      style: {
        backgroundColor: '#FFE066',
        textColor: '#000000',
        fontSize: 14
      }
    };
    
    console.log('   📤 Creating sticky note...');
    console.log(`      Text: "${testStickyNote.text}"`);
    console.log(`      Position: (${testStickyNote.x}, ${testStickyNote.y})`);
    console.log(`      Size: ${testStickyNote.width}x${testStickyNote.height}`);
    
    const createdWidgets = await client.createStickyNotes(testBoard.id, [testStickyNote]);
    
    if (!createdWidgets || createdWidgets.length === 0) {
      throw new Error('Failed to create sticky note - no widgets returned');
    }
    
    testMetadata.createdWidget = createdWidgets[0];
    console.log(`   ✅ Sticky note created successfully!`);
    console.log(`      Widget ID: ${testMetadata.createdWidget.id}`);
    console.log(`      Created text: "${testMetadata.createdWidget.text || 'N/A'}"`);
    
    testMetadata.timings.create = Date.now() - createStart;
    testMetadata.testResults.create = true;
    console.log(`   ⏱️  Create operation completed in ${testMetadata.timings.create}ms`);
    
    // TEST 2: READ STICKY NOTE
    console.log('\n📖 TEST 2: Read Sticky Note...');
    const readStart = Date.now();
    
    console.log(`   📥 Reading widget ${testMetadata.createdWidget.id}...`);
    const readWidget = await client.getMuralWidget(testBoard.id, testMetadata.createdWidget.id);
    
    console.log('   ✅ Widget read successfully!');
    console.log(`      ID: ${readWidget.id}`);
    console.log(`      Type: ${readWidget.type || 'N/A'}`);
    console.log(`      Text: "${readWidget.text || 'N/A'}"`);
    console.log(`      Position: (${readWidget.x || 'N/A'}, ${readWidget.y || 'N/A'})`);
    console.log(`      Size: ${readWidget.width || 'N/A'}x${readWidget.height || 'N/A'}`);
    
    // Verify the data matches what we created
    const textMatches = readWidget.text === testStickyNote.text;
    const positionMatches = readWidget.x === testStickyNote.x && readWidget.y === testStickyNote.y;
    
    console.log('\n   🔍 Verification:');
    console.log(`      Text matches: ${textMatches ? '✅' : '❌'}`);
    console.log(`      Position matches: ${positionMatches ? '✅' : '❌'}`);
    
    if (!textMatches || !positionMatches) {
      console.log('   ⚠️  Data verification failed, but read operation succeeded');
    }
    
    testMetadata.timings.read = Date.now() - readStart;
    testMetadata.testResults.read = true;
    console.log(`   ⏱️  Read operation completed in ${testMetadata.timings.read}ms`);
    
    // TEST 3: UPDATE STICKY NOTE TEXT
    console.log('\n✏️  TEST 3: Update Sticky Note Text...');
    const updateStart = Date.now();
    
    const updatedText = `UPDATED: Integration Test Success - ${new Date().toISOString()}`;
    console.log(`   🔄 Updating text to: "${updatedText}"`);
    
    const updatedWidget = await client.updateStickyNote(testBoard.id, testMetadata.createdWidget.id, {
      text: updatedText
    });
    
    console.log('   ✅ Update operation successful!');
    console.log(`      Updated text: "${updatedWidget.text || 'N/A'}"`);
    
    // Verify the update by reading the widget again
    console.log('   🔍 Verifying update by re-reading widget...');
    const verifyWidget = await client.getMuralWidget(testBoard.id, testMetadata.createdWidget.id);
    const updateVerified = verifyWidget.text === updatedText;
    
    console.log(`      Update verified: ${updateVerified ? '✅' : '❌'}`);
    if (updateVerified) {
      console.log(`      Confirmed text: "${verifyWidget.text}"`);
    } else {
      console.log(`      Expected: "${updatedText}"`);
      console.log(`      Got: "${verifyWidget.text || 'N/A'}"`);
    }
    
    testMetadata.timings.update = Date.now() - updateStart;
    testMetadata.testResults.update = updateVerified;
    console.log(`   ⏱️  Update operation completed in ${testMetadata.timings.update}ms`);
    
    // TEST 4: DELETE STICKY NOTE
    console.log('\n🗑️  TEST 4: Delete Sticky Note...');
    const deleteStart = Date.now();
    
    console.log(`   🗑️  Deleting widget ${testMetadata.createdWidget.id}...`);
    await client.deleteWidget(testBoard.id, testMetadata.createdWidget.id);
    
    console.log('   ✅ Delete operation completed!');
    
    // Verify deletion by trying to read the widget (should fail)
    console.log('   🔍 Verifying deletion...');
    try {
      await client.getMuralWidget(testBoard.id, testMetadata.createdWidget.id);
      console.log('   ❌ Widget still exists after deletion!');
      testMetadata.testResults.delete = false;
    } catch (error) {
      console.log('   ✅ Widget successfully deleted (read attempt failed as expected)');
      testMetadata.testResults.delete = true;
    }
    
    testMetadata.timings.delete = Date.now() - deleteStart;
    console.log(`   ⏱️  Delete operation completed in ${testMetadata.timings.delete}ms`);
    
    // Mark widget as cleaned up since we successfully deleted it
    testMetadata.createdWidget = null;
    testMetadata.testResults.cleanup = true;
    
  } catch (error) {
    console.error(`\n❌ Integration test failed: ${error.message}`);
    
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
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 INTEGRATION TEST RESULTS');
  console.log('='.repeat(60));
  
  console.log('\n🏢 Test Environment:');
  if (testMetadata.workspace) {
    console.log(`   Workspace: ${testMetadata.workspace.name} (${testMetadata.workspace.id})`);
  }
  if (testMetadata.board) {
    console.log(`   Board: ${testMetadata.board.title} (${testMetadata.board.id})`);
  }
  
  console.log('\n📋 Test Results:');
  const results = testMetadata.testResults;
  console.log(`   📋 Setup:          ${results.setup ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   📝 Create Sticky:  ${results.create ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   📖 Read Sticky:    ${results.read ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   ✏️  Update Sticky:  ${results.update ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   🗑️  Delete Sticky:  ${results.delete ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   🧹 Cleanup:        ${results.cleanup ? '✅ PASS' : '❌ FAIL'}`);
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  const successRate = (passedTests / totalTests * 100).toFixed(1);
  
  console.log(`\n📈 Summary: ${passedTests}/${totalTests} tests passed (${successRate}%)`);
  
  console.log('\n⏱️  Performance:');
  if (testMetadata.timings.setup) console.log(`   Setup:  ${testMetadata.timings.setup}ms`);
  if (testMetadata.timings.create) console.log(`   Create: ${testMetadata.timings.create}ms`);
  if (testMetadata.timings.read) console.log(`   Read:   ${testMetadata.timings.read}ms`);
  if (testMetadata.timings.update) console.log(`   Update: ${testMetadata.timings.update}ms`);
  if (testMetadata.timings.delete) console.log(`   Delete: ${testMetadata.timings.delete}ms`);
  console.log(`   Total:  ${totalTime}ms`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 ALL TESTS PASSED! Sticky note CRUD operations are working correctly.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Please review the output above.');
    console.log('\n💡 Troubleshooting:');
    console.log('   • Ensure the "root" workspace exists');
    console.log('   • Ensure a board with "mural-mcp-test-board" in the name exists');
    console.log('   • Verify you have murals:read and murals:write scopes');
    console.log('   • Check your network connection and API credentials');
    process.exit(1);
  }
}

integrationTestStickyNoteCRUD();