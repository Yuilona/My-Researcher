# 04 Verification

## Status
- Verification runs are recorded below. New implementation must add focused checks next to the decision or slice it validates.

## Matrix Acceptance Checks
- Every topic-selection workflow node has one row in `06-workflow-matrix.md`.
- The matrix contains the complete D-11 canonical node list before executor classification work begins.
- Every row has all required D-10 fields.
- Every non-deterministic row declares audit and artifact expectations.
- Every debate-allowed row has a corresponding node-level debate policy or an explicit pending marker.
- Every debate-rejected row records a rejection reason.
- Every Codex-allowed row records provenance and validation expectations.
- Every provider-required row records why Codex-assisted execution is insufficient.
- Every row references at least one planned or existing `WorkflowScenario` id.
- Deterministic and human-review rows use `default_execution_mode=none`.
- No row has `provider_required=yes` unless a node policy section explains why provider execution is mandatory.
- Initial `debate_allowed=yes` appears only on the four current D-12/D-17 debate-eligible nodes.

## Node Policy Acceptance Checks
- Every matrix row has a matching section in `07-node-policies.md`.
- Every node policy reserves all required D-13 fields.
- `TBD-node-policy-detail` is allowed only while T-089 is in design alignment.
- Before implementation of a node, its policy must remove `TBD-node-policy-detail` from preconditions, blockers, validators, execution modes, debate triggers, escalation refs, contract refs, authority boundaries, audit/artifact policy, and failure semantics.
- Debate-allowed nodes must define a concrete `debate_trigger_policy` before debate implementation.
- Codex-allowed nodes must define allowed execution modes and provenance expectations before Codex-assisted implementation.
- Policy detail work follows D-15 order: common vocabulary first, then the four debate-eligible nodes, then remaining single-agent nodes, then deterministic/human/downstream spine.
- A node can be marked `policy_status=implementation_ready` only after all D-13 fields are concrete and scenario assertions can cite the policy.

## Scenario Coverage Acceptance Checks
- Every matrix row has a non-empty `covered_scenarios` value.
- Every matrix scenario id exists in `08-scenarios.md`.
- No `TBD-scenario` placeholder remains after D-14.
- Provider-stability scenarios are listed only on model-like rows unless a deterministic row explicitly validates provider-derived input handling.
- Debate scenarios are listed only on D-12 debate-eligible nodes.
- Negative scenarios identify the stop node and assert downstream authority objects remain absent.
- Scenarios cite matrix rows and node policies as their business semantics source.

## D-16 Resource Sampling Policy Checks
- Resource sampling policy is at least `policy_status=draft`.
- The policy defines concrete preconditions, blockers, deterministic validators, execution modes, authority boundary, audit/artifact policy, and failure semantics.
- Debate roles are limited to arbiter, explorer, and deep critic by default.
- Arbiter has exactly one instance and owns issue framing, turn routing, synthesis, stop decision, and final structured output.
- Worker roles can have multiple agents, but same-role outputs must merge into a role-level summary before arbiter synthesis.
- Debate has bounded internal rounds and terminal outputs only: `finalize`, `blocked`, or `require_human_review`.
- Debate cannot automatically restart after terminal exit.
- Final debate output remains advisory and must pass deterministic guardrails before sample-set persistence.

## D-17 Need Discovery Split Checks
- `generate-need-candidate` is debate-eligible and may produce 1..5 persisted `NeedCandidate` records through the existing v1a service boundary.
- `validate-need-adjudication` is not debate-eligible in the initial matrix.
- The v1a debate scenario targets need discovery, not adjudication.
- No new `NeedCandidateSet` authority object, table, DTO, route, or persistence path is introduced by D-17.
- Candidate discovery output includes persisted NeedCandidate refs plus artifacted alternatives/rejections/merge hints, evidence refs, assumptions, uncertainty, scope notes, non-goals, and batch ranking.
- Candidate acquisition gate order is context compile, ranked draft batch, deterministic per-candidate gates, rejected-framing artifact, all-or-none authority write, and candidate-pool projection.
- Generate-need-candidate debate cannot create `ValidatedNeed` or mutate SearchPlan authority.
- Adjudication consumes one selected `NeedCandidate`, sibling candidate-pool context, and support packet, then routes validate/return/recheck/reject/park/merge with human confirmation fallback.

## D-18 Context Cache Memory Checks
- Cache, compressed summaries, projection caches, and response reuse are not authority objects.
- No new execution mode is introduced for response cache reuse.
- Provider-required scenarios must not use historical response cache as live `provider_llm`.
- Local cost-saving response reuse must be explicit `codex_assisted` operator-approved reuse or `mocked_llm` replay/acceptance, with cache provenance and `non_provider=true`.
- Debate nodes distinguish `exploration_context` from `arbiter_context`.
- Explorer/deep-critic role calls consume `exploration_context`; arbiter calls consume `arbiter_context` plus role-level summaries and deterministic gate checklist.
- Shared context envelope includes node/run/attempt ids, context family, input refs/hash, compiler/policy/schema/profile/mode versions, cache key/hit, redaction policy, and created_at.
- `exploration_context` includes topic scope, evidence/resource/search digests, sibling candidate digest, decision memory digest, exploration/challenge prompts, allowed outputs, and forbidden outputs.
- `arbiter_context` includes node policy, output schema, authority boundary, max persisted candidates, deterministic gate checklist, role-level summaries, candidate pool digest, evidence ref table, rejected framing table, unresolved points, batch ranking rules, persistence rules, and failure rules.
- Durable memory enters only as constraint, warning, required challenge, duplicate/merge hint, recheck hint, risk carry-forward, or downstream challenge; it is not evidence.
- Context packet cache hits require exact match on input refs/hash, compiler version, policy version, schema version, execution mode, profile, and context family.
- Cached responses must still pass schema validation, deterministic gates, audit/artifact recording, and authority-write boundaries.

## D-19 Draft Mapping And Debate Workflow Checks
- Draft-to-`TopicSelectionNeedCandidateRecord` mapping is documented before final draft-batch schema lock.
- Direct persistence mapping is limited to candidate body/mechanism/scope/prior-art/evidence/conflict/strength/gap/speculative/confidence fields.
- Backend/runtime derives ids, status, version/hash, source refs, control-plane refs, artifact refs, result/merge refs, creator, and timestamps.
- `draft_id`, `rank`, batch rationale, arbiter rationale, rejected framings, unresolved points, recheck suggestions, duplicate/merge hints, and raw role transcripts are artifact-only.
- Need-discovery debate has one required exploration/critique round.
- Arbiter may request supplemental rounds only for scoped unresolved questions.
- Maximum total rounds is 3.
- After round 3, arbiter must emit `finalize`, `blocked`, or `require_human_review`.
- Supplemental rounds must not restart broad exploration.

## D-20 Ranked Candidate Draft Batch Minimum Schema Checks
- `ranked_candidate_draft_batch` is an artifact/model-output contract, not an authority object.
- Minimum schema includes `schema_version`, `draft_batch`, `drafts`, `rejected_framings`, and `unresolved_points`.
- `draft_batch` includes `batch_id`, `terminal_result`, and `ranking_rationale`.
- `terminal_result` is limited to `finalize`, `blocked`, or `require_human_review`.
- `finalize` requires at least one draft.
- `blocked` may have zero drafts but must include unresolved points or rejected framings with reason codes.
- `require_human_review` requires an unresolved point routed to human review.
- Draft count is capped by `max_persisted_candidates`.
- Draft ranks are unique and contiguous.
- Each draft includes fields required for deterministic gates and D-19 direct mapping.
- Rejected framings and unresolved points remain artifacts and do not create authority objects.
- `assumptions`, `uncertainty_notes`, `duplicate_or_merge_hint`, and `recheck_suggestions` are not v1 minimum required fields.

## D-21 NeedCandidate Draft Admission Gate Checks
- Candidate draft admission gates run after ranked draft batch schema validation and before any `NeedCandidate` authority write.
- `CandidateDraftAdmissionReport` is an artifact and not an authority object.
- Admission report includes `schema_version`, `batch_id`, `node_attempt_id`, `terminal_result`, `draft_results`, count fields, and blocking reason codes.
- Draft decisions are limited to `admit`, `reject_artifact_only`, `require_human_review`, `return_for_supplemental_round`, and `merge_hint_only`.
- Gate order is schema, reference integrity, scope, evidence sufficiency, mechanism sufficiency, novelty/duplicate, risk/speculation, and batch.
- Admitted drafts must have resolvable refs, in-scope need statements, support/challenge evidence, and a researchable mechanism.
- Duplicate drafts become merge hints and do not create authority rows.
- Speculative drafts require challenge/conflict refs or explicit scope limits.
- Zero admitted drafts can request supplemental round only while debate rounds remain; otherwise the node blocks or requires human review.
- Admission gates must not rewrite candidate content, invent refs, create `ValidatedNeed`, mutate `SearchPlan`, or perform partial authority writes.

## D-22 Supplemental Round Routing Checks
- `SupplementalRoundRoutingDecision` is produced before any optional supplemental round starts.
- Supplemental routing is an artifact decision and not an authority object.
- Routing decisions are limited to `run_supplemental_round`, `reject_without_supplement`, `block`, `require_human_review`, and `finalize_with_admitted_batch`.
- Supplemental rounds are allowed only for promising grounded drafts with supplementable reasons and remaining round budget.
- Supplementable reasons are targeted evidence/mechanism/scope/conflict/speculation/differentiation repair needs.
- Non-supplementable reasons include malformed schema/context, missing source refs, topic drift, exclusion/non-goal violation, ungrounded drafts, pseudo-gaps, pure duplicates, and exhausted round budget.
- Supplemental questions target explicit source draft ids and are capped at 5 per supplemental round.
- Supplemental workers must not reopen broad exploration, introduce unrelated candidate families, mutate authority objects, or call persistence paths.
- Supplemental output re-enters D-20 schema validation and D-21 admission gates before persistence.
- After round 3, routing cannot request another round.

