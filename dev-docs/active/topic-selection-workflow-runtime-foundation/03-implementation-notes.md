# 03 Implementation Notes

## Runtime Implementation Status
- Initial `AgentOrchestrator` runtime helper is implemented.
- DMP v1 model profile registry/schema validator is implemented.
- `AgentOrchestrator` now consumes the profile registry for profile/run-mode/output-contract enforcement and provider model-option resolution.
- Shared invocation provenance/audit envelope contracts are implemented and `AgentOrchestrator` validates audit snapshots against them before artifact persistence.
- Generate-need-candidate `WorkflowHarness` scenario execution exists for the current v1a runtime slice.
- Initial v1a need-discovery multi-agent debate role invocation runtime exists for `generate-need-candidate`.
- Profile escalation policy runtime, full scenario registry execution, route-level runner integration, supplemental debate round automation, and legacy script migration are still pending.

## 2026-05-19 Joint Alignment
- Locked D-01 and D-02 in `06-joint-decisions.md`.
- Scope remains planning/runtime-boundary alignment only; no product implementation changes yet.

## 2026-05-19 D-03 Alignment
- Locked `AgentOrchestrator` as executor invocation boundary.
- Clarified that `WorkflowNodeExecutor` owns business context resolution; `AgentOrchestrator` must not query business DB state to assemble context.

## 2026-05-19 D-04 Alignment
- Locked execution mode boundaries.
- `mocked_llm` is test/acceptance-only and must be database/audit-distinguishable from provider-backed decisions.
- Product runtime must not silently fallback to mock execution.

## 2026-05-19 D-05 Alignment
- Locked profile escalation as deterministic attempt-level policy.
- Escalation cannot silently cross execution modes, change executor kind, downgrade to heuristics, reuse cached responses, or bypass guardrails.

## 2026-05-19 D-06 Alignment
- Locked trace/audit/persistence boundary around the existing topic-selection control-plane.
- Recorded compatibility gaps: resource sampling full structured output in DB, missing explicit mode/executor/non-provider runtime fields, and unconstrained inline artifact/trace payloads.
- Handling: preserve completed T-079 compatibility, but T-088 must prefer DB summaries plus artifact refs for future runtime.

## 2026-05-19 D-07 Alignment
- Locked multi-agent debate as bounded executor, not workflow spine, not profile escalation, and not default fallback.
- Debate output cache/retention/artifact policy is owned by T-089 on a node-by-node basis.

## 2026-05-19 D-08 Alignment
- Locked Codex-assisted execution as the default low-cost local mode for this personal local-first project.
- Codex can replace most single-agent provider calls and can execute specific debate roles when node policy allows it.
- Provenance, schema validation, deterministic guardrails, audit, and authority persistence boundaries remain mandatory.

## 2026-05-19 D-09 Alignment
- Locked existing runner migration as a zero-dual-track requirement.
- Legacy real-flow/E2E/quality/provider-stability commands may remain only as CLI wrappers around `WorkflowHarness` scenarios.
- Migration completion requires scenario registry coverage, parity canary evidence, deletion or wrapper-only reduction of old implementation paths, repository drift checks, and wrapper tests that prevent direct business-service execution from scripts.

## 2026-05-19 D-14 Alignment
- T-088 runtime must consume registered `WorkflowScenario` ids rather than script-local scenario definitions.
- Initial T-089 scenario registry lives in `dev-docs/active/topic-selection-agent-workflow-review/08-scenarios.md`.
- Harness implementation must keep scenario orchestration separate from matrix and node-policy business semantics.

## 2026-05-19 Initial `AgentOrchestrator` Runtime Implementation
- Added `TopicSelectionAgentOrchestratorService` in `apps/backend/src/services/topic-selection-agent-orchestrator-service.ts`.
- The helper is a runtime/model-execution boundary, not a domain service and not a workflow engine.
- It receives caller-built prompt/context/input refs and does not read topic-selection business DB state to assemble context.
- It routes:
  - `mocked_llm` from explicit fixture output only, and rejects `run_mode=product`;
  - `codex_assisted` from operator/Codex supplied structured response packets;
  - `provider_llm` through the existing `BackendLlmGateway`.
- It validates every mode against the same JSON schema with AJV and returns one normalized result shape with status, structured output, validation summary, blocker codes, provenance, and audit snapshot.
- It records a small diagnostic audit artifact through the existing control-plane when a `TopicSelectionControlPlaneService` is supplied.
- Audit artifacts store hashes, mode/source provenance, validation summaries, blocker codes, and telemetry summaries; they do not store full structured output, prompt text, raw provider logs, hidden reasoning, or secrets.
- This implementation does not yet add profile escalation decisions, retry orchestration beyond `BackendLlmGateway`, WorkflowHarness sequencing, or node-specific generate-need-candidate adapter wiring.

