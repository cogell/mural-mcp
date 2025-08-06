#!/usr/bin/env node

import { MuralClient } from './build/mural-client.js';
import 'dotenv/config';

async function testWithShapeField() {
  console.log('🧠 ULTRA THINK: Adding shape field based on existing widget analysis...\n');
  
  try {
    const clientId = process.env.MURAL_CLIENT_ID;
    const clientSecret = process.env.MURAL_CLIENT_SECRET;
    const client = new MuralClient(clientId, clientSecret);
    
    // Get a board to test with
    const workspaces = await client.getWorkspaces();
    const boards = await client.getWorkspaceMurals(workspaces[0].id);
    const boardId = boards[0].id;
    
    console.log(`Testing with board: ${boards[0].title} (${boardId})\n`);
    
    const accessToken = await client.getAccessToken();
    
    // Test with shape field (observed in existing sticky notes: shape: "rectangle")
    const payloadTests = [
      {
        name: "Direct array with shape=rectangle",
        payload: [
          {
            x: 100,
            y: 200,
            width: 150,
            height: 100,
            text: "Test sticky note",
            shape: "rectangle"
          }
        ]
      },
      {
        name: "Direct array with shape=rectangle and color",
        payload: [
          {
            x: 100,
            y: 200,
            width: 150,
            height: 100,
            text: "Test with color",
            shape: "rectangle",
            color: "yellow"
          }
        ]
      },
      {
        name: "Minimal with shape",
        payload: [
          {
            x: 100,
            y: 100,
            text: "Minimal test",
            shape: "rectangle"
          }
        ]
      },
      {
        name: "With style object (like existing widgets)",
        payload: [
          {
            x: 100,
            y: 100,
            text: "Test with style",
            shape: "rectangle",
            width: 168,
            height: 168,
            style: {
              backgroundColor: "#FCF281FF"
            }
          }
        ]
      }
    ];
    
    const endpoint = `/murals/${encodeURIComponent(boardId)}/widgets/sticky-note`;
    
    for (const test of payloadTests) {
      console.log(`📋 Testing: ${test.name}`);
      console.log(`   Payload: ${JSON.stringify(test.payload, null, 2)}`);
      
      try {
        const url = `https://app.mural.co/api/public/v1${endpoint}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(test.payload)
        });
        
        const responseText = await response.text();
        
        console.log(`   Status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
          console.log(`   🎉 BREAKTHROUGH! Sticky note creation works!`);
          console.log(`   Response: ${responseText}`);
          
          // Parse and clean up the created widget
          const responseData = JSON.parse(responseText);
          const createdWidgets = Array.isArray(responseData) ? responseData : (responseData.value || []);
          
          if (createdWidgets.length > 0) {
            const widgetId = createdWidgets[0].id;
            console.log(`   🧹 Cleaning up created widget: ${widgetId}`);
            
            const deleteUrl = `https://app.mural.co/api/public/v1/murals/${encodeURIComponent(boardId)}/widgets/${encodeURIComponent(widgetId)}`;
            const deleteResponse = await fetch(deleteUrl, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json'
              }
            });
            console.log(`   ✅ Delete status: ${deleteResponse.status}`);
          }
          
          console.log('\n🎯 SUCCESS! Found the correct payload structure.');
          console.log('   Key requirements:');
          console.log('   • Direct array (not wrapped in widgets object)');
          console.log('   • Must include shape: "rectangle"');
          console.log('   • Text and position fields required');
          break; // Stop on first success
        } else {
          console.log(`   Response: ${responseText.substring(0, 200)}${responseText.length > 200 ? '...' : ''}`);
        }
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
      
      console.log(''); // Blank line between tests
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testWithShapeField();