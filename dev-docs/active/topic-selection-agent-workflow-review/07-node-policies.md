# 07 Node Policies

## Purpose
This file is the per-node semantic contract for T-089. The workflow matrix gives a compact routing summary; this file defines the detailed policy that implementation and harness scenarios must consume.

Stub policies are not implementation-ready. They reserve all D-13 fields so missing semantics are visible before runtime work starts.

## Required Fields
- `node_id`
- `authority_object`
- `preconditions`
- `blocking_conditions`
- `deterministic_validators`
- `allowed_execution_modes`
- `default_execution_mode`
- `debate_trigger_policy`
- `profile_escalation_policy_ref`
- `input_contract_refs`
- `output_contract_refs`
- `authority_write_boundary`
- `audit_artifact_policy`
- `failure_semantics`

## Common Policy Vocabulary
- `policy_status=stub`: required fields are reserved, but the node is not implementation-ready.
- `policy_status=draft`: all required fields have concrete draft values, but they still need review against contracts, services, and scenarios.
- `policy_status=implementation_ready`: all D-13 fields are concrete, scenario assertions can cite the policy, and no `TBD-node-policy-detail` remains.
- `policy_status=implemented`: implementation and verification have landed against the policy.
- `TBD-node-policy-detail`: visible placeholder allowed only during T-089 design alignment.
- `not_allowed`: the capability is explicitly disabled for the node.
- `not_applicable`: the field is irrelevant because the node does not use that mechanism.
- `none`: no model-like execution occurs and `AgentOrchestrator` is not invoked.
- `blocked`: the node stops before authority writes and records blocking reasons, trace, and audit/artifact refs where applicable.
- `require_human_review`: the node cannot finalize authority output until a human decision record exists.
- `fixture_human_decision`: test or acceptance input that simulates a human decision. It must be provenance-labeled and must not be mistaken for real human judgment.
- `allowed_execution_modes`: the only execution modes the node policy permits. `mocked_llm` is still test/acceptance-only.
- `authority_write_boundary`: the domain service/repository boundary that may persist authority objects after validation passes.
- `profile_escalation_policy_ref`: a reference to the attempt-level escalation policy; deterministic and human-review nodes use `not_applicable`.
- `debate_trigger_policy`: concrete trigger rules for debate-eligible nodes; non-debate nodes use `not_allowed`.
- `failure_semantics`: how invalid input, missing preconditions, validation failure, model failure, debate unresolved, guardrail blocking, and persistence conflict are represented.

## Fill Order
Policy details must be filled in this order.

### Phase 0 - Common Vocabulary
- Keep this vocabulary section current before filling individual node policies.
- If a node needs a new shared term, add it here first.

### Phase 1 - Debate-Eligible Nodes
- `topic-selection.resource-sampling.create-sample-set.v1`
- `topic-selection.v1a.generate-need-candidate.v1`
- `topic-selection.v1b.assess-topic-value.v1`
- `topic-selection.v1c.generate-promotion-support.v1`

These nodes shape the most complex policy language. Fill debate triggers, Codex/provider/mocked boundaries, audit artifacts, failure semantics, and authority-write boundaries before any debate implementation.

### Phase 2 - Remaining Single-Agent Nodes
- `topic-selection.v1a.validate-need-adjudication.v1`
- `topic-selection.v1b.plan-research-slice.v1`
- `topic-selection.v1b.form-topic-question-contract.v1`

Fill prompt/response packet expectations, deterministic validators, allowed execution modes, profile escalation refs, and authority-write boundaries.

### Phase 3 - Deterministic, Human, And Downstream Spine
- `topic-selection.v1a.build-evidence-map.v1`
- `topic-selection.v1a.human-confirm-need.v1`
- `topic-selection.v1a.publish-v1b-input-bundle.v1`
- `topic-selection.v1b.build-intake-constraint-profile.v1`
- `topic-selection.v1b.decide-value-disposition.v1`
- `topic-selection.v1b.create-topic-package-draft.v1`
- `topic-selection.v1b.assess-package-readiness.v1`
- `topic-selection.v1b.publish-v1c-input-bundle.v1`
- `topic-selection.v1c.create-promotion-input-snapshot.v1`
- `topic-selection.v1c.run-promotion-gate.v1`
- `topic-selection.v1c.human-promotion-decision.v1`
- `topic-selection.v1c.create-paper-project-bridge.v1`
- `topic-selection.downstream.paper-project-intake.v1`
- `topic-selection.downstream.feedback-recheck.v1`

Fill currentness, immutability, human fixture separation, authority-write ownership, and absence assertions for blocked paths.

## Stub Policy Template
```yaml
policy_status: stub
node_id: TBD
authority_object: TBD
preconditions: TBD-node-policy-detail
blocking_conditions: TBD-node-policy-detail
deterministic_validators: TBD-node-policy-detail
allowed_execution_modes: TBD-node-policy-detail
default_execution_mode: TBD-node-policy-detail
debate_trigger_policy: TBD-node-policy-detail
profile_escalation_policy_ref: TBD-node-policy-detail
input_contract_refs: TBD-node-policy-detail
output_contract_refs: TBD-node-policy-detail
authority_write_boundary: TBD-node-policy-detail
audit_artifact_policy: TBD-node-policy-detail
failure_semantics: TBD-node-policy-detail
```

## Policies

### `topic-selection.resource-sampling.create-sample-set.v1`
```yaml
policy_status: draft
node_id: topic-selection.resource-sampling.create-sample-set.v1
authority_object: TopicSelectionResourceSampleSet
preconditions:
  - request payload validates against CreateTopicSelectionResourceSampleRequest.
  - topic_id is non-empty.
  - sample_size normalizes to an integer >= 1.
  - role_targets normalize to support/challenge/baseline/context totals equal to sample_size.
  - candidate pool is resolved from topic-scoped literature.
  - eligible candidates must be in_scope.
  - eligible candidates must have activationStatus active or eligible.
  - eligible candidates must have key content ready or keyContentDigest.
  - eligible candidates must have at least one source ref.
blocking_conditions:
  - malformed payload returns INVALID_PAYLOAD before sample-set creation.
  - no eligible candidates creates blocked sample set with NO_ELIGIBLE_RESOURCE_CANDIDATES.
  - classifier-wide failure creates blocked sample set with LLM_CLASSIFICATION_FAILED.
  - selected item count 0 creates blocked sample set.
  - debate unresolved or blocked creates blocked sample set when disputed candidates affect selected set identity or role target fill and no replacement exists.
  - final debate output rejected by deterministic guardrails creates blocked sample set when no replacement candidate can fill required roles.
deterministic_validators:
  - risk-heavy candidates cannot be selected as support.
  - baseline requires topic-core and benchmark/evaluation/comparison semantics.
  - topic drift becomes review or excluded.
  - selected target-role candidates must satisfy target role relevance floor.
  - broad foundation-only candidates cannot enter target roles.
  - context selection is capped by context role target.
  - fine-tuning coverage shortage emits warning rather than silently passing.
  - sample hash is derived only from policy_version, topic_id, sample_size, role_targets, seed, and selected refs/roles/ranks.
  - LLM/Codex/provider/debate output cannot bypass deterministic guardrails or role-balanced sampling.
allowed_execution_modes: [codex_assisted, provider_llm, mocked_llm]
default_execution_mode: codex_assisted
debate_trigger_policy:
  status: allowed
  default_roles:
    arbiter:
      multiplicity: exactly_1
      responsibilities:
        - frame issue from trigger condition.
        - route internal turns to explorer or deep_critic.
        - synthesize role summaries.
        - classify points as useful, speculative, rejected, unresolved, or guardrail-bound.
        - emit final structured debate output.
      direct_authority_write: false
    explorer:
      multiplicity: 1..N
      responsibilities:
        - expand possible value, use, role, baseline, context, and method-family interpretations.
        - respond to arbiter follow-up questions.
    deep_critic:
      multiplicity: 1..N
      responsibilities:
        - dig into risks, counterpoints, attack/failure modes, unverifiability, and topic drift.
        - respond to arbiter follow-up questions.
  non_default_roles:
    grounding_auditor: not_allowed_by_default
    evidence_auditor: requires_explicit_policy_update
  trigger_conditions:
    - support/challenge polarity conflict that may affect selected target role.
    - risk-heavy candidate is proposed as support by model-like output.
    - benchmark-first candidate conflicts between baseline and challenge.
    - role target is underfilled and review candidates contain plausible replacement evidence.
    - candidate classification can affect sample hash or selected set identity.
  non_triggers:
    - CONTEXT_CAP_APPLIED alone.
    - FINE_TUNING_UNDERCOVERED alone.
    - no eligible candidates.
    - deterministic source/key-content/scope exclusions.
    - clear topic drift that guardrails can route to review or excluded.
  internal_loop:
    shape: arbiter_led_iterative_loop
    max_rounds_default: 2
    max_rounds_maximum: 3
    max_role_agent_failures: 1
    max_total_model_failures: 2
    final_status_values: [finalize, blocked, require_human_review]
    continue_allowed_only_as_internal_turn_decision: true
    same_role_agents_merge_before_arbiter: true
  success_exit:
    - trigger issue addressed.
    - explorer expanded at least once.
    - deep_critic pressure-tested at least once.
    - arbiter output includes recommended classification impact, useful evidence points, rejected speculative points, unresolved points, guardrail hints, and confidence.
    - final output passes schema validation and deterministic guardrails.
  failure_exit:
    - max rounds exhausted without verifiable recommendation.
    - required role output malformed after retry or replacement.
    - arbiter output malformed after retry.
    - necessary evidence/source missing.
    - unresolved conflict affects selected set identity or role target fill.
    - high risk found without safe downgrade path.
    - deterministic guardrails reject final recommendation and no replacement candidate can fill required role.
  human_review_exit:
    - useful evidence exists but risk interpretation is insufficient.
    - explorer and deep_critic have strong incompatible judgments.
    - candidate materially affects selected set identity and source semantics need human judgment.
    - scope boundary issue may alter topic definition.
  no_automatic_reentry:
    - terminal debate output is final for the node attempt.
    - rerun requires explicit new workflow/node attempt with changed input hash, policy version, execution mode, human instruction, bugfix/regression purpose, or scenario-controlled new run.
profile_escalation_policy_ref: topic-selection.resource-sampling-classification.profile-escalation.v1
input_contract_refs:
  - CreateTopicSelectionResourceSampleRequest
  - TopicSelectionResourceSamplingLlmOutput
  - TopicSelectionResourceCandidateClassificationDraft
  - TopicSelectionResourceRoleTargets
output_contract_refs:
  - TopicSelectionResourceSampleResult
  - TopicSelectionResourceSampleSetRecord
  - TopicSelectionResourceSampleItemRecord
  - TopicSelectionResourceSamplingAuditRecord
authority_write_boundary:
  domain_service: TopicSelectionResourceSamplingService.createResourceSampleSet
  repository: TopicSelectionResourceSamplingRepository.createResourceSampleSet
  authority_objects:
    - TopicSelectionResourceSampleSet
    - TopicSelectionResourceSampleItem
    - TopicSelectionResourceSamplingAudit
  agent_orchestrator_direct_write: false
  debate_executor_direct_write: false
audit_artifact_policy:
  must_record:
    - candidate_count
    - eligible_count
    - selected_count
    - excluded_count
    - warning_codes
    - guardrail_summary
    - prompt_template_id
    - prompt_template_version
    - model/profile refs
    - execution provenance
    - classifier structured output artifact ref
    - sample_hash
  debate_when_present:
    - issue framing
    - role agent provenance
    - role-level summaries
    - arbiter final output
    - terminal status and reason codes
  must_not_record:
    - hidden reasoning
    - provider secrets
    - unredacted raw logs outside artifact policy
failure_semantics:
  invalid_payload: return INVALID_PAYLOAD before authority creation.
  no_eligible_candidates: persist blocked sample set and audit.
  llm_failure: persist blocked sample set with LLM_CLASSIFICATION_FAILED; no keyword fallback.
  debate_blocked: route affected candidates to review/excluded; blocked if sample cannot be filled.
  debate_require_human_review: route affected candidates to review; ready_with_warning only if selected set remains usable without them.
  guardrail_rejection: apply review/excluded/downgrade outcome before role-balanced selection.
  role_underfilled: ready_with_warning when usable selected items remain; blocked if selected item count is 0.
  persistence_conflict: fail node attempt with conflict and preserve trace/audit refs where created.
```

