# 03 Implementation Notes

## Pending
- Remaining implementation work is limited to the next runtime/debate slices recorded in T-088/T-089 below.

## 2026-05-19 Joint Alignment
- Consumes D-01 and D-02 from `dev-docs/active/topic-selection-workflow-runtime-foundation/06-joint-decisions.md`.
- T-089 remains responsible for workflow classification and debate decisions, not runtime implementation.

## 2026-05-19 D-03 Alignment
- Consumes the locked `AgentOrchestrator` boundary from T-088.
- T-089 workflow/debate review must assume model execution receives caller-built context packets and cannot rely on `AgentOrchestrator` reading domain DB state.

## 2026-05-19 D-04 Alignment
- Consumes locked execution mode boundaries from T-088.
- T-089 node classification must distinguish provider-backed decisions from `mocked_llm` acceptance artifacts and must not propose mock fallback for product runtime.

## 2026-05-19 D-05 Alignment
- Consumes profile escalation boundaries from T-088.
- T-089 must treat `single_agent` -> `multi_agent_debate` as a workflow classification decision, not as profile escalation.

## 2026-05-19 D-06 Alignment
- Consumes trace/audit/persistence boundaries from T-088.
- T-089 workflow matrix must require each non-deterministic node to declare trace refs, audit refs, artifact expectations, and authority refs without duplicating domain authority objects.

## 2026-05-19 D-07 Alignment
- Owns debate output caching, retention, artifact granularity, and per-node persistence policy.
- Debate can be proposed only for explicitly justified high-conflict nodes and must not become fallback execution.

## 2026-05-19 D-08 Alignment
- Consumes Codex-assisted execution as the default low-cost local mode.
- T-089 must decide node-by-node where Codex can replace provider calls and which debate roles Codex may execute.

## 2026-05-19 D-09 Alignment
- Consumes the zero-dual-track runner migration rule from T-088.
- Debate and workflow acceptance coverage must be registered as `WorkflowScenario` definitions instead of standalone runners.
- T-089 may define node-level debate policy, but must not create separate prompt, routing, artifact, cache, or persistence semantics outside the shared runtime path.

## 2026-05-19 D-10 Alignment
- Locked the T-089 deliverable shape as a node-by-node workflow matrix.
- Every executor, execution-mode, Codex, provider, debate, deterministic, or human-review decision must bind to a concrete `node_id`.
- Narrative design text is allowed only as rationale; the matrix remains the semantic entry for later implementation and tests.

## 2026-05-19 D-11 Alignment
- Locked canonical node granularity as authority-producing or authority-gating product decisions.
- Confirmed the node split matches `WorkflowHarness` sequencing: validators, guardrails, LLM attempts, artifacts, hashes, and repository operations are node-internal unless they create a cross-stage authority boundary.
- Populated `06-workflow-matrix.md` with the canonical node list and left execution classification fields pending D-12.

## 2026-05-19 D-12 Alignment
- Locked default executor and execution-mode classification for all canonical nodes.
- Added `default_execution_mode=none` for deterministic and human-review nodes that do not invoke model-like execution.
- Set model-like single-agent nodes to default `codex_assisted` with no initial provider-required rows.
- Limited initial debate eligibility to resource sampling, v1a need discovery, v1b value assessment, and v1c promotion support; promotion gate remains deterministic.

## 2026-05-19 D-13 Alignment
- Locked node policies as required per-node semantic contracts.
- Added `07-node-policies.md` with the D-13 template and one stub policy for each canonical node.
- Updated the matrix to point blocking conditions at node policies; scenario coverage remains pending the next decision.

## 2026-05-19 D-14 Alignment
- Locked scenario coverage as a registry-backed acceptance contract.
- Added `08-scenarios.md` with initial happy-path, scale-quality, negative, provider, downstream, and debate scenario entries.
- Replaced matrix `TBD-scenario` placeholders with registered scenario ids.

## 2026-05-19 D-15 Alignment
- Locked node policy detail fill order.
- Added common policy vocabulary and fill-order queues to `07-node-policies.md`.
- The next policy-detail work should start with the four debate-eligible nodes before ordinary single-agent or deterministic spine nodes.

## 2026-05-19 D-16 Alignment
- Locked resource sampling as the first draft node policy detail.
- Captured multi-agent debate as an arbiter-led internal loop with `explorer` and `deep_critic` worker roles.
- Removed `grounding_auditor` from the default debate role set; grounding remains in deterministic guardrails, arbiter checklist, schema validation, and final output validation.
- Locked terminal exits as `finalize`, `blocked`, or `require_human_review`; no automatic debate re-entry after terminal exit.

## 2026-05-19 D-17 Alignment
- Moved v1a debate eligibility from `validate-need-adjudication` to `generate-need-candidate`.
- Reframed candidate generation around a grounded `NeedCandidate` written through the existing v1a need-validation service and then visible in the existing candidate pool/list projection.
- Recorded generate-need-candidate debate as a deep-discovery harness pattern, not a final validation mechanism.
- Kept adjudication single-agent structured routing with human confirmation fallback.
- Corrected the design to avoid adding `NeedCandidateSet`; explored alternatives, rejected framings, and merge/recheck hints stay in artifacts unless a later explicit candidate-generation attempt persists another `NeedCandidate`.
- Locked generate attempts as bounded multi-candidate writes: one successful attempt may persist 1..5 independent `NeedCandidate` records sharing discovery audit/run refs, while each candidate still validates and adjudicates independently.
- Locked invalid-candidate handling: candidates that fail per-candidate gates are not persisted; they are recorded as rejected framings with reason codes, and the attempt succeeds only when at least one candidate remains valid.
- Locked candidate acquisition gate order: deterministic context compile -> single-agent/debate ranked draft batch -> per-candidate deterministic gates -> rejected-framing artifact for invalid drafts -> all-or-none authority write for 1..5 valid candidates -> candidate-pool projection.

## 2026-05-19 D-18 Alignment
- Locked cache/context/memory policy as a joint runtime boundary.
- Cache, compressed summaries, projection caches, and exact-invocation response reuse are not authority sources.
- Allowed local cost-saving response reuse without adding a new `execution_mode`: automatic replay remains `mocked_llm` acceptance/test, while local personal reuse can run as operator-approved `codex_assisted` with cache provenance and `non_provider=true`.
- Split debate context into `exploration_context` for explorer/deep-critic expansion and `arbiter_context` for synthesis, ranking, unresolved handling, and deterministic gate preparation.
- Updated generate-need-candidate policy/scenario expectations to record context packet refs/hashes, cache hit/miss status, compression versions, and response reuse provenance.
- Locked D-18 context field expectations: shared envelope, exploration payload, arbiter payload, durable memory admission roles, compression layers, context cache key, and default v1a need-discovery context size policy.

## 2026-05-19 D-19 Alignment
- Locked draft-to-`TopicSelectionNeedCandidateRecord` mapping boundaries before final draft-batch schema design.
- Direct draft mapping is limited to candidate body, mechanism, scope/non-goals, prior-art status, evidence/conflict/strength refs, gap codes, speculative, and confidence fields.
- Backend/runtime derives ids, status, version/hash, source refs, control-plane refs, artifact refs, merge/result refs, creator, and timestamps.
- Draft rank, batch rationale, arbiter rationale, rejected framings, unresolved points, recheck suggestions, duplicate/merge hints, and raw transcripts remain artifacts unless a later explicit node policy maps them.
- Locked v1a need-discovery debate workflow with one required exploration/critique round and up to two arbiter-scoped supplemental rounds, for a maximum of 3 total rounds.

## 2026-05-19 D-20 Alignment
- Locked `ranked_candidate_draft_batch` minimum schema as artifact/model-output contract, not authority.
- Minimum schema contains `schema_version`, `draft_batch`, `drafts`, `rejected_framings`, and `unresolved_points`.
- First required draft fields are limited to fields needed for deterministic gates and D-19 direct mapping to `TopicSelectionNeedCandidateRecord`.
- `assumptions`, `uncertainty_notes`, `duplicate_or_merge_hint`, and `recheck_suggestions` remain optional artifact/extensions and are not minimum required fields in v1.
- Updated generate-need-candidate policy/scenario expectations to require minimum schema validation before per-candidate gates and authority writes.

## 2026-05-19 D-21 Alignment
- Locked deterministic `NeedCandidate` draft admission gates between `ranked_candidate_draft_batch` and authority persistence.
- Admission gates produce `CandidateDraftAdmissionReport` as an artifact before any authority write.
- Admission decisions are limited to `admit`, `reject_artifact_only`, `require_human_review`, `return_for_supplemental_round`, and `merge_hint_only`.
- Gate order is schema, reference integrity, scope, evidence sufficiency, mechanism sufficiency, novelty/duplicate, risk/speculation, and final batch gate.
- Agents and debate may excavate and rank drafts, but deterministic admission gates decide whether drafts can enter the all-or-none `NeedCandidate` persistence batch.
- Updated generate-need-candidate policy/scenario expectations to require admission report artifacts and explicit gate decisions before persistence.

## 2026-05-19 D-22 Alignment
- Locked supplemental round routing as a bounded repair path, not a broad retry or fallback execution path.
- Arbiter must produce `SupplementalRoundRoutingDecision` before any optional supplemental round starts.
- Supplemental routing is allowed only for promising grounded drafts with concrete repair questions and remaining round budget.
- Non-supplementable failures include malformed schema/context, missing required source refs, topic drift, ungrounded drafts, pseudo-gaps, pure duplicates, and exhausted round budget.
- Supplemental workers consume `exploration_context` plus arbiter-scoped question deltas, while arbiter synthesizes returned role-level summaries through `arbiter_context`.
- Supplemental output must re-enter D-20 schema validation and D-21 admission gates before persistence; no direct authority write path is introduced.

