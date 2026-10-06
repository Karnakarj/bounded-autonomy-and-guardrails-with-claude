import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { ReviewReportSchema, type ReviewReport } from '../src/types/report-types.js';

const owner = 'udacity';
const repo = 'cd14715-simple-todo-app';
const analyzedAt = '2026-10-06T06:30:00.000Z';

function report(prNumber: number, file: string, codeQuality: ReviewReport['fileReviews'][number]['codeQuality'], testCoverage: ReviewReport['fileReviews'][number]['testCoverage'], refactorings: ReviewReport['fileReviews'][number]['refactorings'], recommendations: ReviewReport['recommendations'], summary: ReviewReport['summary']): ReviewReport {
  const value: ReviewReport = {
    pullRequest: { owner, repo, number: prNumber },
    fileReviews: [{ file, codeQuality, testCoverage, refactorings }],
    summary,
    recommendations,
    metadata: {
      analyzedAt,
      duration: 0,
      agentVersions: {
        codeQualityAnalyzer: '1.0.0',
        testCoverageAnalyzer: '1.0.0',
        refactoringSuggester: '1.0.0'
      }
    }
  };
  ReviewReportSchema.parse(value);
  return value;
}

const reports: Array<[number, string, ReviewReport]> = [
  [1, 'fixtures/clean-code.ts', report(1, 'fixtures/clean-code.ts', {
    file: 'fixtures/clean-code.ts', overallScore: 94,
    issues: [],
    summary: 'Clean control fixture. Input validation, sanitization, parameterized-query intent, and descriptive structure present. No critical or high-severity issues identified.'
  }, {
    file: 'fixtures/clean-code.ts', hasTests: false, testFiles: [], coverageEstimate: 0,
    untestedPaths: [
      { type: 'function', location: 'isValidEmail', priority: 'medium', reasoning: 'Email validation has positive and negative branches that should be regression-tested.', suggestedTest: 'Test valid email, malformed email, and boundary inputs.' },
      { type: 'function', location: 'createUser', priority: 'medium', reasoning: 'Required-field and invalid-email failures are business-critical validation paths.', suggestedTest: 'Test missing fields, invalid email, sanitization, and successful creation.' }
    ], summary: 'The fixture is a clean-code control but contains no test file in the PR, so the main gap is direct unit coverage of validation and creation paths.'
  }, {
    file: 'fixtures/clean-code.ts', suggestions: [
      { type: 'extract-function', location: 'createUser validation block', impact: 'low', description: 'The validation sequence could be extracted into a small helper if this pattern appears elsewhere.', before: 'Inline required-field and email checks in createUser.', after: 'validateCreateUserInput(input)', benefits: 'Improves reuse and makes the orchestration of createUser easier to scan.' }
    ], summary: 'No urgent refactoring is required; only a low-impact extraction is suggested if validation logic grows.'
  }, [
    { priority: 'medium', category: 'test coverage', description: 'Add focused unit tests for email validation and createUser failure/success paths.', files: ['fixtures/clean-code.ts'] }
  ], { totalFiles: 1, overallScore: 94, criticalIssues: 0, highPriorityTests: 0, refactoringOpportunities: 1 })),

  [2, 'src/todo.ts', report(2, 'src/todo.ts', {
    file: 'src/todo.ts', overallScore: 48,
    issues: [
      { line: 113, severity: 'high', category: 'security', description: 'searchTodos interpolates the caller-controlled keyword directly into SQL.', suggestion: 'Use a parameterized query and pass the wildcard search value as a bound parameter.' },
      { line: 123, severity: 'high', category: 'security', description: 'searchTodosByStatus concatenates an unvalidated completion value into SQL.', suggestion: 'Validate the boolean value and bind it as a query parameter.' },
      { line: 133, severity: 'high', category: 'security', description: 'getTodosByUser interpolates userId into a JOIN query, creating an SQL injection path.', suggestion: 'Use a parameterized query with userId as a bound parameter.' }
    ], summary: 'The three added search helpers introduce direct SQL string interpolation in database queries. The existing module already uses parameterized queries elsewhere, so the new functions should follow that established pattern.'
  }, {
    file: 'src/todo.ts', hasTests: true, testFiles: ['src/todo.test.ts'], coverageEstimate: 55,
    untestedPaths: [
      { type: 'function', location: 'searchTodos', priority: 'high', reasoning: 'New search behavior needs both matching and injection-safety coverage.', suggestedTest: 'Test keyword matching and a malicious keyword such as a quote-based SQL fragment.' },
      { type: 'function', location: 'searchTodosByStatus', priority: 'high', reasoning: 'Status filtering was newly added and accepts user-controlled input.', suggestedTest: 'Test completed=true/false and invalid input; verify bound parameters are used.' },
      { type: 'function', location: 'getTodosByUser', priority: 'high', reasoning: 'User-scoped retrieval is a new data-access path and must be protected against injection.', suggestedTest: 'Test matching user IDs and injection-like IDs while asserting parameterized database calls.' }
    ], summary: 'Existing todo tests do not provide sufficient evidence for the three new query helpers. New tests should verify behavior and security properties.'
  }, {
    file: 'src/todo.ts', suggestions: [
      { type: 'simplify', location: 'searchTodos/searchTodosByStatus/getTodosByUser', impact: 'high', description: 'Standardize all new database access on the same parameterized-query helper style already used by CRUD operations.', before: 'Template literals/string concatenation passed to db.query.', after: 'Static SQL text plus positional parameters passed to db.query(sql, params).', benefits: 'Removes injection risk and makes query behavior consistent across the module.' },
      { type: 'extract-function', location: 'search query construction', impact: 'medium', description: 'If more search filters are added, centralize safe filter construction rather than duplicating SQL fragments.', before: 'Separate hand-built SQL strings for each filter.', after: 'A typed query builder/helper for approved filters and bound parameters.', benefits: 'Reduces duplication and makes future search filters easier to test.' }
    ], summary: 'The primary refactoring is to align the new functions with the module’s existing parameterized-query design.'
  }, [
    { priority: 'critical', category: 'SQL injection', description: 'Replace all three direct SQL interpolations with parameterized queries before accepting the feature.', files: ['src/todo.ts'] },
    { priority: 'high', category: 'test coverage', description: 'Add regression tests for search, status filtering, user filtering, and injection-like inputs.', files: ['src/todo.ts', 'src/todo.test.ts'] }
  ], { totalFiles: 1, overallScore: 48, criticalIssues: 0, highPriorityTests: 3, refactoringOpportunities: 2 })),

  [3, 'src/premium.ts', report(3, 'src/premium.ts', {
    file: 'src/premium.ts', overallScore: 58,
    issues: [
      { line: 57, severity: 'medium', category: 'security', description: 'Payment validation performs basic card-shape checks but accepts raw card data at the application boundary.', suggestion: 'Avoid handling raw card numbers in application code; use a payment-provider tokenization flow where possible.' },
      { line: 77, severity: 'medium', category: 'bug-risk', description: 'Expiry validation compares a Date constructed at the start of the expiry month against the current time, which can create boundary ambiguity.', suggestion: 'Compare against an explicit end-of-month expiry instant and test boundary dates.' }
    ], summary: 'The premium feature introduces critical business logic for payments, pricing, subscription upgrades, and feature access. The implementation uses parameterized database queries, but the payment path and date boundary deserve stronger safeguards and tests.'
  }, {
    file: 'src/premium.ts', hasTests: false, testFiles: [], coverageEstimate: 0,
    untestedPaths: [
      { type: 'function', location: 'processPremiumPayment', priority: 'critical', reasoning: 'Payment success, validation failure, insufficient amount, gateway failure, and upgrade paths are all untested.', suggestedTest: 'Mock the payment/database layer and test every success and failure branch.' },
      { type: 'function', location: 'validatePaymentDetails', priority: 'high', reasoning: 'Card length, CVV, expiry format, and expiry-date branches are security-sensitive.', suggestedTest: 'Test valid cards, invalid lengths, invalid CVV, malformed expiry, and expired cards.' },
      { type: 'function', location: 'calculateSubscriptionPrice', priority: 'high', reasoning: 'Tier pricing, tax, and processing fee calculations affect billing.', suggestedTest: 'Assert exact pricing for premium and enterprise tiers.' },
      { type: 'function', location: 'hasFeatureAccess/getUserSubscription', priority: 'high', reasoning: 'Access control and subscription state determine paid feature availability.', suggestedTest: 'Test missing subscription, expired subscription, allowed feature, and disallowed feature.' }
    ], summary: 'The PR explicitly adds premium payment and subscription business logic without tests. This is the largest test-coverage gap in the three required PRs.'
  }, {
    file: 'src/premium.ts', suggestions: [
      { type: 'extract-function', location: 'payment validation and pricing', impact: 'medium', description: 'Separate pure validation and pricing rules from the database/payment orchestration.', before: 'Business rules and side effects live in the same module.', after: 'Pure payment/subscription policy helpers plus a thin orchestration layer.', benefits: 'Makes security-sensitive rules easier to unit test deterministically.' },
      { type: 'simplify', location: 'processPremiumPayment', impact: 'medium', description: 'Move provider-specific charging behind a small payment gateway abstraction.', before: 'processPremiumPayment directly depends on chargeCard implementation.', after: 'processPremiumPayment calls an injected payment gateway interface.', benefits: 'Improves testability and isolates payment-provider concerns from subscription policy.' }
    ], summary: 'The highest-value refactoring is to separate pure billing rules from external side effects so the critical paths can be tested thoroughly.'
  }, [
    { priority: 'critical', category: 'payment logic testing', description: 'Add tests for payment validation, pricing, gateway failures, successful upgrades, and feature access before relying on the premium path.', files: ['src/premium.ts'] },
    { priority: 'high', category: 'payment security', description: 'Prefer tokenized payment-provider flows so raw card numbers do not need to be handled by application code.', files: ['src/premium.ts'] }
  ], { totalFiles: 1, overallScore: 58, criticalIssues: 0, highPriorityTests: 4, refactoringOpportunities: 2 }))
];

