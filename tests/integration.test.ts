import { describe, expect, it } from 'vitest';
import { CodeReviewOrchestrator } from '../src/orchestrator.js';

describe.skipIf(!process.env.RUN_INTEGRATION)('real GitHub PR integration', () => {
  it('reviews octocat/Hello-World PR #1 and returns a structured report', async () => {
    const report = await new CodeReviewOrchestrator({ maxTurns: 20 }).reviewPullRequest('octocat', 'Hello-World', 1);
    expect(report.pullRequest).toEqual({ owner: 'octocat', repo: 'Hello-World', number: 1 });
    expect(report.summary.totalFiles).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(report.fileReviews)).toBe(true);
  }, 300_000);
});
