# Roadmap

## Stage Decision Log
- V1A-001: v1a is the evidence-to-need implementation stage.
- V1A-002: v1a success is a human-confirmed `ValidatedNeed`, not a draft topic or paper project.
- V1A-003: v1a should be split into implementation child tasks before product code changes.
- V1A-004: v1a child tasks should be dependency-ordered and independently verifiable.
- V1A-005: v1a includes title-card/topic-seed adapter and Literature -> TopicSelection snapshot/content/source-health contracts.
- V1A-006: v1a must publish an explicit v1b input bundle; v1b consumes it without re-proving need existence.
- V1A-007: `QualitySignal` is split by responsibility: `T-048` owns the runtime record contract, `T-051` owns policy interpretation, and `T-050` only reads it for replay context.
- V1A-008: `SearchPlanRecheckRequest` is emitted by `T-049`, materialized or rejected by `T-052`, and queued/tracked by `T-051`.
- V1A-009: `FunctionalLineageLink`, `TraceSnapshot`, and generic `HumanConfirmedDecision` are foundation contracts required before downstream packages create authority records.
- V1A-010: v1a execution starts with `T-048`; downstream implementation waits for the shared control-plane contract review.

## Planned Child Task Order
1. `T-048 topic-selection-v1a-foundation-control-plane`
2. `T-052 topic-selection-v1a-search-resource-evidence-inputs`
3. `T-047 topic-selection-v1a-evidence-map-strength`
4. `T-049 topic-selection-v1a-need-validation`
5. `T-051 topic-selection-v1a-recheck-risk-memory`
6. `T-050 topic-selection-v1a-offline-evaluation-replay`

## Exit Criteria
- The v1a child tasks are created and mapped under this stage.
- A vertical slice can prove evidence-to-need with trace and human confirmation.
- The v1b input bundle contract is complete and verified.
- Lessons from v1a are fed into the v1b stage package before v1b is split.
- `06-implementation-contract-review.md` has no open coverage gaps.
