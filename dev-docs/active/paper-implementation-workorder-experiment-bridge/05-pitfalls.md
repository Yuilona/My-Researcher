# 05 Pitfalls

## Do Not Repeat
- Do not submit runs outside `ResearchWorkOrderHarness`.
- Do not copy experiment-foundation result payloads as implementation authority.
- Do not discard failed runs.
- Do not let `EvidenceCandidate` bypass result interpretation and claim trace.
- Do not accept monitor callbacks that cannot be tied back to a work order.
- Do not hide run status or run type inside JSON-only payloads.

## Landed Guardrails
- `ResearchWorkOrder` creation requires an active `ImplementationProject`, admitted `ValidationCycle`, complete work-order trace manifest, run policy, recipe hash, and dataset/code/config refs.
- Confirmatory and reproduction runs require `version_lock_hash` and `config_snapshot_hash`; autotune is blocked for those run types.
- Harness submission only works for admitted/running work orders and stores `external_job_ref/hash` as bridge refs.
- Trusted final monitor records create `RunEvidenceUnit`; monitor records without `work_order_id` are untrusted and do not create run evidence.
- Trusted monitor records also require a previously submitted harness run with matching `external_job_ref/hash`; a bare `work_order_id` callback is not trusted.
- Successful trusted run evidence requires result refs and validation report refs/hashes; failed, cancelled, inconclusive, and negative runs require a failure summary.
- `ResearchWorkOrder` update paths must not reuse create-input mapping; only runtime status/admission/external-job fields are mutable after creation.
- T-096 has no `research-argument` dependency and no direct claim/dossier writer.
