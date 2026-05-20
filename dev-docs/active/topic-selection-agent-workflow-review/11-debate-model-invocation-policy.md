# 11 Debate Model Invocation Policy

## Purpose
This document is the SSOT for model invocation rules used by future multi-agent debate loops in topic selection. It defines how execution mode, provider profiles, role/stage mapping, Codex substitution, and provenance must work before implementation begins.

Business decisions still belong to node policies, deterministic validators, and domain services. This policy only governs how model-like agent calls are selected, executed, audited, and normalized.

## Status
- Policy version: `v1`
- Current locked decision: `DMP-10`
- Pending decisions: none

## DMP-01 Execution Mode And Provider Boundary
- Status: locked
- Date: 2026-05-19

### Decision
`execution_mode` MUST express the source class of model-like output, not the concrete provider or model.

The allowed model-like execution modes remain:
- `mocked_llm`
- `codex_assisted`
- `provider_llm`

`provider_llm` means a real provider-backed execution class. It MAY resolve to OpenAI, DashScope, DeepSeek, or another registered provider through a versioned model profile. It MUST NOT be split into provider-specific execution modes such as `openai_llm`, `dashscope_llm`, or `deepseek_llm`.

### Boundary
Concrete provider, model, provider-specific parameters, fallback policy, timeout, retry, budget, and reasoning/thinking parameters MUST be resolved from a versioned `model_profile_id`, not from workflow branching logic.

Conceptual shape:

```yaml
execution_mode: provider_llm
model_profile_id: topic-selection.need-discovery.explorer.v1
selected_model_option_id: provider-a-balanced-explorer
normalized_params:
  creativity: medium
  reasoning_depth: medium
  output_budget: medium
provider_fallback_policy:
  automatic_fallback: false
```

The exact profile fields are defined by `DMP-02`, `DMP-05`, and `DMP-06`.

### Required Semantics
- `mocked_llm` MUST remain test/acceptance fixture execution and MUST NOT participate in real product decisions.
- `codex_assisted` MUST remain distinguishable from provider-backed execution in provenance, audit, and persisted summaries.
- `provider_llm` MUST route provider API calls through `AgentOrchestrator` and the existing LLM gateway boundary.
- Workflow, node policy, harness, route, or service code MUST NOT branch on concrete provider ids for business behavior.
- Provider-specific parameters MUST NOT leak into domain services, deterministic validators, or persistence code.
- All execution modes MUST normalize to the same node contracts and pass the same deterministic validators and authority-write boundaries.

### Rationale
Keeping `execution_mode` provider-agnostic prevents a provider enum from becoming a second workflow runtime. Versioned model profiles can support multiple providers and parameter families while preserving one orchestration path, one provenance shape, and one deterministic validation path.

## DMP-02 Model Profile Registry Shape
- Status: locked
- Date: 2026-05-20

### Decision
Model profiles MUST be function, role, and stage oriented. They MUST NOT be primarily provider-ranking tables.

The model profile registry is the SSOT for model-like invocation configuration: workflow function, role family, stage family, quality objectives, output contract, allowed execution modes, capabilities, provider/model options, request policy, normalized parameters, provider-specific overrides, audit policy, and budget policy.

Role/stage policy may reference a versioned `profile_id`, but it MUST NOT directly encode concrete provider ids, model ids, provider-specific parameters, fallback chains, or budget rules.

### Minimum Profile Fields
Each debate-capable model profile SHOULD use this shape:

```yaml
profile_id: topic-selection.need-discovery.explorer.v1
status: active
profile_function: need_discovery_exploration
role_family: explorer
stage_family: discovery_expansion
quality_objectives:
  - broaden_candidate_framing
  - surface_latent_value_points
  - preserve_source_grounding
allowed_execution_modes: [provider_llm, codex_assisted]
required_capabilities:
  - structured_output
  - json_object
output_contract: RankedCandidateExplorationNotes@v1

model_options:
  - option_id: openai-balanced-explorer
    option_purpose: default_balanced_provider_run
    provider_id: openai
    model_id: gpt-model-id
    use_when:
      - default_provider_run
    request_policy:
      timeout_ms: 60000
    normalized_params:
      creativity: medium
      reasoning_depth: medium
      output_budget: medium
      structured_output_required: true
      output_format: json_schema
    provider_overrides: {}

  - option_id: dashscope-budget-explorer
    option_purpose: budget_sensitive_explicit_provider_run
    provider_id: dashscope
    model_id: qwen-model-id
    use_when:
      - budget_sensitive_manual_selection
    request_policy:
      timeout_ms: 120000
    normalized_params:
      creativity: medium
      reasoning_depth: medium
      output_budget: medium
      structured_output_required: true
      output_format: json_schema
    provider_overrides:
      enable_thinking: true
    capability_degrade_policy:
      allow_optional_degrade: false

provider_fallback_policy:
  automatic_fallback: false
  manual_rerun_allowed: true
  explicit_profile_override_allowed: true

audit_policy:
  store_prompt_hash: true
  store_response_hash: true
  store_structured_output: true
  store_raw_provider_response: false
  forbid_hidden_reasoning: true

budget_policy:
  max_provider_attempts: 1
  max_estimated_cost_usd: null
```

