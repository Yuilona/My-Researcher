# v1a WorkflowHarness Normalization

## Decision
- Decision type: `REUSE_TASK`
- Owner task: `T-088 topic-selection-workflow-runtime-foundation`
- Semantic source: `T-089 topic-selection-agent-workflow-review`
- Scope: complete v1a product workflow after an upstream TitleCard exists.
- Excluded from this slice: title-card creation, resource sampling, v1b, v1c, bridge, downstream, and desktop UI.

This slice exists because v1a is currently business-clear and route-testable, but only `topic-selection.v1a.generate-need-candidate.v1` has the normalized `WorkflowHarness` execution standard needed for automated orchestration.

Important correction: the complete v1a workflow starts at `TopicSeed`. The earlier evidence-map-first view described only the evidence-to-need subchain and would leave TopicSeed, resource-pool snapshot, SearchPlan, and SearchRun choreography in scripts.

## Target Standard
Every normalized v1a node MUST be callable by an orchestrator without knowing route choreography.

Each node runner MUST expose:
- `scenario_id`
- `scenario_case_id`
- `node_id`
- `workflow_run_id`
- `node_attempt_id`
- `workspace_id`
- `title_card_id`
- versioned input refs
- normalized node input
- normalized node result
- `scenario_status`
- `authority_refs`
- `artifact_refs`
- `audit_refs`
- `warning_codes`
- `blocker_codes`
- assertion results
- harness trace artifact

Each node runner MUST preserve existing authority boundaries:
- Domain services and repositories write authority objects.
- `WorkflowHarness` coordinates, validates, traces, and asserts.
- `AgentOrchestrator` is used only for model-like nodes allowed by the node policy.
- Deterministic and human-review nodes MUST NOT call provider, Codex, or debate runtime.

Each node result MUST have stable shape across success, blocked, and require-human-review paths. Mode differences belong in provenance, not alternate DTOs.

## Automation Callability Rubric
Every v1a node is evaluated on a separate automation-callability dimension.

The accepted statuses are:
- `not_callable`: route/service may exist, but automated execution still requires script-owned request choreography.
- `partially_callable`: the service boundary is clear, but no normalized harness runner or stable blocked result exists.
- `callable`: a `WorkflowHarness` runner exists with stable input/result, success and blocked paths, assertions, trace artifact, and preserved authority-write boundary.
- `blocked`: the node cannot safely be automated because its authority boundary or input contract is still ambiguous.

A node can be `implementation_ready` but still `not_callable`. That means we can implement its runner next, not that automation is already complete.

## Complete v1a Node Inventory

| Order | Node | Policy status | Automation callability | Target runner |
|---:|---|---|---|---|
| 1 | `topic-selection.v1a.create-topic-seed.v1` | `implementation_ready` | `callable` | `runCreateTopicSeedScenario` |
| 2 | `topic-selection.v1a.snapshot-literature-resource-pool.v1` | `implementation_ready` | `callable` | `runSnapshotLiteratureResourcePoolScenario` |
| 3 | `topic-selection.v1a.create-search-plan.v1` | `implementation_ready` | `callable` | `runCreateSearchPlanScenario` |
| 4 | `topic-selection.v1a.record-search-run.v1` | `draft` | `not_callable` | `runRecordSearchRunScenario` |
| 5 | `topic-selection.v1a.build-evidence-map.v1` | `implementation_ready` | `partially_callable` | `runBuildEvidenceMapScenario` |
| 6 | `topic-selection.v1a.generate-need-candidate.v1` | `implementation_ready` | `callable` | keep as baseline |
| 7 | `topic-selection.v1a.validate-need-adjudication.v1` | `implementation_ready` | `not_callable` | `runValidateNeedAdjudicationScenario` |
| 8 | `topic-selection.v1a.human-confirm-need.v1` | `implementation_ready` | `not_callable` | `runHumanConfirmNeedScenario` |
| 9 | `topic-selection.v1a.publish-v1b-input-bundle.v1` | `implementation_ready` | `not_callable` | `runPublishV1bInputBundleScenario` |

Resource sampling is intentionally not listed as a v1a node. It remains the v1a input layer and should be normalized separately after its policy moves beyond draft.

TitleCard creation is also not listed as a v1a node. The v1a harness consumes an existing TitleCard and starts by creating a TopicSeed from it.

