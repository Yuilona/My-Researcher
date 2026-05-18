# 03 Implementation Notes

## 2026-05-18
- Created T-081 to isolate v1b quality loopback acceptance from T-080's broader question/value quality checks.
- Added deterministic service tests in `apps/backend/src/services/topic-selection-v1b-value-assessment-service.unit.test.ts`.
- Split loopback assertions by disposition:
  - `refine_question` defaults to `topic_question_contract_ref`.
  - `refine_slice` defaults to `research_slice_ref`.
  - `recheck_evidence_or_search` defaults to the first known recheck request, or deterministic pending recheck when none exists.
- Added a `needs_refinement` fixture that cannot be forced into `advance_to_package` and must return through `refine_slice`.
- Strengthened append-only/current-pointer coverage by superseding a previous `advance_to_package` decision with a loopback decision, then verifying the old package handoff is blocked.
- Added HTTP E2E coverage in `apps/backend/src/routes/topic-selection-v1b-routes.integration.test.ts`:
  - fake LLM first returns `needs_refinement`;
  - `ValueDispositionDecision` records `refine_slice` and targets the first `ResearchSlice`;
  - package drafting rejects the non-advance disposition;
  - the same v1b readiness is used to generate a second `ResearchSlice`, second `TopicQuestionContract`, ready `ValueAssessment`, `advance_to_package` disposition, draft package, and v1c input bundle.
- Extended route integration coverage for the other two repair paths:
  - `refine_question` targets the first `TopicQuestionContract`, blocks package drafting, then re-enters question formation on the same `ResearchSlice` and advances through package/v1c after reframing.
  - `recheck_evidence_or_search` targets a deterministic pending `recheck_request`, blocks package drafting, then reassesses the existing `TopicQuestionContract` and advances through package/v1c.
- Added TopicPackage idempotency coverage:
  - concurrent duplicate package creation yields one successful package and one `VERSION_CONFLICT`;
  - Prisma `P2002` on `v1bSourceValueDispositionDecisionId` is mapped to stable `VERSION_CONFLICT` instead of leaking as an infrastructure error.
- Real provider multi-sample testing exposed a TopicQuestion assumption-ref drift:
  - provider returned `ref_type=research_slice_assumption` with id `research_slice_<uuid>` for an inherited assumption whose canonical id was `research_slice_assumption_<uuid>`;
  - `TopicSelectionV1bTopicQuestionService` now normalizes this dropped-prefix form before validation.
- Added repair-closure assertions to the `refine_question` HTTP E2E:
  - the original non-ready `TopicValueAssessment` still cannot be forced into `advance_to_package`;
  - the original `refine_question` loopback decision remains package-blocked after the repaired path succeeds;
  - the repaired `TopicQuestionContract` and T-060 input snapshot keep the original `ResearchSlice` lineage;
  - required support/challenge/baseline/context evidence roles, boundary refs, and inherited assumptions survive the repair path.

## 2026-05-18 Closure
- All T-081 acceptance criteria were already verified before archival.
- Governance closure marks the task done and moves it from active work to archive.
