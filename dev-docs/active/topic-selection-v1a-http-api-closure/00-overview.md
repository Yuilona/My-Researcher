# 00 Overview

## Status
- State: done
- Next step: Frontend/UIUX can now consume the v1a HTTP surface, or v1b can consume the existing v1b input bundle directly.
- Implementation: buildApp-wired Fastify routes, controller, route tests, and OpenAPI context contract landed on 2026-05-13.

## Parent Package
- Stage parent: `dev-docs/active/topic-selection-v1a-evidence-to-need/`
- Architecture parent: `dev-docs/active/topic-selection-decision-chain-redesign/`

## Goal
- Close the backend HTTP/API layer for v1a so clients can drive the already implemented service chain through Fastify routes.
- Preserve the existing service/repository contracts and keep HTTP concerns at the controller/route boundary.
- Add route-level smoke coverage that proves `buildApp()` wiring can create a human-confirmed `ValidatedNeed` and v1b input bundle.

## Non-goals
- Do not build frontend UI/UX in this package.
- Do not change Prisma schema or persisted object semantics.
- Do not implement v1b draft-topic APIs.
- Do not expose raw quality signals as durable UI state without policy interpretation.

## Owned Scope
- v1a REST route inventory and validation schemas.
- v1a controller methods delegating to existing services.
- `buildApp()` service/repository construction and route registration.
- HTTP-level tests for happy path and validation errors.

## Acceptance Criteria
- [x] `buildApp()` registers v1a topic-selection routes in memory mode.
- [x] Prisma mode can use the same v1a API wiring without a separate service path.
- [x] HTTP route smoke can drive `TopicSeed -> LiteratureResourcePoolSnapshot -> SearchPlan -> SearchRun -> EvidenceMap -> NeedCandidate -> readiness -> support packet -> validate -> v1b input bundle`.
- [x] Route validation returns consistent `INVALID_PAYLOAD` errors for malformed requests before service execution.
- [x] Recheck/risk/memory/offline replay have minimal HTTP endpoints for their v1a service responsibilities.