### `topic-selection.v1a.build-evidence-map.v1`
```yaml
policy_status: implementation_ready
node_id: topic-selection.v1a.build-evidence-map.v1
authority_object: TopicSelectionEvidenceMap
preconditions:
  - request payload validates against POST /topic-selection/v1a/evidence-maps schema.
  - title_card_id is non-empty and matches the resolved SearchRun.
  - search_run_id resolves to a SearchRun with run_status succeeded or partial.
  - SearchRun resolves to its SearchPlan through search_run.search_plan_ref.
  - SearchRun resolves to its LiteratureResourcePoolSnapshot through search_run.literature_snapshot_ref.
  - SearchPlan literature_snapshot_ref matches the resolved LiteratureResourcePoolSnapshot.
  - evidence_units contains at least one claim-level unit.
  - each EvidenceUnit has evidence_role support, challenge, baseline, or context.
  - each EvidenceUnit has a non-empty source_statement.
  - each EvidenceUnit has a locator with source_ref and matching literature_ref.
  - each EvidenceUnit literature_ref, source_refs, locator.source_ref, and locator content refs are contained in SearchRun evidence_map_input_refs or the SearchRun coverage evidence bindings.
  - each coverage_row_intent_id, when present, resolves under the SearchPlan coverage rows.
  - each non-abstract locator resolves against available literature source/fulltext records.
  - typed_links, clusters, patterns, and conflict_sets refer only to client_unit_key values in the same request.
blocking_conditions:
  - malformed payload returns INVALID_PAYLOAD before service execution.
  - evidence_units empty blocks with GATE_CONSTRAINT_FAILED before authority creation.
  - SearchRun not found returns NOT_FOUND.
  - SearchRun title_card_id mismatch blocks with VERSION_CONFLICT.
  - SearchRun run_status other than succeeded or partial blocks with GATE_CONSTRAINT_FAILED.
  - SearchPlan not found returns NOT_FOUND.
  - LiteratureResourcePoolSnapshot not found returns NOT_FOUND.
  - SearchRun/SearchPlan/LiteratureResourcePoolSnapshot lineage mismatch blocks with VERSION_CONFLICT.
  - EvidenceUnit source_attribution_kind=llm_inference blocks with GATE_CONSTRAINT_FAILED because LLM inference cannot be source-claim authority.
  - EvidenceUnit source_statement empty returns INVALID_PAYLOAD.
  - EvidenceUnit missing locator or locator.source_ref returns INVALID_PAYLOAD.
  - EvidenceUnit coverage_row_intent_id outside SearchPlan coverage rows blocks with VERSION_CONFLICT.
  - EvidenceUnit literature/source/locator refs outside SearchRun EvidenceMap input refs or coverage bindings block with GATE_CONSTRAINT_FAILED.
  - EvidenceUnit locator literature_ref mismatch blocks with VERSION_CONFLICT.
  - EvidenceUnit literature or source refs not found return NOT_FOUND.
  - section/paragraph/anchor locator without resolvable fulltext refs blocks with GATE_CONSTRAINT_FAILED or NOT_FOUND.
  - typed_link, cluster, pattern, or conflict_set references an unknown client_unit_key blocks before authority creation.
  - deterministic gate topic-selection.evidence-map-ready fails blocks before repository persistence.
  - transition search-run-to-evidence-map fails blocks before repository persistence.
deterministic_validators:
  - build-evidence-map is deterministic and MUST NOT call AgentOrchestrator, BackendLlmGateway, Codex, or debate runtime.
  - source_attribution_kind may be source_claim, counter_evidence, or human_judgment; llm_inference MUST NOT become EvidenceUnit source authority.
  - EvidenceUnit authority fields must be copied from request payload and validated refs; the service MUST NOT invent source refs.
  - all authority EvidenceUnit refs must trace to SearchRun evidence_map_input_refs or SearchRun coverage evidence bindings.
  - each EvidenceUnit locator must match its literature_ref.
  - non-abstract locators must resolve to literature fulltext structures before persistence.
  - abstract-only support is allowed but MUST receive ABSTRACT_ONLY_SUPPORT issue code for downstream strength/readiness gates.
  - role counts must be derived from persisted EvidenceUnits only.
  - context units may be persisted as context but MUST NOT by themselves satisfy downstream need-candidate evidence sufficiency.
  - conflict sets, typed links, clusters, and patterns are structural evidence-map artifacts; they cannot introduce refs outside the request's EvidenceUnits.
  - input snapshot source_refs must include SearchRun, SearchPlan, LiteratureResourcePoolSnapshot, EvidenceUnit literature refs, and EvidenceUnit source refs.
  - workflow run key must remain topic-selection.evidence-map-build with deterministic-contract profile.
  - readiness gate key must remain topic-selection.evidence-map-ready.
  - transition key must remain search-run-to-evidence-map.
  - successful persistence writes EvidenceMap and child EvidenceUnit/link/cluster/pattern/conflict records through TopicSelectionEvidenceMapRepository.createEvidenceMapWithRecords.
  - getNeedValidationEvidenceBundle is a read projection over the EvidenceMap and MUST NOT create new authority records.
allowed_execution_modes: [none]
default_execution_mode: none
debate_trigger_policy: not_allowed
profile_escalation_policy_ref: not_applicable
input_contract_refs:
  - CreateEvidenceMapFromSearchRunInput
  - TopicSelectionSearchRunRecord
  - TopicSelectionSearchPlanRecord
  - TopicSelectionLiteratureResourcePoolSnapshotRecord
  - TopicSelectionCoverageRowIntentRecord
  - TopicSelectionCoverageEvidenceBindingRecord
  - TopicSelectionEvidenceUnitRecord input shape
  - TopicSelectionEvidenceSourceLocator
output_contract_refs:
  - TopicSelectionEvidenceMapRecord
  - TopicSelectionEvidenceUnitRecord
  - TopicSelectionEvidenceTypedLinkRecord
  - TopicSelectionEvidenceClusterRecord
  - TopicSelectionEvidencePatternRecord
  - TopicSelectionEvidenceConflictSetRecord
  - TopicSelectionNeedValidationEvidenceBundle read projection
authority_write_boundary:
  route: POST /topic-selection/v1a/evidence-maps
  controller: TopicSelectionV1aController.createEvidenceMapFromSearchRun
  domain_service: TopicSelectionEvidenceMapService.createEvidenceMapFromSearchRun
  repository: TopicSelectionEvidenceMapRepository.createEvidenceMapWithRecords
  authority_objects:
    - TopicSelectionEvidenceMap
    - TopicSelectionEvidenceUnit
    - TopicSelectionEvidenceTypedLink
    - TopicSelectionEvidenceCluster
    - TopicSelectionEvidencePattern
    - TopicSelectionEvidenceConflictSet
  agent_orchestrator_direct_write: false
  debate_executor_direct_write: false
audit_artifact_policy:
  must_record:
    - control-plane input snapshot with source refs and digest_payload.
    - workflow run artifact with evidence_unit_count, typed_link_count, cluster_count, pattern_count, and conflict_set_count.
    - readiness gate result for topic-selection.evidence-map-ready.
    - transition attempt for search-run-to-evidence-map.
    - lineage link from SearchRun to EvidenceMap.
    - trace snapshot with role_counts and abstract_only_support_count.
    - EvidenceMap artifact_refs returned by the control plane.
  must_not_record:
    - hidden reasoning.
    - provider secrets.
    - raw provider logs.
    - raw debate transcripts.
    - LLM-generated claims as source-claim authority.
failure_semantics:
  invalid_payload: return INVALID_PAYLOAD before authority creation.
  missing_upstream_ref: return NOT_FOUND for missing SearchRun, SearchPlan, LiteratureResourcePoolSnapshot, Literature, Source, or fulltext locator records.
  lineage_conflict: return VERSION_CONFLICT when SearchRun, SearchPlan, LiteratureResourcePoolSnapshot, title card, coverage row, or locator lineage is inconsistent.
  gate_blocked: return GATE_CONSTRAINT_FAILED before repository persistence.
  llm_inference_source_claim: return GATE_CONSTRAINT_FAILED and do not downgrade to source_claim.
  role_or_locator_issue: block before persistence unless the issue is abstract-only support, which is persisted with ABSTRACT_ONLY_SUPPORT issue code for downstream gates.
  transition_failed: block before repository persistence and preserve control-plane gate/transition diagnostics.
  repository_failure: fail the node attempt without partial child-record authority semantics.
```

