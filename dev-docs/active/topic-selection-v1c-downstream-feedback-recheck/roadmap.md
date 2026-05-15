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
