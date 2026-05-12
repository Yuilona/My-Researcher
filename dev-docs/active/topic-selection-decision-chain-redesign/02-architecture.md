# 02 Architecture

## System Boundary
- Upstream: literature retrieval, local library, `retrieval-topic`, auto-pull, content extraction.
- Decision layer: title-card / topic decision workspace, evidence basket, need validation, research question, value gate, package, promotion.
- Downstream: research-argument workspace, paper-project, stage gates, writing entry.

## Conceptual Chain
```text
TopicSeed
  -> SearchPlan
  -> EvidenceMap
  -> NeedCandidate
  -> ValidatedNeed
  -> ResearchSlice
  -> TopicQuestion
  -> TopicValueAssessment
  -> TopicPackage
  -> PromotionDecision
  -> PaperProject
```

## Core Change From Original Design
- Original chain was mostly a forward pipeline.
- Revised chain is a decision system with loopbacks:
  - weak EvidenceMap returns to SearchPlan
  - rejected NeedCandidate remains as negative evidence
  - failed value gate returns to ResearchSlice or TopicQuestion
  - promotion can be blocked by readiness gaps without deleting the package

## Source Attribution Model
Every consequential claim SHOULD identify its source class:
- `source_claim`: directly stated by a paper or imported source.
- `llm_inference`: inferred or synthesized by the model.
- `human_judgment`: confirmed, revised, or rejected by a human reviewer/owner.
- `counter_evidence`: evidence that challenges the claim, need, slice, question, or value assessment.

## Human Checkpoints
- `TopicSeed`: confirm interest, resources, target community, and exclusions.
- `SearchPlan`: review search coverage and missing synonyms/baselines when risk is high.
- `ValidatedNeed`: approve, revise, or reject meaningful needs.
- `ResearchSlice`: confirm boundaries and explicit non-goals.
- `TopicValueAssessment`: decide `promote / refine / park / drop`.
- `PromotionDecision`: explicitly approve paper-project creation or downstream handoff.

## LLM Responsibilities
- Generate search expansions and adjacent task vocabulary.
- Extract structured evidence units from literature.
- Cluster problem/solution/limitation patterns.
- Generate NeedCandidates and challenge them with counter-evidence.
- Compare research slices and contribution hypotheses.
- Draft reviewer objections, failure modes, and value assessment rationale.
- Package the accepted decision state into reusable downstream artifacts.

## Invariants
- Title generation MUST remain late-stage packaging, not an upstream driver.
- Promotion MUST require human approval.
- LLM outputs MUST NOT be treated as final academic judgment without source attribution and review status.
- `ValidatedNeed` MUST preserve both supporting evidence and challenge evidence.
- A high score MUST NOT override a failed hard gate without explicit owner override and rationale.
- `TopicPackage` MUST be traceable back to needs, question, value assessment, and evidence.

## Key Risks
- EvidenceMap pollution from biased search or shallow abstract summaries.
- Gap hallucination from treating missing discussion as unsolved problem.
- Over-trusting value scores without calibration.
- Turning human checkpoints into rubber-stamp UI.
- Promoting a package before argument readiness is established.
