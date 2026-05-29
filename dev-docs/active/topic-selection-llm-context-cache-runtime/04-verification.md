# 04 Verification

## 2026-05-28 - Task Package Creation
| Command | Result | Notes |
|---|---|---|
| `rg -n "T-112\|topic-selection-llm-context-cache-runtime" dev-docs .ai/project/main` | passed | Confirmed no pre-existing T-112 before creation; after sync, T-112 appears in task docs and project governance views. |
| `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main` | passed | Registered task and regenerated derived project views. |
| `node .ai/scripts/ctl-project-governance.mjs map --project main --task T-112 --milestone M-001 --feature F-001 --requirement R-009 --apply` | passed | Mapped T-112 from inbox defaults to topic-selection `M-001/F-001/R-009`. |
| `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main` | passed | Regenerated derived views after mapping. |
| `rg -n "T-112\|topic-selection-llm-context-cache-runtime" .ai/project/main/dashboard.md .ai/project/main/feature-map.md .ai/project/main/task-index.md .ai/project/main/registry.yaml` | passed | T-112 appears in registry, dashboard, feature map, and task index with `F-001` mapping in dashboard/task index. |
| `node .ai/scripts/ctl-project-governance.mjs lint --check --project main` | passed | Lint passed. Existing warning remains for unrelated T-111 overview status format. |
| `git diff --check -- dev-docs/active/topic-selection-llm-context-cache-runtime .ai/project/main` | passed | No whitespace errors in T-112 docs or regenerated project governance files. |

## Required Before Implementation
- Contract design reviewed against T-088/T-089 D-18.
- Node-scope matrix approved.
- First slice selected: context packet cache, token-budget gate, or exact response reuse.

## Required Before Closure
- Shared schema tests.
- Backend unit tests for cache hit/miss/drift.
- Harness tests for v1a/v1b/v1c cache and token-budget behavior.
- Provider canaries for OpenAI and DashScope telemetry/provenance.
- Governance sync/lint.
