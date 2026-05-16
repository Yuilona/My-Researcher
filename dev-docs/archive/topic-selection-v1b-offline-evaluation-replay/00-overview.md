# 00 Overview

## Status
- State: done
- Next step: Proceed to `T-054 topic-selection-v1b-http-api-closure`.

## Parent Package
- Stage parent: `dev-docs/active/topic-selection-v1b-need-to-draft-topic/`
- Upstream dependency: `dev-docs/active/topic-selection-v1b-topic-package-draft/`

## Goal
- Add offline evaluation/replay baseline for v1b need-to-draft-topic quality.
- Measure boundary drift, answerability false-pass, value overclaim, package trace completeness, readiness false-pass, and downstream loopback causes.

## Non-goals
- Do not mutate production v1b authority objects.
- Do not treat metrics as evidence.
- Do not replace runtime readiness gates.

## Owned Scope
- v1b replay dataset/case/run/result adapters, reusing generic replay patterns where possible
- frozen v1b input/output bundles
- v1b metrics and replay diffs
- fixture seeded from at least one real v1a-to-v1b vertical slice after implementation lands

## Acceptance Criteria
- [x] Replay can run from frozen v1b snapshots without writing production `ResearchSlice`, `TopicQuestion`, `TopicValueAssessment`, or `TopicPackage`.
- [x] Metrics cover the minimum v1b quality risks.
- [x] Replay diffs can compare slice/question/value/package outputs across workflow/model/policy versions.
