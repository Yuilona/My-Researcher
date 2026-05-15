# 03 Implementation Notes

## Current Position
- This package is intentionally stage-level only.
- Detailed implementation split is now available because v1b package readiness and `TopicSelectionV1bToV1cInputBundle` are stable.
- Child packages `T-061` through `T-067` are planned and should execute in dependency order.
- v1c must preserve promotion as human authorization. `PromotionDecisionSupport` and `PromotionGateCheck` can recommend, block, or request refinement, but cannot create `PaperProjectBridge`.
- v1c closure must preserve a downstream feedback/recheck path so PaperProject, Writing, or ResearchArgument issues return as typed feedback instead of upstream authority rewrites.

## 2026-05-15 T-063 Closure
- `T-063 topic-selection-v1c-human-promotion-decision-profile` is implemented and verified.
- The stage now has an explicit human authorization boundary: T-063 consumes T-062 `PromotionGateHandoff`, records domain `HumanPromotionDecision`, generic `TopicSelectionHumanConfirmedDecision`, `PromotionDecision`, and promote-class `PromotionCommitmentProfile`, and exposes a T-064 bridge handoff without creating `PaperProjectBridge`.
- Currentness is locked at one current `PromotionDecision` per `promotion_input_snapshot_id`; stale gate checks and non-ready promote attempts are rejected.

## 2026-05-15 T-064 Closure
- `T-064 topic-selection-v1c-paper-project-bridge` is implemented and verified.
- The stage now has an explicit bridge authority boundary: T-064 consumes only current T-063 promote-class `PromotionBridgeHandoff`, persists `PaperProjectBridge`, records source hashes and control-plane refs, and returns a downstream bridge handoff without creating `PaperProject`.
- Bridge creation is idempotent by `sourcePromotionDecisionId`; duplicate creates return the existing active bridge handoff.
- `promote_with_conditions` carries conditions into the commitment-derived working-copy payload and bridge record.

## Expected Future Split
- `PromotionInputSnapshot` owns v1c entry validation from `TopicSelectionV1bToV1cInputBundle`.
- `PromotionGateCheck` owns trace, boundary, blocker, risk, recheck, package narrative, and argument mini-check readiness.
- `PromotionDecision` and `PromotionCommitmentProfile` own human authorization and commitment freezing.
- `PaperProjectBridge` owns downstream handoff refs, snapshot hashes, created/linked state, and working-copy text.
- Downstream feedback/recheck owns bridge consumption issues, project execution discoveries, and research-argument/writing objections that need upstream review.

## Watch Points
- Do not let `TopicPackage(draft)` directly create a paper project.
- Do not let LLM recommendation become promotion authorization.
- Do not let downstream PaperProject edits rewrite upstream authority.
- Do not treat `ArgumentReadinessMiniCheck` as full research-argument workspace readiness.
- Do not let v1c HTTP/API closure precede service/repository contract stability.
