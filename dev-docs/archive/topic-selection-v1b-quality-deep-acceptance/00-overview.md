# 00 Overview

## Status
- State: done
- Task: T-080
- Result: deep quality acceptance for v1b `TopicQuestionContract` and `ValueAssessment` is complete and ready to archive.

## Goal
- Verify that v1b does more than produce contract-shaped output: topic questions must be researchable, evidence-linked, falsifiable, scoped, and carry accepted-risk semantics correctly.
- Verify that value assessment disposition follows the quality evidence instead of accepting weak or incoherent topic-question contracts.

## Non-Goals
- Do not reopen T-068 backend chain acceptance.
- Do not change v1a/v1c authority contracts unless a v1b defect requires a minimal compatibility fix.
- Do not build desktop reviewer UI in this package.
- Do not claim a mature universal research-quality threshold; this task creates a stronger v1b acceptance baseline.

## Acceptance Criteria
- [x] TopicQuestionContract tests cover positive high-quality, weak/fuzzy, unsupported, unfalsifiable, scope-drift, duplicate/overlapping, and accepted-risk cases.
- [x] ValueAssessment tests cover ready, ready-with-accepted-risk, revise, park/reject, evidence-insufficient, and risk-mismatch cases.
- [x] Tests assert quality signals and decision reasons, not only HTTP/service success.
- [x] Real or realistic fixture data exercises support/challenge/baseline/context evidence roles.
- [x] Verification commands and outcomes are recorded.
