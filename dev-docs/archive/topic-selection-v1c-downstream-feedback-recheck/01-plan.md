# 01 Plan

## Phase 1 - Contracts
- Define downstream feedback source, loopback cause, target, severity, and required action enums.
- Define recheck request payload and impact summary schemas.

Acceptance:
- [ ] Feedback cannot be untyped free text only.
- [ ] Loopback causes distinguish stale evidence, overclaim, unanswerable question, boundary drift, bridge gap, and paper-project constraint conflict.

## Phase 2 - Service And Persistence
- Add repository support.
- Implement `recordDownstreamTopicFeedback(...)`.
- Implement deterministic classification and recheck payload construction.

Acceptance:
- [ ] Service writes only feedback/recheck artifacts.
- [ ] Source bridge and promotion lineage are preserved.

## Phase 3 - Tests
- Cover each loopback target and representative downstream source.

Acceptance:
- [ ] T-066 can replay downstream loopback cases from frozen feedback snapshots.
