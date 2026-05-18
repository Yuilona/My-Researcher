# 01 Plan

## Phase 1: Governance
- Create the task bundle and register it in the project hub.
- Map `T-081` to `M-001 > F-001 > R-009`.

## Phase 2: Service Acceptance Tests
- Add targeted unit tests for the three loopback dispositions:
  - `refine_question` -> `topic_question_contract_ref`
  - `refine_slice` -> `research_slice_ref`
  - `recheck_evidence_or_search` -> existing `recheck_request_ref`, or pending ref when none exists
- Assert no `package_draft_input` and no `output_topic_package_id` are created for non-advance decisions.

## Phase 3: Negative and Invariant Tests
- Assert a `needs_refinement` assessment rejects `advance_to_package`.
- Assert non-advance decisions cannot publish package draft input.
- Assert a superseding loopback decision invalidates the previous advance decision.

## Phase 4: Verification
- Run focused v1b value assessment unit tests.
- Run backend typecheck.
- Record any discovered implementation gaps or defects.
