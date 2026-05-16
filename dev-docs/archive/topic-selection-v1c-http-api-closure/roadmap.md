# Roadmap

## T-067 v1c HTTP/API Closure

### Objective
Expose the v1c promotion bridge chain over Fastify after core services and repositories are stable.

### Execution Order
1. Add controllers and routes.
2. Register routes in `buildApp()`.
3. Update OpenAPI and API index.
4. Add memory integration and Prisma HTTP smoke tests.

### Exit
- HTTP can drive v1c from v1b input bundle to PaperProject bridge and downstream feedback/recheck.
- Offline replay v1c routes expose the minimum replay loop.
