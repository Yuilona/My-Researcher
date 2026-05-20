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
