# 02 Architecture

## Input Contract
- `PromotionGateCheck`
- `PromotionDecisionSupport`
- `PromotionDossier`
- `ArgumentReadinessMiniCheck`
- `PromotionInputSnapshot`

## Output Contract
- `HumanPromotionDecision`
- `PromotionDecision`
- `PromotionCommitmentProfile`
- T-064 bridge creation input for promote outcomes only

## Boundary
This package authorizes or rejects promotion. It does not create PaperProject-owned objects.

## Review Checklist
- Human actor is explicit.
- Gate/support refs match the current promotion input.
- Non-promote loopbacks are typed.
- Commitment profile freezes conditions and accepted risks.

## Decision Semantics
- Bridge-eligible decisions: `promote_to_paper_project`, `promote_with_conditions`.
- Non-promote decisions: `merge_packages`, `refine_package`, `reassess_value`, `revise_question`, `revise_slice`, `recheck_evidence_or_search`, `park`, `drop`.
- Promote decisions require `PromotionGateCheck.disposition=ready_for_human_decision`.
- `promote_with_conditions` requires condition refs, owner/action notes, and early check obligations.

## Pre-Next Closure
- T-064 receives bridge creation input only for current human-confirmed promote-class decisions.
- Non-promote decisions close into typed loopback/action records and do not expose bridge creation input.
- The commitment profile must include scope, claim ceiling, accepted risks, conditions, allowed refinements, early checks, and stop/reopen conditions.
