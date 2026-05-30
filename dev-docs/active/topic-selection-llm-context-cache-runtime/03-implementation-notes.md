# 03 Implementation Notes

## 2026-05-28 - Task Package Creation
- Created `T-112 topic-selection-llm-context-cache-runtime` as a dedicated task package.
- Decision: this is a cross-cutting topic-selection runtime package, not a T-107/T-108/T-111 tail item.
- Relationship:
  - consumes T-088 AgentOrchestrator/WorkflowHarness foundations;
  - consumes T-089 node-policy classifications;
  - hardens v1a/v1b/v1c provider and Codex-assisted execution without redefining their route policies.
- Initial architecture aligns with T-088/T-089 D-18: cache is acceleration/replay only; durable memory is structured business memory; context families stay distinct; response reuse must be provenance-labeled and non-provider unless a live provider call actually occurs.

## Pending Decisions
- None after D18 readiness alignment. Next decisions should focus on implementation execution order inside the approved first slice.

## Implementation Backlog
- Add shared contract schemas and schema tests. Done for the contract-first slice.
- Add context packet cache lookup/reuse. Done for the backend primitive; context compiler/node wiring remains pending.
- Add token-budget gate. Done for the backend primitive; provider/node wiring remains pending.
- Add compression report and quality gate.
- Add exact response reuse policy.
- Add prompt packet cache/index contract and prompt quality report.
- Add unified runtime audit envelope and projection contracts.
- Integrate selected v1a/v1b/v1c nodes.
- Add provider canaries and stale-cache negative tests.

