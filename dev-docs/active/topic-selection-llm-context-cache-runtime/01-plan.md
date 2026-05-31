# 01 Plan

## Phase 0 - Current-State Inventory
- Inventory all topic-selection LLM-like call paths:
  - resource sampling classification;
  - v1a evidence extraction, need generation, adjudication, semantic confirmation;
  - v1b semantic draft/support nodes;
  - v1c promotion support and feedback normalization;
  - downstream feedback/recheck bridges that consume topic-selection outputs.
- Classify existing mechanisms as context hash, prompt hash, replay hash, telemetry, cache marker, compression marker, or true reusable cache.
- Upgrade `06-node-scope-matrix.md` into the implementation gate for T-112:
  - every LLM-capable invocation slot MUST have an explicit row before shared runtime behavior is implemented for that surface;
  - row granularity is slot-level rather than node-level, so debate roles, semantic support artifacts, and provider canary surfaces are separate rows;
  - v1c bounded micro-debate MUST be split by role slot, and v1c provider canary surfaces MUST be split by provider-required invocation surface;
  - every row MUST identify the node policy adapter or context compiler that owns semantic context construction;
  - every row MUST define token-budget, compression, context-cache, response-reuse, and authority-boundary behavior.
- Record node gaps in `06-node-scope-matrix.md`.
- Runtime implementation MUST NOT allow node-local cache, compression, or response-reuse semantics that are not represented in the matrix.

## Phase 1 - Policy And Contract Design
- Define shared vocabulary:
  - `context_packet`;
  - `context_policy_profile`;
  - `prompt_packet`;
  - `invocation_cache_key`;
  - `token_budget_gate`;
  - `compression_report`;
  - `response_reuse_provenance`.
- Define `ContextPolicyProfile` as the slot-level unit that binds suitable context, memory inclusion, compression, token-budget behavior, cache behavior, response reuse, post-reuse gates, and provenance requirements.
- Define reusable functional templates and execution modifiers, while requiring every slot to bind an explicit profile.
- Define context source taxonomy, memory-policy semantics, compression-policy semantics, cache-policy semantics, token-budget runtime order, and profile versioning fields.
- Define shared profile registry contracts and a backend resolver that validates profile schema/hash, binds profiles to invocation slots, and fails closed on missing or drifted profiles.
- Define the shared runtime kernel contract:
  - it owns mechanical policy enforcement, key validation, token-budget preflight, cache/reuse envelope validation, compression report validation, and provenance;
  - it does not own node semantic context construction, preservation rules, or authority writes.
- Define stage adapter/facade contracts:
  - v1a, v1b, v1c, and resource-sampling adapters own workflow-specific context construction and handoff semantics;
  - all adapters delegate key building, token-budget decisions, cache/reuse enforcement, compression report validation, and provenance semantics to the shared runtime kernel;
  - independent stage-owned cache/compression/reuse/token-budget/provenance kernels are forbidden.
- Lock cache classes:
  - context packet cache;
  - prompt packet cache;
  - response reuse cache;
  - artifact/projection cache;
  - durable business memory.
- Define prompt packet identity as the full invocation prompt package, not only the system prompt.
- Define controlled dynamic prompt material for debate/repair/finalization workflows.
- Define prompt-template lint, runtime `PromptQualityReport`, and prompt effectiveness telemetry.
- Define unified runtime audit envelope plus simplified `operator_audit_summary` and `human_trust_summary` projections.
- Define drift blockers for source refs, input hash, policy version, schema version, compiler version, profile hash, model option, execution mode, context family, and redaction policy.

## Phase 1A - Implementation Readiness Gate
- Treat `06-node-scope-matrix.md` as two layers:
  - full slot inventory for coverage and governance;
  - implementation-ready matrix rows for slots that may be wired into runtime behavior.
- Use `08-first-slice-implementation-prep.md` as the file-level implementation preparation plan for the first code slice.
- Promote only v1a N6 rows into the first implementation-ready slice.
- Require first-slice v1a N6 rows to define:
  - registered `ContextPolicyProfile` id/version/hash;
  - prompt variant key and dynamic material refs where applicable;
  - exact token-budget limits and unknown-estimate behavior;
  - compression mode, executor, preserved facts, and quality blockers;
  - context cache key fields and stale miss/block behavior;
  - prompt packet hash inputs and `PromptQualityReport` blockers;
  - response reuse permission and approval requirements;
  - audit envelope/projection expectations;
  - focused contract, unit, and harness tests.
