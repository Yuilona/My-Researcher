# 02 Architecture

## Joint Boundary Decisions
- Joint decision SSOT: `dev-docs/active/topic-selection-workflow-runtime-foundation/06-joint-decisions.md`.
- T-088 owns the runtime primitives implied by those decisions.
- T-089 consumes the same decisions when classifying each topic-selection node into deterministic, single-agent, Codex-assisted, human-review, or multi-agent-debate execution.

## Runtime Boundaries
- `WorkflowHarness`: scenario setup, fixture loading, node sequencing, run trace, and assertions.
- `WorkflowScenario`: versioned acceptance scenario definition. Existing real-flow, E2E, quality-gate, and provider-stability flows must migrate here rather than remain as script-owned semantics. The initial T-089 scenario registry is `dev-docs/active/topic-selection-agent-workflow-review/08-scenarios.md`.
- `AgentOrchestrator`: executor invocation boundary that receives caller-built invocation payloads, validates structured output, applies retry/escalation policy, and records audit. It does not read business DB state to assemble domain context.
- Domain services: still own v1a/v1b/v1c decisions, repositories, and contract validation.
- Provider gateway: existing `BackendLlmGateway` remains the only backend path to provider APIs.

## Profile Escalation Policy
- Inputs: node kind, uncertainty, malformed output count, deterministic guardrail outcome, reviewer risk level, and user-selected execution mode.
- Decisions: keep current profile, retry same profile, escalate profile, block run.
- Audit: selected profile, escalation trigger, retry count, structured-output validation result, and provider telemetry summary.
- It must not silently cross execution modes, switch executor kind, downgrade to heuristics, use cached responses, or bypass deterministic guardrails.
- Escalating from `single_agent` to `multi_agent_debate` is not profile escalation; it is a T-089 workflow classification decision.

## Execution Modes
- `mocked_llm` is test/acceptance-only. It must not be used as product runtime or as provider outage fallback.
- `provider_llm` is the only provider-backed runtime mode and must call through `BackendLlmGateway`.
- `codex_assisted` is an operator/local acceptance mode that validates structured responses like provider output but is not product automation.
- `none` is allowed only as a matrix sentinel for deterministic and human-review nodes that do not invoke `AgentOrchestrator`.
- Mocked and provider-backed decisions must be database- and audit-distinguishable; product runtime stores must reject or quarantine mock writes unless an explicit acceptance/test flag is enabled.

## Trace, Audit, And Persistence
- Reuse the existing topic-selection control-plane primitives rather than creating a parallel trace/audit spine.
- Runtime DB records store queryable summaries and refs; large prompt/context/output payloads belong in redacted artifacts with hashes.
- Domain services remain the only writers of authority objects.
- Agent invocation audit snapshots use the shared `topic-selection-agent-invocation-audit-v1` envelope before control-plane artifact persistence.
- The shared envelope is the only runtime provenance shape for `mocked_llm`, `codex_assisted`, `provider_llm`, single-agent, and future debate role calls; source differences are recorded as fields, not alternate result shapes.
- Current gaps are compatibility items: `ResourceSamplingAudit.llmStructuredOutput`, missing explicit mode/executor fields on `LlmWorkflowRun`, and unconstrained inline payloads must be handled by T-088 without breaking completed T-079 behavior.

## Multi-Agent Debate
- Debate is a bounded executor for explicitly approved high-conflict nodes, not a workflow spine or profile escalation path.
- Debate runtime support must not write authority objects directly.
- Debate caching, retention, artifact granularity, and per-node persistence policy are owned by T-089.

## Codex-Assisted Mode
- Codex-assisted mode is the default low-cost local execution option for this personal local-first project.
- The harness/runtime emits a structured prompt packet and accepts a structured response packet from Codex or the operator.
- Most single-agent nodes may use Codex instead of provider LLM when allowed by node policy.
- Multi-agent debate may assign Codex to specific roles when T-089 allows it.
- Codex-assisted results may drive local product workflows, but they must be query-distinguishable from provider-backed decisions and validated exactly like provider output.

## Compatibility Guardrails
- No parallel ad hoc workflow runner should remain authoritative after migration.
- Legacy real-flow/E2E scripts may remain only as wrapper-only CLI entrypoints around `WorkflowHarness.runScenario`.
- Wrapper scripts must not retain topic-selection node sequencing, prompt construction, model-mode branching, guardrail decisions, evidence assignment, persistence semantics, hash semantics, or replay/cache semantics.
- Migration is incomplete until repository checks and wrapper tests prove the old scripts cannot execute a separate workflow path.
- Existing API and persistence contracts remain backward compatible.
- No hidden chain-of-thought or non-auditable LLM reasoning is persisted.
