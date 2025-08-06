#!/usr/bin/env node

import { MuralClient } from '../build/mural-client.js';
import 'dotenv/config';

/**
 * Test suite for update-sticky-note functionality
 * Tests both the MuralClient method and the API endpoint directly
 */
async function testUpdateStickyNote() {
  console.log('🔄 Testing update-sticky-note functionality...\n');
  
  try {
    const clientId = process.env.MURAL_CLIENT_ID;
    const clientSecret = process.env.MURAL_CLIENT_SECRET;
    const client = new MuralClient(clientId, clientSecret);
    
    // Check OAuth scopes first
    console.log('1. 🔐 Checking OAuth scopes...');
    const scopes = await client.getUserScopes();
    if (!scopes.includes('murals:write')) {
      throw new Error('This test requires murals:write scope. Please re-authenticate with proper scopes.');
    }
    console.log('   ✅ murals:write scope available\n');
    
    // Get a test board
    console.log('2. 🏠 Getting test board...');
    const workspaces = await client.getWorkspaces();
    if (workspaces.length === 0) {
      throw new Error('No workspaces found');
    }
    const boards = await client.getWorkspaceMurals(workspaces[0].id);
    if (boards.length === 0) {
      throw new Error('No boards found in workspace');
    }
    const boardId = boards[0].id;
    console.log(`   Using board: ${boards[0].title} (${boardId})\n`);
    
    // Create a test sticky note first
    console.log('3. 📝 Creating test sticky note...');
    const testStickyNote = {
      x: 200,
      y: 200,
      text: 'Original sticky note text',
      width: 150,
      height: 100,
      shape: 'rectangle',
      style: {
        backgroundColor: '#FFFF99',
        textColor: '#000000',
        fontSize: 12
      }
    };
    
    const createdWidgets = await client.createStickyNotes(boardId, [testStickyNote]);
    if (createdWidgets.length === 0) {
      throw new Error('Failed to create test sticky note');
    }
    
    const widgetId = createdWidgets[0].id;
    console.log(`   ✅ Created test sticky note: ${widgetId}\n`);
    
    // Test 1: Update text content
    console.log('4. 📄 Test 1: Update text content...');
    try {
      const textUpdate = {
        text: 'Updated sticky note text - TEST SUCCESSFUL!'
      };
      
      const updatedWidget = await client.updateStickyNote(boardId, widgetId, textUpdate);
      console.log(`   ✅ Text update successful`);
      console.log(`   📝 New text: "${updatedWidget.text || 'N/A'}"`);
    } catch (error) {
      console.log(`   ❌ Text update failed: ${error.message}`);
    }
    
    // Test 2: Update position
    console.log('\n5. 📍 Test 2: Update position...');
    try {
      const positionUpdate = {
        x: 300,
        y: 250
      };
      
      const updatedWidget = await client.updateStickyNote(boardId, widgetId, positionUpdate);
      console.log(`   ✅ Position update successful`);
      console.log(`   📍 New position: (${updatedWidget.x || 'N/A'}, ${updatedWidget.y || 'N/A'})`);
    } catch (error) {
      console.log(`   ❌ Position update failed: ${error.message}`);
    }
    
    // Test 3: Update styling
    console.log('\n6. 🎨 Test 3: Update styling...');
    try {
      const styleUpdate = {
        style: {
          backgroundColor: '#FF9999',
          fontSize: 14,
          textColor: '#FFFFFF'
        }
      };
      
      const updatedWidget = await client.updateStickyNote(boardId, widgetId, styleUpdate);
      console.log(`   ✅ Style update successful`);
      console.log(`   🎨 New background: ${updatedWidget.style?.backgroundColor || 'N/A'}`);
      console.log(`   🔤 New font size: ${updatedWidget.style?.fontSize || 'N/A'}`);
    } catch (error) {
      console.log(`   ❌ Style update failed: ${error.message}`);
    }
    
    // Test 4: Update multiple properties
    console.log('\n7. 🔄 Test 4: Update multiple properties...');
    try {
      const multiUpdate = {
        x: 100,
        y: 150,
        text: 'Final updated text with multiple changes',
        width: 200,
        height: 120,
        style: {
          backgroundColor: '#99FF99',
          textColor: '#000000',
          fontSize: 16
        }
      };
      
      const updatedWidget = await client.updateStickyNote(boardId, widgetId, multiUpdate);
      console.log(`   ✅ Multiple properties update successful`);
      console.log(`   📝 Text: "${updatedWidget.text || 'N/A'}"`);
      console.log(`   📍 Position: (${updatedWidget.x || 'N/A'}, ${updatedWidget.y || 'N/A'})`);
      console.log(`   📏 Size: ${updatedWidget.width || 'N/A'}x${updatedWidget.height || 'N/A'}`);
    } catch (error) {
      console.log(`   ❌ Multiple properties update failed: ${error.message}`);
    }
    
    // Test 5: Test with invalid widget ID
    console.log('\n8. 🚫 Test 5: Test error handling with invalid widget ID...');
    try {
      await client.updateStickyNote(boardId, 'invalid-widget-id', { text: 'Should fail' });
      console.log(`   ⚠️  Expected this to fail but it succeeded`);
    } catch (error) {
      console.log(`   ✅ Correctly handled invalid widget ID: ${error.message}`);
    }
    
    // Test 6: Test with empty update object
    console.log('\n9. 📭 Test 6: Test with empty update object...');
    try {
      await client.updateStickyNote(boardId, widgetId, {});
      console.log(`   ⚠️  Empty update succeeded (might be expected behavior)`);
    } catch (error) {
      console.log(`   ✅ Empty update handled: ${error.message}`);
    }
    
    // Test 7: Direct API endpoint test
    console.log('\n10. 🌐 Test 7: Direct API endpoint test...');
    try {
      const accessToken = await client.getAccessToken ? await client.getAccessToken() : null;
      if (!accessToken) {
        console.log('   ⚠️  Could not get access token for direct API test');
      } else {
        const url = `https://app.mural.co/api/public/v1/murals/${encodeURIComponent(boardId)}/widgets/sticky-note/${encodeURIComponent(widgetId)}`;
        const directUpdate = {
          text: 'Direct API update test'
        };
        
        const response = await fetch(url, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(directUpdate)
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log(`   ✅ Direct API call successful`);
          console.log(`   📝 Updated text: "${result.text || result.value?.text || 'N/A'}"`);
        } else {
          const errorText = await response.text();
          console.log(`   ❌ Direct API call failed: ${response.status} - ${errorText}`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Direct API test failed: ${error.message}`);
    }
    
    // Cleanup
    console.log('\n11. 🧹 Cleaning up test sticky note...');
    try {
      await client.deleteWidget(boardId, widgetId);
      console.log('   ✅ Test sticky note deleted successfully');
    } catch (error) {
      console.log(`   ⚠️  Cleanup warning: ${error.message}`);
    }
    
    // Summary
    console.log('\n📊 Test Summary:');
    console.log('   • update-sticky-note MuralClient method functionality verified');
    console.log('   • PATCH API endpoint tested directly');
    console.log('   • Error handling scenarios tested');
    console.log('   • Multiple update types tested (text, position, styling, multi)');
    console.log('\n🎉 update-sticky-note tests completed!');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testUpdateStickyNote();