## 2026-05-29 - D1/D2 Alignment And Matrix Gate
- Locked D1: T-112 remains a cross-cutting topic-selection runtime task, not a v1a/v1b/v1c node patch.
- Revised D2: the shared runtime is a mechanical enforcement kernel, not a generic semantic context compressor.
- Node policy adapters/context compilers own node-specific context construction, preservation rules, stale behavior, compression strategy choice, provider-required live-call policy, and authority-boundary checks.
- The shared runtime owns token-budget preflight, exact cache/reuse key validation, context packet cache semantics, compression report envelope validation, response reuse enforcement, provider-cache telemetry separation, and provenance/audit shape.
- Added a matrix-first gate: every LLM-capable node/slot must be represented in `06-node-scope-matrix.md` before runtime implementation for that surface.
- Locked D2.1: matrix rows are LLM invocation slots, not workflow nodes. v1a N6 debate roles, v1b semantic-support artifacts, and v1c provider/Codex canary surfaces require separate rows because their context families, authority relation, and reuse policy differ.
- Locked D3: the initial matrix coverage includes profile-registry LLM profiles, v1b semantic support slots, direct `BackendLlmGateway` callers, Codex acceptance slots, and provider-required canary surfaces.
- Split v1c N2 bounded micro-debate into four rows: supporter draft, reviewer critic, supporter repair, and synthesizer final. Split v1c provider canary coverage into explicit N3 diagnostic adjunct, N4 delegated promotion decision, and N6 feedback normalization rows, while treating OpenAI/DashScope as provider evidence dimensions rather than separate slot rows.
- Locked D4: every invocation slot binds a `ContextPolicyProfile`. The profile is the unit for deciding suitable context, memory inclusion, compression, cache, token budget, response reuse, post-reuse gates, and provenance.
- D4 uses reusable functional templates plus execution modifiers, but those are only profile ingredients. They do not replace slot-specific context-family, source-ref, memory, compression, cache, and gate policy.
- Cache and reuse keys MUST include `invocation_slot_id`; `node_id` alone is insufficient for multi-slot nodes such as v1a N6 and v1c N2.
- Locked D5: `ContextPolicyProfile` field semantics define source taxonomy, memory policy, compression policy, cache policy, token-budget runtime order, and profile versioning. Context suitability is profile-declared, not inferred by the runtime.
- Durable memory may enter context only as labeled warning/risk/constraint/accepted-risk/blocker-history/recheck input, never as standalone evidence. Compression and cache are acceleration/runtime aids and cannot become business authority.
- Runtime order is fixed: collect sources and memory, compile/resolve context, run context cache lookup, preflight token budget, compress if allowed, re-estimate, hash prompt packet, check reuse policy, invoke provider/Codex/mock, then run validation and deterministic gates.
- Locked D6: `ContextPolicyProfile` definitions are resolved through an independent registry/resolver. Shared contracts own schema/types; backend owns validated resolution and stable hashes; matrix rows reference id/version for governance only.
- The first implementation should use hardcoded TypeScript defaults and fail closed for unknown profile id, version mismatch, slot/profile mismatch, schema invalidity, unsupported template/modifier, or profile hash drift.
- Locked D7: use one shared runtime kernel plus stage-specific adapters/facades. Every provider, Codex-assisted, mocked, and external artifact admission path must pass runtime checks; stage adapters may own workflow-specific context construction but not independent cache/compression/reuse/token-budget/provenance kernels.
- Added D7.1: v1b N7 is a core topic-question-contract context hub. Its semantic support artifacts remain non-authority, but N7 must accept high-quality context and produce ref-backed handoff context for N8 value assessment and loopback decisions.
- Locked D8: v1a N6 is the first deep runtime integration chain because it exercises single-agent generation, debate slots, `exploration_context`, `arbiter_context`, cache/reuse isolation, and deterministic candidate admission.
- Locked D9: compression is orchestrated by the shared runtime and governed by the slot profile. Codex may be the default semantic compression executor, but Codex output remains a non-authority, ref-backed, hash-checked, quality-gated artifact.
- First-slice compression executors are `deterministic_structural` and `codex_assisted`; provider LLM compression is not the default, and `provider_required_live` slots default to compression-disallowed unless explicitly testing compressed context.
- Locked D10: first-slice token budget uses a single `ConservativeTokenEstimator`, not provider-aware tokenizer plugins. Provider actual token counts are telemetry-only calibration data for future margin tuning.
- Token budget profiles must declare output budget, safety margin, and unknown-estimate behavior; default safety margin is at least `1.25`.
- Locked D11: cache targets cross-provider/cross-mode context identity and preprocessing artifacts, not provider response reuse. Context packet cache returns exact-key artifact refs; provider responses, telemetry, provider-side cache hits, and provider-specific repair results are not cross-provider business cache targets.
- Locked D12: context packet cache uses an artifact-ref read-through contract. The cache index stores exact keys, hashes, artifact refs, freshness/status, and provenance metadata only; it does not store business payloads or provider responses. Exact hits return standardized cache result metadata plus the existing artifact ref, while stale/drifted/context-family-mismatched entries miss or block through shared runtime policy.
- Locked D13: Codex-assisted, provider-LLM, and mocked execution share one runtime but have distinct execution provenance and response-reuse permissions. `provider_llm` never silently reuses historical responses and provider-required slots require live calls. `codex_assisted` exact reuse requires operator or explicit local approval and records `non_provider=true`. `mocked_llm` reuse is limited to test/acceptance fixtures. Response reuse payloads are ref-backed artifacts; the reuse index stores exact lookup and audit metadata only.
- Locked D14: prompt packet cache is keyed by the complete invocation prompt packet, not only the system prompt. Complex workflows must distinguish role/stage/scenario through `prompt_variant_key`. Prompt index rows store hashes, metadata, artifact refs, and provenance only; persisted prompt payloads must be redacted, ref-backed artifacts.
- Locked D15: LLM roles may generate dynamic prompt material such as issue frames, focus questions, challenge lists, risk checklists, and repair agendas, but they cannot generate or override executable prompts. Dynamic material must be schema-validated, ref-backed, hash-included, provenance-recorded, and rendered by fixed prompt compilers.
- Locked D16: prompt quality monitoring combines static prompt-template lint, runtime `PromptQualityReport`, and effectiveness telemetry. Prompt quality gates may warn/block unsafe prompt packets before execution, while outcome telemetry is a review signal and cannot mutate business authority retroactively.
- Locked D17: every LLM-like invocation emits or references an append-only `runtime_audit_envelope` for machine verification. Human-facing audit is produced through projections: `operator_audit_summary` for developer/operator debugging and `human_trust_summary` for product/human-confirmation trust cues. Projections must carry source envelope ref/hash, may simplify fields, must not rewrite conclusions, and cannot become business authority.
- Locked D18: implementation readiness is limited to a narrow first slice. The full matrix remains inventory until rows are promoted. First implementation starts with shared contracts/schema tests, profile registry skeleton, runtime key/token/cache/audit primitives, and then v1a N6 single-agent/debate wiring. Resource sampling, v1b, and v1c direct provider paths are deferred until their rows become implementation-ready.

## 2026-05-29 - Implementation Readiness Review Findings
- Finding resolved: matrix inventory was not implementation-ready. Added a dedicated first-slice implementation-ready matrix for v1a N6 slots with profile ids, prompt variants, token budgets, compression policy, cache/reuse policy, audit projections, and focused tests.
- Finding resolved: stale implementation gate. `04-verification.md` now names the first slice and lists required contracts/runtime prerequisites before implementation.
- Finding tracked for first code PR: shared contracts currently do not match D12-D17 and must be implemented before runtime/node wiring.
- Finding tracked for runtime wiring: existing v1a N6 context compiler has local key/artifact behavior and must be routed through shared key/cache primitives rather than extended with another local cache formula.
- Finding tracked for rollout: resource sampling, v1b, and v1c direct `BackendLlmGateway` paths are explicitly deferred until their matrix rows are promoted.
- Finding tracked for contract enforcement: Codex exact reuse must require approval or explicit local approved-reuse setting with `non_provider=true` before schema/deterministic gate admission.

