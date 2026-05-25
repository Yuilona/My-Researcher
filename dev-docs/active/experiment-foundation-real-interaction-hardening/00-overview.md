# T-106 Experiment Foundation Real-interaction Hardening

## Status
- State: in-progress
- Task: T-106
- Parent task: `T-043 experiment-foundation-v1`
- Current focus: Phase 2 LocalScript robustness is implemented; next step is Phase 3 API, DB, and recovery hardening.

## Goal
Deepen the post-V1 validation of experiment foundation by proving automation, real or near-real external interaction boundaries, cross-flow handoffs, and recovery behavior under harder conditions than the T-090 capability suite and T-103 runner closure.

T-106 should consume the established T-070 through T-078 contracts and product surfaces, plus the T-090 scenario harness and T-103 full-flow runner. It must not create a second semantic track for readiness, promotion, materialization, execution, result validation, evidence, or desktop workbench behavior.

The product-level target is a usable tool surface that lets paper-implementation automation hand off into experiment-foundation smoothly, then consume refs, results, validation, and evidence without manual repair or semantic guesswork.

## Non-goals
- Do not add new experiment-foundation domain semantics by default.
- Do not make real cloud submission part of the default verification lane.
- Do not commit credentials, raw datasets, model weights, checkpoints, SDK payloads, or unredacted logs.
- Do not expand Prisma, REST, shared contracts, or desktop UI unless a hardening finding requires an explicit decision.
- Do not replace the T-103 full-flow runner; extend it or plug into it only after the harness command contract is stable.

## Acceptance Criteria
- [x] A hardening matrix covers registry, readiness, promotion, materialization, execution, result/evidence, desktop, cross-flow integration, and external-canary boundaries.
- [x] LocalScript robustness tests cover allowlist, path containment, timeout, cancellation, idempotency, partial collection, invalid result payloads, and process cleanup.
- [ ] API and persistence tests cover duplicate keys, stale refs, readiness transitions, materialization/job hash mismatches, promotion gates, and recovery-safe status updates.
- [ ] Memory and disposable Postgres paths prove the same automation-facing behavior for registry, readiness, promotion, execution, result, and evidence transitions.
- [ ] UI-driven full-flow smoke covers registry, readiness, job submit/sync/cancel/collect, result/evidence detail, and error rendering without renderer-owned domain semantics.
- [ ] Cross-flow tests verify PaperImplementation and adjacent evidence surfaces consume experiment-foundation refs and sidecars without copying canonical DTOs or claim fields.
- [ ] External canary has a default safe lane plus a true opt-in canary lane that can verify real connectivity and the minimum real external flow when credentials and environment are present.
- [x] Real-data policy uses synthetic deterministic fixtures by default, with controlled local real fixtures and true external samples only through explicit opt-in and redacted artifacts.
- [ ] T-103 has either a stable hardening lane hook or a documented handoff command for running this suite.
- [ ] All artifacts are redacted, stored under `.ai/.tmp/experiment-foundation-hardening/<run-id>/`, and governance lint passes.

## Handoff
Proceed to Phase 3 using `06-hardening-matrix.md` rows `EF-H-003`, `EF-H-004`, `EF-H-006`, `EF-H-015`, and `EF-H-016`. Keep UI in definition mode and do not add true external canary behavior until the API/DB recovery lane is stable.
