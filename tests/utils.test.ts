import { describe, expect, it } from 'vitest';
import { withRetry, withTimeout, ErrorCodes, ReviewError, isReviewError, formatError } from '../src/utils/error-handler.js';
import { RateLimiter, withRateLimit } from '../src/utils/rate-limiter.js';

describe('error handling utilities', () => {
  it('retries with exponential backoff and eventually succeeds', async () => {
    let attempts = 0;
    const value = await withRetry(async () => {
      attempts++;
      if (attempts < 3) throw new Error('temporary');
      return 'ok';
    }, 2, 1);
    expect(value).toBe('ok');
    expect(attempts).toBe(3);
  });

  it('throws RETRY_EXHAUSTED after the configured retries', async () => {
    await expect(withRetry(async () => { throw new Error('nope'); }, 2, 1))
      .rejects.toMatchObject({ code: ErrorCodes.RETRY_EXHAUSTED });
  });

  it('times out a slow promise', async () => {
    await expect(withTimeout(() => new Promise(resolve => setTimeout(resolve, 30)), 5, 'slow'))
      .rejects.toMatchObject({ code: ErrorCodes.AGENT_TIMEOUT, message: 'slow' });
  });

  it('identifies and formats ReviewError instances', () => {
    const error = new ReviewError('bad config', ErrorCodes.INVALID_CONFIG);
    expect(isReviewError(error)).toBe(true);
    expect(formatError(error)).toBe('[INVALID_CONFIG] bad config');
    expect(formatError(new Error('plain'))).toBe('plain');
  });
});

describe('RateLimiter', () => {
  it('tracks requests, tokens and concurrency', async () => {
    const limiter = new RateLimiter({ maxRequestsPerMinute: 3, maxTokensPerMinute: 100, maxConcurrent: 2 });
    expect(limiter.canProceed(20)).toBe(true);
    await limiter.acquire(20);
    expect(limiter.getStatus()).toMatchObject({ activeRequests: 1, requestsInWindow: 1, tokensInWindow: 20 });
    limiter.release();
    expect(limiter.getStatus().activeRequests).toBe(0);
  });

  it('blocks a request once request or token capacity is reached', async () => {
    const limiter = new RateLimiter({ maxRequestsPerMinute: 1, maxTokensPerMinute: 50, maxConcurrent: 1 });
    await limiter.acquire(40);
    expect(limiter.canProceed(10)).toBe(false);
    limiter.release();
  });

  it('provides a rate-limited wrapper that releases its slot', async () => {
    const limiter = new RateLimiter({ maxRequestsPerMinute: 5, maxTokensPerMinute: 1000, maxConcurrent: 1 });
    await expect(withRateLimit(limiter, async () => 'done', 10)).resolves.toBe('done');
    expect(limiter.getStatus().activeRequests).toBe(0);
  });

  it('supports boundary values of zero tokens', async () => {
    const limiter = new RateLimiter({ maxRequestsPerMinute: 2, maxTokensPerMinute: 10, maxConcurrent: 1 });
    expect(limiter.canProceed(0)).toBe(true);
    await limiter.acquire(0);
    limiter.release();
  });
});
