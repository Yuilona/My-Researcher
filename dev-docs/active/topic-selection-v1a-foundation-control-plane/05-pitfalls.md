# 05 Pitfalls

## Do Not Repeat
- Do not let workflow output directly write authority status.
- Do not hide gate-critical fields in JSON payload only.
- Do not implement scheduler behavior in this package.
- Do not treat artifacts as evidence.
- Do not collapse all state axes into one `status`.