## 2026-05-29 - First Implementation Prep
- Moved task state to `implementation-prep`.
- Selected the LLM engineering `standardize-calling-wrapper` procedure for this implementation slice: existing `BackendLlmGateway` remains the provider path, and T-112 adds topic-selection runtime governance before provider/Codex/mock execution.
- Added `08-first-slice-implementation-prep.md` as the file-level preparation plan for the first code round.
- Locked first code commit boundary as shared runtime contracts and schema tests only. Backend primitives and v1a N6 wiring are subsequent commits after contract tests pass.
- Confirmed no new provider, provider secret, env key, model-routing registry, Prisma schema, or desktop UI change is part of round 1.

## 2026-05-29 - Contract-First Slice Implemented
- Added `packages/shared/src/research-lifecycle/topic-selection-llm-runtime-contracts.ts` with runtime vocabulary and JSON schemas for context policy profiles, profile registries, cache key/result envelopes, token-budget gate results, compression reports, prompt packet identity, redacted prompt packet artifacts, prompt quality reports, exact response reuse provenance, runtime audit envelopes, and audit projections.
- Added `packages/shared/src/research-lifecycle/topic-selection-llm-runtime-contracts.schema.test.ts` with first-slice negative tests for unknown context family, missing cache-key policy/schema/profile fields, invalid cache-hit/stale envelopes, missing token-budget decision, missing compression source refs, forbidden hidden reasoning/raw prompt payload fields, prompt variant requirements, bounded dynamic prompt material, Codex approval requirements, provider telemetry separation, and projection source-envelope refs.
- Updated shared exports in `packages/shared/src/research-lifecycle/index.ts`, `packages/shared/package.json`, and the barrel re-export surface test in `packages/shared/src/research-lifecycle/title-card-management-contracts.schema.test.ts`.
- Kept backend runtime primitives, `AgentOrchestrator` wiring, v1a N6 behavior changes, persistence fields, provider config, and provider canaries out of this slice as planned.
- Task state is now `in-progress`; the next implementation slice is the backend profile registry skeleton plus stable runtime key primitives.

## 2026-05-30 - Backend Registry And Key Primitive Slice Implemented
- Corrected `token_estimate_safety_margin` contract semantics from a 0-1 ratio to a multiplier with minimum `1`, matching the locked first-slice default `1.25`.
- Added `apps/backend/src/services/topic-selection-context-policy-profile-registry-service.ts` with hardcoded v1a N6 first-slice `ContextPolicyProfile` defaults for need candidate generation, explorer, deep critic, arbiter issue framing, and arbiter final synthesis.
- Added `apps/backend/src/services/topic-selection-context-policy-profile-registry-service.unit.test.ts` covering default registry validation, profile hash generation, unknown profile failure, version mismatch, slot/profile mismatch, expected hash drift, duplicate profile/slot detection, policy drift, and schema-invalid rows.
- Added `apps/backend/src/services/topic-selection-llm-runtime-key-builder-service.ts` with stable hash builders for context packet cache keys, source ref hashes, generic payload hashes, and prompt packet identity.
- Added `apps/backend/src/services/topic-selection-llm-runtime-key-builder-service.unit.test.ts` proving cache key drift on slot/context/profile/model changes, provider key completeness, order-insensitive source-ref hashing, prompt variant binding, dynamic prompt material hash binding, and malformed prompt identity rejection.
- Still no `AgentOrchestrator` wiring, provider call changes, persistence fields, provider config, or provider canaries in this slice.
- Follow-up primitive slice completed the `ConservativeTokenEstimator` plus token-budget gate service; read-through context cache remains next.

## 2026-05-30 - Token Estimator And Budget Gate Primitive Slice Implemented
- Added `apps/backend/src/services/topic-selection-conservative-token-estimator-service.ts` with deterministic local CJK, Latin, JSON, and schema-overhead estimates plus a safety-margin multiplier.
- Added `apps/backend/src/services/topic-selection-conservative-token-estimator-service.unit.test.ts` covering deterministic CJK/text estimates, JSON/schema overhead, safety-margin application, and invalid safety-margin rejection.
- Added `apps/backend/src/services/topic-selection-token-budget-gate-service.ts` with schema-validated token-budget gate results driven by the resolved `ContextPolicyProfile`.
- Added `apps/backend/src/services/topic-selection-token-budget-gate-service.unit.test.ts` covering `within_budget`, `requires_compression`, compression-disallowed blocking, post-compression over-budget blocking, and unknown-estimate allow/block behavior.
- The gate service records provider/model/profile identity fields, estimated input/output tokens, context window, schema overhead, decision, compression strategy ref, blocker codes, and warning codes.
- This slice still does not wire `AgentOrchestrator`, does not call providers, does not add persistence fields, and does not run provider canaries.
- Next implementation slice: read-through context packet cache service boundary, followed by response reuse/audit runtime skeleton.

