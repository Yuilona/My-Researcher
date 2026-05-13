# 03 Implementation Notes

## Current Position
- This package is intentionally stage-level only.
- Detailed implementation split is deferred until v1b package readiness is verified.
- v1c must preserve promotion as human authorization. `PromotionDecisionSupport` and `PromotionGateCheck` can recommend, block, or request refinement, but cannot create `PaperProjectBridge`.
- v1c closure must preserve a downstream feedback/recheck path so PaperProject, Writing, or ResearchArgument issues return as typed feedback instead of upstream authority rewrites.

## Expected Future Split
- `PromotionGateCheck` owns trace, boundary, blocker, risk, recheck, package narrative, and argument mini-check readiness.
- `PromotionDecision` and `PromotionCommitmentProfile` own human authorization and commitment freezing.
- `PaperProjectBridge` owns downstream handoff refs, snapshot hashes, created/linked state, and working-copy text.
- Downstream feedback/recheck owns bridge consumption issues, project execution discoveries, and research-argument/writing objections that need upstream review.

## Watch Points
- Do not let `TopicPackage(draft)` directly create a paper project.
- Do not let LLM recommendation become promotion authorization.
- Do not let downstream PaperProject edits rewrite upstream authority.
- Do not treat `ArgumentReadinessMiniCheck` as full research-argument workspace readiness.
