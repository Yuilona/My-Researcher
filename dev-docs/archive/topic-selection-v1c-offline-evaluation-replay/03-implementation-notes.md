# 03 Implementation Notes

## Expected Implementation
- Reuse existing offline replay tables and repository shape when possible.
- Store v1c-specific details in existing JSON payload fields.
- Keep metric definitions explicit in service tests.

## Isolation Requirement
- Runtime replay service can depend on shared contracts and offline replay repository.
- Runtime replay service must not import T-061 through T-065 production services or repositories.
- Tests may use frozen snapshots derived from production-shaped fixtures.

## Watch Points
- Replay metrics are quality signals, not runtime gates.
- Synthetic baseline should be representative but does not replace a future real corpus.
- v1c replay should preserve existing v1a/v1b behavior.

## Implemented 2026-05-16
- Extended shared offline replay contracts from `stage='v1a' | 'v1b'` to include `stage='v1c'`.
- Added v1c case types, metric keys, and replay diff dimensions for promotion input currentness, gate blockers, human authorization, bridge trace, commitment profile, loopback routing, and downstream mutation guard.
- Added v1c optional frozen gold/observed fields and v1c stage snapshot slots while preserving v1a/v1b required payload compatibility.
- Added `TopicSelectionOfflineEvaluationReplayService.createSyntheticV1cBaselineDataset(...)` with 8 deterministic frozen cases.
- Extended replay metrics and diffs for v1c without importing T-061 through T-065 production services or repositories.
- No Prisma schema or migration changes were required; existing offline replay string/JSON columns carry the v1c data.

## Review Hardening 2026-05-16
- v1c replay gold/observed vocabularies for promotion input closure, promotion gate disposition, human promotion decision, and downstream loopback target/cause are constrained to canonical shared contract enums.
- Stage compatibility tests explicitly reject v1c case types on v1a/v1b datasets and reject v1a/v1b metric keys on v1c datasets.
- The synthetic `promotion_false_pass` case now models a single promotion false-pass risk: observed output has an explicit promote-class human decision, while gold expectation still blocks bridge eligibility.
