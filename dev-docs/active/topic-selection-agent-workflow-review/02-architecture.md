# 02 Architecture

## Classification Types
- `deterministic`: no LLM needed; service logic and contracts are the authority.
- `single_agent`: one structured LLM invocation with deterministic validation and audit.
- `multi_agent_debate`: two or more explicit roles with bounded turns and an arbiter/resolution rule.
- `human_review`: a human decision is the authority; LLM output is advisory.
- `codex_assisted`: local/operator acceptance path where Codex provides a structured response packet instead of direct provider API execution.

## Debate Design Rules
- Debate must be bounded by turn count, role scope, and output schema.
- Debate output cannot bypass deterministic guardrails or human-confirmed checkpoints.
- Debate should only be used where conflicting evidence, risk, novelty, or downstream feedback materially changes the product decision.

## Candidate Debate Nodes
- Resource sampling evidence polarity conflict: advocate vs skeptic vs evidence auditor.
- v1b value assessment under novelty/feasibility tension: novelty advocate vs feasibility skeptic vs reviewer arbiter.
- v1c promotion under accepted risk: promotion advocate vs blocker reviewer vs bridge arbiter.
- Downstream feedback recheck: paper-project owner vs topic-selection rechecker vs evidence auditor.

## Codex-Assisted Execution
- Codex-assisted output is not product runtime automation.
- It is valid for local acceptance when provider access, cost, or reproducibility makes direct API execution undesirable.
- Every Codex-assisted packet must include source inputs, expected schema, response, validation result, and audit label.
