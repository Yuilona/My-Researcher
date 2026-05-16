# 01 Plan

## Phase 1 - Route Contracts
- Define explicit request and response schemas.
- Add OpenAPI tag `topic-selection-v1c`.

Acceptance:
- [ ] Path ids override body ids where applicable.
- [ ] Validation failures return stable `400 INVALID_PAYLOAD`.

## Phase 2 - Controller And Wiring
- Add thin controller methods.
- Register v1c services and repositories in `buildApp()`.
- Keep business rules in services.

Acceptance:
- [ ] Creation routes return `201`.
- [ ] Read/list/complete routes return `200`.
- [ ] `AppError` maps to stable status/code/details.

## Phase 3 - Tests And API Context
- Add memory route integration.
- Add Prisma HTTP smoke.
- Update `docs/context/api/openapi.yaml`.
- Regenerate and verify API index.

Acceptance:
- [ ] Full representative v1c chain passes through HTTP with memory repositories.
- [ ] Prisma smoke requires a real `DATABASE_URL`.