## 2026-05-19 D-23 Alignment
- Locked `NeedCandidate` batch persistence as the only authority write contract after admission gates.
- Persistence consumes only admitted drafts from `CandidateDraftAdmissionReport`; raw debate output and rejected/unresolved artifact material are not write inputs.
- The write boundary stays on the existing `TopicSelectionNeedValidationService`/repository path or a service-level batch wrapper over that same boundary; no `NeedCandidateSet` path is introduced.
- `PersistNeedCandidateBatchCommand` carries workflow refs, topic/evidence/resource refs, artifact refs, admitted drafts, normalized keys, source admission refs, and idempotency key.
- Backend/runtime derives ids, candidate hash/version, statuses, authority refs, artifact/audit refs, source metadata, and timestamps.
- Batch writes are all-or-none and idempotent; replay of the same idempotency key returns the same persisted refs without duplicate insertions.
- Successful persistence returns persisted candidate refs and candidate-pool projection refs/hash, with projection remaining a view over existing `NeedCandidate` rows.

## 2026-05-19 D-24 Alignment
- Locked `GenerateNeedCandidateNodeInput` and `GenerateNeedCandidateNodeResult` as the external I/O contract for `topic-selection.v1a.generate-need-candidate.v1`.
- All execution modes share the same node I/O schema; provenance records execution source differences instead of changing result shape.
- Node input carries refs and context packet refs rather than scattered raw DB records.
- Node result separates workflow `status` from agent/debate `terminal_result` and constrains their valid combinations.
- Success requires persisted candidate refs, candidate-pool projection refs/hash, and required artifact refs.
- Downstream handoff is limited to persisted candidate refs, candidate-pool projection refs/hash, discovery audit ref, warnings, and error code; raw debate transcripts remain non-business artifacts.
- The node does not create `ValidatedNeed`, `SearchPlan`, `NeedCandidateSet`, or a v1b input bundle.

## 2026-05-19 D-25 Alignment
- Locked `generate-need-candidate` implementation as nine slices: contracts/schema, artifact/ref boundary, context compiler integration, orchestrator adapter, draft schema validation, admission gates, supplemental routing, persistence batch, and WorkflowHarness scenarios.
- D-25 is a construction plan only; it does not add a new authority object, runtime output, or alternate node contract.
- Deterministic contracts, artifacts, context, schema validation, admission gates, routing, and persistence must be verified before provider/codex E2E.
- `mocked_llm` WorkflowHarness scenarios run before `provider_llm` or `codex_assisted` scenarios.
- Required scenario coverage includes happy path, zero admitted to supplemental, duplicate to merge hint, malformed draft blocked, persistence rollback, and execution-mode shape stability.
- Implementation guardrails remain no `NeedCandidateSet`, no raw transcript handoff, no D-20/D-21/D-23 bypass, no partial batch persistence, and no cached response masquerading as `provider_llm`.

## 2026-05-19 Current State Mapping
- Added `09-current-state-map.md` to map D-25 slices to current repository files before implementation.
- Current repo has reusable v1a NeedCandidate contracts, service, repository, Prisma model, route/controller, route integration tests, control-plane artifact/workflow primitives, and `BackendLlmGateway` patterns.
- At mapping time, the repo did not yet have concrete `GenerateNeedCandidateNodeInput/Result`, ranked draft/admission/routing/persist command contracts, `WorkflowHarness`, `AgentOrchestrator`, v1a exploration/arbiter context compiler, admission gates, supplemental routing, or batch/idempotent candidate persistence. The shared contract/schema portion was later implemented in the D-25 `contracts_schema` slice below.
- Confirmed discussion depth is currently concentrated on v1a `generate-need-candidate`; the T-089 matrix still spans resource sampling, v1a, v1b, v1c, downstream, and debate placeholders for v1b/v1c.

## 2026-05-19 D-26 Cross-Version Boundary
- Locked a lightweight v1a -> v1b -> v1c handoff boundary before D-25 `contracts_schema` implementation.
- Added `10-cross-version-boundaries.md` as the T-089-local handoff reference and appended D-26 to the shared T-088/T-089 joint decision log.
- v1a `generate-need-candidate` may produce persisted `NeedCandidate` refs, candidate-pool projection refs/hash, discovery audit refs, warning/error codes, and internal artifacts, but it must not publish v1b/v1c authority objects.
- v1a-to-v1b still flows only through `TopicSelectionV1aToV1bInputBundleRecord` after human-confirmed `ValidatedNeed`.
- v1b-to-v1c still flows only through `TopicSelectionV1bToV1cInputBundleRecord` after package readiness.
- Raw debate transcripts, hidden reasoning, raw ranked draft batches, raw rejected framings, and supplemental role outputs must not cross version boundaries as business inputs.
- D-25 `contracts_schema` can proceed without embedding v1b/v1c fields in `GenerateNeedCandidateNodeResult` or `PersistNeedCandidateBatchCommand`.

## 2026-05-19 D-25 `contracts_schema` Implementation
- Implemented the first D-25 slice in `packages/shared/src/research-lifecycle/topic-selection-need-validation-contracts.ts`.
- Added shared DTO/schema/error-code contracts for:
  - `GenerateNeedCandidateNodeInput`
  - `GenerateNeedCandidateNodeResult`
  - `RankedCandidateDraftBatch`
  - `CandidateDraftAdmissionReport`
  - `SupplementalRoundRoutingDecision`
  - `PersistNeedCandidateBatchCommand`
- Added execution/status/terminal/admission/routing/error-code vocabularies for the v1a generate-need-candidate node.
- Kept the contract v1a-only per D-26: result and persist command schemas do not expose topic-question, value-assessment, package, promotion, bridge, downstream, raw transcript, or v1b/v1c handoff fields.
- Added schema coverage in `packages/shared/src/research-lifecycle/title-card-management-contracts.schema.test.ts` for valid node payloads, invalid execution mode, invalid result error code, barrel exports, and no v1b/v1c field surface on v1a result/persist schemas.
- No DB, route, service, persistence, orchestration, or v1b/v1c contract changes were made in this slice.

## 2026-05-19 D-25 `artifact_ref_boundary` Implementation
- Implemented the second D-25 slice without adding a new DB table or alternate artifact persistence path.
- Added shared artifact boundary contracts in `packages/shared/src/research-lifecycle/topic-selection-need-validation-contracts.ts`:
  - `TopicSelectionGenerateNeedCandidateArtifactSnapshot`
  - `TopicSelectionGenerateNeedCandidateArtifactRefEntry`
  - `TopicSelectionGenerateNeedCandidateArtifactRefBundle`
  - artifact key vocabulary for ranked draft batch, schema validation report, admission report, supplemental routing decision, persist command snapshot, and discovery audit.
  - redaction policy vocabulary for v1a need-discovery artifacts.
- Added schema coverage in `packages/shared/src/research-lifecycle/title-card-management-contracts.schema.test.ts` for artifact snapshot and artifact-ref bundle payloads.
- Added `TopicSelectionNeedDiscoveryArtifactBoundaryService` in `apps/backend/src/services/topic-selection-need-discovery-artifact-boundary-service.ts`.
- The helper records redacted inline snapshots through the existing `TopicSelectionControlPlaneService.recordArtifactRef` boundary.
- The helper redacts hidden reasoning, chain-of-thought, raw provider logs, raw debate transcripts, provider secrets, API keys, tokens, and credentials by key name before persistence.
- The helper computes stable payload hashes and relies on control-plane artifact checksums for artifact hash identity.
- The helper emits `artifact_ref` FunctionalRefs and resolves them with ref type, title card, workflow run, node attempt, artifact key, and checksum guards.
- Added `TopicSelectionControlPlaneService.getArtifactRef` as a read helper over the existing repository method.
- This slice does not integrate artifacts into a real node executor yet; the next slices must consume this helper rather than writing ad hoc artifact payloads.
- This slice does not implement full authority-ref resolution, file/URI artifact storage routing, or WorkflowHarness scenario artifact emission.

## 2026-05-19 D-25 `context_compiler_integration` Implementation
- Implemented the third D-25 slice as a compile/validate layer only; no LLM invocation, orchestration, route, DB schema, or candidate persistence was added.
- Added shared D-18 context contracts in `packages/shared/src/research-lifecycle/topic-selection-need-validation-contracts.ts`:
  - `TopicSelectionNeedDiscoveryContextPacket`
  - `TopicSelectionNeedDiscoveryExplorationContextPayload`
  - `TopicSelectionNeedDiscoveryArbiterContextPayload`
  - `TopicSelectionNeedDiscoveryCompiledContextPair`
  - context family vocabulary for `exploration_context` and `arbiter_context`.
  - context redaction policy vocabulary for `topic_selection_need_discovery_context_redaction_v1`.
- Added JSON schema coverage for context compression, exploration payload, arbiter payload, context packet, and compiled context pair.
- Extended the generate-need-candidate artifact key vocabulary with:
  - `exploration_context_packet`
  - `arbiter_context_packet`