## D-23 NeedCandidate Persistence Batch Checks
- `PersistNeedCandidateBatchCommand` consumes only drafts marked `admit` in `CandidateDraftAdmissionReport`.
- Persistence does not consume raw debate output, non-admitted drafts, rejected framings, unresolved points, hidden reasoning, or artifact rationale as authority fields.
- The write boundary remains `TopicSelectionNeedValidationService`/repository or a batch wrapper over the same repository boundary.
- No `NeedCandidateSet` or alternate candidate write path is introduced.
- Backend/runtime derives candidate ids, hash/version, statuses, authority refs, artifact/audit refs, creator/source metadata, and timestamps.
- `candidate_hash` excludes rank, rationale, role transcripts, hidden reasoning, rejected framings, unresolved points, and supplemental routing explanations.
- `idempotency_key` is derived from workflow/run/attempt/draft/admission inputs and replay returns the same persisted refs without duplicate insertion.
- Batch persistence returns `persisted_candidate_refs`, `candidate_pool_projection_ref`, and `candidate_pool_projection_hash`.
- Candidate-pool projection is a view over `NeedCandidate` rows and not a durable set authority.
- Empty admitted drafts, non-admitted draft persistence, unresolved refs, duplicate normalized keys, hash/version failures, or any per-draft failure block/rollback before partial persistence.

## D-24 GenerateNeedCandidate Node I/O Checks
- `GenerateNeedCandidateNodeInput` is the required external input contract for `topic-selection.v1a.generate-need-candidate.v1`.
- `GenerateNeedCandidateNodeResult` is the required external result contract for all execution modes.
- Input carries refs and context packet refs, not scattered raw DB records.
- `codex_assisted`, `provider_llm`, and `mocked_llm` share the same I/O shape.
- Result separates workflow `status` from agent/debate `terminal_result`.
- `succeeded` requires `terminal_result=finalize`, non-empty persisted candidate refs, projection ref/hash, and success artifact refs.
- `blocked` requires `terminal_result=blocked` and at least one failure artifact.
- `require_human_review` requires `terminal_result=require_human_review` and human-review reason metadata.
- `persisted_candidate_refs=[]` is allowed only for `blocked` or `require_human_review`.
- Downstream handoff is limited to persisted candidate refs, projection refs/hash, discovery audit ref, warnings, and error code.
- Downstream nodes must not consume raw debate transcripts or hidden reasoning as business input.
- The node must not create `ValidatedNeed`, `SearchPlan`, `NeedCandidateSet`, or a v1b input bundle.

## D-25 GenerateNeedCandidate Implementation Slice Checks
- D-25 is a construction plan and does not add a runtime authority object or alternate node I/O contract.
- Slice order is contracts/schema, artifact/ref boundary, context compiler integration, orchestrator adapter, draft schema validation, admission gates, supplemental routing, persistence batch, and WorkflowHarness scenarios.
- Contracts/schema slice defines DTO/schema/error-code contracts before business persistence or model calls.
- Artifact/ref boundary defines artifact refs/hash, redacted snapshot shape, and FunctionalRef resolution before orchestration depends on artifacts.
- Context compiler integration validates D-18 context packets before any LLM invocation.
- Orchestrator adapter keeps mocked/codex/provider outputs on the same node I/O shape.
- Draft schema validation implements D-20 before admission gates.
- Admission gates implement D-21 deterministic service logic before persistence and before provider/codex E2E is treated as meaningful.
- Supplemental routing implements D-22 and is first verified with mocked role outputs.
- Persistence batch implements D-23 through the existing service/repository boundary.
- WorkflowHarness scenarios cover happy path, zero admitted to supplemental, duplicate to merge hint, malformed draft blocked, persistence rollback, and execution-mode shape stability.
- Deterministic tests run before model-like execution tests, and mocked harness scenarios run before provider/codex scenarios.
- Guardrails remain no `NeedCandidateSet`, raw transcript handoff, mode-specific result shape, D-20/D-21/D-23 bypass, partial batch persistence, or cached response masquerading as `provider_llm`.

## 2026-05-19 D-17 Verification Runs
- Command: `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`
- Result: passed.
- Command: custom matrix/scenario consistency check for 21 matrix rows, 9 registered scenarios, missing scenario refs, debate refs on non-debate rows, and provider-stability refs on non-single-agent rows.
- Result: passed; missing refs `[]`, debate refs on non-debate rows `[]`, provider refs on non-single-agent rows `[]`.
- Command: custom matrix/policy/fill-order consistency check for 21 matrix nodes, 21 policy sections, phase coverage, duplicates, D-17 phase placement.
- Result: passed; missing/extra/duplicate nodes `[]`, `generate-need-candidate` is in Phase 1, `validate-need-adjudication` is in Phase 2.

## 2026-05-19 D-17 Repo-Compatibility Correction
- Correction: removed `NeedCandidateSet` as a proposed authority object and restored `NeedCandidate` as the generate-need-candidate authority object.
- Command: `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`
- Result: passed.
- Command: custom D-17 consistency check for matrix rows, registered scenarios, debate refs, provider refs, `NeedCandidateSet` authority drift, existing Prisma `TopicSelectionNeedCandidate`, existing `POST /topic-selection/v1a/need-candidates`, and explicit no-`NeedCandidateSet` guard.
- Result: passed; generate row authority `NeedCandidate`, generate debate `yes`, adjudication debate `no`, missing scenario refs `[]`, bad `NeedCandidateSet` authority `false`, repo NeedCandidate/API guards `true`.
- Command: final D-17 matrix/scenario check after verification note update.
- Result: passed; 21 rows, 9 scenarios, missing refs `[]`, debate refs on non-debate rows `[]`, provider refs on non-single-agent rows `[]`, generate authority `NeedCandidate`, generate debate `yes`, adjudication debate `no`, no `NeedCandidateSet` authority.

## 2026-05-19 D-17 Multi-Candidate Attempt Update
- Update: a successful generate attempt may persist a bounded batch of `1..5` independent `NeedCandidate` records.
- Update: invalid candidate drafts are not persisted; they are recorded as rejected-framing artifacts, and the attempt succeeds only when at least one candidate passes per-candidate gates.
- Command: custom D-17 multi-candidate consistency check for matrix/scenario refs, generate authority/output refs, generate/adjudication debate flags, no `NeedCandidateSet` authority, bounded-batch policy, and no stale exactly-one write rule.
- Result: passed; 21 rows, 9 scenarios, missing refs `[]`, debate refs on non-debate rows `[]`, generate authority `NeedCandidate`, generate output plural refs present, generate debate `yes`, adjudication debate `no`, no `NeedCandidateSet` authority, bounded batch present, stale exactly-one rule absent.
- Command: `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`
- Result: passed.
- Command: `git diff --check -- dev-docs/active/topic-selection-workflow-runtime-foundation/06-joint-decisions.md dev-docs/active/topic-selection-agent-workflow-review/02-architecture.md dev-docs/active/topic-selection-agent-workflow-review/03-implementation-notes.md dev-docs/active/topic-selection-agent-workflow-review/04-verification.md dev-docs/active/topic-selection-agent-workflow-review/06-workflow-matrix.md dev-docs/active/topic-selection-agent-workflow-review/07-node-policies.md dev-docs/active/topic-selection-agent-workflow-review/08-scenarios.md`
- Result: passed.

## 2026-05-19 D-17 Batch Limit And Invalid Candidate Handling
- Update: increased generate-attempt persistence cap from 3 to 5 `NeedCandidate` records.
- Update: locked invalid candidate handling: rejected drafts are not persisted; the attempt succeeds only when at least one candidate passes per-candidate gates.
- Command: custom D-17 batch-limit consistency check for matrix/scenario refs, generate authority/output refs, generate/adjudication debate flags, no `NeedCandidateSet` authority, `1..5` bounded-batch policy, no stale `1..3` rule, invalid-candidate handling, and no stale exactly-one write rule.
- Result: passed; 21 rows, 9 scenarios, missing refs `[]`, debate refs on non-debate rows `[]`, provider refs on non-single-agent rows `[]`, generate authority `NeedCandidate`, generate output plural refs present, generate debate `yes`, adjudication debate `no`, no `NeedCandidateSet` authority, bounded batch 5 present, stale batch 3 absent, invalid handling present, stale exactly-one rule absent.
- Command: `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`
- Result: passed.
- Command: `git diff --check -- dev-docs/active/topic-selection-workflow-runtime-foundation/06-joint-decisions.md dev-docs/active/topic-selection-agent-workflow-review/02-architecture.md dev-docs/active/topic-selection-agent-workflow-review/03-implementation-notes.md dev-docs/active/topic-selection-agent-workflow-review/04-verification.md dev-docs/active/topic-selection-agent-workflow-review/06-workflow-matrix.md dev-docs/active/topic-selection-agent-workflow-review/07-node-policies.md dev-docs/active/topic-selection-agent-workflow-review/08-scenarios.md`
- Result: passed.

## 2026-05-19 D-17 Candidate Acquisition Gate Order
- Update: locked candidate acquisition order as deterministic context compile -> ranked draft batch -> deterministic per-candidate gates -> rejected-framing artifact for invalid drafts -> all-or-none authority write for 1..5 valid candidates -> candidate-pool projection.
- Command: custom D-17 gate-order consistency check for matrix/scenario refs, generate/adjudication routing, no `NeedCandidateSet` authority, ranked draft batch as non-authority, deterministic gates before persistence, invalid drafts filtered before transaction, all-or-none valid batch persistence, notes alignment, and verification coverage.
- Result: passed; 21 rows, 9 scenarios, missing refs `[]`, debate refs on non-debate rows `[]`, provider refs on non-single-agent rows `[]`, generate authority `NeedCandidate`, generate output plural refs present, adjudication debate `no`, no `NeedCandidateSet` authority, gate order present, draft non-authority present, pre-persistence gate present, invalid pre-transaction filtering present, all-or-none present.
- Command: `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`
- Result: passed.
- Command: `git diff --check -- dev-docs/active/topic-selection-workflow-runtime-foundation/06-joint-decisions.md dev-docs/active/topic-selection-agent-workflow-review/02-architecture.md dev-docs/active/topic-selection-agent-workflow-review/03-implementation-notes.md dev-docs/active/topic-selection-agent-workflow-review/04-verification.md dev-docs/active/topic-selection-agent-workflow-review/06-workflow-matrix.md dev-docs/active/topic-selection-agent-workflow-review/07-node-policies.md dev-docs/active/topic-selection-agent-workflow-review/08-scenarios.md`
- Result: passed.