### Model Options
Different providers MAY share the same `model_options` envelope. This gives the harness, orchestrator, registry validators, and audit code one shape to inspect.

Provider differences MUST be isolated as follows:
- `normalized_params` contains cross-provider abstract parameters.
- `provider_overrides` contains provider-specific knobs.
- Provider adapters or the LLM gateway map both layers to concrete provider API payloads.
- Domain services, node policies, workflow harnesses, and deterministic validators MUST NOT interpret provider-specific overrides.

### Selection Semantics
`option_purpose` and `use_when` are the primary selection semantics for model options.

`priority` or `weight` MUST NOT carry business meaning. If introduced later, they MAY only act as a low-level tie-breaker among options with the same `option_purpose` and compatible `use_when` conditions.

### Boundary
- `DMP-02` defines the profile shape only.
- `DMP-03` defines role/stage to `profile_id` mapping.
- `DMP-04` defines Codex substitution by role/stage.
- `DMP-05` defines provider fallback and escalation behavior.
- `DMP-06` defines normalized parameter value sets and provider mappings.

### Rationale
Function-oriented profiles preserve why a model is being called before choosing who serves it. A unified option envelope keeps provider configuration auditable without forcing different providers into identical parameter semantics.

## DMP-03 Role/Stage To Profile Mapping
- Status: locked
- Date: 2026-05-20

### Decision
Debate execution MUST be decomposed into explicit role/stage invocation slots. Each slot MUST reference a versioned `profile_id`, output contract, and input context family. A role/stage mapping MUST NOT directly encode provider ids, model ids, provider-specific parameters, fallback chains, retry rules, or budget rules.

### Mapping Shape
Debate-capable nodes SHOULD use this mapping shape:

```yaml
node_id: topic-selection.v1a.generate-need-candidate.v1
debate_policy_id: topic-selection.need-discovery.debate.v1

role_stage_profiles:
  explorer:
    round_1_discovery:
      profile_id: topic-selection.need-discovery.explorer.v1
      input_context_family: exploration_context
      output_contract: NeedDiscoveryExplorerNotes@v1
      instance_policy:
        min_instances: 1
        max_instances: 3
        default_instances: 2
        allow_duplicate_model_options: true
        diversity_policy: prefer_prompt_or_context_angle_diversity
        merge_output_as: role_level_summary
    supplemental_repair:
      profile_id: topic-selection.need-discovery.explorer-repair.v1
      input_context_family: exploration_context
      output_contract: NeedDiscoverySupplementalNotes@v1
      instance_policy:
        min_instances: 1
        max_instances: 2
        default_instances: 1
        allow_duplicate_model_options: true
        diversity_policy: scoped_question_diversity
        merge_output_as: role_level_summary

  deep_critic:
    round_1_discovery:
      profile_id: topic-selection.need-discovery.deep-critic.v1
      input_context_family: exploration_context
      output_contract: NeedDiscoveryDeepCriticNotes@v1
      instance_policy:
        min_instances: 1
        max_instances: 3
        default_instances: 1
        allow_duplicate_model_options: true
        diversity_policy: prefer_critique_angle_diversity
        merge_output_as: role_level_summary
    supplemental_repair:
      profile_id: topic-selection.need-discovery.deep-critic-repair.v1
      input_context_family: exploration_context
      output_contract: NeedDiscoverySupplementalNotes@v1
      instance_policy:
        min_instances: 1
        max_instances: 2
        default_instances: 1
        allow_duplicate_model_options: true
        diversity_policy: scoped_question_diversity
        merge_output_as: role_level_summary

  arbiter:
    issue_framing:
      profile_id: topic-selection.need-discovery.arbiter-framing.v1
      input_context_family: arbiter_context
      output_contract: DebateIssueFrame@v1
      instance_policy:
        min_instances: 1
        max_instances: 1
        default_instances: 1
        allow_duplicate_model_options: false
        merge_output_as: arbiter_decision
    final_synthesis:
      profile_id: topic-selection.need-discovery.arbiter-final.v1
      input_context_family: arbiter_context
      output_contract: RankedCandidateDraftBatch@v1
      instance_policy:
        min_instances: 1
        max_instances: 1
        default_instances: 1
        allow_duplicate_model_options: false
        merge_output_as: external_structured_output
```

