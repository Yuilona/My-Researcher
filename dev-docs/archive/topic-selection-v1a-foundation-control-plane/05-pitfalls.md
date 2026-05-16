# 05 Pitfalls

## Do Not Repeat
- Do not let workflow output directly write authority status.
- Do not hide gate-critical fields in JSON payload only.
- Do not implement scheduler behavior in this package.
- Do not treat artifacts as evidence.
- Do not collapse all state axes into one `status`.
- Do not let a missing readiness gate default to pass.
- Do not let human decision refs satisfy a human gate unless they resolve to matching `HumanConfirmedDecision` records.
