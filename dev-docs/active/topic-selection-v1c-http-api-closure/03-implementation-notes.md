# 03 Implementation Notes

## Expected Implementation
- Follow the v1a/v1b thin controller pattern.
- Keep route bodies explicit rather than accepting arbitrary JSON.
- Inject deterministic LLM/test gateways only if a future v1c service requires them.

## Test Guidance
- Memory integration should create or reuse a ready v1b-to-v1c input bundle fixture.
- The route chain must prove human decision is required before bridge creation.
- Prisma HTTP smoke uses the repo-standard local dev DB as a base URL and creates an isolated temporary schema.

## Watch Points
- Do not start T-067 before T-061 through T-066 shared/service contracts settle.
- Do not let replay routes call production v1c services.
- Do not skip OpenAPI/API index verification.

## 2026-05-16 Implementation
- Added v1c Fastify controller/routes for promotion input snapshots, gate support, human promotion decisions, bridge creation, downstream feedback/recheck projection, and v1c offline replay.
- Wired `buildApp()` memory/Prisma repository factories and v1c service chain in dependency order: promotion input -> gate support -> human decision -> bridge -> downstream feedback/recheck.
- Added optional `topicSelectionV1cPromotionGateLlmGateway`; default wiring uses the shared backend LLM gateway, while deterministic mode remains the default service path.
- Implemented projection-only downstream recheck reads by adding `findFeedbackByRecheckRequestId` and service projection methods. No standalone recheck write route or new Prisma model was added.
- Updated OpenAPI and regenerated API index for `topic-selection-v1c`.
- Ran isolated Prisma smoke against local Postgres; migrations, backend tests, and schema cleanup completed successfully.

## 2026-05-16 Review Fixes
- Added v1c replay run stage guards for complete, metrics, and diffs so v1a/v1b run ids cannot be read or completed through v1c endpoints.
- Tightened v1c offline dataset HTTP/OpenAPI request contracts to accept only `stage='v1c'`; the controller still defensively normalizes the stage to `v1c`.
- Added a T-067 Prisma HTTP smoke that seeds a ready v1b-to-v1c input bundle in a migrated Prisma schema, drives v1c HTTP snapshot -> gate -> human decision -> bridge -> downstream feedback/recheck projection through `buildApp()`, and verifies bridge/feedback persistence.

## 2026-05-16 E2E Smoke Closure
- Extended v1c HTTP E2E smoke coverage for promotion-decision-support alias idempotency, PaperProjectBridge readback, bridge duplicate idempotency, downstream feedback readback, no-recheck projection 404 behavior, and append-only feedback listing.
- Found and fixed a replay route boundary gap: v1c `runs` and `case-results` endpoints could target externally-created v1a/v1b datasets or runs because only complete/metrics/diffs were stage-scoped. Added stage-scoped service methods and routed v1c HTTP writes through them.
- Added regression assertions that v1c replay routes reject v1b dataset run creation and v1b run case-result writes, in addition to the existing v1b complete/metrics/diffs guards.
