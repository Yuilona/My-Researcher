# 07 Acceptance Matrix

## Contract Tests
| Case | Expected Result |
|---|---|
| Unknown context family | schema rejects |
| Cache key missing policy/schema/profile fields | schema rejects |
| Cache key missing context identity/preprocessing scope marker | schema rejects |
| Context cache hit envelope missing artifact ref, artifact hash, cache key hash, source refs hash, freshness status, or provenance ref | schema rejects |
| Context cache result outside `hit`, `miss`, `blocked_stale`, `blocked_drift`, `bypassed`, `not_applicable` | schema rejects |
| Context cache index stores business payload or provider response payload | schema rejects |
| Context-family drift | cache miss or block |
| Source ref/hash drift | cache miss or block |
| Prompt template drift | response reuse rejected |
| Prompt packet key missing `prompt_variant_key` for multi-role/stage slot | schema rejects |
| Prompt packet hash omits context refs/hashes, dynamic material refs/hashes, output contract, profile/model params, runtime modifiers, or redaction policy | schema rejects |
| Prompt packet identity omits compression report ref/hash or compressed context hash fields | schema rejects |
| Persisted prompt payload is not redacted/ref-backed | schema rejects |
| Persisted prompt artifact contains hidden reasoning, raw provider logs, credentials, secrets, or unredacted private content | schema rejects |
| Dynamic prompt material lacks schema, artifact ref, hash, source refs, producer slot, or provenance | schema rejects |
| Dynamic prompt material attempts to override executable template, output contract, authority boundary, or provider-required-live policy | schema rejects or quality gate blocks |
| `PromptQualityReport` missing decision, blocker/warning codes, prompt hash, variant key, context hashes, dynamic material refs, output contract, redaction policy, or provenance | schema rejects |
| Runtime audit envelope missing workflow/node/slot/attempt identity, execution mode, profile/schema/policy/template hashes, context/cache/prompt/token/reuse/gate outcomes, or blocker/warning codes | schema rejects |
| Provider telemetry appears in audit envelope without live provider call | schema rejects |
| Audit projection missing source envelope ref/hash | schema rejects |
| Audit projection rewrites execution mode, live-provider status, reuse status, blocker/warning codes, or authority-boundary outcome | schema rejects |
| Human-facing audit projection includes raw cache keys, prompt payload details, raw provider telemetry, hidden reasoning, raw provider logs, credentials, secrets, or unredacted private content | schema rejects |
| Model option/profile drift | response reuse rejected |
| `provider_llm` response reuse attempt | blocked or treated as miss |
| `codex_assisted` response reuse missing approval ref or local approval setting | schema rejects |
| `codex_assisted` or `mocked_llm` reused response missing `non_provider=true` | schema rejects |
| Mocked response reuse missing fixture id/version or replay hash | schema rejects |
| Response reuse index stores business authority payload or provider telemetry as payload | schema rejects |
| Response reuse provenance missing source workflow/node/attempt, prompt/context/profile/schema/policy versions, or response hash | schema rejects |
| Compression report missing source refs or hashes | schema rejects |
| Compression report with forbidden raw provider/hidden reasoning fields | schema rejects |
| Compression report missing executor kind, strategy version, before/after token estimate, or quality gate result | schema rejects |
| Token-budget gate missing decision | schema rejects |
| Token-budget profile missing output budget, safety margin, or unknown-estimate behavior | schema rejects |
| `ContextPolicyProfile` missing source, memory, compression, cache, token-budget, reuse, or provenance policy | schema rejects |
| Cache/reuse key missing `invocation_slot_id` | schema rejects |
| Runtime implementation attempts to wire a slot that is inventory-only and not implementation-ready | registry or readiness lint rejects |
| v1a N6 first-slice profile missing registered id/version/hash | registry lint rejects |
| v1a N6 first-slice profile omits prompt variant, token budget, compression, cache, reuse, audit, or test obligations | readiness lint rejects |
| Memory policy allows durable memory as standalone evidence | schema rejects |
| Profile registry contains slot/profile mismatch | schema or registry lint rejects |
| Profile registry contains unsupported functional template or execution modifier | schema rejects |
| Stage adapter attempts to define independent cache/reuse/token-budget provenance semantics | contract or registry lint rejects |

