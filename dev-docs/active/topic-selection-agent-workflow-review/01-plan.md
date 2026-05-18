# 01 Plan

## Phase 0 - Workflow Inventory
- List all existing topic-selection links and current implementation owners.
- Identify whether each link already has tests, real-flow coverage, provider LLM participation, and evidence assignment assertions.

## Phase 1 - Ordinary Agent Workflow Review
- For each node, define agent objective, input contract, output contract, allowed tools/context, profile, retry behavior, and deterministic validators.
- Mark nodes that should remain deterministic because LLM involvement would add instability without reviewer value.

## Phase 2 - Multi-Agent Debate Candidates
- Review debate candidates such as evidence polarity conflict, high-risk support assignment, value novelty disagreement, promotion readiness disagreement, and downstream negative feedback recheck.
- For each candidate, define roles such as advocate, skeptic, methodology reviewer, evidence auditor, and arbiter.
- Specify model/profile policy and escalation triggers.

## Phase 3 - Codex-Assisted Alternatives
- Define which acceptance flows can use Codex to produce structured responses instead of calling provider APIs.
- Require the same schema validation, artifact capture, and audit labels as provider-backed execution.
- Separate local acceptance affordances from product runtime behavior.

## Phase 4 - Decision Package
- Produce a final matrix with recommended implementation deltas.
- Split follow-up implementation tasks only where runtime changes are approved.
