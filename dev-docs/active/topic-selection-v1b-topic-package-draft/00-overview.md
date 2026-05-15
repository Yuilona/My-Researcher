# 00 Overview

## Status
- State: done
- Next step: Proceed to `T-056 topic-selection-v1b-offline-evaluation-replay`, then `T-054 topic-selection-v1b-http-api-closure`.

## Parent Package
- Stage parent: `dev-docs/active/topic-selection-v1b-need-to-draft-topic/`
- Upstream dependency: `dev-docs/active/topic-selection-v1b-value-assessment/`
- Downstream dependency: `dev-docs/active/topic-selection-v1c-promotion-bridge/`

## Goal
- Create trace-ready `TopicPackage(draft)` from an `advance_to_package` value decision.
- Run package trace/boundary/readiness checks and publish the v1c input bundle.

## Non-goals
- Do not authorize promotion.
- Do not create or connect PaperProject.
- Do not let package narrative rewrite upstream authority objects.

## Owned Scope
- `TopicPackage(draft)`
- `PackageTraceBoundaryCheck`
- `TopicPackageReadinessAssessment`
- `TopicSelectionV1bToV1cInputBundle`
- draft issue/blocker records where needed

## Acceptance Criteria
- [x] Only `ValueDispositionDecision.decision=advance_to_package` can create a draft package.
- [x] Package includes refs to validated need, ResearchSlice, TopicQuestionContract, TopicValueAssessment, ValueReasoningMemo, evidence/search refs, accepted risks, blockers, and recheck state.
- [x] Package readiness is explicit and blocks v1c when trace, boundary, risk, or recheck checks fail.
- [x] v1c input bundle is explicit and sufficient for promotion bridge review.
