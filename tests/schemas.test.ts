import { describe, expect, it } from 'vitest';
import {
  CodeQualityResultSchema,
  TestCoverageResultSchema,
  RefactoringSuggestionSchema,
  ReviewReportSchema,
  ReviewReportJSONSchema,
} from '../src/types/index.js';

const quality = {
  file: 'src/todo.ts', issues: [], overallScore: 90, summary: 'ok'
};
const coverage = {
  file: 'src/todo.ts', hasTests: true, testFiles: ['src/todo.test.ts'], untestedPaths: [], coverageEstimate: 90, summary: 'ok'
};
const refactoring = {
  file: 'src/todo.ts', suggestions: [], summary: 'ok'
};

const validReport = {
  pullRequest: { owner: 'udacity', repo: 'cd14715-simple-todo-app', number: 1 },
  fileReviews: [{ file: 'src/todo.ts', codeQuality: quality, testCoverage: coverage, refactorings: refactoring }],
  summary: { totalFiles: 1, overallScore: 90, criticalIssues: 0, highPriorityTests: 0, refactoringOpportunities: 0 },
  recommendations: [],
  metadata: { analyzedAt: new Date().toISOString(), duration: 1, agentVersions: { codeQualityAnalyzer: '1.0.0' } },
};

describe('Zod schemas', () => {
  it('accepts valid quality, coverage, refactoring and report objects', () => {
    expect(CodeQualityResultSchema.safeParse(quality).success).toBe(true);
    expect(TestCoverageResultSchema.safeParse(coverage).success).toBe(true);
    expect(RefactoringSuggestionSchema.safeParse(refactoring).success).toBe(true);
    expect(ReviewReportSchema.safeParse(validReport).success).toBe(true);
  });

  it('rejects wrong types and invalid enum values', () => {
    expect(ReviewReportSchema.safeParse({ ...validReport, pullRequest: { ...validReport.pullRequest, number: '1' } }).success).toBe(false);
    expect(CodeQualityResultSchema.safeParse({ ...quality, overallScore: 101 }).success).toBe(false);
    expect(TestCoverageResultSchema.safeParse({ ...coverage, coverageEstimate: -1 }).success).toBe(false);
    expect(RefactoringSuggestionSchema.safeParse({ ...refactoring, suggestions: [{ type: 'invalid' }] }).success).toBe(false);
  });

  it('handles empty arrays and boundary scores', () => {
    expect(CodeQualityResultSchema.safeParse({ ...quality, overallScore: 0 }).success).toBe(true);
    expect(CodeQualityResultSchema.safeParse({ ...quality, overallScore: 100 }).success).toBe(true);
    expect(ReviewReportSchema.safeParse({ ...validReport, fileReviews: [] }).success).toBe(true);
  });

  it('exports a JSON schema with an object root', () => {
    expect(ReviewReportJSONSchema).toMatchObject({ type: 'object' });
  });
});
