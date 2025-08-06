#!/usr/bin/env node

import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root when running from tests directory
const envPath = process.cwd().includes('/tests') 
  ? path.resolve('../.env')
  : path.resolve('.env');
dotenv.config({ path: envPath });

import { getBasicTestEnvironment } from '../helpers/test-setup.js';

/**
 * E2E Test: test-connection MCP Tool
 * 
 * Tests the test-connection tool which validates API connectivity
 */
export async function testConnectionTool() {
  console.log('🧪 Testing: test-connection MCP tool');
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
    // Setup basic environment (no special scopes needed for connection test)
    const { mcpClient } = await getBasicTestEnvironment();

    // Test 1: Basic connection test
    console.log('\\n📡 Test 1: Basic connection test');
    try {
      const response = await mcpClient.callTool('test-connection');
      
      if (response.error) {
        addResult('Basic connection call', false, response.error.message);
      } else {
        const data = mcpClient.parseResponse(response);
        const isConnected = data.connected === true;
        
        addResult('Connection successful', isConnected, 
          isConnected ? data.message : 'Connection returned false');
        
        // Verify response structure
        const hasMessage = typeof data.message === 'string';
        addResult('Response has message field', hasMessage);
        
        const hasConnectedField = 'connected' in data;
        addResult('Response has connected field', hasConnectedField);
      }
    } catch (error) {
      addResult('Basic connection call', false, error.message);
    }

    // Test 2: Response time test
    console.log('\\n⏱️  Test 2: Response time test');
    try {
      const startTime = Date.now();
      const response = await mcpClient.callTool('test-connection');
      const responseTime = Date.now() - startTime;
      
      const isReasonableTime = responseTime < 10000; // Should respond within 10 seconds
      addResult(`Response time reasonable (${responseTime}ms)`, isReasonableTime,
        isReasonableTime ? '' : 'Response took too long');
        
    } catch (error) {
      addResult('Response time test', false, error.message);
    }

    // Test 3: Multiple consecutive calls (ensure consistent)
    console.log('\\n🔄 Test 3: Multiple consecutive calls');
    try {
      const results = [];
      
      for (let i = 0; i < 3; i++) {
        const response = await mcpClient.callTool('test-connection');
        const data = mcpClient.parseResponse(response);
        results.push(data.connected);
      }
      
      const allSucceeded = results.every(connected => connected === true);
      addResult('Multiple calls consistent', allSucceeded,
        allSucceeded ? '' : `Results: ${results.join(', ')}`);
        
    } catch (error) {
      addResult('Multiple calls test', false, error.message);
    }

  } catch (error) {
    addResult('Environment setup', false, error.message);
  }

  // Results summary
  console.log('\\n' + '='.repeat(50));
  console.log('📊 Test Results Summary');
  console.log('='.repeat(50));
  console.log(`Total tests: ${testResults.total}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  
  const successRate = testResults.total > 0 ? 
    (testResults.passed / testResults.total * 100).toFixed(1) : 0;
  console.log(`📈 Success rate: ${successRate}%`);

  if (testResults.failed === 0) {
    console.log('\\n🎉 test-connection tool working correctly!');
    return true;
  } else {
    console.log('\\n⚠️  Some tests failed. Check details above.');
    return false;
  }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testConnectionTool()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('❌ Test execution failed:', error.message);
      process.exit(1);
    });
}