# 00 Overview

## Status
- State: planned
- Next step: Implement after T-061 through T-066 service/repository contracts are stable.

## Parent Package
- Stage parent: `dev-docs/active/topic-selection-v1c-promotion-bridge/`
- Upstream dependencies: T-061, T-062, T-063, T-064, T-065, T-066

## Goal
- Close the v1c Fastify/API surface.
- Drive the full chain from `TopicSelectionV1bToV1cInputBundle` to `PaperProjectBridge` through explicit human promotion decision.
- Expose minimal v1c offline replay routes.

## Non-goals
- Do not implement frontend work.
- Do not add promotion behavior before the backing service contracts exist.
- Do not create bridges without human promotion authorization.

## Owned Scope
- Fastify routes and controller
- `buildApp()` wiring
- OpenAPI tag and route contracts
- API index regeneration
- memory route integration tests
- Prisma HTTP smoke tests

## Acceptance Criteria
- [ ] HTTP chain creates promotion input snapshot, support/gate artifacts, human promotion decision, commitment profile, and bridge.
- [ ] HTTP exposes review/read routes for input snapshots, support/dossiers, gate checks, promotion decisions, bridges, feedback, and recheck requests.
- [ ] Non-promote decisions return typed loopback/action payloads and do not create bridges.
- [ ] Downstream feedback/recheck routes write only feedback/recheck artifacts.
- [ ] Replay routes force `stage='v1c'`.
- [ ] OpenAPI and API index verify cleanly.