### Required Semantics
- `explorer` and `deep_critic` MAY have multiple instances in the same role/stage.
- Multiple same-role outputs MUST be merged into a role-level summary before arbiter consumption.
- `arbiter` MUST be single-instance for each debate loop and is the only external structured-output port.
- Worker role multiplicity is defined by `instance_policy`, not by a provider list.
- Multi-instance worker roles MAY resolve to one or more provider/model options, including duplicate options, through their bound profile.
- Reusing the same provider/model for multiple instances is allowed only when each instance has a distinct `agent_instance_id` and provenance.
- Each role instance MUST record `agent_instance_id`, role, stage, `profile_id`, selected model option id when applicable, provider/model identity when applicable, prompt packet hash, response hash, and execution provenance.
- `round_1_discovery` MAY explore broadly within the node scope.
- `supplemental_repair` MUST be limited to arbiter-specified questions and MUST NOT restart broad exploration.
- Only the arbiter `final_synthesis` output may enter D-20 ranked candidate draft batch schema validation for v1a need discovery.
- If a required role/stage slot has no profile mapping, the debate loop MUST stop as `blocked`; it MUST NOT invent a default provider or profile.

### Boundary
- `DMP-03` defines role/stage to `profile_id` mapping only.
- `DMP-04` defines Codex substitution by role/stage.
- `DMP-05` defines provider fallback and escalation.
- `DMP-08` defines retry and failure handling.
- Node policies still define debate triggers, blockers, authority boundaries, and deterministic validators.

### Rationale
Explicit role/stage slots keep debate orchestration inspectable and prevent hidden provider logic from becoming workflow semantics. The mapping also preserves the split between exploration context for worker roles and arbiter context for synthesis, ranking, and gate preparation.

## DMP-04 Codex Substitution Rules
- Status: locked
- Date: 2026-05-20

### Decision
Codex substitution is a role/stage slot-level execution override under `execution_mode=codex_assisted`. It MAY replace selected model-like invocations for local cost control, but it MUST NOT replace the model profile itself, change the role/stage mapping, or masquerade as `provider_llm`.

### Substitution Shape
Debate-capable nodes SHOULD declare Codex substitution policy separately from role/stage profile mapping:

```yaml
codex_substitution:
  default_enabled: true
  allowed_slots:
    - role: explorer
      stages: [round_1_discovery, supplemental_repair]
    - role: deep_critic
      stages: [round_1_discovery, supplemental_repair]
    - role: arbiter
      stages: [issue_framing]
  forbidden_slots:
    - role: arbiter
      stages: [final_synthesis]
      rule: forbidden_in_v1_executable_contract
  forbidden_when:
    - provider_quality_scenario
    - explicit_provider_run
    - missing_operator_trace
```

### Required Semantics
- Codex substitution is allowed by default for local personal cost control where the node policy permits it.
- `explorer` and `deep_critic` are the preferred Codex substitution targets.
- `arbiter.issue_framing` MAY use Codex because it frames internal discussion points.
- `arbiter.final_synthesis` is forbidden for Codex substitution in the v1 executable contract because it is the only external structured-output port. It may run only as `mocked_llm` in test/acceptance isolation or `provider_llm` for real execution.
- Provider-quality scenarios and explicit provider runs MUST NOT use Codex substitution.
- Codex failure MUST NOT fallback to `mocked_llm`.
- Codex output MUST pass the same output contract, schema validation, deterministic gates, routing, and authority-write boundaries as provider output.
- Codex output MUST record `execution_mode=codex_assisted`, `source_kind=codex_response`, `non_provider=true`, operator label, prompt packet hash, response hash, and optional operator approval ref.
- Codex substitution MUST NOT alter `profile_id`; the original role/stage profile remains the semantic intent.

