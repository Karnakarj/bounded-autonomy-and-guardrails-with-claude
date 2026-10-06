import { query } from '@anthropic-ai/claude-agent-sdk';
import {
  codeQualityAnalyzer,
  testCoverageAnalyzer,
  refactoringSuggester
} from './agents/index.js';
import { mcpServersConfig } from './config/mcp.config.js';
import { orchestratorPrompt } from './prompts/orchestrator.prompt.js';
import { withRetry, withTimeout } from './utils/error-handler.js';
import { globalRateLimiter } from './utils/rate-limiter.js';
import {
  ReviewReport,
  ReviewReportJSONSchema
} from './types/report-types.js';

/**
 * Orchestrator configuration options
 */
export interface OrchestratorOptions {
  model?: string;
  maxTurns?: number;
}

/**
 * Main Code Review Orchestrator
 * Coordinates subagents to analyze pull requests and generate comprehensive reports.
 */
export class CodeReviewOrchestrator {
  private readonly model: string;
  private readonly maxTurns: number;

  constructor(options: OrchestratorOptions = {}) {
    this.model =
      options.model ||
      process.env.ANTHROPIC_MODEL ||
      'claude-sonnet-4-5-20250929';

    this.maxTurns = options.maxTurns || 20;
  }

  /**
   * Review a pull request using parallel subagent analysis.
   */
  async reviewPullRequest(
    owner: string,
    repo: string,
    prNumber: number
  ): Promise<ReviewReport> {
    const startTime = Date.now();

    const prompt = orchestratorPrompt(owner, repo, prNumber);

    try {
      return await withRetry(
        async () => withTimeout(
          async () => {
            await globalRateLimiter.acquire(10000);
            try {
              for await (const message of query({
                prompt,
                options: {
                  model: this.model,
                  maxTurns: this.maxTurns,
                  allowedTools: [
                    'Task',
                    'mcp__github__get_pull_request',
                    'mcp__github__get_pull_request_files',
                    'mcp__github__get_file_contents',
                    'mcp__eslint__lint-files'
                  ],
                  mcpServers: mcpServersConfig,
                  agents: {
                    codeQualityAnalyzer,
                    testCoverageAnalyzer,
                    refactoringSuggester
                  },
                  outputFormat: {
                    type: 'json_schema',
                    schema: ReviewReportJSONSchema
                  }
                }
              })) {
                if (
                  message.type === 'result' &&
                  message.subtype === 'success' &&
                  message.structured_output
                ) {
                  const report = message.structured_output as ReviewReport;
                  report.metadata = {
                    ...report.metadata,
                    analyzedAt: report.metadata?.analyzedAt || new Date().toISOString(),
                    duration: Date.now() - startTime,
                    agentVersions: {
                      codeQualityAnalyzer: '1.0.0',
                      testCoverageAnalyzer: '1.0.0',
                      refactoringSuggester: '1.0.0'
                    }
                  };
                  return report;
                }
              }
              throw new Error('The orchestrator completed without returning a structured review report.');
            } finally {
              globalRateLimiter.release();
            }
          },
          300000,
          `Review timed out for ${owner}/${repo}#${prNumber}`
        ),
        2,
        1000
      );
    } catch (error) {
      throw new Error(
        `Failed to review ${owner}/${repo}#${prNumber}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
}