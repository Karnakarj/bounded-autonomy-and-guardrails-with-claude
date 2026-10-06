import * as dotenv from 'dotenv';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

import { CodeReviewOrchestrator } from './orchestrator.js';
import { ReportGenerator } from './utils/report-generator.js';

// Load environment variables
dotenv.config();

/**
 * Main entry point for the Claude Multi-Agent Code Review System
 *
 * Usage:
 *   npm run dev -- <owner> <repo> <pr-number>
 */
async function main(): Promise<void> {
  const [owner, repo, prStr] = process.argv.slice(2);

  // ------------------------------------------------------------
  // 1. Validate command-line arguments
  // ------------------------------------------------------------
  if (!owner || !repo || !prStr) {
    console.error(
      'Usage: npm run dev -- <owner> <repo> <pr-number>'
    );
    process.exit(1);
  }

  const prNumber = Number(prStr);

  if (!Number.isInteger(prNumber) || prNumber <= 0) {
    console.error(
      `Invalid pull request number: "${prStr}". It must be a positive integer.`
    );
    process.exit(1);
  }

  // ------------------------------------------------------------
  // 2. Validate authentication
  // ------------------------------------------------------------
  const hasAnthropicAuth = Boolean(process.env.ANTHROPIC_API_KEY);
  const hasAwsAuth =
    Boolean(process.env.AWS_ACCESS_KEY_ID) &&
    Boolean(process.env.AWS_SECRET_ACCESS_KEY);

  if (hasAwsAuth) {
    if (!process.env.AWS_REGION) {
      console.error(
        'AWS authentication is configured, but AWS_REGION is missing.'
      );
      process.exit(1);
    }

    console.log('🔐 Using AWS Bedrock authentication');
  } else if (hasAnthropicAuth) {
    console.log('🔐 Using Anthropic API authentication');
  } else {
    console.error(
      'Authentication is not configured.\n\n' +
      'Configure either:\n' +
      '1. ANTHROPIC_API_KEY for Anthropic API, or\n' +
      '2. AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY + AWS_REGION for AWS Bedrock.'
    );
    process.exit(1);
  }

  // ------------------------------------------------------------
  // 3. Validate project root
  // ------------------------------------------------------------
  if (!process.env.PROJECT_ROOT) {
    console.error(
      'PROJECT_ROOT is required. Set it to the absolute path of the project being reviewed.'
    );
    process.exit(1);
  }

  // ------------------------------------------------------------
  // 3. Validate model
  // ------------------------------------------------------------
  const model = process.env.ANTHROPIC_MODEL;

  if (!model) {
    console.error(
      'ANTHROPIC_MODEL is required. Please set it in your environment.'
    );
    process.exit(1);
  }

  console.log(`🤖 Using model: ${model}`);
  console.log(`🔍 Reviewing ${owner}/${repo}#${prNumber}`);

  try {
    // ----------------------------------------------------------
    // 4. Create orchestrator
    // ----------------------------------------------------------
    const orchestrator = new CodeReviewOrchestrator({
      model
    });

    // ----------------------------------------------------------
    // 5. Run the multi-agent review
    // ----------------------------------------------------------
    console.log('🚀 Starting multi-agent code review...');

    const report = await orchestrator.reviewPullRequest(
      owner,
      repo,
      prNumber
    );

    console.log('✅ Review completed successfully.');

    // ----------------------------------------------------------
    // 6. Generate reports
    // ----------------------------------------------------------
    const reportGenerator = new ReportGenerator();

    const markdownReport =
      reportGenerator.generateMarkdownReport(report);

    const htmlReport =
      reportGenerator.generateHTMLReport(report);

    const jsonReport =
      reportGenerator.generateJSONReport(report);

    // ----------------------------------------------------------
    // 7. Save reports
    // ----------------------------------------------------------
    const reportsDirectory = path.resolve(process.cwd(), 'reports');

    await fs.mkdir(reportsDirectory, { recursive: true });

    const baseName = `${owner}_${repo}_${prNumber}`;

    const jsonPath = path.join(
      reportsDirectory,
      `${baseName}.json`
    );

    const markdownPath = path.join(
      reportsDirectory,
      `${baseName}.md`
    );

    const htmlPath = path.join(
      reportsDirectory,
      `${baseName}.html`
    );

    await fs.writeFile(jsonPath, jsonReport, 'utf-8');
    await fs.writeFile(markdownPath, markdownReport, 'utf-8');
    await fs.writeFile(htmlPath, htmlReport, 'utf-8');

    console.log('');
    console.log('📊 Reports generated:');
    console.log(`   JSON:     ${jsonPath}`);
    console.log(`   Markdown: ${markdownPath}`);
    console.log(`   HTML:     ${htmlPath}`);
  } catch (error) {
    console.error('');
    console.error('❌ Error:', error);

    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});