## 2026-05-30 - Context Packet Cache Primitive Slice Implemented
- Added `apps/backend/src/services/topic-selection-context-packet-cache-service.ts` with an artifact-ref-only context packet cache store and service boundary.
- Added `apps/backend/src/services/topic-selection-context-packet-cache-service.unit.test.ts` covering exact hit reuse, stale block/miss policy, context-family drift, source-ref drift, disabled-cache `not_applicable`, and put-if-absent preservation of the first exact artifact ref.
- The service validates cache keys and result envelopes against the shared T-112 schemas, requires the resolver-produced `context_policy_profile_hash`, and never stores business payloads or provider responses.
- This slice still does not wire the v1a N6 context compiler, does not add persistence fields, does not modify provider calls, and does not run provider canaries.
- Next implementation slice: response reuse/audit runtime skeleton, then v1a N6 context compiler read-through integration when the primitive set is ready.

## 2026-05-30 - Production-Shaped Local Context Cache Tests Implemented
- Extended `apps/backend/src/services/topic-selection-need-discovery-context-compiler-service.ts` with optional runtime context cache bindings. Default compiler behavior remains unchanged when no binding is supplied.
- Added v1a N6 production-shaped local tests in `apps/backend/src/services/topic-selection-need-discovery-context-compiler-service.unit.test.ts` using real exploration/arbiter context payloads, the artifact boundary, in-memory control-plane repository, and `TopicSelectionContextPacketCacheService`.
- Exact runtime cache hit now reuses existing context artifact refs and returns `cache_hit=true` in the compiled context packets without writing duplicate context artifacts for the same N6 attempt.
- Stale and context-family-drifted runtime cache entries block before artifact writes, preserving the authority/write boundary.
- This is still a local runtime test layer: no live provider invocation, no `AgentOrchestrator` provider preflight, no persistence schema change, and no provider canary execution.

## 2026-05-30 - Production-Shaped Token Budget Harness Layer Implemented
- Extended `TopicSelectionAgentOrchestratorService` with optional runtime token-budget input and preflight evaluation before mocked/Codex/provider source execution.
- The preflight uses `TopicSelectionTokenBudgetGateService`, resolved model/profile identity, rendered messages, output schema, and the first-slice `ContextPolicyProfile`.
- Over-budget provider invocations now block before `BackendLlmGateway.createStructuredOutput`; audit artifacts carry the token-budget blocker/warning codes and provider provenance identity while provider call count remains `0`.
- Extended `TopicSelectionGenerateNeedCandidateOrchestratorAdapterService` to bind the v1a N6 need-candidate-generation context policy profile and pass token-budget input into the single-agent invocation path.
- Added unit/harness tests for `AgentOrchestrator` and v1a N6 adapter over-budget provider fixtures. The adapter test proves no ranked draft artifact is written when the budget gate blocks.
- Compression execution is intentionally not wired in this layer. `requires_compression` remains a runtime block until compression reports are wired into context rewrite and prompt re-render.
- No live provider canaries, provider secrets/config changes, DB schema changes, or desktop UI changes were introduced.

## 2026-05-30 - Backend Compression Runtime Primitive Implemented
- Added `apps/backend/src/services/topic-selection-compression-runtime-service.ts`.
- The service creates shared-schema-validated `TopicSelectionCompressionReportEnvelope` records with source refs, input/compressed/summary hashes, before/after token estimates, redaction policy, executor kind, strategy id/version, preserved fact kinds, quality-gate result, blockers, and warnings.
- The service fails closed for profile hash drift, missing source refs, disallowed compression profile, executor/profile mismatch, missing strategy id/version, and redaction policy drift.
- The quality gate blocks compressed payloads or summaries that contain forbidden persisted classes such as hidden reasoning, raw provider logs, credentials, provider secrets, API keys, or unredacted private content.
- The quality gate blocks when required preserved facts are dropped, including blockers, residual risks, accepted risks, source-health warnings, method-family gaps, unresolved challenges, and recheck hints.
- Added `apps/backend/src/services/topic-selection-compression-runtime-service.unit.test.ts` covering valid reports, dropped risk/gap/recheck facts, forbidden payloads, drift rejection, executor policy rejection, redaction drift, and non-reducing compression warnings.
- This remains a primitive layer: no v1a N6 automatic context rewrite, no Codex compression invocation, no provider canary, no DB schema change, and no provider secret/config change.