- Updated `TopicSelectionNeedDiscoveryArtifactBoundaryService` so context packets are persisted as control-plane `input` artifacts through the same redacted artifact-ref boundary.
- Added `TopicSelectionNeedDiscoveryContextCompilerService` in `apps/backend/src/services/topic-selection-need-discovery-context-compiler-service.ts`.
- The compiler:
  - compiles both D-18 context families for `topic-selection.v1a.generate-need-candidate.v1`;
  - enforces refs-only `input_refs`;
  - computes `input_refs_hash`, `payload_hash`, exact cache keys, memory digest hash, and candidate-pool hash;
  - keeps `exploration_context` and `arbiter_context` cache keys family-isolated;
  - rejects hidden reasoning, raw provider logs, raw debate transcripts, secrets, tokens, and credentials before artifact write;
  - resolves context packet artifact refs with artifact key, family, workflow, node attempt, policy, profile, execution mode, input hash, payload hash, and cache-key guards.
- Added focused backend unit coverage for stable compilation, family isolation, exact cache-key validation, stale/tampered packet rejection, resolve guards, and forbidden raw context material.
- This slice leaves actual context cache storage/reuse, role invocation, response reuse, and WorkflowHarness execution to later slices.

## 2026-05-20 DMP Runtime Consumption: Shared Invocation Provenance Contract
- T-089 now consumes the shared invocation provenance/audit envelope added by T-088.
- Debate node policies and future role/stage implementations must use `topic-selection-agent-invocation-audit-v1` for every model-like attempt rather than defining a separate debate audit shape.
- The envelope supports future debate role metadata through an optional `debate_extension`, while preserving the same core fields for ordinary single-agent calls.
- Provider-backed attempts must record `provider_response`, selected model option, normalized params hash, provider/model ids, and telemetry summary.
- Codex-assisted and mocked attempts remain explicitly `non_provider=true` with operator/fixture provenance, preventing mock/real decision mixing.
- This is a runtime contract consumption note only; no T-089 node policy decision is changed.

## 2026-05-19 D-25 Three-Slice Quality Review And Fixes
- Reviewed the implemented `contracts_schema`, `artifact_ref_boundary`, and `context_compiler_integration` slices for semantic drift, duplicate paths, stale docs, and weak contract boundaries.
- Fixed artifact/context ref ambiguity by introducing an artifact-ref-only shared type/schema for D-25 artifact refs and context packet refs:
  - `exploration_context_ref`
  - `arbiter_context_ref`
  - result artifact refs
  - persist-command artifact refs
  - compiled context pair refs
  - artifact-ref bundle entries
- Updated schema tests so artifact refs use `ref_type=artifact_ref` and added a negative context-ref assertion for `ref_type=context_packet`.
- Tightened `TopicSelectionNeedDiscoveryArtifactBoundaryService`:
  - validates artifact keys defensively at runtime;
  - validates source refs before artifact write;
  - validates artifact-ref bundle entries;
  - verifies snapshot `payload_hash` against redacted payload on resolve, in addition to the control-plane artifact checksum.
- Confirmed no obsolete D-25 implementation files were introduced and no old runner, provider path, DB schema, or alternate authority object was added.

## 2026-05-19 D-25 `orchestrator_adapter` Initial Implementation
- Started the fourth D-25 slice by implementing the reusable T-088 runtime `AgentOrchestrator` boundary first.
- Added `TopicSelectionAgentOrchestratorService` in `apps/backend/src/services/topic-selection-agent-orchestrator-service.ts`.
- The orchestrator keeps `mocked_llm`, `codex_assisted`, and `provider_llm` on one normalized result shape with explicit provenance.
- Provider-backed execution routes through `BackendLlmGateway`; mock and Codex-assisted execution never call provider APIs.
- `mocked_llm` is blocked from product run mode and remains acceptance/test-only.
- Every mode validates structured output against the same caller-supplied JSON schema.
- Diagnostic audit artifacts store hashes/provenance/validation summaries only, not full structured output, raw provider logs, prompt text, hidden reasoning, or secrets.
- This is the runtime adapter foundation. The generate-need-candidate node-specific adapter that consumes context packets and emits `RankedCandidateDraftBatch` remains pending before `draft_schema_validation`.

## 2026-05-19 D-25 `orchestrator_adapter` Node Adapter Implementation
- Completed the node-specific half of the fourth D-25 slice for `topic-selection.v1a.generate-need-candidate.v1`.
- Added `TopicSelectionGenerateNeedCandidateOrchestratorAdapterService` in `apps/backend/src/services/topic-selection-generate-need-candidate-orchestrator-adapter-service.ts`.
- The adapter:
  - accepts the locked `GenerateNeedCandidateNodeInput`;
  - resolves `exploration_context_ref` and `arbiter_context_ref` through `TopicSelectionNeedDiscoveryContextCompilerService`;
  - enforces exact context expectations for workflow run, node attempt, family, policy version, schema version, profile, execution mode, and title card;
  - builds the caller-owned prompt payload from resolved context packets and node refs;
  - invokes `TopicSelectionAgentOrchestratorService` with the shared `RankedCandidateDraftBatch` schema;
  - keeps `mocked_llm`, `codex_assisted`, and `provider_llm` on the same adapter result shape;
  - records a redacted `ranked_candidate_draft_batch` artifact only when orchestrator output passes schema validation.
- Added focused adapter tests for:
  - successful ranked draft batch generation through `mocked_llm`, `codex_assisted`, and `provider_llm`;
  - provider-mode invocation through the stubbed gateway path;
  - stale context packet expectation blocking before model-like invocation;
  - no ranked batch artifact write when orchestrator/schema validation blocks output.
- This slice still does not implement D-20 minimum semantic validation, D-21 admission gates, supplemental routing, candidate persistence, or WorkflowHarness scenarios.

## 2026-05-19 D-25 `draft_schema_validation` Implementation
- Implemented the fifth D-25 slice as a deterministic minimum semantic validation layer after orchestrator JSON-schema validation and before admission gates.
- Added shared report contract and schema in `packages/shared/src/research-lifecycle/topic-selection-need-validation-contracts.ts`:
  - `TopicSelectionRankedCandidateDraftBatchMinimumValidationReport`;
  - `TopicSelectionRankedCandidateDraftBatchMinimumValidationIssue`;
  - `topicSelectionRankedCandidateDraftBatchMinimumValidationReportSchema`.
- Added `TopicSelectionRankedCandidateDraftBatchValidatorService` in `apps/backend/src/services/topic-selection-ranked-candidate-draft-batch-validator-service.ts`.
- The validator checks the minimum admission-precondition semantics:
  - batch `schema_version` and `node_attempt_id` must match `GenerateNeedCandidateNodeInput`;
  - `max_persisted_candidates` must be a positive integer and stay within arbiter policy;
  - `finalize` batches must contain at least one draft;
  - empty batches must explain themselves through rejected framings or unresolved points;
  - draft IDs and ranks must be unique, sorted, and contiguous from 1;
  - each draft must cite evidence role refs, strength assessment refs, and gap codes;
  - confidence must be within `[0, 1]` when present;
  - `finalize` batches cannot carry unresolved points routed to `blocked`.
- Wired the validator into `TopicSelectionGenerateNeedCandidateOrchestratorAdapterService`.
- Adapter behavior after this slice:
  - if orchestrator schema validation fails, no minimum validation report is written;
  - if minimum validation fails, a redacted `minimum_schema_validation_report` diagnostic artifact is written, `ranked_candidate_draft_batch` is not written, and the adapter returns `INVALID_RANKED_CANDIDATE_DRAFT_BATCH`;
  - if minimum validation passes, both the validation report artifact and ranked draft batch artifact are written.
- Added focused unit coverage for valid finalize batches, invalid semantic drift, explained empty blocked batches, and adapter artifact boundaries.
- This slice still does not implement D-21 admission gates, D-22 supplemental routing, D-23 persistence batch, WorkflowHarness scenarios, or route-level node execution.

## 2026-05-19 D-25 `admission_gates` Implementation
- Implemented the sixth D-25 slice as deterministic pre-persistence admission gates.
- Fixed contract drift by expanding `TopicSelectionCandidateDraftAdmissionResult` in `packages/shared/src/research-lifecycle/topic-selection-need-validation-contracts.ts` to match D-21:
  - `resolved_ref_counts`;
  - `normalized_candidate_key`;
  - `duplicate_candidate_refs`;
  - `required_human_review_points`;
  - `supplemental_questions`.
- Added `TopicSelectionCandidateDraftAdmissionService` in `apps/backend/src/services/topic-selection-candidate-draft-admission-service.ts`.
- The service:
  - refuses to run unless `RankedCandidateDraftBatchMinimumValidationReport.valid=true`;
  - verifies draft evidence/conflict/strength refs against node/context resolvable refs;
  - computes deterministic normalized candidate keys;
  - admits grounded non-duplicate drafts;
  - turns candidate-pool duplicates or same-batch duplicate keys into `merge_hint_only`;
  - rejects unresolved refs, scope drift, context/baseline-only drafts, broad pseudo-gap mechanisms, and solved/falsified prior art as artifact-only outcomes;
  - routes speculative drafts without risk bounds to `return_for_supplemental_round` when round budget remains, otherwise `require_human_review`;
  - records batch blockers such as `NO_ADMISSIBLE_NEED_CANDIDATE` without writing authority records.
