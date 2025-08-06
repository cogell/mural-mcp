#!/usr/bin/env node

/**
 * Test Fixtures - Reusable test data
 * 
 * Centralized test data structures to ensure consistency across tests
 * and make it easy to modify test data in one place.
 */

/**
 * Generate a timestamp-based identifier for test isolation
 */
export function generateTestId() {
  return `Test_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

/**
 * Basic sticky note for testing
 */
export const BasicStickyNote = {
  x: 100,
  y: 100,
  text: 'Basic Test Sticky Note',
  width: 180,
  height: 120
};

/**
 * Styled sticky note with custom colors and fonts
 * Note: Style customization will be handled by API defaults
 */
export const StyledStickyNote = {
  x: 250,
  y: 150,
  text: 'Styled Test Note',
  width: 200,
  height: 140
};

/**
 * Minimal sticky note with only required fields
 */
export const MinimalStickyNote = {
  x: 50,
  y: 50,
  text: 'Minimal Note'
};

/**
 * Create a unique sticky note with timestamp in text
 */
export function createTestStickyNote(overrides = {}) {
  const testId = generateTestId();
  
  return {
    x: 100 + Math.floor(Math.random() * 200), // Random position to avoid overlap
    y: 100 + Math.floor(Math.random() * 200),
    text: `Test Sticky Note - ${testId}`,
    width: 180,
    height: 120,
    ...overrides // Allow override of any properties
  };
}

/**
 * Create multiple unique sticky notes
 */
export function createTestStickyNotes(count = 1, baseOptions = {}) {
  return Array.from({ length: count }, (_, index) => 
    createTestStickyNote({
      x: 100 + (index * 50), // Spread horizontally
      y: 100 + (index * 30), // Slight vertical offset
      text: `Test Note ${index + 1} - ${generateTestId()}`,
      ...baseOptions
    })
  );
}

/**
 * Common update payloads for testing sticky note updates
 */
export const StickyNoteUpdates = {
  textOnly: {
    text: `Updated Text - ${generateTestId()}`
  },
  
  positionOnly: {
    x: 300,
    y: 250
  },
  
  styleOnly: {
    style: {
      backgroundColor: '#FFCCCC',
      fontSize: 16
    }
  },
  
  sizeOnly: {
    width: 250,
    height: 180
  },
  
  comprehensive: {
    x: 350,
    y: 300,
    text: `Comprehensive Update - ${generateTestId()}`,
    width: 220,
    height: 160,
    style: {
      backgroundColor: '#CCFFCC',
      textColor: '#333333',
      fontSize: 15
    }
  }
};

/**
 * Invalid payloads for error testing
 */
export const InvalidPayloads = {
  missingText: {
    x: 100,
    y: 100
    // Missing required 'text' field
  },
  
  missingPosition: {
    text: 'Missing Position'
    // Missing x, y coordinates
  },
  
  invalidCoordinates: {
    x: 'not-a-number',
    y: 'also-not-a-number',
    text: 'Invalid Coords'
  },
  
  emptyText: {
    x: 100,
    y: 100,
    text: ''
  }
};

/**
 * Test scenarios for pagination testing
 * Note: Mural API only supports 'limit' parameter, not 'offset'
 */
export const PaginationScenarios = [
  { limit: 1, description: 'Limit to 1 workspace' },
  { limit: 2, description: 'Limit to 2 workspaces' },
  { limit: 5, description: 'Limit to 5 workspaces' },
  { limit: 10, description: 'Large limit (10 workspaces)' },
  { limit: undefined, offset: undefined, description: 'Default pagination (no limit)' }
];

/**
 * Common error scenarios for testing
 */
export const ErrorScenarios = {
  invalidMuralId: {
    muralId: 'invalid-mural-id-12345',
    description: 'Non-existent mural ID'
  },
  
  invalidWidgetId: {
    widgetId: 'invalid-widget-id-12345', 
    description: 'Non-existent widget ID'
  },
  
  invalidWorkspaceId: {
    workspaceId: 'invalid-workspace-id-12345',
    description: 'Non-existent workspace ID'
  },
  
  malformedId: {
    muralId: null,
    description: 'Null/malformed ID'
  }
};

/**
 * Performance test configurations
 */
export const PerformanceTests = {
  bulkCreate: {
    count: 50,
    description: 'Create 50 sticky notes at once'
  },
  
  sequentialUpdates: {
    count: 10,
    description: 'Perform 10 sequential updates'
  },
  
  largeText: {
    text: 'Large text content: ' + 'Lorem ipsum '.repeat(100),
    description: 'Test with large text content'
  }
};

/**
 * Helper to generate timestamp-based test content
 */
export function timestampedText(prefix = 'Test') {
  return `${prefix} - ${new Date().toISOString()}`;
}

/**
 * Helper to create coordinates within bounds
 */
export function randomCoordinates(maxX = 800, maxY = 600) {
  return {
    x: Math.floor(Math.random() * maxX),
    y: Math.floor(Math.random() * maxY)
  };
}