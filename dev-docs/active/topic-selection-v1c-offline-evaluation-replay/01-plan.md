# 01 Plan

## Phase 1 - Shared Contracts
- Extend replay `stage` to include `v1c`.
- Add v1c case types, metric keys, diff dimensions, frozen bundle fields, gold expectations, and observed output fields.

Acceptance:
- [ ] v1a and v1b fixtures remain compatible.
- [ ] v1c minimal frozen payload validates.
- [ ] v1c case types include promotion input staleness, gate blocker false-pass, human bypass, promotion false-pass, bridge trace gap, commitment profile gap, loopback misroute, and downstream mutation attempt.

## Phase 2 - Service
- Add `createSyntheticV1cBaselineDataset(...)`.
- Extend metric calculation for v1c runs.
- Extend replay diff generation for v1c dimensions.

Acceptance:
- [ ] Replay writes only offline replay records.
- [ ] Metric calculations are deterministic from frozen payloads.
- [ ] Metrics cover input currentness, gate blockers, human authorization, bridge trace, commitment profile, loopback target, and downstream mutation guard.

## Phase 3 - Tests
- Add shared schema/export tests.
- Add service unit tests and isolation tests.

Acceptance:
- [ ] Duplicate result, missing result, and completed-run late write invariants apply to v1c.
