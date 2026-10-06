import { describe, expect, it } from 'vitest';
import { ReviewReportSchema } from '../src/types/report-types.js';

describe('ReviewReportSchema', () => {
  it('accepts a valid review report', () => {
    const report = {
      pullRequest: {
        owner: 'octocat',
        repo: 'Hello-World',
        number: 1,
      },
      fileReviews: [],
      summary: {
        totalFiles: 0,
        overallScore: 0,
        criticalIssues: 0,
        highPriorityTests: 0,
        refactoringOpportunities: 0,
      },
      recommendations: [],
      metadata: {
        analyzedAt: new Date().toISOString(),
        duration: 100,
        agentVersions: {
          codeQualityAnalyzer: '1.0.0',
          testCoverageAnalyzer: '1.0.0',
          refactoringSuggester: '1.0.0',
        },
      },
    };

    const result = ReviewReportSchema.safeParse(report);

    expect(result.success).toBe(true);
  });

  it('rejects an invalid review report', () => {
    const invalidReport = {
      pullRequest: {
        owner: 'octocat',
        repo: 'Hello-World',
        number: 'invalid',
      },
    };

    const result = ReviewReportSchema.safeParse(invalidReport);

    expect(result.success).toBe(false);
  });
});

describe('CodeReviewOrchestrator configuration', () => {
  it('should initialize with default options', async () => {
    const { CodeReviewOrchestrator } =
      await import('../src/orchestrator.js');

    const orchestrator = new CodeReviewOrchestrator();

    expect(orchestrator).toBeDefined();
  });

  it('should accept custom model and maxTurns options', async () => {
    const { CodeReviewOrchestrator } =
      await import('../src/orchestrator.js');

    const orchestrator = new CodeReviewOrchestrator({
      model: 'claude-sonnet-4-5-20250929',
      maxTurns: 10,
    });

    expect(orchestrator).toBeDefined();
  });
});

describe('Utility functions', () => {
  it('withRetry succeeds after an initial failure', async () => {
    const { withRetry } =
      await import('../src/utils/error-handler.js');

    let attempts = 0;

    const result = await withRetry(
      async () => {
        attempts++;

        if (attempts === 1) {
          throw new Error('temporary failure');
        }

        return 'success';
      },
      1,
      1,
    );

    expect(result).toBe('success');
    expect(attempts).toBe(2);
  });

  it('withRetry throws after retries are exhausted', async () => {
    const { withRetry, ErrorCodes } =
      await import('../src/utils/error-handler.js');

    await expect(
      withRetry(
        async () => {
          throw new Error('permanent failure');
        },
        1,
        1,
      ),
    ).rejects.toMatchObject({
      code: ErrorCodes.RETRY_EXHAUSTED,
    });
  });

  it('withTimeout rejects when an operation takes too long', async () => {
    const { withTimeout, ErrorCodes } =
      await import('../src/utils/error-handler.js');

    await expect(
      withTimeout(
        () =>
          new Promise<string>((resolve) => {
            setTimeout(() => resolve('too late'), 50);
          }),
        5,
        'Test timeout',
      ),
    ).rejects.toMatchObject({
      code: ErrorCodes.AGENT_TIMEOUT,
    });
  });

  it('RateLimiter.canProceed returns false when the request limit is reached', async () => {
    const { RateLimiter } =
      await import('../src/utils/rate-limiter.js');

    const limiter = new RateLimiter({
      maxRequestsPerMinute: 1,
      maxTokensPerMinute: 1000,
      maxConcurrent: 1,
    });

    expect(limiter.canProceed(10)).toBe(true);

    await limiter.acquire(10);

    expect(limiter.canProceed(10)).toBe(false);
  });
});