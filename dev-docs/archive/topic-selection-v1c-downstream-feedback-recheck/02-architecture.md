# 02 Architecture

## Input Contract
- `PaperProjectBridge`
- downstream source refs
- feedback payload
- optional observed downstream blocker refs

## Output Contract
- `DownstreamTopicFeedback`
- `TopicSelectionLoopbackClassification`
- `TopicSelectionRecheckRequest`
- impact summary for future topic-selection work

## Boundary
This package records feedback and creates typed loopback/recheck artifacts. It does not execute the loopback or rewrite prior authority records.

## Loopback Targets
- package
- value assessment
- topic question
- research slice
- validated need
- evidence/search
- promotion decision/support
- paper-project bridge
- merge candidate
- paper-project intake

## Review Checklist
- Feedback has a source bridge lineage.
- Loopback cause and target are typed.
- Recheck requests point to source feedback refs.
- Production authority objects are unchanged.

## Pre-Next Closure
- T-066 receives frozen feedback/recheck snapshots with source bridge lineage, loopback target, loopback cause, severity, required action, and source refs.
- Invalid feedback is rejected before it can create a recheck request.
- No-op feedback is still recorded when it is valid but does not require recheck.
