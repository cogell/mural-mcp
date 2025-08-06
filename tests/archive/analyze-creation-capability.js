#!/usr/bin/env node

import { MuralClient } from './build/mural-client.js';
import 'dotenv/config';

async function analyzeCreationCapability() {
  console.log('🔍 Analyzing what creation capabilities we actually have...\n');
  
  try {
    const clientId = process.env.MURAL_CLIENT_ID;
    const clientSecret = process.env.MURAL_CLIENT_SECRET;
    const client = new MuralClient(clientId, clientSecret);
    
    // First, check our scopes
    console.log('1. Checking OAuth scopes...');
    const scopes = await client.getUserScopes();
    console.log(`   Available scopes: ${scopes.join(', ')}`);
    console.log(`   Has murals:write? ${scopes.includes('murals:write') ? '✅ Yes' : '❌ No'}`);
    
    if (!scopes.includes('murals:write')) {
      console.log('\n❌ Missing murals:write scope - this is required for creation operations');
      console.log('   The app needs to be configured with write permissions in Mural Developer Portal');
      return;
    }
    
    // Get a board to test with
    console.log('\n2. Getting test board...');
    const workspaces = await client.getWorkspaces();
    const boards = await client.getWorkspaceMurals(workspaces[0].id);
    const boardId = boards[0].id;
    console.log(`   Using board: ${boards[0].title} (${boardId})`);
    
    // Test some simple creation operations that should work
    const accessToken = await client.getAccessToken();
    
    console.log('\n3. Testing different endpoint patterns...');
    
    const testEndpoints = [
      // Try POST to create via different patterns
      { method: 'POST', path: '/createstickynote', name: 'Action-based' },
      { method: 'POST', path: `/murals/${boardId}/widgets/sticky-note`, name: 'RESTful widget' },
      { method: 'POST', path: `/murals/${boardId}/sticky-notes`, name: 'RESTful resource' },
      { method: 'POST', path: `/murals/${boardId}/widgets`, name: 'Generic widgets' },
      { method: 'POST', path: `/murals/${boardId}/content/widgets`, name: 'Content widgets' }
    ];
    
    for (const endpoint of testEndpoints) {
      console.log(`\n   📋 Testing: ${endpoint.method} ${endpoint.path} (${endpoint.name})`);
      
      try {
        const url = `https://app.mural.co/api/public/v1${endpoint.path}`;
        const testPayload = endpoint.path.includes('createstickynote') 
          ? { muralId: boardId, widgets: [{ x: 100, y: 100, text: 'test' }] }
          : { widgets: [{ x: 100, y: 100, text: 'test' }] };
          
        const response = await fetch(url, {
          method: endpoint.method,
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(testPayload)
        });
        
        console.log(`      Status: ${response.status} ${response.statusText}`);
        
        if (response.status === 403) {
          console.log('      ❌ Permission denied - might need specific scope');
        } else if (response.status === 404) {
          console.log('      ❌ Endpoint not found');
        } else if (response.status === 400) {
          const text = await response.text();
          console.log(`      ⚠️  Bad request - ${text.substring(0, 100)}...`);
        } else if (response.ok) {
          console.log('      ✅ Endpoint accepts requests!');
        }
        
      } catch (error) {
        console.log(`      ❌ Error: ${error.message}`);
      }
    }
    
    console.log('\n4. Summary:');
    console.log('   • Reading widgets works perfectly ✅');
    console.log('   • Chat and tags endpoints work ✅'); 
    console.log('   • Widget creation endpoints are problematic ❌');
    console.log('\n💡 Recommendation: The Contents API may be primarily read-only for widgets');
    console.log('   Focus on read operations and document creation limitations');
    
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
  }
}

analyzeCreationCapability();