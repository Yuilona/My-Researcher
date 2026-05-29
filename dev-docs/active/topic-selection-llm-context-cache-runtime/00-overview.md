# T-112 Topic Selection LLM Context Cache Runtime

## Status
- State: planned
- Task ID: `T-112`
- Mapping: `M-001 > F-001 > R-009 > T-112`
- Depends on:
  - `T-088 topic-selection-workflow-runtime-foundation`
  - `T-089 topic-selection-agent-workflow-review`
  - `T-107 topic-selection-v1b-workflow-hardening`
  - `T-108 topic-selection-v1c-workflow-hardening`
  - `T-111 topic-selection-v1a-production-orchestration`
- Trigger: review of current LLM agent workflow showed context packet metadata, prompt hashes, replay hashes, and telemetry exist, but production-grade context compression, cache reuse, token-budget gating, and provider-cache provenance are not yet unified across the full topic-selection workflow.

## Goal
- Define and implement a shared LLM context/cache/token-budget runtime for the entire topic-selection management flow.
- Cover resource sampling, v1a, v1b, v1c, downstream feedback/recheck, and provider/Codex-assisted harness execution paths.
- Preserve existing authority boundaries, route-policy semantics, replay/idempotency behavior, and audit provenance while reducing provider cost and long-context failure risk.

## Non-goals
- Do not use semantic-similarity or approximate response cache for authority-bearing decisions.
- Do not make cache, summaries, compressed context, or chat history into business authority.
- Do not weaken v1a/v1b/v1c route policies, deterministic gates, schema validation, or replay drift checks.
- Do not introduce a second LLM gateway or provider SDK path.
- Do not require new provider secrets or commit local environment files.
- Do not add desktop UI in this package; UI hints may be a later follow-up after runtime contracts settle.

## Scope
- Shared contracts for context packets, prompt packets, invocation cache keys, token-budget gate results, compression reports, and cache/reuse provenance.
- Backend runtime support in `AgentOrchestrator`, `BackendLlmGateway`, context compiler services, and WorkflowHarness node adapters.
- Node-level policy coverage for resource sampling, v1a N5/N6/N7/N8, v1b LLM-backed semantic nodes, v1c advisory/promotion support nodes, and downstream feedback normalization/recheck.
- Tests and provider canaries proving cache, compression, and token-budget behavior.

## Acceptance Criteria
- [ ] A node-scope matrix identifies every topic-selection LLM-capable node and its context/cache/compression/token-budget policy.
- [ ] Shared contracts reject stale cache keys, policy drift, schema drift, profile/model-option drift, context-family drift, and missing token-budget decisions.
- [ ] Provider-backed invocations perform token-budget preflight before calling OpenAI/DashScope/DeepSeek-compatible gateways.
- [ ] `provider_llm` execution never silently serves cached responses as live provider calls.
- [ ] Exact response reuse is allowed only for explicit replay/test/acceptance or operator-approved Codex-assisted reuse with `non_provider=true`.
- [ ] Context packet read-through cache reuses compiled packets only when exact key fields match.
- [ ] Compression reports preserve source refs, input hashes, summary hashes, redaction policy, compiler version, token estimates, and quality-gate result.
- [ ] Cache hits do not create duplicate authority writes and do not skip deterministic gates.
- [ ] v1a, v1b, and v1c harness smokes verify happy path, stale cache, token-over-budget, and response-reuse boundaries.
- [ ] Provider canaries record telemetry and prove provider-required scenarios still perform live provider calls.

