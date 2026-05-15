# 03 Implementation Notes

## 2026-05-14 - Gap Resolution
- Added as a v1b child package during split review because the original four-package plan lacked a quality calibration loop for v1b-specific failures.

## 2026-05-14 - Implementation
- Extended the generic offline evaluation/replay shared contracts from `stage='v1a'` to `stage='v1a' | 'v1b'` while preserving v1a-specific case/metric constants for backward-compatible defaults.
- Added v1b case types for slice boundary drift, answerability false-pass, value overclaim, package trace gap, package readiness false-pass, and downstream loopback feedback.
- Added v1b metric keys for slice boundary drift rate, answerability false-pass rate, value overclaim rate, package trace completeness, package readiness false-pass rate, and downstream loopback cause distribution.
- Extended replay diffs with v1b dimensions for slice boundary, answerability verdict, value claim, package trace, package readiness, and loopback cause.
- Added `createSyntheticV1bBaselineDataset` to the existing offline replay service. It writes only offline replay dataset/case records and frozen fixture payloads.
- Default run metrics now depend on dataset stage: v1a datasets keep the existing v1a metric set; v1b datasets use the new v1b metric set.
- No Prisma schema or production authority tables were added; existing offline replay string/json columns carry v1b stage, case, metric, diff, and frozen snapshot payloads.
