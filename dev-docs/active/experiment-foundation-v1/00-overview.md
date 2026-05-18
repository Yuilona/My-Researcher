# 00 Overview

## Status
- State: planned
- Next step: 开始 `T-078 experiment-foundation-desktop-workbench`，消费 T-076 registry/readiness API、T-077 execution job/result/evidence APIs 和 shared contracts 落地桌面实验基座工作台。

## Parent / Child Task Model
- This package is the parent package for experiment-foundation V1.
- Child packages are active task bundles under `dev-docs/active/experiment-foundation-*`.
- The parent owns the V1 goal, bounded-context narrative, cross-child coverage, and final completeness review.
- Child packages own executable design/implementation slices with explicit boundaries.
- Project governance has no native parent-child edge, so child packages identify this parent through task docs and keywords while mapping to `R-012`.
- Mother-package closure evidence is tracked in `07-quality-closure-review.md`.

## Child Task Index
| Child task | Owns | Must close before |
|---|---|---|
| `experiment-foundation-design-review-sync` | review-report incorporation, S1-A/S1-B split, coverage matrix | all implementation children |
| `experiment-foundation-dataset-registry-contracts` | DatasetAsset / DatasetVersion / storage refs / mirror contracts | version locks, persistence, adapters |
| `experiment-foundation-benchmark-protocol-contracts` | BenchmarkAsset / EvaluationProtocol / BaselineAsset contracts | version locks, result validation |
| `experiment-foundation-version-lock-recipe-contracts` | version locks, RecipeDraft, RunRecipe, method/fine-tuning recipe path | materialization, persistence, sidecar |
| `experiment-foundation-materialization-adapter-contracts` | TrainingTaskSpec, materialization result, adapter metadata boundary | execution adapters |
| `experiment-foundation-result-evidence-sidecar-contracts` | result validation, evaluation facts, EvidenceCandidate, PaperExperimentSidecar | paper bridge UI and evidence views |
| `experiment-foundation-candidate-promotion-contracts` | literature/manual asset candidates and promotion gates | candidate API/import |
| `experiment-foundation-persistence-api-readiness` | DB SSOT, repositories, services, REST, readiness gates | adapters and UI |
| `experiment-foundation-execution-adapters` | LocalScript and Aliyun PAI-DLC execution pipeline | desktop operational job/result views |
| `experiment-foundation-desktop-workbench` | desktop `实验基座` workbench | final V1 user-facing validation |

## Goal
- 新增 `experiment-foundation`（实验基座）模块，以可复用 dataset、benchmark、baseline、evaluation protocol、run recipe 和外部训练平台控制管道支撑论文实施阶段，减少重复准备数据、复现 baseline 和提交训练任务的成本。

## Non-goals
- 不把实验基座做成 `literature` 的内部子模型；文献管理只提供候选发现和证据来源。
- 不重写现有 `research-argument` 的 `baseline_set`、readiness 或 bridge 合同。
- 不自建训练平台、GPU 调度器、容器编排系统或远程 runner；训练计算由外部训练平台或现有基础设施执行。
- 不把数据本体写入 repo 或数据库 blob；本地实验资产注册中心只管理路径引用、远程引用、校验、协议和访问状态。
- 不把云端 OSS / PAI Dataset 副本作为 canonical 数据源；云端副本只作为执行镜像。
- 不允许 LLM 生成未经运行/证据支持的实验结果。
- 不提供自动调参/自动超参搜索系统；只支持人/LLM 在回路的可追溯调参流程。

## Context
- 当前文献管理已经形成 collection/import、scope、content asset、key-content extraction、embedding/retrieval 等可复用模式。
- 文献 key content 已包含 `datasets_and_benchmarks`、`experiments`、`reproducibility`、`claim_evidence_map` 等可作为候选资产来源的结构化信息。
- `research-argument` 已存在 `baseline_set`、`baseline_set_ids`、protocol/baseline/repro readiness 等语义。
- lifecycle core 已存在 `dataset_protocol_hash` 和 `evaluation_protocol_hash`，说明数据/评测协议需要参与快照兼容性。
- 用户希望在桌面 UI 中把“实验基座”放到“文献管理”下方，并先通过任务包和 roadmap 对齐决策点。

