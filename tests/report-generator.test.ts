import { describe, expect, it } from 'vitest';
import { ReportGenerator } from '../src/utils/report-generator.js';
import type { ReviewReport } from '../src/types/report-types.js';

const report: ReviewReport = {
  pullRequest: { owner: 'udacity', repo: 'cd14715-simple-todo-app', number: 2 },
  fileReviews: [{
    file: 'src/todo.ts',
    codeQuality: { file: 'src/todo.ts', issues: [{ line: 10, severity: 'high', category: 'security', description: 'Unsafe query', suggestion: 'Bind parameters' }], overallScore: 70, summary: 'One issue' },
    testCoverage: { file: 'src/todo.ts', hasTests: true, testFiles: ['src/todo.test.ts'], untestedPaths: [{ type: 'function', location: 'searchTodos', priority: 'high', reasoning: 'Missing', suggestedTest: 'Add test' }], coverageEstimate: 50, summary: 'Gaps remain' },
    refactorings: { file: 'src/todo.ts', suggestions: [{ type: 'simplify', location: 'searchTodos', impact: 'medium', description: 'Simplify query handling', before: 'concat', after: 'params', benefits: 'Safer' }], summary: 'One suggestion' }
  }],
  summary: { totalFiles: 1, overallScore: 70, criticalIssues: 0, highPriorityTests: 1, refactoringOpportunities: 1 },
  recommendations: [{ priority: 'high', category: 'security', description: 'Use parameterized SQL', files: ['src/todo.ts'] }],
  metadata: { analyzedAt: new Date().toISOString(), duration: 10, agentVersions: { codeQualityAnalyzer: '1.0.0', testCoverageAnalyzer: '1.0.0', refactoringSuggester: '1.0.0' } }
};

describe('ReportGenerator', () => {
  const generator = new ReportGenerator();

  it('generates markdown with summary metrics', () => {
    const md = generator.generateMarkdownReport(report);
    expect(md).toContain('70/100');
    expect(md).toContain('src/todo.ts');
  });

  it('generates markdown recommendations', () => {
    expect(generator.generateMarkdownReport(report)).toContain('Use parameterized SQL');
  });

  it('generates markdown issue details', () => {
    expect(generator.generateMarkdownReport(report)).toContain('Unsafe query');
  });

  it('generates HTML with report title and metrics', () => {
    const html = generator.generateHTMLReport(report);
    expect(html).toContain('<title>Code Review Report</title>');
    expect(html).toContain('70');
  });

  it('generates HTML recommendations', () => {
    expect(generator.generateHTMLReport(report)).toContain('Use parameterized SQL');
  });

  it('generates valid JSON text', () => {
    const parsed = JSON.parse(generator.generateJSONReport(report));
    expect(parsed.pullRequest.number).toBe(2);
    expect(parsed.summary.overallScore).toBe(70);
  });

  it('limits markdown recommendations to the top five', () => {
    const many = { ...report, recommendations: Array.from({ length: 7 }, (_, i) => ({ priority: 'low' as const, category: `c${i}`, description: `d${i}`, files: [] })) };
    const md = generator.generateMarkdownReport(many);
    expect(md).toContain('c4');
    expect(md).not.toContain('c5');
  });
});
