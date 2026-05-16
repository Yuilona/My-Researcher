# 03 Implementation Notes

## 2026-05-14 - Split Creation
- Created to keep value judgment independent from both question formation and promotion authorization.

## 2026-05-14 - T-060 Service/Repository Closure
- Added shared T-060 contracts in `topic-selection-v1b-value-assessment-contracts.ts` and exported them through the shared package/barrel.
- Reused the legacy physical `TopicValueAssessment` table through Prisma `TitleCardValueAssessment`, adding only nullable v1b authority metadata.
- Added T-060 sidecar tables for assessment run, value input snapshot, reasoning memo, disposition decision, and value evidence refs.
- Added in-memory and Prisma repositories. Transactional writes keep assessment materialization separate from disposition materialization.
- Added a DB-level partial unique index so only one current `ValueDispositionDecision` can exist per `TopicValueAssessment`.
- Added `TopicSelectionV1bValueAssessmentService` with:
  - `assessTopicValue({ topic_question_contract_id })`
  - `decideValueDisposition({ topic_value_assessment_id, decision })`
  - `buildPackageDraftInput({ value_disposition_decision_id })`
- Added LLM registry profile/template `topic-selection-topic-value-assessment`; prompts forbid new need proof, new evidence authority, question rewrite, slice expansion, package creation, promotion, and PaperProject creation.
- Added focused unit coverage for valid/failed/invalid assessment, unknown refs, overclaim, weak answerability, inherited accepted risks, non-advance decision payloads, active/current package handoff, and critic trigger persistence.
- Hardened disposition validation so formal decisions cannot introduce or drop accepted-risk/blocker refs from the persisted assessment, and non-advance outcomes must carry explicit required actions plus bounded loopback refs where applicable.
- Kept the legacy `TopicValueAssessment` projection compatible but non-authoritative for v1b: legacy `verdict` stays non-promotional for `advance_to_package`, and legacy gate/dimension JSON is shaped for old title-card readers while full v1b authority data remains in the sidecars and research-record payload.
