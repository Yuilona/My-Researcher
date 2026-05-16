# 05 Pitfalls

## Do Not Repeat
- Do not validate v1a only through service-level tests after this package; the acceptance target is HTTP route execution through `buildApp()`.

## 2026-05-13 - Readiness Needs Scope
- Symptom: The first HTTP smoke reached readiness but returned `needs_scope_revision` instead of `ready_for_validation`.
- Root cause: `NeedCandidate` readiness requires explicit `scope_notes`; the route payload omitted them.
- Fix: Added scope notes to HTTP smoke candidates.
- Prevention: Treat scope as a readiness input, not just display copy.

## 2026-05-13 - AcceptedRisk Requires a Recheck or Expiry Condition
- Symptom: The accepted-risk route returned `400 INVALID_PAYLOAD` during the HTTP smoke.
- Root cause: The existing T-051 policy requires either `expires_at`/`expiry_condition` or `recheck_condition` for durable accepted risks.
- Fix: Added `recheck_condition` to the route smoke payload.
- Prevention: Do not test or document accepted-risk creation as an unconditional acknowledgement.