## 2026-05-20 DMP Runtime Foundation Slice 1: Profile Registry/Schema Validator
- Added shared DMP v1 profile contracts in `packages/shared/src/research-lifecycle/topic-selection-agent-profile-contracts.ts`.
- The shared contract defines:
  - `TopicSelectionModelProfileRegistry@v1`;
  - canonical run modes `test | acceptance | product`;
  - normalized parameter keys `creativity`, `reasoning_depth`, `output_budget`, `structured_output_required`, and `output_format`;
  - provider fallback policy with `automatic_fallback=false`;
  - failure handling policy with semantic retry disabled and supplemental rounds marked as non-retry;
  - audit policy fields that forbid raw provider response and hidden reasoning persistence;
  - run-mode eligibility by execution mode.
- Exported the new contract through the research-lifecycle barrel and package exports.
- Added `TopicSelectionModelProfileRegistryService` in `apps/backend/src/services/topic-selection-model-profile-registry-service.ts`.
- The service validates registry shape plus DMP semantic guardrails:
  - duplicate profile ids;
  - duplicate model option ids;
  - unknown provider ids;
  - provider profiles without model options;
  - automatic provider fallback;
  - semantic retry;
  - supplemental round as retry;
  - `mocked_llm` product eligibility;
  - structured-output capability drift;
  - raw provider response / hidden reasoning audit drift;
  - technical retry that changes invocation semantics.
- Added default v1 need-discovery profiles for:
  - `topic-selection.need-discovery.explorer.v1`;
  - `topic-selection.need-discovery.deep-critic.v1`;
  - `topic-selection.need-discovery.arbiter-framing.v1`;
  - `topic-selection.need-discovery.arbiter-final.v1`.
- The default profiles include OpenAI balanced and DashScope budget explicit-selection options, but automatic fallback remains disabled.
- `arbiter-final` allows `mocked_llm` for test/acceptance and `provider_llm` for real execution; `codex_assisted` remains disallowed at the profile level for now to avoid final-synthesis ambiguity.
- Registered `DASHSCOPE_API_KEY_CODING` in `.ai/llm-config/registry/config_keys.yaml` after the LLM config-key check surfaced an existing SSOT gap from local provider-key setup.
- This slice originally did not wire profile resolution into `TopicSelectionAgentOrchestratorService`; that gap is closed by the 2026-05-20 Slice 2 implementation below.

## 2026-05-20 Quality Review And DMP Runtime Foundation Slice 2: Orchestrator Profile Resolution
- Reviewed the Slice 1 implementation against DMP-01 through DMP-10 and fixed two dual-track risks:
  - `TopicSelectionAgentRunMode` was duplicated in backend runtime code instead of consuming the shared profile contract type;
  - `provider_llm` callers could still pass concrete `model` and `request_policy` values through harness/adapter inputs, bypassing the profile registry as SSOT.
- Added `topic-selection.generate-need-candidate.single-agent.v1` to the default registry for the existing single-agent generate-need-candidate runtime path.
- `TopicSelectionAgentOrchestratorService` now:
  - resolves every invocation through `TopicSelectionModelProfileRegistryService`;
  - enforces profile status, execution mode, run mode, and `output_contract`;
  - resolves provider calls from `profile_id + model_option_id`, with default OpenAI balanced option when no explicit option is selected;
  - derives gateway `model`, timeout, and technical retry policy from the selected model option/profile;
  - records `profile_version`, `profile_hash`, `model_option_id`, `normalized_params_hash`, capability-degrade markers, and `output_contract` in provenance;
  - uses `source_kind=provider_response` for provider-backed output to match DMP-07 vocabulary.
- `TopicSelectionGenerateNeedCandidateOrchestratorAdapterService` and `TopicSelectionWorkflowHarnessService` now accept only optional `model_option_id` for provider option selection; they no longer pass concrete provider/model/request-policy values.
- `BackendLlmGateway` accepts normalized params and provider overrides from the orchestrator request; DashScope structured-output calls now apply model-option `provider_overrides` such as `enable_thinking`.
- Updated runtime fixtures from the old ad hoc profile id to `topic-selection.generate-need-candidate.single-agent.v1` while preserving `topic-selection-generate-need-candidate` as the prompt template id.
- This slice still does not implement profile escalation decisions, full multi-agent debate role/stage execution, route-level node runner integration, or legacy script migration.

## 2026-05-20 DMP Runtime Foundation Slice 3: Shared Invocation Provenance Contract
- Added shared invocation provenance/audit contracts in `packages/shared/src/research-lifecycle/topic-selection-agent-invocation-contracts.ts`.
- The contract defines one normalized envelope for `mocked_llm`, `codex_assisted`, and `provider_llm` invocation attempts, including:
  - node/run/attempt ids and `invocation_attempt_id`;
  - execution mode, executor kind, source kind, run mode, and `non_provider`;
  - profile id/version/hash, selected model option, normalized params hash, and output contract;
  - prompt packet hash, response hash, structured output hash, cache/reuse markers, provider/model ids, and telemetry summary;
  - optional fixture, Codex/operator, and debate-extension metadata.
