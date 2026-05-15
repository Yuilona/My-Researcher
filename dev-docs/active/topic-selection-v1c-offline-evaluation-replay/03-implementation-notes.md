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
