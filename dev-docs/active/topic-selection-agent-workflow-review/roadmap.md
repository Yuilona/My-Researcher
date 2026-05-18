# Roadmap

## Why This Exists
- Current backend can run ordinary LLM-backed decisions, but multi-agent debate is not yet well-defined enough to implement safely.
- The project needs a workflow review that says where debate improves decision quality, where it is unnecessary, and where Codex-assisted local acceptance is a better tool than direct provider calls.

## Target Outcome
- A complete topic-selection agent workflow matrix.
- Explicit debate candidates with roles, profiles, limits, and resolution rules.
- Clear implementation backlog that avoids ambiguous "just add agents" work.

## Exit Criteria
- Every topic-selection node has one recommended execution type.
- Debate nodes have product-grade contracts and audit expectations.
- Non-debate nodes have a rationale, so future work does not reintroduce semantic drift.