- Wired the admission service into `TopicSelectionGenerateNeedCandidateOrchestratorAdapterService`.
- Adapter behavior after this slice:
  - orchestrator schema failure still writes no minimum/admission/ranked artifacts;
  - minimum validation failure writes only `minimum_schema_validation_report`;
  - minimum validation success writes `minimum_schema_validation_report`, `ranked_candidate_draft_batch`, and then `candidate_draft_admission_report`;
  - admission batch blockers return adapter status `blocked` with the admission artifact preserved for audit.
- This slice still does not implement D-22 supplemental routing, D-23 persistence batch, WorkflowHarness scenarios, or route-level node execution.

## 2026-05-19 D-25 `admission_gates` Quality Review Fixes
- Reviewed the admission implementation for D-21 contract drift, adapter artifact boundaries, and edge-case test coverage.
- Fixed shared contract drift by making `normalized_candidate_key` required on each `CandidateDraftAdmissionResult` in both the TypeScript interface and JSON schema, matching the D-21 report shape and the service output.
- Fixed `require_human_review` diagnostics so speculative drafts without conflict/risk refs still carry a review target via the source `candidate_draft` ref instead of an empty `required_human_review_points` array.
- Added admission service tests for:
  - same-batch duplicate normalized keys producing `merge_hint_only`;
  - pseudo-gap rejection when refs are otherwise resolved;
  - human-review fallback carrying a candidate draft review point.
- Cleaned the shared schema indentation around `draft_results.items` for readability.

## 2026-05-19 D-25 `supplemental_routing` Implementation
- Implemented the seventh D-25 slice as deterministic routing after `CandidateDraftAdmissionReport` and before any optional supplemental worker round.
- Added `TopicSelectionSupplementalRoundRoutingService` in `apps/backend/src/services/topic-selection-supplemental-round-routing-service.ts`.
- The routing service:
  - finalizes when at least one draft is admitted;
  - routes zero-admit supplementable drafts to `run_supplemental_round` only when remaining round budget exists and the current round is before round 3;
  - caps scoped supplemental questions at 5 and targets explicit `source_draft_id` values;
  - uses default supplemental roles `explorer` and `deep_critic`;
  - forbids broad re-exploration, unrelated candidate families, authority mutation, persistence writes, and schema bypass during supplemental rounds;
  - routes exhausted supplemental candidates to `block`;
  - routes grounded judgment gaps to `require_human_review`;
  - routes pure non-supplementable duplicate/rejected drafts to `reject_without_supplement`.
- Wired routing into `TopicSelectionGenerateNeedCandidateOrchestratorAdapterService`.
- Adapter behavior after this slice:
  - orchestrator schema failure still writes no ranked/minimum/admission/routing artifacts;
  - minimum validation failure writes only `minimum_schema_validation_report`;
  - minimum validation success writes `ranked_candidate_draft_batch`, `candidate_draft_admission_report`, and then `supplemental_round_routing_decision`;
  - `run_supplemental_round` returns adapter status `succeeded` because the current slice produced the routing artifact, but it does not execute the supplemental worker round or write authority records;
  - `block` and `reject_without_supplement` return adapter status `blocked`;
  - `require_human_review` returns adapter status `require_human_review`.
- Added unit coverage for finalize, supplemental run, exhausted budget/round 3, human review, non-supplementable rejection, invalid round metadata, and adapter artifact boundaries.
- This slice still does not implement supplemental worker execution, D-23 persistence batch, WorkflowHarness scenarios, or route-level node execution.

## 2026-05-19 D-25 `persistence_batch` Implementation
- Implemented the eighth D-25 slice as a service-layer batch persistence path over the existing `NeedCandidate` authority model.
- Added `TopicSelectionPersistNeedCandidateBatchService` in `apps/backend/src/services/topic-selection-persist-need-candidate-batch-service.ts`.
- Added `TopicSelectionNeedValidationRepository.createNeedCandidatesBatch` and implementations for:
  - `InMemoryTopicSelectionNeedValidationRepository`, with preflight duplicate-id and duplicate `(evidence_map_id, candidate_version)` checks before any write;
  - `PrismaTopicSelectionNeedValidationRepository`, using one Prisma transaction for all candidate inserts.
- The persistence service:
  - builds `PersistNeedCandidateBatchCommand` only from admission results with `decision=admit`;
  - rejects zero-admitted commands before authority writes;
  - rejects duplicate normalized candidate keys before authority writes;
  - derives deterministic candidate ids from `idempotency_key + draft_id`;
  - replays the same command by returning existing deterministic candidate refs without inserting duplicates;
  - blocks partial replays instead of mixing old and new records;
  - creates a query/projection-style `candidate_pool_projection_ref` and hash without introducing `NeedCandidateSet`;
  - writes only `NeedCandidate` records and does not create `ValidatedNeed`, `SearchPlan`, or v1b/v1c authorities.
- Wired persistence into `TopicSelectionGenerateNeedCandidateOrchestratorAdapterService` as an explicit optional path:
  - default adapter behavior remains artifact-only and writes no authority records;
  - when `persist_admitted_candidates=true`, a persistence service dependency exists, routing finalized with admitted drafts, and a `persistence_context` supplies current search/literature refs, the adapter records `persist_need_candidate_batch_command` and persists admitted candidates idempotently;
  - supplemental-round, blocked, and human-review routes do not write candidates.
- Deliberate schema boundary:
  - this slice does not change `prisma/schema.prisma`;
  - current `TopicSelectionNeedCandidateRecord` has no dedicated `candidate_hash`, `normalized_candidate_key`, or batch idempotency columns;
  - idempotency is enforced by deterministic candidate ids and replay checks, while the candidate hash is represented as a deterministic `candidate_version` suffix/ref version under the current model;
  - an exact D-23 storage hardening pass can add explicit columns later through the DB SSOT workflow, but this slice avoids a parallel authority path or premature schema churn.
- This slice still does not implement WorkflowHarness scenarios, route-level node execution, supplemental worker execution, or a DB migration for explicit hash/idempotency fields.

## 2026-05-19 D-25 `workflow_harness_scenarios` Implementation
- Implemented the ninth D-25 slice as a backend acceptance harness, not a route/UI entrypoint.
- Added `TopicSelectionWorkflowHarnessService` in `apps/backend/src/services/topic-selection-workflow-harness-service.ts`.
- The harness:
  - compiles D-18 exploration and arbiter context packets through `TopicSelectionNeedDiscoveryContextCompilerService`;
  - builds the locked `GenerateNeedCandidateNodeInput`;
  - calls `TopicSelectionGenerateNeedCandidateOrchestratorAdapterService` so all model output still passes D-20 schema validation, D-21 admission gates, D-22 routing, and optional D-23 persistence;
  - injects scenario execution mode, run mode, current round metadata, mocked/codex/provider input, and explicit persistence intent;
  - evaluates scenario assertions without owning business decisions;
  - records a `discovery_audit` artifact with context refs, adapter artifact refs, authority refs, warnings, blockers, and assertion outcomes.
- Added mocked/provider/codex harness cases for:
  - finalize with admitted batch and explicit NeedCandidate persistence;
  - supplementable zero-admit routing to `run_supplemental_round` without authority persistence;
  - unresolved-ref admission blocker stopping before persistence;
  - duplicate candidate routing to `merge_hint_only` without authority persistence;
  - malformed structured output blocking before downstream artifacts;
  - stable result shape across `mocked_llm`, `codex_assisted`, and `provider_llm`;
  - persistence conflict rejection without partial duplicate writes.
- The implementation deliberately does not execute supplemental worker rounds, add a route-level node runner, implement the multi-agent debate loop, create `NeedCandidateSet`, or add a second candidate write path.

## 2026-05-19 DMP-01 Debate Model Invocation Policy
- Added `11-debate-model-invocation-policy.md` as the T-089 SSOT for future multi-agent debate model invocation rules.
- Locked `DMP-01`: `execution_mode` remains the source class of model-like output, not a concrete provider/model enum.
- Retained only `mocked_llm`, `codex_assisted`, and `provider_llm` as model-like execution modes.
- Defined `provider_llm` as a real provider-backed execution class that may resolve to multiple registered providers through a versioned `model_profile_id`.
- Explicitly rejected provider-specific execution modes such as `openai_llm`, `dashscope_llm`, or `deepseek_llm`.
- Deferred exact model profile fields, role/stage mappings, Codex substitution, fallback/escalation, normalized parameters, telemetry, failure behavior, mock isolation, and no-dual-track implementation rules to `DMP-02` through `DMP-10`.

## 2026-05-20 DMP-02 Debate Model Invocation Policy
- Locked `DMP-02`: model profiles are function, role, and stage oriented rather than provider-ranking tables.
- Defined the profile registry as the SSOT for workflow function, role family, stage family, quality objectives, output contract, allowed execution modes, required capabilities, model options, request policy, normalized parameters, provider overrides, audit policy, and budget policy.
- Replaced provider candidate ranking language with a unified `model_options` envelope keyed by `option_purpose` and `use_when`.
- Clarified that different providers may share the same `model_options` structure, but cross-provider parameters must live in `normalized_params` while provider-specific knobs must live in `provider_overrides`.
- Restricted `priority`/`weight` to optional low-level tie-breakers only; they must not carry business or role semantics.
- Deferred role/stage mapping to `DMP-03`, Codex substitution to `DMP-04`, fallback/escalation to `DMP-05`, and normalized parameter value/mapping details to `DMP-06`.

