# 05 Pitfalls

## Do Not Repeat
- Do not submit runs outside `ResearchWorkOrderHarness`.
- Do not copy experiment-foundation result payloads as implementation authority.
- Do not discard failed runs.
- Do not let `EvidenceCandidate` bypass result interpretation and claim trace.
- Do not accept monitor callbacks that cannot be tied back to a work order.
- Do not hide run status or run type inside JSON-only payloads.
