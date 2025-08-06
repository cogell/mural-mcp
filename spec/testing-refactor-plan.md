# Testing Refactor Plan: Modular E2E Test Suite

## Overview

This document outlines the refactoring plan to transform the current organic test collection into a systematic, scalable testing framework that directly mirrors the 15 MCP tools defined in `src/index.ts`.

## Current State Analysis

### Issues with Current Test Structure

1. **Mixed Concerns** - Debug scripts mixed with actual tests
2. **Redundancy** - Multiple files testing same functionality (sticky note CRUD)
3. **Complex Naming** - Hard to understand what each test covers (`integration-adaptive-crud.js`, `test-update-sticky-note-comprehensive.js`)
4. **No Clear Organization** - Tests not aligned with MCP tools structure
5. **Manual Setup** - Each test reinvents environment setup and teardown

### Current Files to be Refactored

- `integration-adaptive-crud.js` - Comprehensive CRUD test (extract to multiple atomic tests)
- `integration-mcp-sticky-note-crud.js` - MCP tool integration test (extract to tool-specific tests)
- `integration-sticky-note-crud.js` - Direct client test (repurpose as helper validation)
- `test-*` files - Various debugging and validation scripts (archive separately)

## Target Architecture

### New Directory Structure

```
tests/
├── e2e/                          # One test file per MCP tool (atomic)
│   ├── list-workspaces.test.js
│   ├── get-workspace.test.js
│   ├── test-connection.test.js
│   ├── clear-auth.test.js
│   ├── debug-api-response.test.js
│   ├── get-rate-limit-status.test.js
│   ├── list-workspace-boards.test.js
│   ├── list-room-boards.test.js
│   ├── get-board.test.js
│   ├── check-user-scopes.test.js
│   ├── get-mural-widgets.test.js
│   ├── get-mural-widget.test.js
│   ├── delete-widget.test.js
│   ├── create-sticky-notes.test.js
│   └── update-sticky-note.test.js
├── helpers/                      # Shared utilities
│   ├── mcp-client.js            # MCP JSON-RPC client helper
│   ├── test-setup.js            # Common setup/teardown
│   ├── fixtures.js              # Test data fixtures
│   └── cleanup.js               # Resource cleanup utilities
├── archive/                     # Legacy debug scripts (preserved)
├── run-tests.js                 # Test runner with selective execution
└── README.md                    # Clear testing documentation
```

## Design Principles

### 1. Atomic Tests - One File Per MCP Tool

Each `*.test.js` file focuses on exactly one MCP tool from `src/index.ts`:

- ✅ Easy to run individual tool tests
- ✅ Clear what functionality is being tested  
- ✅ Simple to add new tool tests as MCP server expands
- ✅ Isolated failures don't affect other tool tests

### 2. Shared Utilities - DRY Approach

```javascript
// helpers/mcp-client.js - Unified MCP JSON-RPC client
export class MCPTestClient {
  async callTool(toolName, args) {
    // Standard MCP JSON-RPC call logic with error handling
  }
}

// helpers/test-setup.js - Common setup patterns
export async function getTestEnvironment() {
  // Find workspace, board, handle auth, validate scopes
}

// helpers/fixtures.js - Reusable test data
export const TestStickyNote = {
  x: 100, y: 100, 
  text: 'Test Note', 
  shape: 'rectangle'
}
```

### 3. Individual Test Structure Template

```javascript
// e2e/create-sticky-notes.test.js
import { MCPTestClient } from '../helpers/mcp-client.js';
import { getTestEnvironment, cleanup } from '../helpers/test-setup.js';
import { TestStickyNote } from '../helpers/fixtures.js';

export async function testCreateStickyNotes() {
  const { client, board } = await getTestEnvironment();
  
  try {
    // Test 1: Happy path
    const result = await client.callTool('create-sticky-notes', {
      muralId: board.id,
      stickyNotes: [TestStickyNote]
    });
    
    // Test 2: Validation errors
    // Test 3: Edge cases
    
    return { passed: true, details: 'All tests passed' };
  } finally {
    await cleanup();
  }
}
```

