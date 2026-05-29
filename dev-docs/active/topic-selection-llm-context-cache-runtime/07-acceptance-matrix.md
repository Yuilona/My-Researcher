# 07 Acceptance Matrix

## Contract Tests
| Case | Expected Result |
|---|---|
| Unknown context family | schema rejects |
| Cache key missing policy/schema/profile fields | schema rejects |
| Context-family drift | cache miss or block |
| Source ref/hash drift | cache miss or block |
| Prompt template drift | response reuse rejected |
| Model option/profile drift | response reuse rejected |
| `provider_llm` response reuse attempt | blocked or treated as miss |
| Compression report missing source refs or hashes | schema rejects |
| Compression report with forbidden raw provider/hidden reasoning fields | schema rejects |
| Token-budget gate missing decision | schema rejects |

## Backend Unit Tests
| Area | Case | Expected Result |
|---|---|---|
| Context cache | exact same packet request | returns existing artifact ref with `cache_hit=true` |
| Context cache | stale source hash | creates miss or blocks by policy |
| Token budget | over budget, compression disallowed | blocks before provider call |
| Token budget | over budget, compression allowed | runs compression and records report |
| Response reuse | Codex-approved exact reuse | accepted with `non_provider=true` and source provenance |
| Response reuse | provider-required scenario | live call required; cache not accepted as provider output |
| Compression | drops required risk/gap facts | quality gate blocks |

## Harness And HTTP Tests
| Flow | Required Coverage |
|---|---|
| v1a N6 exact replay | no extra LLM call, no duplicate authority writes, deterministic gates still run |
| v1a N6 stale context | cache miss/block and no unsafe authority writes |
| v1a N7 reused recommendation | residual risks/gaps still enforced |
| v1b N4/N6/N8 | frozen input hash participates in reuse key |
| v1c N2 | promotion support compression cannot bypass deterministic promotion gate |
| v1c feedback normalization | malformed reused packet cannot create downstream recheck |

## Provider Canaries
| Provider | Case | Expected Result |
|---|---|---|
| OpenAI | provider-required live invocation | telemetry recorded; `cache_status` not a business cache hit |
| DashScope | provider-required live invocation | telemetry recorded; response reuse not masquerading as provider output |
| OpenAI or DashScope | token over budget fixture | provider call count remains zero |

## Closure Checks
- Shared typecheck and schema tests pass.
- Backend typecheck and focused unit tests pass.
- v1a/v1b/v1c filtered harness smokes pass.
- Provider canaries pass or are recorded as environment-blocked with no code failure.
- Governance sync/lint passes.
