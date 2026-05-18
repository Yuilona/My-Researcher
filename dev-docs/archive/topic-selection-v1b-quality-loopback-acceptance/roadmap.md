# Roadmap

## Why This Exists
- Deep v1b testing showed the model can legitimately return `needs_refinement`.
- The product requirement is not to force the flow forward, but to preserve the decision chain and route the topic back to the correct repair node.

## Milestones
- M1: Register T-081 under project governance.
- M2: Add deterministic service tests for loopback target selection and package blocking.
- M3: Verify focused unit tests and backend typecheck.
- M4: Update task docs with outcomes and any product gaps.

## Rollback
- If tests reveal an implementation defect, keep the tests and patch the service narrowly.
- If the current service already satisfies the invariants, land only the acceptance tests and documentation.
