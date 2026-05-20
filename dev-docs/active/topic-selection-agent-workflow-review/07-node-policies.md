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

## Node Evaluation Dimensions
Every node review MUST evaluate automation callability before implementation work is considered closed.

`policy_status=implementation_ready` means business semantics are clear enough to implement. It does not by itself mean the node is already callable by automation. That distinction is captured by `automation_callability`.

`automation_callability` MUST answer:
- whether the node has a stable normalized node input;
- whether the node has a stable normalized node result for success and blocked paths;
- whether a `WorkflowHarness` runner exists;
- whether the runner calls the existing authority-write service instead of writing authority directly;
- whether the node can run without script-local request choreography;
- whether the node emits harness trace/audit/artifact refs;
- whether scenario registry or scenario runner code can invoke it by `node_id` without knowing downstream route sequencing.

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
- `automation_callability.status=not_callable`: the node is only available through manual route/service choreography or script-owned sequencing.
- `automation_callability.status=partially_callable`: a service/route exists, but there is no normalized harness runner or blocked result shape.
- `automation_callability.status=callable`: a WorkflowHarness runner exists with stable input/result, trace, assertions, and no script-local business choreography.
- `automation_callability.status=blocked`: upstream contracts or authority boundaries are not clear enough to define an automated runner safely.

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
- `topic-selection.v1a.create-topic-seed.v1`
- `topic-selection.v1a.snapshot-literature-resource-pool.v1`
- `topic-selection.v1a.create-search-plan.v1`
- `topic-selection.v1a.record-search-run.v1`
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

## Current v1a Automation Callability Snapshot
This snapshot prevents `policy_status=implementation_ready` from being mistaken for automated execution readiness.

| Node | Policy status | Automation callability | Current reason |
|---|---|---|---|
| `topic-selection.v1a.create-topic-seed.v1` | `implementation_ready` | `callable` | `runCreateTopicSeedScenario` exists with stable success/blocked result and trace artifact. |
| `topic-selection.v1a.snapshot-literature-resource-pool.v1` | `implementation_ready` | `callable` | `runSnapshotLiteratureResourcePoolScenario` exists with stable success/blocked result and trace artifact. |
| `topic-selection.v1a.create-search-plan.v1` | `implementation_ready` | `callable` | `runCreateSearchPlanScenario` exists with strict blueprint validation, success/blocked result, and trace artifact. |
| `topic-selection.v1a.record-search-run.v1` | `draft` | `not_callable` | route/service exists, but result accounting and evidence binding assembly remain script-owned. |
| `topic-selection.v1a.build-evidence-map.v1` | `implementation_ready` | `partially_callable` | business policy is clear, but no normalized harness runner exists yet. |
| `topic-selection.v1a.generate-need-candidate.v1` | `implementation_ready` | `callable` | `runGenerateNeedCandidateScenario` exists and is used by the real E2E canary. |
| `topic-selection.v1a.validate-need-adjudication.v1` | `implementation_ready` | `not_callable` | route/service sequence exists, but readiness/support/adjudication are not wrapped as one normalized node runner. |
| `topic-selection.v1a.human-confirm-need.v1` | `implementation_ready` | `not_callable` | route/service exists, but fixture-safe human-review runner is not implemented. |
| `topic-selection.v1a.publish-v1b-input-bundle.v1` | `implementation_ready` | `not_callable` | route/service exists, but deterministic handoff runner is not implemented. |

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
automation_callability: TBD-node-policy-detail
failure_semantics: TBD-node-policy-detail
```

## Policies

### `topic-selection.resource-sampling.create-sample-set.v1`
```yaml
policy_status: implementation_ready
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