### Boundary
- `DMP-04` defines where Codex may substitute for a role/stage invocation.
- `DMP-05` defines provider fallback and escalation when `execution_mode=provider_llm`.
- `DMP-07` defines the full provenance/audit field set.
- `DMP-09` defines mock/test isolation.

### Rationale
Codex can reduce local provider cost while preserving one workflow contract. Treating Codex as an execution override, rather than a hidden provider fallback, keeps provenance honest and prevents provider-quality acceptance from being satisfied by non-provider output.

## DMP-05 Provider Fallback And Escalation
- Status: locked
- Date: 2026-05-20

### Decision
Automatic provider fallback is disabled in v1.

A failed `provider_llm` invocation MUST record a failure artifact and stop the current role/stage slot or node as `blocked`. The operator MAY manually rerun the same profile or explicitly choose a different profile/model option, but the system MUST NOT automatically switch providers, switch to Codex, or switch to mocked output.

### Policy Shape
Debate-capable profiles SHOULD express v1 fallback behavior with this shape:

```yaml
provider_fallback_policy:
  automatic_fallback: false
  manual_rerun_allowed: true
  explicit_profile_override_allowed: true
  provider_failure_result: blocked
  record_failure_artifact: true
```

### Required Semantics
- `provider_llm` provider-call failure MUST record a failure artifact before returning `blocked`.
- v1 MUST NOT automatically fallback from one provider/model option to another provider/model option.
- v1 MUST NOT automatically fallback from `provider_llm` to `codex_assisted`.
- v1 MUST NOT fallback from any real execution mode to `mocked_llm`.
- Manual rerun MUST create a new attempt/run record with explicit provenance.
- Explicit profile or provider-option override MUST be operator-visible and MUST create a new attempt/run record with explicit provenance.
- Schema validation failure, deterministic validator failure, admission failure, routing blockers, and persistence failure are node/workflow failures, not provider-call failures; they MUST NOT trigger provider fallback.
- Future automatic fallback, if introduced, MUST be handled by a separate task and MUST include a deterministic attempt ledger, stable replay key, per-attempt telemetry, scenario coverage, and node-policy opt-in.

### Boundary
- `DMP-05` defines v1 fallback and escalation behavior only.
- `DMP-06` defines normalized parameter value sets and provider mappings.
- `DMP-07` defines the full provenance, audit, and telemetry field set.
- `DMP-08` defines retry, blocked, and human-review behavior outside provider fallback.
- Node policies still define whether a blocked provider slot blocks the whole node or can be surfaced for manual review.

### Rationale
This project is local-first and personal-use. Reproducibility, debuggability, and no-dual-track semantics are more valuable than high-availability provider failover. Disabling automatic fallback keeps provider choice explicit and prevents hidden provider/model changes from contaminating acceptance evidence.

## DMP-06 Parameter Normalization
- Status: locked
- Date: 2026-05-20

### Decision
Model invocation parameters MUST be normalized as cross-provider intent in the model profile. Workflow matrices, node policies, role/stage mappings, harness scenarios, domain services, and persisted authority objects MUST NOT contain concrete provider parameter names.

The canonical v1 parameter surface is intentionally small:

```yaml
normalized_params:
  creativity: low | medium | high
  reasoning_depth: none | low | medium | high | xhigh
  output_budget: small | medium | large
  structured_output_required: true | false
  output_format: text | json_object | json_schema
```

Provider-specific parameters MAY appear only under `provider_overrides` inside a versioned model option. Provider adapters or the LLM gateway map `normalized_params` plus `provider_overrides` to concrete provider payloads.

### Required Semantics
- Role/stage mapping MUST reference `profile_id`; it MUST NOT set `temperature`, `top_p`, `max_tokens`, `reasoning_effort`, `thinking_effort`, `enable_thinking`, or equivalent provider parameters.
- Node input/result contracts MUST NOT expose provider-specific parameter names.
- `normalized_params` MUST use only the canonical v1 keys unless a later profile-registry migration adds a new versioned key.
- `creativity` expresses exploration variance, not provider temperature directly.
- `reasoning_depth` expresses desired analysis budget, not a guarantee that every provider exposes the same reasoning/thinking mechanism.
- `output_budget` expresses expected response size; concrete token limits belong to provider adapters or provider overrides.
- `structured_output_required=true` and `output_format=json_schema` MUST be enforced by the calling wrapper/orchestrator contract before any downstream deterministic gates run.
- If a required capability cannot be satisfied by the selected provider/model option, profile resolution MUST fail fast.
- Optional capability degradation is allowed only when the model option explicitly permits it and the run records `capability_degraded=true` with a reason.
- Hidden reasoning, chain-of-thought, raw thinking traces, and provider-private reasoning payloads MUST NOT be persisted, even when `reasoning_depth` requests deeper analysis.
- `codex_assisted` execution MAY consume the same normalized intent, but its provenance MUST show it was applied through an operator/Codex-assisted path rather than a provider API payload.

