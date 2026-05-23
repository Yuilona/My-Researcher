# 00 Overview

## Status
- State: planned
- Next step: run `T-090 experiment-foundation-capability-validation` to prove the T-070~T-078 minimum chain through scenario-level automation, external-boundary, and adjacent-flow robustness tests. Keep T-043 open only as the parent closure/backlog umbrella.

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
- This section records the full conceptual scope agreed during planning. The repo implementation currently closed by `T-070` through `T-078` is the minimum operational chain documented in the acceptance section below.
- Objects that are named here but not implemented by the minimum chain, such as first-class tuning sessions or full base-model/fine-tuning-dataset registries, are follow-up scope. They must not be silently reintroduced inside desktop UI, research-argument, paper-project, or literature modules.

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
### Minimum V1 operational chain closed by T-070 through T-078
- [x] `dev-docs/active/experiment-foundation-v1/` contains `roadmap + 00~07 + .ai-task.yaml`.
- [x] Module naming and boundaries are confirmed; `experiment-foundation` remains independent from literature/research-argument/paper-project buckets.
- [x] Shared contracts define the closed minimum surface for reusable dataset/benchmark/baseline/protocol assets, candidate provenance, readiness reports, version locks, `RecipeDraft`, `RunRecipe`, materialization, execution jobs, results, evidence, and sidecars.
- [x] Contracts separate reusable assets, method recipe components, evaluation protocol/facts, and external execution control.
- [x] Contracts separate baseline as comparison target from benchmark/evaluation protocol as comparison rules.
- [x] Dataset contracts support local canonical registry refs, local file refs, optional execution mirrors, checksum manifests, split protocols, and data policies.
- [x] `RecipeDraft -> RunRecipe -> TrainingTaskSpec` is modeled, with `RunRecipe` locked and platform-neutral.
- [x] Evaluation facts can record metric observations, comparison observations, decision signals, and paper-table fact sets without becoming claims or leaderboards.
- [x] Fine-tuning cannot bypass the main path; it flows through fine-tuning external lock refs, `RunRecipe`, `TrainingTaskSpec(profile_kind = llm_fine_tuning)`, `FineTuningResult`, and eligible `EvidenceCandidate`.
- [x] Candidate contracts and backend promotion persistence keep candidate lifecycle separate from canonical asset lifecycle.
- [x] Generic registry/readiness APIs can create, list, read, upsert, and readiness-check frozen DTO payloads for dataset/baseline/benchmark/protocol and related records.
- [x] External training jobs are owned by the T-077 execution table/API only; registry records can reference jobs but cannot create a parallel job state.
- [x] `PaperExperimentSidecar` stores refs, locks, hashes, snapshots, and event refs instead of copying reusable asset DTOs.
- [x] Desktop UI appears below “文献管理”, uses data-ui/token-governed styling, and does not recreate legacy CSS.
- [x] Readiness checks block key minimum cases such as missing hashes, non-ready dataset versions, stale mirrors, incomplete locks, invalid result states, and candidate promotion ineligibility.
- [x] LocalScript execution proves the minimum `Validate -> Submit -> Monitor -> Collect -> Validate Result` backend path; Aliyun PAI-DLC is implemented as a mockable SDK-free boundary with mirror/policy gates.
- [x] Training jobs can be submitted/synced/cancelled/collected through the T-077 execution API and can create result/validation/evidence records.
- [x] Typecheck/tests/governance lint and DB context refresh were run for the landed slices; live DB migration application remains out of scope.

### Explicit follow-up scope, not closed by the minimum chain
- [ ] Dedicated typed CRUD/search UX and typed backend endpoints beyond the generic JSON registry.
- [ ] Literature key-content extraction/import service that creates asset candidates automatically from papers.
- [ ] Actual canonical asset creation/synthesis from promotion results; current promotion persists decisions and requires existing canonical refs.
- [ ] First-class `TuningSession`, `TuningProposal`, `TuningDecision`, and `TuningTrial` product workflow.
- [ ] Full `BaseModelAsset` and `FineTuningDatasetAsset` registry behavior; current V1 models fine-tuning through locks, task profiles, candidates, and dataset usage.
- [ ] Dedicated recipe-generation and materialization-generation services; current desktop writes already-frozen payloads through registry upsert.
- [ ] Dedicated paper-project bridge UI/API that attaches `PaperExperimentSidecar` refs into paper-project workflow.
- [ ] Real Aliyun SDK/credential hardening and production cloud submission; current Aliyun path is a credential-free mockable adapter boundary.
- [ ] Applying generated migrations to a live development database and running full DB-backed smoke tests.

### Follow-up validation package
- `T-090 experiment-foundation-capability-validation` owns the deep functional test pass for the closed minimum chain. It must validate automation, external interactions, and cross-flow robustness without expanding product semantics.