## Node 1: Create Topic Seed

### Automation Goal
Convert `POST /topic-selection/v1a/topic-seeds/from-title-card` from script-owned setup into the first normalized v1a node.

### Locked Decisions
- N1-AM01: TopicSeed LLM boundary amendment. `topic-selection.v1a.create-topic-seed.v1` remains deterministic with `execution_mode=none`; it MUST NOT call AgentOrchestrator, BackendLlmGateway, Codex, provider LLMs, or debate runtime.
- N1-AM01: Optional semantic preparation before Node 1 MAY draft `intent_summary` and `scope_notes` through human input, Codex, provider LLM, or fixture, but this is input preparation only.
- N1-AM01: A future `TopicSeedIntentDraft@v1` helper MAY be introduced as a pre-node value artifact/profile. It MUST NOT write `TopicSelectionTopicSeed` authority and MUST NOT be recorded as an N3 follow-up decision.
- N1-AM01: Current implementation locks no executable TopicSeed draft/review profile. Node 1 freezes only the final accepted input in its input snapshot.

### Node Input
MUST include:
- `title_card_ref`
- title-card version or currentness token when available
- `intent_summary`
- `scope_notes`
- `seed_version`
- policy version
- output schema version

### Node Result
MUST include:
- `topic_seed_ref`
- `topic_seed_id`
- `seed_version`
- title-card lineage refs
- control-plane input snapshot ref
- workflow run ref
- gate result ref
- transition ref
- harness trace artifact ref

### Acceptance Checks
- missing or stale TitleCard blocks before authority creation.
- empty final intent blocks before authority creation.
- `scope_notes` may be null, but null must remain explicit in the input snapshot.
- `seed_kind` is fixed to `title_card` by the service and is not accepted as caller input.
- duplicate/idempotency behavior is explicit in the runner result, not inferred by script retry behavior.
- no model-like executor is allowed.
- successful result can feed resource-pool snapshot without script-side ref repair.

## Node 2: Snapshot Literature Resource Pool

### Automation Goal
Make the resource-pool snapshot a stable v1a authority boundary rather than an implicit script step.

### Locked Decisions
- N2-D01: This node only materializes `TopicSelectionLiteratureResourcePoolSnapshot`; it MUST NOT perform sampling, selection, evidence-role classification, or evidence-polarity judgment.
- N2-D02: The normalized v1a path uses the TitleCard evidence basket as the single source of included literature. A `ResourceSampleSet` MAY appear as upstream provenance only after its selected literature has already been attached to the evidence basket.
- N2-D03: The normalized harness path supports only `source_scope=title_card_evidence_basket`. Route/shared-contract compatibility values `manual_selection` and `search_result` remain non-normalized and MUST return a blocked harness result until explicit resolvers are designed.
- N2-D04: The node blocks only traceability/authority-creation failures. Resource maturity gaps such as incomplete key content, abstract, source count, pipeline readiness, stale/duplicate status, or fulltext readiness are recorded as `source_health_summary.warning_codes` unless they also break traceability.
- N2-D05: `snapshot_hash` is the replay identity for snapshot contents and source-health state. It MUST include stable content inputs and policy version, and MUST exclude repository-generated ids, control-plane ids, trace artifact ids, `created_at`, and `created_by`.
- N2-D06: The target automation boundary is `TopicSelectionWorkflowHarnessService.runSnapshotLiteratureResourcePoolScenario`. The runner MUST call `TopicSelectionSearchResourceService.createLiteratureResourcePoolSnapshot`, MUST NOT write repositories directly, and MUST return one normalized success/blocked result shape.
- N2-D07: Control-plane records are authoritative audit facts; harness trace artifact `WorkflowHarnessSnapshotLiteratureResourcePoolScenarioTrace@v1` is automation execution evidence. The trace MUST cross-reference control-plane refs but MUST NOT replace them.
- N2-D08: SearchPlan handoff is snapshot-authority based. Node 3 MUST consume the `LiteratureResourcePoolSnapshot` produced by Node 2 and MUST NOT re-read the mutable TitleCard evidence basket, `ResourceSampleSet`, selected refs, or current search results as resource truth.
- N2-D09: Repeated equivalent runs are append-only by default. They MAY create distinct snapshot authority ids, but MUST keep the same `snapshot_hash`; automatic reuse by hash requires a future explicit policy and runner flag.
- N2-D10: Implementation readiness is accepted as `implementation_ready` with moderate bounded complexity. Automation is now `callable` after runner, trace schema, service hardening, and tests were implemented.
- N2-AM01: Literature resource pool snapshot LLM boundary confirmation. Node 2 remains deterministic with `execution_mode=none`; it MUST NOT call AgentOrchestrator, BackendLlmGateway, Codex, provider LLMs, or debate runtime.
- N2-AM01: Resource sampling, evidence-role classification, evidence-polarity judgment, and other semantic decisions belong upstream before the evidence basket is frozen or downstream after snapshot handoff; Node 2 only snapshots traceable resource state.

