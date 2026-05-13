# 04 Verification

## 2026-05-13
- Check: project governance sync after package creation.
- Result: registered this package as `T-050` and mapped it to `M-001 / F-001 / R-009`.
- Check: v1a implementation contract review.
- Result: this package can start with frozen fixtures after shared refs exist, then records the first meaningful baseline from real v1a vertical-slice outputs without writing production authority objects.

## Pending Checks
- Tests for metric calculations.
- Replay dry run on fixture cases.
- Fixture adapters for control-plane, search/resource, evidence, need-validation, and recheck/risk/memory outputs.

## Acceptance Checks
- Replay does not write production ValidatedNeed.
- Each metric result has numerator, denominator, contributing cases, and notes.
- ReplayDiff flags final decision, key evidence, blocker set, and trace verdict changes.
- Stage baseline includes the agreed minimum metrics and links failures back to frozen inputs.