### `topic-selection.v1a.generate-need-candidate.v1`
```yaml
policy_status: implementation_ready
node_id: topic-selection.v1a.generate-need-candidate.v1
authority_object: NeedCandidate
preconditions:
  - TopicSelectionEvidenceMap exists for the current topic scope.
  - EvidenceStrengthAssessment or equivalent evidence-strength summary is current for the evidence map.
  - Selected literature refs and source refs are resolvable from the sample set or evidence map.
  - Search/resource snapshots are versioned so candidate evidence can be traced.
  - Existing sibling NeedCandidate refs for the title card or evidence map are resolved as candidate-pool context when available.
  - Topic scope, exclusions, and inherited non-goals are present in the context packet.
  - exploration_context and arbiter_context packets compile with source refs, compiler version, input hash, summary hash, and redaction policy.
  - shared context envelope contains node_id, workflow_run_id, node_attempt_id, context_family, input_refs, input_refs_hash, context_compiler_version, policy_version, output_schema_version, profile_id, execution_mode, cache_key, cache_hit, redaction_policy, and created_at.
  - exploration_context payload contains topic_scope, evidence_signal_digest, resource_sample_digest, search_coverage_digest, sibling_candidate_digest, decision_memory_digest, exploration_prompts, challenge_prompts, allowed_outputs, and forbidden_outputs.
  - arbiter_context payload contains node_policy_ref, output_schema_ref, authority_boundary, max_persisted_candidates, deterministic_gate_checklist, role_level_summaries, candidate_pool_digest, evidence_ref_table, rejected_framing_table, unresolved_points, batch_ranking_rules, persistence_rules, and failure_rules.
blocking_conditions:
  - missing evidence map blocks with MISSING_EVIDENCE_MAP.
  - missing source refs blocks with MISSING_EVIDENCE_SOURCE_REFS.
  - missing exploration_context or arbiter_context blocks with MISSING_CONTEXT_PACKET.
  - malformed context envelope or required context payload fields block with MALFORMED_CONTEXT_PACKET.
  - stale context packet cache blocks with STALE_CONTEXT_PACKET.
  - no candidate can cite support/problem/gap evidence blocks with NO_GROUNDED_NEED_CANDIDATE.
  - every proposed candidate is only a broad topic restatement blocks with PSEUDO_GAP_ONLY.
  - ranked candidate draft batch fails minimum schema validation blocks with INVALID_RANKED_CANDIDATE_DRAFT_BATCH.
  - candidate draft admission report cannot be produced blocks with CANDIDATE_DRAFT_ADMISSION_FAILED.
  - unresolved evidence, conflict, or strength refs block or reject affected drafts before persistence with UNRESOLVED_CANDIDATE_DRAFT_REFS.
  - all candidate drafts fail admission gates and no supplemental debate round remains blocks with NO_ADMISSIBLE_NEED_CANDIDATE.
  - required model or debate output remains malformed after allowed retries blocks with MALFORMED_NEED_CANDIDATE_OUTPUT.
  - admitted_drafts is empty blocks with NO_ADMITTED_DRAFTS before persistence.
  - a persistence draft not marked admit in CandidateDraftAdmissionReport blocks with DRAFT_NOT_ADMITTED.
  - persistence command refs cannot resolve blocks with UNRESOLVED_PERSISTENCE_REFS.
  - normalized candidate key conflicts with an existing NeedCandidate blocks with DUPLICATE_NEED_CANDIDATE.
  - any candidate hash or version cannot be computed blocks with NEED_CANDIDATE_VERSION_FAILED.
  - candidate batch exceeds max_persisted_candidates blocks with TOO_MANY_NEED_CANDIDATES.
deterministic_validators:
  - D-25 implementation slice order is contracts_schema, artifact_ref_boundary, context_compiler_integration, orchestrator_adapter, draft_schema_validation, admission_gates, supplemental_routing, persistence_batch, and workflow_harness_scenarios.
  - contracts_schema must define shared DTO/schema/error-code contracts before business persistence, model calls, or WorkflowHarness E2E implementation.
  - artifact_ref_boundary must define artifact write/read refs, artifact hash, redacted snapshot shape, and FunctionalRef resolution before context compiler and orchestration integration depend on artifacts.
  - context_compiler_integration must validate exploration_context, arbiter_context, exact cache key, refs-only input, and context packets before any LLM invocation.
  - orchestrator_adapter must keep mocked_llm, codex_assisted, and provider_llm on the same node I/O schema and differentiate source only through provenance.
  - draft_schema_validation must block invalid RankedCandidateDraftBatch output before admission gates.
  - admission_gates must run as deterministic service logic before persistence and before provider/codex E2E is treated as meaningful.
  - supplemental_routing must be verified first with mocked role outputs and must preserve source draft targeting, question cap, no broad re-exploration, and round-3 terminal behavior.
  - persistence_batch must use the existing TopicSelectionNeedValidationService/repository boundary, admitted-only command inputs, idempotency, all-or-none transaction behavior, and candidate-pool projection refs/hash.
  - workflow_harness_scenarios must cover happy path, zero admitted to supplemental, duplicate to merge hint, malformed draft blocked, persistence rollback, and execution-mode shape stability.
  - deterministic unit tests must pass before model-like execution tests.
  - mocked_llm WorkflowHarness scenarios must pass before provider_llm or codex_assisted scenarios.
  - implementation must not add NeedCandidateSet, raw transcript handoff, mode-specific result shapes, D-20/D-21/D-23 bypasses, partial batch persistence, or cached response masquerading as provider_llm.
  - GenerateNeedCandidateNodeInput contains schema_version, workflow_run_id, node_attempt_id, topic_scope_ref, evidence_map_ref, evidence_strength_ref, resource_sample_set_ref, candidate_pool_projection_ref, search_snapshot_refs, resource_snapshot_refs, exploration_context_ref, arbiter_context_ref, execution_mode, profile_id, policy_version, and operator_reuse_approval_ref.
  - GenerateNeedCandidateNodeInput carries refs and context packet refs, not scattered raw DB records.
  - GenerateNeedCandidateNodeInput execution_mode is codex_assisted, provider_llm, or mocked_llm.
  - all execution modes use the same GenerateNeedCandidateNodeInput and GenerateNeedCandidateNodeResult shapes.
  - execution source differences are recorded through provenance, not result shape changes.
  - candidate_pool_projection_ref may be null only when no prior candidate pool exists for the title/topic scope.
  - operator_reuse_approval_ref is required only for local cost-saving cached response reuse under codex_assisted.
  - GenerateNeedCandidateNodeResult contains schema_version, workflow_run_id, node_attempt_id, status, terminal_result, persisted_candidate_refs, candidate_pool_projection_ref, candidate_pool_projection_hash, artifact_refs, warning_codes, and error_code.
  - GenerateNeedCandidateNodeResult status is succeeded, blocked, or require_human_review.
  - GenerateNeedCandidateNodeResult terminal_result is finalize, blocked, or require_human_review.
  - status succeeded requires terminal_result finalize, non-empty persisted_candidate_refs, candidate_pool_projection_ref, and candidate_pool_projection_hash.
  - status blocked requires terminal_result blocked and the last available failure artifact.
  - status require_human_review requires terminal_result require_human_review and human-review reason metadata.
  - persisted_candidate_refs may be empty only when status is blocked or require_human_review.
  - succeeded result requires artifact refs for ranked_candidate_draft_batch, minimum_schema_validation_report, candidate_draft_admission_report, persist_need_candidate_batch_command, and discovery_audit.
  - blocked result requires at least one failure artifact ref from schema validation report, admission report, supplemental routing decision, persist command snapshot, or discovery audit.
  - require_human_review result requires candidate_draft_admission_report or supplemental_round_routing_decisions plus human-review reason.
  - downstream handoff is limited to persisted_candidate_refs, candidate_pool_projection_ref, candidate_pool_projection_hash, discovery audit ref, warning_codes, and error_code.
  - downstream nodes must not read raw debate transcripts or hidden reasoning as business input.
  - explorer and deep_critic role calls consume exploration_context.
  - arbiter calls consume arbiter_context plus role-level summaries and deterministic gate checklist.
  - context_packet_cache hits require exact match on input refs/hash, compiler version, policy version, schema version, execution mode, profile, and context family.
  - exploration_context cache hits must not satisfy arbiter_context requests and arbiter_context cache hits must not satisfy exploration_context requests.
  - durable memory included in context appears only as constraint, warning, required challenge, duplicate/merge hint, recheck hint, risk carry-forward, or downstream challenge; it is never treated as evidence.
  - arbiter_context carries role-level summaries but does not require raw role transcripts.
  - arbiter_context carries at most 5 candidate drafts and 3..5 key evidence refs per draft unless a future policy version changes this cap.
  - exact-invocation response reuse is never treated as live provider_llm execution.
  - cached response reuse must run schema validation, per-candidate gates, audit/artifact recording, and authority-write boundary checks.
  - max_persisted_candidates is 5 unless a future policy version explicitly changes it.
  - draft-to-NeedCandidate mapping allows direct persistence only for candidate_need, unmet_need_statement, mechanism_type, mechanism_summary, mechanism_payload, scope_notes, non_goal_notes, prior_art_status, evidence_role_bundle, conflict_refs, strength_assessment_refs, gap_codes, speculative, and confidence.
  - backend/runtime derives id, workspace/title/evidence refs, candidate_version, lifecycle_status, decision_status, review_status, freshness_status, control-plane refs, artifact refs, result refs, merge refs, creator, and timestamps.
  - draft_id, rank, batch_ranking_rationale, arbiter_selection_rationale, rejected_framings, unresolved_points, recheck_suggestions, duplicate_or_merge_hint, and raw role transcripts are artifact-only unless a later explicit node policy changes their mapping.
  - model or debate output is a ranked candidate draft batch before persistence.
  - ranked candidate draft batch has schema_version, draft_batch, drafts, rejected_framings, and unresolved_points.
  - draft_batch has batch_id, terminal_result, and ranking_rationale.
  - terminal_result is finalize, blocked, or require_human_review.
  - finalize requires at least one draft.
  - blocked may have zero drafts but must include unresolved_points or rejected_framings with reason codes.
  - require_human_review requires at least one unresolved point with suggested_route human_review.
  - draft count is at most max_persisted_candidates.
  - draft ranks are unique and contiguous.
  - each draft has draft_id, rank, candidate_need, unmet_need_statement, mechanism_type, mechanism_summary, mechanism_payload, scope_notes, non_goal_notes, prior_art_status, evidence_role_refs, conflict_refs, strength_assessment_refs, gap_codes, speculative, confidence, and selection_rationale.
  - each draft cites at least one support or challenge evidence ref.
  - each rejected_framing has framing_id, summary, reason_codes, and evidence_refs.
  - each unresolved_point has point_id, summary, severity, and suggested_route.
  - assumptions, uncertainty_notes, duplicate_or_merge_hint, and recheck_suggestions are not required minimum schema fields and remain artifact-only when present.
  - CandidateDraftAdmissionReport is produced before any NeedCandidate authority write.
  - CandidateDraftAdmissionReport contains schema_version, batch_id, node_attempt_id, terminal_result, draft_results, valid_draft_count, rejected_draft_count, merge_hint_count, and blocking_reason_codes.
  - each draft admission result has draft_id, rank, decision, reason_codes, resolved_ref_counts, normalized_candidate_key, duplicate_candidate_refs, required_human_review_points, and supplemental_questions.
  - draft admission decision is one of admit, reject_artifact_only, require_human_review, return_for_supplemental_round, or merge_hint_only.
  - SupplementalRoundRoutingDecision is produced before any optional supplemental round starts.
  - SupplementalRoundRoutingDecision contains schema_version, batch_id, node_attempt_id, current_round_index, remaining_round_budget, routing_decision, source_draft_ids, trigger_reason_codes, supplemental_questions, allowed_roles, forbidden_actions, and stop_condition.
  - supplemental routing decision is one of run_supplemental_round, reject_without_supplement, block, require_human_review, or finalize_with_admitted_batch.
  - run_supplemental_round is allowed only for promising grounded drafts with supplementable reasons and remaining round budget.
  - supplementable reasons are missing or thin challenge coverage, underspecified mechanism with concrete evidence signals, unclear scope or non-goal boundary, support/challenge conflict needing targeted resolution, speculative draft needing risk bounds, or near-duplicate draft with a concrete evidence-backed distinction to test.
  - non-supplementable reasons are malformed schema or context, missing required source refs, topic drift, exclusion/non-goal violation, ungrounded draft, pseudo-gap, pure duplicate, or exhausted round budget.
  - supplemental questions target explicit source_draft_ids and are capped at 5 per supplemental round.
  - supplemental allowed roles default to explorer and deep_critic; arbiter frames questions and synthesizes returned role-level summaries.
  - supplemental workers consume exploration_context plus arbiter-scoped question deltas.
  - supplemental workers must not reopen broad exploration, introduce unrelated candidate families, mutate authority objects, or call persistence paths.
  - supplemental round output re-enters RankedCandidateDraftBatch minimum schema validation and CandidateDraftAdmissionReport gates before persistence.
  - after round 3, supplemental routing must not request another round and must resolve to finalize_with_admitted_batch, block, or require_human_review.
  - schema_gate reuses RankedCandidateDraftBatch minimum schema validation and blocks malformed batches before per-draft gates.
  - reference_integrity_gate verifies all evidence_role_refs, conflict_refs, and strength_assessment_refs resolve to input evidence, resource, or search snapshots.
  - scope_gate rejects or routes drafts whose candidate_need or unmet_need_statement drift outside topic scope, exclusions, or non-goals.
  - evidence_sufficiency_gate allows persistence only when a draft cites at least one support or challenge ref.
  - mechanism_sufficiency_gate rejects drafts that are only broad topics, interest statements, or pseudo-gaps without a researchable mechanism, method, system design, evaluation path, or technical lever.
  - novelty_duplicate_gate computes normalized_candidate_key and compares it with candidate-pool context before new authority creation.
  - duplicate drafts become merge_hint_only unless a later human/deterministic policy explicitly authorizes a new candidate.
  - risk_speculation_gate allows speculative drafts to persist only when challenge/conflict refs or explicit scope limits are present.
  - batch_gate requires admitted draft count to be 1..max_persisted_candidates before authority persistence.
  - zero admitted drafts may return_for_supplemental_round only while debate rounds remain; otherwise the node blocks or requires human review.
  - admission gates must not rewrite candidate content, invent missing refs, create ValidatedNeed, or mutate SearchPlan authority.
  - PersistNeedCandidateBatchCommand is constructed only from draft_results with decision admit.
  - PersistNeedCandidateBatchCommand contains schema_version, node_attempt_id, workflow_run_id, topic_scope_ref, evidence_map_ref, resource_sample_set_ref, ranked_candidate_draft_batch_artifact_ref, admission_report_artifact_ref, supplemental_routing_artifact_refs, admitted_drafts, and idempotency_key.
  - each admitted draft command contains draft_id, rank, candidate_need, unmet_need_statement, mechanism_type, mechanism_summary, mechanism_payload, scope_notes, non_goal_notes, prior_art_status, evidence_role_bundle, conflict_refs, strength_assessment_refs, gap_codes, speculative, confidence, normalized_candidate_key, and source_admission_decision_ref.
  - persistence command must not include raw debate output, non-admitted drafts, rejected framings, unresolved points, hidden reasoning, or artifact rationale as authority fields.
  - backend/runtime derives NeedCandidate id, candidate_version, candidate_hash, lifecycle_status, decision_status, review_status, freshness_status, workspace/title/topic/evidence authority refs, artifact refs, audit refs, creator/source metadata, and timestamps.
  - candidate_hash is computed from canonicalized admitted authority fields, key refs, and policy/schema versions.
  - candidate_hash excludes rank, rationale, role transcripts, hidden reasoning, rejected framings, unresolved points, and supplemental routing explanations.
  - initial candidate_version is 1.
  - idempotency_key is derived from workflow_run_id, node_attempt_id, admitted draft ids, and admission report hash.
  - replaying the same idempotency_key returns the same persisted candidate refs and must not insert duplicates.
  - normalized candidate key conflicts block with DUPLICATE_NEED_CANDIDATE and do not auto-merge.
  - persisted candidates link to ranked candidate draft batch artifact ref, admission report artifact ref, supplemental routing artifact refs, discovery audit ref, workflow_run_id, and node_attempt_id.
  - successful persistence returns persisted_candidate_refs, candidate_pool_projection_ref, and candidate_pool_projection_hash.
  - candidate_pool_projection is a query/sorting view over NeedCandidate rows and does not create NeedCandidateSet authority.
  - deterministic per-candidate gates run before any NeedCandidate authority write.
  - successful output creates 1..5 persisted NeedCandidate authority records through the existing need-validation service boundary.
  - each persisted candidate has candidate_need, unmet_need_statement, mechanism_type, mechanism_payload, evidence_role_bundle, gap_codes, speculative, confidence, scope_notes, and non_goal_notes according to existing TopicSelectionNeedCandidateRecord fields.
  - each persisted candidate passes support/challenge coverage, pseudo-gap, scope, non-goal, and duplicate/merge checks independently.
  - invalid candidate drafts are filtered before the authority-write transaction starts and are preserved only as rejected-framing artifacts.
  - the valid candidate batch is persisted all-or-none; partial batch persistence is not allowed.
  - persisted candidates in the same attempt share discovery audit refs and workflow/run provenance.
  - discovery artifact records explored alternatives, rejected framings, merge hints, batch ranking, and why each persisted candidate was selected.
  - all cited refs come from input evidence, search, or resource snapshots.
  - persisted candidates are not supported only by context/background refs.
  - candidate-pool projection includes the new NeedCandidate records after persistence and does not require a separate NeedCandidateSet object.
  - output may include recheck_suggestions or evidence_gaps, but must not create SearchPlan authority changes.
  - output must not create ValidatedNeed.
allowed_execution_modes: [codex_assisted, provider_llm, mocked_llm]
default_execution_mode: codex_assisted
debate_trigger_policy:
  - debate_allowed when evidence map supports multiple plausible need framings.
  - debate_allowed when first-pass need statement is broad, shallow, or topic-like.
  - debate_allowed when support evidence suggests value but challenge evidence suggests pseudo-gap or prior-art risk.
  - debate_allowed when benchmark/comparison evidence implies an evaluation need rather than a method need.
  - debate_allowed when resource samples contain competing method families, domains, or problem framings.
  - debate_allowed when high-value evidence is present but scope, non-goals, or mechanism are underspecified.
  - debate_not_allowed when required evidence map or source refs are missing.
  - debate_not_allowed when the workflow intentionally exercises the single-agent path.
  - default roles are arbiter, explorer, and deep_critic.
  - arbiter controls evidence-signal extraction, candidate framing expansion, candidate-pool comparison, candidate batch synthesis/ranking, and grounded quality check.
  - round 1 is required exploration plus critique.
  - rounds 2 and 3 are optional supplemental rounds scoped by arbiter to concrete unresolved questions.
  - maximum total rounds is 3.
  - supplemental rounds must not restart broad exploration.
  - after round 3, arbiter must emit finalize, blocked, or require_human_review.
profile_escalation_policy_ref:
  policy: DMP-05 provider fallback and profile escalation policy
  registry_service: TopicSelectionModelProfileRegistryService
  invocation_boundary: TopicSelectionAgentOrchestratorService
  semantics:
    - provider/model/model-option selection is profile-registry-owned.
    - automatic fallback to another provider, Codex, or mock is forbidden.
    - provider change requires manual rerun or explicit model_option_id override with new provenance.
    - mocked_llm is test/acceptance-only and cannot satisfy product authority decisions.
    - codex_assisted is allowed only when the node or slot permits it and remains non-provider provenance.
input_contract_refs:
  - GenerateNeedCandidateNodeInput
  - TopicSelectionEvidenceMap
  - EvidenceStrengthAssessment
  - TopicSelectionResourceSampleSet
  - TopicSelectionNeedCandidateRecord list projection
  - exploration_context packet
  - arbiter_context packet
  - Search/resource snapshot refs
output_contract_refs:
  - GenerateNeedCandidateNodeResult
  - RankedCandidateDraftBatch minimum schema
  - CandidateDraftAdmissionReport
  - SupplementalRoundRoutingDecision
  - PersistNeedCandidateBatchCommand
  - TopicSelectionNeedCandidateRecord
  - CandidatePoolProjection refs/hash
  - Candidate discovery audit/artifact refs
authority_write_boundary:
  workflow_harness: TopicSelectionWorkflowHarnessService.runGenerateNeedCandidateScenario
  adapter: TopicSelectionGenerateNeedCandidateOrchestratorAdapterService.generateRankedCandidateDraftBatch
  context_compiler: TopicSelectionNeedDiscoveryContextCompilerService
  artifact_boundary: TopicSelectionNeedDiscoveryArtifactBoundaryService
  single_agent_invocation: TopicSelectionAgentOrchestratorService.invokeStructuredOutput
  debate_runtime: TopicSelectionNeedDiscoveryDebateLoopService.runNeedDiscoveryDebate
  deterministic_gates:
    - TopicSelectionRankedCandidateDraftBatchValidatorService.validate
    - TopicSelectionCandidateDraftAdmissionService.createAdmissionReport
    - TopicSelectionSupplementalRoundRoutingService.createRoutingDecision
  batch_command_builder: TopicSelectionPersistNeedCandidateBatchService.buildCommand
  authority_persistence: TopicSelectionPersistNeedCandidateBatchService.persistBatch
  repository: TopicSelectionNeedValidationRepository.createNeedCandidatesBatch
  compatibility_route:
    route: POST /topic-selection/v1a/need-candidates
    boundary: TopicSelectionNeedValidationService.createNeedCandidateFromEvidenceMap
    semantics: legacy/manual single-candidate creation path; it MUST NOT claim WorkflowHarness, debate, or multi-candidate batch execution provenance.
  authority_objects:
    - TopicSelectionNeedCandidateRecord
  forbidden_authority_objects:
    - NeedCandidateSet
    - ValidatedNeed
    - TopicQuestionContract
  agent_orchestrator_direct_write: false
  debate_executor_direct_write: false
  partial_batch_persistence: false
audit_artifact_policy:
  - Persist candidate discovery audit summary with execution_mode, executor_kind, profile, input hash, output hash, candidate versions/hashes, and persisted candidate refs.
  - Persist exploration_context and arbiter_context packet refs/hashes, cache hit/miss status, and compression versions.
  - If response reuse occurs, record response_source=cached_exact_invocation, cache key, source workflow/node/attempt id, source execution mode, response hash, context packet hash, schema/profile/policy versions, operator approval or local setting ref, and non_provider=true.
  - Store ranked candidate draft batch, minimum schema validation report, CandidateDraftAdmissionReport, SupplementalRoundRoutingDecision, PersistNeedCandidateBatchCommand redacted snapshot, explored alternatives, rejected framings, merge hints, recheck suggestions, unresolved points, batch ranking, debate role summaries, arbiter output, draft-to-record mapping report, candidate-pool projection refs/hash, and validation report as artifacts.
  - Do not persist hidden reasoning, provider secrets, or raw provider logs.
failure_semantics:
  - invalid payload or missing preconditions returns blocked before authority write.
  - stale, missing, or hash-mismatched context packets block before model/debate invocation.
  - response cache hit in a provider-quality scenario requiring provider_llm is treated as a miss or block, not as provider execution.
  - malformed model/debate output follows D-05 retry/escalation and then blocked or require_human_review.
  - insufficient evidence returns blocked with evidence gap refs rather than inventing a candidate.
  - admission gate failures are recorded in CandidateDraftAdmissionReport before any authority write.
  - invalid candidates are dropped only when at least one valid candidate remains and the artifact records the rejection reason; otherwise the node blocks.
  - duplicate drafts return merge_hint_only and do not create new authority rows.
  - supplemental round routing failures are recorded in SupplementalRoundRoutingDecision and do not trigger broad re-exploration.
  - malformed schema/context, topic drift, ungrounded drafts, pseudo-gaps, pure duplicates, or exhausted round budget do not trigger supplemental rounds.
  - zero admitted drafts return for supplemental round only within the node round limit; after round exhaustion the node blocks or requires human review.
  - debate unresolved may return require_human_review only when grounded candidate drafts exist but batch selection or persistence requires human judgment.
  - empty admitted_drafts, non-admitted draft persistence, unresolved persistence refs, duplicate normalized keys, or hash/version failures block before authority commit.
  - persistence conflict rolls back the valid batch, records candidate versions/hashes and intended authority refs, and does not retry as a different semantic run.
  - any per-draft persistence failure rolls back the full batch; partial batch persistence is not allowed.
  - PERSIST_NEED_CANDIDATE_BATCH_FAILED is returned when persistence batch execution fails after command validation but before successful commit.
  - node result shape remains stable for codex_assisted, provider_llm, and mocked_llm failures.
```

