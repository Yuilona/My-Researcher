# 03 Implementation Notes

## 2026-05-14 - Split Creation
- Created as the final v1b package because HTTP/API closure should validate service integration after authority objects and contracts have landed.

## 2026-05-14 - HTTP/API Closure
- Added `topic-selection-v1b` Fastify controller/routes and registered them from `buildApp()`.
- Wired memory/Prisma repositories and services for T-055, T-057, T-059, T-060, T-058, and T-056 replay through the same API surface.
- Added deterministic v1b LLM gateway injection to `buildApp(options)` for route tests while production defaults to `BackendLlmGateway`.
- Added route integration tests for the full memory chain, validation errors, non-advance package conflict mapping, v1b replay metrics/diffs, and always-run Prisma HTTP smoke.
- Fixed the T-060 to T-058 package handoff snapshot so `research_slice_snapshot` carries `research_slice_id`, `title_card_id`, `workspace_id`, and `slice_version`.
- Updated OpenAPI and regenerated the API index for all v1b main-chain and replay routes.
