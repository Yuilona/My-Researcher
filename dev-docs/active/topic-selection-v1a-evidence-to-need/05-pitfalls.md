# 05 Pitfalls

## Do Not Repeat
- Do not treat v1a as automatic topic generation.
- Do not pull `ResearchSlice`, `TopicQuestion`, `TopicValueAssessment`, `TopicPackage`, or `PromotionDecision` into the v1a active path.
- Do not create `ValidatedNeed` from failed or loopback adjudication outcomes.
- Do not treat `QualitySignal`, decision memory, LLM transcript, or offline evaluation result as evidence.
- Do not implement recheck as broadcast automation.
- Do not precompute evidence strength for every EvidenceUnit and every possible target.
- Do not let UI or scheduler write authority state directly.
