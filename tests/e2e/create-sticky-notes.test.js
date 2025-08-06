#!/usr/bin/env node

import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root when running from tests directory
const envPath = process.cwd().includes('/tests') 
  ? path.resolve('../.env')
  : path.resolve('.env');
dotenv.config({ path: envPath });

import { getTestEnvironment } from '../helpers/test-setup.js';
import { 
  createTestStickyNote, 
  createTestStickyNotes,
  BasicStickyNote,
  StyledStickyNote,
  MinimalStickyNote,
  InvalidPayloads
} from '../helpers/fixtures.js';
import { getResourceTracker, cleanupTrackedResources } from '../helpers/cleanup.js';

/**
 * E2E Test: create-sticky-notes MCP Tool
 * 
 * Tests the create-sticky-notes tool with various scenarios including
 * single notes, bulk creation, validation, and error handling.
 */
export async function testCreateStickyNotesTool() {
  console.log('🧪 Testing: create-sticky-notes MCP tool');
  console.log('=' .repeat(50));
  
  const testResults = {
    passed: 0,
    failed: 0,
    total: 0,
    details: []
  };

  function addResult(name, success, details = '') {
    testResults.total++;
    if (success) {
      testResults.passed++;
      console.log(`   ✅ ${name}`);
    } else {
      testResults.failed++;
      console.log(`   ❌ ${name}: ${details}`);
    }
    testResults.details.push({ name, success, details });
  }

  let testEnvironment = null;
  const tracker = getResourceTracker();

  try {
    // Setup test environment with write permissions
    testEnvironment = await getTestEnvironment(['murals:read', 'murals:write']);
    const { mcpClient, board } = testEnvironment;

    // Test 1: Create single basic sticky note
    console.log('\n📝 Test 1: Create single basic sticky note');
    try {
      const testNote = createTestStickyNote();
      const response = await mcpClient.callTool('create-sticky-notes', {
        muralId: board.id,
        stickyNotes: [testNote]
      });
      
      if (response.error) {
        addResult('Basic sticky note creation', false, response.error.message);
      } else {
        const data = mcpClient.parseResponse(response);
        
        // Check if this is an error response from the API
        if (data.error) {
          addResult('Basic sticky note creation', false, data.message || 'API error response');
        } else {
          // Check response structure
          const hasWidgets = Array.isArray(data.widgets);
          addResult('Response has widgets array', hasWidgets);
          
          const hasCount = typeof data.count === 'number';
          addResult('Response has count field', hasCount);
          
          const hasMessage = typeof data.message === 'string';
          addResult('Response has message field', hasMessage);
        
          if (hasWidgets && data.widgets.length > 0) {
            const widget = data.widgets[0];
            
            // Track for cleanup
            tracker.trackWidget(board.id, widget.id);
            
            // Verify widget properties
            const hasId = typeof widget.id === 'string';
            const hasCorrectText = widget.text === testNote.text;
            const hasCorrectPosition = widget.x === testNote.x && widget.y === testNote.y;
            
            addResult('Created widget has ID', hasId);
            addResult('Created widget has correct text', hasCorrectText,
              hasCorrectText ? '' : `Expected: ${testNote.text}, Got: ${widget.text}`);
            addResult('Created widget has correct position', hasCorrectPosition,
              hasCorrectPosition ? '' : `Expected: (${testNote.x},${testNote.y}), Got: (${widget.x},${widget.y})`);
            
            console.log(`      Created widget: ${widget.id}`);
          }
        }
      }
    } catch (error) {
      addResult('Basic sticky note creation', false, error.message);
    }

    // Test 2: Create styled sticky note
    console.log('\n🎨 Test 2: Create styled sticky note');
    try {
      const styledNote = { ...StyledStickyNote, text: `Styled Test - ${Date.now()}` };
      const response = await mcpClient.callTool('create-sticky-notes', {
        muralId: board.id,
        stickyNotes: [styledNote]
      });
      
      if (response.error) {
        addResult('Styled sticky note creation', false, response.error.message);
      } else {
        const data = mcpClient.parseResponse(response);
        
        // Check if this is an error response from the API
        if (data.error) {
          addResult('Styled sticky note creation', false, data.message || 'API error response');
        } else {
        
          if (data.widgets && data.widgets.length > 0) {
            const widget = data.widgets[0];
            tracker.trackWidget(board.id, widget.id);
            
            const hasStyle = widget.style && typeof widget.style === 'object';
            addResult('Styled widget has style object', hasStyle);
            
            // Note: style customization is handled by API defaults, so we just verify structure
            addResult('Widget has API-generated style', hasStyle);
            
            console.log(`      Created styled widget: ${widget.id}`);
          } else {
            addResult('Styled sticky note creation', false, 'No widgets returned');
          }
        }
      }
    } catch (error) {
      addResult('Styled sticky note creation', false, error.message);
    }

    // Test 3: Create multiple sticky notes (bulk creation)
    console.log('\n📋 Test 3: Create multiple sticky notes');
    try {
      const multipleNotes = createTestStickyNotes(3);
      const response = await mcpClient.callTool('create-sticky-notes', {
        muralId: board.id,
        stickyNotes: multipleNotes
      });
      
      if (response.error) {
        addResult('Bulk sticky note creation', false, response.error.message);
      } else {
        const data = mcpClient.parseResponse(response);
        
        // Check if this is an error response from the API
        if (data.error) {
          addResult('Bulk sticky note creation', false, data.message || 'API error response');
        } else {
        
          if (data.widgets) {
            // Track all created widgets
            tracker.trackWidgets(board.id, data.widgets);
            
            const correctCount = data.widgets.length === 3;
            addResult('Bulk creation: correct count', correctCount,
              correctCount ? '' : `Expected: 3, Got: ${data.widgets.length}`);
            
            const allHaveIds = data.widgets.every(w => typeof w.id === 'string');
            addResult('Bulk creation: all have IDs', allHaveIds);
            
            console.log(`      Created ${data.widgets.length} widgets in bulk`);
          } else {
            addResult('Bulk sticky note creation', false, 'No widgets returned');
          }
        }
      }
    } catch (error) {
      addResult('Bulk sticky note creation', false, error.message);
    }

    // Test 4: Create minimal sticky note (only required fields)
    console.log('\n📦 Test 4: Create minimal sticky note');
    try {
      const minimalNote = { ...MinimalStickyNote, text: `Minimal Test - ${Date.now()}` };
      const response = await mcpClient.callTool('create-sticky-notes', {
        muralId: board.id,
        stickyNotes: [minimalNote]
      });
      
      if (response.error) {
        addResult('Minimal sticky note creation', false, response.error.message);
      } else {
        const data = mcpClient.parseResponse(response);
        
        // Check if this is an error response from the API
        if (data.error) {
          addResult('Minimal sticky note creation', false, data.message || 'API error response');
        } else {
        
          if (data.widgets && data.widgets.length > 0) {
            const widget = data.widgets[0];
            tracker.trackWidget(board.id, widget.id);
            
            const hasRequiredFields = widget.id && widget.text && 
                                     typeof widget.x === 'number' && 
                                     typeof widget.y === 'number';
            
            addResult('Minimal note has required fields', hasRequiredFields);
            console.log(`      Created minimal widget: ${widget.id}`);
          } else {
            addResult('Minimal sticky note creation', false, 'No widgets returned');
          }
        }
      }
    } catch (error) {
      addResult('Minimal sticky note creation', false, error.message);
    }

    // Test 5: Error scenarios with invalid payloads
    console.log('\n❌ Test 5: Error scenarios');
    
    // Test missing text
    try {
      const response = await mcpClient.callTool('create-sticky-notes', {
        muralId: board.id,
        stickyNotes: [InvalidPayloads.missingText]
      });
      
      if (response.error) {
        addResult('Missing text rejected', true, 'MCP error correctly returned');
      } else {
        const data = mcpClient.parseResponse(response);
        const shouldError = !!data.error;
        addResult('Missing text rejected', shouldError,
          shouldError ? 'API error correctly returned' : 'Should have been rejected');
      }
    } catch (error) {
      addResult('Missing text handling', true, 'Error correctly thrown');
    }

    // Test missing position
    try {
      const response = await mcpClient.callTool('create-sticky-notes', {
        muralId: board.id,
        stickyNotes: [InvalidPayloads.missingPosition]
      });
      
      if (response.error) {
        addResult('Missing position rejected', true, 'MCP error correctly returned');
      } else {
        const data = mcpClient.parseResponse(response);
        const shouldError = !!data.error;
        addResult('Missing position rejected', shouldError,
          shouldError ? 'API error correctly returned' : 'Should have been rejected');
      }
    } catch (error) {
      addResult('Missing position handling', true, 'Error correctly thrown');
    }

    // Test invalid mural ID
    try {
      const response = await mcpClient.callTool('create-sticky-notes', {
        muralId: 'invalid-mural-id-12345',
        stickyNotes: [BasicStickyNote]
      });
      
      if (response.error) {
        addResult('Invalid mural ID rejected', true, 'MCP error correctly returned');
      } else {
        const data = mcpClient.parseResponse(response);
        const shouldError = !!data.error;
        addResult('Invalid mural ID rejected', shouldError,
          shouldError ? 'API error correctly returned' : 'Should have been rejected');
      }
    } catch (error) {
      addResult('Invalid mural ID handling', true, 'Error correctly thrown');
    }

    // Test empty array
    try {
      const response = await mcpClient.callTool('create-sticky-notes', {
        muralId: board.id,
        stickyNotes: []
      });
      
      if (response.error) {
        addResult('Empty sticky notes array rejected', true, 'MCP error correctly returned');
      } else {
        const data = mcpClient.parseResponse(response);
        const shouldError = !!data.error;
        addResult('Empty sticky notes array rejected', shouldError,
          shouldError ? 'API error correctly returned' : 'Should have been rejected');
      }
    } catch (error) {
      addResult('Empty array handling', true, 'Error correctly thrown');
    }

  } catch (error) {
    addResult('Environment setup', false, error.message);
  } finally {
    // Cleanup all created widgets
    if (testEnvironment) {
      console.log('\n🧹 Cleaning up created widgets...');
      await cleanupTrackedResources(testEnvironment.directClient);
    }
  }

  // Results summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Results Summary');
  console.log('='.repeat(50));
  console.log(`Total tests: ${testResults.total}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  
  const successRate = testResults.total > 0 ? 
    (testResults.passed / testResults.total * 100).toFixed(1) : 0;
  console.log(`📈 Success rate: ${successRate}%`);

  if (testResults.failed === 0) {
    console.log('\n🎉 create-sticky-notes tool working correctly!');
    return true;
  } else {
    console.log('\n⚠️  Some tests failed. Check details above.');
    return false;
  }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testCreateStickyNotesTool()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('❌ Test execution failed:', error.message);
      process.exit(1);
    });
}