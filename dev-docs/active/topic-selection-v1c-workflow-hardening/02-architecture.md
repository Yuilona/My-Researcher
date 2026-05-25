# Architecture

## Boundary
v1c consumes frozen v1b draft package handoff and produces promotion/bridge authority. It may publish a downstream handoff to PaperImplementation/PaperProject intake, but it must not create or mutate downstream implementation authority objects.

## Workflow Standard Inherited From v1a
- WorkflowHarness must be able to execute every node from frozen inputs.
- Deterministic gates must own promotion eligibility, bridge eligibility, and stale-input blocking.
- Any Codex/provider semantic review is advisory and non-authority.
- Promotion authority remains human/delegated with auditable confirmation.
- Replay hashes must include frozen package refs, gate refs, decision refs, bridge refs, and execution specs for any semantic-review slot.

## Expected v1c Node Categories
| Node Area | Initial Category | Notes |
| --- | --- | --- |
| Promotion input snapshot | deterministic | Freeze v1b package and reject drift. |
| Promotion gate support | deterministic with optional semantic review | Gate owns readiness; review cannot bypass blockers. |
| Human promotion decision | human/delegated authority | Codex may help draft auditable condition text only under policy. |
| Promotion commitment profile | deterministic projection | Derived from decision and gate constraints. |
| PaperProjectBridge | deterministic authority | Idempotent; no PaperProject creation side effect. |
| Paper-project intake handoff | deterministic boundary | Downstream consumes, v1c does not write downstream objects. |
| Downstream feedback/recheck | deterministic append-only | Emits typed loopback/recheck projections. |

## Multi-Agent Debate Default
v1c should not default to debate. Promotion is a governance/authority decision with human ownership; adding debate risks obscuring accountability. Debate can be reconsidered only for a bounded advisory dossier-review node, and only if deterministic gates keep authority separate.

## Key Risks
- Allowing model-like output to own promotion or bridge authority.
- Creating PaperProject/PaperImplementation side effects from v1c.
- Treating downstream feedback as mutable correction of historical decisions instead of append-only recheck signal.
- Re-reading mutable v1b state instead of frozen package handoff.
- Duplicate current bridge creation or stale bridge reuse.
