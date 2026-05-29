# 02 Architecture

## Relationship To Existing Tasks
- T-088 owns the generic WorkflowHarness and AgentOrchestrator foundations.
- T-089 owns node-level agent/debate classification and policy semantics.
- T-107/T-108/T-111 own v1b/v1c/v1a orchestration hardening.
- T-112 owns the cross-cutting LLM context/cache/compression/token-budget runtime used by those flows.

## Runtime Boundaries
- `AgentOrchestrator`: remains the single structured agent invocation boundary. T-112 adds prompt/context cache policy and token-budget preflight here or in a collaborator called only from here.
- `BackendLlmGateway`: remains the only provider API path. It may report telemetry and provider-cache fields, but it must not make business cache decisions.
- Context compilers: compile ref-backed packets and consult the shared context packet cache before recording duplicate packets.
- WorkflowHarness: invokes nodes and asserts cache/reuse/token-budget behavior without owning cache semantics.
- Domain services: remain authority writers and deterministic gate owners.

## Cache Classes
| Class | Purpose | Authority? | Reuse Rule |
|---|---|---:|---|
| `context_packet_cache` | Reuse compiled context packets | no | Exact match on node, context family, source refs/hash, compiler, policy, schema, profile, execution mode, memory/candidate hashes |
| `prompt_packet_cache` | Reuse redacted prompt packets | no | Exact match on messages, context refs/hashes, prompt template, schema, profile/model option, normalized params |
| `response_reuse_cache` | Reuse exact structured responses | no | Explicit replay/test/acceptance or operator-approved Codex-assisted reuse only |
| `artifact_cache` | Reuse large summaries/digests | no | Rebuildable/ref-backed only; never a business fact source |
| `projection_cache` | Speed read-only projections | no | Rebuildable from authority records and artifact refs |
| `durable_memory` | Business memory records | conditional | Enters context as warnings/constraints/challenges, not evidence |

## Exact Key Fields
All cache/reuse keys must include the relevant subset of:
- `node_id`
- `workflow_profile_key` or `profile_id`
- `execution_mode`
- `executor_kind`
- `context_family`
- `input_refs_hash`
- `context_packet_hashes`
- `prompt_packet_hash`
- `policy_version`
- `schema_version`
- `context_compiler_version`
- `prompt_template_id`
- `prompt_template_version`
- `profile_hash`
- `model_option_id`
- `normalized_params_hash`
- `output_contract`
- `redaction_policy`

## Token Budget Gate
The gate runs before provider execution. It must produce an auditable result with:
- model/provider/profile identity;
- estimated input tokens;
- estimated output budget;
- available context window when known;
- schema/token overhead estimate;
- decision;
- compression strategy ref when used;
- warning/blocker codes.

If token budget cannot be estimated reliably, node policy decides whether to allow with warning or block. Provider calls must still record actual telemetry afterward.

## Compression Rules
- Compression is source-ref backed and hash-checked.
- Compression may remove verbosity but must preserve blockers, accepted risks, residual risks, unresolved challenges, source-health warnings, recheck hints, and method-family coverage gaps.
- Exploration context can favor recall; arbiter/gate context must favor strictness and decision readiness.
- Compression artifacts must not persist hidden reasoning, raw provider logs, credentials, secrets, or unredacted private content.

## Response Reuse Rules
- No new execution mode is introduced for cache reuse.
- `provider_llm` means a live provider call was attempted for that invocation. If a provider-required scenario sees an exact cache hit, it must treat it as a miss or block according to policy.
- `codex_assisted` may reuse an exact response only when operator-approved or locally configured as approved reuse.
- `mocked_llm` may use exact replay/test fixtures in test or acceptance.
- Every reused response re-enters normal schema validation and deterministic gates.

## Drift Handling
Drift must block or miss cache when any of these change:
- source refs or source hash;
- policy version;
- schema version;
- compiler version;
- prompt template version;
- profile hash;
- model option;
- normalized params;
- execution mode;
- executor kind;
- context family;
- redaction policy.

## Provider Cache Telemetry
Provider-side cache behavior, if exposed by an API, is telemetry only. It cannot satisfy business cache requirements and cannot be treated as proof of response reuse unless the shared response reuse provenance is present.