## Canonical scope
- User-facing module label: `实验基座`
- Canonical domain name: `experiment-foundation`
- Layer 1 - reusable asset layer:
  - `DatasetAsset`
  - `DatasetVersion`
  - `DatasetLocation`
  - `DatasetMirror`
  - `ChecksumManifest`
  - `SplitProtocol`
  - `DataProcessingRecipe`
  - `DataPolicy`
  - `BenchmarkAsset`
  - `BaselineAsset`
  - `BaselineImplementationVersion`
  - `BaseModelAsset`
  - `FineTuningDatasetAsset`
- Layer 2 - method recipe layer:
  - `TrainingStrategy`
  - `InferenceStrategy`
  - `OptimizerPreset`
  - `ArchitectureTemplate`
  - `MethodRecipeComponent`
  - `ExperimentHypothesis`
  - `HyperparameterSpace`
  - `AblationPlan`
  - `FineTuningStrategy`
  - `RecipeDraft`
  - `RunRecipe`
  - `ExperimentFoundationVersionLock`
  - `TuningSession`
  - `TuningProposal`
  - `TuningDecision`
  - `TuningTrial`
- Layer 3 - evaluation layer:
  - `MetricDefinition`
  - `EvaluationProtocol`
  - `TestSuite`
  - `StatisticalProtocol`
  - `ReportingProtocol`
  - `ComparisonPolicy`
  - `EvaluationFact`
  - `MetricObservation`
  - `ComparisonObservation`
  - `ImplementationDecisionSignal`
  - `PaperTableFactSet`
- Layer 4 - external execution control layer:
  - `ExecutionPlatform`
  - `TrainingTaskSpec`
  - `FineTuningTaskProfile`
  - `TrainingTaskMaterializationResult`
  - `ExternalTrainingJob`
  - `ExperimentResult`
  - `FineTuningResult`
  - `EvidenceCandidate`
  - `PaperExperimentSidecar`
- Adjacent but not owned by this module:
  - `LiteratureRecord`: source/candidate/provenance owner
  - `ResearchArgumentWorkspace`: consumes selected asset refs
  - `PaperProject`: consumes downstream refs and evidence artifacts
  - External training platform: owns resource scheduling, container/runtime execution, GPU allocation, low-level retry, and platform-native logs

## Confirmed storage decision
- `DP-02` is fixed as: local canonical registry + local file refs + optional cloud execution mirror.
- Local registry is the single source of truth for dataset metadata, versions, checksums, split protocols, processing recipes, and access policies.
- Local data files live under configured data roots, not inside the repo and not inside database blobs.
- Cloud locations such as Aliyun OSS or PAI Dataset are execution mirrors created for a run or reused after checksum validation.
- Cloud mirrors MUST NOT overwrite local canonical metadata without explicit review.

## Confirmed UI label decision
- `DP-01` is fixed as: the user-facing desktop UI label is `实验基座`.
- The UI entry MUST be placed below “文献管理”.
- The canonical backend/shared domain remains `experiment-foundation`; UI placement MUST NOT make it a `literature` submodule.

## Confirmed baseline and benchmark decision
- `DP-04` is fixed as: baseline and benchmark are separate reusable assets with separate usage scenarios and verification ladders.
- `BaselineAsset` answers “和谁比”: reusable method/model/implementation/reproduction recipe used as a comparison target.
- `BenchmarkAsset` answers “怎么比”: task, dataset/split, metrics, evaluator, reporting protocol, and comparison policy that make multiple methods comparable.
- A full benchmark run is not required for baseline catalog entry.
- `BaselineAsset + BenchmarkAsset + DatasetAsset + RunRecipe + ExperimentResult` together form comparable evidence.
- Baseline catalog entry SHOULD require `metadata_complete + reachable`.
- Benchmark catalog entry SHOULD require `protocol_complete + assets_reachable`.
- Actual run recipe SHOULD require baseline `smoke_verified` and benchmark `evaluator_smoke_verified`.
- Formal comparison SHOULD require baseline `protocol_compatible` and benchmark `reproducible_protocol`.
- Paper-grade strong evidence SHOULD require baseline `benchmark_verified`, benchmark `comparison_certified`, and a valid result packet.

