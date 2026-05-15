# 02 Architecture

## Input Contract
- `PromotionDecision`
- `PromotionCommitmentProfile`
- `PromotionGateCheck`
- `PromotionInputSnapshot`
- source `TopicPackage(draft)` and `TopicSelectionV1bToV1cInputBundle` refs

## Output Contract
- `PaperProjectBridge`
- `PaperProjectBridgeHandoff`
- optional target `PaperProject` or PaperProject intake ref when downstream creates or links it
- bridge control-plane refs

## Boundary
This package converts a human promotion commitment into a PaperProject bridge. It does not authorize promotion and does not execute PaperProject workflows.

## Data Shape
- source promotion decision id
- source commitment profile id
- source package id and v1c input bundle id
- snapshot hash refs
- accepted risks and unresolved conditions
- required evidence and prohibited claims
- editable title, problem statement, contribution summary, and initial planning notes
- bridge payload hash and optional paper-project intake payload hash

## Review Checklist
- Human promotion decision is current and promote-class.
- Bridge refs match the same snapshot lineage as the promotion decision.
- Conditions and accepted risks are visible to PaperProject.
- No production topic-selection authority object is rewritten.

## Pre-Next Closure
- T-065 accepts feedback only against an active or explicitly archived/superseded bridge with preserved lineage.
- A bridge must expose source promotion decision, commitment profile, package, bundle, and snapshot hash refs.
- Working-copy text is downstream-editable, but upstream refs and authority payloads are immutable.