## 2026-05-30 - WorkflowHarness Token Gate Production-Shaped Verification Implemented
- Extended `TopicSelectionWorkflowHarnessGenerateNeedCandidateInput` with optional `runtime_token_budget_overrides`.
- Included runtime token-budget overrides in the N6 scenario input hash so replay identity changes when the preflight budget fixture changes.
- Passed the overrides from WorkflowHarness into `TopicSelectionGenerateNeedCandidateOrchestratorAdapterService`, which already binds the first-slice v1a N6 `ContextPolicyProfile`.
- Added a WorkflowHarness test for a `provider_llm`/product N6 scenario with an over-budget fixture after compression is already applied.
- The test proves the scenario blocks with `TOKEN_BUDGET_OVER_LIMIT_AFTER_COMPRESSION`, provider gateway call count stays `0`, ranked/admission/routing artifacts are not written, context refs remain auditable, and no NeedCandidate authority record is created.
- This is the first production-shaped end-to-end local N6 token-gate path; live OpenAI/DashScope canaries and automatic compression retry remain pending.

## 2026-05-30 - Readiness Review Findings Fix Slice Implemented
- Fixed audit gap: `TopicSelectionAgentInvocationAuditSnapshot` now requires `token_budget_gate_result`, and `AgentOrchestrator` writes the gate result into both invocation results and audit artifacts.
- Fixed debate-slot bypass: v1a N6 `TopicSelectionNeedDiscoveryDebateLoopService` now binds first-slice context runtime profiles for explorer, deep critic, arbiter issue framing, and arbiter final synthesis before calling `AgentOrchestrator`.
- Fixed Codex cached exact reuse gap: `codex_assisted` cached reuse now requires operator approval or explicit local approval setting plus exact non-provider reuse provenance, with response hash, prompt packet hash, profile hash, and approval drift checks before schema validation.
- Fixed provider telemetry gap: `BackendLlmGateway` records provider-side cache hit/read/write fields from provider usage details, and resource-sampling telemetry aggregation preserves them as provider telemetry only.
- Added compression report recording at the orchestration boundary: when token budget requires compression and the caller supplies compressed material, `AgentOrchestrator` records a quality-gated `TopicSelectionCompressionReportEnvelope` diagnostic artifact and still blocks provider execution until node-level prompt/context rewrite is wired.
- Added focused tests for audit gate persistence, Codex reuse provenance artifact recording, v1a N6 debate token-budget preflight, provider-side cache telemetry, and compression-report artifact recording.

## 2026-05-30 - v1a N6 Single-Agent Compression-And-Rerender Slice Implemented
- Extended `TopicSelectionGenerateNeedCandidateOrchestratorAdapterService` with a first-slice deterministic compression loop for single-agent N6 provider/Codex/mock invocations.
- The adapter now evaluates the fully rendered N6 prompt with `TopicSelectionTokenBudgetGateService` before invoking `AgentOrchestrator`; only `requires_compression` enters the local compression path.
- The compression path creates a `context_compression_report` artifact through the existing artifact boundary, using `TopicSelectionCompressionRuntimeService` for source refs, hashes, redaction policy, token estimates, executor kind, strategy version, and quality gate.
- The compressed prompt payload carries a `compressed_context` block with source context packet hashes, a synthetic compression report ref, compacted exploration/arbiter payloads, and a preserved fact inventory for method-family gaps, source-health warnings, unresolved challenges, blockers, and residual risks.
- The final invocation passes the compression report artifact ref into `AgentOrchestrator` runtime provenance and re-runs the token-budget gate with compressed estimates before any provider call.
- `WorkflowHarness` now includes the compression report artifact ref in generated N6 trace source/artifact refs, keeping replay/audit visibility while preserving authority-write boundaries.
- Added adapter and WorkflowHarness tests proving an over-target N6 provider-shaped fixture records the report, re-renders compressed context, performs exactly one gateway call, and still runs schema validation, candidate admission, supplemental routing, and persistence gates.
- No provider SDK path, provider secret/config, Prisma schema, or desktop UI change was introduced.

## 2026-05-30 - v1a N6 Compression Negative Closure
- Added adapter tests for two failure modes after compression is attempted:
  - compressed context is still over budget, which records a `context_compression_report` artifact but blocks before provider calls and before ranked/admission/routing/authority writes;
  - compression quality gate drops required preserved facts, which surfaces `COMPRESSION_QUALITY_GATE_BLOCKED` at the N6 adapter result and still blocks provider/authority side effects.
- Added a WorkflowHarness scenario for the post-compression over-budget path, proving the compression report remains visible in trace refs while gateway call count and NeedCandidate authority writes stay at zero.
- Tightened adapter failure semantics so compression quality blocker/warning codes are merged into the top-level N6 result instead of being hidden behind the secondary token-budget block.

