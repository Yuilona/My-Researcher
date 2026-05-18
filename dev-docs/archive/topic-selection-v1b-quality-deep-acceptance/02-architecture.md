# 02 Architecture

## Boundary
- v1b consumes a validated need and evidence bundle from v1a.
- v1b emits:
  - `TopicQuestionContract`
  - `TopicValueAssessment`
  - value disposition
  - draft package and v1c handoff when eligible

## Test Focus
- TopicQuestionContract quality guards should run after LLM structured output and before authority-state materialization.
- ValueAssessment should trust normalized v1b authority refs, not provider-shaped wrapper refs.
- Accepted risk must be a true inherited authority ref; ordinary uncertainty must not be converted into accepted risk.

## Risk
- Overfitting quality tests to one phrasing can make LLM-facing behavior brittle.
- Under-testing can allow contract-shaped but research-weak questions to advance.
