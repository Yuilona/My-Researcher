# 00 Overview

## Status
- State: planned
- Task ID: `T-088`
- Feature / Milestone / Requirement: `F-001` / `M-001` / `R-009`
- Parent architecture package: `dev-docs/archive/topic-selection-decision-chain-redesign/`
- Trigger: T-068/T-079/T-080/T-081/T-082/T-084/T-085 acceptance exposed that v1a/v1b/v1c are individually testable, but workflow execution still lacks one runtime harness and one orchestration boundary.

## Goal
- Build a unified `WorkflowHarness` for topic-selection backend flows so mocked, Codex-assisted, and provider-backed runs share the same node contract, trace shape, fixture setup, and assertion model.
- Implement a generic `AgentOrchestrator` boundary that can execute ordinary agent workflow steps with explicit profile selection, retries, structured outputs, evidence assignment, and audit artifacts.
- Productize a profile escalation policy runtime so nodes can move from cheap/mock/local profiles to stronger provider profiles only when deterministic criteria require it.

## Non-goals
- Do not implement multi-agent debate itself in this package; only provide runtime primitives that a later debate package can consume.
- Do not rewrite v1a/v1b/v1c domain services or change their authority contracts.
- Do not make desktop UI changes.
- Do not add new provider secrets or commit local `.env.local`.

## Acceptance Criteria
- [ ] `WorkflowHarness` can run v1a, v1b, v1c, and bridge-oriented topic-selection scenarios with stable fixtures and node-level assertions.
- [ ] `AgentOrchestrator` exposes a provider-agnostic contract for structured LLM calls, tool/context inputs, evidence role outputs, and retry/escalation audit.
- [ ] Profile escalation policy is deterministic, testable, and records why a profile was used or escalated.
- [ ] Harness supports three execution modes: mocked LLM, Codex-assisted/manual LLM stand-in, and real provider-backed LLM.
- [ ] Existing T-068/T-079/T-084/T-085 real-flow scripts can be migrated or wrapped without keeping duplicate runtime logic.
- [ ] Unit and integration tests cover success, blocked, malformed output, retry, escalation, and audit persistence boundaries.
