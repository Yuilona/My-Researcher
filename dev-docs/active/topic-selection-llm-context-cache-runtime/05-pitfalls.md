# 05 Pitfalls

## Do Not Repeat
- Do not treat cache, compressed summaries, or provider-side cache telemetry as authority.
- Do not let `provider_llm` silently return a stored response; live provider execution and response reuse must remain distinguishable.
- Do not create node-local cache key formulas that bypass shared contract fields.
- Do not allow exploration context cache entries to satisfy arbiter context requests, or vice versa.
- Do not drop blocker facts, residual risks, source-health warnings, unresolved challenges, method-family gaps, or recheck hints during compression.
- Do not persist hidden reasoning, raw provider logs, credentials, secrets, or unredacted private content.
- Do not use semantic-near cache for authority-bearing workflow decisions.

## Pending
- No resolved implementation pitfalls yet.

