import type { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { testCoverageAnalyzerPrompt } from '../prompts/test-coverage-analyzer.prompt.js';

export const testCoverageAnalyzer: AgentDefinition = {
  description:
    'Analyzes code for test coverage, identifies untested paths and edge cases, and suggests high-priority tests.',
  model: 'inherit',
  prompt: testCoverageAnalyzerPrompt,
  tools: ['Read', 'Glob', 'Grep', 'Skill']
};