### Node Input
MUST include:
- `title_card_ref`
- `topic_seed_ref`
- `source_scope`, fixed to `title_card_evidence_basket` for normalized harness execution
- evidence-basket ref or basket currentness expectation
- optional resource sample set provenance ref, which MUST NOT directly drive included literature refs
- source readiness expectations
- policy version
- output schema version

### Node Result
MUST include:
- `literature_resource_pool_snapshot_ref`
- `snapshot_version`
- `snapshot_hash`
- included resource refs
- excluded or unavailable resource refs with reason codes
- source scope
- control-plane refs
- harness trace artifact ref
- downstream handoff packet containing snapshot ref, version, hash, source scope, literature refs, content source refs, and source-health summary

Blocked results MUST include:
- `status=blocked`
- `blocker_codes`
- normalized node input
- no `TopicSelectionLiteratureResourcePoolSnapshot` authority refs
- harness trace artifact ref when trace recording is available

### Acceptance Checks
- TopicSeed title-card lineage mismatch blocks.
- included resource refs are derived from the TitleCard evidence basket, not directly from caller-supplied selected refs or ResourceSampleSet contents.
- `manual_selection` or `search_result` source scopes return `UNSUPPORTED_SOURCE_SCOPE_FOR_NORMALIZED_V1A` in the harness path.
- unresolved evidence-basket literature ids return `MISSING_LITERATURE_RECORD` before snapshot authority creation.
- missing-literature blocked results preserve the control-plane input snapshot, readiness gate, and transition attempt refs created before repository persistence is skipped.
- `topic_seed_ref` must be a concrete TopicSeed authority ref with version and title-card lineage before snapshot authority creation.
- resources outside the allowed source scope block.
- key-content, abstract, source-count, pipeline-readiness, stale/duplicate, and fulltext-readiness gaps are represented as source-health warnings, not hard blockers, unless traceability fails.
- same TopicSeed, same evidence basket state, same source scope, same source health summary, and same policy version produce the same `snapshot_hash`.
- repeated runs with different control-plane ids or harness trace artifact ids do not change `snapshot_hash`.
- repeated equivalent runs may create new snapshot authority refs, but must keep distinct audit/control-plane evidence for each attempt.
- runner does not silently reuse an existing snapshot authority by `snapshot_hash`.
- runner calls the search-resource domain service and does not write the repository directly.
- runner can be invoked as a single node without script-side request choreography or downstream ref repair.
- harness trace artifact records normalized input/result, snapshot hash, source-health summary, authority refs, control-plane refs, blockers, warnings, and assertions.
- harness trace artifact does not record hidden reasoning, secrets, provider logs, raw LLM transcripts, or raw debate transcripts.
- SearchPlan handoff uses the snapshot authority ref; `snapshot_hash` is only a replay/assertion check and does not replace the snapshot ref.
- if the evidence basket changes after snapshot creation, the changed resources can affect SearchPlan only after a new LiteratureResourcePoolSnapshot is created.
- no provider, Codex, or debate runtime is allowed.
- successful result can feed SearchPlan without script-side ref repair.

### Implementation Readiness Review
Decision: `implementation_ready`, `automation_callability=callable`.

Complexity is moderate and bounded because the node is deterministic, has an existing route/service/repository authority path, and reuses the control-plane gate/transition pattern. The implementation does not require model routing, provider calls, debate runtime, schema migration, or new persistence objects.