### `topic-selection.v1a.validate-need-adjudication.v1`
```yaml
policy_status: implementation_ready
node_id: topic-selection.v1a.validate-need-adjudication.v1
authority_object: ValidateNeedAdjudicationResult
preconditions:
  - selected NeedCandidate exists and belongs to the current title_card_id/topic scope.
  - selected NeedCandidate decision_status is ready_for_validation.
  - selected NeedCandidate lifecycle_status is not closed.
  - selected NeedCandidate has not already produced a ValidatedNeed.
  - ValidationDecisionSupportPacket exists and belongs to the selected NeedCandidate.
  - support packet status is ready.
  - support packet evidence_map_ref, search_run_ref, search_plan_ref, literature_snapshot_ref, evidence_role_bundle, conflict_refs, strength_assessment_refs, residual_risk_refs, and required_human_checks are available.
  - sibling NeedCandidate refs for the title card are available as candidate-pool context when duplicate/merge/park/reject decisions are possible.
  - readiness assessment exists with recommendation ready_for_validation when supplied.
  - evidence map freshness is current or accepted risk/recheck refs explicitly explain the residual risk.
  - execution packet includes final-decision recommendation context, but human confirmation remains outside this node.
blocking_conditions:
  - malformed payload returns INVALID_PAYLOAD before authority creation.
  - NeedCandidate not found returns NOT_FOUND.
  - support packet not found returns NOT_FOUND.
  - support packet belongs to a different NeedCandidate blocks with VERSION_CONFLICT.
  - selected NeedCandidate already produced a ValidatedNeed blocks with GATE_CONSTRAINT_FAILED.
  - selected NeedCandidate already has a pending adjudication blocks with GATE_CONSTRAINT_FAILED.
  - selected NeedCandidate lifecycle_status closed blocks with GATE_CONSTRAINT_FAILED.
  - selected NeedCandidate decision_status other than ready_for_validation blocks with GATE_CONSTRAINT_FAILED.
  - support packet status not ready blocks with GATE_CONSTRAINT_FAILED.
  - support packet refs cannot resolve blocks with NOT_FOUND or VERSION_CONFLICT.
  - readiness assessment belongs to a different NeedCandidate blocks with VERSION_CONFLICT.
  - readiness assessment recommendation other than ready_for_validation blocks with GATE_CONSTRAINT_FAILED.
  - final_decision merge without merge_target_need_candidate_ref returns INVALID_PAYLOAD.
  - final_decision request_searchplan_recheck without actionable reason/gap context blocks with GATE_CONSTRAINT_FAILED.
  - agent/model output malformed after allowed low-level technical retry blocks with MALFORMED_ADJUDICATION_OUTPUT.
  - adjudication result attempts to create ValidatedNeed, V1bInputBundle, TopicQuestionContract, SearchPlan mutation, or direct memory materialization blocks before authority write.
deterministic_validators:
  - validate-need-adjudication is not debate-eligible.
  - allowed model-like execution is single-agent only through AgentOrchestrator.
  - Codex may produce a local recommendation only when execution_mode=codex_assisted and provenance marks source_kind=codex_assisted.
  - provider_llm may produce a recommendation only through a registry-owned profile; provider/model ids must not branch business behavior.
  - mocked_llm is test/acceptance-only and cannot satisfy product authority decisions.
  - output final_decision must be one of validate, return_to_candidate, request_searchplan_recheck, reject, park, or merge.
  - final_decision validate produces only a ValidateNeedAdjudicationResult recommendation; ValidatedNeed authority is created only by human-confirm-need.
  - final_decision return_to_candidate maps loopback_target to need_candidate.
  - final_decision request_searchplan_recheck maps loopback_target to search_plan and may output a typed recheck request ref only after deterministic validation.
  - final_decision reject requires rejected_reason or equivalent rationale.
  - final_decision merge requires merge_target_need_candidate_ref and must not auto-merge authority records.
  - final_decision park must preserve candidate as hypothesis and record required_actions or rationale.
  - accepted_risk_refs and residual_risk_refs must be explicit refs; risk prose alone is not sufficient.
  - support packet required_human_checks remain handoff requirements, not proof of human confirmation.
  - sibling candidate context is used only for duplicate/merge/park reasoning and must not overwrite selected candidate content.
  - adjudication result may output required_actions, loopback_target, rejected_reason, merge target, recheck suggestion/ref, memory suggestion ref, risk refs, gap_codes, and rationale.
  - adjudication result must not create ValidatedNeed, V1bInputBundle, TopicQuestionContract, or PaperProjectBridge.
  - direct SearchPlan mutation is forbidden; searchplan recheck is represented as a typed recheck request.
  - direct memory materialization is forbidden; memory learning is represented as a suggestion/ref for a later materialization path.
  - domain authority write must be all-or-nothing for the adjudication result and its typed side-effect refs; pre-write control-plane audit records may remain as failed-attempt evidence.
allowed_execution_modes: [codex_assisted, provider_llm, mocked_llm]
default_execution_mode: codex_assisted
debate_trigger_policy: not_allowed
profile_escalation_policy_ref:
  policy: DMP-05 provider fallback and profile escalation policy
  registry_service: TopicSelectionModelProfileRegistryService
  invocation_boundary: TopicSelectionAgentOrchestratorService
  semantics:
    - no debate escalation.
    - no automatic provider fallback.
    - malformed semantic output does not retry as a different adjudication decision.
    - human-confirm-need is the only final validation authority path.
input_contract_refs:
  - TopicSelectionNeedCandidateRecord
  - TopicSelectionValidationDecisionSupportPacketRecord
  - TopicSelectionNeedCandidateReadinessAssessmentRecord
  - TopicSelectionNeedValidationEvidenceBundle
  - TopicSelectionEvidenceStrengthAssessmentRecord
  - sibling TopicSelectionNeedCandidateRecord list projection
  - accepted risk refs
  - open search-plan recheck refs
output_contract_refs:
  - TopicSelectionValidateNeedAdjudicationResultRecord
  - optional SearchPlanRecheckRequest ref
  - optional CandidateDecisionMemorySuggestion ref
  - required_actions
  - accepted_risk_refs
  - residual_risk_refs
  - gap_codes
authority_write_boundary:
  target_boundary:
    route: POST /topic-selection/v1a/need-candidates/:needCandidateId/adjudications
    controller: TopicSelectionV1aController.adjudicateNeed
    domain_service: TopicSelectionNeedValidationService.adjudicateNeed
    repository: TopicSelectionNeedValidationRepository adjudication-result persistence
    authority_objects:
      - TopicSelectionValidateNeedAdjudicationResultRecord
    forbidden_authority_objects:
      - HumanConfirmedDecision
      - TopicSelectionValidatedNeedRecord
      - TopicSelectionV1aToV1bInputBundleRecord
      - TopicQuestionContract
  implemented_backend_route:
    route: POST /topic-selection/v1a/need-candidates/:needCandidateId/adjudications
    method: TopicSelectionNeedValidationService.adjudicateNeed
    status: split_authority_route
    writes_when_validate:
      - TopicSelectionValidateNeedAdjudicationResultRecord
    does_not_write:
      - HumanConfirmedDecision
      - TopicSelectionValidatedNeedRecord
      - TopicSelectionV1aToV1bInputBundleRecord
    constraint: Human confirmation and v1b publication are separate routes and cannot be inferred from adjudication payload fields.
  agent_orchestrator_direct_write: false
  debate_executor_direct_write: false
audit_artifact_policy:
  must_record:
    - selected candidate ref and candidate version.
    - support packet ref and packet status.
    - readiness assessment ref when present.
    - evidence map/search/literature lineage refs.
    - sibling candidate context hash when used.
    - execution_mode, profile_id, model_option_id, and provenance for model-like recommendation.
    - final_decision, loopback_target, required_actions, risk refs, gap codes, and rationale.
    - any output recheck request or memory suggestion refs as typed side-effect refs.
  must_not_record:
    - hidden reasoning.
    - provider secrets.
    - raw provider logs.
    - raw debate transcripts.
    - human confirmation as an inferred model output.
failure_semantics:
  invalid_payload: return INVALID_PAYLOAD before authority creation.
  missing_candidate_or_packet: return NOT_FOUND.
  stale_or_mismatched_refs: return VERSION_CONFLICT or GATE_CONSTRAINT_FAILED before authority creation.
  agent_failure: return blocked with no adjudication authority write.
  malformed_recommendation: return blocked or require_human_review; do not invent a final decision.
  validate_without_human_confirmation: return require_human_review and hand off to human-confirm-need.
  merge_without_target: return INVALID_PAYLOAD.
  unresolved_recheck_or_risk: return request_searchplan_recheck or require_human_review, not validate.
  composite_route_risk: retired; adjudication no longer writes HumanConfirmedDecision, ValidatedNeed, or V1bInputBundle.
```

