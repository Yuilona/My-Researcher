# T-107 Exit Gate Review

## Decision
- Exit gate decision: `accepted_for_T108_current_state_mapping`
- Scope accepted: v1b service-level product WorkflowHarness normalization from frozen v1a bundle to v1c input handoff.
- Evidence basis: shared schemas, backend harness service tests, N1->N11 service-level E2E smoke, full N1->N11 harness-native HTTP route canary, standalone v1b harness e2e runner, provider-backed standalone v1b canaries, DashScope repeat=3 provider canary, OpenAI repeat=3 provider canary, Prisma-backed harness HTTP smoke, replay/idempotency tests, deterministic gate negative tests, rollback tests, and full backend filtered smoke.
- Out of scope for this exit decision: external interactive Codex-session stability, broader multi-sample/provider operational stability beyond the recorded canaries, `AgentOrchestrator` runtime migration, Prisma migrations, and v1c promotion/bridge authority hardening. Harness-native HTTP invocation, standalone harness runner, provider-backed harness canary mode, and Prisma-backed route smoke were accepted as post-exit supplements.

## Node Acceptance Matrix
| Node | Harness acceptance evidence | Exit decision | Residual risk |
| --- | --- | --- | --- |
| N1 input bundle intake | Deterministic runner creates `V1bIntakeSnapshot` from explicit frozen v1a bundle refs/hashes and emits `N1ToN2Handoff`. Replay drift and malformed refs are covered. | pass | None blocking. |
| N2 constraint profile | Delegated runner writes `ResearchConstraintProfile` only from frozen accepted payload. Codex delegated mode requires matching support artifact provenance. | pass | Live Codex adapter execution is not exercised in this slice. |
| N3 intake readiness | Deterministic runner verifies frozen N1/N2 refs/hashes, writes readiness authority, emits N4 handoff only for ready outcomes, and carries accepted-risk warnings. | pass | None blocking. |
| N4 research slice options | Model-like node requires frozen normalized option draft artifact after registry-backed admission; deterministic runner writes option set/options only after lineage and option gates pass. | pass | DashScope and OpenAI provider-backed standalone canaries cover live N4 draft generation; external Codex session variance remains outside this exit gate. |
| N5 research slice selection | Deterministic/delegated runner consumes frozen N4 handoff and accepted selection payload, writes selection decision/slice only for advancing selection, and loopbacks non-advance decisions. | pass | None blocking. |
| N6 topic question candidates | Model-like node requires frozen normalized candidate draft artifact, filters semantic-fail candidates, writes candidate set only with admissible candidates, and loopbacks all-failed drafts. | pass | DashScope and OpenAI provider-backed standalone canaries cover live N6 draft generation; candidate quality is still bounded by deterministic gates and current-sample evidence. |
| N7 contract materialization | Trial coordinator materializes one active `TopicQuestionContract`, answerability plan, and N8 handoff; consumes N8 feedback for next-candidate trials or N6 loopback. | pass | Multi-candidate exploration is sequential by design; parallel promotion is deferred to future policy. |
| N8 value assessment | Model-like node requires frozen normalized value draft artifact and exact deterministic value gate/dimension coverage before writing assessment/memo authority or N7 feedback. | pass | DashScope and OpenAI provider-backed standalone canaries cover live N8 draft generation; live debate orchestration remains outside this slice. |
| N9 value disposition | Deterministic runner consumes normalized N8 signals and writes disposition authority. Only `advance_to_package` emits N10 handoff. | pass | None blocking. |
| N10 draft package creation | Deterministic runner creates trace-ready package and v1c bundle from frozen N9 handoff; duplicate package attempts return stable existing package authority. | pass | None blocking. |
| N11 v1c input publication | Deterministic terminal runner publishes v1c input handoff from frozen N10 handoff and blocks promotion/bridge/PaperProject side-effect fields. | pass | v1c promotion/bridge safety belongs to T-108. |

## Product Acceptance Findings
- The review found one blocking quality issue before acceptance: N8 runner-level value coverage checked missing/duplicate required gates and dimensions, but not extra unknown entries. This was fixed before exit acceptance.
- Detailed harness, node-behavior, and output-quality acceptance is recorded in `09-deep-acceptance-matrix.md`.
- The final accepted implementation keeps a single harness/control-plane runtime path. The harness-native HTTP route delegates to `TopicSelectionV1bWorkflowHarnessService.invokeNode`; there is no duplicated provider branch and no direct model output authority write.
- Legacy v1b HTTP write routes are no longer registered. Future local v1b automation must use `/topic-selection/v1b/workflow-harness/nodes/:nodeId/invocations`, the harness artifact routes, the shared harness contracts, and `TopicSelectionV1bWorkflowHarnessService` as the SSOT.
- Authority writes are gated by deterministic service checks and replay authority-existence checks. Exact replay returns stable results only when required authority and handoff refs still exist.
- Real Prisma rollback coverage now verifies the multi-record authority repository writes used by N4/N5/N6/N7/N8/N10 roll back partial rows/status patches and can retry with the same authority ids after a corrected input.
- Machine routing is explicit through typed handoffs, route decisions, blocker/warning codes, and loopback targets. Route-only smoke is not used as acceptance evidence.
- Residual risks and warnings are carried forward through readiness, candidate, value, disposition, package, and v1c handoff surfaces instead of being silently cleaned before authority writes.

## Known Non-Blocking Residual Risks
- Repeated DashScope and OpenAI provider execution is now covered by the standalone v1b harness canary for N4/N6/N8 and reached N11 three times in one process for both providers. This is accepted as provider-backed T-107 supplement evidence, but it is intentionally not part of the default quick smoke because provider runtime/cost is materially higher than fixture mode.
- External interactive Codex-session variance is not measured by T-107. The accepted surface proves registry-backed admission, frozen semantic artifact provenance, deterministic gates, Codex-assisted semantic artifact admission through HTTP, and replay behavior.
- OpenAI standalone provider failures seen during the earlier batch were fixed for this acceptance path by tightening N8 score/readiness prompting and increasing the gateway/provider retry budget. A later DashScope N8 schema-adherence failure was fixed by hardening the exact `reasoning_memo.effort_to_value` instruction and adding a conservative known-alias normalization before artifact admission. Broader internet/provider instability beyond the recorded repeat canaries remains an operational concern, not a v1b harness route/gate blocker.
- A Prisma-backed v1b harness HTTP route smoke and standalone harness e2e runner are accepted for T-107. Broader multi-sample/live-Codex operational stability remains a later integration concern.
- v1c promotion, bridge, downstream feedback, and PaperProject authority boundaries are not accepted by T-107. They are the next T-108 hardening scope.

## Readiness
- T-107 v1b WorkflowHarness normalization is ready to hand off into T-108 v1c current-state mapping.
- Recommended next task: start v1c authority-boundary inventory from frozen v1b `V1cInputBundle` publication through promotion gate support, human/delegated decision, bridge creation, downstream handoff, and feedback/recheck.