Implementation risks are explicit and testable:
- align `snapshot_hash` with the locked content replay payload;
- expand `source_health_summary.warning_codes` for maturity warnings without adding hard blockers;
- add `runSnapshotLiteratureResourcePoolScenario` with stable success/blocked result shapes;
- record `WorkflowHarnessSnapshotLiteratureResourcePoolScenarioTrace@v1`;
- prove append-only repeated runs keep the same hash for equivalent content;
- prove SearchPlan handoff uses snapshot authority, not mutable basket state.

Implementation result:
- `runSnapshotLiteratureResourcePoolScenario` is implemented.
- Service snapshot hash now includes TopicSeed ref, source scope, source-health summary, and policy version while excluding runtime ids.
- Source-health maturity warnings are surfaced without blocking traceable resources.
- Unsupported normalized harness source scopes block before authority creation.
- Success, unsupported scope, missing literature, blocked audit refs, non-concrete TopicSeed ref rejection, warning non-blocking, hash stability, append-only, and handoff behavior are covered by unit tests.

## Node 3: Create Search Plan

### Automation Goal
Normalize SearchPlan creation as the v1a coverage-planning node over TopicSeed and the resource-pool snapshot.

### Locked Decisions
- N3-D01: This node only materializes a caller-supplied SearchPlan blueprint as `TopicSelectionSearchPlan` plus `TopicSelectionCoverageRowIntent` authorities. It MUST NOT execute retrieval, build EvidenceMap, judge evidence roles, generate research content, call AgentOrchestrator, call provider LLMs, call Codex, or run debate.
- N3-D01: The normalized harness path MUST consume Node 2's `LiteratureResourcePoolSnapshot` authority as resource truth. It MUST NOT re-read the mutable TitleCard evidence basket, `ResourceSampleSet`, caller-supplied selected literature refs, or current search results as resource truth.
- N3-D01: The normalized harness path MUST require explicit coverage intents. The service/route compatibility behavior that derives support-only coverage rows from query intents MAY remain, but it MUST NOT be treated as the normalized automated v1a path.
- N3-D01: The runner input MUST carry concrete `topic_seed_ref`, concrete `literature_resource_pool_snapshot_ref`, expected `snapshot_hash`, explicit `query_intents`, explicit `coverage_intents`, must-check constraints, exclusion rules, policy version, and output schema version.
- N3-D02: `SearchPlan blueprint` is an explicit upstream input to Node 3. Node 3 MUST validate and materialize the blueprint, but MUST NOT generate it.
- N3-D02: Allowed blueprint origins are WorkflowScenario/test fixtures, human-authored or Codex-assisted local drafting, and a future separately defined upstream blueprint-generation node. These origins MAY be recorded as provenance refs, but they MUST NOT change Node 3 into a generation node.
- N3-D02: Any future automatic SearchPlan blueprint generation MUST be modeled as a separate node, such as `topic-selection.v1a.draft-search-plan-blueprint.v1`, with its own execution-mode/model policy before Node 3 consumes the result.
- N3-D02: `TopicSelectionSearchPlanBlueprint` is a topic-selection module-level value contract. Node 3 consumes and validates it, but the minimum blueprint contract MUST be defined once at module level and reused by scenario fixtures, human/Codex-assisted inputs, and any future blueprint-generation node.
- N3-D02: The blueprint is not a standalone authority object in the initial normalization slice; it is frozen through Node 3 normalized input, control-plane input snapshot, and harness trace.
- N3-D03: `TopicSelectionSearchPlanBlueprint@v1` minimum fields are locked at module level: schema version, origin/provenance, TitleCard ref, TopicSeed ref, LiteratureResourcePoolSnapshot ref, expected snapshot hash, optional plan/recheck lineage refs, query intents, coverage intents, constraints, exclusions, coverage strategy, role coverage expectation, policy version, and output schema version.
- N3-D03: Every coverage intent row MUST include `coverage_key`, `intent_type`, `query`, `rationale`, `required`, `priority`, `expected_evidence_role`, `target_source_types`, and `refs`. `target_source_types` and `refs` may be empty arrays but must be present after normalization.
- N3-D03: The module-level blueprint contract is sufficient for current consumers: Node 3 materialization, Node 4 coverage binding, EvidenceMap coverage lineage, NeedCandidate role-bundle consumption, and future blueprint producer output.
- N3-D04: SearchPlanBlueprint semantic drafting and review MAY use model-like execution before Node 3, but Node 3 remains deterministic and MUST NOT invoke AgentOrchestrator, provider LLMs, Codex, or debate.
- N3-D04: The default execution mode for blueprint draft/review is `codex_assisted`; `provider_llm` is an explicit operator upgrade or provider-quality scenario; `mocked_llm` is test/acceptance-only.
- N3-D04: Draft profile is `topic-selection.search-plan-blueprint.draft.v1` with default OpenAI `gpt-5.4-mini`, explicit high-accuracy OpenAI `gpt-5.5`, explicit budget DashScope `qwen3.6-plus`, normalized params `creativity=medium`, `reasoning_depth=high`, `output_budget=large`, `structured_output_required=true`, `output_format=json_schema`.
- N3-D04: Review profile is `topic-selection.search-plan-blueprint.review.v1` with the same provider options, normalized params `creativity=low`, `reasoning_depth=high`, `output_budget=medium`, `structured_output_required=true`, `output_format=json_schema`.
- N3-D04: Automatic provider fallback is disabled. Manual rerun or explicit model-option override is allowed only with new attempt provenance. DeepSeek is not available for this policy until registered in the provider registry.
- N3-D05: Normalized automation boundary is `TopicSelectionWorkflowHarnessService.runCreateSearchPlanScenario`. The runner consumes `TopicSelectionSearchPlanBlueprint@v1` plus scenario/run metadata, not a bare permissive `CreateSearchPlanInput`.
- N3-D05: The runner MUST validate strict blueprint semantics before calling the authority service: TopicSeed/Snapshot/TitleCard lineage, `expected_snapshot_hash`, non-empty `query_intents`, explicit non-empty `coverage_intents`, and every N3-D03 coverage-row field.
- N3-D05: Route/service compatibility fallback MAY remain for legacy/manual API callers, but normalized harness execution MUST NOT derive coverage rows, evidence roles, coverage keys, priorities, or rationales from fallback defaults.
- N3-D05: Authority writes remain delegated to `TopicSelectionSearchResourceService.createSearchPlan`; the runner MUST NOT write SearchPlan or CoverageRow repositories directly.
- N3-D05: The runner returns one normalized success/blocked result shape and records `WorkflowHarnessCreateSearchPlanScenarioTrace@v1`. Blocked results MUST expose blocker codes and MUST NOT contain SearchPlan or CoverageRow authority refs.
- N3-D06: Implementation readiness is accepted as `implementation_ready` and automation is now `callable`. `runCreateSearchPlanScenario`, `TopicSelectionSearchPlanBlueprint@v1`, strict schema/lineage/hash/fallback validators, full blueprint input-snapshot freezing, trace artifact recording, and focused success/blocked tests have landed.

