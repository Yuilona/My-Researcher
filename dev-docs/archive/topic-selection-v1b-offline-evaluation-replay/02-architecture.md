# 02 Architecture

## Input Contract
- frozen v1b intake snapshot
- frozen ResearchSlice, TopicQuestionContract, TopicValueAssessment, TopicPackage, and v1c input bundle snapshots
- gold expectations for boundary, answerability, value, trace, and readiness

## Output Contract
- offline dataset/case/run/result records for v1b
- metric results
- replay diffs

## Isolation Rule
Replay reads frozen snapshots and computes metrics. It must not write production package state, value state, question state, slice state, queue state, or risk state.

## Handoff To API Closure
API closure should expose production v1b routes, not replay internals, unless a separate evaluation/admin API is explicitly planned.
