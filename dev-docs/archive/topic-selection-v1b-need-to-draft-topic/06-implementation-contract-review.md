# 06 Implementation Contract Review

## Review Date
- 2026-05-14

## Scope
Review whether the v1b child packages fully cover the stage goal:

```text
TopicSelectionV1aToV1bInputBundle
  -> ResearchConstraintProfile
  -> ResearchSlice
  -> TopicQuestionContract
  -> TopicValueAssessment
  -> TopicPackage(draft)
  -> v1c input bundle
```

v1b does not revalidate need existence and does not authorize promotion.

## Coverage Matrix

| Stage responsibility | Owner | Authority/support objects | Coverage decision |
| --- | --- | --- | --- |
| v1a handoff intake and local constraints | `T-055 topic-selection-v1b-intake-constraint-profile` | `V1bIntakeSnapshot`, `ResearchConstraintProfile`, `V1bIntakeReadinessAssessment` | Covered. This package prevents every later package from parsing v1a bundles differently. |
| Slice planning and selection | `T-057 topic-selection-v1b-research-slice` | `PlanResearchSliceRun`, `ResearchSliceOptionSet`, `ResearchSliceOption`, `SliceSelectionDecision`, `ResearchSlice` | Covered. Slice scope becomes a reviewed boundary before question text exists. |
| Question formation and answerability | `T-059 topic-selection-v1b-topic-question-contract` | `FormTopicQuestionRun`, `TopicQuestionCandidateSet`, `TopicQuestionSelectionDecision`, `TopicQuestion`, `TopicQuestionContract`, `TopicQuestionAnswerabilityPlan` | Covered. Question text, boundary, and answerability are explicitly separated. |
| Independent value gate | `T-060 topic-selection-v1b-value-assessment` | `TopicValueAssessment`, `ValueReasoningMemo`, `ValueDispositionDecision` | Covered. Only `advance_to_package` can produce package handoff; it is not promotion authorization. |
| Draft package and v1c handoff | `T-058 topic-selection-v1b-topic-package-draft` | `TopicPackage(draft)`, `PackageTraceBoundaryCheck`, `TopicPackageReadinessAssessment`, `TopicSelectionV1bToV1cInputBundle` | Covered. v1c receives a bundle with readiness, trace, blockers, risks, and value refs. |
| v1b quality calibration | `T-056 topic-selection-v1b-offline-evaluation-replay` | frozen v1b snapshots, v1b metrics, replay diffs | Added during review. Original four-package plan lacked v1b-specific quality metrics. |
| Backend/API exposure | `T-054 topic-selection-v1b-http-api-closure` | Fastify routes, controller, OpenAPI/API index, route smoke | Covered. Runs after service contracts land. |

## Gap Review And Resolutions

| Gap | Risk | Resolution |
| --- | --- | --- |
| Original plan had no owner for `ResearchConstraintProfile`. | ResearchSlice package would mix upstream readiness, user constraints, and slice generation. | Added `T-055` as the entry package. |
| Original plan had no v1b replay/evaluation owner. | v1b could generate plausible packages without measuring boundary drift, answerability, or value overclaim. | Added `T-056` after draft package and before API closure. |
| v1c input bundle was only an acceptance line, not an owned object. | v1c would either scrape package internals or rerun value assessment. | Assigned `TopicSelectionV1bToV1cInputBundle` to `T-058`. |
| Legacy TitleCard question/value/package tables already exist. | New v1b authority could be confused with legacy read models. | Child packages must create sidecar authority contracts or explicit adapters; legacy tables are not sufficient as v1b authority by themselves. |
| Recheck/risk/memory could be duplicated in v1b. | Divergent policy semantics from T-051. | v1b packages consume T-051 refs and queue/recheck policy; they do not redefine accepted risk, queue, or raw signal interpretation. |

## Flow Review

### 1. Intake -> ResearchSlice
Before entering `T-057`, review:
- v1a bundle points to human-confirmed `ValidatedNeed`.
- evidence/search refs are traceable.
- high-priority recheck is closed, downgraded, or covered by active accepted risk.
- constraint profile has enough target community, method/resource, claim ceiling, and non-goal data.

Handoff:
- `V1bIntakeSnapshot`
- `ResearchConstraintProfile(version)`
- `V1bIntakeReadinessAssessment(recommendation=ready_for_slice)`
- accepted risk and blocker refs

Exit condition:
- downstream slice planning does not need to inspect raw v1a internals.

### 2. ResearchSlice -> TopicQuestionContract
Before entering `T-059`, review:
- selected `ResearchSlice` is within validated need and constraints.
- rejected/deferred slice options are preserved.
- method/resource assumptions and non-goals are explicit.
- slice has claim ceiling and target community.

Handoff:
- selected `ResearchSlice`
- `SliceSelectionDecision`
- inherited v1a refs and constraint profile ref

Exit condition:
- question formation can evaluate answerability without broadening slice.

### 3. TopicQuestionContract -> ValueAssessment
Before entering `T-060`, review:
- selected question is inside slice boundary.
- answerability plan exists.
- required evidence and known gaps are explicit.
- prohibited claims and allowed refinements are clear.

Handoff:
- `TopicQuestion`
- `TopicQuestionContract`
- `TopicQuestionAnswerabilityPlan`
- `TopicQuestionSelectionDecision`

Exit condition:
- value assessment can decide value without rewriting the question.

### 4. ValueAssessment -> TopicPackage(draft)
Before entering `T-058`, review:
- value assessment covers novelty, significance, answerability, feasibility, risk, and claim ceiling.
- value reasoning memo exposes objections and weak points.
- disposition decision is `advance_to_package`.
- non-advance decisions have no package output.

Handoff:
- `TopicValueAssessment`
- `ValueReasoningMemo`
- `ValueDispositionDecision(decision=advance_to_package)`
- question/slice/need/evidence/risk refs

Exit condition:
- package creation is authorized as a draft handoff only, not as promotion.

### 5. TopicPackage(draft) -> Replay/API/V1C
Before entering `T-056` or `T-054`, review:
- package has trace refs to v1a and all v1b authorities.
- package narrative is consistent with question contract and value memo.
- package readiness has explicit status and blockers.
- v1c input bundle is complete.

Handoff:
- `TopicPackage(draft)`
- `PackageTraceBoundaryCheck`
- `TopicPackageReadinessAssessment`
- `TopicSelectionV1bToV1cInputBundle`

Exit condition:
- v1c can start promotion review without rerunning value assessment or scraping package prose.

## Implementation Readiness

Ready to implement in this order:
1. `T-055`
2. `T-057`
3. `T-059`
4. `T-060`
5. `T-058`
6. `T-056`
7. `T-054`

Each package has:
- a single primary responsibility,
- explicit upstream input,
- durable output for the next package,
- negative/loopback outcomes,
- verification expectations.

## Final Review
- The child-package set covers all v1b stage objects listed in the parent design.
- The two discovered gaps are now assigned concrete packages.
- The implementation order is dependency-safe.
- The plan keeps v1b separate from v1a need validation and v1c promotion authorization.
