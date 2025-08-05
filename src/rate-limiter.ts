import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import type { RateLimitBucket, RateLimitState, RateLimitStatus, RateLimitConfig } from './types.js';

const RATE_LIMIT_FILE_PATH = path.join(os.homedir(), '.mural-mcp-rate-limit.json');

export class MuralRateLimiter {
  private config: RateLimitConfig;
  private state: RateLimitState;

  constructor(config?: Partial<RateLimitConfig>) {
    this.config = {
      userRequestsPerSecond: config?.userRequestsPerSecond ?? 25,
      appRequestsPerMinute: config?.appRequestsPerMinute ?? 10000,
      persistState: config?.persistState ?? true,
      ...config
    };

    this.state = {
      userBucket: this.createBucket(this.config.userRequestsPerSecond, 1000), // 1 second window
      appBucket: this.createBucket(this.config.appRequestsPerMinute, 60000),  // 60 second window
      lastUpdated: Date.now()
    };
  }

  private createBucket(capacity: number, refillIntervalMs: number): RateLimitBucket {
    return {
      capacity,
      tokens: capacity,
      refillRate: capacity / (refillIntervalMs / 1000), // tokens per second
      lastRefill: Date.now(),
      refillIntervalMs
    };
  }

  private async loadState(): Promise<void> {
    if (!this.config.persistState) return;

    try {
      const data = await fs.readFile(RATE_LIMIT_FILE_PATH, 'utf-8');
      const savedState = JSON.parse(data) as RateLimitState;
      
      // Only use saved state if it's recent (within 5 minutes)
      if (Date.now() - savedState.lastUpdated < 300000) {
        this.state = savedState;
      }
    } catch (error) {
      // File doesn't exist or is invalid, use default state
    }
  }

  private async saveState(): Promise<void> {
    if (!this.config.persistState) return;

    try {
      await fs.writeFile(RATE_LIMIT_FILE_PATH, JSON.stringify(this.state, null, 2));
    } catch (error) {
      console.warn('Failed to save rate limit state:', error);
    }
  }

  private refillBucket(bucket: RateLimitBucket): void {
    const now = Date.now();
    const timePassed = now - bucket.lastRefill;
    
    if (timePassed > 0) {
      const tokensToAdd = Math.floor((timePassed / 1000) * bucket.refillRate);
      bucket.tokens = Math.min(bucket.capacity, bucket.tokens + tokensToAdd);
      bucket.lastRefill = now;
    }
  }

  private canConsume(bucket: RateLimitBucket, tokens: number = 1): boolean {
    this.refillBucket(bucket);
    return bucket.tokens >= tokens;
  }

  private consume(bucket: RateLimitBucket, tokens: number = 1): boolean {
    if (!this.canConsume(bucket, tokens)) {
      return false;
    }
    
    bucket.tokens -= tokens;
    return true;
  }

  private getWaitTime(bucket: RateLimitBucket, tokens: number = 1): number {
    this.refillBucket(bucket);
    
    if (bucket.tokens >= tokens) {
      return 0;
    }
    
    const tokensNeeded = tokens - bucket.tokens;
    return Math.ceil((tokensNeeded / bucket.refillRate) * 1000);
  }

  async canMakeRequest(): Promise<{ allowed: boolean; waitTimeMs?: number; reason?: string }> {
    await this.loadState();

    // Check user bucket first (stricter limit)
    if (!this.canConsume(this.state.userBucket, 1)) {
      const waitTime = this.getWaitTime(this.state.userBucket, 1);
      return {
        allowed: false,
        waitTimeMs: waitTime,
        reason: `User rate limit exceeded (${this.config.userRequestsPerSecond} requests/second)`
      };
    }

    // Check app bucket
    if (!this.canConsume(this.state.appBucket, 1)) {
      const waitTime = this.getWaitTime(this.state.appBucket, 1);
      return {
        allowed: false,
        waitTimeMs: waitTime,
        reason: `Application rate limit exceeded (${this.config.appRequestsPerMinute} requests/minute)`
      };
    }

    return { allowed: true };
  }

  async consumeRequest(): Promise<boolean> {
    await this.loadState();

    const userConsumed = this.consume(this.state.userBucket, 1);
    const appConsumed = this.consume(this.state.appBucket, 1);

    if (userConsumed && appConsumed) {
      this.state.lastUpdated = Date.now();
      await this.saveState();
      return true;
    }

    return false;
  }

  async getRateLimitStatus(): Promise<RateLimitStatus> {
    await this.loadState();

    this.refillBucket(this.state.userBucket);
    this.refillBucket(this.state.appBucket);

    return {
      user: {
        tokensRemaining: this.state.userBucket.tokens,
        capacity: this.state.userBucket.capacity,
        refillRate: this.state.userBucket.refillRate,
        nextRefillIn: Math.max(0, this.state.userBucket.refillIntervalMs - (Date.now() - this.state.userBucket.lastRefill))
      },
      app: {
        tokensRemaining: this.state.appBucket.tokens,
        capacity: this.state.appBucket.capacity,
        refillRate: this.state.appBucket.refillRate,
        nextRefillIn: Math.max(0, this.state.appBucket.refillIntervalMs - (Date.now() - this.state.appBucket.lastRefill))
      },
      lastUpdated: this.state.lastUpdated
    };
  }

  async waitForAvailability(maxWaitMs: number = 30000): Promise<boolean> {
    const checkResult = await this.canMakeRequest();
    
    if (checkResult.allowed) {
      return true;
    }

    if (!checkResult.waitTimeMs || checkResult.waitTimeMs > maxWaitMs) {
      return false;
    }

    await new Promise(resolve => setTimeout(resolve, checkResult.waitTimeMs!));
    return true;
  }

  async reset(): Promise<void> {
    this.state = {
      userBucket: this.createBucket(this.config.userRequestsPerSecond, 1000),
      appBucket: this.createBucket(this.config.appRequestsPerMinute, 60000),
      lastUpdated: Date.now()
    };

    if (this.config.persistState) {
      try {
        await fs.unlink(RATE_LIMIT_FILE_PATH);
      } catch (error) {
        // File doesn't exist, which is fine
      }
    }
  }
}