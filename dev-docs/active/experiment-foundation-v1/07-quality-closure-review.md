# 07 Quality Closure Review

## Purpose
本文件用于把外部设计审查报告的高价值观点，对照当前 repo 实际状态，收口为母包级质量结论。

结论分两层：
- 任务治理和设计分包已经闭环：`T-069` 已把审查观点吸收进母包和子包边界。
- 产品功能尚未完全闭环：当前 repo 已有实验基座 shared contracts/schema tests 的 T-070~T-075 子集，T-076 已落地最小 DB/API/readiness 闭环，T-077 已落地 execution adapters 最小闭环；desktop UI 仍未实现。

## Review Report Alignment
| Review point | Current package guard | Owner |
|---|---|---|
| S1 过大，需要拆为最小闭环和薄壳扩展 | 母包 roadmap 和子包顺序拆为 S1-A / S1-B；先 `T-070` 合同，再逐步进入 API/UI/adapter | Parent + T-070 |
| `DatasetAsset` 与版本/存储/校验语义重叠 | `DatasetAsset` 只保留 identity；`DatasetVersion` / `ChecksumManifest` / `DatasetLocation` / `DatasetMirror` 分别 owning 版本、校验、本地引用和云执行镜像 | T-070 |
| `BenchmarkAsset` 与评测协议语义重叠 | `BenchmarkAsset` 只保留 identity/testbed；`EvaluationProtocol` owns metrics/evaluator/reporting/statistics/comparison/budget/tuning rules | T-071 |
| 缺少一等版本锁 | `RunRecipe` 必须锁 dataset version/hash、baseline implementation version、evaluation protocol version/hash、method component versions | T-072 |
| Fine-tuning 绕过主流程 | Fine-tuning 只能走 `RecipeDraft -> RunRecipe -> TrainingTaskSpec(profile=llm_fine_tuning)` | T-072 + T-073 |
| `RunRecipe` 与平台 adapter 边界不清 | `RunRecipe` 只存能力需求和锁；平台选择在 `MaterializeTrainingTaskSpecRequest.platform_id` | T-073 |
| `EvidenceCandidate` 过薄 | 候选必须带 result/evaluation fact/provenance/validation/quality/risk/reviewer fields；invalid result 不得成为 evidence | T-074 |
| candidate 状态污染 canonical lifecycle | canonical asset lifecycle 不含 `candidate`；candidate review status 单独建模 | T-075 |
| 云 mirror 与 canonical registry 冲突 | 本地 registry 是 canonical metadata + file refs；cloud mirror 只是 execution mirror | T-070 + T-077 |
| evaluation facts 被误用为 leaderboard/claim | Evaluation fact layer 只存可追溯事实，不生成最终 leaderboard/table/claim | T-074 |
| `PaperExperimentSidecar` owner 不清 | Sidecar 只存 refs/locks/hashes/snapshots/event entries，不复制完整 DTO | T-074 |

## Semantic Drift Guard
| Boundary | Guarded wording |
|---|---|
| Dataset identity | `DatasetAsset` MUST NOT own version/checksum/storage/mirror fields. |
| Dataset version | `DatasetVersion` owns immutable version identity, policy snapshot, split/process refs, manifest refs, and checksums. |
| Benchmark identity | `BenchmarkAsset` owns task/testbed identity; it does not own mutable evaluator/protocol rules. |
| Evaluation protocol | `EvaluationProtocol` is versioned/hashable and owns metrics, evaluator, reporting, statistics, comparison, budget, and tuning rules. |
| Recipe path | `RecipeDraft` may be incomplete; only valid `RunRecipe` can materialize a `TrainingTaskSpec`. |
| Platform boundary | `RunRecipe` remains platform-neutral; platform choice and adapter-private metadata stay at materialization/adapter boundary. |
| Evidence boundary | Evidence candidates are validated result-derived artifacts, not claim text or claim acceptance. |
| Paper bridge | Paper project stores sidecar refs/locks/snapshots, not reusable asset DTO copies. |