## Implementation Phases

### Phase 1: Create Helper Infrastructure

1. **Create `helpers/mcp-client.js`**
   - Extract MCP JSON-RPC calling logic from existing tests
   - Standardize request/response handling
   - Add timeout and error handling

2. **Create `helpers/test-setup.js`**
   - Extract environment discovery logic from `integration-adaptive-crud.js`
   - Standardize workspace/board finding
   - Add OAuth scope validation

3. **Create `helpers/fixtures.js`**
   - Standardize test data structures
   - Reusable sticky note, board, and other test objects

4. **Create `helpers/cleanup.js`**
   - Centralized resource cleanup logic
   - Widget deletion, test data removal

### Phase 2: Create Atomic E2E Tests

Create one test file for each of the 15 MCP tools:

#### Core Workspace/Board Tools
- `list-workspaces.test.js` - Test workspace listing with pagination
- `get-workspace.test.js` - Test individual workspace retrieval
- `list-workspace-boards.test.js` - Test board listing within workspaces
- `list-room-boards.test.js` - Test board listing within rooms
- `get-board.test.js` - Test individual board retrieval

#### Authentication & System Tools  
- `test-connection.test.js` - Test API connectivity validation
- `clear-auth.test.js` - Test authentication token clearing
- `debug-api-response.test.js` - Test debugging information retrieval
- `get-rate-limit-status.test.js` - Test rate limiting status
- `check-user-scopes.test.js` - Test OAuth scope validation

#### Content Operations Tools
- `get-mural-widgets.test.js` - Test widget listing from murals
- `get-mural-widget.test.js` - Test individual widget retrieval
- `create-sticky-notes.test.js` - Test sticky note creation
- `update-sticky-note.test.js` - Test sticky note updates
- `delete-widget.test.js` - Test widget deletion

### Phase 3: Create Test Runner

1. **Create `run-tests.js`**
   - Selective test execution (`--tool=create-sticky-notes`)
   - Full suite execution
   - Parallel execution capabilities
   - Clear reporting and exit codes

2. **Update `README.md`**
   - Clear instructions for running individual/all tests
   - Environment setup requirements
   - Troubleshooting guide

### Phase 4: Archive Legacy Tests

1. **Create `archive/` directory**
2. **Move existing test files to archive**
   - Preserve all current debugging scripts
   - Maintain git history
   - Document what each archived file was used for

## Benefits of This Refactored Approach

### For Development
- ✅ **Fast Iteration** - Run single tool tests during development
- ✅ **Clear Failures** - Know exactly which tool broke
- ✅ **Easy Debugging** - Focused test scope per tool
- ✅ **Simple Addition** - Add `new-tool.test.js` when you add MCP tools

### For Maintenance  
- ✅ **Readable** - Clear naming and single responsibility
- ✅ **Maintainable** - Easy to modify individual tool tests
- ✅ **Scalable** - Linear growth with MCP tool additions
- ✅ **Predictable** - One-to-one mapping between tools and tests

### for CI/CD
- ✅ **Focused** - Pure e2e testing of MCP interface
- ✅ **Reliable** - Isolated test failures
- ✅ **Informative** - Clear test reports per tool
- ✅ **Flexible** - Run subsets based on changes

## Migration Strategy

### Preserve Existing Work
- All current test files moved to `archive/` (not deleted)
- Extract proven patterns and test cases into new structure
- Maintain comprehensive test coverage during transition

### Implementation Order
1. Build helpers first (foundation)
2. Create 2-3 key tool tests to validate pattern
3. Bulk create remaining tool tests
4. Build test runner and documentation
5. Archive legacy files

### Validation
- Ensure new tests cover all scenarios from legacy tests  
- Maintain or improve test coverage metrics
- Verify all 15 MCP tools have corresponding test files

## Success Criteria

- ✅ 15 atomic test files (one per MCP tool)
- ✅ Shared helper utilities eliminate code duplication
- ✅ Test runner enables selective and full suite execution
- ✅ Clear documentation for new developers
- ✅ All legacy test scenarios preserved in new structure
- ✅ Faster development iteration with focused tests