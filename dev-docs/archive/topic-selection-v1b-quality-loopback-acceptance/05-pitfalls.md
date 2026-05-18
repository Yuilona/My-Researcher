# 05 Pitfalls

## 2026-05-18
- Route integration tests that include Prisma smoke must use `.env.local` or another real Postgres `DATABASE_URL`; `DATABASE_URL=dummy` only works for pure service unit tests.
- When a test intentionally inspects extra fields from an HTTP response typed narrowly for existing helpers, cast through `unknown` first so `ts-node/esm` can run without `TS_NODE_LOG_ERROR=true`.
- Real provider TopicQuestion output can preserve the correct `ref_type` while shortening a generated assumption id from `research_slice_assumption_<uuid>` to `research_slice_<uuid>`. Treat this as a recoverable alias only when it matches an inherited assumption by relaxed id and title card.
- `ALLOW_NON_ADVANCE_V1B=1` is required for real provider quality regression runs because a high-quality outcome may be a correct loopback (`refine_question`, `refine_slice`, or `recheck_evidence_or_search`), not always package advancement.