### `topic-selection.v1a.create-topic-seed.v1`
```yaml
policy_status: implementation_ready
node_id: topic-selection.v1a.create-topic-seed.v1
authority_object: TopicSelectionTopicSeed
preconditions:
  - title_card_id resolves to an existing TitleCard.
  - intent_summary is non-empty after fallback to TitleCard brief when applicable.
  - scope_notes is present or intentionally null with traceable source context.
  - seed_version is explicit or derived by the service.
blocking_conditions:
  - missing TitleCard returns NOT_FOUND.
  - malformed payload returns INVALID_PAYLOAD before authority creation.
  - empty final intent_summary after fallback blocks with GATE_CONSTRAINT_FAILED before authority creation.
  - deterministic gate topic-selection.topic-seed-ready failure blocks before repository persistence.
  - transition title-card-to-topic-seed failure blocks before repository persistence.
deterministic_validators:
  - create-topic-seed is deterministic and MUST NOT call AgentOrchestrator, BackendLlmGateway, Codex, or debate runtime.
  - TopicSeed lineage must point to the source TitleCard.
  - input snapshot must include title, brief, status, updated_at, final intent_summary, scope_notes, and seed_version.
  - seed_kind is fixed to title_card by TopicSelectionSearchResourceService and is not accepted as caller input.
  - successful transition must create a TopicSeed authority ref.
  - duplicate/idempotency behavior must be surfaced by WorkflowHarness scenario result instead of hidden in script retries.
amendments:
  N1-AM01:
    summary: TopicSeed LLM boundary amendment.
    decision_order: node_1_amendment_not_n3_follow_up
    node_execution:
      - create-topic-seed remains deterministic with execution_mode=none.
      - Node 1 MUST NOT call AgentOrchestrator, BackendLlmGateway, Codex, provider LLMs, or debate runtime.
    optional_pre_node_semantic_preparation:
      - Human input, Codex, provider LLM, or fixture may prepare intent_summary and scope_notes before Node 1 invocation.
      - This preparation is input drafting only and does not create TopicSelectionTopicSeed authority.
      - A future TopicSeedIntentDraft@v1 helper may be introduced as a pre-node value artifact/profile only after a Node 1 amendment locks its contract and model policy.
      - Current implementation locks no executable TopicSeed draft/review profile.
    authority_rule:
      - TopicSelectionTopicSeed is created only by TopicSelectionSearchResourceService.createTopicSeedFromTitleCard after deterministic validation and control-plane transition.
      - Node 1 freezes the final accepted intent_summary and scope_notes in the input snapshot regardless of their upstream drafting origin.
allowed_execution_modes: [none]
default_execution_mode: none
debate_trigger_policy: not_allowed
profile_escalation_policy_ref: not_applicable
input_contract_refs:
  - CreateTopicSeedFromTitleCardInput
  - TitleCard
output_contract_refs:
  - TopicSelectionTopicSeedRecord
authority_write_boundary:
  workflow_harness: TopicSelectionWorkflowHarnessService.runCreateTopicSeedScenario
  route: POST /topic-selection/v1a/topic-seeds/from-title-card
  controller: TopicSelectionV1aController.createTopicSeedFromTitleCard
  domain_service: TopicSelectionSearchResourceService.createTopicSeedFromTitleCard
  repository: TopicSelectionSearchResourceRepository.createTopicSeed
  authority_objects:
    - TopicSelectionTopicSeed
  agent_orchestrator_direct_write: false
  debate_executor_direct_write: false
audit_artifact_policy:
  must_record:
    - control-plane input snapshot.
    - readiness gate result for topic-selection.topic-seed-ready.
    - transition attempt for title-card-to-topic-seed.
    - harness trace artifact with scenario_id, node_id, workflow_run_id, node_attempt_id, status, authority refs, audit refs, blockers, and assertions.
  must_not_record:
    - hidden reasoning.
    - provider secrets.
    - raw provider logs.
    - raw debate transcripts.
automation_callability:
  status: callable
  runner: TopicSelectionWorkflowHarnessService.runCreateTopicSeedScenario
  stable_node_input: TopicSelectionWorkflowHarnessCreateTopicSeedNodeInput
  stable_node_result: TopicSelectionWorkflowHarnessCreateTopicSeedNodeResult
  scenario_invocation:
    node_id: topic-selection.v1a.create-topic-seed.v1
    script_local_choreography_required: false
  authority_boundary_preserved: true
  blocked_result_shape: true
  trace_artifact: WorkflowHarnessCreateTopicSeedScenarioTrace@v1
  remaining_gaps:
    - scenario registry dispatch does not yet call this runner directly; current coverage is service-level WorkflowHarness unit tests.
failure_semantics:
  invalid_payload: return INVALID_PAYLOAD before authority creation.
  missing_title_card: return NOT_FOUND before control-plane transition.
  empty_final_intent: return GATE_CONSTRAINT_FAILED before TopicSeed id allocation and repository persistence.
  gate_or_transition_failed: block before repository persistence.
  repository_failure: fail the node attempt without creating downstream v1a authority.
```

