#!/usr/bin/env node

import 'dotenv/config';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { readdir } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Modular Test Runner
 * 
 * Runs atomic e2e tests with support for:
 * - Individual tool testing (--tool=create-sticky-notes)
 * - Full suite execution
 * - Parallel execution (--parallel)
 * - Detailed reporting
 */

// Available MCP tools (from src/index.ts)
const MCP_TOOLS = [
  'list-workspaces',
  'get-workspace', 
  'test-connection',
  'clear-auth',
  'debug-api-response',
  'get-rate-limit-status',
  'list-workspace-boards',
  'list-room-boards',
  'get-board',
  'check-user-scopes',
  'get-mural-widgets',
  'get-mural-widget', 
  'delete-widget',
  'create-sticky-notes',
  'update-sticky-note'
];

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = {
    tool: null,
    parallel: false,
    verbose: false,
    help: false
  };

  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith('--tool=')) {
      args.tool = arg.split('=')[1];
    } else if (arg === '--parallel') {
      args.parallel = true;
    } else if (arg === '--verbose' || arg === '-v') {
      args.verbose = true;
    } else if (arg === '--help' || arg === '-h') {
      args.help = true;
    }
  }

  return args;
}

/**
 * Show help information
 */
function showHelp() {
  console.log('🧪 Modular E2E Test Runner for Mural MCP Server');
  console.log('');
  console.log('Usage:');
  console.log('  node run-tests.js [options]');
  console.log('');
  console.log('Options:');
  console.log('  --tool=<name>     Run test for specific MCP tool');
  console.log('  --parallel        Run tests in parallel (faster)');
  console.log('  --verbose, -v     Verbose output');
  console.log('  --help, -h        Show this help');
  console.log('');
  console.log('Examples:');
  console.log('  node run-tests.js                           # Run all tests');
  console.log('  node run-tests.js --tool=create-sticky-notes # Run single tool test'); 
  console.log('  node run-tests.js --parallel                # Run all tests in parallel');
  console.log('  node run-tests.js --tool=test-connection -v # Run with verbose output');
  console.log('');
  console.log('Available MCP Tools:');
  MCP_TOOLS.forEach(tool => console.log(`  • ${tool}`));
}

/**
 * Find available test files
 */
async function findTestFiles() {
  try {
    const e2eDir = path.join(__dirname, 'e2e');
    const files = await readdir(e2eDir);
    
    return files
      .filter(file => file.endsWith('.test.js'))
      .map(file => ({
        tool: file.replace('.test.js', ''),
        file: path.join(e2eDir, file)
      }));
  } catch (error) {
    console.error('❌ Failed to read e2e directory:', error.message);
    return [];
  }
}

/**
 * Run a single test file
 */
function runTest(testFile, toolName) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    console.log(`\\n${'='.repeat(60)}`);
    console.log(`🧪 Running: ${toolName}`);
    console.log('='.repeat(60));
    
    const testProcess = spawn('node', [testFile], {
      stdio: 'inherit',
      env: process.env
    });
    
    testProcess.on('close', (code) => {
      const duration = Date.now() - startTime;
      const success = code === 0;
      
      console.log(`\\n${success ? '✅' : '❌'} ${toolName} ${success ? 'PASSED' : 'FAILED'} (${duration}ms)`);
      
      resolve({
        tool: toolName,
        success,
        duration,
        exitCode: code
      });
    });
    
    testProcess.on('error', (error) => {
      const duration = Date.now() - startTime;
      
      console.log(`\\n❌ ${toolName} FAILED - Process error: ${error.message}`);
      
      resolve({
        tool: toolName,
        success: false,
        duration,
        error: error.message
      });
    });
  });
}

/**
 * Run tests in parallel
 */
async function runTestsParallel(testFiles) {
  console.log(`🚀 Running ${testFiles.length} tests in parallel...\\n`);
  
  const promises = testFiles.map(({ file, tool }) => runTest(file, tool));
  const results = await Promise.all(promises);
  
  return results;
}

/**
 * Run tests sequentially
 */
async function runTestsSequential(testFiles) {
  console.log(`🚀 Running ${testFiles.length} tests sequentially...\\n`);
  
  const results = [];
  
  for (const { file, tool } of testFiles) {
    const result = await runTest(file, tool);
    results.push(result);
  }
  
  return results;
}

/**
 * Print final results summary
 */
function printSummary(results, startTime) {
  const totalTime = Date.now() - startTime;
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const successRate = results.length > 0 ? (passed / results.length * 100).toFixed(1) : 0;
  
  console.log('\\n' + '='.repeat(60));
  console.log('📊 FINAL TEST RESULTS');
  console.log('='.repeat(60));
  
  console.log(`\\n📈 Summary:`);
  console.log(`   Total tests:  ${results.length}`);
  console.log(`   ✅ Passed:   ${passed}`);
  console.log(`   ❌ Failed:   ${failed}`);
  console.log(`   📊 Success:  ${successRate}%`);
  console.log(`   ⏱️  Total:    ${totalTime}ms`);
  
  if (results.length > 0) {
    console.log(`\\n🧪 Individual Results:`);
    results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      const duration = `${result.duration}ms`.padStart(6);
      console.log(`   ${status} ${result.tool.padEnd(25)} ${duration}`);
    });
  }
  
  if (failed > 0) {
    console.log(`\\n❌ Failed Tests:`);
    results
      .filter(r => !r.success)
      .forEach(result => {
        console.log(`   • ${result.tool}${result.error ? ` (${result.error})` : ''}`);
      });
  }
  
  return failed === 0;
}

/**
 * Main test runner
 */
async function main() {
  const args = parseArgs();
  
  if (args.help) {
    showHelp();
    process.exit(0);
  }
  
  console.log('🧪 Mural MCP E2E Test Runner');
  console.log(`📅 ${new Date().toISOString()}`);
  
  // Check environment
  if (!process.env.MURAL_CLIENT_ID) {
    console.error('\\n❌ MURAL_CLIENT_ID environment variable is required');
    console.error('💡 Please set up your environment variables before running tests');
    process.exit(1);
  }
  
  console.log('✅ Environment check passed');
  
  // Find available test files
  const availableTests = await findTestFiles();
  
  if (availableTests.length === 0) {
    console.error('\\n❌ No test files found in e2e/ directory');
    process.exit(1);
  }
  
  console.log(`📂 Found ${availableTests.length} test file(s)`);
  
  // Filter tests based on --tool argument
  let testsToRun = availableTests;
  
  if (args.tool) {
    testsToRun = availableTests.filter(t => t.tool === args.tool);
    
    if (testsToRun.length === 0) {
      console.error(`\\n❌ Test file not found for tool: ${args.tool}`);
      console.error('Available tools:', availableTests.map(t => t.tool).join(', '));
      process.exit(1);
    }
    
    console.log(`🎯 Running single test: ${args.tool}`);
  }
  
  // Run tests
  const startTime = Date.now();
  const results = args.parallel ? 
    await runTestsParallel(testsToRun) :
    await runTestsSequential(testsToRun);
  
  // Print summary and exit
  const allPassed = printSummary(results, startTime);
  
  if (allPassed) {
    console.log('\\n🎉 All tests passed! MCP server is working correctly.');
    process.exit(0);
  } else {
    console.log('\\n⚠️  Some tests failed. Please review the output above.');
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\\n\\n⏹️  Test runner interrupted by user');
  process.exit(1);
});

// Run the test runner
main().catch((error) => {
  console.error('\\n❌ Test runner failed:', error.message);
  process.exit(1);
});