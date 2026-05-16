# 00 Overview

## Status
- State: done
- Next step: Hand off to `T-067 topic-selection-v1c-http-api-closure`.

## Parent Package
- Stage parent: `dev-docs/active/topic-selection-v1c-promotion-bridge/`
- Upstream dependencies: T-061, T-062, T-063, T-064, T-065
- Related prior package: `dev-docs/active/topic-selection-v1b-offline-evaluation-replay/`

## Goal
- Extend offline replay to `stage='v1c'`.
- Evaluate promotion input, human decision, commitment profile, bridge trace, and downstream loopback quality from frozen snapshots.

## Non-goals
- Do not write production `PromotionDecision`, `PaperProjectBridge`, or downstream feedback authority objects.
- Do not add HTTP routes; T-067 owns API closure.
- Do not replace human promotion decision review.

## Owned Scope
- v1c replay case types
- v1c metric keys
- v1c replay diff dimensions
- synthetic frozen v1c baseline dataset
- isolation tests proving replay uses frozen payloads only

## Acceptance Criteria
- [x] Synthetic v1c baseline covers promotion input staleness, gate blocker false-pass, human bypass, promotion false-pass, bridge trace, commitment profile, loopback routing, and downstream mutation guard cases.
- [x] Metrics include numerator, denominator, case refs, and notes.
- [x] Replay diffs record changed dimensions in generic replay diff records.
- [x] Runtime service does not import production v1c authority services or repositories.
