# T-108 Topic Selection v1c Workflow Hardening

## Status
- State: planned
- Task ID: `T-108`
- Mapping: `M-001 > F-001 > R-009 > T-108`
- Depends on: `T-088 topic-selection-workflow-runtime-foundation`, `T-089 topic-selection-agent-workflow-review`, `T-107 topic-selection-v1b-workflow-hardening`
- Trigger: v1a normalization exposed the need to make terminal promotion and bridge nodes as explicit, replayable, and automation-safe as upstream evidence/need nodes.

## Goal
- Refine and harden v1c from v1b draft package handoff through promotion gate, human promotion decision, bridge creation, paper-project intake handoff, and downstream feedback/recheck.
- Make v1c terminal decisions robust enough for automation while preserving human authority and avoiding accidental paper-project side effects.
- Normalize every v1c node under WorkflowHarness standards: frozen inputs, authority boundary, deterministic gates, warning/blocker propagation, replay/idempotency, and explicit handoffs.
- Clarify whether any v1c semantic-review node should use Codex/provider LLM, and keep promotion authority human/delegated rather than model-owned.

## Non-Goals
- Do not redesign v1b.
- Do not create PaperImplementation authority objects; v1c may hand off to paper implementation but must not write its downstream objects.
- Do not add desktop UI.
- Do not introduce multi-agent debate unless a node-level review proves it is necessary and bounded.
- Do not allow provider/Codex output to directly promote, bridge, or mutate paper-project state.

## Acceptance Criteria
- [ ] A v1c node inventory exists and matches repo code/contracts.
- [ ] Every v1c node has a node policy covering frozen inputs, authority writes, blockers, validators, replay, and handoff semantics.
- [ ] Promotion input snapshot, gate support, human promotion decision, bridge creation, paper-project intake handoff, and downstream feedback/recheck are harness-callable.
- [ ] Human/delegated promotion authority is explicit and cannot be replaced by model output.
- [ ] PaperProjectBridge creation is idempotent, traceable, and protected from stale or non-promote inputs.
- [ ] Downstream feedback/recheck produces typed loopback signals without mutating historical authority objects.
- [ ] v1c tests cover happy path, non-promote paths, stale inputs, duplicate bridge guards, downstream feedback, replay/idempotency, and Codex/provider semantic-review canaries where applicable.