## 2026-05-30 - Compression Identity Binding Slice
- Extended `TopicSelectionPromptPacketIdentity` with explicit `compression_report_ref`, `compression_report_hash`, and `compressed_context_hash` fields. These fields are required in the shared prompt identity contract and default to `null` only when no compression participated in the rendered prompt.
- Extended the backend runtime key builder so compression report drift and compressed context drift change the prompt packet hash. This prevents a compressed prompt from sharing identity with the original long-context prompt or with a different compression report artifact.
- Extended `TopicSelectionAgentInvocationProvenance` and `TopicSelectionAgentOrchestratorService` runtime provenance with `compression_report_hash` and `compressed_context_hash`, in addition to the existing compression report ref.
- Updated the v1a N6 single-agent adapter to pass the recorded `context_compression_report` artifact hash plus the compressed context hash into `AgentOrchestrator` for both successful compressed invocations and blocked post-compression paths.
- Tightened Codex-assisted prompt identity handling: a supplied `prompt_packet_hash` is accepted only when it matches the current runtime-computed prompt hash, including compression identity. This prevents a stale Codex/reuse prompt hash from masking compression report drift.
- Added focused tests proving compression identity is schema-required, key-builder-bound, included in invocation provenance, and drift-sensitive at the prompt packet hash layer.
- This slice still does not add live provider canaries, DB persistence fields, desktop UI, or provider SDK/config changes.

## 2026-05-30 - Prompt Packet Runtime And Quality Gate Slice
- Added `apps/backend/src/services/topic-selection-prompt-packet-runtime-service.ts` as the first runtime prompt-packet builder.
- The service creates a redacted/ref-backed prompt artifact envelope and a schema-validated `PromptQualityReport` from the rendered messages, source refs, context packet hashes, prompt variant, slot/profile hash, model option, normalized params, compression identity, runtime modifiers, output contract, and redaction policy.
- `AgentOrchestrator` now runs prompt packet preparation for runtime-enabled invocations before token-budget preflight, records redacted prompt and prompt-quality diagnostic artifacts, binds the runtime-computed prompt hash into provenance, and blocks prompt-quality failures before provider/Codex/mock execution.
- Runtime prompt provenance now includes `redacted_prompt_artifact_ref` and `prompt_quality_report_ref` without persisting rendered prompt text.
- Prompt quality blockers currently cover missing source/context refs, dynamic material override-policy violations, and forbidden secret/raw-log payload shapes. Governance phrases such as `no_hidden_reasoning` and natural terms such as `risk-aware` are explicitly not treated as secret or hidden-reasoning leakage.
- Added focused tests for redacted prompt artifact creation, forbidden secret/raw-provider-log blocking before provider calls, profile/slot drift rejection, missing source-ref blocking, and N6 debate regression coverage.
- This slice does not add a persisted prompt cache index, semantic response cache, provider canaries, DB schema changes, or desktop UI changes.

## 2026-05-30 - Prompt Packet Cache Primitive Slice
- Added a shared `TopicSelectionPromptPacketCacheResultEnvelope` contract and schema test.
- Added `apps/backend/src/services/topic-selection-prompt-packet-cache-service.ts` with an artifact-ref-only prompt packet cache/index boundary.
- The service indexes exact `prompt_packet_hash` hits to existing redacted prompt artifact refs and prompt quality report refs, including artifact hashes, prompt variant, invocation slot, profile hash, output contract, redaction policy, freshness, quality decision, blockers, warnings, and provenance.
- Cache hits do not contain prompt payload text, do not store or return provider responses, and are not sufficient to skip provider/Codex/mock execution, schema validation, deterministic gates, or authority boundaries.
- Stale prompt packet index entries block or miss according to the slot profile cache policy. Stored-entry drift, profile/slot drift, output-contract drift, redaction drift, compression identity drift, model option drift, normalized params drift, and runtime-modifier drift block as `blocked_drift`.
- Added unit tests for exact hits, stale block/miss behavior, disabled-cache `not_applicable`, drift blocking, and put-if-absent preservation of the first exact artifact refs.
- This slice remains a backend primitive. It does not add a persisted DB index, does not silently reuse responses, does not change provider call behavior, and does not run live provider canaries.

## 2026-05-30 - Prompt Packet Cache Read-Through Wiring Slice
- Wired `TopicSelectionPromptPacketCacheService` into `TopicSelectionAgentOrchestratorService` for runtime-enabled invocations.
- `AgentOrchestrator` now builds the exact prompt packet identity first, checks the prompt packet cache, and on an exact hit reuses only the existing redacted prompt artifact ref and prompt quality report ref.
- Prompt cache misses still record redacted prompt and prompt-quality artifacts through the control plane, then index their refs and artifact hashes with put-if-absent semantics.
- Stale or drifted prompt cache entries become prompt-runtime blockers before provider/Codex/mock execution; they do not fall through to unsafe artifact reuse.
- Exact prompt cache hits are compared against the current runtime-computed `PromptQualityReport`; quality-decision/blocker/warning drift blocks before execution instead of trusting an old quality report.
- Provider execution semantics are unchanged: a provider-mode prompt cache hit still calls `BackendLlmGateway.createStructuredOutput`, records live provider provenance/telemetry, and reports response cache status as `not_applicable`.
- Added orchestrator regression tests proving exact prompt cache hits reuse prompt artifacts without reusing provider responses or reducing live provider call count, and proving stale quality-report drift blocks before provider execution.