### Provider Mapping Boundary
The provider adapter layer owns concrete mappings such as:

```yaml
provider_parameter_mapping:
  provider-a:
    creativity: adapter_maps_to_supported_sampling_controls
    reasoning_depth: adapter_maps_to_supported_reasoning_controls
    output_budget: adapter_maps_to_supported_output_limits
  provider-b:
    creativity: adapter_maps_to_supported_sampling_controls
    reasoning_depth: adapter_maps_to_supported_thinking_controls
    output_budget: adapter_maps_to_supported_output_limits
```

Concrete API field names are adapter details and MUST NOT be duplicated in node policies or workflow definitions.

### Boundary
- `DMP-06` defines normalized parameter semantics and provider mapping boundaries.
- `DMP-02` defines where normalized parameters live inside model profiles.
- `DMP-05` remains authoritative for fallback; parameter mapping MUST NOT imply automatic provider fallback.
- `DMP-07` defines which parameter summaries, hashes, and capability-degrade markers are recorded in provenance/audit.
- `DMP-10` defines the final SSOT and implementation-location rules for profile registry and adapters.

### Rationale
Provider APIs differ and change. A compact normalized parameter layer lets workflow and debate design express functional intent while keeping provider-specific mechanics inside the LLM gateway/profile adapter boundary. This prevents role semantics from drifting into provider-specific behavior.

## DMP-07 Provenance, Audit, And Telemetry
- Status: locked
- Date: 2026-05-20

### Decision
All model-like invocations MUST use one common provenance/audit envelope. Debate MAY add a debate extension to the same envelope, but it MUST NOT use a separate tracing model.

The common envelope applies to `provider_llm`, `codex_assisted`, and `mocked_llm` execution. Single-agent nodes use the common fields only. Multi-agent debate nodes use the common fields plus debate extension fields for role, stage, round, and worker-to-arbiter lineage.

### Common Invocation Envelope
Every model-like invocation attempt SHOULD record this minimum shape:

```yaml
invocation_provenance:
  workflow_run_id: string
  node_attempt_id: string
  invocation_attempt_id: string
  node_id: string
  execution_mode: provider_llm | codex_assisted | mocked_llm
  run_mode: product | acceptance | test

  profile:
    profile_id: string
    profile_version: string
    profile_hash: string
    model_option_id: string | null
    normalized_params_hash: string
    capability_degraded: boolean
    capability_degrade_reason: string | null

  source:
    source_kind: provider_response | codex_response | mock_fixture
    provider_id: string | null
    model_id: string | null
    provider_request_id: string | null
    codex_operator_label: string | null
    mock_fixture_id: string | null

  input:
    prompt_template_id: string
    prompt_template_version: string
    prompt_packet_hash: string
    context_packet_refs: string[]
    context_packet_hashes: string[]

  output:
    response_hash: string | null
    structured_output_hash: string | null
    schema_validation_status: passed | failed | skipped
    artifact_refs: string[]
    status: succeeded | blocked | require_human_review | failed
    error_code: string | null

  telemetry:
    started_at: string
    completed_at: string | null
    duration_ms: number | null
    input_token_estimate: number | null
    output_token_estimate: number | null
    cost_estimate_usd: number | null
    cache_status: miss | hit | bypassed | not_applicable
    response_reuse_ref: string | null
```

### Debate Extension
Debate invocations SHOULD add this extension:

```yaml
debate_extension:
  debate_loop_id: string
  debate_policy_id: string
  round_index: number
  role: explorer | deep_critic | arbiter
  stage: string
  agent_instance_id: string
  parent_invocation_attempt_ids: string[]
  role_level_summary_ref: string | null
  arbiter_issue_frame_ref: string | null
  arbiter_final_artifact_ref: string | null
```

