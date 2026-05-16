# Roadmap

## Target
Close v1a backend API enough for a client to drive evidence-to-need without importing backend services directly.

## Milestones
1. Route/controller scaffold for the main decision chain.
2. `buildApp()` wiring for memory and Prisma repository strategies.
3. HTTP smoke tests and docs/governance update.

## Rollback
- Remove the route registration from `buildApp()`.
- Delete the v1a route/controller/test files if the API shape needs a larger redesign.