- Exported the new contract through the research-lifecycle barrel and shared package exports.
- `TopicSelectionAgentOrchestratorService` now imports provenance/status/source/executor types from the shared contract instead of maintaining backend-local copies.
- `TopicSelectionAgentOrchestratorService` validates every audit snapshot with `topicSelectionAgentInvocationAuditSnapshotSchema` before recording the control-plane diagnostic artifact.
- Provider-backed provenance must include selected model option and normalized params hash; mock/Codex provenance must remain `non_provider=true` and carry fixture/operator markers.
- Audit snapshots still store hashes, provenance, validation summaries, blocker codes, and telemetry summaries only; they do not store full structured output, raw provider responses, raw debate transcripts, hidden reasoning, or secrets.
- This Slice 3 entry was a shared runtime foundation only; the later Slice 4 entry below adds the initial need-discovery debate loop while profile escalation runtime, route-level runner integration, and legacy script migration remain pending.

## 2026-05-20 DMP Runtime Foundation Slice 4: Need Discovery Debate Role Invocation Runtime
- Added role-level v1a need-discovery debate contracts to `packages/shared/src/research-lifecycle/topic-selection-need-validation-contracts.ts`:
  - `TopicSelectionNeedDiscoveryExplorerNotes`;
  - `TopicSelectionNeedDiscoveryDeepCriticNotes`;
  - `TopicSelectionNeedDiscoveryRoleLevelSummary`;
  - `TopicSelectionNeedDiscoveryDebateIssueFrame`;
  - `TopicSelectionNeedDiscoveryDebateFinalSynthesisArtifact`.
- Extended generate-need-candidate artifact keys with:
  - `debate_role_output`;
  - `debate_role_level_summary`;
  - `debate_issue_frame`;
  - `debate_final_synthesis`.
- `TopicSelectionAgentOrchestratorService` now accepts caller-supplied `invocation_attempt_id` and optional `debate_extension`, then carries them into the shared provenance/audit envelope for mocked, Codex-assisted, provider-backed, and provider-blocked invocations.
- `TopicSelectionModelProfileRegistryService` now exports canonical profile ids for explorer, deep critic, arbiter framing, arbiter final, and the existing single-agent generate-need-candidate path.
- Added `TopicSelectionNeedDiscoveryDebateLoopService` as a node-internal debate runtime for v1a `generate-need-candidate`.
- The debate loop:
  - invokes one or more `explorer` worker instances and one or more `deep_critic` worker instances;
  - blocks when mandatory worker roles are missing in `mocked_llm` or `codex_assisted` execution;
  - records each worker structured output as `debate_role_output`;
  - merges same-role outputs into deterministic role-level summaries;
  - invokes single-instance `arbiter.issue_framing`;
  - invokes single-instance `arbiter.final_synthesis` to produce the existing `RankedCandidateDraftBatch`;
  - records final synthesis as a compact artifact containing refs, hashes, counts, terminal result, and final invocation attempt id;
  - enforces the D-19 maximum of three debate rounds at the runtime input boundary.
- `TopicSelectionGenerateNeedCandidateOrchestratorAdapterService` now routes `executor_kind=multi_agent_debate` through the debate loop before existing D-20 schema validation, D-21 admission gates, D-22 routing, and optional D-23 persistence.
- `TopicSelectionWorkflowHarnessService` now passes debate mocked/Codex role packets into the adapter and includes debate artifacts in harness trace refs.
- The implementation deliberately does not add a `NeedCandidateSet`, does not persist raw debate transcripts, does not allow worker roles to write authority objects, and does not create a second persistence path.
- Remaining gaps after this slice:
  - supplemental repair rounds are bounded by `round_index` but not yet automatically orchestrated across multiple loop executions;
  - provider/Codex real-flow debate evidence remains pending;
  - route-level node runner and legacy script migration are still pending.

## 2026-05-20 DMP Runtime Foundation Slice 5: Executable Debate Scenario Contract Consumption
- Added shared debate scenario contract DTOs/schemas and the concrete v1a generate-need-candidate contract under `packages/shared/src/research-lifecycle/topic-selection-debate-scenario-contracts.ts`.
- Exported the contract through the shared research-lifecycle barrel and package exports.
- `TopicSelectionNeedDiscoveryDebateLoopService` now reads role/stage metadata from the shared contract instead of duplicating profile ids, output contracts, schema names, prompt ids, debate policy id, node id, instance defaults, and round cap.
- Provider-mode execution now follows contract defaults:
  - `explorer.round_1_discovery` runs two instances by default;
  - `deep_critic.round_1_discovery` runs one instance by default;
  - `arbiter.issue_framing` and `arbiter.final_synthesis` run one instance each.
- Slot-level execution overrides are supported for debate runtime and pass through the adapter/harness boundary, allowing explicit Codex substitution for permitted slots without changing the final arbiter execution mode.
- The runtime remains profile-registry-driven for provider/model/normalized-param resolution, preserving DMP-10 separation between scenario contract and provider option registry.
- `arbiter.final_synthesis` remains Codex-forbidden in the executable v1 contract, matching the model profile registry and preventing final-output authority ambiguity.

