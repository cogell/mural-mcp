#!/usr/bin/env node

import { MuralClient } from './build/mural-client.js';
import 'dotenv/config';

async function testCorrectPayload() {
  console.log('🔍 Testing correct sticky note payload based on existing widget structure...\n');
  
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
    
    // Based on the existing sticky note structure analysis, test various payload formats
    const payloadOptions = [
      {
        name: "Minimal sticky note with htmlText and shape",
        payload: { 
          widgets: [{ 
            x: 100, 
            y: 100, 
            htmlText: '<html v="1"><div><span>Test sticky note</span></div></html>',
            shape: 'rectangle',
            width: 168,
            height: 168
          }] 
        }
      },
      {
        name: "With style object like existing widgets",
        payload: { 
          widgets: [{ 
            x: 100, 
            y: 100, 
            htmlText: '<html v="1"><div><span>Test sticky note</span></div></html>',
            shape: 'rectangle',
            width: 168,
            height: 168,
            style: {
              backgroundColor: '#FCF281FF',
              bold: false,
              border: false,
              font: 'proxima-nova',
              fontSize: 49,
              italic: false,
              strike: false,
              textAlign: 'center',
              underline: false
            }
          }] 
        }
      },
      {
        name: "Simple text field (maybe API converts to htmlText)",
        payload: { 
          widgets: [{ 
            x: 100, 
            y: 100, 
            text: 'Test sticky note',
            shape: 'rectangle',
            width: 168,
            height: 168
          }] 
        }
      },
      {
        name: "With minLines like existing widgets",
        payload: { 
          widgets: [{ 
            x: 100, 
            y: 100, 
            htmlText: '<html v="1"><div><span>Test sticky note</span></div></html>',
            shape: 'rectangle',
            width: 168,
            height: 168,
            minLines: 2
          }] 
        }
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
        if (!response.ok) {
          console.log(`   Response: ${responseText.substring(0, 200)}${responseText.length > 200 ? '...' : ''}`);
        }
        
        if (response.ok) {
          console.log(`   ✅ SUCCESS with ${option.name}!`);
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

testCorrectPayload();