## Backend Unit Tests
| Area | Case | Expected Result |
|---|---|---|
| Profile registry | unknown profile id or version | blocks before context compilation/provider invocation |
| Profile registry | profile hash drift | blocks before cache/reuse lookup |
| Profile registry | slot/profile mismatch | blocks before token-budget preflight |
| Readiness gate | non-v1a-N6 inventory slot requests runtime activation | blocks until row is promoted to implementation-ready status |
| Readiness gate | all v1a N6 first-slice profiles registered | runtime may proceed to context compilation/key building |
| Context cache | exact same packet request | returns existing artifact ref with `cache_hit=true` |
| Context cache | stale source hash | creates miss or blocks by policy |
| Context cache | exact cross-provider context packet hit | returns existing artifact ref without provider response reuse |
| Context cache | provider response presented as cross-provider cache hit | rejected or treated as miss |
| Context cache | miss compiles and persists new context artifact | cache index row is inserted idempotently with artifact ref and provenance only |
| Context cache | stage adapter tries local read-through cache outside runtime | rejected or detected by runtime integration test |
| Context cache | context-family mismatch with identical source refs | returns miss/block, never a hit |
| Prompt cache | same system prompt with different debate role/stage prompt | produces distinct prompt packet hashes and no cross-role hit |
| Prompt cache | same rendered slot with different compression report hash or compressed context hash | produces distinct prompt packet hashes and no cross-compression hit |
| Prompt cache | Codex-assisted invocation supplies stale prompt packet hash after compression identity changes | rejected as prompt hash drift |
| Prompt cache | prompt payload persisted inline in index | rejected by contract or persistence validation |
| Prompt cache | exact prompt packet hash already indexed | returns existing redacted prompt artifact ref and prompt quality report ref only |
| Prompt cache | Prisma-backed persistent index row | stores exact identity metadata, artifact refs, hashes, freshness, quality decision, blockers, warnings, and provenance only |
| Prompt cache | persisted prompt index row attempts to store prompt payload, provider response, or provider telemetry payload | rejected by design/test; no such fields exist in the Prisma model |
| Prompt cache | exact prompt packet cache hit in `provider_llm` mode | provider call still executes live; only prompt artifact refs are reused and response cache remains `not_applicable` |
| Provider canary harness | OpenAI/DashScope prompt-cache exact hit over existing gateway boundary | local canary records two gateway calls for two invocations, reuses only prompt artifact refs, and keeps response cache status `not_applicable` |
| Provider canary harness | OpenAI/DashScope over-budget fixture | local canary records provider call count `0` and `blocked_over_budget` before gateway execution |
| Production-shaped Prisma smoke | provider-required prompt cache exact hit over migrated local/dev DB | real Prisma prompt index stores one row, prompt artifacts are reused, provider gateway is called twice, and response reuse remains null |
| Production-shaped Prisma smoke | provider over-budget fixture over migrated local/dev DB | token-budget gate blocks with provider call count `0` and no authority writes |
| Production-shaped v1a harness | v1a N1-N9 main flow with balanced local/dev resource sample | Prisma-backed harness passes, no external provider calls occur, and N6 prompt index row is persisted |
| Production-shaped v1a replay | exact replay and drift-negative replay branch | Prisma-backed replay smoke passes with the balanced sample fixture; exact replay adds no authority writes and no LLM calls, while drifted N6-N9 inputs surface `REPLAY_INPUT_HASH_MISMATCH` without provider calls |
| Production-shaped v1a replay | default deterministic mock sample underfills harness roles | harness records the underfilled sample artifact and falls back to the T-112 balanced replay fixture without weakening production sampling guardrails |
| Prompt cache | exact prompt cache hit but cached quality report differs from current runtime quality decision | blocks as prompt packet cache drift before provider/Codex/mock execution |
| Prompt cache | stale prompt packet index entry | blocks or misses according to slot profile stale policy |
| Prompt cache | stored entry drifts on profile, slot, output contract, redaction policy, compression identity, model option, params, or runtime modifiers | `blocked_drift` |
| Prompt cache | provider response is presented as prompt packet cache artifact | rejected or treated as miss; prompt cache never returns response payloads |
| Dynamic prompt material | arbiter-generated issue frame is valid | final synthesis renders it through fixed template and includes material hash in prompt hash |
| Dynamic prompt material | stale or schema-invalid issue frame | prompt quality gate blocks before provider/Codex/mock execution |
| Prompt quality | required context refs missing | `PromptQualityReport` decision is `block` and provider call count remains zero |
| Prompt quality | rendered prompt contains governance markers such as `no_hidden_reasoning` or natural terms such as `risk-aware` | quality gate warns/passes without false-positive secret or hidden-reasoning blocker |
| Prompt quality | rendered prompt contains raw provider log or secret-shaped payload | blocks before provider/Codex/mock execution and records prompt-quality provenance |
| Prompt artifacts | runtime-enabled invocation succeeds | redacted prompt artifact and prompt-quality report refs are recorded without persisted prompt text |
| Prompt quality | effectiveness telemetry shows schema failure or gate rejection | telemetry is recorded as review signal without mutating prior authority decisions |
| Audit envelope | provider live invocation | records provider telemetry and live execution provenance |
| Audit envelope | Codex-approved reuse | records `non_provider=true`, approval ref, reuse provenance, and no provider telemetry |
| Audit projection | operator summary generated | includes cache/compression/token/prompt/schema/gate status and envelope ref/hash |
| Audit projection | human trust summary generated | includes source refs, risks/gaps/recheck hints, live/non-provider label, gate status, and envelope ref/hash without low-level internals |
| Memory policy | stale or source-drifted memory | misses, blocks, or downgrades to warning according to profile policy |
| Runtime integration | direct gateway caller uses provider without runtime preflight | test blocks or detects provider call count violation |
| Runtime integration | resource sampling/v1b/v1c direct provider path claims T-112 runtime semantics before promotion | test fails |
| Runtime integration | external artifact admission bypasses runtime provenance/reuse validation | admission rejected |
| v1b N7 context hub | missing required N6/N8 feedback/grouping context refs | context admission blocks or records explicit blocker |
| v1b N7 context hub | valid support artifacts and frozen refs | produces ref-backed N7 handoff for N8/loopback without treating support as authority |
| Token budget | over budget, compression disallowed | blocks before provider call |
| Token budget | over budget, compression allowed | runs compression and records report |
| v1a N6 compression | over target before compression and within target after compression | records `context_compression_report`, re-renders compressed prompt, performs one provider call, and still runs schema/admission/persistence gates |
| Token budget | estimate unknown and profile blocks unknown | blocks before provider call |
| Token budget | provider actual token count differs from estimate | records calibration telemetry without mutating prior gate decision |
| Token budget | provider-aware tokenizer is absent | still uses conservative estimator and produces auditable gate result |
| Compression executor | Codex-assisted compression output missing preserved blocker/risk/gap/recheck facts | quality gate blocks |
| Compression executor | provider-required live-call slot tries default Codex pre-compression | blocks unless compressed-context canary policy explicitly allows it |
| Response reuse | Codex-approved exact reuse | accepted with `non_provider=true` and source provenance |
| Response reuse | Codex exact reuse without approval | rejected before schema/deterministic gate admission |
| Response reuse | mocked fixture replay in acceptance | accepted only with fixture/replay provenance and `non_provider=true` |
| Response reuse | reused response bypasses schema validation or deterministic gate | test fails |
| Response reuse | reuse index contains payload instead of artifact ref | rejected by contract or persistence validation |
| Response reuse | provider-required scenario | live call required; cache not accepted as provider output |
| Compression | drops required risk/gap/recheck facts | quality gate blocks |

