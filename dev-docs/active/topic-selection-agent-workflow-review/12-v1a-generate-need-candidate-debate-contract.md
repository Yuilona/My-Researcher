# v1a Generate Need Candidate Debate Contract

## Status
- Status: executable-contract-v1
- Node: `topic-selection.v1a.generate-need-candidate.v1`
- Scenario: `topic-selection.debate.v1a-need-discovery.v1`
- Debate policy: `topic-selection.need-discovery.debate.v1`
- Shared SSOT: `packages/shared/src/research-lifecycle/topic-selection-debate-scenario-contracts.ts`

## Purpose
This document records the executable v1a debate contract for generating need candidates. It narrows the broader DMP policy into the concrete role/stage slots that the backend can run and verify now.

## Runtime Boundary
- The debate loop produces only `RankedCandidateDraftBatch@v1` through `arbiter.final_synthesis`.
- Worker outputs are audit/artifact inputs only. They MUST NOT write `NeedCandidate`, `NeedCandidateSet`, `ValidatedNeed`, or `TopicQuestionContract`.
- The existing D-20/D-21/D-22/D-23 chain remains authoritative for schema validation, candidate admission, supplemental routing, and optional persistence.
- Raw debate transcripts, hidden reasoning, provider-private reasoning payloads, secrets, and raw provider logs MUST NOT be persisted.
- `execution_mode` is resolved per role/stage slot. A run MAY default to `provider_llm` and override allowed worker or issue-framing slots to `codex_assisted`; `arbiter.final_synthesis` MUST remain `provider_llm` for real execution or `mocked_llm` for isolated tests.

## Role/Stage Slots

| Slot | Role | Stage | Context | Output | Instances | Codex |
| --- | --- | --- | --- | --- | --- | --- |
| `explorer.round_1_discovery` | `explorer` | `round_1_discovery` | `exploration_context` | `NeedDiscoveryExplorerNotes@v1` | min 1, default 2, max 3 | allowed |
| `deep_critic.round_1_discovery` | `deep_critic` | `round_1_discovery` | `exploration_context` | `NeedDiscoveryDeepCriticNotes@v1` | min 1, default 1, max 3 | allowed |
| `arbiter.issue_framing` | `arbiter` | `issue_framing` | `arbiter_context` | `DebateIssueFrame@v1` | exactly 1 | allowed |
| `arbiter.final_synthesis` | `arbiter` | `final_synthesis` | `arbiter_context` | `RankedCandidateDraftBatch@v1` | exactly 1 | forbidden in v1 executable contract |

## Model Profiles

| Slot | `profile_id` | Prompt Template | Schema Name |
| --- | --- | --- | --- |
| `explorer.round_1_discovery` | `topic-selection.need-discovery.explorer.v1` | `topic-selection-need-discovery-explorer@v1` | `topic_selection_need_discovery_explorer_notes` |
| `deep_critic.round_1_discovery` | `topic-selection.need-discovery.deep-critic.v1` | `topic-selection-need-discovery-deep-critic@v1` | `topic_selection_need_discovery_deep_critic_notes` |
| `arbiter.issue_framing` | `topic-selection.need-discovery.arbiter-framing.v1` | `topic-selection-need-discovery-arbiter-issue-frame@v1` | `topic_selection_need_discovery_debate_issue_frame` |
| `arbiter.final_synthesis` | `topic-selection.need-discovery.arbiter-final.v1` | `topic-selection-need-discovery-arbiter-final@v1` | `topic_selection_ranked_candidate_draft_batch` |

## Provider Options
Provider/model selection is owned by the model profile registry, not by node policy or workflow code.

Provider-backed debate runs MAY pass explicit `slot_model_option_overrides` keyed by the slot ids above. Each value must be a model option defined by that slot's bound profile. Overrides are illegal for slots whose effective `execution_mode` is `mocked_llm` or `codex_assisted`.

Default option for every current v1a debate profile:
- `provider_id`: `openai`
- `model_id`: `gpt-5.4-mini`
- `use_when`: `default_provider_run`
- `timeout_ms`: `60000`

Manual budget option:
- `provider_id`: `dashscope`
- `model_id`: `qwen3.6-plus`
- `use_when`: `budget_sensitive_manual_selection`
- `timeout_ms`: `120000`
- `provider_overrides`: `enable_thinking: true`

Normalized params for current model options:
- `creativity`: `medium`
- `reasoning_depth`: `medium`
- `output_budget`: `medium`
- `structured_output_required`: `true`
- `output_format`: `json_schema`

## Failure And Audit
- `provider_llm` failure returns `blocked`; automatic fallback is forbidden.
- Provider changes require manual rerun or explicit model-option override with new provenance.
- `mocked_llm` is test/acceptance-only and cannot satisfy real provider-quality evidence.
- Slot-level Codex substitution is supported only through explicit `slot_execution_overrides`; it is never an automatic fallback from provider failure.
- Slot-level provider model-option selection is supported only through explicit `slot_model_option_overrides`; it is never an automatic fallback or provider-ranking mechanism.
- The round cap is 3. Supplemental repair orchestration remains a follow-up runtime slice; the current executable contract covers the runnable initial discovery loop.
- Required artifacts: `debate_role_output`, `debate_role_level_summary`, `debate_issue_frame`, `debate_final_synthesis`.

## Verification
- Shared schema: `topicSelectionDebateScenarioContractSchema`.
- Backend runtime: `TopicSelectionNeedDiscoveryDebateLoopService`.
- Provider contract test must assert two explorer calls, one deep critic call, one issue-framing arbiter call, and one final-synthesis arbiter call under default provider selection.
- Mixed-mode contract test must assert a Codex-assisted worker slot can run while arbiter final synthesis stays provider-backed.
