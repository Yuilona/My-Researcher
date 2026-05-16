# 01 Plan

## Phase 1 - Route Map
- Map v1b service methods to REST routes.
- Keep controllers thin and route validation explicit.

Acceptance:
- [x] Route inventory aligns with OpenAPI and service contracts.

## Phase 2 - Wiring
- Wire repositories/services/controllers into `buildApp()`.
- Add route integration tests using `app.inject()`.

Acceptance:
- [x] Route smoke creates a draft package from a valid v1b input.

## Phase 3 - Connectivity
- Start real Fastify servers in memory and Prisma modes.
- Probe representative happy and negative paths.
- Verify OpenAPI quality and API index.

Acceptance:
- [x] HTTP connectivity passes in memory mode and is wired for Prisma mode; local Prisma execution is blocked until a reachable Postgres is provided.
