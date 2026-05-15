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
