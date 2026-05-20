# 05 Pitfalls

## Do Not Repeat
- Do not build a second agent runtime.
- Do not let provider fallback become workflow semantics.
- Do not persist hidden reasoning or provider secrets.
- Do not let agent output bypass `TransitionAttempt`, gates, trace, or `StateWriter`.
- Do not let each flow node create a local harness or private gate vocabulary.
- Do not let harness quality signals directly decide research direction.
