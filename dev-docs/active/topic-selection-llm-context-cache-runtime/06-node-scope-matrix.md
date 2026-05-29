# 06 Node Scope Matrix

This matrix identifies the initial T-112 coverage surface. Detailed node policy remains in the owning task packages; this file records cache/compression/token-budget obligations only.

| Area | Node / Surface | LLM Role | Context Policy | Cache Policy | Token Budget Policy | Acceptance Focus |
|---|---|---|---|---|---|---|
| Resource sampling | literature classification batches | single-agent classification | candidate batch digest with title/abstract/key-content only | response reuse disabled for provider; prompt/context exact cache optional later | batch-size plus preflight estimate | batch split stays bounded and telemetry recorded |
| v1a N5 | evidence extraction | provider/Codex semantic extraction | evidence-extraction context packet | context cache exact only; no response reuse in provider canary | block or require compression if selected literature exceeds node budget | stale extraction context misses; incomplete extraction still blocks |
| v1a N6 | generate need candidate | single-agent or debate | `exploration_context` and `arbiter_context` | read-through context cache; response reuse only replay/Codex-approved | broad exploration budget plus strict arbiter budget | cache hit does not skip admission/persistence gates |
| v1a N7 | validate need adjudication | single-agent routing recommendation | support packet plus residual risk/gap digest | response reuse only replay/Codex-approved | strict gate context; no raw candidate pool overflow | cached/reused output still must carry residual risks/gaps |
| v1a N8 | human confirmation semantic review | optional semantic review | validation/human decision digest | response reuse only explicit replay/Codex-approved | compact semantic review budget | human authority boundary unchanged |
| v1b N4 | research-slice options | semantic draft | frozen input plus intake/constraint digest | frozen input hash participates in exact key | preflight before provider draft | cache cannot bypass frozen input replay identity |
| v1b N6 | topic-question candidates | semantic draft | frozen slice/input digest | response reuse only explicit replay/Codex-approved | candidate output budget by profile | stale frozen input blocks/misses |
| v1b N8 | topic value assessment | debate/single-agent semantic assessment | value context plus support artifacts | debate role context exact cache only | role-level budget and final arbiter budget | provider-required scenarios remain live calls |
| v1c N2 | promotion support | bounded debate/advisory support | promotion input snapshot plus risk/support digest | context cache exact only | compact debate budget | promotion gate stays deterministic |
| v1c N6 | feedback normalization | Codex/provider normalization | downstream feedback digest | response reuse only explicit replay/Codex-approved | compact normalization budget | malformed reuse cannot create recheck authority |
| Bridge/downstream | recheck intake | mostly deterministic with optional normalization | source feedback refs and normalized issue digest | projection cache rebuildable only | no provider call unless node policy allows | cache not treated as downstream authority |

## Matrix Acceptance
- Every row must map to a concrete node policy before implementation.
- Every provider-capable row must define token-budget gate behavior.
- Every cache-capable row must define exact key fields and stale behavior.
- Every compression-capable row must define quality checks and forbidden omissions.

