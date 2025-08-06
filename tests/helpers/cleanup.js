#!/usr/bin/env node

/**
 * Cleanup Utilities
 * 
 * Centralized resource cleanup logic to ensure tests don't leave 
 * artifacts behind in Mural boards.
 */

/**
 * Track created resources for cleanup
 */
class ResourceTracker {
  constructor() {
    this.widgets = new Set();
    this.tags = new Set(); 
    this.boardIds = new Set();
  }

  /**
   * Track a widget for cleanup
   */
  trackWidget(boardId, widgetId) {
    this.widgets.add({ boardId, widgetId });
    this.boardIds.add(boardId);
  }

  /**
   * Track multiple widgets
   */
  trackWidgets(boardId, widgets) {
    widgets.forEach(widget => {
      this.trackWidget(boardId, widget.id);
    });
  }

  /**
   * Track a tag for cleanup  
   */
  trackTag(boardId, tagId) {
    this.tags.add({ boardId, tagId });
    this.boardIds.add(boardId);
  }

  /**
   * Get all tracked resources
   */
  getTrackedResources() {
    return {
      widgets: Array.from(this.widgets),
      tags: Array.from(this.tags),
      boards: Array.from(this.boardIds)
    };
  }

  /**
   * Clear all tracked resources
   */
  clear() {
    this.widgets.clear();
    this.tags.clear();
    this.boardIds.clear();
  }
}

// Global resource tracker instance
const globalTracker = new ResourceTracker();

/**
 * Get the global resource tracker
 */
export function getResourceTracker() {
  return globalTracker;
}

/**
 * Clean up a single widget
 */
export async function cleanupWidget(client, boardId, widgetId) {
  try {
    await client.deleteWidget(boardId, widgetId);
    console.log(`   ✅ Cleaned up widget ${widgetId}`);
    return true;
  } catch (error) {
    console.log(`   ⚠️  Failed to cleanup widget ${widgetId}: ${error.message}`);
    return false;
  }
}

/**
 * Clean up multiple widgets from a board
 */
export async function cleanupWidgets(client, boardId, widgetIds) {
  const results = {
    success: 0,
    failed: 0,
    errors: []
  };

  console.log(`🧹 Cleaning up ${widgetIds.length} widget(s) from board ${boardId}...`);

  for (const widgetId of widgetIds) {
    const success = await cleanupWidget(client, boardId, widgetId);
    
    if (success) {
      results.success++;
    } else {
      results.failed++;
      results.errors.push(widgetId);
    }
  }

  console.log(`   📊 Cleanup results: ${results.success} success, ${results.failed} failed`);
  
  if (results.errors.length > 0) {
    console.log(`   ⚠️  Failed widgets: ${results.errors.join(', ')}`);
  }

  return results;
}

/**
 * Clean up all tracked resources
 */
export async function cleanupTrackedResources(client) {
  const tracker = getResourceTracker();
  const resources = tracker.getTrackedResources();
  
  if (resources.widgets.length === 0 && resources.tags.length === 0) {
    console.log('🧹 No tracked resources to cleanup');
    return { widgets: { success: 0, failed: 0 }, tags: { success: 0, failed: 0 } };
  }

  console.log(`🧹 Cleaning up tracked resources: ${resources.widgets.length} widgets, ${resources.tags.length} tags`);

  const results = {
    widgets: { success: 0, failed: 0, errors: [] },
    tags: { success: 0, failed: 0, errors: [] }
  };

  // Clean up widgets
  for (const { boardId, widgetId } of resources.widgets) {
    const success = await cleanupWidget(client, boardId, widgetId);
    
    if (success) {
      results.widgets.success++;
    } else {
      results.widgets.failed++;
      results.widgets.errors.push({ boardId, widgetId });
    }
  }

  // Clean up tags (if we add tag cleanup support later)
  for (const { boardId, tagId } of resources.tags) {
    try {
      // Note: Tag deletion not implemented yet in MuralClient
      console.log(`   ⏳ Tag cleanup not yet implemented: ${tagId}`);
      results.tags.failed++;
    } catch (error) {
      results.tags.failed++;
      results.tags.errors.push({ boardId, tagId });
    }
  }

  // Clear the tracker
  tracker.clear();

  console.log(`   📊 Final cleanup: Widgets ${results.widgets.success}✅/${results.widgets.failed}❌, Tags ${results.tags.success}✅/${results.tags.failed}❌`);

  return results;
}

/**
 * Emergency cleanup - finds and removes test widgets by text pattern
 */
export async function emergencyCleanup(client, boardId, textPattern = /Test|Integration|MCP/) {
  try {
    console.log(`🚨 Emergency cleanup on board ${boardId}...`);
    
    // Get all widgets
    const widgets = await client.getMuralWidgets(boardId);
    
    // Find test widgets by text pattern
    const testWidgets = widgets.filter(widget => 
      widget.text && textPattern.test(widget.text)
    );

    if (testWidgets.length === 0) {
      console.log('   ✅ No test widgets found for emergency cleanup');
      return { cleaned: 0, errors: [] };
    }

    console.log(`   🎯 Found ${testWidgets.length} test widget(s) to cleanup`);

    const results = await cleanupWidgets(
      client, 
      boardId, 
      testWidgets.map(w => w.id)
    );

    return {
      cleaned: results.success,
      errors: results.errors
    };

  } catch (error) {
    console.log(`   ❌ Emergency cleanup failed: ${error.message}`);
    return { cleaned: 0, errors: [error.message] };
  }
}

/**
 * Cleanup helper for test functions - use in try/finally blocks
 */
export function createCleanupHandler(client, tracker = null) {
  const resourceTracker = tracker || getResourceTracker();

  return async function cleanup() {
    if (resourceTracker === globalTracker) {
      await cleanupTrackedResources(client);
    } else {
      // Custom tracker cleanup
      const resources = resourceTracker.getTrackedResources();
      
      for (const { boardId, widgetId } of resources.widgets) {
        await cleanupWidget(client, boardId, widgetId);
      }
      
      resourceTracker.clear();
    }
  };
}

/**
 * Safe cleanup wrapper - ensures cleanup runs even if main function throws
 */
export async function withCleanup(mainFunction, cleanupFunction) {
  try {
    return await mainFunction();
  } finally {
    try {
      await cleanupFunction();
    } catch (cleanupError) {
      console.log(`⚠️  Cleanup error: ${cleanupError.message}`);
    }
  }
}

/**
 * Verify cleanup by checking if widgets still exist
 */
export async function verifyCleanup(client, boardId, widgetIds) {
  console.log(`🔍 Verifying cleanup of ${widgetIds.length} widget(s)...`);
  
  const stillExist = [];
  
  for (const widgetId of widgetIds) {
    try {
      await client.getMuralWidget(boardId, widgetId);
      stillExist.push(widgetId);
    } catch (error) {
      // Widget not found = successfully deleted
      continue;
    }
  }
  
  if (stillExist.length === 0) {
    console.log('   ✅ All widgets successfully cleaned up');
    return true;
  } else {
    console.log(`   ⚠️  ${stillExist.length} widget(s) still exist: ${stillExist.join(', ')}`);
    return false;
  }
}