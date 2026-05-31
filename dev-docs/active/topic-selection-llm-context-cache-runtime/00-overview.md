# T-112 Topic Selection LLM Context Cache Runtime

## Status
- State: in-progress
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
- [x] Shared contracts reject missing policy/schema/profile fields, context-family drift, malformed compression/prompt/reuse/audit envelopes, and missing token-budget decisions.
- [x] Backend token-budget primitive emits typed preflight decisions from first-slice `ContextPolicyProfile` policy.
- [x] Backend context packet cache primitive returns exact-hit, stale, drift, miss, and disabled-cache envelopes without storing payloads.
- [x] Backend compression runtime primitive creates ref-backed/hash-checked reports and blocks forbidden payloads or dropped required facts.
- [x] v1a N6 production-shaped local context cache tests verify artifact-ref reuse and stale/drift blocking without live providers.
- [x] v1a N6 single-agent provider path performs token-budget preflight in `AgentOrchestrator` and blocks over-budget fixtures before gateway calls.
- [x] v1a N6 WorkflowHarness provider over-budget fixture proves call-count `0`, no ranked/admission/routing artifacts, and no NeedCandidate authority write.
- [x] Agent invocation audit snapshots carry token-budget gate results when a runtime profile is supplied.
- [x] v1a N6 debate slots pass through the same runtime token-budget preflight as single-agent N6.
- [x] Provider-side cache telemetry is recorded as telemetry only and remains separate from business response reuse.
- [x] `codex_assisted` exact cached reuse requires approval plus non-provider reuse provenance before schema/deterministic gate admission.
- [x] Over-budget paths with supplied compression attempts record quality-gated compression report artifacts before blocking provider execution.
- [x] v1a N6 single-agent over-target provider path performs deterministic structural compression, records a `context_compression_report` artifact, re-renders the prompt with compressed context, and then still runs token/schema/admission/persistence gates.
- [x] Minimal OpenAI/DashScope provider-canary harness proves local provider-required prompt-cache hits still execute gateway calls, while over-budget fixtures execute zero provider calls.
- [x] Prompt packet cache has a Prisma-backed persistent exact index that stores artifact refs and hashes only, with no prompt payload or provider response payload.
- [x] Production-shaped local/dev Prisma smokes verify persistent prompt-index read-through semantics, provider-required non-response-reuse behavior, over-budget provider call count `0`, v1a N1-N9 main WorkflowHarness execution, N6-N9 exact replay/input-hash drift behavior, and default mock-sample fallback to the balanced T-112 fixture.
- [x] Prisma-backed v1a runtime stress runner repeatedly executes N1-N9 replay smoke, verifies prompt packet index growth/slot distribution, confirms exact replay and drift branches do not invoke the LLM gateway, and supports parameterized single-agent or multi-agent-debate N6 modes.
- [x] Live OpenAI/DashScope provider canaries verify provider-backed v1a N6 invocations perform token-budget preflight before gateway calls and do not treat prompt-cache hits as provider response reuse.
- [x] v1a WorkflowHarness runtime policy stress verifies N1-N4 context producer lineage/source-health/hash-drift behavior, N9 publish replay/lineage drift boundaries, N6 exact context-cache hit/drift/stale behavior, provider-required call counts, deterministic gate artifacts after cache hit, N6 compression/re-render, and N5/N7/N8 token-budget audit decisions.
- [ ] Provider-backed invocations outside the promoted v1a N6 first slice perform token-budget preflight before calling OpenAI/DashScope/DeepSeek-compatible gateways.
- [x] `provider_llm` execution in the promoted v1a N6 first slice never silently serves cached responses as live provider calls.
- [x] Exact response reuse is allowed only for explicit replay/test/acceptance or operator-approved Codex-assisted reuse with `non_provider=true` in the `AgentOrchestrator` Codex path.
- [ ] Context packet read-through cache reuses compiled packets only when exact key fields match.
- [ ] Compression reports are wired into over-budget context execution and preserve source refs, input hashes, summary hashes, redaction policy, compiler version, token estimates, and quality-gate result.
- [ ] Cache hits do not create duplicate authority writes and do not skip deterministic gates.
- [ ] v1a, v1b, and v1c harness smokes verify happy path, stale cache, token-over-budget, and response-reuse boundaries.
- [x] Live OpenAI/DashScope v1a N6 provider canaries record telemetry and prove provider-required scenarios still perform live provider calls.