## 2026-05-20 Real E2E Provider Hardening
- Ran the provider-backed topic-selection real E2E against `ai-rag-finetuning-2022-2026` and used the failures to harden the v1b product chain.
- `.ai/scripts/topic-selection-real-e2e.mjs` now supports:
  - `TOPIC_SELECTION_REAL_RESOURCE_SAMPLE_SET_ID` to resume from an existing provider-generated resource sample set;
  - `TOPIC_SELECTION_REAL_LLM_MAX_RETRIES` for long-chain provider transient tolerance;
  - `TOPIC_SELECTION_REAL_PROVIDER_ID` for explicit provider selection in downstream LLM nodes.
- The successful E2E reused `resource_sample_set_eaf6437e-a88c-43ef-8e65-2216ffd2272e`, which was created by a real OpenAI resource-sampling run and had status `ready_with_warning`.
- `TopicSelectionV1bResearchSliceService` now canonicalizes known evidence refs back to the inherited evidence role bundle before persistence and removes known non-evidence upstream refs from evidence arrays with quality flags.
- `TopicSelectionV1bTopicQuestionService` now normalizes provider-produced boundary refs and falsification source refs without weakening strict evidence-ref validation:
  - extra unknown boundary refs are removed only when canonical boundary refs remain;
  - unknown falsification `trigger_source_refs` are removed while `trigger_evidence_refs` stay strict;
  - normalization adds human-review triggers so provider-output repairs remain visible.
- DashScope with `DASHSCOPE_API_KEY` failed authentication; mapping `DASHSCOPE_API_KEY_CODING` authenticated but returned a no-options research-slice payload, so DashScope structured-output compatibility remains unaccepted for this flow.

## 2026-05-20 Real E2E Harness Migration: v1a Generate Need Candidate
- Migrated `.ai/scripts/topic-selection-real-e2e.mjs` so the v1a `generate-need-candidate` step no longer calls the compatibility `POST /topic-selection/v1a/need-candidates` single-candidate route.
- The script now keeps the legacy command name but executes `TopicSelectionWorkflowHarnessService.runGenerateNeedCandidateScenario` for `topic-selection.real-e2e.canary.v1`.
- The harness path records:
  - `GenerateNeedCandidateNodeInput`;
  - exploration and arbiter context packets;
  - ranked draft batch artifact;
  - minimum schema validation report;
  - `CandidateDraftAdmissionReport`;
  - `SupplementalRoundRoutingDecision`;
  - admitted-only `PersistNeedCandidateBatchCommand`;
  - harness trace artifact;
  - persisted `NeedCandidate` refs and candidate-pool projection ref/hash.
- The script exposes `TOPIC_SELECTION_REAL_V1A_GENERATE_EXECUTION_MODE` with values `mocked_llm`, `codex_assisted`, or `provider_llm`.
  - Default is `mocked_llm` when `TOPIC_SELECTION_REAL_FLOW_MOCK_LLM=1`.
  - Default is `provider_llm` for normal real-provider E2E.
  - Provider mode selects the model option through `TopicSelectionModelProfileRegistryService` semantics, not through ad hoc script provider/model wiring.
- The compatibility route remains available for manual/single-candidate creation, but the real E2E canary no longer claims that route as the generate-node workflow path.
- A mock real-flow run initially failed at v1b readiness with `blocked_by_stale_trace` because the harness-built refs omitted evidence/search/literature version ids, creating support-packet mismatch blockers.
- Fixed the script harness input to carry the canonical `evidence_map_version`, `plan_version`, `snapshot_version`, and evidence-unit version refs into batch persistence, preserving v1a-to-v1b trace currentness.
- Remaining migration gap: the full real-E2E script still orchestrates resource sampling, v1b, v1c, bridge, and downstream checks directly; only the v1a generate-node has been moved behind the unified harness in this slice.

## 2026-05-20 WorkflowScenario Quality Runner Migration
- Marked `.ai/scripts/topic-selection-real-e2e-quality-gate.mjs` as a legacy compatibility script and removed the file after migration.
- Added `.ai/scripts/topic-selection-workflow-scenario-runner.mjs` as the canonical CLI runner for registered topic-selection workflow scenarios.
- `pnpm topic-selection:real-e2e:quality-gate` now wraps `topic-selection.real-e2e.scale-quality.v1` instead of invoking a standalone quality script.
- Extracted the useful legacy assertions into the scale-quality scenario runner:
  - resource sample hash/status presence;
  - selected literature count and role-target counts;
  - sample hash and selected-set stability across repeats;
  - selected literature role-semantics prechecks;
  - PaperProject intake creation, idempotency, and negative status boundaries;
  - downstream feedback/recheck counts;
  - v1b non-advance negative stop before package, v1c, bridge, and PaperProject intake.
