# 00 Overview

## Status
- State: planned
- Task ID: `T-089`
- Feature / Milestone / Requirement: `F-001` / `M-001` / `R-009`
- Depends on: `dev-docs/active/topic-selection-workflow-runtime-foundation/`
- Trigger: after v1b/v1c deep tests, the open design question is not whether every node can call an LLM, but which nodes deserve ordinary agent workflow, which deserve multi-agent debate, and which should be executed by Codex-assisted operator workflow instead of direct provider calls.

## Goal
- Review every topic-selection link from resource sampling through v1a/v1b/v1c and paper-project bridge.
- Clarify ordinary agent workflow semantics: node owner, inputs, outputs, blocking conditions, retry policy, profile, and audit.
- Decide where multi-agent debate is valuable, define the debate roles and model/profile choices, and reject debate where deterministic or single-agent workflow is enough.
- Define where Codex can substitute for direct LLM API calls during local/product acceptance, including structured prompt packets, operator responses, and audit labels.

## Non-goals
- Do not implement the runtime primitives owned by T-088.
- Do not add UI.
- Do not change existing v1a/v1b/v1c contracts until the review produces approved deltas.
- Do not create open-ended debate for every step.

## Acceptance Criteria
- [ ] A node-by-node workflow matrix exists for resource sampling, v1a need/evidence, v1b topic question/value/package, v1c promotion/bridge, and downstream recheck.
- [ ] Each node is classified as deterministic, ordinary single-agent, multi-agent debate, human review, or Codex-assisted acceptance.
- [ ] For each proposed debate node, roles, model/profile choices, inputs, turn limits, resolution rule, blocker rule, and audit artifact are specified.
- [ ] For each rejected debate node, the reason is recorded.
- [ ] Codex-assisted execution boundaries are explicit and distinguish local acceptance from product runtime.
- [ ] Every matrix node has a node policy covering blockers, validators, execution permissions, authority boundary, audit/artifact policy, and failure semantics.
- [ ] Every matrix node references at least one registered `WorkflowScenario`.
- [ ] The output is ready to become implementation tasks without semantic ambiguity.
