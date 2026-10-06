import type { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { refactoringSuggesterPrompt } from '../prompts/refactoring-suggester.prompt.js';

export const refactoringSuggester: AgentDefinition = {
  description:
    'Analyzes code for refactoring opportunities, modernization, simplification, naming improvements, and better design patterns.',
  model: 'inherit',
  prompt: refactoringSuggesterPrompt,
  tools: ['Read', 'Glob', 'Grep', 'Skill']
};