- `.ai/scripts/topic-selection-real-e2e.mjs` now records the top-level `scenario_id` supplied by `TOPIC_SELECTION_WORKFLOW_SCENARIO_ID`, so child runs under the quality runner are distinguishable as `topic-selection.real-e2e.canary.v1` or `topic-selection.v1b.non-advance-negative.v1`.
- The migrated semantic audit exposed stale resource-sampling rationale after deterministic role canonicalization; `TopicSelectionResourceSamplingService` now rewrites `classification_rationale` and `method_families` to match the final selected role whenever guardrails override the LLM role.
- Remaining migration gap: the new scenario runner is a CLI-level scenario wrapper. Full node-by-node execution for resource sampling, v1b, v1c, bridge, and downstream still needs deeper `WorkflowHarness` sequencing in later slices.

## 2026-05-20 v1a WorkflowHarness Normalization Slice Opened
- Opened `07-v1a-workflow-harness-normalization.md` as an explicit T-088 implementation slice.
- Governance decision: reuse T-088 for runtime implementation and T-089 for semantic node-policy source; do not create a new task package.
- Correction: complete v1a starts at `TopicSeed`; the previous evidence-map-first framing described only the evidence-to-need subchain.
- Scope is complete v1a after an upstream TitleCard exists:
  - `topic-selection.v1a.create-topic-seed.v1`;
  - `topic-selection.v1a.snapshot-literature-resource-pool.v1`;
  - `topic-selection.v1a.create-search-plan.v1`;
  - `topic-selection.v1a.record-search-run.v1`;
  - `topic-selection.v1a.build-evidence-map.v1`;
  - `topic-selection.v1a.generate-need-candidate.v1`;
  - `topic-selection.v1a.validate-need-adjudication.v1`;
  - `topic-selection.v1a.human-confirm-need.v1`;
  - `topic-selection.v1a.publish-v1b-input-bundle.v1`.
- TitleCard creation is explicitly upstream of v1a for this slice.
- Resource sampling is explicitly excluded from complete v1a and remains the v1a input layer with a separate draft policy.
- The target standard is automated orchestrator-callable node runners with normalized node input/result, authority refs, artifact/audit refs, warning/blocker codes, assertions, and harness trace artifacts.
- Implementation should proceed node by node, using the existing `runGenerateNeedCandidateScenario` as the quality bar rather than accepting route-level E2E success as sufficient.

## 2026-05-20 v1a WorkflowHarness Normalization: Create TopicSeed
- Implemented `TopicSelectionWorkflowHarnessService.runCreateTopicSeedScenario` for `topic-selection.v1a.create-topic-seed.v1`.
- The runner calls `TopicSelectionSearchResourceService.createTopicSeedFromTitleCard`; it does not write TopicSeed authority directly.
- The runner emits one normalized result shape across success and blocked paths, including node input, node result, authority refs, audit refs, blocker codes, assertions, harness trace snapshot, and a control-plane trace artifact.
- Blocked `AppError` paths such as missing TitleCard return a blocked harness result without TopicSeed authority refs.
- `TopicSelectionSearchResourceService.createTopicSeedFromTitleCard` now validates direct service calls for non-empty `seed_version` and non-empty final `intent_summary` after fallback to TitleCard brief.
- TopicSeed input snapshots now include final `intent_summary` and `seed_version` so replay/debug does not have to infer them from the persisted record.
- `seed_kind` remains fixed to `title_card` by the service and is not accepted as caller input.

## 2026-05-20 v1a WorkflowHarness Normalization: Automation Callability Dimension
- Added automation callability as a separate node-evaluation dimension.
- `implementation_ready` now means the node semantics are clear enough to implement, while `automation_callability=callable` means a normalized `WorkflowHarness` runner exists and can be invoked without script-local route choreography.
- Updated `07-v1a-workflow-harness-normalization.md` so the 9-node v1a inventory records both policy status and automation callability.
- Current callable v1a nodes are:
  - `topic-selection.v1a.create-topic-seed.v1`;
  - `topic-selection.v1a.generate-need-candidate.v1`.
- `topic-selection.v1a.build-evidence-map.v1` is only `partially_callable`: its business policy is implementation-ready, but it still lacks a normalized runner.

## 2026-05-20 v1a Node 2 Alignment: Snapshot Boundary And Source Of Truth
- Locked the first two decisions for `topic-selection.v1a.snapshot-literature-resource-pool.v1` before implementing the runner.
- The node is a deterministic authority-materialization boundary for `TopicSelectionLiteratureResourcePoolSnapshot`; it must not perform resource sampling, literature selection, evidence-role classification, or evidence-polarity judgment.
- The TitleCard evidence basket is the single normalized source of included literature. `ResourceSampleSet` may appear only as upstream provenance after its selected literature has already been attached to the evidence basket.
- This keeps resource sampling as the v1a input layer and prevents the snapshot runner from introducing a second content source beside the evidence basket.

## 2026-05-20 v1a Node 2 Alignment: Source Scope
- Locked N2-D03 for the upcoming `runSnapshotLiteratureResourcePoolScenario` implementation.
- The normalized harness path supports only `source_scope=title_card_evidence_basket`.
- `manual_selection` and `search_result` remain shared-contract compatibility values, but they are not automated v1a harness scopes until explicit resolvers exist.
- The runner should block unsupported scopes with `UNSUPPORTED_SOURCE_SCOPE_FOR_NORMALIZED_V1A` before creating a snapshot authority.

