#!/usr/bin/env node

import { MuralClient } from './build/mural-client.js';
import 'dotenv/config';

async function testShapeBasedPayload() {
  console.log('🔍 Testing shape-based payload for sticky-note endpoint...\n');
  
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
    
    // Test shape-based payloads since the error mentioned "shape" field
    const payloadOptions = [
      {
        name: "Rectangle shape",
        payload: { widgets: [{ x: 100, y: 100, text: 'Test', shape: 'rectangle' }] }
      },
      {
        name: "Circle shape", 
        payload: { widgets: [{ x: 100, y: 100, text: 'Test', shape: 'circle' }] }
      },
      {
        name: "Rectangle with dimensions",
        payload: { widgets: [{ x: 100, y: 100, text: 'Test', shape: 'rectangle', width: 150, height: 150 }] }
      },
      {
        name: "Circle with dimensions",
        payload: { widgets: [{ x: 100, y: 100, text: 'Test', shape: 'circle', width: 150, height: 150 }] }
      }
    ];
    
    const endpoint = `/murals/${encodeURIComponent(boardId)}/widgets/sticky-note`;
    
    for (const option of payloadOptions) {
      console.log(`\n📋 Testing: ${option.name}`);
      console.log(`   Payload: ${JSON.stringify(option.payload, null, 2)}`);
      
      try {
        const url = `https://app.mural.co/api/public/v1${endpoint}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(option.payload)
        });
        
        const responseText = await response.text();
        
        console.log(`   Status: ${response.status} ${response.statusText}`);
        console.log(`   Response: ${responseText.substring(0, 200)}${responseText.length > 200 ? '...' : ''}`);
        
        if (response.ok) {
          console.log(`   ✅ SUCCESS with ${option.name}!`);
          
          // Parse and clean up the created widget if successful
          const responseData = JSON.parse(responseText);
          const createdWidgets = responseData.value || responseData;
          if (Array.isArray(createdWidgets) && createdWidgets.length > 0) {
            const widgetId = createdWidgets[0].id;
            console.log(`   🧹 Cleaning up created widget: ${widgetId}`);
            
            const deleteUrl = `https://app.mural.co/api/public/v1/murals/${encodeURIComponent(boardId)}/widgets/${encodeURIComponent(widgetId)}`;
            await fetch(deleteUrl, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json'
              }
            });
            console.log(`   ✅ Cleaned up`);
          }
          break; // Stop on first success
        }
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
  } catch (error) {
    console.error('❌ Debug test failed:', error.message);
  }
}

testShapeBasedPayload();