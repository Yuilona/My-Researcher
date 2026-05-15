# 02 Architecture

## Input Contract
- frozen v1c bundle snapshot
- gold expectation
- observed output
- optional replay diff baseline

## Output Contract
- offline replay dataset
- offline replay run
- frozen case result
- v1c metric results
- replay diff records

## Proposed Case Types
- `promotion_input_staleness_false_pass`
- `promotion_gate_blocker_false_pass`
- `human_promotion_bypass`
- `promotion_false_pass`
- `bridge_trace_gap`
- `commitment_profile_gap`
- `loopback_target_misroute`
- `downstream_mutation_attempt`

## Proposed Metric Keys
- `promotion_input_staleness_false_pass_rate`
- `promotion_gate_blocker_false_pass_rate`
- `human_promotion_bypass_rate`
- `promotion_false_pass_rate`
- `bridge_trace_completeness`
- `commitment_profile_completeness`
- `loopback_target_accuracy`
- `downstream_mutation_guard_rate`

## Proposed Diff Dimensions
- `promotion_input_currentness`
- `promotion_gate_blocker`
- `human_authorization`
- `promotion_gate`
- `bridge_trace`
- `commitment_profile`
- `loopback_target`
- `downstream_feedback`

## Boundary
Replay is a calibration surface. It never grants promotion, creates bridges, or mutates production authority objects.

## Pre-API Closure
- T-067 may expose v1c replay routes only after v1c replay contracts validate frozen snapshots for input, gate, human decision, bridge, and downstream feedback cases.
- Replay route handlers must force `stage='v1c'` and write only offline replay records.