### Node Input
MUST include:
- `title_card_ref`
- `topic_seed_ref`
- `literature_resource_pool_snapshot_ref`
- expected snapshot hash
- SearchPlan blueprint provenance refs when available
- query intents
- coverage intents
- must-check constraints
- exclusion rules
- expected evidence-role coverage
- coverage strategy
- policy version
- output schema version

### Node Result
MUST include:
- `search_plan_ref`
- `plan_version`
- coverage row refs
- query intent summary
- must-check constraints
- exclusion rules
- control-plane refs
- harness trace artifact ref
- full SearchPlan blueprint frozen in normalized node input, service input snapshot, and harness trace

### Acceptance Checks
- TopicSeed and snapshot lineage mismatch blocks.
- stale or mismatched snapshot hash blocks before SearchPlan authority creation.
- empty query intents or empty coverage intents block.
- missing SearchPlan blueprint blocks; Node 3 must not infer one from TopicSeed, Snapshot, TitleCard, ResourceSampleSet, or search results.
- Node 3 must validate the shared module-level `TopicSelectionSearchPlanBlueprint` contract, not a node-private blueprint variant.
- coverage intent rows missing any required blueprint field block before SearchPlan authority creation.
- malformed blueprint schema version blocks before SearchPlan authority creation.
- required evidence-role coverage is explicit and auditable.
- normalized harness input with omitted coverage intents blocks; it must not silently fall back to support-only coverage rows.
- normalized harness input with any coverage row relying on service fallback defaults blocks before SearchPlan authority creation.
- the service input snapshot preserves the complete `TopicSelectionSearchPlanBlueprint@v1`, including expected snapshot hash and role expectations.
- constraints and exclusions are persisted with the SearchPlan.
- no model-like executor is allowed unless a future T-089 policy explicitly changes this node.
- successful result can feed SearchRun without script-side ref repair.

