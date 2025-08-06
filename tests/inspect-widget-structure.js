#!/usr/bin/env node

import { MuralClient } from './build/mural-client.js';
import 'dotenv/config';

async function inspectWidgetStructure() {
  console.log('🔍 Inspecting existing widget structures to understand expected format...\n');
  
  try {
    const clientId = process.env.MURAL_CLIENT_ID;
    const clientSecret = process.env.MURAL_CLIENT_SECRET;
    const client = new MuralClient(clientId, clientSecret);
    
    // Get a board to test with
    const workspaces = await client.getWorkspaces();
    const boards = await client.getWorkspaceMurals(workspaces[0].id);
    const boardId = boards[0].id;
    
    console.log(`Inspecting widgets from board: ${boards[0].title} (${boardId})\n`);
    
    // Get existing widgets
    const widgets = await client.getMuralWidgets(boardId);
    console.log(`Found ${widgets.length} widgets\n`);
    
    if (widgets.length > 0) {
      console.log('📋 Sample widget structures:\n');
      
      // Group widgets by type
      const widgetTypes = {};
      widgets.forEach(widget => {
        if (!widgetTypes[widget.type]) {
          widgetTypes[widget.type] = [];
        }
        widgetTypes[widget.type].push(widget);
      });
      
      // Show first example of each type
      Object.keys(widgetTypes).forEach(type => {
        const example = widgetTypes[type][0];
        console.log(`🏷️  Type: "${type}" (${widgetTypes[type].length} total)`);
        console.log(`   Sample: ${JSON.stringify(example, null, 2)}\n`);
      });
      
      // Look specifically for sticky note-like widgets
      const stickyLikeWidgets = widgets.filter(w => 
        w.type && (
          w.type.toLowerCase().includes('sticky') || 
          w.type.toLowerCase().includes('note') ||
          w.type.toLowerCase().includes('text')
        )
      );
      
      if (stickyLikeWidgets.length > 0) {
        console.log(`\n🎯 Found ${stickyLikeWidgets.length} sticky note-like widgets:`);
        stickyLikeWidgets.slice(0, 3).forEach((widget, i) => {
          console.log(`\n${i + 1}. Type: "${widget.type}"`);
          console.log(`   Structure: ${JSON.stringify(widget, null, 2)}`);
        });
      } else {
        console.log('\n❌ No sticky note-like widgets found in this board');
      }
      
    } else {
      console.log('❌ No widgets found in this board - cannot analyze structure');
    }
    
  } catch (error) {
    console.error('❌ Inspection failed:', error.message);
  }
}

inspectWidgetStructure();