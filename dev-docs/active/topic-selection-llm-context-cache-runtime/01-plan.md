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

## Next Phase 2 - v1b N7 Runtime First Slice

### Objective
- Promote v1b N7 as the first post-v1a runtime rollout slice.
- Treat v1b N7 as a context hub, support-artifact admission surface, and deterministic topic-question-contract authority gate.
- Add T-112 runtime admission, prompt identity, token-budget, compression, provenance, and replay controls without rewriting the N7 deterministic authority logic.

### Scope
- Include v1b N7 support slots:
  - `n7_candidate_grouping`;
  - `n7_failed_trial_synthesis`;
  - `n7_n8_debate_admission_review`.
- Include N7 context-hub packet/admission behavior for:
  - frozen N7 input;
  - candidate set and candidate hashes;
  - N6 handoff;
  - topic frame and workflow run context;
  - optional N8 feedback;
  - admitted semantic support artifact refs and hashes.
- Include N7->N8 and N7->N6 loopback handoff refs/hashes as runtime-auditable outputs.
- Treat N7 outputs as route-specific runtime context projections:
  - `v1b_n7_to_n8_topic_question_contract_context` for the existing `N7ToN8Handoff@v1` forward path;
  - `v1b_n7_to_n6_failed_trial_loopback_context` for N7 candidate-trial exhaustion and N6 regeneration/triage input.
- Treat N7 support-slot inputs as one runtime context family for this slice:
  - `v1b_n7_topic_question_hardening`;
  - slot separation is enforced by `invocation_slot_id`, prompt variant, profile hash, frozen input hash, and support artifact identity.
- Include prompt packet identity validation for admitted/generated support artifacts.
- Include token-budget preflight and compression report validation for support generation/admission paths that use LLM-like execution.

### Non-Scope
- Do not promote v1b N4, v1b N6, or v1b N8 in the same slice.
- Do not add a DB-backed context packet cache index in this slice.
- Do not make N7 support artifacts authority records.
- Do not allow prompt packet cache hits or response reuse to skip N7 deterministic gates.
- Do not add new provider secrets, provider registry entries, or desktop UI changes.

### Implementation Checklist
- I0 Readiness preflight:
  - keep D19-D23 locked as the first-slice scope;
  - treat v1b N7 as ready for L1/L2 implementation preparation only, not runtime promotion;
  - specify L1 unit/contract and L2 harness policy cases before wiring production/provider support generation.
- I1 Shared support artifact contract: done for the first N7 admission slice.
  - extend the v1b semantic support artifact envelope with `runtime_provenance_class`;
  - add runtime identity fields for current promoted-slot admission: context policy profile id/version/hash, prompt variant key, runtime invocation context hash, redaction policy, source hash bundle, runtime audit ref/hash, compression report ref/hash, and compressed context hash;
  - keep `fixture_replay` as the only class allowed to carry synthetic or placeholder runtime identity;
  - update shared schema tests and harness request validation so production/provider/Codex admission fails closed on missing or placeholder runtime identity.
- I2 v1b N7 `ContextPolicyProfile` registry: done for the first N7 admission slice.
  - add constants for the three N7 profiles:
    `topic-selection.v1b.n7.candidate-grouping.context-runtime@v1`,
    `topic-selection.v1b.n7.failed-trial-synthesis.context-runtime@v1`,
    `topic-selection.v1b.n7.n8-debate-admission-review.context-runtime@v1`;
  - bind each profile to `v1b_n7_topic_question_hardening`, its invocation slot id, output contract, D21 executor policy, D19 preserved facts, exact cache key fields, stale/drift behavior, and non-authority support provenance;
  - add registry tests for successful resolution, unknown profile, slot/profile mismatch, profile hash drift, disallowed provider compression, and profile-disallowed `codex_assisted` compression.
- I3 N7 runtime support admission helper: done for the first N7 admission slice.
  - introduce a dedicated admission service/helper before N7 deterministic gates;
  - distinguish absent optional support, absent conditionally required support, and malformed present support;
  - verify normalized output ref/hash, structured output hash, payload hash, support artifact hash, profile hash, prompt packet hash, runtime invocation context hash, source hashes, output contract, prompt variant, redaction policy, provenance class, and compression identity;
  - emit D23 blocker codes and return only non-authority admitted support context.
- I4 N7 context packet and route projection builder: partially done.
  - compile/admit a ref-backed N7 context packet from frozen input, N6 handoff, candidate set/order/hash list, topic frame, workflow run context, optional N8 feedback, and admitted support refs;
  - keep context packet cache process-local/runtime-only for this slice;
  - emit route-specific runtime context projections for `v1b_n7_to_n8_topic_question_contract_context` and `v1b_n7_to_n6_failed_trial_loopback_context` without creating new authority. Done for diagnostic control-plane artifacts and trace refs on the N7 forward/readmission and N7-to-N6 failed-trial loopback paths.
  - Reusable support-generation context compilation is now implemented inside `TopicSelectionV1bN7SupportRuntimeService`; process-local context packet read-through caching remains pending and is intentionally not promoted as a DB-backed context cache surface.