## Current Repo Closure Check
| Area | Repo evidence | Closure |
|---|---|---|
| Task governance | Parent and child task bundles exist; `T-069` through `T-077` are marked done; next step is `T-078` | Closed through T-077 |
| Shared contracts | `packages/shared/src/research-lifecycle/experiment-foundation-contracts.ts` now contains the T-070 dataset registry subset, T-071 benchmark/protocol/baseline subset, T-072 version-lock/recipe subset, T-073 materialization/adapter-boundary subset, T-074 result/evidence/sidecar subset, and T-075 candidate promotion subset | Partially closed |
| Contract tests | `packages/shared/src/research-lifecycle/experiment-foundation-contracts.schema.test.ts` now covers T-070 through T-075, including forbidden-field alias, platform-private negative cases, materialization traceability, fine-tuning task-profile gates, invalid-result evidence rejection, fact context requirements, sidecar no-copy guards, candidate lifecycle separation, and auto-promotion gates; later product-layer tasks remain pending | Partially closed |
| Persistence/API | T-076 adds generic registry/readiness Prisma models, repo-only migration, refreshed DB context, shared API wrappers, repository/service implementations, REST routes, readiness gates, and candidate promotion persistence | Closed for minimum backend loop |
| Desktop UI | `apps/desktop/src/renderer/literature/shared/constants.ts` still only lists `文献管理`, `选题管理`, `论文管理` | Not closed |
| Execution adapters | T-077 adds ExternalTrainingJob contracts, dedicated job persistence, LocalScript execution, mockable Aliyun PAI-DLC boundary, submit/sync/cancel/collect APIs, readiness/materialization/idempotency gates, and targeted backend tests | Closed for minimum backend loop |
| Evidence/paper integration | T-074 adds shared contracts and T-077 now creates result/validation/metric observation/evidence records from collected outputs; there is still no desktop sidecar workflow | Backend minimum closed; UI not closed |

## Code Quality Review
T-069 是文档和治理收口；T-070/T-071/T-072/T-073/T-074/T-075 已新增 shared contracts 和 schema tests。当前仍未改 Prisma/API/UI、桌面入口、adapter 或运行时文件存储。

Quality signals:
- 变更集中在 `dev-docs/active/experiment-foundation-*` 和治理派生视图，符合本轮任务边界。
- 母包语义已统一到审查报告要求：asset identity、version locks、materialization boundary、candidate lifecycle、fact/evidence/paper sidecar 分工保持一致。
- T-071 post-review fix has closed the known alias-drift gaps where `BaselineAsset` accepted protocol fields and `BenchmarkAsset` accepted baseline implementation version fields.
- T-072 closes the first-class version-lock and platform-neutral `RecipeDraft -> RunRecipe` contract path, including fine-tuning lock refs without owning `FineTuningTaskProfile`.
- T-073 freezes the `RunRecipe -> TrainingTaskSpec` materialization boundary and keeps adapter-private payloads behind refs/hashes; post-review fixes now also enforce valid platform/adapter pairs, blocked materialization semantics, and hash-bearing task hooks.
- T-074 freezes the materialized-output-to-evidence bridge: result packets, validation reports, facts/observations, implementation decision signals, paper-table fact sets, evidence candidates, and paper sidecars now reject claim/table/leaderboard/DTO-copy drift.
- T-075 freezes literature/manual candidate promotion contracts: candidate support checks, triage, promotion requests/results, auto-promotion eligibility, canonical lifecycle guards, DTO alias leakage guards, and promoted canonical ref completeness now have shared schema coverage.
- T-076 closes the minimum product backend loop: persisted registry payloads with indexed metadata, readiness reports, service-side schema validation, candidate promotion persistence, and REST routes now exist without storing raw data or adapter-private payloads.
- T-077 closes the minimum execution backend loop: LocalScript smoke execution, mocked Aliyun mirror/policy gates, external job runtime persistence, events, cancellation, partial refs, result validation, and evidence candidate creation now exist without real cloud SDK credentials.
- 剩余功能风险不是 T-077 代码缺陷，而是后续尚未实现：需要从 `T-078` 开始进入 desktop UI，并在后续 hardening 中接入真实云 SDK/凭证策略。

Required next quality gate:
- `T-078` 必须消费 T-076 registry/readiness API、T-077 execution job/result/evidence API 和 shared contracts，不得在 renderer 重新实现 persistence、adapter execution、readiness 或 result validation semantics。
- T-078 不得复活 legacy CSS；desktop UI 必须走 data-ui/token governance。

## Functional Closure Result
当前功能需求已完成最小后端闭环，但尚未完成用户可操作的端到端实验执行闭环。

已经闭环的是“实验基座设计审查吸收、任务包拆分、职责边界和执行顺序”，T-070 dataset registry、T-071 benchmark/protocol/baseline、T-072 version-lock/recipe、T-073 materialization/adapter-boundary、T-074 result/evidence/sidecar、T-075 candidate promotion 合同，T-076 persistence/API/readiness 最小闭环，以及 T-077 execution adapters 最小闭环。尚未闭环的是用户可操作桌面体验：paper bridge UI 和桌面 `实验基座` workbench 仍未完成，真实 Aliyun SDK/凭证接入也应作为后续 hardening 小包处理。因此主线应继续进入 `T-078 experiment-foundation-desktop-workbench`。