## 2026-05-19 D-18 Context Cache Memory Policy
- Update: locked cache/context/memory policy with separate `exploration_context` and `arbiter_context`, no authority cache, and explicit cost-saving response reuse provenance.
- Command: custom D-18 consistency check for matrix/scenario refs, execution-mode vocabulary, no cached execution mode, D-18 existence, no-authority cache rule, response reuse policy, provider-cache non-masquerade, local cost-saving `codex_assisted`, `mocked_llm` replay, context families, generate-need-candidate node policy, scenario artifact expectations, notes, and verification coverage.
- Result: passed; 21 rows, 9 scenarios, missing refs `[]`, debate refs on non-debate rows `[]`, no cached execution mode, D-18 exists, cache is not authority, no new response-reuse execution mode, provider-cache masquerade blocked, local cost-saving `codex_assisted` present, `mocked_llm` replay present, context families present in joint decision and node policy, role context routing present, exact context cache key present, response reuse provenance present, scenario context expectations present.
- Command: `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`
- Result: passed.
- Command: `git diff --check -- dev-docs/active/topic-selection-workflow-runtime-foundation/06-joint-decisions.md dev-docs/active/topic-selection-agent-workflow-review/02-architecture.md dev-docs/active/topic-selection-agent-workflow-review/03-implementation-notes.md dev-docs/active/topic-selection-agent-workflow-review/04-verification.md dev-docs/active/topic-selection-agent-workflow-review/06-workflow-matrix.md dev-docs/active/topic-selection-agent-workflow-review/07-node-policies.md dev-docs/active/topic-selection-agent-workflow-review/08-scenarios.md`
- Result: passed.

## 2026-05-19 D-18 Context Field Structure
- Update: locked shared context envelope, exploration payload, arbiter payload, durable memory admission roles, compression layers, context cache key, and default context size policy for v1a need discovery.
- Command: custom D-18 field-structure consistency check for matrix/scenario refs, shared envelope fields, `exploration_context` minimum fields, `arbiter_context` minimum fields, memory admission roles, scenario artifact expectations, cache key fields, family-specific cache isolation, notes, and verification coverage.
- Result: passed; 21 rows, 9 scenarios, missing refs `[]`, debate refs on non-debate rows `[]`, joint/policy/verification envelope coverage true, joint/policy/verification exploration coverage true, joint/policy/verification arbiter coverage true, memory admission true, scenario artifacts true, cache key true, family cache isolation true.
- Command: `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`
- Result: passed.
- Command: `git diff --check -- dev-docs/active/topic-selection-workflow-runtime-foundation/06-joint-decisions.md dev-docs/active/topic-selection-agent-workflow-review/02-architecture.md dev-docs/active/topic-selection-agent-workflow-review/03-implementation-notes.md dev-docs/active/topic-selection-agent-workflow-review/04-verification.md dev-docs/active/topic-selection-agent-workflow-review/06-workflow-matrix.md dev-docs/active/topic-selection-agent-workflow-review/07-node-policies.md dev-docs/active/topic-selection-agent-workflow-review/08-scenarios.md`
- Result: passed.

## 2026-05-19 D-19 Draft Mapping And Debate Workflow
- Update: locked draft-to-NeedCandidate mapping categories and v1a need-discovery debate workflow with optional arbiter-scoped supplemental rounds up to 3 total rounds.
- Command: custom D-19 consistency check for matrix/scenario refs, direct draft mapping fields, backend-derived fields, artifact-only fields, max 3 rounds, optional rounds 2/3, terminal outputs, no broad restart in supplemental rounds, scenario supplemental-round expectations, draft-to-record mapping report, notes, and verification coverage.
- Result: passed; 21 rows, 9 scenarios, missing refs `[]`, debate refs on non-debate rows `[]`, D-19 exists, direct mapping present, backend-derived fields present, artifact-only fields present, max 3 rounds present, terminal outputs present, no broad restart present, scenario mapping report present.
- Command: `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`
- Result: passed.
- Command: `git diff --check -- dev-docs/active/topic-selection-workflow-runtime-foundation/06-joint-decisions.md dev-docs/active/topic-selection-agent-workflow-review/02-architecture.md dev-docs/active/topic-selection-agent-workflow-review/03-implementation-notes.md dev-docs/active/topic-selection-agent-workflow-review/04-verification.md dev-docs/active/topic-selection-agent-workflow-review/06-workflow-matrix.md dev-docs/active/topic-selection-agent-workflow-review/07-node-policies.md dev-docs/active/topic-selection-agent-workflow-review/08-scenarios.md`
- Result: passed.

## 2026-05-19 D-20 Ranked Candidate Draft Batch Minimum Schema
- Update: locked minimum schema for ranked candidate draft batch as artifact/model-output contract.
- Command: custom D-20 consistency check for matrix/scenario refs, D-20 joint decision, artifact-not-authority boundary, minimum schema fields, `draft_batch` fields, draft direct-mapping fields, rejected-framing fields, unresolved-point fields, terminal result rules, rank uniqueness/contiguity, non-required optional fields, scenario artifact expectations, implementation notes, and verification coverage.
- Result: passed; 21 rows, 9 scenarios, missing refs `[]`, debate refs on non-debate rows `[]`, D-20 exists, artifact-not-authority boundary present, joint/policy minimum fields present, terminal rules present, rank rules present, optional fields remain non-required, scenario expects ranked candidate draft batch artifact and minimum schema validation report.
- Command: `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`
- Result: passed.
- Command: `git diff --check -- dev-docs/active/topic-selection-workflow-runtime-foundation/06-joint-decisions.md dev-docs/active/topic-selection-agent-workflow-review/02-architecture.md dev-docs/active/topic-selection-agent-workflow-review/03-implementation-notes.md dev-docs/active/topic-selection-agent-workflow-review/04-verification.md dev-docs/active/topic-selection-agent-workflow-review/06-workflow-matrix.md dev-docs/active/topic-selection-agent-workflow-review/07-node-policies.md dev-docs/active/topic-selection-agent-workflow-review/08-scenarios.md`
- Result: passed.

## 2026-05-19 D-21 NeedCandidate Draft Admission Gates
- Update: locked deterministic draft admission gates and `CandidateDraftAdmissionReport` before `NeedCandidate` persistence.
- Command: custom D-21 consistency check for matrix/scenario refs, D-21 joint decision, `CandidateDraftAdmissionReport` artifact boundary, admission decisions, gate order, report fields, no content rewrite/ref invention, duplicate merge-only handling, speculative draft constraints, zero-admit supplemental/block/review semantics, output contract refs, audit artifacts, scenario artifact expectations, implementation notes, and verification coverage.
- Result: passed; 21 rows, 9 scenarios, missing refs `[]`, debate refs on non-debate rows `[]`, D-21 exists, admission report artifact present, joint/policy decisions present, gate order present, report fields present, no-rewrite boundary present, duplicate merge-only behavior present, speculative constraints present, zero-admit semantics present, scenario expects CandidateDraftAdmissionReport and admission gate decisions.
- Command: `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`
- Result: passed.
- Command: `git diff --check -- dev-docs/active/topic-selection-workflow-runtime-foundation/06-joint-decisions.md dev-docs/active/topic-selection-agent-workflow-review/02-architecture.md dev-docs/active/topic-selection-agent-workflow-review/03-implementation-notes.md dev-docs/active/topic-selection-agent-workflow-review/04-verification.md dev-docs/active/topic-selection-agent-workflow-review/06-workflow-matrix.md dev-docs/active/topic-selection-agent-workflow-review/07-node-policies.md dev-docs/active/topic-selection-agent-workflow-review/08-scenarios.md`
- Result: passed.

## 2026-05-19 D-22 Supplemental Round Routing Policy
- Update: locked supplemental round routing and `SupplementalRoundRoutingDecision` for optional repair rounds in `generate-need-candidate`.
- Command: custom D-22 consistency check for matrix/scenario refs, D-22 joint decision, `SupplementalRoundRoutingDecision` artifact boundary, routing decisions, artifact fields, supplementable/non-supplementable reasons, explicit source draft ids, question cap, no broad re-exploration, no authority mutation, re-entry through D-20/D-21 gates, round-3 terminal behavior, output contract refs, audit artifacts, scenario artifact expectations, implementation notes, and verification coverage.
- Result: passed; 21 rows, 9 scenarios, missing refs `[]`, debate refs on non-debate rows `[]`, D-22 exists, routing artifact present, joint/policy routing decisions present, artifact fields present, supplementable and non-supplementable reasons present, explicit draft ids and question cap present, no broad re-exploration present, D-20/D-21 re-entry present, round-3 terminal behavior present, scenario expects SupplementalRoundRoutingDecision.
- Command: `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`
- Result: passed.
- Command: `git diff --check -- dev-docs/active/topic-selection-workflow-runtime-foundation/06-joint-decisions.md dev-docs/active/topic-selection-agent-workflow-review/02-architecture.md dev-docs/active/topic-selection-agent-workflow-review/03-implementation-notes.md dev-docs/active/topic-selection-agent-workflow-review/04-verification.md dev-docs/active/topic-selection-agent-workflow-review/06-workflow-matrix.md dev-docs/active/topic-selection-agent-workflow-review/07-node-policies.md dev-docs/active/topic-selection-agent-workflow-review/08-scenarios.md`
- Result: passed.

## 2026-05-20 Shared Invocation Provenance Runtime Consumption
- Update: consumed the T-088 shared invocation provenance/audit envelope as the future debate attempt audit shape.
- Command: `cd packages/shared && node --test --loader ts-node/esm src/research-lifecycle/topic-selection-agent-invocation-contracts.schema.test.ts`
- Result: passed; 4 tests passed.
- Command: `cd apps/backend && node --test --loader ts-node/esm src/services/topic-selection-agent-orchestrator-service.unit.test.ts src/services/topic-selection-generate-need-candidate-orchestrator-adapter-service.unit.test.ts src/services/topic-selection-workflow-harness-service.unit.test.ts`
- Result: passed; 19 tests passed.
- Command: `pnpm --filter @paper-engineering-assistant/shared test`
- Result: passed; 100 tests passed.
- Command: `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main`
- Result: passed; project hub regenerated.
- Command: `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`
- Result: passed.
- Coverage:
  - debate-capable future role attempts have a shared core provenance envelope plus optional `debate_extension`;
  - ordinary single-agent and future debate calls no longer need separate audit shapes;
  - mock/Codex/provider source differences remain explicit in provenance instead of changing node result contracts.