### Required Semantics
- The common envelope is mandatory for single-agent and debate model-like invocations.
- Debate-specific fields MUST live in `debate_extension`; they MUST NOT fork the common envelope.
- `execution_mode`, `source_kind`, `profile_id`, and source identity fields MUST distinguish provider, Codex, and mock outputs clearly.
- `provider_request_id` MAY be stored as diagnostic metadata, but it MUST NOT become a business input or authority reference.
- Prompt text, raw provider logs, secrets, credentials, API keys, hidden reasoning, chain-of-thought, raw thinking traces, and provider-private reasoning payloads MUST NOT be persisted.
- Raw worker outputs MAY be stored only as internal audit artifacts after redaction. They MUST NOT cross the node boundary as business inputs.
- The arbiter final artifact or node result is the only debate output that MAY feed downstream deterministic gates.
- Business-facing node results SHOULD expose only node status, authority refs, warnings/blockers, selected artifact refs, and audit refs/hashes.
- Cache and response reuse markers are provenance facts only; they MUST NOT change `execution_mode` or bypass schema validation and deterministic gates.
- Telemetry fields are diagnostic/cost evidence. Missing token or cost estimates MUST NOT block a node unless a node policy explicitly requires budget enforcement.

### Boundary
- `DMP-07` defines provenance, audit, telemetry, and debate lineage fields.
- `DMP-05` defines provider fallback behavior and manual rerun/override semantics.
- `DMP-06` defines normalized parameter semantics; `DMP-07` records only parameter summaries and hashes, not provider-specific payloads.
- `DMP-08` defines retry, blocked, failed, and human-review status semantics.
- `DMP-09` defines mock/test isolation rules.
- `DMP-10` defines the final SSOT and implementation-location rules for the envelope schema.

### Rationale
One provenance envelope keeps ordinary agent workflows and debate workflows on the same audit rail. The debate extension captures internal role/round lineage without allowing worker traces to become business contracts or a parallel workflow output path.

## DMP-08 Failure, Retry, Blocked, And Human Review
- Status: locked
- Date: 2026-05-20

### Decision
v1 allows only narrow low-level technical retry. It does not allow semantic retry, automatic provider fallback, or hidden re-asking of the model after schema, grounding, admission, or persistence failures.

A retry is technical only when it keeps the same `profile_id`, model option, normalized parameters, prompt packet hash, context packet hashes, output contract, and execution mode. Any change to those inputs is a new invocation attempt or an explicit operator rerun, not a retry.

### Policy Shape
Debate-capable profiles SHOULD express failure handling with this shape:

```yaml
failure_handling_policy:
  technical_retry:
    enabled: true
    max_provider_call_attempts: 2
    retryable_error_classes:
      - network_timeout
      - transient_rate_limit
      - transient_provider_5xx
    require_same_profile: true
    require_same_model_option: true
    require_same_prompt_packet_hash: true
    require_same_context_packet_hashes: true

  semantic_retry:
    enabled: false

  provider_fallback:
    automatic_fallback: false

  supplemental_round:
    is_retry: false
    requires_arbiter_scoped_questions: true
```

### Status Semantics
- `succeeded`: the invocation or node produced contract-valid output accepted by downstream deterministic gates for that step.
- `blocked`: the system cannot safely continue automatically, and the stop reason is operational, contractual, missing-data, or deterministic workflow failure rather than an explicit human judgment request.
- `require_human_review`: the system has enough context to present a grounded judgment question, but product policy requires operator decision before continuing.
- `failed`: an unexpected implementation/runtime failure occurred and should be treated as a bug or infrastructure problem, not as a valid workflow decision.

### Required Semantics
- Low-level technical retry MAY retry only provider transport or transient provider errors, and only under the same invocation semantics.
- Each provider-call retry MUST be recorded under the invocation provenance, including attempt index, retryable error class, provider request id when available, start/end time, and final outcome.
- Technical retry MUST NOT alter prompt text, context packets, profile, model option, parameters, schema, execution mode, role, stage, or debate round.
- Provider-call exhaustion under `provider_llm` MUST follow `DMP-05`: record a failure artifact and return `blocked`; it MUST NOT fallback.
- Schema validation failure MUST NOT trigger a model retry.
- Deterministic validator failure, admission failure, routing blocker, and persistence failure MUST NOT trigger model retry.
- `codex_assisted` failure MUST NOT fallback to `mocked_llm` or `provider_llm`.
- `mocked_llm` failures are test/acceptance fixture failures and MUST NOT be treated as product runtime recovery paths.
- Debate supplemental rounds are not retries. A supplemental round is allowed only when the arbiter emits scoped repair questions, remaining round budget exists, and the node policy permits supplemental repair.
- A supplemental round MUST re-enter the same output contract, schema validation, deterministic gates, routing, and authority-write boundary as the initial round.
- `blocked` MUST preserve blockers, error code, audit refs, and retry/rerun eligibility hints.
- `require_human_review` MUST preserve the concrete review question, candidate/ref targets, supporting evidence refs, unresolved judgment reason, and audit refs.

