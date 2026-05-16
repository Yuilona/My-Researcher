# 02 Architecture

## Input Contract
- `ValueDispositionDecision(decision=advance_to_package)`
- `TopicValueAssessment`
- `ValueReasoningMemo`
- `TopicQuestionContract`
- `ResearchSlice`
- `ResearchConstraintProfile`
- source v1a bundle and inherited trace/risk/recheck refs

## Output Contract
`TopicPackage(draft)` must include:
- identity and version
- package narrative fields
- selected title candidates
- research background and contribution summary
- candidate methods and evaluation plan
- key risks and non-goals
- authority refs to v1a/v1b objects
- package readiness status
- trace/boundary check refs

`TopicSelectionV1bToV1cInputBundle` must include:
- package ref/version/readiness
- value decision and reasoning refs
- question contract and slice refs
- inherited validated need and evidence/search refs
- accepted risks, blockers, recheck impacts, and readiness check refs

## Handoff To V1C
v1c consumes the bundle for promotion review. It must not re-run value assessment as a hidden promotion gate.

## Implementation Decisions
- `TopicSelectionV1bTopicPackageService` is a backend service only; no Fastify routes, OpenAPI entries, or `buildApp()` wiring were added in this package.
- Draft package narrative is deterministic and derived from the T-060 package-draft handoff payload; T-058 performs no new LLM drafting run and creates no new need or evidence refs.
- Persistence reuses `TitleCardPackage` / `TopicPackage` with v1b authority columns and adds sidecar tables for trace/boundary check, package readiness assessment, and v1b-to-v1c input bundle.
- The Prisma repository patches `TopicSelectionValueDispositionDecision.outputTopicPackageId` in the same transaction that creates the package and sidecars.
- A unique guard on the source `ValueDispositionDecision` prevents duplicate draft packages for one value decision.
