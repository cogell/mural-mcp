#!/usr/bin/env node

/**
 * Test runner for update-sticky-note functionality
 * Runs all update-related tests in sequence with proper error handling
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tests = [
  {
    name: 'Basic MuralClient Methods',
    file: 'test-update-sticky-note.js',
    description: 'Tests the core updateStickyNote method functionality'
  },
  {
    name: 'MCP Tool Integration', 
    file: 'test-update-sticky-note-mcp-tool.js',
    description: 'Tests the update-sticky-note MCP tool via JSON-RPC'
  },
  {
    name: 'Comprehensive Test Suite',
    file: 'test-update-sticky-note-comprehensive.js', 
    description: 'Full test coverage including edge cases and validation'
  }
];

function runTest(testFile) {
  return new Promise((resolve, reject) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🧪 Running: ${testFile}`);
    console.log('='.repeat(60));
    
    const testProcess = spawn('node', [path.join(__dirname, testFile)], {
      stdio: 'inherit',
      env: process.env
    });
    
    testProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${testFile} completed successfully`);
        resolve(code);
      } else {
        console.log(`❌ ${testFile} failed with code ${code}`);
        reject(new Error(`Test failed with code ${code}`));
      }
    });
    
    testProcess.on('error', (error) => {
      console.log(`❌ ${testFile} failed to start: ${error.message}`);
      reject(error);
    });
  });
}

async function runAllTests() {
  console.log('🚀 Starting update-sticky-note test suite...');
  console.log(`📅 ${new Date().toISOString()}`);
  
  // Check environment first
  if (!process.env.MURAL_CLIENT_ID) {
    console.error('❌ MURAL_CLIENT_ID environment variable is required');
    console.error('💡 Please set up your environment variables before running tests');
    process.exit(1);
  }
  
  console.log('✅ Environment check passed');
  
  const results = {
    total: tests.length,
    passed: 0,
    failed: 0
  };
  
  for (const test of tests) {
    try {
      console.log(`\n📋 ${test.name}: ${test.description}`);
      await runTest(test.file);
      results.passed++;
    } catch (error) {
      console.error(`❌ ${test.name} failed:`, error.message);
      results.failed++;
      
      // Ask if user wants to continue
      console.log('\n❓ Continue with remaining tests? (Press Ctrl+C to stop)');
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second pause
    }
  }
  
  // Final summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUITE SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${results.total}`);
  console.log(`✅ Passed:   ${results.passed}`);
  console.log(`❌ Failed:   ${results.failed}`);
  
  const successRate = (results.passed / results.total * 100).toFixed(1);
  console.log(`📈 Success Rate: ${successRate}%`);
  
  if (results.failed === 0) {
    console.log('\n🎉 All tests passed! update-sticky-note is fully functional.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Please review the output above.');
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Test suite interrupted by user');
  process.exit(1);
});

runAllTests().catch((error) => {
  console.error('\n❌ Test suite failed:', error.message);
  process.exit(1);
});