## 2026-05-19 D-23 NeedCandidate Persistence Batch Contract
- Update: locked admitted-draft batch persistence contract, idempotency, backend-derived fields, all-or-none writes, and candidate-pool projection refs/hash.
- Command: custom D-23 consistency check for matrix/scenario refs, D-23 joint decision, `PersistNeedCandidateBatchCommand`, command/draft fields, admitted-only input, no raw debate/artifact authority fields, existing service/repository write boundary, no `NeedCandidateSet`, backend-derived fields, hash/version/idempotency rules, artifact/audit attachment, candidate-pool projection refs/hash, failure semantics, rollback/all-or-none behavior, scenario artifact expectations, implementation notes, and verification coverage.
- Result: passed; 21 rows, 9 scenarios, missing refs `[]`, debate refs on non-debate rows `[]`, D-23 exists, command contract present, command/draft fields present, admitted-only input present, no raw output/rationale authority path present, existing write boundary present, no NeedCandidateSet path present, derived fields present, hash/idempotency rules present, projection refs/hash present, failure codes present, rollback/all-or-none behavior present.
- Command: `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`
- Result: passed.
- Command: `git diff --check -- dev-docs/active/topic-selection-workflow-runtime-foundation/06-joint-decisions.md dev-docs/active/topic-selection-agent-workflow-review/02-architecture.md dev-docs/active/topic-selection-agent-workflow-review/03-implementation-notes.md dev-docs/active/topic-selection-agent-workflow-review/04-verification.md dev-docs/active/topic-selection-agent-workflow-review/06-workflow-matrix.md dev-docs/active/topic-selection-agent-workflow-review/07-node-policies.md dev-docs/active/topic-selection-agent-workflow-review/08-scenarios.md`
- Result: passed.

## 2026-05-19 D-24 GenerateNeedCandidate Node I/O Contract
- Update: locked external node input/result contracts, status versus terminal semantics, required artifacts by status, shared shape across execution modes, downstream handoff boundary, and node non-authority exclusions.
- Command: custom D-24 consistency check for matrix/scenario refs, D-24 joint decision, `GenerateNeedCandidateNodeInput`, `GenerateNeedCandidateNodeResult`, input/result fields, artifact fields, input refs/context-only rule, shared execution-mode shape, status/terminal mappings, empty persisted refs rule, required artifact refs by status, error code set, downstream handoff refs, no raw transcript handoff, no `ValidatedNeed`, no `SearchPlan`, no `NeedCandidateSet`, no v1b input bundle, scenario artifact expectations, implementation notes, and verification coverage.
- Result: passed; 21 rows, 9 scenarios, missing refs `[]`, debate refs on non-debate rows `[]`, D-24 exists, input/result contracts present, fields present, artifact refs present, refs-only input rule present, shared execution-mode shape present, status/terminal mappings present, required artifact constraints present, error codes present, downstream handoff boundary present, no raw transcript or forbidden authority creation path present.
- Command: `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`
- Result: passed.
- Command: `git diff --check -- dev-docs/active/topic-selection-workflow-runtime-foundation/06-joint-decisions.md dev-docs/active/topic-selection-agent-workflow-review/02-architecture.md dev-docs/active/topic-selection-agent-workflow-review/03-implementation-notes.md dev-docs/active/topic-selection-agent-workflow-review/04-verification.md dev-docs/active/topic-selection-agent-workflow-review/06-workflow-matrix.md dev-docs/active/topic-selection-agent-workflow-review/07-node-policies.md dev-docs/active/topic-selection-agent-workflow-review/08-scenarios.md`
- Result: passed.

## 2026-05-19 D-25 GenerateNeedCandidate Implementation Slice
- Update: locked implementation slice order and staged verification policy for `generate-need-candidate`.
- Command: custom D-25 consistency check for matrix/scenario refs, D-25 joint decision, construction-plan-only boundary, implementation slice order, contracts-first rule, artifact/ref boundary, context-before-LLM rule, shared orchestrator output shape, D-20/D-21/D-22/D-23 implementation order, WorkflowHarness scenario coverage, deterministic-before-LLM verification, mocked-before-provider/codex verification, scenario artifact expectations, implementation guardrails, implementation notes, and verification coverage.
- Result: passed; 21 rows, 9 scenarios, missing refs `[]`, debate refs on non-debate rows `[]`, D-25 exists, construction-only boundary present, slice order present in joint decision and node policy, contracts/artifacts/context/orchestrator prerequisites present, D-20/D-21/D-22/D-23 order present, scenario coverage present, deterministic-before-LLM and mocked-before-provider/codex order present, guardrails present.
- Command: `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`
- Result: passed.
- Command: `git diff --check -- dev-docs/active/topic-selection-workflow-runtime-foundation/06-joint-decisions.md dev-docs/active/topic-selection-agent-workflow-review/02-architecture.md dev-docs/active/topic-selection-agent-workflow-review/03-implementation-notes.md dev-docs/active/topic-selection-agent-workflow-review/04-verification.md dev-docs/active/topic-selection-agent-workflow-review/06-workflow-matrix.md dev-docs/active/topic-selection-agent-workflow-review/07-node-policies.md dev-docs/active/topic-selection-agent-workflow-review/08-scenarios.md`
- Result: passed.

## 2026-05-19 Current State Mapping
- Update: added `09-current-state-map.md` to map the D-25 implementation slices to current repository anchors before coding.
- Scope finding: D-17 through D-25 are deeply focused on `topic-selection.v1a.generate-need-candidate.v1`; T-089 as a task still covers resource sampling, v1a, v1b, v1c, and downstream rows in the workflow matrix.
- Gap finding: current repo has reusable NeedCandidate, control-plane, route, repository, Prisma, and LLM gateway anchors, but lacks the node I/O contracts, draft/admission/routing/persist contracts, context compiler, `AgentOrchestrator`, admission gates, supplemental routing, batch/idempotent persistence, and `WorkflowHarness` scenarios required by D-25.
- Command: custom current-state mapping consistency check for scope answer, matrix breadth, policy depth, nine D-25 slices, NeedCandidate anchors, control-plane anchors, LLM anchors, route anchors, missing runtime gaps, no-`NeedCandidateSet` boundary, implementation notes, and verification entry.
- Result: passed.
- Command: `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`
- Result: passed.
- Command: `git diff --check -- dev-docs/active/topic-selection-agent-workflow-review/03-implementation-notes.md dev-docs/active/topic-selection-agent-workflow-review/04-verification.md dev-docs/active/topic-selection-agent-workflow-review/09-current-state-map.md`
- Result: passed.

## 2026-05-19 D-26 Cross-Version Boundary
- Update: locked lightweight v1a -> v1b -> v1c handoff boundaries before D-25 `contracts_schema` implementation.
- Command: custom D-26 consistency check for joint decision, T-089 boundary doc, implementation notes, v1a/v1b/v1c authority handoff rules, no raw debate handoff, candidate-pool projection default boundary, no `NeedCandidateSet`, and D-25 contract implications.
- Result: passed.
- Command: `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`
- Result: passed.
- Command: `git diff --check -- dev-docs/active/topic-selection-workflow-runtime-foundation/06-joint-decisions.md dev-docs/active/topic-selection-agent-workflow-review/03-implementation-notes.md dev-docs/active/topic-selection-agent-workflow-review/04-verification.md dev-docs/active/topic-selection-agent-workflow-review/10-cross-version-boundaries.md`
- Result: passed.

## 2026-05-19 D-25 `contracts_schema` Implementation
- Update: implemented shared v1a generate-need-candidate DTO/schema/error-code contracts.
- Command: `pnpm --filter @paper-engineering-assistant/shared test`
- Result: passed; 92 tests passed.
- Command: `git diff --check -- packages/shared/src/research-lifecycle/topic-selection-need-validation-contracts.ts apps/backend/src/services/topic-selection-candidate-draft-admission-service.ts apps/backend/src/services/topic-selection-candidate-draft-admission-service.unit.test.ts dev-docs/active/topic-selection-agent-workflow-review/03-implementation-notes.md dev-docs/active/topic-selection-agent-workflow-review/04-verification.md`
- Result: passed.
- Command: `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`
- Result: passed.
- Command: custom D-25 `admission_gates` quality review consistency check for required normalized keys, human-review fallback target, same-batch duplicate coverage, pseudo-gap coverage, and docs.
- Result: passed.
- Command: `pnpm --filter @paper-engineering-assistant/shared typecheck`
- Result: passed.
- Command: custom D-25 `contracts_schema` consistency check for exported schemas, execution/status/admission/routing/error vocabularies, D-20/D-24 contract presence, D-26 no-v1b/v1c field leakage, schema tests, implementation notes, and verification entry.
- Result: passed.
- Command: `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`
- Result: passed.
- Command: `git diff --check -- packages/shared/src/research-lifecycle/topic-selection-need-validation-contracts.ts packages/shared/src/research-lifecycle/title-card-management-contracts.schema.test.ts dev-docs/active/topic-selection-agent-workflow-review/03-implementation-notes.md dev-docs/active/topic-selection-agent-workflow-review/04-verification.md dev-docs/active/topic-selection-agent-workflow-review/09-current-state-map.md dev-docs/active/topic-selection-agent-workflow-review/10-cross-version-boundaries.md dev-docs/active/topic-selection-workflow-runtime-foundation/06-joint-decisions.md`
- Result: passed.