### `topic-selection.v1a.human-confirm-need.v1`
```yaml
policy_status: implementation_ready
node_id: topic-selection.v1a.human-confirm-need.v1
authority_object: ValidatedNeed
preconditions:
  - ValidateNeedAdjudicationResult exists for the selected NeedCandidate.
  - adjudication final_decision is validate.
  - adjudication output_validated_need_id is not already materialized as an existing ValidatedNeed.
  - ValidationDecisionSupportPacket exists and belongs to the selected NeedCandidate.
  - NeedCandidate has not already produced a ValidatedNeed.
  - human_actor exists and actor_type is human or hybrid.
  - human rationale is present.
  - required_human_checks from the support packet have been presented to the human confirmer.
  - accepted risk refs required by adjudication/support packet are explicit.
blocking_conditions:
  - malformed payload returns INVALID_PAYLOAD before authority creation.
  - adjudication result not found returns NOT_FOUND.
  - support packet not found returns NOT_FOUND.
  - NeedCandidate not found returns NOT_FOUND.
  - adjudication final_decision other than validate blocks with GATE_CONSTRAINT_FAILED.
  - NeedCandidate already has result_validated_need_id blocks with GATE_CONSTRAINT_FAILED.
  - human_actor actor_type other than human or hybrid returns INVALID_PAYLOAD.
  - missing human rationale returns INVALID_PAYLOAD.
  - adjudication/support packet/candidate refs mismatch blocks with VERSION_CONFLICT.
  - residual risk requires acceptance but accepted_risk_refs are missing blocks with GATE_CONSTRAINT_FAILED.
  - transition to ValidatedNeed fails blocks before repository persistence.
deterministic_validators:
  - human-confirm-need is human_review and MUST NOT call AgentOrchestrator, BackendLlmGateway, Codex, or debate runtime.
  - ValidatedNeed may be created only from a validate adjudication plus an explicit human decision record.
  - human confirmation cannot be inferred from provider, Codex, mock, or cached model output.
  - ValidatedNeed fields must derive from NeedCandidate, support packet, adjudication, and human decision refs.
  - ValidatedNeed must preserve evidence_map_ref, search_run_ref, search_plan_ref, literature_snapshot_ref, support_packet_ref, adjudication_result_ref, human_decision_ref, evidence_role_bundle, strength_assessment_refs, conflict_refs, residual_risk_refs, accepted_risk_refs, and trace_refs.
  - ValidatedNeed must not mutate NeedCandidate content, SearchPlan, EvidenceMap, ResourceSampleSet, or V1b bundle state.
  - support packet required_human_checks must remain auditable in the confirmation payload or trace.
  - accepted risk refs must be carried forward without converting risk prose into authority refs.
  - domain authority write must be all-or-nothing for the ValidatedNeed and candidate status patch; pre-write control-plane audit and human decision records may remain as failed-attempt evidence if the final domain write fails.
allowed_execution_modes: [none]
default_execution_mode: none
debate_trigger_policy: not_allowed
profile_escalation_policy_ref: not_applicable
input_contract_refs:
  - TopicSelectionValidateNeedAdjudicationResultRecord
  - TopicSelectionNeedCandidateRecord
  - TopicSelectionValidationDecisionSupportPacketRecord
  - HumanConfirmedDecision input
  - accepted risk refs
output_contract_refs:
  - TopicSelectionValidatedNeedRecord
  - HumanConfirmedDecision
authority_write_boundary:
  target_boundary:
    route: POST /topic-selection/v1a/adjudications/:adjudicationResultId/human-confirmations
    controller: TopicSelectionV1aController.confirmValidatedNeed
    domain_service: TopicSelectionNeedValidationService.confirmValidatedNeed
    repository: TopicSelectionNeedValidationRepository validated-need persistence
    authority_objects:
      - HumanConfirmedDecision
      - TopicSelectionValidatedNeedRecord
    forbidden_authority_objects:
      - TopicSelectionV1aToV1bInputBundleRecord
      - TopicQuestionContract
  implemented_backend_route:
    route: POST /topic-selection/v1a/adjudications/:adjudicationResultId/human-confirmations
    method: TopicSelectionNeedValidationService.confirmValidatedNeed
    status: split_authority_route
    constraint: Non-human actors are rejected before persistence; duplicate ValidatedNeed materialization returns GATE_CONSTRAINT_FAILED.
  agent_orchestrator_direct_write: false
  debate_executor_direct_write: false
audit_artifact_policy:
  must_record:
    - adjudication result ref.
    - support packet ref.
    - source NeedCandidate ref and candidate version.
    - human decision ref, actor, rationale, and policy version.
    - accepted/residual risk refs.
    - trace refs inherited from candidate/support/adjudication.
  must_not_record:
    - hidden reasoning.
    - provider secrets.
    - raw provider logs.
    - raw debate transcripts.
    - model output as human confirmation.
failure_semantics:
  invalid_payload: return INVALID_PAYLOAD before authority creation.
  missing_required_ref: return NOT_FOUND.
  ref_mismatch: return VERSION_CONFLICT before authority creation.
  not_validate_decision: return GATE_CONSTRAINT_FAILED.
  duplicate_validated_need: return GATE_CONSTRAINT_FAILED and do not create a second ValidatedNeed.
  missing_human_confirmation: return require_human_review.
  repository_failure: fail without partial ValidatedNeed semantics.
  partial_control_plane_audit_after_failure: allowed only as failed-attempt evidence; it must not be treated as a materialized ValidatedNeed.
```

