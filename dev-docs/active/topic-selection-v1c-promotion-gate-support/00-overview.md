# 00 Overview

## Status
- State: done
- Next step: Hand off `PromotionGateHandoff` to `T-063 topic-selection-v1c-human-promotion-decision-profile`.

## Parent Package
- Stage parent: `dev-docs/active/topic-selection-v1c-promotion-bridge/`
- Upstream dependency: `dev-docs/active/topic-selection-v1c-promotion-input-snapshot/`

## Goal
- Produce `PromotionDecisionSupport`, `PromotionDossier`, `PromotionGateCheck`, and `ArgumentReadinessMiniCheck` from a stable `PromotionInputSnapshot`.
- Identify blockers, required actions, accepted-risk coverage, argument readiness gaps, and recheck requirements before human decision.

## Non-goals
- Do not create `HumanPromotionDecision`, `PromotionDecision`, `PromotionCommitmentProfile`, or `PaperProjectBridge`.
- Do not use LLM output as promotion authorization.

## Owned Scope
- `PromotionDecisionSupport`
- `PromotionDossier` reviewer-facing read model
- `PromotionGateCheck`
- `ArgumentReadinessMiniCheck`
- gate disposition: `ready_for_human_decision`, `blocked`, `needs_revision`, `recheck_required`, `park`

## Acceptance Criteria
- [x] Gate consumes `PromotionInputSnapshot`, not raw v1b objects.
- [x] Human decision cannot proceed unless the gate result allows human review or records explicit blockers/required actions.
- [x] Support packet and dossier carry package trace, blocker, accepted-risk, recheck, and argument mini-check context.
- [x] Gate output has typed required actions and loopback hints for non-ready cases.
