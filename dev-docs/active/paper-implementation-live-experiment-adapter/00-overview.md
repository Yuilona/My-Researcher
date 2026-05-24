# T-104 Paper Implementation Live Experiment Adapter

## Status
- State: done
- Task ID: `T-104`
- Feature / Milestone / Requirement: `F-001` / `M-001` / `R-013`
- Current focus: T-104 implementation closed; next infrastructure task is T-105.
- ID note: `T-103` is already assigned to `experiment-foundation-full-flow-validation-runner`; this PaperImplementation follow-up uses `T-104`.

## Goal
- Connect `ResearchWorkOrder` to the existing experiment-foundation execution surface so PaperImplementation can submit, sync, collect, and ingest real experiment jobs through the trusted WorkOrder path.
- Preserve `ResearchWorkOrder -> external job -> RunMonitorIntake -> RunEvidenceUnit -> ResultInterpretationPacket` as the only trusted experiment evidence path.
- Convert live execution outcomes into target-specific, trace-ready `RunEvidenceUnit` records without copying experiment-foundation authority payloads into PaperImplementation.

## Non-goals
- Do not create a parallel experiment authority root inside PaperImplementation.
- Do not bypass `ResearchWorkOrder` or write trusted `RunEvidenceUnit` directly from experiment-foundation callbacks.
- Do not add live LLM/provider variance evaluation; that remains a separate follow-up.
- Do not make cloud credentials, external spend, or provider availability part of default CI.
- Do not change experiment-foundation canonical objects except through existing experiment-foundation services and contracts.

## Acceptance Criteria
- [x] A PaperImplementation adapter service submits admitted WorkOrders to experiment-foundation execution using refs/hashes from the WorkOrder.
- [x] Submission records a harness/external job link and remains idempotent for the same WorkOrder attempt.
- [x] Sync/collect paths map experiment-foundation status into `RunMonitorIntake` without bypassing monitor trust rules.
- [x] Final trusted evidence pre-allocates `run_evidence_unit_id` and target-specific trace manifest before `RunEvidenceUnit` creation.
- [x] Failed, cancelled, and succeeded external outcomes map through monitor/evidence gates; non-final sync remains monitor-only.
- [x] Default verification uses deterministic in-memory execution/record fakes; real external/cloud checks are opt-in.
- [x] Tests prove no naked external job trust and no alternate claim/evidence path.

## Handoff
- Start with boundary review and existing experiment-foundation execution API inspection.
- Do not implement code until route/service ownership and trace lifecycle decisions in `roadmap.md` are confirmed.