## Node 4: Record Search Run

### Automation Goal
Normalize SearchRun recording as the authority boundary for planned search execution, result accounting, and evidence bindings.

### Node Input
MUST include:
- `title_card_ref`
- `search_plan_ref`
- `run_kind`
- `run_status`
- result accounting
- source health summary
- dedup summary
- evidence map input refs
- coverage observations
- evidence bindings
- coverage assessments
- policy version
- output schema version

### Node Result
MUST include:
- `search_run_ref`
- result accounting summary
- evidence binding refs
- coverage assessment summary
- coverage matrix summary when available
- control-plane refs
- harness trace artifact ref

### Acceptance Checks
- SearchPlan title-card lineage mismatch blocks.
- coverage observations and evidence bindings must refer to SearchPlan coverage rows.
- evidence-map input refs must be traceable to selected literature/source refs.
- result accounting must reconcile with bindings and dedup summary.
- failed or partial source health is surfaced as warning/blocker codes, not hidden in script output.
- successful result can feed EvidenceMap without script-side ref repair.

## Node 5: Build Evidence Map

### Automation Goal
Convert evidence-map creation from script-owned request assembly into a deterministic harness node.

### Node Input
MUST include:
- `search_run_ref`
- `search_plan_ref`
- `literature_snapshot_ref`
- selected literature refs
- evidence unit draft payload
- coverage row refs when present
- expected role counts or role minimums
- policy version
- output schema version

### Node Result
MUST include:
- `evidence_map_ref`
- persisted evidence unit refs
- role counts
- abstract-only support count
- control-plane input snapshot ref
- workflow run ref
- gate result ref
- transition ref
- lineage refs
- harness trace artifact ref

### Acceptance Checks
- malformed payload blocks before authority creation.
- stale SearchRun/SearchPlan/Snapshot refs block.
- source refs outside SearchRun evidence bindings block.
- `llm_inference` source attribution cannot become source-claim authority.
- abstract-only support is allowed only with an auditable issue marker.
- successful result can feed `generate-need-candidate` without script-side ref repair.

## Node 6: Generate Need Candidate

### Current Status
This node is the standard to match.

Existing runner:
- `TopicSelectionWorkflowHarnessService.runGenerateNeedCandidateScenario`

Existing capabilities:
- shared `GenerateNeedCandidateNodeInput`
- shared `GenerateNeedCandidateNodeResult`
- exploration and arbiter context packets
- mocked, Codex-assisted, provider-backed shape stability
- optional multi-agent debate runtime
- ranked draft validation
- candidate admission
- supplemental routing
- admitted-only batch persistence
- candidate-pool projection refs/hash
- harness trace artifact

### Required Follow-up
Keep this runner stable while adding other v1a nodes. Do not overload it with topic seed, resource snapshot, search plan, search run, evidence-map, adjudication, human confirmation, or v1b handoff semantics.

## Node 7: Validate Need Adjudication

### Automation Goal
Expose the current readiness/support/adjudication sequence as one normalized node runner without re-merging human confirmation or v1b publication.

### Node Input
MUST include:
- selected need candidate ref/version
- evidence map/search/search-plan/literature snapshot refs
- evidence role bundle refs
- sibling candidate refs or candidate-pool projection ref
- readiness expectation
- support packet expectation
- proposed final decision packet for mocked/Codex/provider modes
- accepted risk refs and residual risk refs when relevant
- policy version
- output schema version

### Node Result
MUST include:
- readiness assessment ref when created
- validation support packet ref
- adjudication result ref
- final decision
- loopback target ref when non-validate
- required actions
- risk refs
- recheck request refs when created
- memory suggestion refs when created
- artifact refs for model-like recommendation or fixture packet
- harness trace artifact ref

### Acceptance Checks
- node MUST NOT create `ValidatedNeed`.
- node MUST NOT create `V1bInputBundle`.
- `validate` decision still requires `human-confirm-need`.
- merge decisions require merge target.
- recheck decisions require actionable reason and target.
- pending adjudication blocks duplicate adjudication.
- mocked LLM remains acceptance-only.

