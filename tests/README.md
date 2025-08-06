# Test Scripts

This directory contains test scripts used to debug and verify the Mural Contents API implementation.

## Test Categories

### API Endpoint Testing
- `test-widgets.js` - Tests widget retrieval operations
- `test-content-api.js` - Comprehensive test of all content API endpoints
- `test-endpoint-variants.js` - Tests different endpoint URL patterns

### Sticky Note Creation Debugging
- `debug-sticky-notes.js` - Debug payload structure issues
- `test-correct-payload.js` - Tests various payload formats
- `test-correct-array-payload.js` - Tests direct array payloads
- `test-shape-payload.js` - Tests shape-based payloads
- `test-with-shape-field.js` - Tests with required shape field
- `test-legacy-create-endpoints.js` - Tests action-based endpoints

### PATCH/Update Operations Testing
- `test-update-sticky-note.js` - Tests update-sticky-note MuralClient methods
- `test-update-sticky-note-mcp-tool.js` - Tests update-sticky-note MCP tool functionality
- `test-update-sticky-note-comprehensive.js` - Comprehensive edge case and validation testing

### Analysis & Inspection
- `analyze-creation-capability.js` - Analyzes OAuth scopes and creation capabilities
- `inspect-widget-structure.js` - Analyzes existing widget structures

## Key Discoveries

These tests helped resolve the sticky note creation 400 error by discovering:

1. **Payload Structure**: API expects direct array `[{...}]` not wrapped object `{widgets: [{...}]}`
2. **Required Fields**: Sticky notes require `shape: "rectangle"` field
3. **Working Endpoints**: RESTful endpoints work for read operations, creation has specific requirements

## Running Tests

```bash
# Test basic widget operations
node tests/test-widgets.js

# Test comprehensive content API
node tests/test-content-api.js

# Test update-sticky-note functionality
node tests/test-update-sticky-note.js

# Test update-sticky-note MCP tool
node tests/test-update-sticky-note-mcp-tool.js

# Run comprehensive update tests
node tests/test-update-sticky-note-comprehensive.js

# Analyze existing widget structures  
node tests/inspect-widget-structure.js
```

## Environment Requirements

All tests require:
- `MURAL_CLIENT_ID` environment variable
- `MURAL_CLIENT_SECRET` environment variable  
- OAuth tokens stored in `~/.mural-mcp-tokens.json`
- `murals:read` and `murals:write` scopes

### Update Operation Tests

The PATCH/Update operation tests have additional requirements:
- `murals:write` scope is mandatory (validated before testing)
- Access to at least one workspace with at least one board
- Tests create temporary widgets for testing and clean them up afterwards

## Test Coverage

### update-sticky-note Tests Cover:
- **Core Operations**: Text, position, size, and style updates
- **Error Handling**: Invalid IDs, malformed data, validation failures
- **Edge Cases**: Extreme values, special characters, concurrent updates
- **MCP Integration**: Tool registration, input validation, response formatting
- **Data Integrity**: Persistence verification, state consistency
- **Performance**: Sequential updates, rate limit awareness