## 2026-05-20 v1a Node 2 Alignment: Resource Quality Gate
- Locked N2-D04 for the upcoming `runSnapshotLiteratureResourcePoolScenario` implementation.
- The runner should block only traceability and authority-creation failures: missing TopicSeed, lineage mismatch, empty evidence basket, unresolved evidence-basket literature ids, unsupported normalized source scope, or failed control-plane gate/transition.
- Resource maturity gaps should be returned as `source_health_summary.warning_codes` rather than hard blockers: incomplete key content, abstract, source count, pipeline readiness, stale/duplicate status, and fulltext readiness.
- This preserves downstream quality decisions for SearchPlan, EvidenceMap, NeedCandidate generation, and v1b intake instead of overloading the snapshot node.

## 2026-05-20 v1a Node 2 Alignment: Snapshot Hash And Replay
- Locked N2-D05 for the upcoming `runSnapshotLiteratureResourcePoolScenario` implementation.
- `snapshot_hash` should identify replay-equivalent snapshot contents, not a single execution attempt.
- Stable hash inputs should include `title_card_id`, TopicSeed ref, `source_scope`, evidence basket `updated_at`, evidence-basket-derived literature refs, content source refs, `source_health_summary`, and `policy_version_id`.
- Runtime artifacts must be excluded from the hash: repository-generated snapshot id, control-plane ids, harness trace artifact id, `created_at`, and `created_by`.
- The runner tests should verify that equivalent repeated runs keep the same `snapshot_hash` even when audit/control-plane ids differ.

## 2026-05-20 v1a Node 2 Alignment: Harness Runner Contract
- Locked N2-D06 for the upcoming `runSnapshotLiteratureResourcePoolScenario` implementation.
- The runner target is `TopicSelectionWorkflowHarnessService.runSnapshotLiteratureResourcePoolScenario`.
- The runner should delegate authority creation to `TopicSelectionSearchResourceService.createLiteratureResourcePoolSnapshot` and must not perform direct repository writes.
- The runner should be callable as a single node with normalized node input/result shapes, including one blocked-result envelope that preserves blocker codes and avoids snapshot authority refs.
- The node remains `not_callable` until code, trace artifact schema, and success/blocked runner tests are implemented.

## 2026-05-20 v1a Node 2 Alignment: Audit And Trace Boundary
- Locked N2-D07 for the upcoming `runSnapshotLiteratureResourcePoolScenario` implementation.
- Control-plane records are the authoritative audit facts; harness trace is execution evidence for automation and replay debugging.
- The runner trace schema should be `WorkflowHarnessSnapshotLiteratureResourcePoolScenarioTrace@v1`.
- The trace should include normalized input/result, `snapshot_hash`, `source_health_summary`, authority refs, control-plane refs, blockers, warnings, and assertions.
- The trace must not contain hidden reasoning, secrets, provider logs, raw LLM transcripts, or raw debate transcripts.

## 2026-05-20 v1a Node 2 Alignment: SearchPlan Handoff
- Locked N2-D08 for the upcoming `runSnapshotLiteratureResourcePoolScenario` implementation.
- The runner result should produce a downstream handoff packet for SearchPlan containing snapshot ref, version, hash, source scope, literature refs, content source refs, and `source_health_summary`.
- Node 3 must treat the `LiteratureResourcePoolSnapshot` as the resource truth and must not re-read the mutable TitleCard evidence basket, `ResourceSampleSet`, selected refs, or current search results as resource truth.
- `snapshot_hash` is an assertion/replay check, not a replacement for the snapshot authority ref.
- Basket changes after snapshot creation require a new snapshot before they can influence SearchPlan.

## 2026-05-20 v1a Node 2 Alignment: Idempotency And Repeated Runs
- Locked N2-D09 for the upcoming `runSnapshotLiteratureResourcePoolScenario` implementation.
- The runner should use append-only default behavior: repeated equivalent runs may create new snapshot authority refs.
- `snapshot_hash` is the content-equivalence key, so equivalent repeated runs must keep the same hash even when authority refs and audit/control-plane refs differ.
- The runner must not silently reuse an existing snapshot by hash or skip control-plane evidence because an equivalent hash already exists.
- Any future reuse-by-hash mode should be an explicit opt-in policy and runner input flag, not the default behavior.

## 2026-05-20 v1a Node 2 Implementation Readiness Review
- Locked N2-D10 and promoted `topic-selection.v1a.snapshot-literature-resource-pool.v1` to `policy_status=implementation_ready`.
- At readiness-review time the node was not yet callable; this was superseded by the implementation slice below.
- Complexity is moderate and bounded because the implementation can reuse the existing `TopicSelectionSearchResourceService.createLiteratureResourcePoolSnapshot` authority path and the deterministic control-plane pattern already used by `runCreateTopicSeedScenario`.
- Implementation does not require new persistence models, schema migration, provider calls, AgentOrchestrator, Codex, or debate runtime.
- Required implementation hardening: align `snapshot_hash` with the locked replay payload, expand `source_health_summary.warning_codes`, block unsupported harness `source_scope`, add success/blocked trace assertions, and verify append-only repeated-run behavior.

