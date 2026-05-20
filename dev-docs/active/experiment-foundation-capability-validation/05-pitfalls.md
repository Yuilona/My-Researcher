# 05 Pitfalls

## Do Not Repeat
- Do not treat `external_training_job` as a generic registry record. It is owned by the T-077 execution table/API.
- Do not add real cloud credentials, SDK payloads, endpoint-private payloads, or inline adapter metadata to shared/public DTOs.
- Do not let desktop tests pass by reimplementing readiness, promotion, materialization, result validation, or adapter semantics in renderer code.
- Do not copy reusable experiment foundation DTOs into research-argument or paper-project state. Use refs, locks, hashes, snapshots, and sidecar refs.
- Do not make live Postgres or real cloud services mandatory for the default local test suite.

## Historical Context
- T-043 remains planned as a parent closure/backlog umbrella, while T-070 through T-078 form the implemented minimum chain.
- T-090 should validate that chain rather than silently expanding it.
- Broader product gaps such as candidate extraction, canonical asset synthesis, tuning workflow, real cloud SDK hardening, and paper-project bridge UI/API should be tracked as separate tasks if testing exposes their need.
