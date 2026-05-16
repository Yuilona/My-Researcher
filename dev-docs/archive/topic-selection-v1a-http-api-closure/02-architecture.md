# 02 Architecture

## Boundary
- Routes own HTTP paths, Fastify schemas, and URL params.
- Controller owns request-to-service delegation and error envelope mapping.
- Services remain HTTP-free and keep existing transition/readiness semantics.
- Repositories remain the only persistence boundary.

## Route Namespace
- Use `/topic-selection/v1a/*` to make the stage explicit and leave room for future v1b/v1c surfaces.

## Repository Strategy
- Reuse the app repository strategy already used by title-card/literature workflows:
  - memory mode for default local tests.
  - Prisma mode when the app is configured for Prisma-backed repositories.
- No schema changes are expected.

## Risk Notes
- The API should not bypass service gates by accepting prebuilt authority records.
- Raw quality signals may be emitted for integration and diagnostics, but durable queue/risk/memory outputs must come from recheck/risk/memory interpretation endpoints.
- The route test should avoid depending on fulltext extraction setup unless the API surface explicitly owns it.