### Boundary
- `DMP-08` defines failure and retry semantics for model-like invocation and debate flow.
- `DMP-05` remains authoritative for provider fallback and manual profile/provider-option override.
- `DMP-07` defines how retry attempts, blockers, and human-review context are recorded.
- Node policies define whether a specific blocker stops the node, surfaces human review, or routes to a scoped supplemental round.
- Persistence rollback/idempotency remains owned by the domain persistence service and repository contracts, not by model retry policy.

### Rationale
Most model failures in this workflow are semantic or contractual, not transport failures. Automatically re-asking the model after those failures would hide product decisions inside retry behavior. Keeping retry narrow makes failures inspectable and keeps supplemental debate repair as an explicit arbiter-led workflow step.

## DMP-09 Mock/Test And Real-Decision Isolation
- Status: locked
- Date: 2026-05-20

### Decision
`mocked_llm` is test and acceptance infrastructure only. It MUST NOT participate in product-mode decisions, product-mode authority writes, provider-quality evidence, or real-flow acceptance claims.

Real decision evidence MUST come from `provider_llm` or explicitly marked `codex_assisted` runs. Mock evidence MAY prove contract, routing, validation, persistence-isolation, and harness behavior, but it MUST remain visibly separate from real decision evidence.

### Isolation Matrix

```yaml
execution_isolation:
  product:
    allowed_execution_modes: [provider_llm, codex_assisted]
    forbidden_execution_modes: [mocked_llm]
    authority_write_scope: product_database
    mock_authority_write_allowed: false

  acceptance:
    allowed_execution_modes: [mocked_llm, provider_llm, codex_assisted]
    authority_write_scope: isolated_acceptance_database_or_fixture_namespace
    mock_authority_write_allowed: true
    real_decision_claim_requires: [provider_llm_or_codex_assisted, explicit_source_kind]

  test:
    allowed_execution_modes: [mocked_llm]
    authority_write_scope: in_memory_or_test_database
    mock_authority_write_allowed: true
```

### Required Semantics
- `mocked_llm` MUST be rejected when `run_mode=product`.
- `mocked_llm` MUST NOT write product database authority records.
- Mock-backed persistence coverage MUST use an in-memory repository, isolated test database, isolated acceptance database, or explicit fixture namespace.
- Mock-backed artifacts MUST record `run_mode`, `execution_mode=mocked_llm`, `source_kind=mock_fixture`, and `mock_fixture_id`.
- Provider-backed artifacts MUST record `execution_mode=provider_llm`, `source_kind=provider_response`, and provider/model identity.
- Codex-assisted artifacts MUST record `execution_mode=codex_assisted`, `source_kind=codex_response`, `non_provider=true`, and operator/Codex provenance.
- `mocked_llm` output MUST NOT satisfy provider-quality scenarios or real-flow acceptance criteria.
- Real E2E evidence MUST be labeled separately from mock acceptance evidence in verification notes and artifact summaries.
- `provider_llm` or `codex_assisted` failure MUST NOT fallback to `mocked_llm`.
- `mocked_llm` failure is a test/acceptance fixture failure and MUST NOT trigger product recovery behavior.
- Cache/reuse records generated from mock output MUST NOT be consumed by product-mode runs.
- Mixed-source comparison is allowed for quality review only when the report explicitly separates source classes and does not merge mock results into real decision metrics.

### Boundary
- `DMP-09` defines run-mode and mock isolation.
- `DMP-04` defines Codex substitution and its provenance requirements.
- `DMP-05` and `DMP-08` forbid fallback from real execution modes to mock.
- `DMP-07` defines the common provenance fields that make source separation auditable.
- `DMP-10` defines where run-mode enforcement, fixture namespaces, and product/test database separation must live in implementation.

### Rationale
Mock runs are valuable for deterministic acceptance, but they are dangerous when their outputs resemble real decisions. Strict run-mode, provenance, and persistence isolation prevents a passing mock harness from being misread as a real topic-selection flow.

## DMP-10 SSOT And No-Dual-Track Implementation Rules
- Status: locked
- Date: 2026-05-20

