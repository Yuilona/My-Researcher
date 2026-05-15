# 00 Overview

## Status
- State: done
- Next step: T-062 can consume `ready_for_gate` `PromotionInputSnapshot` handoff DTOs.

## Parent Package
- Stage parent: `dev-docs/active/topic-selection-v1c-promotion-bridge/`
- Architecture parent: `dev-docs/active/topic-selection-decision-chain-redesign/`
- Upstream dependency: `dev-docs/active/topic-selection-v1b-need-to-draft-topic/`

## Goal
- Convert `TopicSelectionV1bToV1cInputBundle` into a stable `PromotionInputSnapshot`.
- Verify package readiness, bundle currentness, trace refs, blocker/recheck/risk carry-forward, and v1b authority refs before promotion gate work begins.

## Non-goals
- Do not create `PromotionDecisionSupport`, `PromotionGateCheck`, `PromotionDecision`, or `PaperProjectBridge`.
- Do not re-run v1b value assessment or mutate `TopicPackage(draft)`.

## Owned Scope
- `PromotionInputSnapshot`
- input bundle freshness/currentness checks
- package readiness and trace-boundary handoff checks
- promotion input read model for T-062

## Acceptance Criteria
- [x] Only `TopicSelectionV1bToV1cInputBundle` can create a v1c promotion input snapshot.
- [x] Non-ready, superseded, missing, or stale package/bundle refs are rejected before downstream gate work.
- [x] Snapshot preserves package, value, question, slice, need, evidence, risk, blocker, memory, and recheck refs.
- [x] Snapshot has explicit closure status and stop-condition details.
- [x] T-062 can consume a single stable handoff DTO.