## Node 8: Human Confirm Need

### Automation Goal
Make human confirmation explicit and fixture-safe for automated scenarios.

### Node Input
MUST include:
- adjudication result ref/version
- support packet ref
- need candidate ref/version
- human actor packet
- human rationale
- accepted risk refs
- fixture/provenance label when acceptance tests simulate a human

### Node Result
MUST include:
- human decision ref
- validated need ref
- carried evidence/search/literature refs
- carried accepted/residual risk refs
- required human checks snapshot
- harness trace artifact ref

### Acceptance Checks
- actor type must be `human` or `hybrid`.
- fixture human decisions must be provenance-labeled.
- model, Codex, provider, or cached output cannot satisfy human confirmation.
- duplicate validated need materialization blocks.
- no v1b bundle is created by this node.

## Node 9: Publish v1b Input Bundle

### Automation Goal
Normalize the deterministic v1a-to-v1b handoff so v1b can consume one stable input boundary.

### Node Input
MUST include:
- validated need ref/version
- source need candidate ref/version
- adjudication result ref
- support packet ref
- human decision ref
- evidence map/search/search-plan/literature snapshot refs
- evidence role bundle refs
- risk refs
- memory suggestion refs
- recheck request refs
- bundle version

### Node Result
MUST include:
- v1b input bundle ref
- bundle version
- bundle hash or payload hash when available
- carried authority refs
- carried risk/recheck/memory refs
- idempotency result
- harness trace artifact ref

### Acceptance Checks
- missing human decision blocks.
- stale or mismatched refs block.
- duplicate publish returns existing bundle according to current repository semantics.
- output MUST NOT create v1b `ResearchSlice`, `TopicQuestionContract`, package, v1c, bridge, or PaperProject authority.

## Implementation Order
1. Review and promote the remaining preparatory v1a node policies from `draft` to `implementation_ready`.
2. Add shared or backend-local normalized node runner DTOs for resource-pool snapshot, SearchPlan, SearchRun, build evidence map, validate adjudication, human confirm, and v1b bundle publish.
3. Add `WorkflowHarness` helper primitives for deterministic node trace/assertion assembly so every new runner does not copy trace boilerplate.
4. Keep `runCreateTopicSeedScenario` as the deterministic node-runner baseline for non-model v1a nodes.
5. Implement `runSnapshotLiteratureResourcePoolScenario`. Done.
6. Implement `runCreateSearchPlanScenario`. Done.
7. Implement `runRecordSearchRunScenario`.
8. Implement `runBuildEvidenceMapScenario`.
9. Implement `runValidateNeedAdjudicationScenario`.
10. Implement `runHumanConfirmNeedScenario`.
11. Implement `runPublishV1bInputBundleScenario`.
12. Refactor `.ai/scripts/topic-selection-real-e2e.mjs` so the entire complete v1a segment calls harness methods rather than direct route choreography.
13. Add drift checks that prevent topic-selection scripts from introducing new v1a business sequencing outside scenario/harness runners.

## Verification Plan
- Focused unit tests for every new runner:
  - happy path
  - malformed input
  - stale/currentness failure
  - blocked path
  - idempotency where applicable
- Real E2E mock run:
  - sample size 4
  - complete v1a through harness from TopicSeed to v1b input bundle
  - v1b/v1c may remain existing script orchestration until their own normalization slices
- Quality gate smoke:
  - `TOPIC_SELECTION_REAL_E2E_REPEATS=1`
  - `TOPIC_SELECTION_REAL_LITERATURE_LIMIT=4`
  - `TOPIC_SELECTION_REAL_FLOW_MOCK_LLM=1`
- Backend typecheck and focused backend tests.
- Project governance lint.

## Done Criteria
- The first normalized v1a node is `topic-selection.v1a.create-topic-seed.v1`.
- Every complete v1a node has a `WorkflowHarness` runner.
- Every complete v1a node emits a normalized result and harness trace artifact.
- The real E2E v1a segment no longer performs direct route choreography.
- Existing route/service APIs remain backward compatible.
- T-089 node policies remain the semantic source; T-088 harness code only executes those policies.
- Quality gate passes after migration.