## 2026-05-20 DMP-03 Debate Model Invocation Policy
- Locked `DMP-03`: debate execution is decomposed into explicit role/stage invocation slots.
- Each role/stage slot references only a versioned `profile_id`, input context family, and output contract.
- Role/stage mapping must not directly encode provider ids, model ids, provider-specific parameters, fallback chains, retry rules, or budget rules.
- `explorer` and `deep_critic` may have multiple instances, but same-role outputs must merge into role-level summaries before arbiter consumption.
- `arbiter` remains single-instance per debate loop and is the only external structured-output port.
- Added `instance_policy` to role/stage slots so worker role multiplicity is expressed as role instances, not provider lists.
- Clarified that multi-instance worker roles may resolve to one or more provider/model options, including duplicate options, through the bound profile.
- Required repeated provider/model use to carry distinct `agent_instance_id` and provenance.
- `round_1_discovery` can explore broadly inside node scope, while `supplemental_repair` is limited to arbiter-specified questions and cannot restart broad exploration.
- Missing required role/stage profile mappings block the debate loop instead of inventing default providers or profiles.

## 2026-05-20 DMP-04 Debate Model Invocation Policy
- Locked `DMP-04`: Codex substitution is a role/stage slot-level execution override under `execution_mode=codex_assisted`.
- Codex substitution may replace selected local model-like invocations for cost control, but it must not replace `profile_id`, change role/stage mapping, or masquerade as `provider_llm`.
- Preferred Codex substitution targets are `explorer` and `deep_critic`; `arbiter.issue_framing` is allowed, while `arbiter.final_synthesis` is forbidden in the v1 executable contract.
- Provider-quality scenarios and explicit provider runs forbid Codex substitution.
- Codex output must pass the same output contract, schema validation, deterministic gates, routing, and authority-write boundaries as provider output.
- Codex failure must not fallback to `mocked_llm`.
- Codex provenance must record `execution_mode=codex_assisted`, `source_kind=codex_response`, `non_provider=true`, operator label, prompt packet hash, response hash, and optional operator approval ref.

## 2026-05-20 DMP-05 Debate Model Invocation Policy
- Locked `DMP-05`: automatic provider fallback is disabled in v1.
- A failed `provider_llm` call records a failure artifact and blocks the current role/stage slot or node instead of silently switching providers.
- Manual rerun and explicit profile/provider-option override are allowed, but each must create a new attempt/run record with explicit provenance.
- Provider output must never fallback to `codex_assisted` or `mocked_llm`; Codex/mock remain separate execution classes.
- Schema validation failures, deterministic validator failures, admission failures, routing blockers, and persistence failures are workflow failures, not provider-call failures, and cannot trigger fallback.
- Any future automatic fallback must be a separate task with deterministic attempt ledger, stable replay key, per-attempt telemetry, scenario coverage, and node-policy opt-in.

## 2026-05-20 DMP-06 Debate Model Invocation Policy
- Locked `DMP-06`: model invocation parameters are normalized as cross-provider intent inside model profiles.
- Canonical v1 `normalized_params` keys are `creativity`, `reasoning_depth`, `output_budget`, `structured_output_required`, and `output_format`.
- Workflow matrices, node policies, role/stage mappings, harness scenarios, domain services, and authority objects must not contain concrete provider parameter names such as temperature, top-p, max tokens, reasoning effort, thinking effort, or enable-thinking flags.
- Provider-specific knobs may appear only under model-option `provider_overrides`; provider adapters or the LLM gateway map normalized intent to concrete provider payloads.
- Required capability mismatch fails fast; optional capability degradation is allowed only with explicit option policy and audit marker.
- Hidden reasoning, chain-of-thought, raw thinking traces, and provider-private reasoning payloads remain non-persisted even when `reasoning_depth` requests deeper analysis.
- Updated DMP-01/DMP-02 examples to remove automatic fallback wording and provider-specific normalized parameter names so the policy remains aligned with DMP-05/DMP-06.

## 2026-05-20 DMP-07 Debate Model Invocation Policy
- Locked `DMP-07`: all model-like invocations use one common provenance/audit envelope.
- Single-agent nodes use the common invocation fields only; multi-agent debate nodes add a `debate_extension` for loop, round, role, stage, agent instance, and worker-to-arbiter lineage.
- `provider_llm`, `codex_assisted`, and `mocked_llm` share the same envelope shape while preserving distinct `execution_mode` and `source_kind` values.
- Provider request ids may be diagnostic metadata, but they must not become business inputs or authority refs.
- Prompt text, raw provider logs, secrets, credentials, API keys, hidden reasoning, chain-of-thought, raw thinking traces, and provider-private reasoning payloads are not persisted.
- Raw debate worker outputs may exist only as redacted internal audit artifacts; downstream business contracts consume node results, arbiter final artifacts, authority refs, warnings/blockers, and audit refs/hashes.
- Cache and response reuse markers are provenance facts only and must not alter execution mode or bypass schema/deterministic gates.

## 2026-05-20 DMP-08 Debate Model Invocation Policy
- Locked `DMP-08`: v1 allows only narrow low-level technical retry and forbids semantic retry.
- Technical retry is limited to transient provider transport/provider errors under the same `profile_id`, model option, normalized parameters, prompt packet hash, context packet hashes, output contract, and execution mode.
- Provider-call retry exhaustion in `provider_llm` records a failure artifact and returns `blocked` per DMP-05; it must not fallback to another provider, Codex, or mock.
- Schema validation failure, deterministic validator failure, admission failure, routing blocker, and persistence failure do not trigger model retry.
- `blocked` means automatic continuation is unsafe due to operational, contractual, missing-data, or deterministic workflow failure.
- `require_human_review` means the system has enough grounded context to ask the operator for a concrete judgment before continuing.
- Debate supplemental rounds are not retries; they require arbiter-scoped repair questions, remaining round budget, node-policy permission, and a full re-entry through schema validation, deterministic gates, routing, and authority boundaries.

## 2026-05-20 DMP-09 Debate Model Invocation Policy
- Locked `DMP-09`: `mocked_llm` is limited to test and acceptance infrastructure.
- `mocked_llm` is rejected for `run_mode=product` and cannot write product database authority records.
- Mock-backed persistence coverage must use an in-memory repository, isolated test database, isolated acceptance database, or explicit fixture namespace.
- Mock artifacts must record `run_mode`, `execution_mode=mocked_llm`, `source_kind=mock_fixture`, and `mock_fixture_id`.
- Provider-backed and Codex-assisted artifacts must preserve distinct `execution_mode` and `source_kind` values so real-flow evidence cannot be confused with mock acceptance evidence.
- Mock output cannot satisfy provider-quality scenarios or real-flow acceptance criteria, and real E2E evidence must be labeled separately from mock acceptance evidence.
- Real execution failures must not fallback to mock, and mock failures remain test/acceptance fixture failures rather than product recovery paths.

## 2026-05-20 DMP-10 Debate Model Invocation Policy
- Locked `DMP-10`: Debate Model Invocation Policy v1 must have one SSOT and one implementation path.
- The model profile registry owns provider/model options, normalized parameters, provider overrides, required capabilities, fallback policy, retry policy, audit policy, budget policy, and run-mode eligibility.
- Workflow and node policies may reference `node_id`, `execution_mode`, `run_mode`, `profile_id`, role/stage mappings, and deterministic gates, but must not duplicate concrete provider/model/parameter/fallback/mock rules.
- `AgentOrchestrator` remains the model invocation entrypoint and `BackendLlmGateway` remains the provider boundary; feature code must not call provider SDKs directly.
- Debate must not introduce a separate LLM router, prompt runtime, cache layer, artifact writer, transcript store, provenance shape, or authority persistence path.
- Artifacts continue through the control-plane artifact-ref boundary, and authority writes remain inside domain services/repositories.
- Workflow acceptance coverage must use registered `WorkflowScenario` definitions instead of standalone runners with independent routing semantics.
- Implementation should proceed through profile registry/schema validation, shared provenance contract, orchestrator profile resolution/run-mode enforcement, WorkflowHarness scenarios, route-level node runner, and then real provider/Codex flow evidence.

## 2026-05-20 DMP Runtime Consumption
- T-088 implemented the first DMP runtime foundation slice: shared profile registry contracts and backend registry validator/resolver.
- T-088 then wired profile resolution into `AgentOrchestrator` and the current generate-need-candidate harness path, removing concrete provider/model/request-policy inputs from that runtime chain.
- Provider-backed invocation now resolves through `profile_id + model_option_id`; Codex/mock/provider outputs share one provenance envelope with profile hashes and selected option metadata.
- This is an implementation of the locked DMP-01 through DMP-10 policy baseline, not a new debate policy decision.
- T-089 remains the workflow/debate policy SSOT; T-088 owns runtime primitives.

## 2026-05-20 Need-Discovery Debate Runtime Consumption
- T-088 implemented the first concrete debate runtime for the T-089 `generate-need-candidate` node policy.
- The runtime follows the locked T-089 policy:
  - worker roles are `explorer` and `deep_critic`;
  - `arbiter` is single-instance and is the only external structured-output port;
  - same-role worker outputs merge into role-level summaries before arbiter consumption;
  - final output remains the existing `RankedCandidateDraftBatch`;
  - deterministic D-20/D-21/D-22 gates still decide admission, routing, and persistence;
  - no `NeedCandidateSet`, raw transcript handoff, or worker authority write path is introduced.
