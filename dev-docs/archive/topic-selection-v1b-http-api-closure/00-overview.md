# 00 Overview

## Status
- State: done
- Next step: Use the completed v1b HTTP/API surface as the input boundary for v1c planning.

## Parent Package
- Stage parent: `dev-docs/active/topic-selection-v1b-need-to-draft-topic/`
- Upstream dependencies:
  - `dev-docs/active/topic-selection-v1b-intake-constraint-profile/`
  - `dev-docs/active/topic-selection-v1b-research-slice/`
  - `dev-docs/active/topic-selection-v1b-topic-question-contract/`
  - `dev-docs/active/topic-selection-v1b-value-assessment/`
  - `dev-docs/active/topic-selection-v1b-topic-package-draft/`

## Goal
- Expose v1b service chain through Fastify routes and OpenAPI context.
- Provide route-level smoke coverage for `v1b input bundle -> TopicPackage(draft)`.
- Verify memory and Prisma connectivity for the API surface.

## Non-goals
- Do not implement frontend UI/UX.
- Do not expose v1c promotion routes.
- Do not bypass service-layer readiness, gate, or transition rules.

## Owned Scope
- v1b REST route inventory and validation schemas
- v1b controller boundary
- `buildApp()` service/repository wiring
- OpenAPI/API index/context updates
- route integration tests and real HTTP connectivity smoke

## Acceptance Criteria
- [x] `buildApp()` registers v1b routes in memory mode.
- [x] Prisma mode uses the same v1b route wiring; the smoke is intentionally non-skipped and requires a reachable `DATABASE_URL`.
- [x] Route smoke drives intake, slice, question, value, package, readiness, and v1c bundle publication.
- [x] Malformed payloads return consistent `INVALID_PAYLOAD`.
