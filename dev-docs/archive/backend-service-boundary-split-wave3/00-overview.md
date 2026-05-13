# 00 Overview

## Status
- State: done
- Archived: 2026-05-13
- Task ID: `T-016`

## Goal
- Split backend service and repository hotspot files into stable internal responsibility boundaries without changing REST, DB, or shared contract semantics.

## Outcome
- `AutoPullService` kept its public facade while DTO mapping, ranking, alert codes, topic context, and helper logic moved into `services/auto-pull/` slices.
- `LiteratureFlowService` kept facade/orchestrator semantics while artifact runtime logic moved into `literature-flow` runtime helpers.
- `PrismaLiteratureRepository` became a facade over core, pipeline, embedding, and mapper modules while keeping Prisma isolated inside repository code.

## Retained Context
- Business layer still depends on repository interfaces rather than Prisma.
- Shared contracts and REST routes were intentionally frozen for this wave.