### `topic-selection.v1a.snapshot-literature-resource-pool.v1`
```yaml
policy_status: implementation_ready
node_id: topic-selection.v1a.snapshot-literature-resource-pool.v1
authority_object: TopicSelectionLiteratureResourcePoolSnapshot
semantic_boundary:
  - The node only materializes a TopicSelectionLiteratureResourcePoolSnapshot authority.
  - The node MUST NOT perform resource sampling, literature selection, evidence-role classification, or evidence-polarity judgment.
  - Any ResourceSampleSet must be upstream provenance only after its selected literature has already been attached to the TitleCard evidence basket.
amendments:
  N2-AM01:
    summary: Literature resource pool snapshot LLM boundary confirmation.
    decision_order: node_2_amendment_not_n3_follow_up
    node_execution:
      - snapshot-literature-resource-pool remains deterministic with execution_mode=none.
      - Node 2 MUST NOT call AgentOrchestrator, BackendLlmGateway, Codex, provider LLMs, or debate runtime.
    semantic_routing:
      - Resource sampling and selected-literature semantics belong upstream before the evidence basket is frozen.
      - Evidence-role classification, evidence-polarity judgment, and deeper evidence interpretation belong upstream resource sampling or downstream evidence/need nodes.
      - Node 2 only snapshots traceable resource state from the normalized source scope.
normalized_harness_source_scope:
  supported:
    - title_card_evidence_basket
  unsupported_compat_values:
    - manual_selection
    - search_result
  blocked_code: UNSUPPORTED_SOURCE_SCOPE_FOR_NORMALIZED_V1A
resource_quality_gate_policy:
  blocking_scope: traceability_and_authority_creation_only
  must_block:
    - missing TopicSeed.
    - TopicSeed/title-card lineage mismatch.
    - empty TitleCard evidence basket.
    - evidence-basket literature id that cannot resolve to a Literature record.
    - unsupported normalized harness source_scope.
    - failed control-plane readiness gate or transition.
  must_warn:
    - incomplete key-content readiness.
    - incomplete abstract readiness.
    - low source_count.
    - incomplete pipeline readiness.
    - stale or duplicate pipeline status.
    - incomplete fulltext readiness.
  warning_sink: source_health_summary.warning_codes
snapshot_hash_policy:
  purpose: content_replay_identity
  must_include:
    - title_card_id.
    - topic_seed_ref.
    - source_scope.
    - evidence basket updated_at.
    - evidence-basket-derived literature_refs.
    - content_source_refs.
    - source_health_summary.
    - policy_version_id.
  must_exclude:
    - literature_resource_pool_snapshot_id.
    - input_snapshot_id.
    - gate_result_id.
    - transition_attempt_id.
    - harness trace artifact id.
    - created_at.
    - created_by.
  replay_semantics:
    - Same TopicSeed, same evidence basket state, same source health summary, same source scope, and same policy_version_id MUST produce the same snapshot_hash.
    - Different control-plane/audit ids across repeated runs MUST NOT change snapshot_hash.
    - Different resource contents, source health summary, source scope, or policy_version_id SHOULD change snapshot_hash.
workflow_harness_runner_contract:
  target_runner: TopicSelectionWorkflowHarnessService.runSnapshotLiteratureResourcePoolScenario
  implementation_status: implemented
  authority_service: TopicSelectionSearchResourceService.createLiteratureResourcePoolSnapshot
  direct_repository_write_allowed: false
  script_local_choreography_allowed: false
  node_input_type: TopicSelectionWorkflowHarnessSnapshotLiteratureResourcePoolNodeInput
  node_result_type: TopicSelectionWorkflowHarnessSnapshotLiteratureResourcePoolNodeResult
  success_result_must_include:
    - literature_resource_pool_snapshot_ref.
    - snapshot_version.
    - snapshot_hash.
    - included_literature_refs.
    - content_source_refs.
    - source_health_summary.
    - control_plane_refs.
    - harness_trace_artifact_ref.
  blocked_result_must_include:
    - status=blocked.
    - blocker_codes.
    - normalized node_input.
    - no TopicSelectionLiteratureResourcePoolSnapshot authority refs.
    - harness_trace_artifact_ref when trace recording is available.
audit_trace_boundary:
  control_plane_role: authoritative_audit_facts
  harness_trace_role: automation_execution_evidence
  trace_schema: WorkflowHarnessSnapshotLiteratureResourcePoolScenarioTrace@v1
  separation_rule:
    - control-plane input snapshot, readiness gate, and transition attempt remain the authoritative audit facts.
    - harness trace artifact MUST NOT replace control-plane audit refs.
    - control-plane refs and harness trace refs MAY cross-reference each other for replay/debug.
  trace_must_record:
    - scenario_id.
    - node_id.
    - workflow_run_id.
    - node_attempt_id.
    - normalized node_input.
    - normalized node_result.
    - snapshot_hash.
    - source_health_summary.
    - authority_refs.
    - control_plane_refs.
    - blocker_codes.
    - warning_codes.
    - assertions.
  trace_must_not_record:
    - hidden reasoning.
    - provider secrets.
    - raw provider logs.
    - raw LLM transcript.
    - raw debate transcript.
search_plan_handoff_policy:
  downstream_node: topic-selection.v1a.create-search-plan.v1
  frozen_authority_ref_required: true
  must_handoff:
    - literature_resource_pool_snapshot_ref.
    - snapshot_version.
    - snapshot_hash.
    - source_scope.
    - literature_refs.
    - content_source_refs.
    - source_health_summary.
  downstream_must_not_read_as_resource_truth:
    - mutable TitleCard evidence basket.
    - ResourceSampleSet.
    - caller-supplied selected literature refs.
    - current search results.
  replay_rule:
    - SearchPlan must be based on the supplied LiteratureResourcePoolSnapshot authority, not the current mutable evidence basket state.
    - If the evidence basket changes after snapshot creation, a new LiteratureResourcePoolSnapshot must be created before those changes can affect SearchPlan.
    - snapshot_hash is an assertion/replay check and must not replace the snapshot authority ref.
idempotency_policy:
  default_mode: append_only
  authority_id_reuse: false
  content_equivalence_key: snapshot_hash
  repeated_equivalent_run:
    - MAY create a new LiteratureResourcePoolSnapshot authority id.
    - MUST produce the same snapshot_hash when TopicSeed, evidence basket state, source scope, source health summary, and policy_version_id are equivalent.
    - MUST record a distinct execution/audit trail for the new attempt.
  must_not:
    - silently reuse an existing snapshot authority by hash.
    - treat snapshot_hash as the authority ref.
    - skip control-plane gate/transition evidence because an equivalent hash already exists.
  future_reuse_mode:
    - Any reuse_existing_snapshot_by_hash behavior requires an explicit policy and runner input flag in a future slice.
implementation_readiness_review:
  status: implemented_callable
  complexity: moderate_bounded
  rationale:
    - The node is deterministic and does not require AgentOrchestrator, provider LLM, Codex, or debate runtime.
    - Existing route, service, repository, control-plane gate, and transition boundaries already cover the authority write path.
    - The remaining work is harness normalization, trace assembly, hash/source-health hardening, and focused service/runner tests.
  non_goals:
    - do not implement alternate source_scope resolvers.
    - do not implement resource sampling or evidence-role classification.
    - do not implement reuse_existing_snapshot_by_hash.
    - do not make SearchPlan read mutable evidence basket state as resource truth.
  closed_implementation_gaps:
    - runSnapshotLiteratureResourcePoolScenario implemented.
    - service snapshot_hash aligned with the locked content_replay_identity payload.
    - source_health_summary.warning_codes expanded for maturity warnings without turning them into blockers.
    - runner trace schema and success/blocked assertions implemented.
    - blocked missing-literature results preserve control-plane audit refs created before repository persistence is skipped.
    - normalized runner requires concrete TopicSeed refs with version and title-card lineage.
  callable_promotion_evidence:
    - stable normalized input/result types exist.
    - unsupported source_scope blocks before authority creation in the harness path.
    - success and blocked result tests pass.
    - hash stability and append-only repeated-run tests pass.
    - source-health warning non-blocking tests pass.
    - SearchPlan handoff assertion tests pass.
preconditions:
  - topic_seed_id resolves to a TopicSeed under the same title_card_id.
  - title-card evidence basket is the single normalized source of included literature for this node.
  - title-card evidence basket contains at least one literature item for the current source_scope.
  - literature records and source records are resolvable or reported through source_health_summary.
blocking_conditions:
  - missing TopicSeed returns NOT_FOUND.
  - TopicSeed title-card mismatch returns VERSION_CONFLICT.
  - empty evidence basket blocks with GATE_CONSTRAINT_FAILED.
  - unresolved evidence-basket literature id blocks with MISSING_LITERATURE_RECORD before snapshot authority creation.
  - normalized harness input with source_scope other than title_card_evidence_basket blocks with UNSUPPORTED_SOURCE_SCOPE_FOR_NORMALIZED_V1A.
  - deterministic gate topic-selection.literature-snapshot-ready failure blocks before repository persistence.
  - transition topic-seed-to-literature-snapshot failure blocks before repository persistence.
deterministic_validators:
  - snapshot-literature-resource-pool is deterministic and MUST NOT call AgentOrchestrator, BackendLlmGateway, Codex, or debate runtime.
  - included literature refs must be derived from the TitleCard evidence basket, not directly from ResourceSampleSet, SearchResult, or caller-supplied selected refs.
  - resource sampling and evidence-role decisions must be completed before this node and reflected through the evidence basket if they are relevant.
  - source_scope must remain explicit; normalized harness execution supports only title_card_evidence_basket while route-level enum compatibility may retain manual_selection and search_result.
  - snapshot hash must be derived from title_card_id, TopicSeed ref, source_scope, basket timestamp, literature refs, source refs, source health summary, and policy_version_id.
  - snapshot hash must not include repository-generated ids, control-plane ids, harness trace artifact ids, created_at, or created_by.
  - repeated equivalent runs may create distinct snapshot authorities, but content equivalence must be visible through the same snapshot_hash.
  - missing literature records must become source-health/blocker diagnostics, not silent omission.
  - key-content, abstract, source-count, pipeline-readiness, stale/duplicate, and fulltext-readiness issues are diagnostic warnings at this node unless they also break traceability.
  - snapshot lineage must point to the TopicSeed and included literature/source refs.
  - downstream SearchPlan must consume the LiteratureResourcePoolSnapshot authority and must not infer resources from the current mutable evidence basket.
allowed_execution_modes: [none]
default_execution_mode: none
debate_trigger_policy: not_allowed
profile_escalation_policy_ref: not_applicable
input_contract_refs:
  - CreateLiteratureResourcePoolSnapshotInput
  - TopicSelectionTopicSeedRecord
  - TitleCardEvidenceBasket
output_contract_refs:
  - TopicSelectionLiteratureResourcePoolSnapshotRecord
authority_write_boundary:
  route: POST /topic-selection/v1a/literature-resource-pool-snapshots
  controller: TopicSelectionV1aController.createLiteratureResourcePoolSnapshot
  domain_service: TopicSelectionSearchResourceService.createLiteratureResourcePoolSnapshot
  repository: TopicSelectionSearchResourceRepository.createLiteratureResourcePoolSnapshot
  workflow_harness_runner: TopicSelectionWorkflowHarnessService.runSnapshotLiteratureResourcePoolScenario
  authority_objects:
    - TopicSelectionLiteratureResourcePoolSnapshot
  workflow_harness_direct_write: false
  agent_orchestrator_direct_write: false
  debate_executor_direct_write: false
automation_callability:
  status: callable
  target_runner: TopicSelectionWorkflowHarnessService.runSnapshotLiteratureResourcePoolScenario
  stable_input_type: TopicSelectionWorkflowHarnessSnapshotLiteratureResourcePoolNodeInput
  stable_result_type: TopicSelectionWorkflowHarnessSnapshotLiteratureResourcePoolNodeResult
  script_local_choreography_required: false
  blocked_result_shape: true
  trace_artifact: WorkflowHarnessSnapshotLiteratureResourcePoolScenarioTrace@v1
  remaining_gaps: []
audit_artifact_policy:
  must_record:
    - control-plane input snapshot with TopicSeed, evidence-basket-derived literature refs, and source refs.
    - readiness gate result for topic-selection.literature-snapshot-ready.
    - transition attempt for topic-seed-to-literature-snapshot.
    - snapshot_hash.
    - source_health_summary.
    - harness trace artifact using WorkflowHarnessSnapshotLiteratureResourcePoolScenarioTrace@v1 once normalized.
  must_not_record:
    - hidden reasoning.
    - provider secrets.
    - raw provider logs.
    - raw LLM transcript.
    - raw debate transcripts.
failure_semantics:
  invalid_payload: return INVALID_PAYLOAD before authority creation.
  missing_topic_seed: return NOT_FOUND.
  lineage_conflict: return VERSION_CONFLICT.
  unsupported_source_scope_for_normalized_v1a: return blocked harness result with UNSUPPORTED_SOURCE_SCOPE_FOR_NORMALIZED_V1A before authority creation.
  unresolved_literature_record: return blocked harness result with MISSING_LITERATURE_RECORD before authority creation.
  downstream_handoff_conflict: downstream SearchPlan must block with VERSION_CONFLICT if the supplied snapshot authority does not match TopicSeed/title-card lineage.
  empty_source_scope: block with GATE_CONSTRAINT_FAILED.
  gate_or_transition_failed: block before repository persistence.
  repository_failure: fail the node attempt without creating downstream v1a authority.
```

