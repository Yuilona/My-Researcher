# 01 Plan

## Phase 1 - Bootstrap And Baseline
- Create the dev-docs task bundle.
- Capture the current design reframing in `06-design-spec.md`.
- Register the task with project governance.

Acceptance:
- [x] Task bundle exists.
- [x] Design spec exists.
- [x] Project governance sync completes.

## Phase 2 - Design Discussion Loop
- Use `06-design-spec.md` as the canonical discussion artifact.
- After each meaningful discussion, update:
  - `06-design-spec.md` for design decisions.
  - `roadmap.md` for open questions, milestones, and decision log.
  - `03-implementation-notes.md` for rationale and change notes.

Acceptance:
- [x] New decisions are reflected in docs during the discussion.
- [x] Open questions are either resolved or explicitly parked.

## Phase 3 - Object And Gate Finalization
- Finalize the target chain:
  - `TopicSeed`
  - `SearchPlan`
  - `EvidenceMap`
  - `NeedCandidate`
  - `ValidatedNeed`
  - `ResearchSlice`
  - `TopicQuestion`
  - `TopicValueAssessment`
  - `TopicPackage`
  - `PromotionDecision`
- Define required fields, states, source attribution, and loopback rules.

Acceptance:
- [x] Each object has a purpose, required inputs, required outputs, and invalid states.
- [x] Each gate has pass/fail/refine/park/drop semantics.
- [x] Human checkpoints are explicit and not merely ceremonial.

## Phase 4 - Current Implementation Gap Map
- Compare the target design against current title-card backend/UI behavior.
- Classify gaps:
  - prompt/design only
  - shared contract change
  - backend persistence/API change
  - desktop workflow change
  - research-argument bridge dependency

Acceptance:
- [x] Gap map identifies existing coverage and missing capabilities.
- [x] Implementation risks and dependencies are documented.

## Phase 5 - Implementation Roadmap
- Split follow-up implementation into executable tasks.
- Prioritize changes that improve decision robustness before UI polish.
- Define verification per phase.

Acceptance:
- [x] Roadmap has phased implementation tasks.
- [x] Each phase has a clear verification story.

## Phase 6 - Stage Package Split
- Treat this package as the parent architecture package.
- Create stage child packages:
  - `topic-selection-v1a-evidence-to-need`
  - `topic-selection-v1b-need-to-draft-topic`
  - `topic-selection-v1c-promotion-bridge`
- Keep v1b/v1c at stage-package level until upstream contracts are verified.
- Split only v1a into implementation child packages next.

Acceptance:
- [x] v1a stage package exists.
- [x] v1b stage package exists.
- [x] v1c stage package exists.
- [x] v1a implementation child packages are created.

## Closure - Governance And Scope Acceptance
- T-042 closes as the parent architecture/governance package.
- v1a, v1b, and v1c child packages are split and represented in project governance.
- The current implementation gap map is captured in `07-governance-scope-acceptance.md`.
- Backend decision-chain acceptance is explicitly split into a follow-up task; it should verify the implemented service/API/DB chain without reopening T-042.
- Desktop reviewer UI, PaperProject execution, writing/research-argument runtime, curated real replay datasets, and production rollout remain outside T-042 scope.

## Working Protocol
- Keep `06-design-spec.md` and `07-governance-scope-acceptance.md` as the durable T-042 records after closure.
- New implementation or acceptance work should use separate task packages rather than adding scope to T-042.
