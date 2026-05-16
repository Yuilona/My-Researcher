# Roadmap

## T-065 Downstream Feedback And Recheck

### Objective
Capture PaperProject and downstream workflow feedback as typed topic-selection loopbacks without mutating upstream authority records.

### Execution Order
1. Define feedback, loopback, and recheck contracts.
2. Implement record and classify service.
3. Persist feedback and recheck refs.
4. Add routing tests for all loopback targets.

### Exit
- Downstream workflows can report blockers or corrections back to topic selection.
- Recheck work is explicit and typed.

### Closure 2026-05-16
- Shared contracts, Prisma SSOT, repository/service layer, and focused unit tests are implemented.
- Feedback rows are append-only and preserve bridge/source lineage.
- Recheck-required feedback creates generic recheck-risk-memory artifacts via the existing downstream feedback entrypoint.
- `no_recheck_needed` feedback is recorded without queue artifacts.