- I5 Runtime-backed semantic support generation: done for the first Codex/mocked N7 support path.
  - add a v1b N7 semantic support adapter that owns slot selection, context compilation, prompt variant selection, and output contract selection. Done in `TopicSelectionV1bN7SupportRuntimeService`;
  - delegate prompt packet runtime/cache, token-budget preflight, compression report validation, provider-required live-call guard, response-reuse guard, provider telemetry separation, and runtime audit to `AgentOrchestrator` or an equivalent shared runtime facade. Done for `codex_assisted` and `mocked_llm`; `provider_llm` remains profile-disallowed for N7 support slots;
  - ensure generated support artifacts are emitted as `runtime_verified` only after runtime identity, output hash, and quality gates pass. Done for generated N7 support artifacts.
- I6 N7 harness integration: done for the promoted N7 support path.
  - replace promoted-slot direct support consumption with the runtime admission helper while keeping deterministic N7 candidate selection, trial ledger, N8 admission, loopback routing, and persistence gates unchanged;
  - classify legacy direct script/provider artifacts as `legacy_unverified` diagnostics only during migration. Promoted N7 support script paths no longer use direct support artifact writers;
  - keep fixture helpers on `fixture_replay` and prevent fixture prompt hashes from entering real prompt packet cache rows.
- I7 L1/L2 verification: done for the v1b N7 first slice.
  - L1 must cover profile resolution/drift, runtime identity schema, admission class handling, prompt/cache key drift, compression preserved facts, provider compression block, and response-reuse/provider-live guards;
  - L2 must cover exact replay with zero LLM-like reinvocation, frozen input drift, support hash drift, optional absent versus malformed present support, required support missing, compression fact drop, and no authority bypass.
- I8 L3 local/dev smoke: done for the v1b N7 first slice.
  - add a Prisma-backed v1b N7 smoke covering N6->N7->N8 forward path, N8->N7 readmission, N7->N6 failed-trial loopback context projection, prompt index metadata-only behavior, and provider response non-reuse;
  - record prompt packet index deltas and runtime audit/provenance refs for each support slot.
- I9 Legacy exit: done for promoted v1b N7 support generation paths after L1-L3 pass.
  - after runtime-backed N7 support generation/admission L1-L3 pass, remove promoted-slot direct provider/script generation paths rather than soft-disabling them;
  - keep only fixture or migration diagnostics outside promoted-slot admission;
  - block v1b N4/N6/N8 runtime expansion until N7 L1-L3, minimum L5, and legacy exit are complete. N7 L1-L3 and legacy exit are complete; minimum L5 coverage remains the next expansion gate.
- I10 Documentation and governance:
  - update `03-implementation-notes.md` after each implementation slice;
  - record commands and outcomes in `04-verification.md`;
  - keep `06-node-scope-matrix.md` and `07-acceptance-matrix.md` synchronized with runtime behavior;
  - run project governance lint after doc or task-state changes.

### Decision Gates
- D19 is locked for v1b N7 first-slice planning:
  - v1b N7 proceeds first without promoting v1b N4/N6/N8;
  - N7 support inputs use `v1b_n7_topic_question_hardening`;
  - N7 outputs use the two route-specific runtime context projections listed above;
  - `n7_candidate_grouping`, `n7_failed_trial_synthesis`, and `n7_n8_debate_admission_review` have locked per-slot input refs, cache identity fields, memory inclusion, compression preserved facts, and blocker behavior in `06-node-scope-matrix.md`.