### `topic-selection.v1a.publish-v1b-input-bundle.v1`
```yaml
policy_status: implementation_ready
node_id: topic-selection.v1a.publish-v1b-input-bundle.v1
authority_object: TopicSelectionV1bInputBundle
preconditions:
  - ValidatedNeed exists.
  - source NeedCandidate exists.
  - ValidationDecisionSupportPacket exists.
  - ValidateNeedAdjudicationResult exists.
  - HumanConfirmedDecision ref exists on the ValidatedNeed.
  - ValidatedNeed evidence/search/literature refs are current enough for v1b intake or carry explicit risk/recheck refs.
  - no active v1b input bundle already exists for the same ValidatedNeed and bundle_version unless replay/idempotency is explicitly supported.
blocking_conditions:
  - malformed payload returns INVALID_PAYLOAD before authority creation.
  - ValidatedNeed not found returns NOT_FOUND.
  - source NeedCandidate not found returns NOT_FOUND.
  - support packet not found returns NOT_FOUND.
  - adjudication result not found returns NOT_FOUND.
  - ValidatedNeed/source candidate/support packet/adjudication refs mismatch blocks with VERSION_CONFLICT.
  - missing human_decision_ref blocks with GATE_CONSTRAINT_FAILED.
  - ValidatedNeed without evidence role bundle blocks with GATE_CONSTRAINT_FAILED.
  - unresolved high-priority recheck without accepted carry-forward risk blocks with GATE_CONSTRAINT_FAILED.
  - duplicate bundle for the same ValidatedNeed and bundle_version blocks or returns idempotent existing bundle according to repository policy.
deterministic_validators:
  - publish-v1b-input-bundle is deterministic and MUST NOT call AgentOrchestrator, BackendLlmGateway, Codex, or debate runtime.
  - handoff payload must derive only from ValidatedNeed, source NeedCandidate, support packet, adjudication result, memory suggestion refs, and recheck request refs.
  - bundle must preserve validated_need_ref, source_need_candidate_ref, adjudication_result_ref, support_packet_ref, human_decision_ref, evidence_map_ref, search_run_ref, search_plan_ref, literature_snapshot_ref, evidence_role_bundle, trace_refs, risk_refs, gap_codes, memory_suggestion_refs, and recheck_request_refs.
  - risk_refs must be the union of residual_risk_refs and accepted_risk_refs from ValidatedNeed/adjudication, not free-text risk notes.
  - memory_suggestion_refs are carried as refs only; memory materialization is not part of this node.
  - recheck_request_refs are carried as refs only; SearchPlan mutation is not part of this node.
  - v1b input bundle must not include raw debate transcripts, hidden reasoning, raw ranked draft batches, raw rejected framings, or provider logs.
  - v1b input bundle must not create ResearchSlice, TopicQuestionContract, TopicPackageDraft, PromotionDecision, or PaperProjectBridge.
allowed_execution_modes: [none]
default_execution_mode: none
debate_trigger_policy: not_allowed
profile_escalation_policy_ref: not_applicable
input_contract_refs:
  - TopicSelectionValidatedNeedRecord
  - TopicSelectionNeedCandidateRecord
  - TopicSelectionValidationDecisionSupportPacketRecord
  - TopicSelectionValidateNeedAdjudicationResultRecord
  - CandidateDecisionMemorySuggestion refs
  - SearchPlanRecheckRequest refs
output_contract_refs:
  - TopicSelectionV1aToV1bInputBundleRecord
authority_write_boundary:
  route: POST /topic-selection/v1a/v1b-input-bundles
  controller: TopicSelectionV1aController.publishV1bInputBundle
  domain_service: TopicSelectionNeedValidationService.publishV1bInputBundle
  repository: TopicSelectionNeedValidationRepository.createV1aToV1bInputBundle
  authority_objects:
    - TopicSelectionV1aToV1bInputBundleRecord
  forbidden_authority_objects:
    - ResearchSlice
    - TopicQuestionContract
    - TopicPackageDraft
    - PromotionDecision
    - PaperProjectBridge
  implemented_backend_route:
    route: POST /topic-selection/v1a/v1b-input-bundles
    method: TopicSelectionNeedValidationService.publishV1bInputBundle
    status: deterministic_handoff_route
    idempotency: returns an existing bundle for the same ValidatedNeed and requested bundle_version; without bundle_version, returns the newest existing bundle before creating a new default-version bundle.
  agent_orchestrator_direct_write: false
  debate_executor_direct_write: false
audit_artifact_policy:
  must_record:
    - validated need ref.
    - source need candidate ref.
    - adjudication result ref.
    - support packet ref.
    - human decision ref.
    - evidence/search/literature lineage refs.
    - trace refs.
    - risk refs.
    - memory suggestion refs.
    - recheck request refs.
    - bundle version.
  must_not_record:
    - hidden reasoning.
    - provider secrets.
    - raw provider logs.
    - raw debate transcripts.
    - raw ranked candidate drafts.
failure_semantics:
  invalid_payload: return INVALID_PAYLOAD before authority creation.
  missing_required_ref: return NOT_FOUND.
  ref_mismatch: return VERSION_CONFLICT before authority creation.
  missing_human_decision: return GATE_CONSTRAINT_FAILED.
  unresolved_recheck_or_risk: block unless explicit accepted risk/recheck carry-forward refs exist.
  duplicate_bundle: block or return idempotent existing bundle according to repository policy; never create semantically duplicate v1b bundles.
  repository_failure: fail without partial handoff semantics.
```

