# Legacy Test Files Archive

This directory contains the original test files that were used during the development and debugging of the Mural MCP server. These files have been preserved for reference and historical context.

## Archive Contents

### Integration Tests (Comprehensive)
- `integration-adaptive-crud.js` - Comprehensive CRUD test with environment discovery
- `integration-mcp-sticky-note-crud.js` - Full MCP tool integration testing  
- `integration-sticky-note-crud.js` - Direct client CRUD testing

### Debug & Analysis Scripts
- `debug-sticky-notes.js` - Debugging payload structure issues
- `analyze-creation-capability.js` - OAuth scope and creation capability analysis
- `inspect-widget-structure.js` - Widget structure analysis

### Specific API Testing
- `test-content-api.js` - RESTful endpoint testing
- `test-widgets.js` - Widget retrieval operations
- `test-endpoint-variants.js` - Different endpoint URL patterns

### Payload Structure Testing
- `test-correct-payload.js` - Various payload formats
- `test-correct-array-payload.js` - Direct array payloads  
- `test-shape-payload.js` - Shape-based payloads
- `test-with-shape-field.js` - Required shape field testing
- `test-legacy-create-endpoints.js` - Action-based endpoints

### Update Operations Testing
- `test-update-sticky-note.js` - Basic update testing
- `test-update-sticky-note-mcp-tool.js` - MCP tool update testing
- `test-update-sticky-note-comprehensive.js` - Comprehensive update scenarios
- `run-update-tests.js` - Update test runner

## Migration to Modular Structure

These files served their purpose in debugging and validating the MCP server implementation. Their key insights and test scenarios have been extracted and incorporated into the new modular structure:

### Key Learnings Preserved
1. **API Payload Structure** - Direct array format `[{...}]` not wrapped `{widgets: [{...}]}`
2. **Required Fields** - Sticky notes require `shape: "rectangle"` field
3. **Environment Discovery** - Adaptive workspace/board finding logic
4. **OAuth Scope Validation** - Proper scope checking patterns  
5. **Error Handling** - Comprehensive error scenario coverage
6. **Cleanup Patterns** - Resource cleanup and tracking

### Extracted Patterns
- **Environment Setup** → `helpers/test-setup.js`
- **MCP Client Logic** → `helpers/mcp-client.js`  
- **Test Data** → `helpers/fixtures.js`
- **Cleanup Logic** → `helpers/cleanup.js`
- **Individual Tool Tests** → `e2e/*.test.js`

## Using Legacy Files

These files can still be run for debugging or reference purposes:

```bash
# Example: Run legacy comprehensive test
node archive/integration-adaptive-crud.js

# Example: Debug payload structures  
node archive/debug-sticky-notes.js

# Example: Analyze widget structures
node archive/inspect-widget-structure.js
```

**Note**: These files may require the old test environment and won't benefit from the new helper infrastructure.

## Historical Context

These files were created during:
- Initial MCP server development
- API endpoint debugging (RESTful vs legacy)
- Sticky note creation 400 error resolution  
- Update operation implementation
- OAuth scope validation work

They represent the iterative debugging process that led to a working, comprehensive MCP server implementation.

## Preservation Rationale

These files are preserved because they:
1. **Document the debugging process** that led to solutions
2. **Contain working test scenarios** that validate specific edge cases
3. **Serve as reference** for similar future debugging
4. **Maintain git history** of the development process
5. **Provide fallback** if new modular tests miss scenarios

The transition to modular testing doesn't discard this work but rather builds upon it to create a more maintainable, scalable testing framework.