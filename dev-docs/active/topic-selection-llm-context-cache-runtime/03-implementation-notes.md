# 03 Implementation Notes

## 2026-05-28 - Task Package Creation
- Created `T-112 topic-selection-llm-context-cache-runtime` as a dedicated task package.
- Decision: this is a cross-cutting topic-selection runtime package, not a T-107/T-108/T-111 tail item.
- Relationship:
  - consumes T-088 AgentOrchestrator/WorkflowHarness foundations;
  - consumes T-089 node-policy classifications;
  - hardens v1a/v1b/v1c provider and Codex-assisted execution without redefining their route policies.
- Initial architecture aligns with T-088/T-089 D-18: cache is acceleration/replay only; durable memory is structured business memory; context families stay distinct; response reuse must be provenance-labeled and non-provider unless a live provider call actually occurs.

## Pending Decisions
- Whether token estimation should be implemented with a provider-aware tokenizer dependency, a conservative local estimator, or both.
- Whether the first implementation slice starts with v1a N6 context packet cache or the shared AgentOrchestrator preflight gate.
- Whether response reuse storage should live in control-plane artifacts only or a queryable lightweight index plus artifact payload.

## Implementation Backlog
- Add shared contract schemas and schema tests.
- Add context packet cache lookup/reuse.
- Add token-budget gate.
- Add compression report and quality gate.
- Add exact response reuse policy.
- Integrate selected v1a/v1b/v1c nodes.
- Add provider canaries and stale-cache negative tests.