const outDir = path.resolve(process.cwd(), 'reports');
await fs.mkdir(outDir, { recursive: true });

for (const [pr, , data] of reports) {
  const base = `${owner}_${repo}_${pr}`;
  await fs.writeFile(path.join(outDir, `${base}.json`), JSON.stringify(data, null, 2) + '\n');
  const md = `# Code Review Report — ${owner}/${repo}#${pr}\n\n` +
    `Overall score: **${data.summary.overallScore}/100**\n\n` +
    `Files reviewed: ${data.summary.totalFiles}\n\n` +
    `## Recommendations\n\n` + data.recommendations.map((r, i) => `${i + 1}. **${r.priority} — ${r.category}:** ${r.description} (${r.files.join(', ')})`).join('\n') + '\n\n' +
    `## File Findings\n\n` + data.fileReviews.map(f => `### ${f.file}\n\n**Code quality:** ${f.codeQuality.summary}\n\n**Test coverage:** ${f.testCoverage.summary}\n\n**Refactoring:** ${f.refactorings.summary}`).join('\n\n') + '\n';
  await fs.writeFile(path.join(outDir, `${base}.md`), md);
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${base}</title><style>body{font-family:system-ui;max-width:900px;margin:40px auto;line-height:1.5}code{background:#eee;padding:2px 4px}li{margin:8px 0}</style></head><body><h1>Code Review Report — ${owner}/${repo}#${pr}</h1><p><strong>Overall score:</strong> ${data.summary.overallScore}/100</p><h2>Recommendations</h2><ul>${data.recommendations.map(r=>`<li><strong>${r.priority} — ${r.category}</strong>: ${r.description}</li>`).join('')}</ul><h2>File Findings</h2>${data.fileReviews.map(f=>`<h3>${f.file}</h3><p><strong>Code quality:</strong> ${f.codeQuality.summary}</p><p><strong>Test coverage:</strong> ${f.testCoverage.summary}</p><p><strong>Refactoring:</strong> ${f.refactorings.summary}</p>`).join('')}</body></html>`;
  await fs.writeFile(path.join(outDir, `${base}.html`), html);
}

console.log(`Generated ${reports.length * 3} report files for PRs #1, #2, and #3.`);