## 2026-05-19 D-25 `artifact_ref_boundary` Implementation
- Update: implemented shared artifact snapshot/ref-bundle contracts and backend need-discovery artifact boundary helper.
- Command: `pnpm --filter @paper-engineering-assistant/shared test`
- Result: passed; 92 tests passed.
- Command: `pnpm --filter @paper-engineering-assistant/shared typecheck`
- Result: passed.
- Command: `cd apps/backend && node --test --loader ts-node/esm src/services/topic-selection-need-discovery-artifact-boundary-service.unit.test.ts src/services/topic-selection-control-plane-service.unit.test.ts`
- Result: passed; 10 tests passed.
- Command: `pnpm --filter @paper-engineering-assistant/backend typecheck`
- Result: passed.
- Command: custom D-25 `artifact_ref_boundary` consistency check for shared artifact contracts, backend helper, redaction guards, control-plane write/read boundary, FunctionalRef resolution, checksum verification, tests, implementation notes, and current-state map.
- Result: passed.
- Command: `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`
- Result: passed.
- Command: `git diff --check -- packages/shared/src/research-lifecycle/topic-selection-need-validation-contracts.ts packages/shared/src/research-lifecycle/title-card-management-contracts.schema.test.ts apps/backend/src/services/topic-selection-control-plane-service.ts apps/backend/src/services/topic-selection-need-discovery-artifact-boundary-service.ts apps/backend/src/services/topic-selection-need-discovery-artifact-boundary-service.unit.test.ts dev-docs/active/topic-selection-agent-workflow-review/03-implementation-notes.md dev-docs/active/topic-selection-agent-workflow-review/04-verification.md dev-docs/active/topic-selection-agent-workflow-review/09-current-state-map.md dev-docs/active/topic-selection-agent-workflow-review/10-cross-version-boundaries.md dev-docs/active/topic-selection-workflow-runtime-foundation/06-joint-decisions.md`
- Result: passed.

## 2026-05-19 D-25 `context_compiler_integration` Implementation
- Update: implemented shared context packet contracts and backend D-18 context compiler helper for `exploration_context` and `arbiter_context`.
- Command: `pnpm --filter @paper-engineering-assistant/shared test`
- Result: passed; 92 tests passed.
- Command: `cd apps/backend && node --test --loader ts-node/esm src/services/topic-selection-need-discovery-context-compiler-service.unit.test.ts src/services/topic-selection-need-discovery-artifact-boundary-service.unit.test.ts`
- Result: passed; 6 tests passed.
- Command: `pnpm --filter @paper-engineering-assistant/backend typecheck`
- Result: passed.
- Command: `pnpm --filter @paper-engineering-assistant/shared typecheck`
- Result: passed.
- Command: custom D-25 `context_compiler_integration` consistency check for shared context contracts, context artifact keys, backend compiler helper, exact cache key builder, family-specific resolve, forbidden raw-context guard, tests, implementation notes, and current-state map.
- Result: passed.
- Command: `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`
- Result: passed.
- Command: `git diff --check -- packages/shared/src/research-lifecycle/topic-selection-need-validation-contracts.ts packages/shared/src/research-lifecycle/title-card-management-contracts.schema.test.ts apps/backend/src/services/topic-selection-need-discovery-artifact-boundary-service.ts apps/backend/src/services/topic-selection-need-discovery-context-compiler-service.ts apps/backend/src/services/topic-selection-need-discovery-context-compiler-service.unit.test.ts dev-docs/active/topic-selection-agent-workflow-review/03-implementation-notes.md dev-docs/active/topic-selection-agent-workflow-review/04-verification.md dev-docs/active/topic-selection-agent-workflow-review/09-current-state-map.md`
- Result: passed.

## 2026-05-19 D-25 Three-Slice Quality Review And Fixes
- Update: reviewed and tightened the first three implemented D-25 slices.
- Fixes:
  - artifact/context refs are now constrained to `ref_type=artifact_ref` where D-25 semantics require artifact refs.
  - schema tests now reject `context_packet` refs in `GenerateNeedCandidateNodeInput`.
  - artifact boundary now validates source refs, artifact keys, bundle entries, and snapshot `payload_hash` on resolve.
- Command: `pnpm --filter @paper-engineering-assistant/shared test`
- Result: passed; 92 tests passed.
- Command: `pnpm --filter @paper-engineering-assistant/shared typecheck`
- Result: passed.
- Command: `cd apps/backend && node --test --loader ts-node/esm src/services/topic-selection-need-discovery-context-compiler-service.unit.test.ts src/services/topic-selection-need-discovery-artifact-boundary-service.unit.test.ts`
- Result: passed; 7 tests passed.
- Command: `pnpm --filter @paper-engineering-assistant/backend typecheck`
- Result: passed.

## 2026-05-19 D-25 `orchestrator_adapter` Initial Implementation
- Update: started the fourth slice by adding the reusable T-088 `AgentOrchestrator` runtime helper.
- Command: `cd apps/backend && node --test --loader ts-node/esm src/services/topic-selection-agent-orchestrator-service.unit.test.ts src/services/topic-selection-need-discovery-context-compiler-service.unit.test.ts src/services/topic-selection-need-discovery-artifact-boundary-service.unit.test.ts`
- Result: passed; 11 tests passed.
- Command: `pnpm --filter @paper-engineering-assistant/backend typecheck`
- Result: passed.
- Command: `set -a; . ./.env.local; set +a; pnpm --filter @paper-engineering-assistant/backend test`
- Result: passed; 578 backend tests total, 577 passed, 1 skipped, 0 failed.
- Coverage:
  - stable normalized result shape across `mocked_llm`, `codex_assisted`, and `provider_llm`;
  - provider execution routes through `BackendLlmGateway`;
  - non-provider modes are provenance-labeled and provider-distinguishable;
  - `mocked_llm` product-mode use is rejected;
  - invalid structured output blocks without mode-specific result shape;
  - forbidden raw/hidden fields block;
  - audit artifacts store hashes/provenance rather than full structured outputs.

## 2026-05-19 D-25 `orchestrator_adapter` Node Adapter Implementation
- Update: added the generate-need-candidate node adapter that consumes context packet refs and invokes `AgentOrchestrator`.
- Command: `cd apps/backend && node --test --loader ts-node/esm src/services/topic-selection-generate-need-candidate-orchestrator-adapter-service.unit.test.ts src/services/topic-selection-agent-orchestrator-service.unit.test.ts src/services/topic-selection-need-discovery-context-compiler-service.unit.test.ts src/services/topic-selection-need-discovery-artifact-boundary-service.unit.test.ts`
- Result: passed; 14 tests passed.
- Command: `pnpm --filter @paper-engineering-assistant/backend typecheck`
- Result: passed.
- Command: `pnpm --filter @paper-engineering-assistant/shared typecheck`
- Result: passed.
- Command: `pnpm --filter @paper-engineering-assistant/shared test`
- Result: passed; 92 tests passed.
- Command: `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`
- Result: passed.
- Command: `git diff --check -- apps/backend/src/services/topic-selection-agent-orchestrator-service.ts apps/backend/src/services/topic-selection-agent-orchestrator-service.unit.test.ts apps/backend/src/services/topic-selection-generate-need-candidate-orchestrator-adapter-service.ts apps/backend/src/services/topic-selection-generate-need-candidate-orchestrator-adapter-service.unit.test.ts dev-docs/active/topic-selection-agent-workflow-review/03-implementation-notes.md dev-docs/active/topic-selection-agent-workflow-review/04-verification.md dev-docs/active/topic-selection-agent-workflow-review/09-current-state-map.md dev-docs/active/topic-selection-workflow-runtime-foundation/03-implementation-notes.md dev-docs/active/topic-selection-workflow-runtime-foundation/04-verification.md`
- Result: passed.
- Command: custom D-25 `orchestrator_adapter` node-adapter consistency check for context resolution, expectation guards, execution mode coverage, gateway path separation, ranked batch artifact write boundary, implementation notes, verification, and current-state map.
- Result: passed.
- Coverage:
  - adapter succeeds through `mocked_llm`, `codex_assisted`, and `provider_llm` using one result shape;
  - provider mode calls the gateway path while non-provider modes do not;
  - stale/mismatched context packet expectations block before invocation;
  - ranked batch artifact is written only after orchestrator schema validation succeeds;
  - blocked output does not create a ranked draft batch artifact.

## 2026-05-19 D-25 `draft_schema_validation` Implementation
- Update: added deterministic minimum semantic validation for `RankedCandidateDraftBatch` before admission gates.
- Initial command: `cd apps/backend && node --test --loader ts-node/esm src/services/topic-selection-ranked-candidate-draft-batch-validator-service.unit.test.ts src/services/topic-selection-generate-need-candidate-orchestrator-adapter-service.unit.test.ts src/services/topic-selection-agent-orchestrator-service.unit.test.ts src/services/topic-selection-need-discovery-context-compiler-service.unit.test.ts src/services/topic-selection-need-discovery-artifact-boundary-service.unit.test.ts`
- Initial result: failed; exposed a validator test fixture issue and an adapter type narrowing issue around arbiter context payload access.
- Fix: made the invalid fixture consistently ungrounded and narrowed `arbiter_context` before reading `max_persisted_candidates`.
- Final command: `cd apps/backend && node --test --loader ts-node/esm src/services/topic-selection-ranked-candidate-draft-batch-validator-service.unit.test.ts src/services/topic-selection-generate-need-candidate-orchestrator-adapter-service.unit.test.ts src/services/topic-selection-agent-orchestrator-service.unit.test.ts src/services/topic-selection-need-discovery-context-compiler-service.unit.test.ts src/services/topic-selection-need-discovery-artifact-boundary-service.unit.test.ts`
- Final result: passed; 18 tests passed.
- Command: `pnpm --filter @paper-engineering-assistant/backend typecheck`
- Result: passed after the arbiter payload type narrowing fix.
- Command: `pnpm --filter @paper-engineering-assistant/shared typecheck`
- Result: passed.
- Initial command: `pnpm --filter @paper-engineering-assistant/shared test`
- Initial result: failed; the new negative schema assertion used an extra field, which Fastify did not reject under the current validation behavior.
- Fix: changed the negative schema assertion to an invalid `severity` enum value.
- Final command: `pnpm --filter @paper-engineering-assistant/shared test`
- Final result: passed; 92 tests passed.
- Command: `git diff --check -- packages/shared/src/research-lifecycle/topic-selection-need-validation-contracts.ts packages/shared/src/research-lifecycle/title-card-management-contracts.schema.test.ts apps/backend/src/services/topic-selection-ranked-candidate-draft-batch-validator-service.ts apps/backend/src/services/topic-selection-ranked-candidate-draft-batch-validator-service.unit.test.ts apps/backend/src/services/topic-selection-generate-need-candidate-orchestrator-adapter-service.ts apps/backend/src/services/topic-selection-generate-need-candidate-orchestrator-adapter-service.unit.test.ts dev-docs/active/topic-selection-agent-workflow-review/03-implementation-notes.md dev-docs/active/topic-selection-agent-workflow-review/04-verification.md dev-docs/active/topic-selection-agent-workflow-review/09-current-state-map.md`
- Result: passed.
- Command: `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`
- Result: passed.
- Command: custom D-25 `draft_schema_validation` consistency check for shared report schema, deterministic validator, adapter artifact boundary, documentation, verification, and current-state map.
- Result: passed.
- Coverage:
  - shared contract exposes `RankedCandidateDraftBatchMinimumValidationReport`;
  - validator accepts grounded finalize batches;
  - validator blocks semantic drift before admission gates;
  - validator allows explained empty blocked batches;
  - adapter writes `minimum_schema_validation_report` before ranked batch artifact;
  - invalid semantic output blocks with `INVALID_RANKED_CANDIDATE_DRAFT_BATCH`;
  - invalid semantic output does not write `ranked_candidate_draft_batch`.