## 2026-05-20 v1a WorkflowHarness Normalization: Snapshot Literature Resource Pool
- Implemented `TopicSelectionWorkflowHarnessService.runSnapshotLiteratureResourcePoolScenario`.
- The node is now `automation_callability=callable`.
- The runner calls `TopicSelectionSearchResourceService.createLiteratureResourcePoolSnapshot` and keeps repository writes inside the authority service.
- The runner emits normalized success/blocked results, assertions, downstream SearchPlan handoff data, audit refs, warning/blocker codes, and `WorkflowHarnessSnapshotLiteratureResourcePoolScenarioTrace@v1`.
- `TopicSelectionSearchResourceService.createLiteratureResourcePoolSnapshot` now computes `snapshot_hash` from stable content replay inputs: title card, TopicSeed ref, source scope, basket timestamp, literature refs, source refs, source-health summary, and policy version.
- Resource maturity issues now appear as source-health warnings without blocking traceable resources.
- Equivalent repeated runs remain append-only at the authority level while preserving the same `snapshot_hash`.

## 2026-05-20 v1a Node 2 Quality Review Follow-up
- Fixed the blocked-path audit gap found during self-review: when missing literature causes the deterministic gate/transition to block, the harness result now preserves the control-plane input snapshot, readiness gate, and transition attempt refs instead of returning an audit-empty blocked result.
- Hardened normalized Node 2 input validation so `topic_seed_ref` must be a concrete TopicSeed authority ref with `version_id` and matching `title_card_id`.
- Hardened harness string validation so malformed programmatic inputs return `INVALID_PAYLOAD` instead of leaking runtime `TypeError`.
- Added regression coverage for blocked audit refs and non-concrete TopicSeed refs.

## 2026-05-20 v1a Node 3 Alignment: SearchPlan Boundary
- Locked N3-D01 for `topic-selection.v1a.create-search-plan.v1`.
- Node 3 is a deterministic authority-materialization boundary for `TopicSelectionSearchPlan` and `TopicSelectionCoverageRowIntent`; it must not execute retrieval, build EvidenceMap, judge evidence roles, generate research content, call models, call Codex, or run debate.
- The normalized harness path consumes Node 2's `LiteratureResourcePoolSnapshot` authority as resource truth and must not re-read mutable TitleCard evidence basket state or alternate resource sources.
- Explicit `coverage_intents` are required in the normalized harness path. Existing service/route fallback from `query_intents` to support-only coverage rows may remain as compatibility behavior, but it is not the normalized automated v1a path.
- The runner input should carry expected `snapshot_hash` so stale or mismatched snapshot assumptions block before SearchPlan authority creation.

## 2026-05-20 v1a Node 3 Alignment: Blueprint Source
- Locked N3-D02 for `topic-selection.v1a.create-search-plan.v1`.
- `SearchPlan blueprint` is an explicit upstream input to Node 3; the node validates and materializes it but does not generate it.
- Allowed origins are WorkflowScenario/test fixtures, human-authored input, Codex-assisted local drafting before invocation, and a future separately defined upstream blueprint-generation node.
- Any automatic blueprint generation must be a separate node with its own execution-mode/model policy, context contract, output contract, and verification.
- Blueprint provenance may be recorded for traceability, but it does not become resource truth and does not replace the `LiteratureResourcePoolSnapshot` authority.
- Corrected contract ownership: `TopicSelectionSearchPlanBlueprint` is a topic-selection module-level value contract, not an N3-only local shape.
- In the initial slice the blueprint is frozen through Node 3 normalized input, control-plane input snapshot, and harness trace rather than persisted as a standalone authority object.

## 2026-05-20 v1a Node 3 Alignment: Blueprint Minimum Contract
- Locked N3-D03 as the module-level `TopicSelectionSearchPlanBlueprint@v1` minimum contract.
- Required blueprint fields cover origin/provenance, TopicSeed/Snapshot lineage, expected snapshot hash, optional plan/recheck lineage, query intents, coverage intents, constraints, exclusions, coverage strategy, role coverage expectation, policy version, and output schema version.
- Required coverage row fields are `coverage_key`, `intent_type`, `query`, `rationale`, `required`, `priority`, `expected_evidence_role`, `target_source_types`, and `refs`.
- `target_source_types` and `refs` may be empty arrays, but must be present after normalization so Node 4 and EvidenceMap do not infer missing semantics.
- Consumer review passed: the contract supports Node 3 materialization, Node 4 coverage bindings, EvidenceMap coverage lineage, NeedCandidate role-bundle consumption, and future blueprint-generation output without creating a second shape.