## Harness And HTTP Tests
| Flow | Required Coverage |
|---|---|
| v1a N6 exact replay | no extra LLM call, no duplicate authority writes, deterministic gates still run |
| v1a N6 Codex-approved exact reuse | no provider call, `non_provider=true`, candidate admission and persistence gates still run |
| v1a N6 provider mode historical response hit | treated as miss/block and cannot satisfy provider output |
| v1a N6 stale context | cache miss/block and no unsafe authority writes |
| v1a N6 read-through cache hit | existing context artifact ref is reused and candidate admission/persistence gates still run |
| v1a N6 Codex compression | long exploration context can be compressed only when profile allows it; arbiter/gate required facts remain preserved |
| v1a N6 deterministic compression | over-target single-agent context records compression artifact, carries report provenance, re-renders compressed context, and does not skip deterministic gates |
| v1a N6 compression identity | compression report artifact hash and compressed context hash are carried into prompt hash and invocation provenance |
| v1a N6 compressed over budget | compression report is recorded and trace-visible, provider call count remains zero, and no ranked/admission/routing/authority write occurs |
| v1a N6 compression quality block | missing required preserved facts surfaces `COMPRESSION_QUALITY_GATE_BLOCKED`, provider call count remains zero, and no authority write occurs |
| v1a N6 slot isolation | single-agent, explorer, critic, arbiter framing, and arbiter final do not satisfy each other's cache/reuse keys |
| v1a N6 dynamic issue frame | arbiter final synthesis uses fixed template plus issue-frame artifact ref; prompt hash changes when issue-frame hash changes |
| v1a N6 prompt quality gate | arbiter/final prompt missing blocker/risk/gap/recheck material blocks or warns according to profile |
| v1a N6 debate prompt quality | governance markers and `risk-aware` domain text appear in debate context | prompt quality gate does not mask successful mocked debate execution |
| v1a N6 duplicate merge hint | deterministic admission returns merge-hint/no-admissible result with `risk-aware` context | prompt quality gate does not mask deterministic admission blocker |
| v1a N6 audit projection | human-facing summary | exposes source/risk/gap/gate/live-or-non-provider status without prompt payloads or raw telemetry |
| v1a N6 first-slice readiness | profiles, key fields, prompt variants, token budgets, compression/reuse policies, audit projections, and focused tests are present | implementation gate passes |
| v1a N7 reused recommendation | residual risks/gaps still enforced |
| v1b N4/N6/N8 | frozen input hash participates in reuse key |
| v1b N7 | high-quality topic-question-contract context is admitted and produces N7->N8/loopback handoff refs |
| v1c N2 | promotion support compression cannot bypass deterministic promotion gate |
| v1c feedback normalization | malformed reused packet cannot create downstream recheck |