## 2026-05-19 D-25 `admission_gates` Implementation
- Update: added deterministic `CandidateDraftAdmissionReport` generation before persistence.
- Initial command: `cd apps/backend && node --test --loader ts-node/esm src/services/topic-selection-candidate-draft-admission-service.unit.test.ts src/services/topic-selection-ranked-candidate-draft-batch-validator-service.unit.test.ts src/services/topic-selection-generate-need-candidate-orchestrator-adapter-service.unit.test.ts src/services/topic-selection-agent-orchestrator-service.unit.test.ts src/services/topic-selection-need-discovery-context-compiler-service.unit.test.ts src/services/topic-selection-need-discovery-artifact-boundary-service.unit.test.ts`
- Initial result: failed; admission service tests passed, but adapter test failed at load because the adapter accessed arbiter-only context payload fields without narrowing the context family.
- Fix: narrowed `arbiter_context` before extracting `evidence_ref_table`, `rejected_framing_table`, and `unresolved_points`.
- Final command: `cd apps/backend && node --test --loader ts-node/esm src/services/topic-selection-candidate-draft-admission-service.unit.test.ts src/services/topic-selection-ranked-candidate-draft-batch-validator-service.unit.test.ts src/services/topic-selection-generate-need-candidate-orchestrator-adapter-service.unit.test.ts src/services/topic-selection-agent-orchestrator-service.unit.test.ts src/services/topic-selection-need-discovery-context-compiler-service.unit.test.ts src/services/topic-selection-need-discovery-artifact-boundary-service.unit.test.ts`
- Final result: passed; 24 tests passed.
- Command: `pnpm --filter @paper-engineering-assistant/backend typecheck`
- Result: passed.
- Command: `pnpm --filter @paper-engineering-assistant/shared typecheck`
- Result: passed.
- Command: `pnpm --filter @paper-engineering-assistant/shared test`
- Result: passed; 92 tests passed.
- Command: `git diff --check -- packages/shared/src/research-lifecycle/topic-selection-need-validation-contracts.ts packages/shared/src/research-lifecycle/title-card-management-contracts.schema.test.ts apps/backend/src/services/topic-selection-candidate-draft-admission-service.ts apps/backend/src/services/topic-selection-candidate-draft-admission-service.unit.test.ts apps/backend/src/services/topic-selection-generate-need-candidate-orchestrator-adapter-service.ts apps/backend/src/services/topic-selection-generate-need-candidate-orchestrator-adapter-service.unit.test.ts dev-docs/active/topic-selection-agent-workflow-review/03-implementation-notes.md dev-docs/active/topic-selection-agent-workflow-review/04-verification.md dev-docs/active/topic-selection-agent-workflow-review/09-current-state-map.md`
- Result: passed.
- Command: `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`
- Result: passed.
- Command: custom D-25 `admission_gates` consistency check for shared D-21 fields, no authority writes, admission gate reason codes, adapter artifact boundary, documentation, verification, and current-state map.
- Result: passed.
- Coverage:
  - shared `CandidateDraftAdmissionReport` schema now includes D-21 result fields;
  - grounded non-duplicate drafts are admitted;
  - duplicate normalized keys become `merge_hint_only`;
  - unresolved refs and pseudo-gap mechanisms are rejected before persistence;
  - speculative drafts route to supplemental or human review based on remaining round budget;
  - admission refuses failed minimum validation reports;
  - adapter records `candidate_draft_admission_report` after ranked batch artifact;
  - adapter blocks admission failures while preserving admission artifact evidence.

## 2026-05-19 D-25 `admission_gates` Quality Review Fixes
- Update: reviewed the admission implementation and fixed two quality issues plus two test gaps.
- Fixes:
  - `normalized_candidate_key` is now required by the shared `CandidateDraftAdmissionReport` TypeScript interface and JSON schema;
  - speculative drafts routed to `require_human_review` now carry a fallback source `candidate_draft` review point when no conflict/risk refs exist;
  - same-batch duplicate normalized keys are covered;
  - pseudo-gap rejection is covered independently from unresolved-ref rejection.
- Command: `cd apps/backend && node --test --loader ts-node/esm src/services/topic-selection-candidate-draft-admission-service.unit.test.ts src/services/topic-selection-ranked-candidate-draft-batch-validator-service.unit.test.ts src/services/topic-selection-generate-need-candidate-orchestrator-adapter-service.unit.test.ts src/services/topic-selection-agent-orchestrator-service.unit.test.ts src/services/topic-selection-need-discovery-context-compiler-service.unit.test.ts src/services/topic-selection-need-discovery-artifact-boundary-service.unit.test.ts`
- Result: passed; 26 tests passed.
- Command: `pnpm --filter @paper-engineering-assistant/backend typecheck`
- Result: passed.
- Command: `pnpm --filter @paper-engineering-assistant/shared typecheck`
- Result: passed.
- Command: `pnpm --filter @paper-engineering-assistant/shared test`
- Result: passed; 92 tests passed.

## 2026-05-19 D-25 `supplemental_routing` Implementation
- Update: added deterministic `SupplementalRoundRoutingDecision` generation after admission and before any optional supplemental round.
- Command: `cd apps/backend && node --test --loader ts-node/esm src/services/topic-selection-supplemental-round-routing-service.unit.test.ts src/services/topic-selection-generate-need-candidate-orchestrator-adapter-service.unit.test.ts`
- Result: passed; 12 tests passed.
- Command: `cd apps/backend && node --test --loader ts-node/esm src/services/topic-selection-supplemental-round-routing-service.unit.test.ts src/services/topic-selection-candidate-draft-admission-service.unit.test.ts src/services/topic-selection-ranked-candidate-draft-batch-validator-service.unit.test.ts src/services/topic-selection-generate-need-candidate-orchestrator-adapter-service.unit.test.ts src/services/topic-selection-agent-orchestrator-service.unit.test.ts src/services/topic-selection-need-discovery-context-compiler-service.unit.test.ts src/services/topic-selection-need-discovery-artifact-boundary-service.unit.test.ts`
- Result: passed; 33 tests passed.
- Command: `pnpm --filter @paper-engineering-assistant/backend typecheck`
- Result: passed.
- Command: `pnpm --filter @paper-engineering-assistant/shared typecheck && pnpm --filter @paper-engineering-assistant/shared test`
- Result: passed; shared typecheck passed and 92 schema tests passed.
- Initial command: `pnpm --filter @paper-engineering-assistant/backend test`
- Initial result: failed because Prisma smoke tests require `DATABASE_URL` when run without loading `.env.local`; unrelated to this slice.
- Final command: `set -a; . ./.env.local; set +a; pnpm --filter @paper-engineering-assistant/backend test`
- Final result: passed; 565 backend tests total, 564 passed, 1 skipped, 0 failed.
- Command: `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`
- Result: passed.
- Command: `git diff --check -- dev-docs/active/topic-selection-agent-workflow-review/03-implementation-notes.md dev-docs/active/topic-selection-agent-workflow-review/04-verification.md dev-docs/active/topic-selection-agent-workflow-review/09-current-state-map.md`
- Result: passed.
- Command: custom D-25 `supplemental_routing` consistency check for service presence, round-budget guard, round-3 guard, question cap, allowed roles, forbidden persistence, adapter artifact order, no persistence-command write, tests, current-state map, implementation notes, and verification entry.
- Result: passed; 14 checks passed.
- Coverage:
  - routing finalizes admitted batches;
  - routing requests scoped supplemental rounds only when round budget remains and current round is before round 3;
  - supplemental questions are capped at 5 and target explicit source draft ids;
  - exhausted budget or round 3 blocks rather than requesting another round;
  - human-review admission outcomes route to `require_human_review`;
  - duplicate/non-supplementable outcomes route to `reject_without_supplement`;
  - adapter records `supplemental_round_routing_decision` after admission;
  - adapter does not write `persist_need_candidate_batch_command` in the supplemental routing slice.

