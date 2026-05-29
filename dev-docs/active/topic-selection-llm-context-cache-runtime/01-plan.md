# 01 Plan

## Phase 0 - Current-State Inventory
- Inventory all topic-selection LLM-like call paths:
  - resource sampling classification;
  - v1a evidence extraction, need generation, adjudication, semantic confirmation;
  - v1b semantic draft/support nodes;
  - v1c promotion support and feedback normalization;
  - downstream feedback/recheck bridges that consume topic-selection outputs.
- Classify existing mechanisms as context hash, prompt hash, replay hash, telemetry, cache marker, compression marker, or true reusable cache.
- Record node gaps in `06-node-scope-matrix.md`.

## Phase 1 - Policy And Contract Design
- Define shared vocabulary:
  - `context_packet`;
  - `prompt_packet`;
  - `invocation_cache_key`;
  - `token_budget_gate`;
  - `compression_report`;
  - `response_reuse_provenance`.
- Lock cache classes:
  - context packet cache;
  - prompt packet cache;
  - response reuse cache;
  - artifact/projection cache;
  - durable business memory.
- Define drift blockers for source refs, input hash, policy version, schema version, compiler version, profile hash, model option, execution mode, context family, and redaction policy.

## Phase 2 - Context Packet Cache Runtime
- Add read-through cache lookup for compiled context packets before recording a new artifact.
- Ensure cache hits return existing artifact refs and mark `cache_hit=true`.
- Ensure stale keys miss or block according to node policy.
- Preserve current artifact boundary behavior and forbid cache hits across context families.

## Phase 3 - Token Budget Gate
- Add provider-call preflight in `AgentOrchestrator` or a small runtime collaborator.
- Estimate prompt/context/schema output budget before `BackendLlmGateway.createStructuredOutput`.
- Return typed gate outcomes:
  - `within_budget`;
  - `requires_compression`;
  - `blocked_over_budget`;
  - `budget_unknown_allow_with_warning`.
- Route `requires_compression` only through node-approved compression strategies.

## Phase 4 - Compression Runtime
- Implement ref-backed compression layers with compiler version, source refs, hashes, redaction policy, token estimates, and quality-gate status.
- Keep raw provider logs, hidden reasoning, credentials, and unredacted secrets out of persisted artifacts.
- Add node-specific compression policies for broad exploration context versus strict arbiter/gate context.

## Phase 5 - Exact Response Reuse
- Add exact invocation cache keys for approved replay/Codex-assisted cost-saving paths.
- Forbid silent provider response reuse in `provider_llm`.
- Require reused responses to pass schema validation, deterministic gates, audit recording, and authority-write boundaries.
- Record source workflow/node/attempt, source execution mode, response hash, prompt/context hashes, schema/profile/policy versions, and approval ref.

## Phase 6 - Node Integration
- Integrate policies into:
  - resource sampling;
  - v1a N5/N6/N7/N8;
  - v1b semantic draft/support nodes;
  - v1c promotion support and feedback normalization;
  - downstream recheck/feedback normalization where model-like execution exists.
- Avoid node-local cache semantics outside shared contracts.

## Phase 7 - Verification And Cleanup
- Add contract, unit, HTTP, harness, and provider canary tests.
- Delete or retire any node-local cache markers that become redundant.
- Run governance sync/lint and record results in `04-verification.md`.

