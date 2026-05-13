# 02 Architecture

## Route Boundary
Routes should expose v1b operations without reimplementing business decisions:
- intake/constraint profile
- ResearchSlice planning and selection
- TopicQuestion formation and contract selection
- value assessment and disposition
- draft package creation and readiness
- v1c input bundle publication/read

## Error Contract
- Fastify schema validation -> `400 INVALID_PAYLOAD`
- domain `AppError` -> mapped status/code/details
- unexpected failures -> `500 INTERNAL_ERROR`

## Verification Contract
- route integration test for the full chain
- negative schema test
- no-body optional request-body tests where applicable
- memory and Prisma real HTTP smoke

## API Context Contract
OpenAPI and API index must be updated together and verified with existing context scripts.
