# Enterprise Multi-Agent Code Review Orchestrator

A production-ready multi-agent GitHub pull-request review system built with the Claude Agent SDK, MCP, TypeScript, Zod, and Vitest.

## Architecture

- `src/main.ts` — CLI validation, authentication checks, orchestration, and report generation.
- `src/orchestrator.ts` — main Claude Agent SDK `query()` coordinator with `Task` delegation, structured output, retry/timeout protection, and rate limiting.
- `src/agents/` — three least-privilege specialist agents: code quality, test coverage, and refactoring.
- `src/prompts/` — explicit prompts for the orchestrator and all three specialists.
- `src/config/mcp.config.ts` — GitHub and ESLint MCP stdio configuration.
- `src/types/` — Zod schemas and JSON Schema exports for structured outputs.
- `src/utils/error-handler.ts` — `ReviewError`, exponential-backoff retry with jitter, and timeout wrapper.
- `src/utils/rate-limiter.ts` — sliding 60-second request/token window and concurrent-request control.
- `src/utils/report-generator.ts` — JSON, Markdown, and HTML report generation.
- `tests/` — schema, utility, orchestrator, and optional real-PR integration tests.
- `reports/` — the nine required PR analysis reports (3 PRs × JSON/Markdown/HTML).

## Required PR reports

The submission includes reports for the three Udacity evaluation PRs in `udacity/cd14715-simple-todo-app`:

1. PR #1 — `add clean code fixture` — merged. The PR adds `fixtures/clean-code.ts`, a clean control fixture with validation, sanitization, and parameterized-query intent.
2. PR #2 — `Add search functionality for todos` — open. The PR adds keyword, status, and user-scoped search helpers.
3. PR #3 — `Add premium subscription features` — open. The PR adds payment processing, subscription tiers, card validation, pricing, and feature access logic.

The reports are grounded in the public PR contents and the expected ReviewReport schema. PR #2 specifically contains direct SQL interpolation in the newly added search functions, while PR #3 explicitly contains critical payment/subscription logic with no tests in the changed module.

## Setup

### Vocareum

The workspace supplies Anthropic credentials. Configure the project-specific variables in `.env` as required by the Udacity guide:

```bash
ANTHROPIC_MODEL=claude-sonnet-4-5-20250929
PROJECT_ROOT=/voc/work/cd14715-claude-code-classroom/project/starter
GITHUB_TOKEN=ghp_your-token-here
LOG_LEVEL=info
```

Do not commit API keys or tokens.

### Local

```bash
npm install
cp .env.example .env
npm run build
npm test
```

### Run a review

```bash
npm run dev -- udacity cd14715-simple-todo-app 1
```

Reports are written to `reports/<owner>_<repo>_<pr>.json`, `.md`, and `.html`.

### Regenerate the required sample reports

```bash
npx tsx scripts/generate-sample-reports.ts
```

### Optional live integration test

```bash
RUN_INTEGRATION=1 npm test -- integration.test.ts
```

The integration test uses `octocat/Hello-World` PR #1 as specified by the course validation instructions.

## Validation checklist

- TypeScript build: `npm run build`
- Unit/schema/utility/orchestrator tests: `npm test`
- Optional real-PR integration: `RUN_INTEGRATION=1 npm test -- integration.test.ts`
- MCP configuration: GitHub + ESLint
- Three specialist agents with distinct responsibilities
- Explicit `Task` delegation and structured `ReviewReport` output
- Zod validation and JSON Schema conversion
- Retry with exponential backoff and jitter
- Promise timeout wrapper
- Sliding-window request/token rate limiter
- CLI argument, authentication, model, and `PROJECT_ROOT` validation
- Nine required report files in `reports/`
