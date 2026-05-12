# 05 Pitfalls

## Do-not-repeat Summary
- Do not collapse this redesign into “generate better titles”.
- Do not treat LLM scoring as equivalent to research judgment.
- Do not erase rejected needs; they are useful negative evidence for future decisions.
- Do not treat decision memory as evidence. It is scoped historical objection context and must remain recheckable.
- Do not let LLM-created negative memory directly block future ideas without gate checks, scope, refs, and high-impact review.
- Do not turn system evaluation into human-facing reports or broad dashboards in v1. Use lightweight machine-readable `QualitySignal` records.
- Do not let schedulers interpret raw `QualitySignal`; only control-plane-derived queue/action/recheck/transition records are scheduler inputs.
- Do not implement the full target architecture as v1. Prove the evidence-to-need quality loop before expanding to the complete topic-to-paper bridge.
- Do not present v1a as automatic topic generation. v1a is a title-card reviewer workbench whose successful exit is human-confirmed ValidatedNeed.
- Do not pull ResearchSlice, TopicQuestion, TopicValueAssessment, TopicPackage, or PromotionDecision into the v1a active gate path.
- Do not turn the UI into an audit graph first; start with reviewer cards, blockers, trace drilldown, and focused recheck queues.
- Do not make one page per chain object as the primary UI. Use a title-card workbench with decision review, queue, trace, and policy surfaces.
- Do not let human confirmation become a context-free approve button. The UI must show confirmation scope, evidence, challenge, blockers, accepted risks, and downstream effects.
- Do not treat `advance_to_package` as promotion or as an accepted package state. It only creates a draft handoff package.
- Do not interpret legacy `TitleCardValueAssessment.verdict=promote` as PaperProject promotion authorization. It only maps to `advance_to_package` compatibility semantics.
- Do not replace existing TitleCard tables with a destructive migration before adapters, legacy refs, and sidecar authority objects are in place.
- Do not let a composite `status` field become gate authority. Workflow gates must consume split state axes.
- Do not let implementation notes become a second design spec. `06-design-spec.md` remains the canonical task design.
- Do not build v1 as pure workflow harness scripts; all critical transitions must pass through `DecisionChainControlPlane`.
- Do not let agent workflows assemble their own context from raw artifacts, transcripts, live resource pools, or historical memos. They must consume `ContextCompiler`-generated `InputSnapshot`.
- Do not treat LLM transcript, long memo, prompt/response artifact, `DecisionMemoryEntry`, or `QualitySignal` as evidence. Only authority objects and EvidenceUnit/source-locator-backed summaries can support factual claims.
- Do not let `AgentOrchestrator` own semantic permissions. It schedules roles and rounds inside a workflow run; `ContextPolicy`, `ContextCompiler`, and transition gates own what can be consumed and how.
- Do not make artifact store a second state database. Artifact originals are audit/debug materials; authority state, refs, checksums, retention, pinning, and gate results must stay queryable in DB.
- Do not retain every raw prompt, transcript, search result, debug log, or failed retry forever. Use retention classes, pin only decision-critical artifacts, and start with cleanup dry-run before deletion.
- Do not persist hidden reasoning, token streams, provider secrets, unreferenced scratchpads, or unauthorized external full text for traceability.
- Do not let prompts, LLMs, or schedulers decide multi-agent escalation. Workflow profile escalation belongs to TransitionPolicy / WorkflowProfilePolicy and the control plane.
- Do not make full multi-agent debate the default. Use basic/focused critic first, with retry budgets, stop conditions, and stability checks.
- Do not overbuild v1 into a full autonomous runtime with automatic multi-node scheduling and full-chain recheck propagation before the evidence-to-need loop is validated.
- Do not treat trace integrity as a narrative explanation or LLM judgment. It is deterministic gate logic over refs, versions, evidence chain, semantic use, freshness, and source rights/health.
- Do not treat raw QualitySignal, RecheckImpact, GateResult, workflow failure, or downstream feedback as UI tasks. Queue items must be control-plane-derived and deduplicated.
- Do not make queue UI write authority state, dismiss blockers, decide handler permissions, or merge duplicate work. Queue UI can only trigger allowed control-plane actions.
- Do not let queues grow without dedup, cooldown, retry budget, per-seed/workspace caps, and supersession.
- Do not let cross-module APIs pass mutable internal state or let downstream modules edit upstream authority. Use refs, snapshots, bridges, working copy, and feedback/recheck events.
- Do not create PaperProjectBridge from a draft package or legacy promote verdict without human-confirmed PromotionDecision.
- Do not treat recheck as broadcast automation. v1 recheck is a ledger plus focused queue: event, impact, resolution, dedup, cooldown, retry budget, and lineage-limited scope.
- Do not let LLM state_signals directly write `freshness_status`; they must pass through `RecheckCoordinator`, gate policy, and `StateWriter`.
- Do not fork recheck into separate v1a/v1b/v1c object models. Stage differences belong in scope/profile/policy fields, not in duplicated tables or divergent semantics.
- Do not implement `CoverageMatrix` as one mutable row object written by SearchPlan, SearchRun, EvidenceMap, AssessCoverage, and human review. It must be a view over responsibility-layered child records.
- Do not treat accepted risk as a note inside a memo or override record. `AcceptedRisk` must be a first-class object with scope, expiry/recheck condition, downstream visibility, and source refs.
- Do not treat `AcceptedRisk` as evidence or as blocker resolution. It only records that a bounded residual risk was accepted.
- Do not let topic-selection workflows read the live literature resource pool as an implicit input. They must consume a persisted `LiteratureResourcePoolSnapshot` or a materialized snapshot hash with refs.
- Do not precompute evidence strength as every EvidenceUnit crossed with every possible downstream object. `EvidenceStrengthAssessment` is target-specific, demand-driven, and bundle-first in v1a.

## Historical Lessons
- Pending. Add entries only after a real dead end, bug, or resolved design mistake is encountered.