- Begin implementation with shared contracts/schema tests and runtime primitives before any node wiring.
- Keep resource sampling, v1b, and v1c runtime wiring deferred until their rows are promoted to implementation-ready status.

## Phase 1B - Contract-First Slice
- Status: done for shared contracts and schema tests.
- Added shared runtime contracts for profile registry, context cache key/result, token-budget gate, compression report, prompt packet identity, prompt quality, exact response reuse provenance, runtime audit envelope, and audit projections.
- Added schema tests for first-slice contract blockers before backend runtime or node wiring.
- Backend registry/key, token-budget, and context-cache primitives are now complete; reuse/audit primitives remain next.

## Phase 1C - Backend Registry And Key Primitive Slice
- Status: done for first-slice registry and key builders.
- Added hardcoded v1a N6 `ContextPolicyProfile` defaults and resolver.
- Added fail-closed validation for profile schema, duplicate profile/slot ids, provider live-call policy drift, compression quality drift, cache-key field drift, forbidden payload class drift, preserved fact drift, version mismatch, slot mismatch, and expected profile hash drift.
- Added stable context packet cache key and prompt packet identity builders.
- Verified key hashes change on slot, context family, profile, model option, prompt variant, and dynamic material hash changes.
- No node wiring, provider call changes, or persistence changes were introduced.

## Phase 1D - Backend Token Budget Primitive Slice
- Status: done for the first-slice estimator and token-budget gate service.
- Added the deterministic local `ConservativeTokenEstimator`.
- Added a token-budget gate service that emits schema-validated `within_budget`, `requires_compression`, `blocked_over_budget`, and `budget_unknown_allow_with_warning` decisions.
- Gate decisions use the slot `ContextPolicyProfile` token-budget policy, compression policy, safety margin, output budget, context window, and unknown-estimate behavior.
- Over-budget provider execution is not wired yet; this slice only provides the reusable primitive and tests.
- No `AgentOrchestrator` wiring, provider call changes, persistence fields, provider config, or provider canaries were introduced.

## Phase 1E - Backend Context Packet Cache Primitive Slice
- Status: done for the first-slice context packet cache service boundary.
- Added an artifact-ref-only context packet cache store/service.
- Exact cache-key hits return the existing artifact ref and artifact hash through the shared result envelope.
- Stale entries return `blocked_stale` or `miss` according to the slot `ContextPolicyProfile`.
- Context-family, profile-hash, schema, redaction, cache-scope, and source-ref drift return `blocked_drift`.
- Put-if-absent recording preserves an existing exact artifact ref and does not store business payloads.
- No node context compiler read-through wiring, persistence fields, provider call changes, or provider canaries were introduced.

## Phase 1F - Production-Shaped Local Runtime Tests
- Status: done for the v1a N6 context compiler cache-read-through local path.
- Added tests using the real v1a N6 context payloads, artifact boundary, in-memory control-plane repository, and runtime context packet cache service.
- Verified repeated compilation of the same N6 attempt reuses existing exploration and arbiter context artifact refs without creating duplicate context artifacts.
- Verified stale or context-family-drifted runtime cache entries block before any context artifact write.
- Kept provider execution mocked/out of scope; this layer proves artifact/cache semantics before live provider canaries.

## Phase 1G - Production-Shaped Token Budget Harness Layer
- Status: done for the v1a N6 single-agent provider path and v1a N6 debate slots.
- Added optional runtime token-budget input to `AgentOrchestrator` and evaluates the resolved `ContextPolicyProfile` before source execution.
- Over-budget provider invocations block before `BackendLlmGateway.createStructuredOutput`, emit audit/blocker codes, and preserve provider provenance fields without pretending a live call happened.
- v1a N6 adapter now binds the first-slice need-candidate-generation profile and passes the gate input for single-agent generation.
- v1a N6 debate loop slots now bind their own first-slice context runtime profiles before each explorer, critic, issue-framing, and final-synthesis invocation.
- Added focused tests proving over-budget N6 provider fixtures have provider call count `0` and do not write ranked draft artifacts.
- Token-budget gate results are now included in invocation result/audit snapshots whenever runtime preflight is supplied.
- v1a N6 single-agent compression prompt rewrite is implemented for the first slice; broader slots still block or defer unless they have explicit compression wiring.