- D23-A is locked: production/provider/Codex v1b N7 semantic support generation must pass through the shared T-112 runtime boundary via `AgentOrchestrator` or an equivalent shared runtime facade; direct `BackendLlmGateway` support generation is not T-112-compliant for promoted slots.
- D23-B is locked: frozen or externally produced v1b N7 support artifacts may be admitted only through runtime admission before deterministic gates, with slot/profile/prompt/runtime/source/provenance hashes verified; successful admission yields non-authority support context only.
- D23-C is locked: support artifacts must be machine-classified as `runtime_verified`, `fixture_replay`, or `legacy_unverified`; production admission requires `runtime_verified`, fixture placeholders are allowed only as `fixture_replay`, and `legacy_unverified` artifacts are migration diagnostics only.
- D23-D is locked: support artifact admission fails closed before deterministic gates; optional support may be absent, but malformed/drifted/legacy/provenance-incomplete present artifacts block, and conditionally required support blocks when absent on its required path.
- D23-E is locked: legacy direct provider/script support-generation paths are transitional only. After the runtime-backed N7 support path and replacement tests pass, promoted-slot legacy generation must be removed and fully exit the promoted-slot path to avoid long-term dual-track semantics.
- D20 is locked for v1b N7 first slice: do not add a DB-backed context packet cache index. N7 uses artifact refs/hashes, prompt packet persistent index, and process-local/runtime context cache only; context packets and output projections remain rebuildable acceleration/audit artifacts, not authority.
- D21 is locked: v1b/v1c rollout defaults to `deterministic_structural` compression; `codex_assisted` is allowed only when the slot profile explicitly permits semantic long-context compression and the output remains non-authority, ref-backed, hash-checked, and quality-gated; provider LLM compression is disallowed by default. For v1b N7, all three support slots use this policy and must preserve their D19-locked candidate, failure, feedback, risk/gap/recheck, handoff, and blocker facts.
- D22 is locked for v1b N7: verification is layered into L1 unit/contract, L2 harness policy stress, L3 Prisma-backed local/dev runtime smoke, L4 executor/canary checks, and L5 adversarial/long-context stress. Implementation may begin after L1/L2 cases are specified; legacy exit requires L1-L3 pass; v1b N4/N6/N8 expansion requires N7 L1-L3 plus minimum L5 coverage.

### Exit Criteria
- The D19-approved v1b N7 rows are represented in `06-node-scope-matrix.md`.
- v1b N7 runtime profiles resolve and fail closed on profile/hash/slot drift.
- N7 support-artifact admission blocks drifted/legacy/fixture-in-product support artifacts; conditionally required route-level support checks remain part of the broader L2/L3 slice.
- Runtime-backed N7 support generation emits `runtime_verified` artifacts through `AgentOrchestrator`; prompt identity validation rejects placeholder prompt hashes outside explicit test fixtures.
- Exact replay and drift-negative harness tests show zero LLM-like reinvocation.
- Prisma-backed v1b N7 runtime smoke records prompt index metadata for all three N7 support slots and verifies non-provider, non-response-reuse runtime audit provenance.
- Promoted v1b N7 support generation scripts no longer use direct support artifact writers; runtime support generation is the only promoted path.
- N7 deterministic gates still own topic-question-contract authority writes after cache/reuse/compression paths.
- Documentation and verification evidence are updated before moving to v1b N4/N6/N8.

## Next Phase 3 - v1b N6/N8/N4 Runtime Expansion

### Entry Status
- v1b N7 first slice is complete for L1-L3, promoted-slot legacy exit, and minimum adversarial quality coverage.
- The next rollout step corresponds to the T-112 implementation Phase 2: expand runtime coverage around the N7 context hub without introducing a second context-cache persistence surface.
- D20 remains in force: do not add a DB-backed context packet cache index during this expansion.

### Implementation Order
- P2.1 v1b N6 topic-question candidate generation:
  - bind N6 generation and regeneration slots to the shared runtime;
  - consume the N7 failed-trial loopback projection as ref-backed non-authority context;
  - preserve failed-trial blockers, exhausted candidate refs, regeneration hints, candidate-order facts, and source-health warnings through prompt identity and compression gates;
  - verify exact replay, N7 loopback drift, unknown failed-trial refs, provider non-reuse, and no authority bypass.
- P2.2 v1b N8 topic value assessment:
  - bind N8 value/risk assessment slots to the shared runtime;
  - consume the N7-to-N8 topic-question-contract projection as ref-backed non-authority context;
  - preserve value rationale, risk/gap facts, reviewer-facing uncertainty, support quality, and downstream recheck hints through prompt identity and compression gates;
  - verify N7 projection drift, N8 feedback handoff back to N7, malformed support blocking, provider non-reuse, and no authority bypass.
- P2.3 v1b N4 research-slice option generation:
  - bind N4 option-generation slots after N6/N8 expose the main context-handoff shape;
  - use N4 outputs as upstream semantic context candidates, not as replacements for N7 deterministic authority gates;
  - preserve slice identity, evidence lineage, method-family gaps, novelty/risk facts, and source-health warnings through runtime context identity;
  - verify upstream drift into N6/N7, compression fact preservation, replay/idempotency, and prompt packet cache metadata-only behavior.

### Shared Rules
- Every promoted v1b LLM-like slot MUST pass through the shared runtime boundary for token-budget preflight, prompt packet identity/cache, compression report validation, runtime audit, provider telemetry separation, and response-reuse provenance.
- Context projections, prompt cache hits, compression artifacts, and runtime audits remain LLM-operable workflow-quality evidence only; they MUST NOT become business authority or skip deterministic gates.
- Provider-side cache telemetry remains telemetry only. Provider LLM paths MUST NOT silently reuse historical responses.
- Legacy direct generation for promoted slots MUST exit after replacement tests pass; do not leave a long-term soft-disabled dual path.
- Documentation and verification evidence MUST be updated per slice before promoting the next node.