## 2026-05-30 - Minimal Provider Canary Harness Slice
- Added `apps/backend/src/services/topic-selection-provider-canary-service.ts` as a thin provider-canary harness over the existing `AgentOrchestrator -> BackendLlmGateway` boundary.
- The canary deliberately uses the implementation-ready v1a N6 need-candidate runtime profile, because broader v1b/v1c provider rows remain inventory/planned until their rows are promoted.
- The harness supports OpenAI and DashScope model-option routes for two checks:
  - provider-required prompt-cache exact hit: invoke the same runtime prompt twice and verify two gateway calls still occur while only redacted prompt artifact refs and prompt-quality report refs are reused;
  - token over-budget fixture: set the estimated input above the context window after compression and verify provider call count remains `0`.
- The canary fails closed if the resolved context profile no longer carries the `provider_required_live` execution modifier.
- Added `apps/backend/src/services/topic-selection-provider-canary-service.unit.test.ts` with fake-gateway canaries for OpenAI and DashScope. These local tests also assert provider-side cache telemetry remains telemetry and does not become response reuse.
- Added optional live OpenAI/DashScope test entries gated by `T112_PROVIDER_CANARY_LIVE=1`, `BACKEND_TEST_PRESERVE_REAL_ENV=1`, and the relevant provider key. They are skipped by default so normal CI/dev runs do not require secrets or spend provider budget.
- This slice does not add a second provider path, direct SDK usage, provider secrets, DB prompt index, desktop UI, or v1c provider-canary workflow wiring. Live provider evidence was gated at introduction time and was later collected after explicit approval.

## 2026-05-30 - Persistent DB Prompt Packet Index Slice
- Added Prisma SSOT model `TopicSelectionPromptPacketCacheIndex` and migration `20260530170000_add_topic_selection_prompt_packet_cache_index`.
- The persistent index stores exact prompt-packet identity metadata, artifact refs, artifact hashes, quality decision, freshness status, provenance ref, blocker codes, and warning codes only.
- The table intentionally does not store rendered prompt text, prompt payloads, provider responses, provider telemetry payloads, secrets, credentials, or authority payloads.
- Moved the prompt cache store interface to `apps/backend/src/repositories/topic-selection-prompt-packet-cache-store.repository.ts`, keeping `TopicSelectionPromptPacketCacheService` dependent on an abstract store rather than Prisma.
- Added `apps/backend/src/repositories/prisma/prisma-topic-selection-prompt-packet-cache-store.ts` implementing `findByPromptPacketHash` and put-if-absent semantics over Prisma, including duplicate-race handling.
- Wired `buildApp` so Prisma-backed deployments use the persistent prompt packet cache store, while memory deployments still use the in-memory store. Tests can still inject a custom store.
- The Prisma-backed app wiring opts into a missing-table fallback for this cache-only index: until an approved migration is applied to a target DB, prompt-cache lookup behaves as miss and put behaves as no-op. This keeps the cache non-authoritative and prevents pending DB apply from blocking live topic-selection flows.
- Added repository tests proving the Prisma store persists artifact-ref-only rows, preserves first-writer semantics, maps stale/blocking metadata back into cache entries, and never persists prompt/provider payload fields.
- Refreshed `docs/context/db/schema.json` through DB SSOT sync. Local/dev DB apply is recorded in the follow-up apply section below; staging/prod apply remains pending explicit environment approval.

## 2026-05-30 - Persistent DB Prompt Packet Index Local/Dev Apply
- After explicit DB write approval, applied `20260530170000_add_topic_selection_prompt_packet_cache_index` to the local/dev PostgreSQL target loaded from `.env.local`.
- Post-apply `prisma migrate status` reports the local/dev database schema is up to date.
- Ran a real Prisma store smoke against the migrated table: insert exact prompt packet index row, read by `promptPacketHash`, confirm duplicate put-if-absent preserves the first writer, then clean up the smoke row.
- The missing-table fallback remains in app wiring for environments that have not yet applied the migration; it is a cache-only safety path and is not used as an authority source.

## 2026-05-30 - Production-Shaped Runtime Verification
- Ran LLM registry/config gates and local provider canary tests. Registry/config passed; local provider canaries passed with 34/36 active tests and 2 live-provider tests skipped by explicit env/key gate.
- Ran real Prisma prompt-index smoke over `AgentOrchestrator` with a stub provider gateway. Exact prompt packet cache hit reused redacted prompt and prompt-quality artifact refs while still making two provider gateway calls; provider response cache status stayed `not_applicable` and response reuse refs stayed `null`.
- Ran real Prisma over-budget smoke over the same runtime boundary. Token-budget gate blocked with `blocked_over_budget` before provider execution and provider gateway call count `0`.
- Created local/dev balanced resource sample fixture `resource_sample_set_t112_prod_balanced_20260530` because the default deterministic sample underfilled the `baseline` role for v1a replay harness verification.
- Prisma-backed v1a N1-N9 main WorkflowHarness smoke passed with the balanced sample, deterministic mock LLM, and no external provider calls. It persisted an N6 prompt index row with hash `6b124fc37338c6179d4779d1327ca079d78b7eee5a1c6f3236a609a3af1f04e0`.