### `topic-selection.v1a.create-search-plan.v1`
```yaml
policy_status: draft
node_id: topic-selection.v1a.create-search-plan.v1
authority_object: TopicSelectionSearchPlan
locked_decisions:
  N3-D01:
    status: locked
    summary: SearchPlan authority materialization boundary only.
    semantic_boundary:
      - The node only materializes a caller-supplied SearchPlan blueprint as TopicSelectionSearchPlan plus TopicSelectionCoverageRowIntent authorities.
      - The node MUST NOT execute retrieval.
      - The node MUST NOT build EvidenceMap.
      - The node MUST NOT judge evidence roles or evidence polarity.
      - The node MUST NOT generate research content.
      - The node MUST NOT call AgentOrchestrator, BackendLlmGateway, provider LLMs, Codex, or debate runtime.
    normalized_resource_truth:
      - The normalized harness path consumes the LiteratureResourcePoolSnapshot authority produced by Node 2.
      - The normalized harness path MUST NOT re-read the mutable TitleCard evidence basket, ResourceSampleSet, caller-supplied selected literature refs, or current search results as resource truth.
    normalized_coverage_policy:
      - Explicit coverage_intents are required in the normalized harness input.
      - Service/route compatibility behavior that derives support-only coverage rows from query_intents MAY remain.
      - Compatibility default coverage MUST NOT be treated as normalized automated v1a behavior.
  N3-D02:
    status: locked
    summary: SearchPlan blueprint is a module-level explicit upstream input, not generated by Node 3.
    blueprint_source_policy:
      - Node 3 validates and materializes a supplied SearchPlan blueprint.
      - Node 3 MUST NOT generate a SearchPlan blueprint from TopicSeed, LiteratureResourcePoolSnapshot, TitleCard, ResourceSampleSet, selected literature refs, or search results.
      - Node 3 MUST NOT call a model-like executor to draft the blueprint.
    module_contract_policy:
      - TopicSelectionSearchPlanBlueprint is a topic-selection module-level value contract.
      - The minimum blueprint contract must be defined once and reused by Node 3, WorkflowScenario fixtures, human/Codex-assisted inputs, and any future blueprint-generation node.
      - Node 3 must not define or accept a node-private incompatible blueprint variant.
      - The blueprint is not a standalone authority object in the initial normalization slice; it is frozen in Node 3 input snapshot and harness trace.
    allowed_blueprint_origins:
      - WorkflowScenario or test fixture.
      - Human-authored local input.
      - Codex-assisted local drafting before node invocation.
      - Future separately defined upstream blueprint-generation node.
    provenance_policy:
      - Blueprint origin MAY be recorded as provenance refs or trace metadata.
      - Provenance refs do not become resource truth and do not replace the LiteratureResourcePoolSnapshot authority.
    future_generation_boundary:
      - Automatic blueprint generation requires a separate node such as topic-selection.v1a.draft-search-plan-blueprint.v1.
      - That node must define its own execution mode, model policy, input context, output contract, and verification before Node 3 consumes its result.
  N3-D03:
    status: locked
    summary: TopicSelectionSearchPlanBlueprint@v1 minimum module contract.
    blueprint_minimum_fields:
      - schema_version.
      - blueprint_origin.
      - blueprint_provenance_refs.
      - title_card_ref.
      - topic_seed_ref.
      - literature_resource_pool_snapshot_ref.
      - expected_snapshot_hash.
      - plan_version.
      - parent_search_plan_ref.
      - recheck_request_ref.
      - query_intents.
      - coverage_intents.
      - must_check_constraints.
      - exclusion_rules.
      - coverage_strategy.
      - role_coverage_expectation.
      - policy_version.
      - output_schema_version.
    coverage_intent_required_fields:
      - coverage_key.
      - intent_type.
      - query.
      - rationale.
      - required.
      - priority.
      - expected_evidence_role.
      - target_source_types.
      - refs.
    coverage_intent_optional_empty_arrays:
      - target_source_types.
      - refs.
    consumer_fit_review:
      - Node 3 maps the blueprint to CreateSearchPlanInput and coverage row authorities.
      - Node 4 uses persisted coverage row ids and semantics for observations, bindings, assessments, and risk acceptances.
      - EvidenceMap preserves coverage_row_intent_ref lineage from SearchRun bindings.
      - NeedCandidate generation consumes EvidenceMap role bundles and does not need blueprint internals.
      - Future blueprint-generation nodes can produce the same contract without adding a parallel shape.
  N3-D04:
    status: locked
    summary: SearchPlanBlueprint draft/review model profile policy with Codex default.
    node_boundary:
      - topic-selection.v1a.create-search-plan.v1 remains deterministic with execution_mode=none.
      - Blueprint draft/review profiles run before Node 3 and do not write SearchPlan authority.
      - Model-like blueprint output must pass TopicSelectionSearchPlanBlueprint@v1 schema validation and Node 3 deterministic validators before authority creation.
    execution_modes:
      default_execution_mode: codex_assisted
      allowed_execution_modes:
        - codex_assisted
        - provider_llm
        - mocked_llm
      mocked_llm_scope: test_and_acceptance_only
      provider_llm_scope: explicit_operator_upgrade_or_provider_quality_scenario
    draft_profile:
      profile_id: topic-selection.search-plan-blueprint.draft.v1
      profile_function: search_plan_blueprint_drafting
      role_family: single_agent
      stage_family: blueprint_draft
      output_contract: TopicSelectionSearchPlanBlueprint@v1
      default_execution_mode: codex_assisted
      normalized_params:
        creativity: medium
        reasoning_depth: high
        output_budget: large
        structured_output_required: true
        output_format: json_schema
      model_options:
        - option_id: topic-selection.search-plan-blueprint.draft.v1.openai-balanced
          option_purpose: default_balanced_provider_run
          provider_id: openai
          model_id: gpt-5.4-mini
          timeout_ms: 120000
        - option_id: topic-selection.search-plan-blueprint.draft.v1.openai-high-accuracy
          option_purpose: high_accuracy_explicit_provider_run
          provider_id: openai
          model_id: gpt-5.5
          timeout_ms: 180000
        - option_id: topic-selection.search-plan-blueprint.draft.v1.dashscope-budget
          option_purpose: budget_sensitive_explicit_provider_run
          provider_id: dashscope
          model_id: qwen3.6-plus
          timeout_ms: 120000
          provider_overrides:
            enable_thinking: true
    review_profile:
      profile_id: topic-selection.search-plan-blueprint.review.v1
      profile_function: search_plan_blueprint_review
      role_family: single_agent
      stage_family: blueprint_review
      output_contract: TopicSelectionSearchPlanBlueprintReview@v1
      default_execution_mode: codex_assisted
      normalized_params:
        creativity: low
        reasoning_depth: high
        output_budget: medium
        structured_output_required: true
        output_format: json_schema
      model_options:
        - option_id: topic-selection.search-plan-blueprint.review.v1.openai-balanced
          option_purpose: default_balanced_provider_run
          provider_id: openai
          model_id: gpt-5.4-mini
          timeout_ms: 90000
        - option_id: topic-selection.search-plan-blueprint.review.v1.openai-high-accuracy
          option_purpose: high_accuracy_explicit_provider_run
          provider_id: openai
          model_id: gpt-5.5
          timeout_ms: 150000
        - option_id: topic-selection.search-plan-blueprint.review.v1.dashscope-budget
          option_purpose: budget_sensitive_explicit_provider_run
          provider_id: dashscope
          model_id: qwen3.6-plus
          timeout_ms: 120000
          provider_overrides:
            enable_thinking: true
    fallback_and_audit:
      automatic_provider_fallback: false
      manual_rerun_allowed: true
      explicit_model_option_override_allowed: true
      codex_source_kind: codex_response
      provider_source_kind: provider_response
      store_raw_provider_response: false
      forbid_hidden_reasoning: true
      deepseek_status: not_available_until_registered_provider
  N3-D05:
    status: locked
    summary: WorkflowHarness normalized runner contract blocks permissive fallback semantics.
    runner_contract:
      target_runner: TopicSelectionWorkflowHarnessService.runCreateSearchPlanScenario
      implementation_status: implemented
      normalized_input_contract:
        - TopicSelectionSearchPlanBlueprint@v1.
        - scenario_id.
        - scenario_case_id.
        - workspace_id.
        - workflow_run_id.
        - node_attempt_id.
        - created_by.
      normalized_result_contract:
        success:
          - status=succeeded.
          - search_plan_ref.
          - coverage_row_intent_refs.
          - plan_version.
          - query_intents.
          - must_check_constraints.
          - exclusion_rules.
          - control_plane_refs.
          - workflow_run_ref.
          - harness_trace_artifact_ref.
        blocked:
          - status=blocked.
          - blocker_codes.
          - normalized node_input.
          - no TopicSelectionSearchPlan authority refs.
          - no TopicSelectionCoverageRowIntent authority refs.
          - harness_trace_artifact_ref when trace recording is available.
    strict_pre_service_validation:
      - topic_seed_ref and literature_resource_pool_snapshot_ref must be concrete refs with versions and matching title_card_id.
      - resolved TopicSeed must belong to title_card_id.
      - resolved LiteratureResourcePoolSnapshot must belong to title_card_id and trace to the resolved TopicSeed.
      - expected_snapshot_hash must equal the resolved LiteratureResourcePoolSnapshot.snapshot_hash.
      - query_intents must be present and non-empty after normalization.
      - coverage_intents must be explicitly present and non-empty after normalization.
      - every coverage_intent must include coverage_key, intent_type, query, rationale, required, priority, expected_evidence_role, target_source_types, and refs.
      - target_source_types and refs may be empty arrays but must not be omitted.
    fallback_policy:
      route_service_compatibility_fallback_allowed: true
      normalized_harness_fallback_allowed: false
      forbidden_in_normalized_harness:
        - deriving coverage rows from query_intents.
        - defaulting expected_evidence_role to support.
        - defaulting coverage_key from row index.
        - defaulting priority from row index.
        - defaulting rationale to a generated generic sentence.
        - accepting omitted target_source_types or refs.
    authority_write_boundary:
      authority_service: TopicSelectionSearchResourceService.createSearchPlan
      direct_repository_write_allowed: false
      partial_authority_allowed_on_blocked_result: false
    trace_contract:
      trace_schema: WorkflowHarnessCreateSearchPlanScenarioTrace@v1
      trace_must_record:
        - scenario_id.
        - node_id.
        - workflow_run_id.
        - node_attempt_id.
        - normalized node_input.
        - normalized node_result.
        - blueprint_origin.
        - blueprint_provenance_refs.
        - expected_snapshot_hash.
        - resolved_snapshot_hash.
        - query_intents.
        - coverage_intents.
        - search_plan_ref.
        - coverage_row_intent_refs.
        - control_plane_refs.
        - blocker_codes.
        - warning_codes.
        - assertions.
      trace_must_not_record:
        - hidden reasoning.
        - provider secrets.
        - raw provider logs.
        - raw LLM transcript.
        - raw debate transcript.
  N3-D06:
    status: locked
    summary: Implementation readiness and callable promotion for strict SearchPlan runner.
    implementation_readiness_review:
      status: implemented_callable
      complexity: moderate_bounded
      rationale:
        - Existing route, service, repository, control-plane workflow, gate, transition, and coverage-row persistence paths are reused.
        - No DB migration, provider LLM, Codex runtime, debate runtime, or new route is required.
        - The new behavior is isolated in WorkflowHarness strict pre-service validation, blueprint snapshot freezing, and trace assembly.
      closed_implementation_gaps:
        - TopicSelectionSearchPlanBlueprint@v1 shared contract and JSON schema added.
        - runCreateSearchPlanScenario implemented.
        - Strict blueprint schema, lineage, snapshot-hash, query-intent, coverage-intent, and fallback-blocking validators implemented.
        - WorkflowHarnessCreateSearchPlanScenarioTrace@v1 trace artifact implemented.
        - Full SearchPlan blueprint is frozen in normalized node input, service input snapshot, and harness trace.
        - TopicSeed intent preparation provenance refs can be recorded without changing Node 1 execution mode.
        - ResourceSampleSet provenance refs can be recorded for Node 2 without changing snapshot resource truth or snapshot_hash.
      callable_promotion_evidence:
        - successful strict-blueprint SearchPlan creation test passes.
        - malformed blueprint schema version blocked test passes.
        - missing blueprint blocked test passes.
        - snapshot hash drift blocked test passes.
        - omitted coverage intents blocked test passes.
        - fallback-derived coverage semantics blocked test passes.
        - lineage mismatch blocked test passes.
        - blocked paths return no SearchPlan or CoverageRow authority refs.
    automation_callability:
      status: callable
      runner: TopicSelectionWorkflowHarnessService.runCreateSearchPlanScenario
      stable_node_input: TopicSelectionWorkflowHarnessCreateSearchPlanNodeInput
      stable_node_result: TopicSelectionWorkflowHarnessCreateSearchPlanNodeResult
      trace_artifact: WorkflowHarnessCreateSearchPlanScenarioTrace@v1
      script_local_choreography_required: false
preconditions:
  - topic_seed_id resolves under title_card_id.
  - literature_resource_pool_snapshot_id resolves under title_card_id.
  - snapshot.topic_seed_ref matches the requested TopicSeed.
  - supplied snapshot_hash expectation matches the resolved LiteratureResourcePoolSnapshot.
  - SearchPlan blueprint is explicitly supplied by the caller.
  - SearchPlan blueprint schema_version is exactly TopicSelectionSearchPlanBlueprint@v1.
  - SearchPlan blueprint satisfies TopicSelectionSearchPlanBlueprint@v1.
  - query_intents are non-empty after normalization.
  - coverage_intents are explicitly supplied and non-empty after normalization.
blocking_conditions:
  - missing TopicSeed or LiteratureResourcePoolSnapshot returns NOT_FOUND.
  - TopicSeed/Snapshot/title-card lineage mismatch returns VERSION_CONFLICT.
  - snapshot_hash mismatch returns VERSION_CONFLICT before SearchPlan authority creation.
  - missing SearchPlan blueprint blocks before SearchPlan authority creation.
  - malformed SearchPlan blueprint blocks before SearchPlan authority creation.
  - empty or blank query intent blocks with GATE_CONSTRAINT_FAILED.
  - empty or blank coverage intent blocks with GATE_CONSTRAINT_FAILED.
  - missing coverage intent required field blocks with INVALID_PAYLOAD before SearchPlan authority creation.
  - omitted coverage_intents in the normalized harness path blocks before SearchPlan authority creation.
  - deterministic gate topic-selection.search-plan-ready failure blocks before repository persistence.
  - transition literature-snapshot-to-search-plan failure blocks before repository persistence.
deterministic_validators:
  - create-search-plan is deterministic in the current v1a normalization slice.
  - future model-like SearchPlan drafting requires an explicit T-089 policy update before implementation.
  - SearchPlan blueprint generation is out of scope for this node.
  - SearchPlanBlueprint draft/review model profiles are upstream blueprint-production or review aids, not Node 3 executors.
  - SearchPlan blueprint validation uses the module-level TopicSelectionSearchPlanBlueprint@v1 contract.
  - normalized harness coverage row intents must come from explicit coverage_intents, not from service fallback defaults.
  - each coverage row must preserve expected evidence role, query, priority, required flag, and refs.
  - must-check constraints and exclusion rules must be persisted with SearchPlan.
  - workflow profile remains deterministic-contract unless a future policy version changes it.
allowed_execution_modes: [none]
default_execution_mode: none
debate_trigger_policy: not_allowed
profile_escalation_policy_ref: not_applicable
input_contract_refs:
  - TopicSelectionSearchPlanBlueprint
  - CreateSearchPlanInput
  - TopicSelectionTopicSeedRecord
  - TopicSelectionLiteratureResourcePoolSnapshotRecord
  - TopicSelectionCoverageRowIntentRecord input shape
output_contract_refs:
  - TopicSelectionSearchPlanRecord
  - TopicSelectionCoverageRowIntentRecord
authority_write_boundary:
  route: POST /topic-selection/v1a/search-plans
  controller: TopicSelectionV1aController.createSearchPlan
  domain_service: TopicSelectionSearchResourceService.createSearchPlan
  repository: TopicSelectionSearchResourceRepository.createSearchPlanWithCoverageIntents
  authority_objects:
    - TopicSelectionSearchPlan
    - TopicSelectionCoverageRowIntent
  agent_orchestrator_direct_write: false
  debate_executor_direct_write: false
audit_artifact_policy:
  must_record:
    - control-plane input snapshot with TopicSeed, Snapshot refs, and complete TopicSelectionSearchPlanBlueprint@v1 payload.
    - deterministic workflow run for topic-selection.search-plan-draft.
    - readiness gate result for topic-selection.search-plan-ready.
    - transition attempt for literature-snapshot-to-search-plan.
    - coverage row count and artifact refs.
    - harness trace artifact once normalized.
  must_not_record:
    - hidden reasoning.
    - provider secrets.
    - raw provider logs.
    - raw debate transcripts.
failure_semantics:
  invalid_payload: return INVALID_PAYLOAD before authority creation.
  missing_upstream_ref: return NOT_FOUND.
  lineage_conflict: return VERSION_CONFLICT.
  snapshot_hash_mismatch: return VERSION_CONFLICT before authority creation.
  missing_blueprint: block before authority creation.
  coverage_gap: block with GATE_CONSTRAINT_FAILED before repository persistence.
  gate_or_transition_failed: block before repository persistence.
  repository_failure: fail the node attempt without partial SearchPlan/CoverageRow authority semantics.
```