## Phase 1H - Backend Compression Runtime Primitive
- Status: done for the compression report and quality-gate primitive plus `AgentOrchestrator` report recording on supplied compression attempts.
- Added a backend compression runtime service that creates schema-validated `TopicSelectionCompressionReportEnvelope` records from a resolved `ContextPolicyProfile`.
- The primitive enforces profile hash, source refs, redaction policy, compression strategy id/version, and allowed executor kinds before report creation.
- The quality gate blocks forbidden persisted payload classes such as hidden reasoning, raw provider logs, credentials, provider secrets, API keys, and unredacted private content.
- The quality gate blocks when compressed fact inventory drops required preserved facts declared by the profile, including blockers, residual risks, accepted risks, source-health warnings, method-family gaps, unresolved challenges, and recheck hints.
- The primitive emits before/after conservative token estimates and warns when compression does not reduce the estimate.
- `AgentOrchestrator` now records `TopicSelectionCompressionReportEnvelope` diagnostic artifacts when token budget requires compression and the caller supplies compressed context/summary material.
- This layer does not yet rewrite v1a N6 prompt/context messages or route compressed context into a live provider retry; that remains a node compiler integration step.

## Phase 1I - Production-Shaped WorkflowHarness Token Gate Verification
- Status: done for the v1a N6 single-agent provider over-budget harness path.
- `TopicSelectionWorkflowHarnessGenerateNeedCandidateInput` now accepts runtime token-budget overrides and includes them in the generate-need-candidate replay/hash identity.
- The harness passes runtime token-budget overrides into the v1a N6 adapter so production-shaped scenarios can exercise the same `AgentOrchestrator` preflight path as adapter tests.
- Added a WorkflowHarness provider fixture proving an over-budget N6 attempt blocks before gateway execution, does not write ranked/admission/routing artifacts, and does not create NeedCandidate authority records.
- This is still local provider-shaped verification using the existing fake gateway; OpenAI/DashScope live canaries remain a later explicit step.

## Phase 2 - Context Packet Cache Runtime
- Add read-through cache lookup for compiled context packets before recording a new artifact. Done for the v1a N6 context compiler local path; broader node/harness rollout pending.
- Ensure cache hits return existing artifact refs and mark `cache_hit=true`. Done for the v1a N6 context compiler local path.
- Treat context packet cache as cross-provider/cross-mode context identity and preprocessing reuse, not provider response reuse.
- Implement the cache as an artifact-ref index: exact keys, hashes, artifact refs, freshness/status, and provenance metadata only. Done for the backend primitive.
- Return standardized cache results: `hit`, `miss`, `blocked_stale`, `blocked_drift`, `bypassed`, or `not_applicable`. Done for the backend primitive.
- Ensure stale keys miss or block according to node policy. Done for the backend primitive.
- Use idempotent put-if-absent behavior when a miss compiles and persists a new context packet artifact. Done for the backend primitive.
- Preserve current artifact boundary behavior and forbid cache hits across context families. Done for the backend primitive and v1a N6 context compiler local path.

## Phase 3 - Token Budget Gate
- Add provider-call preflight in `AgentOrchestrator` or a small runtime collaborator. Done for v1a N6 single-agent provider path; broader node rollout pending.
- Implement the first-slice `ConservativeTokenEstimator` as the only token estimator. Done for the backend primitive.
- Keep provider-aware tokenizers out of scope for the first slice; record provider actual token telemetry for calibration only.
- Estimate prompt/context/schema output budget before `BackendLlmGateway.createStructuredOutput`. Done for v1a N6 single-agent provider path; broader provider paths pending.
- Return typed gate outcomes. Done for the backend primitive:
  - `within_budget`;
  - `requires_compression`;
  - `blocked_over_budget`;
  - `budget_unknown_allow_with_warning`.
