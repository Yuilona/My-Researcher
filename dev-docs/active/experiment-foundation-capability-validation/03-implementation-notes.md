# 03 Implementation Notes

## Initial Planning - 2026-05-19
- Created T-090 as a validation-focused follow-up to T-043/T-070~T-078.
- Scope is test harnesses, scenario tests, desktop smoke, and robustness checks.
- Product behavior changes are not planned unless a validation case exposes a concrete defect that must be fixed to preserve the already-agreed semantics.
- External cloud interaction remains mocked/credential-free in this task; real cloud SDK hardening remains a separate follow-up.

## Test Matrix Sync - 2026-05-20
- Added the confirmed detailed test matrix to `02-architecture.md`.
- Matrix groups validation by registry/readiness, automation API flow, candidate promotion, recipe/materialization preconditions, LocalScript, mocked Aliyun, result/evidence, sidecar/adjacent flow, desktop smoke, opt-in DB smoke, and out-of-scope real cloud canary.
- The default T-090 suite should remain credential-free and deterministic; live Postgres and real cloud checks are separate opt-in lanes.

## Harness / Fixture Design Sync - 2026-05-20
- Added the agreed harness design to `02-architecture.md`.
- The design uses three layers:
  - deterministic fixture builders for valid and drifted experiment graphs;
  - route-first API scenario harness around Fastify `buildApp().inject()`;
  - external fakes for LocalScript roots/scripts and mocked Aliyun PAI-DLC behavior.
- Initial implementation should prioritize backend/API capability tests before desktop smoke, because current renderer work has unrelated active changes.

## Critical-node Deep-test Sync - 2026-05-20
- Added a critical-node deep-test matrix to `02-architecture.md`.
- Each critical node now requires functional, integration, robustness, traceability, and quality coverage; security-sensitive nodes also require explicit data-safety tests.
- The matrix prevents T-090 from becoming a shallow happy-path test pass and gives implementation a coverage standard for registry, readiness, promotion, recipe/materialization, execution, collect/validation, evidence/sidecar, desktop, and adjacent-flow boundaries.

## Open Implementation Notes
- Inventory current tests before adding new ones to avoid duplicating existing schema/unit coverage.
- Prefer route-level scenarios for end-to-end capability proof.
- Keep live Postgres and real cloud checks opt-in so default local validation remains reliable.
