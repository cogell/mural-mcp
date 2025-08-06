#!/usr/bin/env node

import { MuralClient } from './build/mural-client.js';
import 'dotenv/config';

async function testEndpointVariants() {
  console.log('🔍 Testing different sticky note endpoint variants...\n');
  
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
    
    // Test different endpoint variants
    const endpointVariants = [
      '/widgets/sticky-note',
      '/widgets/stickynote',
      '/widgets/sticky_note',
      '/widgets/stickyNote',
      '/sticky-notes',
      '/stickynotes',
      '/sticky_notes',
      '/widgets',
      '/content/sticky-notes',
      '/content/widgets/sticky-note'
    ];
    
    for (const endpoint of endpointVariants) {
      const fullEndpoint = `/murals/${encodeURIComponent(boardId)}${endpoint}`;
      console.log(`\n📋 Testing: POST ${fullEndpoint}`);
      
      const testPayload = {
        widgets: [{ x: 100, y: 100, text: 'Test', width: 150, height: 150 }]
      };
      
      try {
        const url = `https://app.mural.co/api/public/v1${fullEndpoint}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(testPayload)
        });
        
        console.log(`   Status: ${response.status} ${response.statusText}`);
        
        if (response.status !== 404) {
          const responseText = await response.text();
          console.log(`   Response: ${responseText.substring(0, 150)}${responseText.length > 150 ? '...' : ''}`);
          
          if (response.ok) {
            console.log(`   ✅ FOUND WORKING ENDPOINT: ${fullEndpoint}!`);
            
            // Clean up if successful
            const responseData = JSON.parse(responseText);
            const createdWidgets = responseData.value || responseData;
            if (Array.isArray(createdWidgets) && createdWidgets.length > 0) {
              const widgetId = createdWidgets[0].id;
              const deleteUrl = `https://app.mural.co/api/public/v1/murals/${encodeURIComponent(boardId)}/widgets/${encodeURIComponent(widgetId)}`;
              await fetch(deleteUrl, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${accessToken}` }
              });
              console.log(`   🧹 Cleaned up widget ${widgetId}`);
            }
            break;
          }
        } else {
          console.log(`   ❌ 404 Not Found`);
        }
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testEndpointVariants();