## Provider Canaries
| Provider | Slot / Case | Expected Result |
|---|---|---|
| OpenAI | v1a N6 provider-required prompt-cache canary | live provider evidence passed: exact prompt cache hit still performs two gateway calls, prompt refs are reused, response reuse stays null |
| DashScope | v1a N6 provider-required prompt-cache canary | live provider evidence passed: exact prompt cache hit still performs two gateway calls, prompt refs are reused, response reuse stays null |
| OpenAI or DashScope | token over-budget canary | live evidence passed with provider call count zero before gateway execution |
| OpenAI | v1c N2 bounded micro-debate four-call workflow | every role slot executes as live provider calls; cached response cannot replace any role output |
| DashScope | v1c N2 bounded micro-debate four-call workflow | every role slot executes as live provider calls; provider telemetry and prompt/context hashes are recorded |
| OpenAI | v1c N3 gate diagnostic adjunct | live provider call remains diagnostic only and cannot change deterministic gate disposition |
| DashScope | v1c N3 gate diagnostic adjunct | live provider call remains diagnostic only and cannot change deterministic gate disposition |
| OpenAI | v1c N4 delegated promotion decision candidate | live provider output is only a candidate before deterministic delegated-decision admission |
| DashScope | v1c N4 delegated promotion decision candidate | live provider output is only a candidate before deterministic delegated-decision admission |
| OpenAI | v1c N6 downstream feedback normalization | malformed or cached provider output cannot create downstream recheck authority |
| DashScope | v1c N6 downstream feedback normalization | malformed or cached provider output cannot create downstream recheck authority |
| OpenAI or DashScope | live token over budget fixture | provider call count remains zero |

## Closure Checks
- Shared typecheck and schema tests pass.
- Backend typecheck and focused unit tests pass.
- v1a/v1b/v1c filtered harness smokes pass.
- Provider canaries pass or are recorded as environment-blocked with no code failure.
- Governance sync/lint passes.