- The WorkflowHarness can now run a mocked `multi_agent_debate` generate-need-candidate scenario and keep authority persistence disabled when the scenario asks for artifact-only acceptance.
- T-089 policy gaps still pending:
  - exact provider/Codex role assignment evidence for real debate runs;
  - route-level scenario registry execution;
  - automatic orchestration of optional supplemental repair rounds beyond passing `round_index` into one loop execution.

## 2026-05-20 v1a Debate Scenario Contract SSOT
- Added the executable v1a generate-need-candidate debate contract as shared code plus a human-readable contract note.
- Shared SSOT: `packages/shared/src/research-lifecycle/topic-selection-debate-scenario-contracts.ts`.
- Documentation: `dev-docs/active/topic-selection-agent-workflow-review/12-v1a-generate-need-candidate-debate-contract.md`.
- The contract binds `topic-selection.v1a.generate-need-candidate.v1` to four runnable slots:
  - `explorer.round_1_discovery`, default 2 instances, profile `topic-selection.need-discovery.explorer.v1`;
  - `deep_critic.round_1_discovery`, default 1 instance, profile `topic-selection.need-discovery.deep-critic.v1`;
  - `arbiter.issue_framing`, exactly 1 instance, profile `topic-selection.need-discovery.arbiter-framing.v1`;
  - `arbiter.final_synthesis`, exactly 1 instance, profile `topic-selection.need-discovery.arbiter-final.v1`.
- The executable contract makes `arbiter.final_synthesis` Codex-forbidden in v1, aligning DMP-04 with the current profile registry/runtime strictness and avoiding an operator-approval dual track.
- Provider/model/parameter details remain profile-registry-owned:
  - default provider option is OpenAI `gpt-5.4-mini` with medium normalized params;
  - manual budget option is DashScope `qwen3.6-plus` with `enable_thinking` under provider overrides;
  - automatic fallback remains disabled.
- `TopicSelectionNeedDiscoveryDebateLoopService` now consumes the shared scenario contract for role/stage slot metadata, instance defaults, prompt/template ids, output contracts, schema names, debate policy id, node id, and round cap.
- Added provider-mode debate-loop coverage proving default execution makes two explorer calls, one deep critic call, one arbiter issue-frame call, and one arbiter final-synthesis call through profile-resolved OpenAI model options.
- Added slot-level `slot_execution_overrides` so provider-backed debate can explicitly substitute allowed worker/issue-framing slots with Codex while keeping `arbiter.final_synthesis` provider-backed.
- Added negative coverage proving `arbiter.final_synthesis` cannot be overridden to `codex_assisted`.
- Supplemental repair profiles remain policy-level future extension points; they are not part of the current executable contract until multi-round repair orchestration is implemented.

## 2026-05-20 v1a Flow Convergence: Build Evidence Map
- Converged `topic-selection.v1a.build-evidence-map.v1` from stub to `implementation_ready` in `07-node-policies.md`.
- The node is locked as deterministic evidence normalization:
  - no `AgentOrchestrator`, `BackendLlmGateway`, Codex, or debate runtime;
  - authority writes stay inside `TopicSelectionEvidenceMapService.createEvidenceMapFromSearchRun` and `TopicSelectionEvidenceMapRepository.createEvidenceMapWithRecords`;
  - the current executable entry point remains `POST /topic-selection/v1a/evidence-maps`, derived from `SearchRun` lineage rather than a separate sample-set authority write.
- The policy now aligns with current backend behavior:
  - SearchRun must be `succeeded` or `partial`;
  - SearchRun, SearchPlan, and LiteratureResourcePoolSnapshot lineage must match;
  - EvidenceUnit refs must come from SearchRun `evidence_map_input_refs` or coverage evidence bindings;
  - `source_attribution_kind=llm_inference` cannot become EvidenceUnit source authority;
  - abstract-only support is allowed only with `ABSTRACT_ONLY_SUPPORT` issue code for downstream gates.
- Remaining v1a convergence nodes:
  - `topic-selection.v1a.validate-need-adjudication.v1`;
  - `topic-selection.v1a.human-confirm-need.v1`;
  - `topic-selection.v1a.publish-v1b-input-bundle.v1`.

## 2026-05-20 v1a Flow Convergence: Generate Need Candidate
- Converged `topic-selection.v1a.generate-need-candidate.v1` from `draft` to `implementation_ready` in `07-node-policies.md`.
- The node policy now points at the actual runtime chain:
  - `TopicSelectionWorkflowHarnessService.runGenerateNeedCandidateScenario`;
  - `TopicSelectionGenerateNeedCandidateOrchestratorAdapterService.generateRankedCandidateDraftBatch`;
  - `TopicSelectionNeedDiscoveryContextCompilerService`;
  - `TopicSelectionNeedDiscoveryArtifactBoundaryService`;
  - `TopicSelectionAgentOrchestratorService.invokeStructuredOutput`;
  - `TopicSelectionNeedDiscoveryDebateLoopService.runNeedDiscoveryDebate`;
  - `TopicSelectionRankedCandidateDraftBatchValidatorService`;
  - `TopicSelectionCandidateDraftAdmissionService`;
  - `TopicSelectionSupplementalRoundRoutingService`;
  - `TopicSelectionPersistNeedCandidateBatchService`;
  - `TopicSelectionNeedValidationRepository.createNeedCandidatesBatch`.
- The policy explicitly separates the compatibility single-candidate route `POST /topic-selection/v1a/need-candidates` from the WorkflowHarness/debate/batch runtime. That route remains a legacy/manual creation path and must not claim debate or multi-candidate batch provenance.
- Profile escalation now references the DMP-05 semantics plus `TopicSelectionModelProfileRegistryService` and `TopicSelectionAgentOrchestratorService`, avoiding a second provider/model/fallback policy inside the node.
- Remaining v1a convergence nodes:
  - `topic-selection.v1a.validate-need-adjudication.v1`;
  - `topic-selection.v1a.human-confirm-need.v1`;
  - `topic-selection.v1a.publish-v1b-input-bundle.v1`.

## 2026-05-20 v1a Flow Split Implementation: Adjudication, Human Confirm, V1b Bundle
- Implemented the split that removes the previous composite validate route risk.
- `TopicSelectionNeedValidationService.adjudicateNeed` now writes only `TopicSelectionValidateNeedAdjudicationResultRecord` plus typed side-effect refs such as recheck requests or memory suggestions.
- `adjudicateNeed(final_decision=validate)` no longer writes `HumanConfirmedDecision`, `ValidatedNeed`, or `TopicSelectionV1aToV1bInputBundleRecord`.
- Added `TopicSelectionNeedValidationService.confirmValidatedNeed` and `POST /topic-selection/v1a/adjudications/:adjudicationResultId/human-confirmations`.
- `confirmValidatedNeed` is the only backend path in this slice that records a human decision and materializes `ValidatedNeed`.
- `publishV1bInputBundle` remains the deterministic v1a-to-v1b handoff path and now returns an existing bundle for the same `ValidatedNeed`/version instead of minting duplicates.
- A `NeedCandidate` with a pending adjudication now blocks further adjudication attempts until the pending path is resolved, preventing multiple candidate output ids before human confirmation.
- Clarified the persistence boundary: domain authority writes are atomic at the repository boundary, while pre-write control-plane audit records may remain as failed-attempt evidence and must not be treated as materialized downstream authority.
- Converged the three v1a node policies from `draft` to `implementation_ready`:
  - `topic-selection.v1a.validate-need-adjudication.v1`;
  - `topic-selection.v1a.human-confirm-need.v1`;
  - `topic-selection.v1a.publish-v1b-input-bundle.v1`.
- Updated route, service, Prisma/in-memory repository, real-flow script, unit tests, route integration tests, and decision-chain acceptance tests to use the split sequence:
  - adjudication recommendation;
  - explicit human confirmation;
  - deterministic v1b input bundle publication.

## 2026-05-20 Real E2E Canary Harness Migration
- The real E2E canary now consumes the `topic-selection.v1a.generate-need-candidate.v1` node policy through `TopicSelectionWorkflowHarnessService`.
- This closes the most important policy/runtime gap for v1a testing: the canary no longer uses the compatibility `POST /topic-selection/v1a/need-candidates` route as the generate-node implementation.
- The compatibility route remains documented as a manual/single-candidate path and must not be treated as multi-candidate, debate, or harness provenance.
- The run records `topic-selection.real-e2e.canary.v1` in the v1a output artifact, including scenario status, execution mode, adapter status, routing decision, persisted candidate refs, candidate-pool projection ref, and harness trace artifact ref.
- A failed rehearsal surfaced a semantic drift risk in ref versions: harness-created candidates must preserve canonical versioned refs for EvidenceMap, SearchPlan, LiteratureResourcePoolSnapshot, and EvidenceUnit refs so v1b intake trace checks match support-packet lineage.
- The script now carries those version ids into the harness input before persistence.
- This is a partial migration of the canary script, not full scenario-runner replacement for every node. Resource sampling, v1b, v1c, bridge, and downstream steps still need scenario-wrapper convergence in later T-088/T-089 work.

## 2026-05-20 WorkflowScenario Runner Migration: Scale Quality And v1b Negative
- Retired the standalone `.ai/scripts/topic-selection-real-e2e-quality-gate.mjs` path after marking it as legacy compatibility.
- Added `.ai/scripts/topic-selection-workflow-scenario-runner.mjs` and mapped the old quality-gate assertions to registered scenario ids:
  - `topic-selection.real-e2e.scale-quality.v1`;
  - child `topic-selection.real-e2e.canary.v1` runs;
  - child `topic-selection.v1b.non-advance-negative.v1` when negative coverage is enabled.
