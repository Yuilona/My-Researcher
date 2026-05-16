# Roadmap

## Stage Decision Log
- V1C-001: v1c is the draft-package-to-paper-project-bridge stage.
- V1C-002: v1c starts from readiness-satisfied `TopicPackage(draft)`.
- V1C-003: promotion requires human confirmation.
- V1C-004: v1c detailed child tasks can proceed after v1b closure and replay hardening.
- V1C-005: v1c owns promotion input snapshot, promotion gate, human decision/profile, bridge creation, and downstream feedback/recheck contract.
- V1C-006: bridge creation is allowed only for `promote_to_paper_project` or `promote_with_conditions`; every other outcome must produce typed loopback and required actions.

## Planned Future Child Tasks
1. `T-061 topic-selection-v1c-promotion-input-snapshot`
2. `T-062 topic-selection-v1c-promotion-gate-support`
3. `T-063 topic-selection-v1c-human-promotion-decision-profile`
4. `T-064 topic-selection-v1c-paper-project-bridge`
5. `T-065 topic-selection-v1c-downstream-feedback-recheck`
6. `T-066 topic-selection-v1c-offline-evaluation-replay`
7. `T-067 topic-selection-v1c-http-api-closure`

## Exit Criteria
- v1b package readiness contract is stable.
- v1c child tasks are created with concrete implementation boundaries.
- `PaperProjectBridge` can be created with complete upstream refs and conditions.
- Downstream feedback can return as recheck/feedback without mutating upstream authority.
