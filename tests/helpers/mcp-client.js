#!/usr/bin/env node

import { spawn } from 'child_process';

/**
 * MCP Test Client - Unified JSON-RPC client for testing MCP tools
 * 
 * Provides a clean interface for calling MCP tools with proper error handling,
 * timeouts, and response parsing.
 */
export class MCPTestClient {
  constructor(options = {}) {
    this.timeout = options.timeout || 15000; // 15 second default timeout
    this.requestId = 1;
  }

  /**
   * Call an MCP tool via JSON-RPC
   * @param {string} toolName - Name of the MCP tool to call
   * @param {object} args - Arguments to pass to the tool
   * @param {number} timeout - Custom timeout for this call
   * @returns {Promise<object>} Tool response or error
   */
  async callTool(toolName, args = {}, timeout = null) {
    const request = {
      jsonrpc: '2.0',
      id: this.requestId++,
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args
      }
    };

    return this._makeRequest(request, timeout || this.timeout);
  }

  /**
   * List all available MCP tools
   * @returns {Promise<object>} Tools list response
   */
  async listTools() {
    const request = {
      jsonrpc: '2.0',
      id: this.requestId++,
      method: 'tools/list',
      params: {}
    };

    return this._makeRequest(request);
  }

  /**
   * Make a raw JSON-RPC request to the MCP server
   * @private
   */
  _makeRequest(request, timeout = this.timeout) {
    return new Promise((resolve, reject) => {
      const serverProcess = spawn('node', ['build/index.js'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: process.env,
        cwd: process.cwd().includes('/tests') ? '../' : process.cwd()
      });

      let output = '';
      let errorOutput = '';
      let timeoutHandle;

      // Collect stdout data
      serverProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      // Collect stderr data  
      serverProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      // Handle process completion
      serverProcess.on('close', (code) => {
        if (timeoutHandle) clearTimeout(timeoutHandle);

        try {
          // Parse JSON-RPC response from stdout
          const lines = output.trim().split('\n');
          
          for (const line of lines) {
            if (!line.trim()) continue;
            
            try {
              const parsed = JSON.parse(line);
              
              // Match response to request by ID
              if (parsed.jsonrpc && parsed.id === request.id) {
                resolve(parsed);
                return;
              }
            } catch (parseError) {
              // Not JSON, skip this line
              continue;
            }
          }

          // No matching response found
          reject(new Error(
            `No valid JSON-RPC response found for request ID ${request.id}.\n` +
            `Output: ${output.substring(0, 500)}\n` +
            `Error: ${errorOutput.substring(0, 500)}`
          ));

        } catch (error) {
          reject(new Error(`Response parsing failed: ${error.message}`));
        }
      });

      // Handle process errors
      serverProcess.on('error', (error) => {
        if (timeoutHandle) clearTimeout(timeoutHandle);
        reject(new Error(`MCP server process error: ${error.message}`));
      });

      // Set up timeout
      timeoutHandle = setTimeout(() => {
        serverProcess.kill('SIGTERM');
        
        // Give it a moment to cleanup, then force kill
        setTimeout(() => {
          if (!serverProcess.killed) {
            serverProcess.kill('SIGKILL');
          }
        }, 1000);

        reject(new Error(`MCP tool call timeout after ${timeout}ms`));
      }, timeout);

      // Send the request
      try {
        serverProcess.stdin.write(JSON.stringify(request) + '\n');
        serverProcess.stdin.end();
      } catch (error) {
        if (timeoutHandle) clearTimeout(timeoutHandle);
        reject(new Error(`Failed to send request: ${error.message}`));
      }
    });
  }

  /**
   * Parse MCP tool response content
   * @param {object} response - Raw MCP response
   * @returns {object} Parsed response data
   */
  parseResponse(response) {
    if (response.error) {
      throw new Error(`MCP Error: ${response.error.message}`);
    }

    if (!response.result || !response.result.content || !response.result.content[0]) {
      throw new Error('Invalid MCP response structure');
    }

    const content = response.result.content[0];
    
    if (content.type !== 'text') {
      throw new Error(`Unexpected content type: ${content.type}`);
    }

    try {
      return JSON.parse(content.text);
    } catch (error) {
      throw new Error(`Failed to parse response content: ${error.message}`);
    }
  }

  /**
   * Call tool and return parsed response data
   * @param {string} toolName - Name of the MCP tool
   * @param {object} args - Tool arguments  
   * @param {number} timeout - Custom timeout
   * @returns {Promise<object>} Parsed response data
   */
  async callToolAndParse(toolName, args = {}, timeout = null) {
    const response = await this.callTool(toolName, args, timeout);
    return this.parseResponse(response);
  }
}

/**
 * Create a new MCP test client instance
 * @param {object} options - Client options
 * @returns {MCPTestClient} New client instance
 */
export function createMCPClient(options = {}) {
  return new MCPTestClient(options);
}

export default MCPTestClient;