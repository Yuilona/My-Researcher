# 03 Implementation Notes

## Expected Implementation
- Follow the v1a/v1b thin controller pattern.
- Keep route bodies explicit rather than accepting arbitrary JSON.
- Inject deterministic LLM/test gateways only if a future v1c service requires them.

## Test Guidance
- Memory integration should create or reuse a ready v1b-to-v1c input bundle fixture.
- The route chain must prove human decision is required before bridge creation.
- Prisma HTTP smoke should use the repo-standard local dev DB path once available.

## Watch Points
- Do not start T-067 before T-061 through T-066 shared/service contracts settle.
- Do not let replay routes call production v1c services.
- Do not skip OpenAPI/API index verification.
