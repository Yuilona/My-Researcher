# 05 Pitfalls

## Do Not Repeat
- Do not treat draft package as promotion-ready.
- Do not let package narrative override question, slice, value, or evidence authority.
- Do not hide missing refs in prose fields.
- When adding a split shared contract module, update both the aggregate barrel export and barrel export smoke expectations.

## 2026-05-14 - Shared Barrel Export Smoke
- Symptom: the shared schema/export smoke initially failed after adding the T-058 contract module.
- Root cause: the new module was reachable directly, but the aggregate research-lifecycle barrel expected-key list was not updated in the smoke test.
- What was tried: reran the shared test after contract implementation and inspected the failing export-surface assertion.
- Fix/workaround: exported the T-058 module from `packages/shared/src/research-lifecycle/index.ts` and added its runtime keys to the schema/export smoke.
- Prevention: for future v1b split modules, update direct subpath export, aggregate barrel export, and aggregate smoke expectations in the same patch.
