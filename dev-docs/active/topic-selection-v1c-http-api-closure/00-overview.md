# 00 Overview

## Status
- State: done
- Next step: T-067 is closed; continue with downstream PaperProject intake work in a separate task if needed.

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
- [x] HTTP chain creates promotion input snapshot, support/gate artifacts, human promotion decision, commitment profile, and bridge.
- [x] HTTP exposes review/read routes for input snapshots, support/dossiers, gate checks, promotion decisions, bridges, feedback, and recheck requests.
- [x] Non-promote decisions return typed loopback/action payloads and do not create bridges.
- [x] Downstream feedback/recheck routes write only feedback/recheck artifacts.
- [x] Replay routes force `stage='v1c'`.
- [x] OpenAPI and API index verify cleanly.
- [x] Prisma smoke runs against an isolated local Postgres schema and cleans up after itself.
