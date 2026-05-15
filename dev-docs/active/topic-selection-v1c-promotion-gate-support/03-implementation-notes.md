# 03 Implementation Notes

## Current Position
- Implemented after T-061.
- Uses deterministic checks plus optional LLM-drafted support prose; final gate disposition is always deterministic.

## Watch Points
- Do not let support prose introduce new evidence or stronger claims.
- Do not collapse support and human decision into one record.
- Do not hide recheck requirements behind a pass-with-risk narrative.

## Implementation Notes - 2026-05-15
- Added shared `topic-selection-v1c-promotion-gate-contracts` with `PromotionDecisionSupport`, `PromotionDossier`, `ArgumentReadinessMiniCheck`, `PromotionGateCheck`, and `PromotionGateHandoff`.
- Added Prisma SSOT models and migration for the four T-062 records. `supportRunKey` is unique and is derived from snapshot id/hash, policy, generation mode, workflow profile, prompt version, and model.
- Added memory and Prisma repositories. `createBundle` persists the four records and control-plane records in one repository call.
- Added `TopicSelectionV1cPromotionGateService.createPromotionGateSupport`, which calls T-061 `getPromotionInputHandoff` first and persists no T-062 records if T-061 rejects the handoff.
- Added optional `llm_draft` mode through injected `BackendLlmGateway.createStructuredOutput`. Draft output can only affect support/dossier prose; deterministic gate evaluation owns disposition and required actions.
- Deterministic disposition precedence is: lineage/blocker failure -> `blocked`; carried recheck refs -> `recheck_required`; bounded argument mini-check gaps -> `needs_revision`; deterministic park marker -> `park`; otherwise `ready_for_human_decision`.
- Accepted risks and memory suggestions are surfaced as warnings and do not block `ready_for_human_decision`.