- Route `requires_compression` only through node-approved compression strategies. Pending runtime compression integration; first-slice N6 currently blocks instead of invoking a compressor.
- Require every profile to declare output budget and safety margin. Done for the first-slice registry profiles.

## Phase 4 - Compression Runtime
- Implement ref-backed compression layers with compiler version, source refs, hashes, redaction policy, token estimates, and quality-gate status. Done for backend report/quality-gate primitive and v1a N6 single-agent artifact persistence/prompt rewrite; broader node wiring remains pending.
- Support first-slice compression executor kinds:
  - `deterministic_structural` for structural trimming, chunking, ref preservation, and deterministic digests;
  - `codex_assisted` for semantic long-context compression when the slot profile allows it.
- Treat Codex compression as a non-authority artifact-producing executor; profile/runtime owns eligibility, quality gate, provenance, and cache-key behavior. Done for eligibility/report quality primitive; Codex execution path remains pending.
- Keep raw provider logs, hidden reasoning, credentials, and unredacted secrets out of persisted artifacts. Done in backend quality gate for compressed payloads and summaries.
- Add node-specific compression policies for broad exploration context versus strict arbiter/gate context.

## Phase 5 - Exact Response Reuse
- Add exact invocation cache keys for approved replay/Codex-assisted cost-saving paths. Done for the `AgentOrchestrator` Codex cached-exact path; broader response reuse index remains pending.
- Forbid silent provider response reuse in `provider_llm`. Done at `AgentOrchestrator` source execution boundary; provider path still executes live or blocks.
- Forbid cross-provider provider-response reuse; provider responses, provider telemetry, provider-side cache hits, and provider-specific repair results are not business cache targets.
- Keep Codex-assisted, provider-LLM, and mocked execution in one runtime while separating execution provenance and response-reuse permissions.
- Store reusable response payloads as ref-backed artifacts; use the reuse index only for exact keys, response hash, artifact ref, approval/provenance metadata, and freshness/status.
- Require Codex-assisted exact reuse to carry operator approval or explicit local approved-reuse setting plus `non_provider=true`. Done in `AgentOrchestrator` with exact response hash, prompt packet hash, profile hash, and approval/local-setting drift checks.
- Restrict mocked reuse to test/acceptance fixtures with fixture/replay provenance.
- Require reused responses to pass schema validation, deterministic gates, audit recording, and authority-write boundaries.
- Record source workflow/node/attempt, source execution mode, response hash, prompt/context hashes, schema/profile/policy versions, and approval ref. Done for Codex cached-exact reuse through a diagnostic reuse-provenance artifact.

## Phase 5A - Prompt Packet Cache And Quality
- Treat `prompt_packet_hash` as the hash of the complete invocation prompt packet, including slot, role, stage, scenario, template version, context refs/hashes, dynamic material refs/hashes, output contract, model/profile params, runtime modifiers, and redaction policy.
- Store prompt cache/index rows as metadata only: prompt hash, template id/version, variant key, context/dynamic hashes, model/profile params hash, output contract, redaction policy, artifact ref, and provenance. Done for the backend primitive and `AgentOrchestrator` read-through path.
- Persist full prompt payloads only as redacted, ref-backed artifacts when replay/audit/debugging requires them. Done for runtime-enabled `AgentOrchestrator` invocations.
- Require `prompt_variant_key` for complex workflows such as v1a N6 debate roles, v1c bounded debate roles, repair stages, and final synthesis.
- Allow LLM roles to produce dynamic prompt material only as schema-validated, ref-backed artifacts rendered by fixed prompt compilers.
- Add prompt quality gates using static template lint plus runtime `PromptQualityReport`. Done for first-slice runtime prompt preparation.
- Reuse exact prompt packet cache hits only for redacted prompt artifact refs and prompt quality report refs; provider/Codex/mock response execution, schema validation, deterministic gates, and authority boundaries still run.
- Record prompt effectiveness telemetry without allowing it to retroactively change business authority.

