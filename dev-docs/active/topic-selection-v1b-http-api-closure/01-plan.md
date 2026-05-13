# 01 Plan

## Phase 1 - Route Map
- Map v1b service methods to REST routes.
- Keep controllers thin and route validation explicit.

Acceptance:
- [ ] Route inventory aligns with OpenAPI and service contracts.

## Phase 2 - Wiring
- Wire repositories/services/controllers into `buildApp()`.
- Add route integration tests using `app.inject()`.

Acceptance:
- [ ] Route smoke creates a draft package from a valid v1b input.

## Phase 3 - Connectivity
- Start real Fastify servers in memory and Prisma modes.
- Probe representative happy and negative paths.
- Verify OpenAPI quality and API index.

Acceptance:
- [ ] HTTP connectivity passes in both storage modes.
