# 02 Architecture

## Joint Boundary SSOT
- The shared T-088/T-089 boundary decisions are recorded in `dev-docs/active/topic-selection-workflow-runtime-foundation/06-joint-decisions.md`.
- This package should not duplicate those definitions. It consumes them to build the node-by-node workflow matrix and debate eligibility decisions.

## Classification Types
- `deterministic`: no LLM needed; service logic and contracts are the authority.
- `single_agent`: one structured LLM invocation with deterministic validation and audit.
- `multi_agent_debate`: two or more explicit roles with bounded turns and an arbiter/resolution rule.
- `human_review`: a human decision is the authority; LLM output is advisory.
- `codex_assisted`: local/operator acceptance path where Codex provides a structured response packet instead of direct provider API execution.

## Workflow Matrix Contract
- The primary T-089 output is `06-workflow-matrix.md`.
- Each row binds workflow decisions to a concrete `node_id`; narrative sections may explain but must not create separate semantics.
- Required row fields are: `node_id`, `stage`, `authority_object`, `executor_kind`, `default_execution_mode`, `codex_allowed`, `provider_required`, `debate_allowed`, `human_review_required`, `input_refs`, `output_refs`, `blocking_conditions`, `deterministic_validators`, `audit_refs`, `artifact_refs`, and `covered_scenarios`.
- Any rejected debate or rejected Codex/provider alternative must record a node-specific rationale rather than remaining implicit.
- Future implementation tasks must cite matrix rows when changing runtime, prompts, validators, persistence, routes, or tests.

## Node Granularity
- Matrix rows follow the D-11 canonical node list.
- A node is an authority-producing or authority-gating product decision that can be sequenced and asserted by `WorkflowHarness`.
- Validators, guardrails, LLM attempts, artifact writes, hash generation, profile escalation attempts, and repository operations are node-internal details unless they become a cross-stage authority boundary.
- Handoff/publish nodes remain explicit when they create formal stage input boundaries.
- Human confirmation nodes are explicit `human_review` nodes; acceptance scenarios may inject human decision fixtures.
- Downstream nodes are included only where topic-selection E2E acceptance crosses into PaperProject intake or feedback/recheck; T-089 does not redefine downstream PaperProject semantics.

## Debate Design Rules
- Debate must be bounded by turn count, role scope, output schema, and terminal exit semantics.
- Debate is an arbiter-led internal loop, not a one-shot fan-out and not a self-reactivating workflow after terminal exit.
- Debate output cannot bypass deterministic guardrails or human-confirmed checkpoints.
- Debate should only be used where conflicting evidence, risk, novelty, or downstream feedback materially changes the product decision.
- Debate output caching, retention, artifact granularity, and per-node persistence policy are owned by this package and must be decided per approved debate node.

## Candidate Debate Nodes
- Resource sampling evidence polarity conflict: arbiter-led loop with explorer and deep critic worker roles.
- v1a need discovery: arbiter-led loop with explorer and deep critic roles to create a grounded `NeedCandidate` and add it to the existing candidate pool before adjudication.
- v1b value assessment under novelty/feasibility tension: novelty advocate vs feasibility skeptic vs reviewer arbiter.
- v1c promotion support under accepted-risk tension: promotion advocate vs blocker reviewer vs support arbiter.
- v1a need adjudication remains single-agent structured routing with human confirmation fallback; it must not run debate in the initial matrix.
- Promotion gate remains deterministic; debate can only produce advisory support before gate application.
- Downstream feedback recheck is deterministic in the initial matrix and can be reconsidered only through a matrix update.

## Codex-Assisted Execution
- Codex-assisted output is a valid local product workflow execution mode for this personal local-first project.
- T-089 must decide which single-agent nodes allow Codex by default and which require provider execution.
- T-089 must decide, per approved debate node, whether Codex can execute reviewer, skeptic, evidence-auditor, arbiter, or other roles.
- Every Codex-assisted packet must include source inputs, expected schema, response, validation result, audit label, and provenance fields.
- Codex-assisted execution must remain distinguishable from provider-backed execution in trace, audit, and persisted summaries.

## Debate Model Invocation Policy
- Debate model invocation rules live in `11-debate-model-invocation-policy.md`.
- The policy is the SSOT for execution-mode boundaries, provider/profile resolution, role/stage profile mapping, Codex substitution, provider fallback, normalized parameters, provenance, failure behavior, mock isolation, and no-dual-track implementation rules.
- `execution_mode` must remain provider-agnostic. Concrete providers, models, and provider-specific parameters are resolved by versioned model profiles, not by workflow branching logic.

## Default Execution Classification
- Single-agent model-like nodes default to `default_execution_mode=codex_assisted`.
- Deterministic and human-review nodes use `default_execution_mode=none`, meaning no model-like executor is invoked.
- No initial matrix row has `provider_required=yes`; provider execution is scenario-driven or explicit override until a future node policy says otherwise.
- Initial debate eligibility is limited to resource sampling, v1a need discovery, v1b value assessment, and v1c promotion support.

## Node Policy Contract
- Node policies live in `07-node-policies.md`.
- Every matrix row must have a corresponding node policy before implementation.
- Node policies define preconditions, blockers, validators, allowed execution modes, debate triggers, profile escalation refs, contract refs, authority-write boundaries, audit/artifact policy, and failure semantics.
- Matrix classification fields are routing summaries; node policies are the detailed semantic contract.
- Stub policies are allowed during T-089 alignment, but `TBD-node-policy-detail` must be removed before implementing the node.
- Node policy details are filled in the D-15 order: shared vocabulary, debate-eligible nodes, remaining single-agent nodes, then deterministic/human/downstream spine.
- `policy_status=implementation_ready` requires concrete values for all D-13 fields and scenario assertions that can cite the policy.

## Scenario And Runner Boundary
- T-089 debate or workflow acceptance scenarios must be added to the shared `WorkflowScenario` registry owned by T-088.
- T-089 must not introduce standalone debate runners, alternate prompt packet formats, alternate model-routing rules, or separate acceptance artifact semantics.
- Node-level debate policy can define roles, triggers, cache/retention, and output schemas, but execution must still flow through the shared harness/orchestrator path.
- Scenario definitions live in `08-scenarios.md`.
- Scenarios orchestrate acceptance only; matrix rows and node policies remain the business semantics source.
- Provider, Codex-assisted, mocked, and debate scenarios must share the same node contracts, validators, authority-write boundaries, and artifact expectations.
- Debate scenarios may be registered only for nodes with `debate_allowed=yes`.

## Context Cache And Memory
- The shared context/cache policy is D-18 in `dev-docs/active/topic-selection-workflow-runtime-foundation/06-joint-decisions.md`.
- T-089 node policies consume that policy; they must not create node-local cache semantics that conflict with T-088 runtime provenance.
- Debate nodes must distinguish `exploration_context` from `arbiter_context`.
- `exploration_context` is broad and role-facing; it supports expansion, criticism, and alternative framing.
- `arbiter_context` is narrower and gate-facing; it supports synthesis, ranking, unresolved handling, and deterministic validation.
- Exact-invocation response reuse is allowed only as explicit replay/acceptance or operator-approved `codex_assisted` reuse. It must not be recorded as live `provider_llm`.
- Context caches, projection caches, response caches, and compressed summaries are never authority objects.
- Durable memory enters workflows only through structured business records and only as constraints, warnings, or required challenges, not evidence.