## Phase 5B - Invocation Audit And Human Projections
- Emit one append-only `runtime_audit_envelope` for every provider, Codex-assisted, mocked, reuse, cache-hit, and compression-relevant invocation path.
- Include workflow/node/slot/attempt identity, execution mode, executor kind, profile/schema/policy/template/model hashes, context/cache/compression/prompt/token/reuse/schema/gate/authority outcomes, and blocker/warning codes.
- Record provider telemetry only for live provider calls.
- Generate `operator_audit_summary` as a developer/operator projection for debugging and review.
- Generate `human_trust_summary` as a simplified product/human-confirmation projection focused on source refs, risks, gaps, recheck hints, live/non-provider labeling, deterministic gate status, and human confirmation.
- Require every projection to reference the source audit envelope ref/hash and forbid projections from rewriting decisions or becoming business authority.

## Phase 6 - Node Integration
- Use v1a N6 as the first deep integration chain.
- Integrate policies into:
  - resource sampling;
  - v1a N5/N6/N7/N8;
  - v1b semantic draft/support nodes, with v1b N7 treated as a core topic-question-contract context hub;
  - v1c promotion support and feedback normalization;
  - downstream recheck/feedback normalization where model-like execution exists.
- Ensure direct `BackendLlmGateway` callers move behind a runtime provider wrapper before provider execution.
- Ensure external artifact admission paths use runtime validation/provenance/reuse policy without triggering provider execution.
- Avoid node-local cache semantics outside shared contracts.

## Phase 6A - First Deep Slice: v1a N6
- Integrate the shared runtime with v1a N6 single-agent and debate slots only after the first-slice readiness gate passes.
- Production-shaped local cache tests are in place for the context compiler before provider/harness wiring.
- Implement shared contracts and schema tests first:
  - `ContextPolicyProfile` registry contract;
  - context cache result envelope;
  - token-budget gate result;
  - compression report envelope;
  - prompt packet identity and `PromptQualityReport`;
  - exact response reuse provenance and approval fields;
  - runtime audit envelope and projections.
- Implement backend runtime primitives next:
  - profile registry skeleton with hardcoded TypeScript defaults;
  - shared key builders;
  - `ConservativeTokenEstimator`;
  - token-budget gate service;
  - context packet cache read-through interface;
  - response reuse policy skeleton;
  - audit envelope/projection builders.
- Validate `invocation_slot_id` isolation across single-agent, explorer, deep critic, arbiter issue framing, and arbiter final synthesis.
- Validate `exploration_context` cannot satisfy `arbiter_context`, and stale context family/source/profile drift misses or blocks.
- Validate Codex-assisted compression for long exploration context only when the profile allows it, with quality gate enforcement before provider/Codex/mock invocation.
- Validate deterministic structural compression for the first v1a N6 single-agent path: done with adapter and WorkflowHarness provider-shaped tests.
- Validate cache/reuse hits still run schema validation, candidate admission, persistence gates, and authority write boundaries.
- Defer resource sampling, v1b, and v1c direct-provider paths until their implementation-ready rows are expanded.

## Phase 7 - Verification And Cleanup
- Add contract, unit, HTTP, harness, and provider canary tests.
- Delete or retire any node-local cache markers that become redundant.
- Run governance sync/lint and record results in `04-verification.md`.

## Next Phase 1 - v1a Runtime Closure Pack

### Objective
- Freeze the current v1a T-112 implementation as the reference baseline before promoting v1b/v1c rows.
- Close the v1a scope at the level of tests, docs, verification evidence, usage guidance, and commit grouping.
- Make the next handoff explicit: v1b N7 can start only after the v1a runtime closure pack has passed its exit criteria.

### Scope
- Include the v1a runtime policy stress tests:
  - N1/N2/N3/N4 deterministic context producer and N9 publish-boundary stress;
  - N5/N6/N7/N8 LLM runtime gate stress;
  - N6 context-cache hit/drift/stale stress.
- Include the Prisma-backed v1a runtime stress runner:
  - `pnpm topic-selection:v1a-runtime-stress`;
  - single-agent and multi-agent-debate modes;
  - prompt packet index growth/slot distribution checks;
  - exact replay and input-hash drift LLM call-count checks.
- Include documentation updates for usage, verification evidence, pitfalls, and acceptance status.
- Include commit grouping for the completed v1a closure work.

