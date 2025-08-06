#!/usr/bin/env node

import { MuralClient } from './build/mural-client.js';
import 'dotenv/config';

async function testGetMuralWidgets() {
  console.log('Testing get-mural-widgets functionality...\n');
  
  try {
    // Initialize the client
    const clientId = process.env.MURAL_CLIENT_ID;
    const clientSecret = process.env.MURAL_CLIENT_SECRET;
    
    if (!clientId) {
      throw new Error('MURAL_CLIENT_ID not found in environment');
    }
    
    const client = new MuralClient(clientId, clientSecret);
    
    // Test connection first
    console.log('1. Testing connection...');
    const connected = await client.testConnection();
    console.log(`   Connection status: ${connected ? '✅ Connected' : '❌ Failed'}\n`);
    
    if (!connected) {
      console.log('Cannot proceed without connection. Please check your credentials.');
      return;
    }
    
    // Get workspaces
    console.log('2. Getting workspaces...');
    const workspaces = await client.getWorkspaces();
    console.log(`   Found ${workspaces.length} workspace(s)`);
    
    if (workspaces.length === 0) {
      console.log('No workspaces found');
      return;
    }
    
    const workspace = workspaces[0];
    console.log(`   Using workspace: ${workspace.name} (${workspace.id})\n`);
    
    // Get boards from workspace
    console.log('3. Getting boards from workspace...');
    const boards = await client.getWorkspaceMurals(workspace.id);
    console.log(`   Found ${boards.length} board(s)`);
    
    if (boards.length === 0) {
      console.log('No boards found in workspace');
      return;
    }
    
    const board = boards[0];
    console.log(`   Using board: ${board.title} (${board.id})\n`);
    
    // Test getMuralWidgets - this is our new RESTful endpoint
    console.log('4. Testing getMuralWidgets with new RESTful endpoint...');
    console.log(`   Calling: GET /murals/${board.id}/widgets`);
    
    const widgets = await client.getMuralWidgets(board.id);
    console.log(`   ✅ Success! Found ${widgets.length} widget(s)`);
    
    if (widgets.length > 0) {
      console.log('\n   Sample widgets:');
      widgets.slice(0, 3).forEach((widget, index) => {
        console.log(`   ${index + 1}. ${widget.type || 'unknown'} - ID: ${widget.id}`);
        if (widget.text) {
          console.log(`      Text: ${widget.text.substring(0, 50)}${widget.text.length > 50 ? '...' : ''}`);
        }
      });
    }
    
    // Test getSingle widget if we have widgets
    if (widgets.length > 0) {
      console.log('\n5. Testing getMuralWidget (single widget)...');
      const firstWidget = widgets[0];
      console.log(`   Calling: GET /murals/${board.id}/widgets/${firstWidget.id}`);
      
      const singleWidget = await client.getMuralWidget(board.id, firstWidget.id);
      console.log(`   ✅ Success! Retrieved widget: ${singleWidget.type || 'unknown'}`);
    }
    
    console.log('\n🎉 All tests passed! RESTful endpoints are working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.message.includes('404') || error.message.includes('Not Found')) {
      console.error('\n💡 This might indicate the RESTful endpoint is not available.');
      console.error('   The actual Mural API might use different endpoint patterns.');
    }
    
    if (error.message.includes('403') || error.message.includes('scope')) {
      console.error('\n💡 This is a scope/permission issue.');
      console.error('   Make sure your Mural app has the murals:read scope.');
    }
  }
}

testGetMuralWidgets();