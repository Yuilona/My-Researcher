# 06 Pre-Implementation Review

## Review Conclusion
- T-048 is ready to enter implementation after this review.
- Existing code provides useful patterns, but no existing module should be reused as the T-048 authority store.
- The implementation should create a dedicated topic-selection control-plane layer with shared contracts, Prisma-backed repositories, in-memory test repositories, and a harness-first service API.
- Product code for downstream v1a packages should remain blocked until T-048 lands the shared contracts and verifies `attemptTransition(...)`.

## Code Survey
| Area | Existing path | Review result |
| --- | --- | --- |
| Title-card workflow records | `TitleCardManagementService`, `TitleCardResearchRecord`, `TitleCardNeedReview` | Useful upstream target/source refs. Not sufficient for T-048 because `recordStatus`, `lineage`, and payload JSON do not provide queryable gate, workflow, artifact, human-gate, or transition records. |
| Paper lifecycle gate | `ResearchLifecycleService.verifyStageGate(...)`, `StageNode`, `Snapshot` | Useful pattern for gate-to-snapshot flow. Not reusable as-is because it is paper-project scoped, module/M-stage specific, and maps decisions directly to node status. |
| Literature pipeline runs | `PipelineOrchestrator`, `LiteraturePipelineRun`, `LiteraturePipelineRunStep`, `LiteraturePipelineArtifact` | Useful pattern for run/step/artifact accounting. Not reusable directly because it is literature-stage scoped and does not express policy, human gate, transition attempt, or semantic input permissions. |
| Artifact file writing | `LiteratureContentProcessingFileStore` | Useful local file-store pattern. T-048 needs a generic `ArtifactRef` manifest and can borrow safe path/checksum behavior without depending on literature-specific roots. |
| LLM gateway | `BackendLlmGateway`, `LlmCallTelemetry` | Reusable execution boundary for workflow harness calls. T-048 must wrap it so every critical run persists `LLMWorkflowRun`, input snapshot ref, telemetry, artifacts, and state signals. |
| Governance event delivery | `governance-event-delivery/*` | Useful audit/dedupe pattern. Not required for the first harness slice; can be added later if transition attempts need event delivery. |
| Shared contracts | `packages/shared/src/research-lifecycle/*` | Correct location for DTO/schema contracts. No T-048 control-plane contracts exist yet. |
| Prisma schema | `prisma/schema.prisma` | No T-048 tables exist. Implementation requires repo-Prisma schema changes and context refresh after migration. |

## Required New Contracts
T-048 should add dedicated shared contracts for:
- `ContextPolicyVersion`
- `InputSnapshot`
- `ArtifactRef`
- `LLMWorkflowRun`
- `ReadinessGateResult`
- `TransitionPolicyVersion`
- `WorkflowProfilePolicy`
- `ChainTransitionAttempt`
- `QualitySignal`
- `FunctionalLineageLink`
- `TraceSnapshot`
- `HumanConfirmedDecision`

Recommended shared contract file:
- `packages/shared/src/research-lifecycle/topic-selection-control-plane-contracts.ts`

Recommended backend ownership:
- `apps/backend/src/services/topic-selection-control-plane-service.ts`
- `apps/backend/src/repositories/topic-selection-control-plane.repository.ts`
- `apps/backend/src/repositories/in-memory-topic-selection-control-plane-repository.ts`
- `apps/backend/src/repositories/prisma/prisma-topic-selection-control-plane-repository.ts`

## Implementation Decisions
- Use new topic-selection control-plane authority records rather than extending `StageNode`, `Snapshot`, `TitleCardResearchRecord`, or `LiteraturePipelineRun`.
- Keep T-048 service-internal first. Do not add user-facing routes unless a downstream package needs an API boundary.
- Keep business-object writes outside T-048. `attemptTransition(...)` records a transition attempt and derived state-write intents; downstream packages apply business-specific writes through their own repositories.
- Keep refs generic and typed: every cross-object ref should include `ref_type`, `ref_id`, optional `version_id`, optional `title_card_id`, and optional legacy/source refs.
- Columnize query-critical fields. JSON payloads may hold details, but target refs, transition keys, gate result, workflow profile, actor, policy version, blocker status, and artifact refs must remain queryable.
- Use `BackendLlmGateway` only through a workflow harness wrapper that persists `LLMWorkflowRun` and `ArtifactRef`.
- Implement `QualitySignal` as raw runtime telemetry only. It must not create queue items, recheck impacts, memory entries, accepted risks, or state writes inside T-048.
- Implement `HumanConfirmedDecision` as a generic human-gate record. T-049 decides when it is required for `ValidatedNeed`.

## First Vertical Slice
The first implementation slice should prove this minimal path without SearchPlan/EvidenceMap business objects:

```text
compileInputSnapshot(fake target refs)
  -> recordWorkflowRun(fake structured output + artifacts)
  -> runDeterministicGate(fake blockers/warnings)
  -> attemptTransition(fake transition key)
  -> persist ChainTransitionAttempt
  -> verify trace from attempt to gate, input snapshot, workflow run, artifacts, and quality signals
```

This slice should include:
- one passing transition,
- one blocked transition,
- one pass-with-risk transition requiring accepted-risk refs,
- one raw `QualitySignal` that remains non-authoritative.

## Implementation Phases
1. Shared contracts and schemas.
   - Add TypeScript DTOs, enums, JSON schemas, and export wiring.
2. Prisma schema and repositories.
   - Add authority tables and matching Prisma/in-memory repositories.
   - Use the `sync-db-schema-from-code` workflow when applying persisted schema changes.
3. Service layer.
   - Add `TopicSelectionControlPlaneService` with snapshot, artifact, workflow, gate, quality signal, human decision, lineage/trace, and transition helpers.
4. Harness verification.
   - Add fake v1a workflow tests that prove audit trace, deterministic blockers, pass-with-risk behavior, and raw-signal non-authority.
5. Downstream handoff.
   - Publish integration instructions for `T-052`, `T-047`, `T-049`, `T-051`, and `T-050`.

## Blocking Risks Before Coding
- DB migration scope is non-trivial because T-048 introduces new persisted authority records.
- Existing title-card `status` and research-record `recordStatus` are overloaded legacy fields; T-048 must define orthogonal state-write intents without mutating them directly.
- Artifact handling needs a generic manifest abstraction; reusing literature pipeline artifacts would leak literature-specific semantics.
- Tests must prove negative behavior: raw workflow output and raw `QualitySignal` cannot write authority state.

## Start Criteria
- Shared contract names and table ownership from this review are accepted.
- Implementation starts with shared contracts and repository shape, not UI or scheduler work.
- After Prisma schema changes, refresh DB context with `node .ai/scripts/ctl-db-ssot.mjs sync-to-context` and run project/context verification as required.