## Confirmed RunRecipe decision
- `DP-05` is fixed as: V1 uses a materializable recipe model, not a loose static config and not a platform-specific executable script.
- `RecipeDraft` is the editable planning layer; it MAY be incomplete and MUST NOT be submitted to a platform.
- `RunRecipe` is the locked experiment plan; it MUST lock asset refs, versions, method params, evaluation protocol, readiness result, and traceability refs while staying platform-neutral.
- `TrainingTaskSpec` is the materialized execution payload generated from a valid `RunRecipe` plus `MaterializeTrainingTaskSpecRequest.platform_id`.
- Platform-private fields MUST stay in adapter metadata, not in `RunRecipe`.

## Confirmed PaperProject integration decision
- `DP-06` is fixed as: `paper-project` consumes experiment trace refs through `PaperExperimentSidecar`; it MUST NOT copy reusable asset DTOs into the paper-project core model.
- `PaperExperimentSidecar` MUST preserve a trace chain from paper project to evidence candidate, result, external job, task spec, run recipe, asset versions, and source refs.
- The sidecar MUST store frozen refs, version locks, hashes, provenance refs, event log entries, and status snapshots.
- Asset canonical metadata remains owned by `experiment-foundation`; paper-project owns the attachment of trace refs to the paper lifecycle.
- Later expansion of core `CreatePaperProjectRequest` is a separate decision and MUST NOT be implied by V1.

## Confirmed method recipe and tuning decision
- `DP-09` is fixed as: V1 supports reusable method recipes plus human/LLM-in-the-loop tuning sessions; it does not provide automatic hyperparameter optimization.
- `TrainingStrategy`, `InferenceStrategy`, `OptimizerPreset`, `HyperparameterSpace`, `AblationPlan`, and `FineTuningStrategy` are reusable recipe inputs.
- `TuningSession` links paper implementation work with tuning proposals, decisions, run recipes, results, and evidence candidates.
- `TuningProposal` MAY be created by a human, LLM, or system rule, but it MUST be recorded with rationale, changed params, constraints, and source/result refs.
- A proposal MUST NOT directly submit training; accepted `TuningDecision` plus readiness checks are required before a new `RecipeDraft` / `RunRecipe` / `TrainingTaskSpec` path.
- LLM-in-the-loop means proposal and analysis assistance with traceable decision records, not unattended parameter search.

## Confirmed evaluation fact-layer decision
- `DP-10` is fixed as: V1 includes a structured evaluation fact layer that supports later paper tables and implementation decisions, but does not build a full leaderboard.
- `MetricDefinition`, `EvaluationProtocol`, `ComparisonPolicy`, and `ResultValidationReport` define whether a result is valid and comparable.
- `EvaluationFact`, `MetricObservation`, and `ComparisonObservation` record table-ready factual data with run/result/protocol/asset context.
- `ImplementationDecisionSignal` records whether an iteration appears valuable, needs adjustment, needs rerun, or should be abandoned, with factual rationale.
- `PaperTableFactSet` groups validated facts for later paper-table generation, but it is not a final paper table renderer.
- Evaluation facts are evidence inputs; they MUST NOT become paper claims without downstream claim-evidence review.

