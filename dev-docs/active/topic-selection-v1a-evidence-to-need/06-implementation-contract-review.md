# 06 Implementation Contract Review

## Review Conclusion
- v1a coverage is complete after the contract clarifications in this review.
- The six child packages cover the full path from title-card/topic seed to human-confirmed `ValidatedNeed`.
- Product implementation should start with `T-048 topic-selection-v1a-foundation-control-plane`; the other child packages should not write product code against ad hoc local contracts before `T-048` confirms the shared control-plane shapes.

## Coverage Map
| v1a requirement | Owning task | Required output |
| --- | --- | --- |
| Shared context, artifact, workflow, gate, transition, trace, and human-gate contracts | `T-048` | `ContextPolicyVersion`, `InputSnapshot`, `ArtifactRef`, `LLMWorkflowRun`, `ReadinessGateResult`, `ChainTransitionAttempt`, `FunctionalLineageLink`, `TraceSnapshot`, `QualitySignal`, generic `HumanConfirmedDecision` |
| Entry seed and literature/search provenance | `T-052` | `TopicSeed`, `LiteratureResourcePoolSnapshot`, `SearchPlan`, coverage child records, `SearchPlanCoverageMatrix` view, `SearchRun` |
| Search recheck materialization | `T-052` with emitters from `T-049` and queue/risk handling from `T-051` | accepted/rejected `SearchPlanRecheckRequest`, revised `SearchPlan`, follow-up `SearchRun`, or scoped accepted risk |
| Claim-level evidence representation | `T-047` | `EvidenceMap`, `EvidenceUnit`, source locators, links/clusters/conflicts, pollution controls |
| Target-specific evidence strength | `T-047` | demand-driven `EvidenceStrengthAssessment` with cache/stale rules and target refs |
| Need hypothesis, readiness, adjudication, and materialization | `T-049` | `NeedCandidate`, readiness result, `ValidationDecisionSupportPacket`, `ValidateNeedAdjudicationResult`, `ValidatedNeed` only for `final_decision=validate` |
| Runtime recheck, accepted risk, override, queue, and negative memory | `T-051` | `RecheckEvent`, `RecheckImpact`, `RecheckResolution`, `AcceptedRisk`, `HumanOverride`, `DecisionWorkQueueItem`, `CandidateDecisionMemory` / `DecisionMemoryEntry` |
| Offline calibration and replay | `T-050` | `OfflineEvaluationDataset`, `OfflineEvaluationCase`, `OfflineEvaluationRun`, `OfflineEvaluationCaseResult`, `OfflineEvaluationMetricResult`, `ReplayDiff`, first v1a metric baseline |

## Resolved Gaps
| Gap | Resolution |
| --- | --- |
| `QualitySignal` ownership was ambiguous. | `T-048` owns the runtime record contract and emission shell. `T-051` owns policy interpretation into recheck, memory, queue, risk, or required action. `T-050` reads signals only as replay input and metric evidence. |
| `SearchPlanRecheckRequest` was emitted by need validation but not clearly handled. | `T-049` emits the request; `T-052` accepts, rejects, or materializes a revised `SearchPlan` / follow-up `SearchRun`; `T-051` can queue, deduplicate, track impact, or route accepted risk. |
| Human confirmation appeared both generic and business-specific. | `T-048` owns the generic `HumanConfirmedDecision` record/gate shape. `T-049` uses that record as the required human confirmation for `ValidatedNeed` creation. `T-051` owns `HumanOverride` and accepted-risk policy. |
| Trace lineage was listed in the parent but lacked a concrete implementation owner. | `T-048` owns generic `FunctionalLineageLink` and `TraceSnapshot`. Business packages write refs through that contract. `T-050` uses the snapshots for trace-completeness metrics. |
| v1b handoff could be restated inconsistently by child packages. | `T-049` publishes the v1a->v1b input bundle; `T-044` stage closure verifies the bundle includes need, adjudication, support packet, evidence/search snapshots, trace, risks, gaps, memory, and recheck status. |
| Offline evaluation could be blocked by waiting for all production persistence. | `T-050` may start with frozen fixture/snapshot inputs after `T-048`, `T-052`, and `T-047` define refs. Full baseline closure waits for `T-049` and `T-051` outputs. |

## Execution Order
1. `T-048 topic-selection-v1a-foundation-control-plane`
   - Establish the shared record contracts, state-axis rules, gate shell, transition attempt, quality signal shell, trace contract, and generic human-gate record.
2. `T-052 topic-selection-v1a-search-resource-evidence-inputs`
   - Implement seed/literature/search provenance and coverage child records against `T-048` refs.
3. `T-047 topic-selection-v1a-evidence-map-strength`
   - Implement EvidenceMap/EvidenceUnit and target-specific strength assessment from `SearchRun` refs.
4. `T-049 topic-selection-v1a-need-validation`
   - Implement candidate readiness, support packets, adjudication result, `ValidatedNeed` materialization, and v1b input bundle publication.
5. `T-051 topic-selection-v1a-recheck-risk-memory`
   - Implement cross-cutting recheck/risk/memory/queue behavior once the control-plane refs and business-object refs exist. This task can overlap with `T-049` only after the shared contracts are stable.
6. `T-050 topic-selection-v1a-offline-evaluation-replay`
   - Start fixture/replay harness work after frozen refs exist; record the first meaningful baseline after `T-049` and `T-051` produce end-to-end outputs.

## Step Contracts
| Step | Inputs | Outputs | Next consumer | Must verify before moving on |
| --- | --- | --- | --- | --- |
| Control plane | workspace/title-card refs, actor, policy/profile config | input snapshot, workflow run, artifacts, gate result, transition attempt, trace refs, quality signals | every v1a child task | state axes are orthogonal; no LLM output directly mutates authority state |
| Search/resource inputs | title-card intent/topic seed, literature refs, context policy | topic seed, literature snapshot, search plan, coverage children, search run | evidence layer, need validation, recheck, offline replay | SearchPlan and SearchRun both reference the concrete literature snapshot; matrix is view-only |
| Evidence mapping | SearchRun refs, source/content refs, coverage observations | EvidenceMap, EvidenceUnit, locators, conflicts, strength assessments | need validation, recheck, offline replay | claim locators trace to source/content refs; target-specific strength cannot create facts |
| Need readiness | EvidenceMap refs, strength refs, coverage/source-health/recheck states | NeedCandidate, readiness result, decision support packet, optional recheck request | adjudication, recheck, search inputs, offline replay | readiness means adjudication-ready, not validated |
| Adjudication | candidate, support packet, trace, human decision | adjudication result and optional ValidatedNeed | v1b, recheck, offline replay | only `final_decision=validate` creates `ValidatedNeed`; other outcomes set `output_validated_need_id=null` |
| Recheck/risk/memory | quality signals, gate results, recheck requests, downstream feedback | recheck ledger, queue items, accepted risks, overrides, memory entries | all runtime gates and v1b handoff | records do not rewrite historical decisions; queues are control-plane-derived |
| Offline replay | frozen snapshots, workflow/model/search/policy versions, expected labels | replay runs, case results, metric results, diffs | prompt/policy/search calibration | replay writes no production authority objects |

## Implementation Readiness
- Ready to enter the `T-048` package review.
- Not ready to implement downstream child packages until `T-048` confirms the shared persistence/contract shape.
- Stage closure must be reviewed again after the first vertical slice proves `TopicSeed -> SearchRun -> EvidenceMap -> NeedCandidate -> ValidateNeedAdjudicationResult -> ValidatedNeed`.