## 2026-05-21 v1a Node 3 Alignment: Blueprint LLM Profiles
- Locked N3-D04 for SearchPlanBlueprint semantic draft/review model policy.
- `codex_assisted` is the default execution mode for both blueprint draft and review in this local personal-use workflow.
- `provider_llm` is reserved for explicit operator upgrade or provider-quality scenarios; `mocked_llm` remains test/acceptance-only.
- Draft profile: `topic-selection.search-plan-blueprint.draft.v1`, output `TopicSelectionSearchPlanBlueprint@v1`, OpenAI `gpt-5.4-mini` default, OpenAI `gpt-5.5` high-accuracy override, DashScope `qwen3.6-plus` budget override, normalized params `creativity=medium`, `reasoning_depth=high`, `output_budget=large`, `json_schema`.
- Review profile: `topic-selection.search-plan-blueprint.review.v1`, output `TopicSelectionSearchPlanBlueprintReview@v1`, same provider options, normalized params `creativity=low`, `reasoning_depth=high`, `output_budget=medium`, `json_schema`.
- Node 3 remains deterministic and does not call these profiles; it only consumes a validated blueprint and writes SearchPlan/CoverageRow authorities through the domain service.
- Automatic provider fallback is disabled; manual rerun or explicit model-option override must create new provenance.

## 2026-05-21 v1a Node 1/2 LLM Boundary Amendments
- Applied the discussion result as amendments in the original Node 1 and Node 2 sections instead of adding an N3 follow-up decision.
- N1-AM01 confirms `topic-selection.v1a.create-topic-seed.v1` remains deterministic with `execution_mode=none`; it does not call AgentOrchestrator, BackendLlmGateway, Codex, provider LLMs, or debate runtime.
- Optional upstream semantic preparation may draft `intent_summary` and `scope_notes` before Node 1, but that preparation is input drafting only. It does not write `TopicSelectionTopicSeed` authority.
- Reserved `TopicSeedIntentDraft@v1` as a possible future pre-node value artifact/profile, with no executable profile locked in this slice.
- N2-AM01 confirms `topic-selection.v1a.snapshot-literature-resource-pool.v1` remains deterministic and model-free. Resource sampling, role classification, evidence polarity, and evidence interpretation remain upstream or downstream semantics, not Node 2 behavior.

## 2026-05-21 v1a Node 3 Alignment: WorkflowHarness Runner Contract
- Locked N3-D05 for `topic-selection.v1a.create-search-plan.v1`.
- The normalized automation boundary is `TopicSelectionWorkflowHarnessService.runCreateSearchPlanScenario`.
- The runner consumes `TopicSelectionSearchPlanBlueprint@v1` plus scenario/run metadata, not a bare permissive `CreateSearchPlanInput`.
- Strict pre-service validation must block lineage mismatch, stale `expected_snapshot_hash`, empty query intents, missing coverage intents, and missing coverage-row fields before SearchPlan authority creation.
- Route/service compatibility fallback may remain for legacy/manual API callers, but normalized harness execution must not derive coverage rows, evidence roles, coverage keys, priorities, refs, or rationales from fallback defaults.
- Authority writes remain delegated to `TopicSelectionSearchResourceService.createSearchPlan`; the runner must not write SearchPlan or CoverageRow repositories directly.
- The runner result must use one success/blocked envelope and record `WorkflowHarnessCreateSearchPlanScenarioTrace@v1`.

## 2026-05-21 v1a Node 3 Implementation: WorkflowHarness Runner
- Implemented `TopicSelectionWorkflowHarnessService.runCreateSearchPlanScenario` and promoted Node 3 to `automation_callability=callable`.
- Added the shared `TopicSelectionSearchPlanBlueprint@v1` DTO/schema, including the exported schema-version constant used by the harness.
- Required strict coverage-intent semantics before authority creation.
- The runner validates exact blueprint schema version, TopicSeed/Snapshot/TitleCard lineage, expected snapshot hash, non-empty query intents, explicit non-empty coverage intents, and every required coverage-row semantic field.
- Non-object coverage intent entries and blank string-array entries block as malformed blueprint payloads instead of reaching the service fallback path.
- The runner delegates SearchPlan and CoverageRow authority writes to `TopicSelectionSearchResourceService.createSearchPlan`; it does not write repositories directly.
- The authority service now freezes the complete SearchPlan blueprint in the control-plane input snapshot when the normalized harness supplies one.
- The harness trace uses `WorkflowHarnessCreateSearchPlanScenarioTrace@v1` and records blueprint origin, provenance refs, expected/resolved snapshot hash, query intents, coverage intents, authority refs, blockers, warnings, and assertions.
- Blocked results return no SearchPlan or CoverageRow authority refs and still record a harness trace artifact when trace recording is available.
- Node 1 now accepts optional `intent_preparation_refs` for input-snapshot provenance without changing its deterministic execution mode.
- Node 2 now accepts optional `resource_sample_set_provenance_ref` for input-snapshot provenance while excluding it from `snapshot_hash`, so resource truth remains the LiteratureResourcePoolSnapshot contents.