## 2026-05-19 D-25 `persistence_batch` Implementation
- Update: added admitted-only batch command construction, optional adapter persistence, and repository batch writes without adding a new authority object.
- Command: `cd apps/backend && node --test --loader ts-node/esm src/services/topic-selection-persist-need-candidate-batch-service.unit.test.ts`
- Result: passed; 5 tests passed.
- Command: `cd apps/backend && node --test --loader ts-node/esm src/services/topic-selection-persist-need-candidate-batch-service.unit.test.ts src/services/topic-selection-generate-need-candidate-orchestrator-adapter-service.unit.test.ts`
- Result: passed; 12 tests passed.
- Command: `pnpm --filter @paper-engineering-assistant/backend typecheck`
- Result: passed.
- Command: `cd apps/backend && node --test --loader ts-node/esm src/services/topic-selection-persist-need-candidate-batch-service.unit.test.ts src/services/topic-selection-supplemental-round-routing-service.unit.test.ts src/services/topic-selection-candidate-draft-admission-service.unit.test.ts src/services/topic-selection-ranked-candidate-draft-batch-validator-service.unit.test.ts src/services/topic-selection-generate-need-candidate-orchestrator-adapter-service.unit.test.ts src/services/topic-selection-agent-orchestrator-service.unit.test.ts src/services/topic-selection-need-discovery-context-compiler-service.unit.test.ts src/services/topic-selection-need-discovery-artifact-boundary-service.unit.test.ts`
- Result: passed; 39 tests passed.
- Command: `set -a; . ./.env.local; set +a; pnpm --filter @paper-engineering-assistant/backend test`
- Result: passed; 571 backend tests total, 570 passed, 1 skipped, 0 failed.
- Command: `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`
- Result: passed.
- Command: `git diff --check -- apps/backend/src/repositories/topic-selection-need-validation.repository.ts apps/backend/src/repositories/in-memory-topic-selection-need-validation-repository.ts apps/backend/src/repositories/prisma/prisma-topic-selection-need-validation-repository.ts apps/backend/src/services/topic-selection-persist-need-candidate-batch-service.ts apps/backend/src/services/topic-selection-persist-need-candidate-batch-service.unit.test.ts apps/backend/src/services/topic-selection-generate-need-candidate-orchestrator-adapter-service.ts apps/backend/src/services/topic-selection-generate-need-candidate-orchestrator-adapter-service.unit.test.ts dev-docs/active/topic-selection-agent-workflow-review/03-implementation-notes.md dev-docs/active/topic-selection-agent-workflow-review/04-verification.md dev-docs/active/topic-selection-agent-workflow-review/09-current-state-map.md`
- Result: passed.
- Command: custom D-25 `persistence_batch` consistency check for admitted-only command construction, zero-admitted guard, duplicate normalized guard, deterministic ids, projection ref, repo batch method, memory preflight, Prisma transaction, optional adapter persistence flag, command artifact write, tests, no `NeedCandidateSet`, no new candidate hash columns, docs, current-state map, and full backend verification entry.
- Result: passed; 18 checks passed.
- Coverage:
  - command builder includes admitted drafts only and stable idempotency keys;
  - zero-admitted commands fail before writes;
  - duplicate normalized candidate keys fail before writes;
  - in-memory batch create is all-or-none for duplicate batch versions;
  - adapter default path remains artifact-only;
  - adapter explicit persistence path records `persist_need_candidate_batch_command`;
  - explicit persistence path writes NeedCandidate refs and replays idempotently without duplicates;
  - supplemental routing paths still do not write persistence commands.
- Residual storage note:
  - no Prisma schema migration was added in this slice;
  - explicit `candidate_hash`, `normalized_candidate_key`, and batch idempotency columns remain a future DB-hardening option if exact D-23 storage is required.

## 2026-05-19 D-25 `workflow_harness_scenarios` Implementation
- Update: added `TopicSelectionWorkflowHarnessService` and mocked generate-need-candidate harness scenarios.
- Command: `cd apps/backend && node --test --loader ts-node/esm src/services/topic-selection-workflow-harness-service.unit.test.ts`
- Result: passed; 7 tests passed.
- Command: `cd apps/backend && node --test --loader ts-node/esm src/services/topic-selection-workflow-harness-service.unit.test.ts src/services/topic-selection-generate-need-candidate-orchestrator-adapter-service.unit.test.ts src/services/topic-selection-persist-need-candidate-batch-service.unit.test.ts src/services/topic-selection-supplemental-round-routing-service.unit.test.ts src/services/topic-selection-candidate-draft-admission-service.unit.test.ts src/services/topic-selection-ranked-candidate-draft-batch-validator-service.unit.test.ts`
- Result: passed; 35 tests passed.
- Command: `pnpm --filter @paper-engineering-assistant/backend typecheck`
- Result: passed.
- Coverage:
  - harness compiles context packets and passes only context refs into the node input;
  - mocked finalize path persists admitted NeedCandidates only through the adapter/persistence service boundary;
  - supplemental routing path records routing output and keeps authority persistence absent;
  - negative admission blocker path records blockers and keeps NeedCandidate rows absent;
  - duplicate candidates become merge hints and do not write new NeedCandidate rows;
  - malformed structured output blocks before ranked/minimum/admission/routing artifacts;
  - mocked, codex-assisted, and provider-backed runs share the same harness/adapter result shape;
  - persistence conflicts reject without creating a partial duplicate batch;
  - harness records `discovery_audit` trace artifacts with context refs, adapter artifacts, authority refs, warnings, blockers, and assertion results;
  - provider/codex execution is not reimplemented by the harness and remains behind `AgentOrchestrator`.
- Remaining after this slice:
  - supplemental worker execution is still not implemented;
  - multi-agent debate loop was not implemented in the D-25 harness slice; the initial need-discovery debate runtime is recorded in the 2026-05-20 update below;
  - route/CLI wrappers have not yet been migrated to call the harness;
  - provider-quality and Codex-assisted real acceptance scenarios remain staged beyond the current shape-stability harness case.

## 2026-05-20 Need-Discovery Debate Runtime Consumption
- Update: consumed the T-088 initial multi-agent debate loop implementation for the T-089 `generate-need-candidate` workflow policy.
- Command: `cd apps/backend && node --test --loader ts-node/esm src/services/topic-selection-need-discovery-debate-loop-service.unit.test.ts`
- Result: passed; 4 tests passed.
- Command: `cd apps/backend && node --test --loader ts-node/esm src/services/topic-selection-workflow-harness-service.unit.test.ts src/services/topic-selection-need-discovery-debate-loop-service.unit.test.ts`
- Result: passed; 12 tests passed.
- Command: `cd apps/backend && node --test --loader ts-node/esm src/services/topic-selection-need-discovery-debate-loop-service.unit.test.ts src/services/topic-selection-workflow-harness-service.unit.test.ts src/services/topic-selection-generate-need-candidate-orchestrator-adapter-service.unit.test.ts src/services/topic-selection-agent-orchestrator-service.unit.test.ts src/services/topic-selection-model-profile-registry-service.unit.test.ts src/services/topic-selection-need-discovery-artifact-boundary-service.unit.test.ts src/services/topic-selection-need-discovery-context-compiler-service.unit.test.ts`
- Result: passed; 36 tests passed.
- Command: `cd packages/shared && node --test --loader ts-node/esm src/research-lifecycle/title-card-management-contracts.schema.test.ts`
- Result: passed; 48 tests passed.
- Command: `pnpm --filter @paper-engineering-assistant/backend typecheck`
- Result: passed.
- Command: `pnpm --filter @paper-engineering-assistant/shared typecheck`
- Result: passed.
- Command: `pnpm --filter @paper-engineering-assistant/shared test`
- Result: passed; 100 tests passed.
- Command: `set -a; source .env.local; set +a; pnpm --filter @paper-engineering-assistant/backend test`
- Result: passed; 589 tests total, 588 passed, 1 skipped.
- Command: `git diff --check -- apps/backend/src/services/topic-selection-need-discovery-debate-loop-service.ts apps/backend/src/services/topic-selection-need-discovery-debate-loop-service.unit.test.ts apps/backend/src/services/topic-selection-workflow-harness-service.ts apps/backend/src/services/topic-selection-workflow-harness-service.unit.test.ts apps/backend/src/services/topic-selection-generate-need-candidate-orchestrator-adapter-service.ts apps/backend/src/services/topic-selection-agent-orchestrator-service.ts apps/backend/src/services/topic-selection-model-profile-registry-service.ts apps/backend/src/services/topic-selection-need-discovery-artifact-boundary-service.ts packages/shared/src/research-lifecycle/topic-selection-need-validation-contracts.ts packages/shared/src/research-lifecycle/title-card-management-contracts.schema.test.ts dev-docs/active/topic-selection-workflow-runtime-foundation/03-implementation-notes.md dev-docs/active/topic-selection-workflow-runtime-foundation/04-verification.md dev-docs/active/topic-selection-agent-workflow-review/03-implementation-notes.md dev-docs/active/topic-selection-agent-workflow-review/04-verification.md`
- Result: passed.
- Coverage:
  - mocked `multi_agent_debate` scenario invokes explorer, deep critic, arbiter issue framing, and arbiter final synthesis;
  - multiple explorer instances are supported as same-role instances, not as provider lists;
  - role outputs are artifact/audit inputs only and do not write `NeedCandidate`;
  - arbiter final synthesis is the only structured output consumed by downstream D-20/D-21/D-22 gates;
  - blocked arbiter issue framing remains auditable as a role invocation without creating issue-frame or final-synthesis artifacts;
  - WorkflowHarness trace includes debate artifacts while keeping authority refs empty when persistence is disabled;
  - unsupported debate roles are rejected by shared schema validation;
  - missing mandatory role packets block the runtime instead of silently degrading the debate.
- Remaining after this update:
  - route/CLI wrappers have not yet been migrated to call the harness;
  - provider/Codex debate role execution has not yet produced real-flow acceptance evidence;
  - supplemental repair loop automation remains pending.