### `topic-selection.v1a.record-search-run.v1`
```yaml
policy_status: draft
node_id: topic-selection.v1a.record-search-run.v1
authority_object: TopicSelectionSearchRun
preconditions:
  - search_plan_id resolves under title_card_id.
  - SearchPlan resolves to its LiteratureResourcePoolSnapshot.
  - coverage observations, evidence bindings, assessments, and risk acceptances refer only to rows under the SearchPlan.
  - evidence_map_input_refs are non-empty when the run is intended to feed EvidenceMap.
blocking_conditions:
  - missing SearchPlan or LiteratureResourcePoolSnapshot returns NOT_FOUND.
  - SearchPlan/Snapshot/title-card lineage mismatch returns VERSION_CONFLICT.
  - coverage record outside SearchPlan rows returns VERSION_CONFLICT.
  - run_status failed blocks downstream EvidenceMap construction.
  - deterministic gate or transition failure blocks before repository persistence.
deterministic_validators:
  - record-search-run is deterministic and MUST NOT call AgentOrchestrator, BackendLlmGateway, Codex, or debate runtime.
  - result accounting must be explicit for total, unique, duplicate, failed, and skipped counts.
  - evidence bindings must cite coverage row ids under the SearchPlan.
  - evidence_map_input_refs must include all refs needed by later EvidenceMap units.
  - source health warnings must remain visible in the SearchRun result and harness trace.
allowed_execution_modes: [none]
default_execution_mode: none
debate_trigger_policy: not_allowed
profile_escalation_policy_ref: not_applicable
input_contract_refs:
  - RecordSearchRunInput
  - TopicSelectionSearchPlanRecord
  - TopicSelectionLiteratureResourcePoolSnapshotRecord
  - TopicSelectionCoverageRowIntentRecord
output_contract_refs:
  - TopicSelectionSearchRunRecord
  - TopicSelectionCoverageExecutionObservationRecord
  - TopicSelectionCoverageEvidenceBindingRecord
  - TopicSelectionCoverageAssessmentRecord
  - TopicSelectionCoverageRiskAcceptanceRecord
authority_write_boundary:
  route: POST /topic-selection/v1a/search-runs
  controller: TopicSelectionV1aController.recordSearchRun
  domain_service: TopicSelectionSearchResourceService.recordSearchRun
  repository: TopicSelectionSearchResourceRepository.createSearchRunWithCoverageRecords
  authority_objects:
    - TopicSelectionSearchRun
    - TopicSelectionCoverageExecutionObservation
    - TopicSelectionCoverageEvidenceBinding
    - TopicSelectionCoverageAssessment
    - TopicSelectionCoverageRiskAcceptance
  agent_orchestrator_direct_write: false
  debate_executor_direct_write: false
audit_artifact_policy:
  must_record:
    - control-plane input snapshot with SearchPlan, Snapshot, and evidence input refs.
    - workflow/search-run trace once normalized.
    - result accounting summary.
    - source health summary.
    - coverage observation and assessment summary.
    - harness trace artifact once normalized.
  must_not_record:
    - hidden reasoning.
    - provider secrets.
    - raw provider logs.
    - raw debate transcripts.
failure_semantics:
  invalid_payload: return INVALID_PAYLOAD before authority creation.
  missing_upstream_ref: return NOT_FOUND.
  lineage_conflict: return VERSION_CONFLICT.
  coverage_record_conflict: return VERSION_CONFLICT before repository persistence.
  failed_run: persist failed SearchRun only when current service policy allows it, but block downstream EvidenceMap scenario.
  gate_or_transition_failed: block before repository persistence.
  repository_failure: fail the node attempt without partial SearchRun/CoverageRecord authority semantics.
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
