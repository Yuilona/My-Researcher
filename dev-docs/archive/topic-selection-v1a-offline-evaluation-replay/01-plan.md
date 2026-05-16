# 01 Plan

## Phase 1 - Dataset Contract
- Define dataset/case schema and gold expectation fields.
- Create first curated case inventory.

Acceptance:
- [ ] All required case types are represented.
- [ ] Case gold expectations can be evaluated without production writes.

## Phase 2 - Replay Harness
- Run workflows against frozen input snapshots.
- Store case results, artifacts, and replay diffs.

Acceptance:
- [ ] Replay records workflow/profile/model/search/policy versions.
- [ ] Replay does not create production authority objects.

## Phase 3 - Metrics
- Calculate v1a minimum metrics.
- Report baseline-only values first.

Acceptance:
- [ ] Metric results list numerator, denominator, value, contributing cases, and notes.
- [ ] Failure examples are traceable to case results.

## Phase 4 - Feedback Loop
- Convert evaluation findings into prompt/workflow/policy/search change proposals.

Acceptance:
- [ ] Findings do not directly mutate production decisions.
