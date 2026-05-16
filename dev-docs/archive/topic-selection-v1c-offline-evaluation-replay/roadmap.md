# Roadmap

## T-066 v1c Offline Evaluation And Replay

### Objective
Extend offline replay to frozen v1c snapshots and compute promotion/bridge quality metrics without writing production authority objects.

### Execution Order
1. Extend replay contracts for `stage='v1c'`.
2. Add synthetic v1c baseline dataset.
3. Compute v1c metrics and replay diffs.
4. Add isolation tests.

### Exit
- Replay can evaluate v1c promotion and bridge failures from frozen snapshots.
- No production promotion or bridge service is called by replay.