- Updated `08-scenarios.md` so the scale-quality and v1b non-advance negative scenarios no longer appear as unimplemented standalone-script placeholders.
- `pnpm topic-selection:real-e2e:quality-gate` remains a command name for continuity, but now resolves to the scenario runner with `--scenario topic-selection.real-e2e.scale-quality.v1`.
- The migration preserves legacy quality assertions while preventing a second script-local semantic source for sampling stability, role counts, selected evidence polarity checks, intake invariants, and v1b non-advance stop behavior.
- The first migrated smoke run found a stale resource-sampling semantic artifact: role/polarity were canonicalized, but rationale and method family still described the LLM's previous role. The service now canonicalizes rationale/method family with the selected role so downstream quality audits do not read conflicting evidence-role semantics.

## 2026-05-20 v1a WorkflowHarness Normalization Alignment
- Corrected the v1a start boundary: complete v1a starts at `topic-selection.v1a.create-topic-seed.v1`, not at EvidenceMap.
- Added v1a preparatory nodes to `06-workflow-matrix.md` and `07-node-policies.md`:
  - `topic-selection.v1a.create-topic-seed.v1`;
  - `topic-selection.v1a.snapshot-literature-resource-pool.v1`;
  - `topic-selection.v1a.create-search-plan.v1`;
  - `topic-selection.v1a.record-search-run.v1`.
- Confirmed that the evidence-to-need subchain semantics are implementation-ready in `07-node-policies.md`, but only `generate-need-candidate` currently meets the normalized `WorkflowHarness` automation standard.
- T-088 now owns the implementation slice `07-v1a-workflow-harness-normalization.md`.
- T-089 remains the semantic source for node policy details; this avoids creating a second policy source inside runtime implementation docs.
- TitleCard creation remains upstream of v1a for this slice.
- Resource sampling remains outside complete v1a for this slice and should not be treated as a v1a node during harness normalization.

## 2026-05-20 v1a Flow Convergence: Create TopicSeed
- Promoted `topic-selection.v1a.create-topic-seed.v1` from `draft` to `implementation_ready` in `07-node-policies.md`.
- Locked the node as deterministic:
  - no `AgentOrchestrator`;
  - no provider/Codex/debate execution;
  - no resource-sampling input coupling;
  - no SearchPlan, EvidenceMap, NeedCandidate, or v1b authority writes.
- Authority remains `TopicSelectionTopicSeedRecord` written by `TopicSelectionSearchResourceService.createTopicSeedFromTitleCard` and `TopicSelectionSearchResourceRepository.createTopicSeed`.
- The node now has an executable harness runner through `TopicSelectionWorkflowHarnessService.runCreateTopicSeedScenario`.
- The policy records the service hardening that final `intent_summary` after fallback must be non-empty and that `seed_kind` is fixed to `title_card`.

## 2026-05-20 Node Policy Evaluation: Automation Callability
- Added `automation_callability` as a node-evaluation dimension in `07-node-policies.md`.
- This separates semantic readiness from executable automation:
  - `policy_status=implementation_ready` means the node contract is clear enough to build against;
  - `automation_callability=callable` means a normalized `WorkflowHarness` runner exists and scenario code can invoke the node without script-local business choreography.
- Added a v1a callability snapshot so the 9-node workflow can be reviewed without assuming every implementation-ready node is already automated.
- Current v1a callable nodes are `create-topic-seed` and `generate-need-candidate`.

## 2026-05-20 v1a Node 2 Alignment: Snapshot Boundary And Source Of Truth
- Locked N2-D01 for `topic-selection.v1a.snapshot-literature-resource-pool.v1`: the node only materializes `TopicSelectionLiteratureResourcePoolSnapshot` authority and must not perform resource sampling, literature selection, evidence-role classification, or evidence-polarity judgment.
- Locked N2-D02: the normalized v1a path uses the TitleCard evidence basket as the single source of included literature for this node.
- `ResourceSampleSet` may be recorded only as upstream provenance after selected literature has already been attached to the evidence basket; it must not become a second direct input path for snapshot contents.
- Superseded by N2-D10: the node is now `policy_status=implementation_ready` while `automation_callability` remains `not_callable` until the runner and tests exist.

## 2026-05-20 v1a Node 2 Alignment: Source Scope
- Locked N2-D03 for `topic-selection.v1a.snapshot-literature-resource-pool.v1`.
- The normalized harness path supports only `source_scope=title_card_evidence_basket`.
- Existing shared-contract enum values `manual_selection` and `search_result` remain compatibility values only; they must not be treated as implemented alternate resolvers in normalized v1a execution.
- A harness input using `manual_selection` or `search_result` must return a blocked result with `UNSUPPORTED_SOURCE_SCOPE_FOR_NORMALIZED_V1A` before authority creation.

## 2026-05-20 v1a Node 2 Alignment: Resource Quality Gate
- Locked N2-D04 for `topic-selection.v1a.snapshot-literature-resource-pool.v1`.
- The node blocks only traceability and authority-creation failures: missing TopicSeed, TopicSeed/title-card lineage mismatch, empty evidence basket, unresolved evidence-basket literature ids, unsupported normalized source scope, or failed control-plane gate/transition.
- Resource maturity gaps are diagnostic at this node and must flow through `source_health_summary.warning_codes`: incomplete key content, incomplete abstract, low source count, incomplete pipeline readiness, stale/duplicate status, and incomplete fulltext readiness.
- This keeps the node as a resource-pool snapshot boundary rather than a research-quality adjudication boundary.

## 2026-05-20 v1a Node 2 Alignment: Snapshot Hash And Replay
- Locked N2-D05 for `topic-selection.v1a.snapshot-literature-resource-pool.v1`.
- `snapshot_hash` is the replay identity for snapshot contents and source-health state, not an identity for a specific execution attempt.
- The hash must include stable inputs: `title_card_id`, TopicSeed ref, `source_scope`, evidence basket `updated_at`, evidence-basket-derived literature refs, content source refs, `source_health_summary`, and `policy_version_id`.
- The hash must exclude execution artifacts: snapshot id, control-plane ids, harness trace artifact id, `created_at`, and `created_by`.
- Repeated runs over the same TopicSeed, evidence basket state, source scope, source health summary, and policy must keep the same `snapshot_hash` even when audit/control-plane ids differ.

## 2026-05-20 v1a Node 2 Alignment: Harness Runner Contract
- Locked N2-D06 for `topic-selection.v1a.snapshot-literature-resource-pool.v1`.
- The planned runner is `TopicSelectionWorkflowHarnessService.runSnapshotLiteratureResourcePoolScenario`.
- The runner must call `TopicSelectionSearchResourceService.createLiteratureResourcePoolSnapshot` as the authority service and must not write the repository directly.
- The runner must expose stable normalized node input/result types and a shared success/blocked outer result shape.
- A blocked result must include blocker codes, normalized node input, no snapshot authority refs, and a harness trace artifact ref when trace recording is available.
- At contract-lock time the node was not yet callable; this was superseded by the implementation slice below.

## 2026-05-20 v1a Node 2 Alignment: Audit And Trace Boundary
- Locked N2-D07 for `topic-selection.v1a.snapshot-literature-resource-pool.v1`.
- Control-plane records remain authoritative audit facts: input snapshot, readiness gate result, and transition attempt.
- Harness trace artifact `WorkflowHarnessSnapshotLiteratureResourcePoolScenarioTrace@v1` is automation execution evidence and must not replace control-plane audit refs.
- The trace must record scenario/node/run/attempt ids, normalized input/result, `snapshot_hash`, `source_health_summary`, authority refs, control-plane refs, blockers, warnings, and assertions.
- The trace must not record hidden reasoning, secrets, provider logs, raw LLM transcripts, or raw debate transcripts.

## 2026-05-20 v1a Node 2 Alignment: SearchPlan Handoff
- Locked N2-D08 for `topic-selection.v1a.snapshot-literature-resource-pool.v1`.
- The downstream SearchPlan node must consume the `LiteratureResourcePoolSnapshot` authority produced by this node.
- SearchPlan must not re-read the mutable TitleCard evidence basket, `ResourceSampleSet`, selected literature refs, or current search results as resource truth.
- The handoff packet must carry snapshot ref, version, hash, source scope, literature refs, content source refs, and `source_health_summary`.
- If the evidence basket changes after snapshot creation, those changes affect SearchPlan only after a new `LiteratureResourcePoolSnapshot` is created.

## 2026-05-20 v1a Node 2 Alignment: Idempotency And Repeated Runs
- Locked N2-D09 for `topic-selection.v1a.snapshot-literature-resource-pool.v1`.
- The default behavior is append-only: repeated equivalent runs may create new `LiteratureResourcePoolSnapshot` authority ids.
- Content equivalence is represented by `snapshot_hash`; equivalent repeated runs must keep the same hash while recording distinct execution/audit evidence.
- The runner must not silently reuse an existing snapshot authority by hash, must not treat `snapshot_hash` as the authority ref, and must not skip control-plane gate/transition evidence because an equivalent hash exists.
- Any future `reuse_existing_snapshot_by_hash` behavior requires an explicit policy and runner input flag.

