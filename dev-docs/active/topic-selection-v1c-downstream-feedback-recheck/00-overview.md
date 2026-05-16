# 00 Overview

## Status
- State: done
- Next step: T-066 offline replay can consume frozen downstream feedback/recheck snapshots.

## Parent Package
- Stage parent: `dev-docs/active/topic-selection-v1c-promotion-bridge/`
- Upstream dependency: `dev-docs/active/topic-selection-v1c-paper-project-bridge/`
- Related downstream surfaces: PaperProject, writing, research argument, and reviewer-aligned checks.

## Goal
- Record downstream feedback from bridge consumers.
- Classify feedback into typed loopback/recheck targets for topic selection.
- Preserve feedback as trace artifacts instead of silently editing v1b/v1c authority objects.

## Non-goals
- Do not rerun intake, slice, question, value, package, promotion, or bridge services.
- Do not directly modify production authority objects from downstream feedback.
- Do not add HTTP routes; T-067 owns API closure.

## Owned Scope
- `DownstreamTopicFeedback`
- downstream loopback classification
- recheck request/carry-forward refs
- feedback-to-topic-selection impact summary

## Acceptance Criteria
- [x] Feedback source and bridge lineage are required.
- [x] Loopback target is typed: package, value assessment, question, slice, need, evidence/search, promotion, bridge, merge candidate, or paper-project intake.
- [x] Recheck requests are explicit and preserve source feedback refs.
- [x] Existing v1b/v1c authority objects remain immutable from this service.
