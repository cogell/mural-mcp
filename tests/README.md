# Modular E2E Test Suite

This directory contains a comprehensive, modular test suite for the Mural MCP Server. Each MCP tool has its own atomic test file for focused, maintainable testing.

## Quick Start

### Using npm/pnpm scripts (recommended):
```bash
# Run all tests
pnpm test

# Run tests in parallel (faster)
pnpm run test:parallel

# Run specific tool test
pnpm run test:tool create-sticky-notes
```

### Direct usage:
```bash
# Run all tests
node run-tests.js

# Run specific tool test
node run-tests.js --tool=create-sticky-notes

# Run tests in parallel (faster)
node run-tests.js --parallel

# Run with verbose output
node run-tests.js --tool=test-connection --verbose
```

## Test Structure

### Atomic E2E Tests (`e2e/`)
One test file per MCP tool, following the pattern `{tool-name}.test.js`:

#### Core Workspace/Board Tools
- `list-workspaces.test.js` - Test workspace listing with pagination
- `get-workspace.test.js` - Test individual workspace retrieval  
- `list-workspace-boards.test.js` - Test board listing within workspaces
- `list-room-boards.test.js` - Test board listing within rooms
- `get-board.test.js` - Test individual board retrieval

#### Authentication & System Tools
- `test-connection.test.js` ✅ - Test API connectivity validation
- `clear-auth.test.js` - Test authentication token clearing
- `debug-api-response.test.js` - Test debugging information retrieval
- `get-rate-limit-status.test.js` - Test rate limiting status
- `check-user-scopes.test.js` - Test OAuth scope validation

#### Content Operations Tools
- `get-mural-widgets.test.js` - Test widget listing from murals
- `get-mural-widget.test.js` - Test individual widget retrieval
- `create-sticky-notes.test.js` ✅ - Test sticky note creation
- `update-sticky-note.test.js` - Test sticky note updates
- `delete-widget.test.js` - Test widget deletion

### Shared Helpers (`helpers/`)
Reusable utilities to eliminate code duplication:

- `mcp-client.js` - Unified MCP JSON-RPC client for tool calls
- `test-setup.js` - Environment validation and workspace/board discovery
- `fixtures.js` - Reusable test data and scenarios
- `cleanup.js` - Resource cleanup and tracking utilities

### Legacy Tests (`archive/`)
Previous test files preserved for reference and migration.

## Environment Setup

### Environment Variables
Create a `.env` file in the project root or set environment variables:

```bash
# .env file
MURAL_CLIENT_ID=your-client-id
MURAL_CLIENT_SECRET=your-client-secret
MURAL_REDIRECT_URI=http://localhost:3000/callback  # optional
```

Or export them manually:
```bash
export MURAL_CLIENT_ID="your-client-id"
export MURAL_CLIENT_SECRET="your-client-secret"  # recommended
export MURAL_REDIRECT_URI="http://localhost:3000/callback"  # optional
```

**Note**: Environment variables are automatically loaded from `.env` files when using the test runner or running individual tests directly.

### Required OAuth Scopes
Different tests require different scopes:

- **Basic tests**: No special scopes needed
- **Workspace tests**: `workspaces:read`
- **Board tests**: `murals:read` 
- **Content tests**: `murals:read`, `murals:write`

## Test Runner Features

### Individual Tool Testing
```bash
# Test specific MCP tool
node run-tests.js --tool=create-sticky-notes
```

### Full Suite Testing  
```bash
# Run all available tests
node run-tests.js

# Run in parallel for speed
node run-tests.js --parallel
```

### Detailed Reporting
- ✅/❌ Pass/fail status for each test
- 📊 Success rate percentage
- ⏱️ Individual and total execution times
- 📋 Detailed failure information

## Writing New Tests

### Adding a New Tool Test

1. **Create test file**: `e2e/{tool-name}.test.js`
2. **Import helpers**:
   ```javascript
   import { getTestEnvironment } from '../helpers/test-setup.js';
   import { fixtures } from '../helpers/fixtures.js';
   ```
3. **Follow the pattern**:
   ```javascript
   export async function testMyToolName() {
     // Test setup
     // Multiple test scenarios  
     // Error handling
     // Results summary
   }
   ```
4. **Add standalone execution**:
   ```javascript
   if (import.meta.url === `file://${process.argv[1]}`) {
     testMyToolName().then(success => process.exit(success ? 0 : 1));
   }
   ```

### Test Structure Template
Each atomic test follows this structure:

- **Setup**: Environment validation and resource discovery
- **Test Cases**: Multiple scenarios (happy path, edge cases, errors)
- **Cleanup**: Automatic resource cleanup using helpers
- **Results**: Detailed pass/fail reporting with specific error details

## Benefits of This Structure

### For Development
- 🎯 **Focused Testing** - Run only the test for the tool you're working on
- ⚡ **Fast Iteration** - Individual tests run quickly
- 🔍 **Clear Failures** - Know exactly which tool and scenario failed
- 📝 **Easy Debugging** - Isolated test scope per tool

### For Maintenance
- 📚 **Readable** - Clear naming and single responsibility per file
- 🔧 **Maintainable** - Easy to modify individual tool tests
- 📈 **Scalable** - Linear growth with MCP tool additions
- 🎯 **Predictable** - One-to-one mapping between MCP tools and tests

### For CI/CD
- 🏃 **Parallel Execution** - Run tests concurrently for speed
- 🎯 **Selective Testing** - Run subsets based on changes
- 📊 **Clear Reporting** - Detailed pass/fail status per tool
- 🛡️ **Reliable** - Isolated failures don't affect other tests

## Migration from Legacy Tests

The previous test files have been preserved in `archive/` and their proven test scenarios have been extracted into the new modular structure:

### Key Migrations
- `integration-adaptive-crud.js` → Multiple atomic tool tests
- `integration-mcp-sticky-note-crud.js` → Tool-specific tests with MCP client  
- Various `test-*.js` debug files → Consolidated error scenarios in atomic tests

### Preserved Functionality
- ✅ All test scenarios from legacy files
- ✅ Environment discovery logic (now in `helpers/test-setup.js`)
- ✅ Cleanup patterns (now in `helpers/cleanup.js`)
- ✅ Error handling approaches
- ✅ OAuth scope validation

## Troubleshooting

### Common Issues

**Environment Variables Missing**
```bash
❌ MURAL_CLIENT_ID environment variable is required
```
Solution: Set up your `.env` file or export environment variables

**OAuth Scope Issues**
```bash
❌ Missing required OAuth scopes: murals:write
```
Solution: Re-authenticate with proper scopes using MCP inspector

**No Test Files Found**
```bash
❌ No test files found in e2e/ directory  
```
Solution: Ensure you're running from the `tests/` directory

**Individual Test Failures**
- Check the specific error messages in the test output
- Verify your test environment has the required resources (workspaces, boards)
- Ensure OAuth scopes match the test requirements

### Debug Mode
```bash
# Run single test with verbose output
node run-tests.js --tool=test-connection --verbose

# Run individual test file directly  
node e2e/test-connection.test.js
```

## Next Steps

This modular structure provides the foundation for:
1. **Adding new MCP tool tests** as the server grows
2. **Integration with CI/CD** pipelines
3. **Performance testing** with parallel execution
4. **Regression testing** with selective test runs

The atomic test structure ensures that as the Mural MCP server evolves, the test suite remains maintainable, focused, and reliable.