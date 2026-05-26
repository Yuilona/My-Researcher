# T-107 Exit Gate Review

## Decision
- Exit gate decision: `accepted_for_T108_current_state_mapping`
- Scope accepted: v1b service-level product WorkflowHarness normalization from frozen v1a bundle to v1c input handoff.
- Evidence basis: shared schemas, backend harness service tests, N1->N11 service-level E2E smoke, replay/idempotency tests, deterministic gate negative tests, and full backend filtered smoke.
- Out of scope for this exit decision: route exposure, live Codex/provider execution, `AgentOrchestrator` runtime migration, Prisma migrations, and v1c promotion/bridge authority hardening.

## Node Acceptance Matrix
| Node | Harness acceptance evidence | Exit decision | Residual risk |
| --- | --- | --- | --- |
| N1 input bundle intake | Deterministic runner creates `V1bIntakeSnapshot` from explicit frozen v1a bundle refs/hashes and emits `N1ToN2Handoff`. Replay drift and malformed refs are covered. | pass | None blocking. |
| N2 constraint profile | Delegated runner writes `ResearchConstraintProfile` only from frozen accepted payload. Codex delegated mode requires matching support artifact provenance. | pass | Live Codex adapter execution is not exercised in this slice. |
| N3 intake readiness | Deterministic runner verifies frozen N1/N2 refs/hashes, writes readiness authority, emits N4 handoff only for ready outcomes, and carries accepted-risk warnings. | pass | None blocking. |
| N4 research slice options | Model-like node requires frozen normalized option draft artifact after registry-backed admission; deterministic runner writes option set/options only after lineage and option gates pass. | pass | Live provider/Codex execution is admission-tested only. |
| N5 research slice selection | Deterministic/delegated runner consumes frozen N4 handoff and accepted selection payload, writes selection decision/slice only for advancing selection, and loopbacks non-advance decisions. | pass | None blocking. |
| N6 topic question candidates | Model-like node requires frozen normalized candidate draft artifact, filters semantic-fail candidates, writes candidate set only with admissible candidates, and loopbacks all-failed drafts. | pass | Candidate quality still depends on upstream frozen semantic artifact quality, bounded by deterministic gates. |
| N7 contract materialization | Trial coordinator materializes one active `TopicQuestionContract`, answerability plan, and N8 handoff; consumes N8 feedback for next-candidate trials or N6 loopback. | pass | Multi-candidate exploration is sequential by design; parallel promotion is deferred to future policy. |
| N8 value assessment | Model-like node requires frozen normalized value draft artifact and exact deterministic value gate/dimension coverage before writing assessment/memo authority or N7 feedback. | pass | Live debate execution is not exercised in this slice. |
| N9 value disposition | Deterministic runner consumes normalized N8 signals and writes disposition authority. Only `advance_to_package` emits N10 handoff. | pass | None blocking. |
| N10 draft package creation | Deterministic runner creates trace-ready package and v1c bundle from frozen N9 handoff; duplicate package attempts return stable existing package authority. | pass | None blocking. |
| N11 v1c input publication | Deterministic terminal runner publishes v1c input handoff from frozen N10 handoff and blocks promotion/bridge/PaperProject side-effect fields. | pass | v1c promotion/bridge safety belongs to T-108. |

## Product Acceptance Findings
- The review found one blocking quality issue before acceptance: N8 runner-level value coverage checked missing/duplicate required gates and dimensions, but not extra unknown entries. This was fixed before exit acceptance.
- The final accepted implementation keeps a single harness/control-plane runtime path. There is no route-only glue, no duplicated provider branch, and no direct model output authority write.
- Existing v1b HTTP routes and legacy service-level APIs are retained for compatibility with current product surfaces, but they are not the normalization authority and must not be extended as a second workflow orchestration path. Future v1b/v1c automation work should use the shared harness contracts and `TopicSelectionV1bWorkflowHarnessService` as the SSOT.
- Authority writes are gated by deterministic service checks and replay authority-existence checks. Exact replay returns stable results only when required authority and handoff refs still exist.
- Machine routing is explicit through typed handoffs, route decisions, blocker/warning codes, and loopback targets. Route-only smoke is not used as acceptance evidence.
- Residual risks and warnings are carried forward through readiness, candidate, value, disposition, package, and v1c handoff surfaces instead of being silently cleaned before authority writes.

## Known Non-Blocking Residual Risks
- Live Codex/provider execution is not performed by T-107. The accepted surface proves registry-backed admission, frozen semantic artifact provenance, deterministic gates, and replay behavior; live adapter canaries remain a later integration/full-E2E concern.
- Backend full test still has 8 unrelated failures in literature route/service expectations and DATABASE_URL-gated Prisma smoke tests. Filtered output reports no v1b harness failures.
- v1c promotion, bridge, downstream feedback, and PaperProject authority boundaries are not accepted by T-107. They are the next T-108 hardening scope.

## Readiness
- T-107 v1b WorkflowHarness normalization is ready to hand off into T-108 v1c current-state mapping.
- Recommended next task: start v1c authority-boundary inventory from frozen v1b `V1cInputBundle` publication through promotion gate support, human/delegated decision, bridge creation, downstream handoff, and feedback/recheck.
