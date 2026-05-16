# 07 Governance Scope Acceptance

## Decision
- Date: 2026-05-16
- Decision: close T-042 as the parent architecture/governance package.
- Project handling: reuse existing T-042 for scope closure; do not add product code in this step.
- Follow-up handling: backend decision-chain acceptance should be created and executed as a separate task package.

## Accepted T-042 Scope
- T-042 is the design SSOT for the topic-selection decision chain.
- T-042 covers the v1a/v1b/v1c stage split, child package ownership, cross-stage invariants, human/LLM responsibility boundaries, and topic-selection to PaperProject bridge boundary.
- T-042 accepts that implementation evidence exists in the child packages for backend services, shared contracts, Prisma schema, HTTP/API routes, offline replay, and isolated Prisma smoke checks.
- T-042 does not itself re-run the full backend acceptance chain; that belongs to the follow-up backend decision-chain acceptance task.

## Implementation Gap Map

| Area | Status | Scope Decision |
|---|---|---|
| Parent design and invariants | covered | `06-design-spec.md` remains canonical for object model, gates, loopbacks, and boundaries. |
| v1a evidence-to-need backend | covered by child tasks | Closed through T-044, T-047, T-048, T-049, T-050, T-051, T-052, and T-053 evidence. |
| v1b need-to-draft-topic backend | covered by child tasks | Closed through T-045, T-054, T-055, T-056, T-057, T-058, T-059, and T-060 evidence. |
| v1c promotion bridge backend | covered by child tasks | Closed through T-046 and T-061 through T-067 evidence, including HTTP/API and downstream feedback/recheck. |
| API/context contracts | covered | OpenAPI, API index, DB context, and context registry are generated/verified by child task evidence. |
| Desktop reviewer workbench for new chain | not covered | Existing desktop title-card workbench remains legacy-compatible; new v1a/v1b/v1c reviewer UI should be a separate UI task. |
| Full PaperProject execution | not covered | T-042/v1c only creates `PaperProjectBridge`; execution planning, writing, experiments, and research-argument runtime are downstream tasks. |
| Real-world quality threshold calibration | not covered | Offline replay baselines exist; curated non-synthetic datasets and mature thresholds require later data collection. |
| Production/live environment rollout | not covered | Isolated Prisma smoke checks are accepted for this scope; target environment migration/operations remain deployment/environment work. |

## Acceptance Boundary
- Accepted: governance consistency, stage ownership, status alignment, documented scope exclusions, and readiness for a separate backend decision-chain acceptance task.
- Not accepted here: product UX acceptance, live user workflow acceptance, real-dataset research quality claims, or downstream paper execution behavior.

## Follow-up Task Boundary
The next task should verify the implemented backend chain end to end rather than revisit the architecture:
- run v1a/v1b/v1c route and service checks as one acceptance suite;
- assert hard invariants for non-validate, non-advance, non-promote, human confirmation, bridge creation, and downstream feedback immutability;
- run schema/API/context checks and isolated Prisma smoke;
- record residual gaps separately from T-042.
