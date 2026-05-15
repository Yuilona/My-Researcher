# 00 Overview

## Status
- State: done
- Next step: Hand off to `T-064 topic-selection-v1c-paper-project-bridge`.

## Parent Package
- Stage parent: `dev-docs/active/topic-selection-v1c-promotion-bridge/`
- Upstream dependency: `dev-docs/active/topic-selection-v1c-promotion-gate-support/`

## Goal
- Persist explicit human promotion authorization and resulting `PromotionDecision`.
- Freeze `PromotionCommitmentProfile` for scope, claim ceiling, accepted risks, allowed refinements, early checks, and stop/reopen conditions.
- Route non-promote outcomes to typed loopback targets with required actions.

## Non-goals
- Do not create `PaperProjectBridge`.
- Do not let gate/support records approve promotion without human confirmation.

## Owned Scope
- `HumanPromotionDecision`
- `PromotionDecision`
- `PromotionCommitmentProfile`
- non-promote loopback target/action contract

## Acceptance Criteria
- [x] Promotion cannot bypass human confirmation.
- [x] Only human-confirmed promote outcomes create a bridge handoff.
- [x] `promote_with_conditions` freezes concrete owner/action/ref/early-check condition details.
- [x] Non-promote outcomes carry typed loopback target and required actions.
- [x] Commitment profile preserves trace refs, accepted risks, claim limits, allowed refinements, and stop/reopen conditions.
