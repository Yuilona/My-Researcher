# 02 Architecture

## Runtime Boundaries
- `WorkflowHarness`: scenario setup, fixture loading, node sequencing, run trace, and assertions.
- `AgentOrchestrator`: LLM/profile invocation boundary, structured output validation, retry, escalation, and audit capture.
- Domain services: still own v1a/v1b/v1c decisions, repositories, and contract validation.
- Provider gateway: existing `BackendLlmGateway` remains the only backend path to provider APIs.

## Profile Escalation Policy
- Inputs: node kind, uncertainty, malformed output count, deterministic guardrail outcome, reviewer risk level, and user-selected execution mode.
- Decisions: keep current profile, retry same profile, escalate profile, block run.
- Audit: selected profile, escalation trigger, retry count, structured-output validation result, and provider telemetry summary.

## Codex-Assisted Mode
- Codex-assisted mode is a human/operator workflow mode, not a hidden provider fallback.
- The harness may emit a structured prompt packet and accept an operator-provided structured response.
- The response is validated exactly like provider output and must be auditable as `codex_assisted`.

## Compatibility Guardrails
- No parallel ad hoc workflow runner should remain authoritative after migration.
- Existing API and persistence contracts remain backward compatible.
- No hidden chain-of-thought or non-auditable LLM reasoning is persisted.
