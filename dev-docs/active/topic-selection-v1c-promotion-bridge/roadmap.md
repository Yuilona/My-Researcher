# Roadmap

## Stage Decision Log
- V1C-001: v1c is the draft-package-to-paper-project-bridge stage.
- V1C-002: v1c starts from readiness-satisfied `TopicPackage(draft)`.
- V1C-003: promotion requires human confirmation.
- V1C-004: v1c detailed child tasks are deferred until v1b closure.
- V1C-005: v1c owns promotion input snapshot, promotion gate, human decision/profile, bridge creation, and downstream feedback/recheck contract.
- V1C-006: bridge creation is allowed only for `promote` or `promote_with_conditions`; every other outcome must produce typed loopback and required actions.

## Planned Future Child Tasks
1. `topic-selection-v1c-promotion-gate`
2. `topic-selection-v1c-promotion-decision-profile`
3. `topic-selection-v1c-paper-project-bridge`
4. `topic-selection-v1c-downstream-feedback-recheck`

## Exit Criteria
- v1b package readiness contract is stable.
- v1c child tasks are created with concrete implementation boundaries.
- `PaperProjectBridge` can be created with complete upstream refs and conditions.
- Downstream feedback can return as recheck/feedback without mutating upstream authority.