### Decision
Debate model invocation v1 MUST have one implementation path. Model profiles, role/stage mappings, invocation entrypoints, provenance, artifacts, cache/reuse, run-mode enforcement, and authority writes MUST NOT fork into debate-specific alternatives.

The model profile registry is the SSOT for provider/model selection, provider/model options, normalized parameters, provider overrides, capability requirements, fallback policy, retry policy, audit policy, budget policy, and mock/run-mode eligibility. Workflow and node policy documents may reference profile ids and execution modes, but they MUST NOT duplicate concrete provider/model/parameter rules.

### Implementation Ownership
The implementation MUST keep these ownership boundaries:

```yaml
implementation_ownership:
  model_profile_registry:
    owns:
      - provider_and_model_options
      - normalized_params
      - provider_overrides
      - required_capabilities
      - fallback_policy
      - retry_policy
      - audit_policy
      - budget_policy
      - run_mode_eligibility

  workflow_and_node_policy:
    may_reference:
      - node_id
      - execution_mode
      - run_mode
      - profile_id
      - role_stage_profile_mapping
      - deterministic_gate_policy
    must_not_define:
      - concrete_provider_id
      - concrete_model_id
      - provider_specific_parameters
      - fallback_chain
      - alternate_mock_rules

  invocation_runtime:
    entrypoint: AgentOrchestrator
    provider_boundary: BackendLlmGateway
    provenance_shape: common_invocation_envelope
    debate_extra_shape: debate_extension

  artifacts_and_authority:
    artifact_boundary: TopicSelectionControlPlaneService artifact refs
    authority_write_boundary: domain service and repository contracts
    workflow_harness_boundary: registered WorkflowScenario definitions
```

### Required Semantics
- Feature code MUST NOT import or call provider SDKs directly.
- All provider calls MUST pass through `AgentOrchestrator` and the existing LLM gateway boundary.
- Debate MUST NOT introduce a separate LLM router, prompt runtime, cache layer, artifact writer, transcript store, or authority persistence path.
- Role/stage mapping MUST only reference versioned `profile_id` values and output/input contracts.
- Provider/model/parameter changes MUST be made through versioned profile registry changes and profile validation.
- Prompt templates MUST remain versioned references; node adapters may build prompt packets, but they MUST NOT create an unversioned parallel prompt source for debate.
- The common provenance envelope from `DMP-07` is the only invocation audit shape. Debate may add `debate_extension` only.
- Run-mode enforcement from `DMP-09` MUST run at orchestration/harness boundaries and at any future route-level node runner boundary.
- Mock/test isolation MUST NOT be reimplemented differently in individual node services.
- Cache and response reuse MUST be recorded through the shared provenance/cache markers and MUST NOT create a new execution mode.
- Artifacts MUST be written through the existing control-plane artifact-ref boundary with redaction policy applied.
- Authority writes MUST remain inside domain services/repositories; agent/debate runtime MUST only produce validated artifacts or commands consumed by those services.
- Workflow acceptance coverage MUST use registered `WorkflowScenario` definitions, not standalone runners with independent routing semantics.
- Future multi-agent debate implementation MUST reuse the same profile resolver, orchestrator, provenance envelope, artifact boundary, and domain persistence boundary as single-agent nodes.
- Any exception to these rules requires a new task package, explicit drift analysis, and governance lint/update before implementation.

### Implementation Order
Implementation SHOULD proceed in this order:
- Profile registry/schema validator for DMP-01 through DMP-10.
- Shared provenance envelope contract and validator.
- Orchestrator profile resolution and run-mode enforcement.
- WorkflowHarness scenario wiring over the shared runtime.
- Route-level node runner only after harness scenarios pass.
- Provider/Codex real-flow evidence only after mock/test isolation and provenance validation pass.

### Boundary
- `DMP-10` finalizes SSOT and implementation-location rules for Debate Model Invocation Policy v1.
- It does not implement the registry, route runner, profile validator, or multi-agent loop by itself.
- Any implementation task must keep DMP-01 through DMP-10 as the policy baseline.

### Rationale
The highest long-term risk is not a missing provider option; it is two plausible invocation systems coexisting with slightly different semantics. A single SSOT and one runtime path keep single-agent workflows, debate workflows, mock harnesses, Codex-assisted runs, and provider-backed runs comparable and auditable.

## Pending Decisions
- None. Debate Model Invocation Policy v1 is fully locked by `DMP-01` through `DMP-10`.