### Non-Scope
- Do not add new DB schema or migrations.
- Do not add live provider calls to the runtime stress runner.
- Do not promote v1b/v1c runtime wiring in this phase.
- Do not implement a persistent DB context packet cache index in this phase.
- Do not change provider routing, model registry, prompt templates, or provider credentials.

### Work Packages
- P1.1 Diff and implementation review:
  - review current v1a stress tests and runtime stress runner for duplicate runtime semantics, local cache-key formulas, response-reuse ambiguity, provider SDK bypass, hidden provider calls, and authority-boundary drift;
  - confirm the runner only uses existing `AgentOrchestrator -> BackendLlmGateway` harness paths and existing Prisma-backed app wiring.
- P1.2 Usage documentation:
  - document `pnpm topic-selection:v1a-runtime-stress`;
  - document required env assumptions: local/dev `.env.local`, migrated local/dev Prisma DB, balanced T-112 sample fixture, no provider credentials required by default;
  - document optional parameters:
    - `TOPIC_SELECTION_V1A_RUNTIME_STRESS_RUN_ID`;
    - `TOPIC_SELECTION_V1A_RUNTIME_STRESS_ITERATIONS`;
    - `TOPIC_SELECTION_V1A_RUNTIME_STRESS_MODES=single_agent,multi_agent_debate`;
    - `TOPIC_SELECTION_V1A_RUNTIME_STRESS_CHILD_TIMEOUT_MS`.
- P1.3 Verification ladder:
  - run syntax/package checks;
  - run targeted v1a runtime policy stress tests;
  - run the full WorkflowHarness test file;
  - run backend typecheck;
  - run single-agent Prisma-backed runtime stress;
  - run multi-agent-debate Prisma-backed runtime stress;
  - run project governance sync/lint.
- P1.4 Evidence consolidation:
  - keep command/results in `04-verification.md`;
  - ensure `00-overview.md` acceptance items reflect the v1a stress coverage;
  - keep pitfalls focused on historical do-not-repeat lessons, not current TODOs.
- P1.5 Commit grouping:
  - Commit A: v1a WorkflowHarness runtime policy stress coverage and T-112 docs;
  - Commit B: Prisma-backed v1a runtime stress runner, package script, usage/verification docs;
  - optionally squash into one commit only if review prefers a single v1a closure changeset.

### Exit Criteria
- Targeted stress command passes with all active v1a stress tests.
- Full `topic-selection-workflow-harness-service.unit.test.ts` passes.
- `pnpm --filter @paper-engineering-assistant/backend typecheck` passes.
- `pnpm topic-selection:v1a-runtime-stress` passes for at least:
  - `TOPIC_SELECTION_V1A_RUNTIME_STRESS_ITERATIONS=2`;
  - `TOPIC_SELECTION_V1A_RUNTIME_STRESS_MODES=single_agent`;
  - one multi-agent-debate run.
- Runtime stress evidence proves:
  - exact replay LLM call delta is `0`;
  - input-hash drift LLM call delta is `0`;
  - prompt packet index records expected N6/N7 slot rows;
  - no live provider call is required by default.
- `git diff --check` passes for touched files.
- Project governance sync/lint passes.
- The final diff is ready to commit without unresolved implementation findings.

### Risks And Mitigations
- Risk: local/dev DB stress leaves diagnostic records.
  - Mitigation: treat records as local verification artifacts; do not run against shared production DB; use explicit run ids and artifact dirs.
- Risk: stress runner is mistaken for provider canary.
  - Mitigation: docs and pitfall state it defaults to deterministic mocked LLM execution and does not spend provider budget.
- Risk: prompt packet index rows grow across repeated local stress runs.
  - Mitigation: Phase 1 records this as acceptable local/dev evidence; retention/cleanup policy is deferred to a later persistence-governance decision.
- Risk: v1a closure work delays v1b promotion.
  - Mitigation: keep Phase 1 limited to review, docs, verification, and commit grouping; no new runtime feature scope.

### Handoff Gate To v1b
- v1b N7 implementation preparation may start after Phase 1 exit criteria pass and the v1a closure commits are staged or explicitly accepted as a single pending changeset.
- The first v1b step should promote v1b N7 rows in `06-node-scope-matrix.md` from inventory to implementation-ready, then define the v1b N7 `ContextPolicyProfile`.
