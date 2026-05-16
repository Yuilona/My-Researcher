# 03 Implementation Notes

## 2026-05-14 - Split Creation
- Created to prevent question text, answerability, and scope boundary from being spread across value assessment or package narrative.

## 2026-05-14 - Implementation
- Added shared T-059 contracts/export for formation run, question frame, candidate set/candidate, selection decision, formal `TopicQuestion`, `TopicQuestionContract`, answerability plan, structured refs, falsification conditions, and `TopicSelectionV1bValueAssessmentInput`.
- Extended the existing physical `TopicQuestion` table through nullable v1b authority columns only; legacy title-card APIs remain structurally preserved.
- Added T-059 sidecar Prisma authority tables and migration `20260514160000_add_topic_selection_v1b_topic_question_contract`.
- Added in-memory and Prisma `TopicSelectionV1bTopicQuestionRepository` implementations. Prisma materializes selection decision, question(s), contract(s), plans, refs, and falsification conditions in one transaction.
- Added `TopicSelectionV1bTopicQuestionService` with:
  - `formTopicQuestionCandidates({ research_slice_id })`
  - `selectTopicQuestion(...)`
  - `buildValueAssessmentInput({ topic_question_contract_id })`
- Added LLM registry entries for `topic-selection-topic-question-formation`.
- Deliberately did not add HTTP routes, OpenAPI, `buildApp()` wiring, value assessment, package creation, promotion, or PaperProject behavior.

## 2026-05-14 - Review Hardening
- Kept all selection decisions, including `park`, `reject_all`, and `no_admissible_candidate`, on the transactional repository path so candidate status changes and decision context cannot diverge.
- Tightened inherited ref validation to compare stable ref keys, not just ids, for `ValidatedNeed`, evidence, boundary, assumption, and falsification source refs.
- Added `answerability_plan_id`, `accepted_risk_refs`, and `risk_notes` to `TopicQuestionContract` so T-060 receives the formal contract state without reinterpreting selection context.
- Added nullable `v1bQuestionType` metadata on the reused physical `TopicQuestion` table so legacy `contributionHypothesis` semantics do not collapse T-059's formal question type.
- Materialized required/mapped evidence as `claim` evidence refs and carried selected inherited ResearchSlice assumptions into the T-060 handoff instead of leaving them only in the LLM frame payload.
- Split non-admit transition attempts onto `v1b-topic-question-candidate-set-to-selection-decision` so `park`/`reject_all`/`no_admissible_candidate` outcomes do not look like contract creation.
- Rejected duplicate candidate keys, duplicate admitted candidate ids, missing required answerability evidence refs, and `answerable_with_risk` admissions without accepted risk refs before materialization.
- Removed unused repository methods from the T-059 write surface to keep service/repository ownership unambiguous for later T-060 and T-054 work.
