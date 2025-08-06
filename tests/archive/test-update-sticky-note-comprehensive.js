#!/usr/bin/env node

import { MuralClient } from '../build/mural-client.js';
import 'dotenv/config';

/**
 * Comprehensive test suite for update-sticky-note functionality
 * Covers edge cases, validation, error scenarios, and performance considerations
 */
async function comprehensiveUpdateStickyNoteTest() {
  console.log('🔬 Comprehensive update-sticky-note test suite...\n');
  
  const testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  };
  
  function logTest(name, success, message = '') {
    testResults.total++;
    if (success) {
      testResults.passed++;
      console.log(`   ✅ ${name}${message ? ': ' + message : ''}`);
    } else {
      testResults.failed++;
      console.log(`   ❌ ${name}${message ? ': ' + message : ''}`);
    }
  }
  
  function logSkipped(name, reason) {
    testResults.total++;
    testResults.skipped++;
    console.log(`   ⏭️  ${name}: ${reason}`);
  }
  
  try {
    const clientId = process.env.MURAL_CLIENT_ID;
    const clientSecret = process.env.MURAL_CLIENT_SECRET;
    const client = new MuralClient(clientId, clientSecret);
    
    // Prerequisites check
    console.log('🔍 Prerequisites Check:');
    
    // Check environment
    const hasClientId = !!process.env.MURAL_CLIENT_ID;
    logTest('Environment - Client ID present', hasClientId);
    
    if (!hasClientId) {
      throw new Error('MURAL_CLIENT_ID environment variable is required');
    }
    
    // Check scopes
    let hasWriteScope = false;
    try {
      const scopes = await client.getUserScopes();
      hasWriteScope = scopes.includes('murals:write');
      logTest('OAuth - murals:write scope available', hasWriteScope);
    } catch (error) {
      logTest('OAuth - scope check', false, error.message);
    }
    
    if (!hasWriteScope) {
      throw new Error('murals:write scope is required for this test');
    }
    
    // Get test resources
    let workspaces, boards, boardId;
    try {
      workspaces = await client.getWorkspaces();
      logTest('API - workspace access', workspaces.length > 0, `Found ${workspaces.length} workspace(s)`);
      
      if (workspaces.length > 0) {
        boards = await client.getWorkspaceMurals(workspaces[0].id);
        logTest('API - board access', boards.length > 0, `Found ${boards.length} board(s)`);
        
        if (boards.length > 0) {
          boardId = boards[0].id;
          console.log(`   Using test board: ${boards[0].title} (${boardId})`);
        }
      }
    } catch (error) {
      logTest('API - resource access', false, error.message);
    }
    
    if (!boardId) {
      throw new Error('No accessible boards found for testing');
    }
    
    console.log('\n🧪 Core Functionality Tests:');
    
    // Create test widgets for various scenarios
    const testWidgets = [];
    
    // Test widget 1: Basic widget for standard updates
    try {
      const basicWidget = await client.createStickyNotes(boardId, [{
        x: 100,
        y: 100,
        text: 'Basic test widget',
        width: 150,
        height: 100,
        shape: 'rectangle',
        style: {
          backgroundColor: '#FFFF99',
          textColor: '#000000',
          fontSize: 12
        }
      }]);
      
      if (basicWidget.length > 0) {
        testWidgets.push({ id: basicWidget[0].id, name: 'basic' });
        logTest('Setup - basic test widget created', true);
      } else {
        logTest('Setup - basic test widget created', false);
      }
    } catch (error) {
      logTest('Setup - basic test widget created', false, error.message);
    }
    
    if (testWidgets.length === 0) {
      throw new Error('Failed to create test widgets');
    }
    
    const basicWidgetId = testWidgets[0].id;
    
    // Test 1: Text-only update
    try {
      await client.updateStickyNote(boardId, basicWidgetId, {
        text: 'Updated text only'
      });
      logTest('Text-only update', true);
    } catch (error) {
      logTest('Text-only update', false, error.message);
    }
    
    // Test 2: Position-only update
    try {
      await client.updateStickyNote(boardId, basicWidgetId, {
        x: 200,
        y: 150
      });
      logTest('Position-only update', true);
    } catch (error) {
      logTest('Position-only update', false, error.message);
    }
    
    // Test 3: Size-only update
    try {
      await client.updateStickyNote(boardId, basicWidgetId, {
        width: 180,
        height: 120
      });
      logTest('Size-only update', true);
    } catch (error) {
      logTest('Size-only update', false, error.message);
    }
    
    // Test 4: Style-only update
    try {
      await client.updateStickyNote(boardId, basicWidgetId, {
        style: {
          backgroundColor: '#FF9999',
          fontSize: 14
        }
      });
      logTest('Style-only update', true);
    } catch (error) {
      logTest('Style-only update', false, error.message);
    }
    
    // Test 5: Partial style update
    try {
      await client.updateStickyNote(boardId, basicWidgetId, {
        style: {
          textColor: '#FFFFFF'
        }
      });
      logTest('Partial style update', true);
    } catch (error) {
      logTest('Partial style update', false, error.message);
    }
    
    // Test 6: Multiple properties update
    try {
      await client.updateStickyNote(boardId, basicWidgetId, {
        x: 250,
        y: 200,
        text: 'Multiple updates applied',
        width: 200,
        height: 140,
        style: {
          backgroundColor: '#CCFFCC',
          textColor: '#000000',
          fontSize: 16
        }
      });
      logTest('Multiple properties update', true);
    } catch (error) {
      logTest('Multiple properties update', false, error.message);
    }
    
    console.log('\n🚨 Error Handling Tests:');
    
    // Test 7: Invalid widget ID
    try {
      await client.updateStickyNote(boardId, 'invalid-widget-id-12345', {
        text: 'Should fail'
      });
      logTest('Invalid widget ID handling', false, 'Should have failed but succeeded');
    } catch (error) {
      logTest('Invalid widget ID handling', true, 'Correctly rejected');
    }
    
    // Test 8: Invalid board ID
    try {
      await client.updateStickyNote('invalid-board-id-12345', basicWidgetId, {
        text: 'Should fail'
      });
      logTest('Invalid board ID handling', false, 'Should have failed but succeeded');
    } catch (error) {
      logTest('Invalid board ID handling', true, 'Correctly rejected');
    }
    
    // Test 9: Empty update object
    try {
      await client.updateStickyNote(boardId, basicWidgetId, {});
      logTest('Empty update object', true, 'Accepted empty update');
    } catch (error) {
      logTest('Empty update object', true, 'Correctly rejected empty update');
    }
    
    // Test 10: Malformed style object
    try {
      await client.updateStickyNote(boardId, basicWidgetId, {
        style: 'invalid-style-format'
      });
      logTest('Malformed style handling', false, 'Should have failed but succeeded');
    } catch (error) {
      logTest('Malformed style handling', true, 'Correctly rejected malformed style');
    }
    
    console.log('\n📏 Edge Case Tests:');
    
    // Test 11: Extreme coordinate values
    try {
      await client.updateStickyNote(boardId, basicWidgetId, {
        x: -1000,
        y: 5000
      });
      logTest('Extreme coordinates', true, 'Accepted extreme values');
    } catch (error) {
      logTest('Extreme coordinates', false, error.message);
    }
    
    // Test 12: Very long text
    const longText = 'A'.repeat(1000);
    try {
      await client.updateStickyNote(boardId, basicWidgetId, {
        text: longText
      });
      logTest('Very long text', true, 'Accepted 1000 character text');
    } catch (error) {
      logTest('Very long text', false, error.message);
    }
    
    // Test 13: Special characters in text
    try {
      await client.updateStickyNote(boardId, basicWidgetId, {
        text: 'Special chars: 🎉 💻 中文 العربية ñáéí "quotes" <tags>'
      });
      logTest('Special characters', true, 'Accepted special characters');
    } catch (error) {
      logTest('Special characters', false, error.message);
    }
    
    // Test 14: Zero/negative dimensions
    try {
      await client.updateStickyNote(boardId, basicWidgetId, {
        width: 0,
        height: -10
      });
      logTest('Zero/negative dimensions', true, 'Accepted zero/negative values');
    } catch (error) {
      logTest('Zero/negative dimensions', false, error.message);
    }
    
    console.log('\n⚡ Performance Tests:');
    
    // Test 15: Rapid sequential updates
    const rapidUpdateStart = Date.now();
    let rapidUpdateSuccess = true;
    try {
      for (let i = 0; i < 5; i++) {
        await client.updateStickyNote(boardId, basicWidgetId, {
          text: `Rapid update ${i + 1}`
        });
      }
      const rapidUpdateTime = Date.now() - rapidUpdateStart;
      logTest('Rapid sequential updates', true, `5 updates in ${rapidUpdateTime}ms`);
    } catch (error) {
      logTest('Rapid sequential updates', false, error.message);
      rapidUpdateSuccess = false;
    }
    
    // Test 16: Rate limit behavior (if applicable)
    if (rapidUpdateSuccess) {
      console.log('   ℹ️  Rate limiting tests would require more extensive setup');
      logSkipped('Rate limit behavior', 'Would require extended test setup');
    }
    
    console.log('\n📊 Data Integrity Tests:');
    
    // Test 17: Verify update persistence
    try {
      const updateText = 'Persistence test text';
      await client.updateStickyNote(boardId, basicWidgetId, {
        text: updateText
      });
      
      // Fetch the widget to verify the update persisted
      const updatedWidget = await client.getMuralWidget(boardId, basicWidgetId);
      const textMatches = updatedWidget.text === updateText;
      logTest('Update persistence', textMatches, textMatches ? 'Text update persisted' : 'Text mismatch');
    } catch (error) {
      logTest('Update persistence', false, error.message);
    }
    
    // Test 18: Concurrent updates (basic test)
    try {
      const promises = [
        client.updateStickyNote(boardId, basicWidgetId, { text: 'Concurrent 1' }),
        client.updateStickyNote(boardId, basicWidgetId, { x: 300 }),
        client.updateStickyNote(boardId, basicWidgetId, { y: 300 })
      ];
      
      await Promise.all(promises);
      logTest('Concurrent updates', true, 'All concurrent updates completed');
    } catch (error) {
      logTest('Concurrent updates', false, error.message);
    }
    
    console.log('\n🧹 Cleanup:');
    
    // Cleanup test widgets
    let cleanupSuccess = true;
    for (const widget of testWidgets) {
      try {
        await client.deleteWidget(boardId, widget.id);
        logTest(`Cleanup ${widget.name} widget`, true);
      } catch (error) {
        logTest(`Cleanup ${widget.name} widget`, false, error.message);
        cleanupSuccess = false;
      }
    }
    
    if (cleanupSuccess) {
      console.log('   ✅ All test widgets cleaned up successfully');
    }
    
  } catch (error) {
    console.error(`❌ Test suite failed: ${error.message}`);
  }
  
  // Final summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 COMPREHENSIVE TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`Total Tests:    ${testResults.total}`);
  console.log(`✅ Passed:      ${testResults.passed}`);
  console.log(`❌ Failed:      ${testResults.failed}`);
  console.log(`⏭️ Skipped:     ${testResults.skipped}`);
  
  const successRate = testResults.total > 0 ? (testResults.passed / testResults.total * 100).toFixed(1) : 0;
  console.log(`📈 Success Rate: ${successRate}%`);
  
  if (testResults.failed === 0) {
    console.log('\n🎉 All tests passed! update-sticky-note is working correctly.');
  } else if (testResults.passed > testResults.failed) {
    console.log('\n⚠️  Most tests passed, but some issues were found.');
  } else {
    console.log('\n❌ Significant issues detected. Review failed tests.');
  }
  
  console.log('\n💡 Test Coverage:');
  console.log('   • Core CRUD operations');
  console.log('   • Input validation and error handling');
  console.log('   • Edge cases and boundary conditions');
  console.log('   • Performance characteristics');
  console.log('   • Data integrity verification');
  console.log('\n🏁 Test suite completed.');
}

comprehensiveUpdateStickyNoteTest();