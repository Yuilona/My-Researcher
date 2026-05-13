# 01 Plan

## Phase 1 - Bootstrap And Baseline
- Create the dev-docs task bundle.
- Capture the current design reframing in `06-design-spec.md`.
- Register the task with project governance.

Acceptance:
- [x] Task bundle exists.
- [x] Design spec exists.
- [ ] Project governance sync completes.

## Phase 2 - Design Discussion Loop
- Use `06-design-spec.md` as the canonical discussion artifact.
- After each meaningful discussion, update:
  - `06-design-spec.md` for design decisions.
  - `roadmap.md` for open questions, milestones, and decision log.
  - `03-implementation-notes.md` for rationale and change notes.

Acceptance:
- [ ] New decisions are reflected in docs during the discussion.
- [ ] Open questions are either resolved or explicitly parked.

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
- [ ] Each object has a purpose, required inputs, required outputs, and invalid states.
- [ ] Each gate has pass/fail/refine/park/drop semantics.
- [ ] Human checkpoints are explicit and not merely ceremonial.

## Phase 4 - Current Implementation Gap Map
- Compare the target design against current title-card backend/UI behavior.
- Classify gaps:
  - prompt/design only
  - shared contract change
  - backend persistence/API change
  - desktop workflow change
  - research-argument bridge dependency

Acceptance:
- [ ] Gap map identifies existing coverage and missing capabilities.
- [ ] Implementation risks and dependencies are documented.

## Phase 5 - Implementation Roadmap
- Split follow-up implementation into executable tasks.
- Prioritize changes that improve decision robustness before UI polish.
- Define verification per phase.

Acceptance:
- [ ] Roadmap has phased implementation tasks.
- [ ] Each phase has a clear verification story.

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
- [ ] v1a implementation child packages are created.

## Working Protocol
- Keep this task package current while discussing.
- Prefer updating `06-design-spec.md` over adding scattered ad hoc notes.
- Do not modify product code from this task until the design and implementation roadmap are accepted.
