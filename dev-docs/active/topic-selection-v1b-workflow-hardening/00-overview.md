# T-107 Topic Selection v1b Workflow Hardening

## Status
- State: planned
- Task ID: `T-107`
- Mapping: `M-001 > F-001 > R-009 > T-107`
- Depends on: `T-088 topic-selection-workflow-runtime-foundation`, `T-089 topic-selection-agent-workflow-review`
- Trigger: v1a WorkflowHarness normalization established a stronger standard than the older v1b implementation packages: each node must be automatically callable, contract-bound, replayable, and quality-gated instead of merely service-callable.

## Goal
- Refine and harden v1b from `V1bInputBundle` to v1c draft package handoff using the v1a node-normalization standard.
- Make every v1b node explicit enough for WorkflowHarness execution: frozen inputs, authority boundary, invocation slot, validators, blockers, warnings, replay hash, and handoff contract.
- Align `TopicQuestionContract`, `ValueAssessment`, research-slice selection, draft package creation, and v1c handoff into one coherent, automatable workflow.
- Define where Codex/provider LLM participation is allowed, where deterministic validation is mandatory, and where human/delegated review is required.

## Non-Goals
- Do not redesign v1a or v1c.
- Do not add desktop UI.
- Do not introduce DB migrations unless the readiness review proves an existing persisted contract cannot support the normalized workflow.
- Do not create a separate v1b agent runtime path outside the shared `WorkflowHarness` / `AgentOrchestrator` / model-profile registry pattern.
- Do not make every v1b node multi-agent; debate must be justified by concrete value over deterministic or single-agent workflow.

## Acceptance Criteria
- [ ] A v1b node inventory exists and matches repo code/contracts.
- [ ] Every v1b node has a node policy with input refs, output authority, blockers, warnings, validators, replay/idempotency, and downstream handoff.
- [ ] Every model-like v1b node uses a single invocation-slot shape and resolves provider/model through the model profile registry.
- [ ] Codex-assisted paths are explicit and distinguish local cost-control from provider-quality evidence.
- [ ] `TopicQuestionContract` and `ValueAssessment` have deterministic gates that prevent schema-valid but low-quality or semantically drifting output from advancing.
- [ ] v1b WorkflowHarness scenarios cover happy path, negative gates, loopbacks, replay/idempotency, and provider/Codex canaries.
- [ ] v1b can run from frozen v1a handoff to v1c handoff without reading mutable live upstream state.
