# Roadmap

## Decision Log
- T-063-001: promotion authorization must be an explicit human decision.
- T-063-002: bridge creation is a downstream handoff owned by T-064, not by this package.

## Milestones
1. Define human decision, promotion decision, and commitment profile contracts.
2. Implement service/repository persistence.
3. Add loopback contracts for non-promote decisions.
4. Verify bridge handoff exists only for human-confirmed promotion outcomes.

## Exit Criteria
- T-064 can consume a current promote decision and commitment profile to create a bridge.
