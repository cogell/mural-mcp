#!/usr/bin/env node

import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root when running from tests directory
const envPath = process.cwd().includes('/tests') 
  ? path.resolve('../.env')
  : path.resolve('.env');
dotenv.config({ path: envPath });

import { getBasicTestEnvironment } from '../helpers/test-setup.js';
import { PaginationScenarios } from '../helpers/fixtures.js';

/**
 * E2E Test: list-workspaces MCP Tool
 * 
 * Tests the list-workspaces tool with various pagination scenarios
 */
export async function testListWorkspacesTool() {
  console.log('🧪 Testing: list-workspaces MCP tool');
  console.log('=' .repeat(50));
  
  const testResults = {
    passed: 0,
    failed: 0,
    total: 0,
    details: []
  };

  function addResult(name, success, details = '') {
    testResults.total++;
    if (success) {
      testResults.passed++;
      console.log(`   ✅ ${name}`);
    } else {
      testResults.failed++;
      console.log(`   ❌ ${name}: ${details}`);
    }
    testResults.details.push({ name, success, details });
  }

  try {
    // Setup environment with workspace read scope
    const { mcpClient } = await getBasicTestEnvironment(['workspaces:read']);

    // Test 1: Basic list workspaces (no parameters)
    console.log('\n📋 Test 1: Basic list workspaces');
    try {
      const response = await mcpClient.callTool('list-workspaces');
      
      if (response.error) {
        addResult('Basic list call', false, response.error.message);
      } else {
        const data = mcpClient.parseResponse(response);
        
        // Check response structure
        const hasWorkspaces = Array.isArray(data.workspaces);
        addResult('Response has workspaces array', hasWorkspaces);
        
        const hasCount = typeof data.count === 'number';
        addResult('Response has count field', hasCount);
        
        const hasMessage = typeof data.message === 'string';
        addResult('Response has message field', hasMessage);
        
        if (hasWorkspaces && hasCount) {
          const countMatches = data.workspaces.length === data.count;
          addResult('Count matches array length', countMatches,
            countMatches ? '' : `Array: ${data.workspaces.length}, Count: ${data.count}`);
          
          // Check workspace structure if we have workspaces
          if (data.workspaces.length > 0) {
            const firstWorkspace = data.workspaces[0];
            const hasId = typeof firstWorkspace.id === 'string';
            const hasName = typeof firstWorkspace.name === 'string';
            
            addResult('Workspace has id field', hasId);
            addResult('Workspace has name field', hasName);
            
            console.log(`      Found ${data.workspaces.length} workspace(s)`);
          }
        }
      }
    } catch (error) {
      addResult('Basic list call', false, error.message);
    }

    // Test 2: Pagination scenarios (limit only - API doesn't support offset)
    console.log('\n📄 Test 2: Pagination scenarios');
    for (const scenario of PaginationScenarios) {
      try {
        const args = {};
        if (scenario.limit !== undefined) args.limit = scenario.limit;
        // Note: offset is not supported by Mural API, only test limit
        
        const response = await mcpClient.callTool('list-workspaces', args);
        
        if (response.error) {
          addResult(`Pagination: ${scenario.description}`, false, response.error.message);
        } else {
          const data = mcpClient.parseResponse(response);
          
          // Check if this is an error response (has error field but no workspaces/count)
          if (data.error) {
            addResult(`Pagination: ${scenario.description}`, false, data.message || 'API error response');
          } else {
            const validPagination = Array.isArray(data.workspaces) && typeof data.count === 'number';
            
            addResult(`Pagination: ${scenario.description}`, validPagination,
              validPagination ? `${data.count} workspaces` : 
              `Invalid response structure - got: ${JSON.stringify({
                workspaces: Array.isArray(data.workspaces),
                count: typeof data.count,
                message: typeof data.message,
                hasError: !!data.error
              })}`);
          }
        }
      } catch (error) {
        addResult(`Pagination: ${scenario.description}`, false, error.message);
      }
    }

    // Test 3: Boundary value testing
    console.log('\n🔢 Test 3: Boundary value testing');
    
    // Test minimum limit
    try {
      const response = await mcpClient.callTool('list-workspaces', { limit: 1 });
      const data = mcpClient.parseResponse(response);
      const validMin = Array.isArray(data.workspaces) && data.workspaces.length <= 1;
      
      addResult('Minimum limit (1)', validMin);
    } catch (error) {
      addResult('Minimum limit (1)', false, error.message);
    }

    // Test maximum limit
    try {
      const response = await mcpClient.callTool('list-workspaces', { limit: 100 });
      const data = mcpClient.parseResponse(response);
      const validMax = Array.isArray(data.workspaces) && data.workspaces.length <= 100;
      
      addResult('Maximum limit (100)', validMax);
    } catch (error) {
      addResult('Maximum limit (100)', false, error.message);
    }

    // Test 4: Error scenarios
    console.log('\n❌ Test 4: Error scenarios');
    
    // Test invalid limit (too high)
    try {
      const response = await mcpClient.callTool('list-workspaces', { limit: 1000 });
      
      if (response.error) {
        addResult('Invalid limit (1000) handling', true, 'MCP error correctly returned');
      } else {
        const data = mcpClient.parseResponse(response);
        const shouldError = !!data.error;
        
        addResult('Invalid limit (1000) rejected', shouldError,
          shouldError ? 'Correctly rejected' : 'Should have been rejected');
      }
    } catch (error) {
      addResult('Invalid limit (1000) handling', true, 'Error correctly thrown');
    }

    // Test invalid limit (negative)
    try {
      const response = await mcpClient.callTool('list-workspaces', { limit: -1 });
      
      if (response.error) {
        addResult('Negative limit handling', true, 'MCP error correctly returned');
      } else {
        const data = mcpClient.parseResponse(response);
        const shouldError = !!data.error;
        
        addResult('Negative limit rejected', shouldError,
          shouldError ? 'Correctly rejected' : 'Should have been rejected');
      }
    } catch (error) {
      addResult('Negative limit handling', true, 'Error correctly thrown');
    }

    // Note: offset parameter is not supported by Mural API, so we don't test it

  } catch (error) {
    addResult('Environment setup', false, error.message);
  }

  // Results summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Results Summary');
  console.log('='.repeat(50));
  console.log(`Total tests: ${testResults.total}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  
  const successRate = testResults.total > 0 ? 
    (testResults.passed / testResults.total * 100).toFixed(1) : 0;
  console.log(`📈 Success rate: ${successRate}%`);

  if (testResults.failed === 0) {
    console.log('\n🎉 list-workspaces tool working correctly!');
    return true;
  } else {
    console.log('\n⚠️  Some tests failed. Check details above.');
    return false;
  }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testListWorkspacesTool()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('❌ Test execution failed:', error.message);
      process.exit(1);
    });
}