## Confirmed implementation slices
- `S1` shared contracts + schema tests: freeze DTOs, enums, JSON schemas, exports, and negative boundary tests.
- `S2` persistence + repository/service skeleton: add durable storage only through DB SSOT and expose domain DTO repositories/services.
- `S3` asset CRUD/search/readiness API: register, search, inspect, update, and validate dataset/baseline/benchmark/protocol assets.
- `S4` literature-to-asset candidate flow: import literature key-content signals into grounded asset candidates with deterministic triage.
- `S5` recipe/tuning/evaluation fact services: operate `RecipeDraft`, `RunRecipe`, tuning sessions, result validation, structured facts, and decision signals.
- `S6` `PaperExperimentSidecar` bridge: attach frozen trace refs from experiment foundation into paper-project without copying asset DTOs.
- `S7` local execution control pipeline: implement `LocalScriptAdapter` and validate `Resolve -> Validate -> Materialize -> Submit -> Monitor -> Collect -> Validate Result` locally.
- `S8` Aliyun PAI-DLC execution adapter: implement OSS/PAI Dataset mirror handling and Aliyun PAI-DLC submit/monitor/collect path.
- `S9` desktop “实验基座” workbench: add the UI entry below “文献管理” and expose asset, readiness, recipe, job, result, fact, and sidecar workflows.
- Each slice MUST keep its own verification entry in `04-verification.md`.

## Acceptance criteria (high level)
- [x] `dev-docs/active/experiment-foundation-v1/` 包含 `roadmap + 00~05 + .ai-task.yaml`。
- [x] 模块命名和边界通过决策点确认，不回退为“论文管理”大桶。
- [ ] V1 contracts 定义 reusable assets、candidate provenance、readiness report 和 run recipe。
- [ ] V1 contracts 显式区分固定可复用资产、可参数化方法配方、评估协议和外部执行控制面。
- [ ] 后端可登记、检索、查看、更新、校验 dataset/baseline/benchmark/protocol 资产。
- [ ] V1 contracts 显式区分 baseline 的“被比较对象”语义和 benchmark 的“比较协议”语义。
- [ ] 数据资产支持 local canonical registry、local file refs、optional cloud mirror refs 和 checksum validation。
- [ ] 常见训练/推理策略、优化器 preset、模型结构模板、实验假设、超参空间和消融计划能作为 `RunRecipe` 的可组合输入。
- [ ] 人/LLM 在回路的调参流程能记录 tuning session、proposal、decision、trial、result 和 evidence candidate 的联动关系。
- [ ] V1 contracts 支持 `RecipeDraft -> RunRecipe -> TrainingTaskSpec` 三层流转，且 `RunRecipe` 不携带平台私有字段。
- [ ] 评估事实层能结构化记录 metric observations、comparison observations、decision signals 和 paper-table-ready fact sets。
- [ ] 实施阶段能基于事实层判断是否继续、调整、重跑或放弃某个实验方向。
- [ ] 大模型微调作为一等场景建模，支持 base model、fine-tuning dataset、fine-tuning strategy、fine-tuning task spec、fine-tuning result 和专项 readiness gate。
- [ ] 文献 key-content 可生成资产候选；低风险完整候选可由规则自动晋升，高风险或信息缺失候选才升级人工审查。
- [ ] Research-argument/paper-project 只消费 asset refs 或 sidecar refs，不复制资产详情。
- [ ] `PaperExperimentSidecar` 能回答 paper 使用了哪些 recipe、result、evidence、dataset/baseline/benchmark/protocol 版本和 hash。
- [ ] Desktop UI 在“文献管理”下方提供实验基座入口，且不新增 legacy CSS 依赖。
- [ ] Readiness checks 能阻断缺 license、缺 version/hash、缺 split/protocol、缺 baseline entrypoint 的实施准备。
- [ ] 实验基座固定 `Resolve -> Validate -> Materialize -> Submit -> Monitor -> Collect -> Validate Result` 管道。
- [ ] 训练任务通过平台适配器提交到外部训练平台，并能同步状态、收集结果和生成 evidence candidate。
- [ ] 阿里云场景中，训练任务通过 OSS/PAI Dataset 执行镜像供 PAI-DLC 使用，结果从 OSS/平台 artifact 回收到本地 `ExperimentResult`。
- [ ] 大模型微调任务通过 specialized `TrainingTaskSpec` profile 提交外部训练平台，结果先进入 `FineTuningResult` / `EvidenceCandidate`，不直接生成论文 claim。
- [ ] 相关 typecheck/tests/governance lint 通过，docs/context 更新完成。
