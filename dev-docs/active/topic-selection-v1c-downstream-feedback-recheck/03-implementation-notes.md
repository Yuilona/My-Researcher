# 03 Implementation Notes

## Expected Implementation
- Prefer deterministic classification from structured feedback fields.
- Keep unstructured notes as supporting context, not primary routing authority.
- Store downstream feedback even when no immediate recheck is required.

## Repository Guidance
- Reuse existing control-plane ref patterns.
- Keep feedback and recheck artifacts sidecar to the production authority chain.
- Support memory and Prisma repositories.

## Watch Points
- A downstream failure is not permission to mutate the package or promotion decision.
- Recheck creation is not a re-run.
- Feedback severity should influence priority, not silently change authority status.

## Implemented 2026-05-16
- Added shared contract `topic-selection-v1c-downstream-feedback-recheck-contracts` for typed feedback creation, feedback records, loopback classification, recheck request, and impact summary.
- Added repo-prisma SSOT table `TopicSelectionDownstreamTopicFeedback` with append-only feedback rows, non-unique `feedbackFingerprint`, bridge lineage, source feedback refs, classification, optional recheck request, impact summary, generic recheck refs, payload, and policy metadata.
- Added memory and Prisma repositories plus `TopicSelectionV1cDownstreamFeedbackRecheckService.recordDownstreamTopicFeedback(input)`.
- The service reads the T-064 active `PaperProjectBridge` handoff, rejects missing/inactive bridge handoffs, workspace drift, malformed refs, and recheck feedback without `required_action`.
- Deterministic loopback mapping is implemented for all planned signals; `no_recheck_needed` records feedback with `impact_level=no_impact` and does not create generic recheck queue state.
- Recheck-required feedback calls `TopicSelectionRecheckRiskMemoryService.recordDownstreamFeedback(...)` using the generated `downstream_topic_feedback` ref as source and persists returned event/impact/queue refs on the feedback record.
- No HTTP routes, OpenAPI wiring, PaperProject creation, or upstream authority mutations were added in T-065.
