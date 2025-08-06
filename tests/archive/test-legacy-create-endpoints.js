#!/usr/bin/env node

import { MuralClient } from './build/mural-client.js';
import 'dotenv/config';

async function testLegacyCreateEndpoints() {
  console.log('🔍 Testing legacy action-based creation endpoints...\n');
  
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
    
    // Test the action-based endpoints from documentation
    const endpointsToTest = [
      {
        name: "createstickynote",
        endpoint: "/createstickynote",
        payload: { 
          muralId: boardId,
          widgets: [{ 
            x: 100, 
            y: 100, 
            text: 'Test sticky note',
            width: 168,
            height: 168
          }] 
        }
      },
      {
        name: "createstickynote (with htmlText)",
        endpoint: "/createstickynote", 
        payload: { 
          muralId: boardId,
          widgets: [{ 
            x: 100, 
            y: 100, 
            htmlText: '<html v="1"><div><span>Test sticky note</span></div></html>',
            width: 168,
            height: 168
          }] 
        }
      },
      {
        name: "createstickynote (minimal)",
        endpoint: "/createstickynote",
        payload: { 
          muralId: boardId,
          widgets: [{ 
            x: 100, 
            y: 100, 
            text: 'Test'
          }] 
        }
      }
    ];
    
    for (const test of endpointsToTest) {
      console.log(`\n📋 Testing: ${test.name}`);
      console.log(`   Endpoint: POST ${test.endpoint}`);
      console.log(`   Payload: ${JSON.stringify(test.payload, null, 2)}`);
      
      try {
        const url = `https://app.mural.co/api/public/v1${test.endpoint}`;
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
          console.log(`   ✅ SUCCESS! Action-based endpoint works!`);
          console.log(`   Response: ${responseText}`);
          
          // Parse and clean up the created widget if successful
          const responseData = JSON.parse(responseText);
          const createdWidgets = responseData.value || responseData;
          if (Array.isArray(createdWidgets) && createdWidgets.length > 0) {
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
            console.log(`   🧹 Delete status: ${deleteResponse.status}`);
          }
          break; // Stop on first success
        } else {
          console.log(`   Response: ${responseText.substring(0, 200)}${responseText.length > 200 ? '...' : ''}`);
        }
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log('\n💡 If action-based endpoints work, we need to update our implementation!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testLegacyCreateEndpoints();