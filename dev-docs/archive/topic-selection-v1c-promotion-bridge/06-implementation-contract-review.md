# 06 Implementation Contract Review

## Purpose
- Verify that the v1c child packages cover the complete draft-package-to-paper-project-bridge stage.
- Prevent boundary drift between v1b `TopicPackage(draft)`, v1c promotion authorization, and downstream PaperProject execution.

## Package Chain
```text
T-061 PromotionInputSnapshot
  -> T-062 PromotionDecisionSupport / PromotionDossier / PromotionGateCheck / ArgumentReadinessMiniCheck
  -> T-063 HumanPromotionDecision / PromotionDecision / PromotionCommitmentProfile
  -> T-064 PaperProjectBridge
  -> T-065 downstream feedback/recheck
  -> T-066 offline replay baseline
  -> T-067 HTTP/API closure
```

## Cross-Package Contracts
- v1c starts from `TopicSelectionV1bToV1cInputBundle`; no child package may re-run v1b value assessment or modify v1b authority objects.
- `PromotionDecisionSupport`, `PromotionDossier`, and `PromotionGateCheck` are advisory/gating artifacts. They cannot authorize promotion.
- `PromotionDecision` requires an explicit human decision record.
- `PaperProjectBridge` can be created only from a current human-confirmed promotion decision.
- Promotion decisions use the canonical decision vocabulary: `promote_to_paper_project`, `promote_with_conditions`, `merge_packages`, `refine_package`, `reassess_value`, `revise_question`, `revise_slice`, `recheck_evidence_or_search`, `park`, and `drop`.
- Only `promote_to_paper_project` and `promote_with_conditions` may create a bridge handoff.
- Non-promote outcomes must carry typed loopback targets, required actions, and source refs.
- Downstream feedback/recheck records are append-only routing artifacts; they must not mutate upstream package/question/slice/need/search authority.
- Offline replay uses frozen snapshots only and writes no production authority state.

## Coverage Review
- `T-061` covers entry freshness, package readiness, trace refs, and input snapshot stability.
- `T-062` covers support material, promotion dossier read model, blockers, argument mini-check, recheck state, and gate disposition.
- `T-063` covers human authorization, non-promote loopbacks, commitment freezing, and promotion output state.
- `T-064` covers bridge persistence, snapshot hashes, editable working-copy text, and uniqueness.
- `T-065` covers downstream feedback source classification, loopback routing, and recheck creation.
- `T-066` covers v1c calibration metrics without live writes.
- `T-067` covers route/controller/OpenAPI/buildApp closure after core contracts are stable.

## Open Watch Points
- Do not collapse `PromotionGateCheck` and `HumanPromotionDecision`.
- Do not treat `ready_for_promotion_review` as automatic promotion.
- Do not let bridge creation happen inside T-063.
- Do not let downstream PaperProject edits rewrite upstream `TopicPackage(draft)` or `PromotionDecision`.

## 2026-05-15 Completeness Review

### Verdict
The seven child packages cover the v1c stage goal without requiring another implementation package. The review found contract gaps, but each gap can be closed inside the existing package boundaries.

### Gap Closure Plan
| Gap | Risk | Owner | Closure |
|---|---|---|---|
| `PromotionDossier` appeared in the parent design but had no owner | implementation might create an untracked authority object | T-062 | Treat as a reviewer-facing read model generated from `PromotionDecisionSupport`; not a separate authority gate. |
| promotion outcome vocabulary differed between parent and T-063 | non-promote loopbacks could be lost or collapsed | T-063 / T-065 / T-067 | Use one canonical decision vocabulary and require typed loopback target/actions for all non-promote outcomes. |
| T-061/T-062 had weak pre-next closure semantics | stale inputs or unresolved blockers could leak downstream | T-061 / T-062 | Add explicit closure statuses, review checklists, and stop conditions before next package consumption. |
| gate and human decision boundary was ambiguous for blocked cases | a human promote could bypass gate blockers | T-062 / T-063 | Only `ready_for_human_decision` gates can support promote outcomes; blocked gates may only produce non-promote/loopback decisions. |
| replay did not explicitly cover input staleness or gate false-pass | T-061/T-062 regressions could be invisible | T-066 | Add v1c replay case/metric/diff coverage for input staleness and gate blocker false-pass. |
| API routes lacked key read/review surfaces | HTTP clients could not review before advancing | T-067 | Add GET routes for promotion input snapshots, support/dossier, gate checks, decisions, and downstream feedback/recheck records. |

## Step-by-Step Handoff Review

### T-061 -> T-062
- Required input: current `TopicSelectionV1bToV1cInputBundle`.
- Review before handoff: package readiness, bundle currentness, package trace/boundary refs, readiness assessment refs, value/question/slice/need/evidence refs, risk/blocker/memory/recheck refs, source snapshot hashes.
- Closure status: `ready_for_gate`, `blocked`, `needs_upstream_refresh`, or `superseded`.
- Handoff rule: T-062 consumes only `ready_for_gate` `PromotionInputSnapshot` handoffs.

### T-062 -> T-063
- Required input: `PromotionInputSnapshot`.
- Review before handoff: trace completeness, blocker state, recheck state, accepted risk scope, argument mini-check, narrative/claim ceiling consistency, required actions.
- Closure status: `ready_for_human_decision`, `blocked`, `needs_revision`, `recheck_required`, or `park`.
- Handoff rule: promote outcomes are allowed only when the gate is `ready_for_human_decision`; blocked gates can only produce non-promote loopback/action decisions.

### T-063 -> T-064
- Required input: current gate/support/dossier refs plus explicit human decision.
- Review before handoff: human actor, decision timestamp, gate/support lineage, confirmed snapshot hash, rationale, accepted risks, conditions, allowed refinements, stop/reopen conditions.
- Closure status: promote handoff, non-promote loopback, park, or drop.
- Handoff rule: T-064 consumes only current human-confirmed `promote_to_paper_project` or `promote_with_conditions` decisions with a commitment profile.

### T-064 -> T-065
- Required input: current promote decision and commitment profile.
- Review before handoff: bridge uniqueness, source snapshot hashes, bridge payload hash, working-copy payload, conditions, risks, paper-project intake refs.
- Closure status: active bridge, blocked bridge, superseded bridge, or archived bridge.
- Handoff rule: downstream feedback must reference bridge lineage and cannot rewrite upstream authority artifacts.

### T-065 -> T-066
- Required input: downstream feedback/recheck artifacts.
- Review before replay: feedback source, bridge lineage, loopback target, loopback cause, severity, required action, source refs.
- Closure status: feedback recorded, recheck requested, no-op recorded, or invalid feedback rejected.
- Handoff rule: T-066 uses frozen snapshots of feedback/recheck artifacts only.

### T-066 -> T-067
- Required input: stable service/repository contracts for T-061 through T-065 and replay contracts.
- Review before API closure: all core services have memory and Prisma behavior, replay writes only offline records, route schemas match shared contracts.
- Closure status: ready for HTTP closure or blocked by service contract drift.
- Handoff rule: T-067 adds HTTP/API wiring only after backing contracts are stable.
