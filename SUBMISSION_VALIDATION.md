# Submission Validation

This archive is organized against the Udacity project rubric in the supplied course guide.

Required implementation areas:
- MCP configuration for GitHub and ESLint in `src/config/mcp.config.ts`.
- Three specialist `AgentDefinition` implementations in `src/agents/`.
- Explicit specialist prompts plus the orchestrator prompt in `src/prompts/`.
- Main orchestrator with `Task` delegation, MCP tools, structured `ReviewReport` output, Zod validation, retry/timeout, and rate limiting.
- CLI validation and report generation in `src/main.ts`.
- Retry/timeout utilities and sliding-window rate limiter.
- Schema, utility, orchestrator, report-generator, and optional integration tests.
- Nine required PR report artifacts under `reports/`.

The nine report artifacts are grounded in the public Udacity evaluation PRs #1, #2, and #3. Run the live integration test in Vocareum if API credentials are available; the supplied `integration.test.ts` is skipped unless `RUN_INTEGRATION=1`.