## 2026-05-30 - Production-Shaped Replay Finding Fix
- Fixed `.ai/scripts/topic-selection-v1a-harness-e2e.mjs` so HTTP assertion failures preserve structured controller error metadata (`statusCode`, `errorCode`, `details`, response body, and parsed payload).
- Fixed `expectReplayInputHashMismatch` control flow so it only handles errors thrown by the harness request and no longer catches its own assertion failure as an unexpected transport error.
- Corrected the replay drift fixture from `scenario_input.policy_version` to `output_schema_version`. The harness route envelope intentionally overwrites `policy_version` from the supported route policy, while `output_schema_version` participates in N6-N9 input hashes and is valid for exercising replay drift.
- Re-ran the Prisma-backed v1a replay smoke with `resource_sample_set_t112_prod_balanced_20260530`. Exact replay preserved authority counts and LLM call count `0`; drifted N6-N9 replay inputs all produced `REPLAY_INPUT_HASH_MISMATCH` without invoking the LLM gateway.
- Closed the default deterministic mock sampling underfill without relaxing production resource-sampling guardrails. When mock sampling does not cover all harness roles, the script records the underfilled sample and falls back to the T-112 balanced replay fixture for local/dev smoke verification.

## 2026-05-30 - Live Provider Canary Evidence
- After explicit approval to use local provider configuration, ran live OpenAI and DashScope provider canaries through the existing `AgentOrchestrator -> BackendLlmGateway` path.
- The live unit canary suite passed with 6/6 tests active: local fake-gateway semantics, OpenAI live invocation, and DashScope live invocation all passed.
- Ran an additional production-shaped Prisma live evidence script using real `BackendLlmGateway`, Prisma control-plane artifacts, and the Prisma prompt packet cache index.
- For both OpenAI and DashScope, exact prompt-cache hits reused only redacted prompt artifact refs and prompt-quality report refs while still making two live provider calls. Provider response cache status stayed `not_applicable`, and response reuse refs stayed `null`.
- For both providers, over-budget fixtures blocked before provider execution with `TOKEN_BUDGET_OVER_LIMIT_AFTER_COMPRESSION` and provider call count `0`.
- Temporary prompt index rows and diagnostic artifacts from the direct live evidence run were cleaned; post-cleanup counts were `0/0`.

## 2026-05-30 - v1a Runtime Closure Finding Fix
- Closed the v1a review finding that N5/N7/N8 still had `AgentOrchestrator` LLM calls without T-112 runtime preflight. Added registered context runtime profiles for:
  - v1a N5 `evidence_extraction`;
  - v1a N7 `adjudication_recommendation`;
  - v1a N8 `confirmation_semantic_review`.
- Wired `WorkflowHarness` so N5/N7/N8 invocations now pass `runtime_token_budget` with slot-specific profile ids, prompt-template ids, context families, context payloads, and explicit context packet hashes.
- Wired the v1a N6 context packet read-through cache into the main app/harness path by injecting `TopicSelectionContextPacketCacheService` and passing runtime cache bindings into `TopicSelectionNeedDiscoveryContextCompilerService`.
- Resolved provider/model profile metadata before building N6 runtime context cache bindings, so provider-required keys include concrete `model_option_id` and `normalized_params_hash` rather than a provider-mode placeholder.
- Exposed `runtime_cache_key_hash` on need-discovery context packets and compiled context pairs. This makes the shared runtime cache key auditable separately from the packet-local compatibility `cache_key`.
- Changed `AgentOrchestrator` prompt packet identity to prefer explicit `context_packet_hashes`; callers may still fall back to legacy ref hashing only when explicit packet hashes are unavailable.
- Updated the N6 single-agent adapter and debate loop so prompt identity uses actual exploration/arbiter context payload hashes. Debate roles now bind role-appropriate context refs/hashes instead of every role carrying both exploration and arbiter context refs.
- Relaxed adapter artifact-ref expectations for context cache hits from "same workflow run" to "same semantic context contract." A context cache hit may legitimately return an artifact ref from the source workflow run; consumers still validate title card, context family, policy/schema/profile, execution mode, and payload hash.
- Kept compression quality rules in the shared compression runtime and runtime profile contracts. No node-local compression quality fork was introduced in this repair.
- This repair does not promote resource sampling, v1b, or v1c rows to implementation-ready status, and it does not add provider SDK paths, provider secrets, semantic response cache, or desktop UI.