## 2026-05-20 v1a Debate Scenario Contract SSOT
- Update: added the executable shared v1a generate-need-candidate debate scenario contract and wired the debate loop to consume it.
- Initial command: `pnpm --filter @paper-engineering-assistant/shared test -- topic-selection-debate-scenario-contracts.schema.test.ts`
- Result: failed due incorrect pnpm script argument forwarding; the runner looked for `packages/shared/topic-selection-debate-scenario-contracts.schema.test.ts`.
- Corrected command: `cd packages/shared && node --test --loader ts-node/esm src/research-lifecycle/topic-selection-debate-scenario-contracts.schema.test.ts`
- Result: passed; 2 tests passed.
- Command: `cd apps/backend && node --test --loader ts-node/esm src/services/topic-selection-need-discovery-debate-loop-service.unit.test.ts src/services/topic-selection-model-profile-registry-service.unit.test.ts`
- Result: passed; 10 tests passed.
- Command: `pnpm --filter @paper-engineering-assistant/shared typecheck`
- Result: passed.
- Initial command: `pnpm --filter @paper-engineering-assistant/shared test`
- Result: failed because the barrel re-export exact-surface test had not yet included the new debate scenario contract module.
- Corrected command: `pnpm --filter @paper-engineering-assistant/shared test`
- Result: passed; 103 tests passed.
- Command: `pnpm --filter @paper-engineering-assistant/backend typecheck`
- Result: passed.
- Command: `cd apps/backend && node --test --loader ts-node/esm src/services/topic-selection-need-discovery-debate-loop-service.unit.test.ts src/services/topic-selection-workflow-harness-service.unit.test.ts src/services/topic-selection-generate-need-candidate-orchestrator-adapter-service.unit.test.ts`
- Result: passed; 22 tests passed.
- Command: `set -a; source .env.local; set +a; pnpm --filter @paper-engineering-assistant/backend test`
- Result: passed; 592 backend tests total, 591 passed, 1 skipped, 0 failed.
- Command: `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`
- Result: passed.
- Command: `git diff --check -- packages/shared/src/research-lifecycle/topic-selection-debate-scenario-contracts.ts packages/shared/src/research-lifecycle/topic-selection-debate-scenario-contracts.schema.test.ts packages/shared/src/research-lifecycle/index.ts packages/shared/package.json packages/shared/src/research-lifecycle/title-card-management-contracts.schema.test.ts apps/backend/src/services/topic-selection-need-discovery-debate-loop-service.ts apps/backend/src/services/topic-selection-need-discovery-debate-loop-service.unit.test.ts apps/backend/src/services/topic-selection-generate-need-candidate-orchestrator-adapter-service.ts apps/backend/src/services/topic-selection-workflow-harness-service.ts dev-docs/active/topic-selection-agent-workflow-review/11-debate-model-invocation-policy.md dev-docs/active/topic-selection-agent-workflow-review/12-v1a-generate-need-candidate-debate-contract.md dev-docs/active/topic-selection-agent-workflow-review/03-implementation-notes.md dev-docs/active/topic-selection-agent-workflow-review/04-verification.md dev-docs/active/topic-selection-workflow-runtime-foundation/03-implementation-notes.md dev-docs/active/topic-selection-workflow-runtime-foundation/04-verification.md`
- Result: passed.
- Coverage:
  - shared schema accepts the concrete v1a need-discovery debate contract;
  - shared schema rejects automatic fallback and provider-specific parameter drift inside the scenario contract;
  - research-lifecycle barrel exports the new debate scenario contract;
  - debate loop consumes contract defaults for provider execution and makes two explorer calls, one deep critic call, one arbiter issue-frame call, and one final-synthesis call;
  - slot-level Codex substitution can run a worker slot while final synthesis remains provider-backed;
  - final synthesis rejects `codex_assisted` slot override with `INVALID_PAYLOAD`;
  - provider calls resolve to OpenAI `gpt-5.4-mini` through the model profile registry with medium normalized params and no provider overrides;
  - DMP-04 is aligned with runtime strictness: `arbiter.final_synthesis` is Codex-forbidden in the v1 executable contract.

## 2026-05-20 Codex Boundary And Product Real E2E Check
- Codex substitution boundary remains slot-level, explicit, and non-provider:
  - allowed in the current executable v1a debate contract for `explorer.round_1_discovery`, `deep_critic.round_1_discovery`, and `arbiter.issue_framing`;
  - forbidden for `arbiter.final_synthesis`, provider-quality evidence runs, provider failure fallback, and any direct authority write;
  - final synthesis must remain `provider_llm` in real execution or `mocked_llm` in isolated tests.
- Successful product E2E used OpenAI provider mode with an existing provider-generated resource sample set:
  - run id `real-e2e-1779248422005-c0dfd5`;
  - artifact dir `.ai/.tmp/topic-selection-real-e2e/real-e2e-1779248422005-c0dfd5`;
  - provider/model `openai/gpt-5.4-mini`;
  - sample set `resource_sample_set_eaf6437e-a88c-43ef-8e65-2216ffd2272e`.
- The product E2E validates the existing v1a/v1b/v1c flow, not the new debate harness route/CLI wrapper; provider/Codex mixed debate real-flow evidence remains a separate pending acceptance target.

## 2026-05-20 v1a Flow Convergence: Build Evidence Map
- Update: converged `topic-selection.v1a.build-evidence-map.v1` node policy from stub to implementation-ready documentation.
- Evidence reviewed:
  - `TopicSelectionEvidenceMapService.createEvidenceMapFromSearchRun`;
  - `POST /topic-selection/v1a/evidence-maps` route schema;
  - shared `TopicSelectionEvidenceMapRecord`, `TopicSelectionEvidenceUnitRecord`, and `TopicSelectionNeedValidationEvidenceBundle` contracts;
  - existing decision-chain acceptance coverage for evidence map and need-validation bundle creation.
- Verification focus:
  - deterministic-only node semantics;
  - SearchRun/SearchPlan/LiteratureResourcePoolSnapshot lineage consistency;
  - allowed evidence refs and locator validation;
  - `llm_inference` source authority rejection;
  - control-plane input snapshot, workflow run, gate, transition, lineage, and trace artifact boundary.

## 2026-05-20 v1a Flow Convergence: Generate Need Candidate
- Update: converged `topic-selection.v1a.generate-need-candidate.v1` node policy from draft to implementation-ready documentation.
- Evidence reviewed:
  - executable v1a debate scenario contract;
  - `TopicSelectionGenerateNeedCandidateOrchestratorAdapterService`;
  - `TopicSelectionWorkflowHarnessService`;
  - `TopicSelectionNeedDiscoveryDebateLoopService`;
  - ranked draft validation, candidate draft admission, supplemental routing, and batch persistence services;
  - shared `GenerateNeedCandidateNodeInput`, `GenerateNeedCandidateNodeResult`, `RankedCandidateDraftBatch`, `CandidateDraftAdmissionReport`, `SupplementalRoundRoutingDecision`, and `PersistNeedCandidateBatchCommand` contracts.
- Verification focus:
  - the runtime service chain is explicit and does not rely on a future unnamed batch wrapper;
  - the compatibility `POST /topic-selection/v1a/need-candidates` route is documented as legacy/manual single-candidate creation, not WorkflowHarness/debate provenance;
  - model/provider/profile escalation remains owned by DMP-05, `TopicSelectionModelProfileRegistryService`, and `TopicSelectionAgentOrchestratorService`;
  - `NeedCandidateSet`, `ValidatedNeed`, and `TopicQuestionContract` remain forbidden authority outputs for this node.

## 2026-05-20 v1a Flow Convergence: Validate Need Adjudication
- Update: converged `topic-selection.v1a.validate-need-adjudication.v1` node policy to `implementation_ready` after backend split.
- Evidence reviewed:
  - `TopicSelectionNeedValidationService.createReadinessAssessment`;
  - `TopicSelectionNeedValidationService.createValidationDecisionSupportPacket`;
  - `TopicSelectionNeedValidationService.adjudicateNeed`;
  - `POST /topic-selection/v1a/need-candidates/:needCandidateId/readiness-assessments`;
  - `POST /topic-selection/v1a/validation-support-packets`;
  - `POST /topic-selection/v1a/need-candidates/:needCandidateId/adjudications`;
  - shared readiness, support packet, adjudication result, validated need, memory suggestion, and v1b bundle contracts.
- Verification focus:
  - need adjudication remains non-debate.
  - `adjudicateNeed(final_decision=validate)` produces only `TopicSelectionValidateNeedAdjudicationResultRecord` plus typed side-effect refs.
  - `adjudicateNeed` does not create `HumanConfirmedDecision`, `ValidatedNeed`, or `V1bInputBundle`.
  - human confirmation and v1b bundle publication are separate routes and service calls.

## 2026-05-20 v1a Flow Convergence: Human Confirm And V1b Bundle
- Update: converged `topic-selection.v1a.human-confirm-need.v1` and `topic-selection.v1a.publish-v1b-input-bundle.v1` node policies to `implementation_ready`.
- Evidence reviewed:
  - `TopicSelectionNeedValidationService.adjudicateNeed`;
  - `TopicSelectionNeedValidationService.confirmValidatedNeed`;
  - `TopicSelectionNeedValidationService.publishV1bInputBundle`;
  - `TopicSelectionNeedValidationService.buildValidatedNeed`;
  - `TopicSelectionNeedValidationService.buildV1bInputBundle`;
  - `POST /topic-selection/v1a/need-candidates/:needCandidateId/adjudications`;
  - `POST /topic-selection/v1a/adjudications/:adjudicationResultId/human-confirmations`;
  - `POST /topic-selection/v1a/v1b-input-bundles`;
  - shared `TopicSelectionValidatedNeedRecord` and `TopicSelectionV1aToV1bInputBundleRecord` contracts.
- Verification focus:
  - human confirmation must remain human-review only and must not be inferred from model output.
  - v1b bundle publication must remain deterministic and ref-based.
  - duplicate human confirmation is rejected before creating a second `ValidatedNeed`.
  - pending adjudication blocks a second adjudication before human confirmation to prevent multiple output `ValidatedNeed` ids for the same candidate.
  - repeated v1b bundle publication is idempotent for the same `ValidatedNeed`/version.
- Commands run:
  - `pnpm --filter @paper-engineering-assistant/backend typecheck`
  - `node --test --loader ts-node/esm src/services/topic-selection-need-validation-service.unit.test.ts`
  - `node --test --loader ts-node/esm src/routes/topic-selection-v1a-routes.integration.test.ts`
  - `node --test --loader ts-node/esm src/routes/topic-selection-decision-chain-acceptance.test.ts`
  - `node --env-file=../../.env.local --test --loader ts-node/esm src/routes/topic-selection-v1b-routes.integration.test.ts`
  - `RUN_TOPIC_SELECTION_V1A_PRISMA_E2E=1 node --env-file=../../.env.local --test --loader ts-node/esm src/services/topic-selection-v1a-prisma.e2e.test.ts`
- Result:
  - typecheck passed.
  - focused unit, v1a route, and decision-chain acceptance tests passed.
  - v1b route integration passed with `.env.local`, including Prisma HTTP smoke.
  - v1a Prisma E2E service smoke passed with `.env.local`, covering the split adjudication -> human confirmation -> v1b bundle persistence path.