### `topic-selection.v1b.build-intake-constraint-profile.v1`
```yaml
policy_status: stub
node_id: topic-selection.v1b.build-intake-constraint-profile.v1
authority_object: TopicSelectionV1bIntakeConstraintProfile
preconditions: TBD-node-policy-detail
blocking_conditions: TBD-node-policy-detail
deterministic_validators: TBD-node-policy-detail
allowed_execution_modes: [none]
default_execution_mode: none
debate_trigger_policy: not_allowed
profile_escalation_policy_ref: not_applicable
input_contract_refs: TBD-node-policy-detail
output_contract_refs: TBD-node-policy-detail
authority_write_boundary: TBD-node-policy-detail
audit_artifact_policy: TBD-node-policy-detail
failure_semantics: TBD-node-policy-detail
```

### `topic-selection.v1b.plan-research-slice.v1`
```yaml
policy_status: stub
node_id: topic-selection.v1b.plan-research-slice.v1
authority_object: ResearchSlice
preconditions: TBD-node-policy-detail
blocking_conditions: TBD-node-policy-detail
deterministic_validators: TBD-node-policy-detail
allowed_execution_modes: [codex_assisted, provider_llm, mocked_llm]
default_execution_mode: codex_assisted
debate_trigger_policy: not_allowed
profile_escalation_policy_ref: TBD-node-policy-detail
input_contract_refs: TBD-node-policy-detail
output_contract_refs: TBD-node-policy-detail
authority_write_boundary: TBD-node-policy-detail
audit_artifact_policy: TBD-node-policy-detail
failure_semantics: TBD-node-policy-detail
```

