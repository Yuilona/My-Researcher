# 00 Overview

## Status
- State: done
- Next step: Hand off to `T-065 topic-selection-v1c-downstream-feedback-recheck`.

## Parent Package
- Stage parent: `dev-docs/active/topic-selection-v1c-promotion-bridge/`
- Upstream dependency: `dev-docs/active/topic-selection-v1c-human-promotion-decision-profile/`
- Downstream dependency: PaperProject intake and T-065 downstream feedback.

## Goal
- Create and persist `PaperProjectBridge` from a current human-confirmed promote `PromotionDecision`.
- Preserve promotion commitment, source package refs, trace refs, accepted risks, conditions, and editable working-copy text for PaperProject intake.

## Non-goals
- Do not create a bridge from package readiness, gate readiness, or support artifacts alone.
- Do not run PaperProject planning, experiment planning, writing workflows, or research argument workflows.
- Do not mutate `TopicPackage(draft)`, `TopicSelectionV1bToV1cInputBundle`, or `PromotionDecision`.

## Owned Scope
- `PaperProjectBridge`
- bridge creation input and handoff output
- bridge uniqueness guard for `PromotionDecision`
- source snapshot hashes and trace refs
- PaperProject intake payload boundary

## Acceptance Criteria
- [x] Only current human-confirmed promote decisions can create a bridge.
- [x] Non-promote, stale, superseded, or already-bridged decisions are rejected or returned idempotently by explicit contract.
- [x] Bridge carries package, promotion, commitment, value, question, slice, need, evidence, risk, blocker, memory, and recheck refs.
- [x] Bridge payload includes editable working-copy text without rewriting upstream authority artifacts.
- [x] PaperProject can consume a single stable bridge handoff.