## 2026-05-20 v1a Node 2 Alignment: Implementation Readiness Review
- Locked N2-D10 and promoted `topic-selection.v1a.snapshot-literature-resource-pool.v1` to `policy_status=implementation_ready`.
- At readiness-review time the node was not yet callable; this was superseded by the implementation slice below.
- Complexity is moderate and bounded: the node is deterministic, uses an existing route/service/repository authority path, and reuses control-plane input snapshot, gate, transition, and artifact primitives.
- The implementation does not require provider LLMs, Codex, AgentOrchestrator, debate runtime, schema migration, or new authority objects.
- Known implementation gaps are explicit: implement `runSnapshotLiteratureResourcePoolScenario`, align `snapshot_hash` payload, expand source-health maturity warning codes, add the trace schema, and cover success/blocked/hash/idempotency/handoff assertions.

## 2026-05-20 v1a Node 2 Implementation: WorkflowHarness Runner
- Implemented `TopicSelectionWorkflowHarnessService.runSnapshotLiteratureResourcePoolScenario` and promoted the node to `automation_callability=callable`.
- The runner delegates authority creation to `TopicSelectionSearchResourceService.createLiteratureResourcePoolSnapshot`; it does not write the repository directly.
- The runner returns stable normalized input/result shapes across success and blocked paths, including downstream SearchPlan handoff data, audit refs, blocker/warning codes, assertions, and a control-plane trace artifact using `WorkflowHarnessSnapshotLiteratureResourcePoolScenarioTrace@v1`.
- Unsupported normalized harness `source_scope` values now block before authority creation with `UNSUPPORTED_SOURCE_SCOPE_FOR_NORMALIZED_V1A`.
- Missing evidence-basket literature records preserve `MISSING_LITERATURE_RECORD` as the blocker code on the blocked harness result.
- `snapshot_hash` now follows the locked content replay identity and excludes runtime ids; repeated equivalent runs can create distinct snapshot authority refs while keeping the same hash.
- `source_health_summary.warning_codes` now includes resource maturity warnings without converting traceable immature resources into hard blockers.

## 2026-05-20 v1a Node 2 Quality Review Follow-up
- Fixed the blocked-path audit gap found during self-review: missing-literature blocked results now include the input snapshot, readiness gate, and transition attempt refs created before repository persistence is skipped.
- Tightened `topic_seed_ref` validation for normalized snapshot execution: `ref_type=topic_seed`, non-empty `ref_id`, non-empty `version_id`, and matching non-empty `title_card_id` are required before authority creation.
- Hardened harness input string validation to consistently return `INVALID_PAYLOAD` for malformed programmatic inputs.
- Added regression tests for blocked audit refs and non-concrete TopicSeed refs.

## 2026-05-20 v1a Node 3 Alignment: SearchPlan Boundary
- Locked N3-D01 for `topic-selection.v1a.create-search-plan.v1`.
- The node only materializes a caller-supplied SearchPlan blueprint into SearchPlan and coverage-row authorities.
- It remains deterministic and model-free: no retrieval execution, EvidenceMap construction, evidence-role adjudication, research-content generation, AgentOrchestrator, provider LLM, Codex, or debate runtime is allowed.
- The normalized path uses the LiteratureResourcePoolSnapshot authority from Node 2 as resource truth and blocks stale snapshot assumptions through an expected `snapshot_hash`.
- Explicit coverage intents are required for automation; route/service support-only fallback remains compatibility behavior rather than normalized harness behavior.

## 2026-05-20 v1a Node 3 Alignment: Blueprint Source
- Locked N3-D02 for `topic-selection.v1a.create-search-plan.v1`.
- SearchPlan blueprint is an upstream input supplied before Node 3 runs. Node 3 does not infer or draft it from TopicSeed, Snapshot, TitleCard, ResourceSampleSet, selected literature refs, or search results.
- Valid origins are scenario fixtures, human-authored local input, Codex-assisted local drafting, or a future upstream `draft-search-plan-blueprint` node.
- Future automatic blueprint drafting must be separated from `create-search-plan` so generation policy, model choice, context, and verification cannot drift into the authority-materialization node.
- Blueprint provenance is trace metadata only; the resource truth remains the Node 2 LiteratureResourcePoolSnapshot authority.
- Corrected contract ownership: `TopicSelectionSearchPlanBlueprint` is a module-level topic-selection value contract that Node 3 consumes, not a node-private N3 contract.
- The first implementation can freeze it in Node 3 input snapshot and harness trace; a future producer node may persist it separately only after defining that authority/artifact policy.

## 2026-05-20 v1a Node 3 Alignment: Blueprint Minimum Contract
- Locked N3-D03 as the module-level `TopicSelectionSearchPlanBlueprint@v1` minimum contract.
- The minimum fields are sufficient for all current consumers: Node 3, Node 4, EvidenceMap, NeedCandidate generation, and future blueprint producers.
- Coverage rows are execution-level: `coverage_key`, `intent_type`, `query`, `rationale`, `required`, `priority`, `expected_evidence_role`, `target_source_types`, and `refs` are mandatory after normalization.
- `target_source_types` and `refs` may be empty arrays, but missing fields are not allowed in normalized harness execution.
- This keeps SearchPlan planning quality explicit and prevents service fallback defaults from becoming the automated v1a contract.

## 2026-05-21 v1a Node 3 Alignment: Blueprint LLM Profiles
- Locked N3-D04 for `TopicSelectionSearchPlanBlueprint` semantic draft/review model policy.
- Codex is the default local low-cost execution path for draft and review; provider execution is explicit upgrade/provider-quality only.
- Draft profile `topic-selection.search-plan-blueprint.draft.v1` uses `creativity=medium`, `reasoning_depth=high`, `output_budget=large`, structured JSON schema output, and provider options OpenAI `gpt-5.4-mini`, OpenAI `gpt-5.5`, and DashScope `qwen3.6-plus`.
- Review profile `topic-selection.search-plan-blueprint.review.v1` uses `creativity=low`, `reasoning_depth=high`, `output_budget=medium`, structured JSON schema output, and the same provider family.
- DeepSeek is not included until registered in the provider registry.
- `create-search-plan` itself stays `execution_mode=none`; model-like draft/review output must pass schema and deterministic validators before authority creation.

## 2026-05-21 v1a Node 1/2 LLM Boundary Amendments
- Recorded the TopicSeed and resource-pool-snapshot LLM boundary as original-node amendments, not as a new N3 decision.
- N1-AM01: `topic-selection.v1a.create-topic-seed.v1` remains deterministic with `execution_mode=none`. Human/Codex/provider/fixture preparation may shape the final `intent_summary` and `scope_notes` before invocation, but Node 1 only freezes accepted input and writes `TopicSelectionTopicSeed` through the authority service.
- No TopicSeed draft/review model profile is executable in the current slice. `TopicSeedIntentDraft@v1` is reserved only as a possible future pre-node value artifact/profile.
- N2-AM01: `topic-selection.v1a.snapshot-literature-resource-pool.v1` remains deterministic and model-free. It snapshots traceable resource state only; sampling, role classification, polarity judgment, and evidence interpretation stay outside Node 2.
- This avoids decision-order drift: SearchPlanBlueprint LLM policy remains N3-D04, while TopicSeed and snapshot boundaries remain attached to Node 1 and Node 2.

## 2026-05-21 v1a Node 3 Alignment: WorkflowHarness Runner Contract
- Locked N3-D05 for `topic-selection.v1a.create-search-plan.v1`.
- `TopicSelectionWorkflowHarnessService.runCreateSearchPlanScenario` is the normalized automation boundary.
- The runner input is `TopicSelectionSearchPlanBlueprint@v1` plus scenario/run metadata; normalized automation must not pass a permissive bare `CreateSearchPlanInput`.
- The runner must perform strict pre-service validation so route/service compatibility fallback cannot create automated coverage semantics.
- Normalized harness execution blocks omitted coverage intents, missing coverage-row fields, fallback coverage keys, fallback priorities, fallback support roles, and fallback generic rationales before SearchPlan/CoverageRow authority creation.
- Authority writes remain inside `TopicSelectionSearchResourceService.createSearchPlan`; direct repository writes and partial authority on blocked results are forbidden.
- `WorkflowHarnessCreateSearchPlanScenarioTrace@v1` is the trace schema for normalized runner evidence.

## 2026-05-21 v1a Node 3 Implementation: Callable SearchPlan Runner
- Promoted `topic-selection.v1a.create-search-plan.v1` to `policy_status=implementation_ready` and `automation_callability=callable`.
- Implemented `runCreateSearchPlanScenario` with stable node input/result shapes for success and blocked paths.
- Added `TopicSelectionSearchPlanBlueprint@v1` and its exported schema-version constant to shared search/resource contracts and schema smoke coverage.
- Tightened normalized validation so wrong blueprint schema versions, missing blueprint, lineage drift, snapshot hash drift, empty query/coverage intents, and missing coverage semantic fields block before authority creation.
- Hardened malformed coverage intent handling so non-object entries and blank string-array values block deterministically before service invocation.
- Preserved route/service compatibility fallback for manual/API callers while forbidding fallback-derived coverage rows in normalized WorkflowHarness execution.
- Full blueprint payload is frozen in the service input snapshot and harness trace, so future Node 4/EvidenceMap consumers can audit the exact plan semantics without re-reading mutable resource state.
- Node 1 and Node 2 provenance amendments are reflected in runtime inputs: intent-preparation refs and resource-sample-set provenance refs are auditable but do not introduce LLM execution into either node.