### `topic-selection.v1b.form-topic-question-contract.v1`
```yaml
policy_status: stub
node_id: topic-selection.v1b.form-topic-question-contract.v1
authority_object: TopicQuestionContract
preconditions: TBD-node-policy-detail
blocking_conditions: TBD-node-policy-detail
deterministic_validators: TBD-node-policy-detail
allowed_execution_modes: [codex_assisted, provider_llm, mocked_llm]
default_execution_mode: codex_assisted
debate_trigger_policy: not_allowed
profile_escalation_policy_ref: TBD-node-policy-detail
input_contract_refs: TBD-node-policy-detail
output_contract_refs: TBD-node-policy-detail
authority_write_boundary: TBD-node-policy-detail
audit_artifact_policy: TBD-node-policy-detail
failure_semantics: TBD-node-policy-detail
```

### `topic-selection.v1b.assess-topic-value.v1`
```yaml
policy_status: stub
node_id: topic-selection.v1b.assess-topic-value.v1
authority_object: TopicValueAssessment
preconditions: TBD-node-policy-detail
blocking_conditions: TBD-node-policy-detail
deterministic_validators: TBD-node-policy-detail
allowed_execution_modes: [codex_assisted, provider_llm, mocked_llm]
default_execution_mode: codex_assisted
debate_trigger_policy: TBD-node-policy-detail
profile_escalation_policy_ref: TBD-node-policy-detail
input_contract_refs: TBD-node-policy-detail
output_contract_refs: TBD-node-policy-detail
authority_write_boundary: TBD-node-policy-detail
audit_artifact_policy: TBD-node-policy-detail
failure_semantics: TBD-node-policy-detail
```

### `topic-selection.v1b.decide-value-disposition.v1`
```yaml
policy_status: stub
node_id: topic-selection.v1b.decide-value-disposition.v1
authority_object: ValueDispositionDecision
preconditions: TBD-node-policy-detail
blocking_conditions: TBD-node-policy-detail
deterministic_validators: TBD-node-policy-detail
allowed_execution_modes: [none]
default_execution_mode: none
debate_trigger_policy: not_allowed
profile_escalation_policy_ref: not_applicable
input_contract_refs: TBD-node-policy-detail
output_contract_refs: TBD-node-policy-detail
authority_write_boundary: TBD-node-policy-detail
audit_artifact_policy: TBD-node-policy-detail
failure_semantics: TBD-node-policy-detail
```

### `topic-selection.v1b.create-topic-package-draft.v1`
```yaml
policy_status: stub
node_id: topic-selection.v1b.create-topic-package-draft.v1
authority_object: TopicPackageDraft
preconditions: TBD-node-policy-detail
blocking_conditions: TBD-node-policy-detail
deterministic_validators: TBD-node-policy-detail
allowed_execution_modes: [none]
default_execution_mode: none
debate_trigger_policy: not_allowed
profile_escalation_policy_ref: not_applicable
input_contract_refs: TBD-node-policy-detail
output_contract_refs: TBD-node-policy-detail
authority_write_boundary: TBD-node-policy-detail
audit_artifact_policy: TBD-node-policy-detail
failure_semantics: TBD-node-policy-detail
```

### `topic-selection.v1b.assess-package-readiness.v1`
```yaml
policy_status: stub
node_id: topic-selection.v1b.assess-package-readiness.v1
authority_object: TopicPackageReadinessAssessment
preconditions: TBD-node-policy-detail
blocking_conditions: TBD-node-policy-detail
deterministic_validators: TBD-node-policy-detail
allowed_execution_modes: [none]
default_execution_mode: none
debate_trigger_policy: not_allowed
profile_escalation_policy_ref: not_applicable
input_contract_refs: TBD-node-policy-detail
output_contract_refs: TBD-node-policy-detail
authority_write_boundary: TBD-node-policy-detail
audit_artifact_policy: TBD-node-policy-detail
failure_semantics: TBD-node-policy-detail
```

### `topic-selection.v1b.publish-v1c-input-bundle.v1`
```yaml
policy_status: stub
node_id: topic-selection.v1b.publish-v1c-input-bundle.v1
authority_object: TopicSelectionV1bToV1cInputBundle
preconditions: TBD-node-policy-detail
blocking_conditions: TBD-node-policy-detail
deterministic_validators: TBD-node-policy-detail
allowed_execution_modes: [none]
default_execution_mode: none
debate_trigger_policy: not_allowed
profile_escalation_policy_ref: not_applicable
input_contract_refs: TBD-node-policy-detail
output_contract_refs: TBD-node-policy-detail
authority_write_boundary: TBD-node-policy-detail
audit_artifact_policy: TBD-node-policy-detail
failure_semantics: TBD-node-policy-detail
```

### `topic-selection.v1c.create-promotion-input-snapshot.v1`
```yaml
policy_status: stub
node_id: topic-selection.v1c.create-promotion-input-snapshot.v1
authority_object: PromotionInputSnapshot
preconditions: TBD-node-policy-detail
blocking_conditions: TBD-node-policy-detail
deterministic_validators: TBD-node-policy-detail
allowed_execution_modes: [none]
default_execution_mode: none
debate_trigger_policy: not_allowed
profile_escalation_policy_ref: not_applicable
input_contract_refs: TBD-node-policy-detail
output_contract_refs: TBD-node-policy-detail
authority_write_boundary: TBD-node-policy-detail
audit_artifact_policy: TBD-node-policy-detail
failure_semantics: TBD-node-policy-detail
```

### `topic-selection.v1c.generate-promotion-support.v1`
```yaml
policy_status: stub
node_id: topic-selection.v1c.generate-promotion-support.v1
authority_object: PromotionDecisionSupport
preconditions: TBD-node-policy-detail
blocking_conditions: TBD-node-policy-detail
deterministic_validators: TBD-node-policy-detail
allowed_execution_modes: [codex_assisted, provider_llm, mocked_llm]
default_execution_mode: codex_assisted
debate_trigger_policy: TBD-node-policy-detail
profile_escalation_policy_ref: TBD-node-policy-detail
input_contract_refs: TBD-node-policy-detail
output_contract_refs: TBD-node-policy-detail
authority_write_boundary: TBD-node-policy-detail
audit_artifact_policy: TBD-node-policy-detail
failure_semantics: TBD-node-policy-detail
```

### `topic-selection.v1c.run-promotion-gate.v1`
```yaml
policy_status: stub
node_id: topic-selection.v1c.run-promotion-gate.v1
authority_object: PromotionGateCheck
preconditions: TBD-node-policy-detail
blocking_conditions: TBD-node-policy-detail
deterministic_validators: TBD-node-policy-detail
allowed_execution_modes: [none]
default_execution_mode: none
debate_trigger_policy: not_allowed
profile_escalation_policy_ref: not_applicable
input_contract_refs: TBD-node-policy-detail
output_contract_refs: TBD-node-policy-detail
authority_write_boundary: TBD-node-policy-detail
audit_artifact_policy: TBD-node-policy-detail
failure_semantics: TBD-node-policy-detail
```

### `topic-selection.v1c.human-promotion-decision.v1`
```yaml
policy_status: stub
node_id: topic-selection.v1c.human-promotion-decision.v1
authority_object: PromotionDecision
preconditions: TBD-node-policy-detail
blocking_conditions: TBD-node-policy-detail
deterministic_validators: TBD-node-policy-detail
allowed_execution_modes: [none]
default_execution_mode: none
debate_trigger_policy: not_allowed
profile_escalation_policy_ref: not_applicable
input_contract_refs: TBD-node-policy-detail
output_contract_refs: TBD-node-policy-detail
authority_write_boundary: TBD-node-policy-detail
audit_artifact_policy: TBD-node-policy-detail
failure_semantics: TBD-node-policy-detail
```

### `topic-selection.v1c.create-paper-project-bridge.v1`
```yaml
policy_status: stub
node_id: topic-selection.v1c.create-paper-project-bridge.v1
authority_object: PaperProjectBridge
preconditions: TBD-node-policy-detail
blocking_conditions: TBD-node-policy-detail
deterministic_validators: TBD-node-policy-detail
allowed_execution_modes: [none]
default_execution_mode: none
debate_trigger_policy: not_allowed
profile_escalation_policy_ref: not_applicable
input_contract_refs: TBD-node-policy-detail
output_contract_refs: TBD-node-policy-detail
authority_write_boundary: TBD-node-policy-detail
audit_artifact_policy: TBD-node-policy-detail
failure_semantics: TBD-node-policy-detail
```

### `topic-selection.downstream.paper-project-intake.v1`
```yaml
policy_status: stub
node_id: topic-selection.downstream.paper-project-intake.v1
authority_object: PaperProjectIntake
preconditions: TBD-node-policy-detail
blocking_conditions: TBD-node-policy-detail
deterministic_validators: TBD-node-policy-detail
allowed_execution_modes: [none]
default_execution_mode: none
debate_trigger_policy: not_allowed
profile_escalation_policy_ref: not_applicable
input_contract_refs: TBD-node-policy-detail
output_contract_refs: TBD-node-policy-detail
authority_write_boundary: TBD-node-policy-detail
audit_artifact_policy: TBD-node-policy-detail
failure_semantics: TBD-node-policy-detail
```

### `topic-selection.downstream.feedback-recheck.v1`
```yaml
policy_status: stub
node_id: topic-selection.downstream.feedback-recheck.v1
authority_object: DownstreamTopicFeedback
preconditions: TBD-node-policy-detail
blocking_conditions: TBD-node-policy-detail
deterministic_validators: TBD-node-policy-detail
allowed_execution_modes: [none]
default_execution_mode: none
debate_trigger_policy: not_allowed
profile_escalation_policy_ref: not_applicable
input_contract_refs: TBD-node-policy-detail
output_contract_refs: TBD-node-policy-detail
authority_write_boundary: TBD-node-policy-detail
audit_artifact_policy: TBD-node-policy-detail
failure_semantics: TBD-node-policy-detail
```
