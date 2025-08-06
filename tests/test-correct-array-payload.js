#!/usr/bin/env node

import { MuralClient } from './build/mural-client.js';
import 'dotenv/config';

async function testCorrectArrayPayload() {
  console.log('🧠 ULTRA THINK: Testing direct array payload structure...\n');
  
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
    
    // Test DIRECT ARRAY payload as per documentation
    const payloadTests = [
      {
        name: "Direct array with color (per docs)",
        payload: [
          {
            x: 100,
            y: 200,
            width: 150,
            height: 100,
            text: "Test sticky note from API",
            color: "yellow"
          }
        ]
      },
      {
        name: "Direct array minimal",
        payload: [
          {
            x: 100,
            y: 100,
            text: "Minimal test"
          }
        ]
      },
      {
        name: "Direct array with dimensions",
        payload: [
          {
            x: 100,
            y: 100,
            width: 168,
            height: 168,
            text: "Test with dimensions"
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
          console.log(`   🎉 SUCCESS! Direct array payload works!`);
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
          
          console.log('\n🎯 FOUND THE SOLUTION! Need to update implementation to use direct arrays.');
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

testCorrectArrayPayload();