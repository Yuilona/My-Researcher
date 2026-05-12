# Experiment Foundation V1 - Roadmap

## Goal
- 建立一个位于桌面信息架构中“文献管理”下方的 `experiment-foundation` 模块，用可复用的 dataset、benchmark、baseline、evaluation protocol、run recipe 与外部训练平台控制管道支撑论文实施阶段。

## Consensus capability model
```text
experiment-foundation
  = reusable asset layer
  + method recipe layer
  + evaluation layer
  + external execution control layer
```

- 固定可复用资产可以直接被引用或使用，例如 dataset、benchmark、baseline、reproduction recipe、model artifact、data processing recipe。
- 常见训练/推理策略、优化器、实验假设、模型结构、超参空间、消融计划和大模型微调策略是可参数化方法配方；它们先进入 `RecipeDraft`，再固化为平台中立的 `RunRecipe`，最后按平台 materialize 为 `TrainingTaskSpec`。
- 评估层负责指标、测试协议、统计协议、报告协议和公平比较策略，并决定结果是否可比较、可发布、可进入证据候选。
- 工程执行层不自建训练平台，而是通过固定控制管道对接外部训练平台。

## Planning-mode context and merge policy
- Runtime mode signal: Default
- User confirmation when signal is unknown: not-needed
- Host plan artifact path(s): (none)
- Requirements baseline: latest user-confirmed discussion in this thread
- Merge method: set-union
- Conflict precedence: latest user-confirmed > requirement.md > host plan artifact > model inference
- Repository SSOT output: `dev-docs/active/experiment-foundation-v1/roadmap.md`
- Mode fallback used: non-Plan default applied: yes

## Input sources and usage
| Source | Path/reference | Used for | Trust level | Notes |
|---|---|---|---|---|
| User-confirmed instructions | chat | module goal, placement, reuse target, roadmap-first workflow | highest | 用户明确要求新增“实验基座”模块，放到“文献管理”下方，并先建立完整任务包 |
| Existing literature contracts | `packages/shared/src/research-lifecycle/literature-contracts.ts` | reuse pattern: asset import, processing state, key-content extraction, retrieval profile | high | 文献管理可作为模式参考，但不能成为 dataset/baseline 的所有者 |
| Existing research-argument contracts | `packages/shared/src/research-lifecycle/research-argument-domain-contracts.ts` and bridge/read-model contracts | baseline/protocol readiness and downstream handoff compatibility | high | 已存在 `baseline_set`、`baseline_set_ids`、protocol readiness 等语义，需要避免重复建模 |
| Existing governance contracts | `packages/shared/src/research-lifecycle/research-lifecycle-core-contracts.ts` | snapshot compatibility fields | high | 已存在 `dataset_protocol_hash`、`evaluation_protocol_hash`，新模块应产出这些兼容性输入 |
| Project overview | `docs/project/overview/START-HERE.md` | canonical naming and bounded-context guardrails | high | 旧“论文管理”不是 canonical 模块名 |
| Model inference | N/A | fill gaps only | lowest | 仅用于形成 staged roadmap 和风险拆解 |

## Non-goals
- 不把 `experiment-foundation` 混入 `literature` bounded context；文献只负责发现和证据来源。
- 不重写现有 `research-argument` 的 `baseline_set`、readiness 或 bridge 语义。
- 不自建训练平台、GPU 调度器、容器编排系统或远程 runner；训练和推理计算由外部训练平台或现有基础设施执行。
- 不自建 LLMOps 平台；大模型微调作为 specialized training profile 通过外部训练平台执行。
- 不把数据本体写入 repo 或数据库 blob；V1 管理本地路径、远程引用、访问状态、校验信息和协议引用。
- 不把 OSS / PAI Dataset 等云端副本作为 canonical 数据源；云端副本只作为执行镜像。
- 不生成或伪造实验结果；结果只能来自显式的 run/evidence 记录。

## Open questions and assumptions
### Open questions (answer before implementation)
- Q1: [confirmed] `experiment-foundation` 的中文 UI 名称固定为“实验基座”。
- Q2: [confirmed] V1 storage scope is local canonical registry + local file refs + optional cloud execution mirror.
- Q3: [confirmed] Baseline/benchmark usage and verification are separated; full benchmark reproduction is not required for baseline catalog entry.
- Q4: [confirmed] `paper-project` consumes experiment trace through `PaperExperimentSidecar`; no reusable asset DTO expansion in core paper-project contracts in V1.
- Q5: [confirmed] First adapter scope is `LocalScriptAdapter + AliyunPaiDlcAdapter`; no `CustomHttpAdapter` in V1.
- Q6: [confirmed] External result collection contract is metrics, artifacts, logs, config snapshot, and validation report.
- Q7: [confirmed] LLM fine-tuning V1 is a specialized `TrainingTaskSpec` profile, not an in-repo LLMOps platform.
- Q8: [confirmed] RunRecipe depth uses `RecipeDraft -> RunRecipe -> TrainingTaskSpec`; `RunRecipe` is locked and platform-neutral.
- Q9: [confirmed] Method recipe V1 supports human/LLM-in-loop tuning sessions, but not automatic hyperparameter optimization.
- Q10: [confirmed] Evaluation V1 includes a structured fact layer for paper-table support and implementation judgement, but not a complete leaderboard.

### Assumptions (if unanswered)
- A1: V1 以本地 canonical registry 为准，远程引用和云端 OSS/PAI Dataset 只作为 location/mirror refs。（risk: low）
- A2: V1 uses tiered verification: baseline catalog entry requires `metadata_complete + reachable`; benchmark catalog entry requires `protocol_complete + assets_reachable`; executable recipes require smoke/evaluator smoke; paper-grade evidence requires full benchmark/comparison certification.（risk: low）
- A3: UI 信息架构上放在“文献管理”下方，但 domain owner 是 `experiment-foundation`，不是 `literature` 子模型。（risk: low）
- A4: `research-argument` 的 `baseline_set` 继续作为项目级选择集合；`paper-project` 通过 `PaperExperimentSidecar` 绑定冻结追溯引用，不复制资产详情。（risk: low）
- A5: V1 的执行工程层是控制面，不是训练平台；先固定 `Resolve -> Validate -> Materialize -> Submit -> Monitor -> Collect -> Validate Result` 管道。（risk: low）
- A6: 平台私有字段默认进入 adapter metadata，不进入核心 shared contracts。（risk: medium）
- A7: 大模型微调作为 specialized `TrainingTaskSpec` profile，不作为单独平台，也不直接产生论文 claim。（risk: low）
- A8: `RecipeDraft` 可不完整且可编辑；`RunRecipe` 锁定 refs/versions/params/protocol/readiness；`TrainingTaskSpec` 才进入平台提交边界。（risk: low）
- A9: 调参通过 `TuningSession -> TuningProposal -> TuningDecision -> TuningTrial` 记录并联动论文实施；提案可由 human/LLM/system 产生，但不能绕过 decision/readiness 直接执行。（risk: low）
- A10: 评估事实层记录 metric/comparison/decision/table-ready facts；facts 支撑后续论文表格和实施判断，但不自动生成 leaderboard 或最终论文表格。（risk: low）

## Merge decisions and conflict log
| ID | Topic | Conflicting inputs | Chosen decision | Precedence reason | Follow-up |
|---|---|---|---|---|---|
| D1 | Module ownership | UI placement under Literature vs canonical domain separation | UI 标签固定为“实验基座”，位于“文献管理”下方；代码和合同上独立为 `experiment-foundation` | 用户已确认 UI label 和 placement，项目术语要求 bounded context 精确 | Phase 1 固定 nav label 与 domain naming |
| D2 | Baseline modeling | Existing `research-argument.baseline_set` vs reusable baseline assets | 新模块提供 reusable `BaselineAsset`，`baseline_set` 只引用资产 ids | 避免语义漂移和重复所有权 | Phase 1 合同中显式写入 |
| D3 | Implementation depth | Reuse target vs full experiment execution | V1 先做可登记、可检索、可绑定、可生成 RunRecipe；执行器作为后续扩展 | 降低 V1 风险，先建立复用基座 | Phase 3 readiness check 决定 runner 门槛 |
| D4 | Data handling | Reusable dataset vs restricted raw files | 管理引用、协议、校验和访问状态，不把受限原始数据变成共享内容 | 本地优先和数据合规约束 | Phase 2 数据/存储设计 |
| D5 | Training execution ownership | Self-built training platform vs external platform control plane | `experiment-foundation` 只做控制面和证据管道，训练平台负责计算执行 | 用户已确认项目不用自己搭训练平台 | Phase 4/5 固定 execution contracts |
| D6 | Method recipe semantics | Directly reusable method result vs parameterized recipe | 训练/推理策略、优化器、架构模板、实验假设、超参空间、消融计划都作为 `RunRecipe` 的可组合输入 | 前序讨论确认这些属于可调参实现层 | Phase 1 contracts |
| D7 | Evaluation layer semantics | Metrics as loose fields vs first-class protocol objects | metric/test/statistical/reporting/comparison policies 都进入 evaluation layer | 评估公平性和 reviewer 风险必须显式建模 | Phase 1 contracts |
| D8 | LLM fine-tuning semantics | Separate LLMOps platform vs specialized training profile | 大模型微调作为 specialized `TrainingTaskSpec` profile，仍通过外部训练平台执行 | 用户确认训练可能涉及大模型微调 | Phase 1 and Phase 5 contracts |
| D9 | Storage scope | local-only vs cloud canonical vs local canonical + cloud mirror | 本地为 canonical registry，云端只作 execution mirror | 用户确认数据存本地，且需要支持阿里云训练 | Phase 1/2 storage contracts |
| D10 | First platform adapter | Local only vs CustomHttp vs Aliyun first | V1 做 `LocalScriptAdapter` + `AliyunPaiDlcAdapter`，不做 `CustomHttpAdapter` | 用户确认按建议执行，先不做 CustomHttpAdapter | Phase 5 adapter implementation |
| D11 | Result collection contract | loose files vs structured evidence packet | 固定为 metrics + artifacts + logs + config snapshot + validation report | 用户确认按建议执行 | Phase 5 result collection |
| D12 | Baseline vs benchmark semantics | baseline entry requires full benchmark vs independent tiered verification | baseline 是被比较实现，benchmark 是比较协议；二者分层验证，full benchmark 只作为论文强证据门槛 | 用户确认该划分 | Phase 1/2 readiness contracts |
| D13 | RunRecipe depth | loose static config vs platform-specific script vs materializable recipe | 使用 `RecipeDraft -> RunRecipe -> TrainingTaskSpec`；`RunRecipe` 锁定且平台中立 | 用户确认按建议执行 | Phase 2/4 contracts and materialization |
| D14 | PaperProject traceability | copy experiment DTOs into paper-project vs sidecar refs | 使用 `PaperExperimentSidecar` 保存冻结 refs、version locks、hashes、provenance、event log、status snapshots | 用户确认可按共识落稿 | Phase 4 bridge contracts |
| D15 | Method tuning scope | automatic tuning vs human/LLM-in-loop tuning | 支持 `TuningSession/TuningProposal/TuningDecision/TuningTrial`，不做自动调参系统 | 用户明确要求 | Phase 2/4/5 recipe and result binding |
| D16 | Evaluation fact layer | loose metrics vs leaderboard vs structured facts | 支持 `EvaluationFact/MetricObservation/ComparisonObservation/ImplementationDecisionSignal/PaperTableFactSet`，不做完整 leaderboard | 用户明确要求 | Phase 2/5 result validation and table support |

## Scope and impact
- Affected areas/modules:
  - shared contracts under `packages/shared/src/research-lifecycle/`
  - backend routes/services/repositories under `apps/backend/src/`
  - desktop renderer navigation and workbench under `apps/desktop/src/renderer/`
  - Prisma schema/migrations if persisted asset models are added
  - context docs under `docs/context/`
- External interfaces/APIs:
  - New `experiment-foundation` REST surface for assets, protocols, readiness checks, and recipe generation
  - New method recipe surfaces for strategy/preset/template/hypothesis/search-space/ablation records
  - New fine-tuning surfaces for base model, fine-tuning dataset, fine-tuning strategy, fine-tuning task spec, and fine-tuning result records
  - New evaluation surfaces for metrics/test/statistical/reporting/comparison protocol records
  - New platform-adapter-facing surface for training task submission, status sync, result collection, and cancellation
  - V1 adapter implementations limited to `LocalScriptAdapter` and `AliyunPaiDlcAdapter`
  - Result collection contract requires metrics, artifacts, logs, config snapshot, and validation report
  - Integration refs consumed by `research-argument` and `paper-project`
- Data/storage impact:
  - New persisted records for dataset/benchmark/baseline/evaluation protocol/run recipe
  - New persisted records for dataset versions, locations, mirrors, checksum manifests, split protocols, processing recipes, and data policies
  - New persisted records for execution platform refs, training task specs, external jobs, and experiment results if execution tracking is enabled
  - Storage roots for local asset pointers and generated recipe artifacts
  - Optional cloud execution mirrors for Aliyun OSS / PAI Dataset
  - No raw restricted dataset copying by default, and no raw data in git or database blobs
- Backward compatibility:
  - Existing literature and research-argument contracts remain compatible
  - Existing `paper-project` creation flow should only receive refs/sidecar links unless explicitly expanded in a later decision

## Consistency baseline for dual artifacts (if applicable)
- [x] Goal is semantically aligned with user request
- [x] Boundaries/non-goals are aligned with existing canonical module split
- [x] Constraints are aligned with local-first and no-fabricated-results rules
- [x] Milestones/phases ordering is aligned with roadmap-first execution
- [x] Acceptance criteria are aligned with reusable implementation support
- Intentional divergences:
  - The user-facing placement may be under “文献管理”, but the canonical backend/shared domain should remain independent.

## Project structure change preview (may be empty)
This section is a non-binding, early hypothesis to help confirm expected project-structure impact.

### Existing areas likely to change (may be empty)
- Modify:
  - `packages/shared/src/research-lifecycle/`
  - `apps/backend/src/routes/`
  - `apps/backend/src/controllers/`
  - `apps/backend/src/services/`
  - `apps/backend/src/repositories/`
  - `apps/desktop/src/renderer/`
  - `docs/context/`
  - `prisma/`
- Delete:
  - (none)
- Move/Rename:
  - (none)

### New additions (landing points) (may be empty)
- New module(s) (preferred):
  - `experiment-foundation` contracts
  - `experiment-foundation` backend service/repository
  - `experiment-foundation` platform adapter boundary
  - `experiment-foundation` desktop workbench
- New interface(s)/API(s) (when relevant):
  - dataset asset CRUD/search
  - benchmark asset CRUD/search
  - baseline asset CRUD/search
  - evaluation protocol CRUD/search
  - run recipe generation
  - asset readiness check
  - literature-derived candidate import
  - training task materialization
  - external job submit/sync/collect/cancel
  - result validation and evidence candidate creation
- New file(s) (optional):
  - `<TBD after architecture decision>`

## Phases
1. **Phase 0: Discovery and semantic freeze**
   - Deliverable: confirmed vocabulary, ownership map, and conflict-free integration points.
   - Acceptance criteria: `experiment-foundation` is defined as an independent bounded context with explicit links to literature and research-argument.
2. **Phase 1: Contracts and data model**
   - Deliverable: shared contracts for reusable assets, method recipes, evaluation protocols, statuses, source refs, readiness reports, and run recipes.
   - Acceptance criteria: contract tests prove schema validity and no overlap with existing `baseline_set` semantics.
3. **Phase 2: Persistence and backend API**
   - Deliverable: repository/service/routes for asset registration, search, update, link, and readiness checks.
   - Acceptance criteria: backend tests cover create/search/link/readiness failure modes.
4. **Phase 3: Literature-to-asset candidate flow**
   - Deliverable: ability to turn literature key-content signals into dataset/baseline/benchmark candidates with provenance.
   - Acceptance criteria: candidates preserve source refs; low-risk complete candidates can auto-promote, while high-risk/incomplete candidates escalate to manual review.
5. **Phase 4: Research-argument and paper-project binding**
   - Deliverable: workspace/paper can bind selected assets and generate `RunRecipe` refs for implementation.
   - Acceptance criteria: readiness and bridge paths can consume asset refs without duplicating asset metadata.
6. **Phase 5: External training platform control pipeline**
   - Deliverable: fixed control-plane pipeline from `RunRecipe` to external job, result validation, and evidence candidate.
   - Acceptance criteria: training tasks are submitted through adapter contracts and results are collected without owning the training platform runtime.
7. **Phase 6: Desktop experiment foundation workbench**
   - Deliverable: UI entry under “文献管理”, asset search/browse/detail/readiness/selection surfaces.
   - Acceptance criteria: user can find and bind reusable assets, monitor external jobs, and inspect result summaries without editing legacy CSS.
8. **Phase 7: Verification, docs, and handoff**
   - Deliverable: context docs, tests, governance sync, and implementation handoff.
   - Acceptance criteria: typecheck/tests/governance lint pass and task docs are current.

## Step-by-step plan (phased)
### Phase 0 - Discovery and semantic freeze
- Objective: confirm exact boundaries before code or schema changes.
- Deliverables:
  - bounded-context ownership table
  - canonical object vocabulary
  - UI placement decision note
  - list of existing research-argument fields to consume rather than duplicate
- Verification:
  - review against `docs/project/overview/START-HERE.md`
  - review against current literature and research-argument contracts
- Rollback:
  - N/A (documentation-only)

### Phase 1 - Contracts and data model
- Objective: define the reusable asset layer.
- Deliverables:
  - `packages/shared/src/research-lifecycle/experiment-foundation-contracts.ts`
  - shared export wiring in `packages/shared/src/research-lifecycle/index.ts`
  - package export wiring in `packages/shared/package.json`
  - `packages/shared/src/research-lifecycle/experiment-foundation-contracts.schema.test.ts`
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
  - `BaseModelAsset`
  - `FineTuningDatasetAsset`
  - `EvaluationProtocol`
  - `TrainingStrategy`
  - `InferenceStrategy`
  - `OptimizerPreset`
  - `ArchitectureTemplate`
  - `ExperimentHypothesis`
  - `HyperparameterSpace`
  - `AblationPlan`
  - `FineTuningStrategy`
  - `TuningSession`
  - `TuningProposal`
  - `TuningDecision`
  - `TuningTrial`
  - `MetricDefinition`
  - `TestSuite`
  - `StatisticalProtocol`
  - `ReportingProtocol`
  - `ComparisonPolicy`
  - `EvaluationFact`
  - `MetricObservation`
  - `ComparisonObservation`
  - `ImplementationDecisionSignal`
  - `PaperTableFactSet`
  - `FineTuningTaskSpec`
  - `FineTuningResult`
  - `ResultArtifact`
  - `ResultValidationReport`
  - `RecipeDraft`
  - `RunRecipe`
  - `TrainingTaskSpec`
  - `PaperExperimentSidecar`
  - `ExperimentFoundationReadinessReport`
  - source/provenance/ref DTOs
  - storage root and cloud mirror semantics
- Verification:
  - shared contract schema tests
  - positive canonical payload tests
  - negative boundary tests for no direct draft execution, no adapter-private fields in `RunRecipe`, no tuning execution without decision, no incomplete sidecar, and no loose metric facts
  - naming/semantic drift review
- Rollback:
  - revert shared contract additions before persistence migration lands

#### S1 - Shared Contracts Slice
- Scope:
  - Contract DTOs, const enums, JSON-schema objects, and schema tests.
  - Asset layer: `DatasetAsset`, `DatasetVersion`, `BaselineAsset`, `BenchmarkAsset`.
  - Recipe/tuning layer: `RecipeDraft`, `RunRecipe`, `TuningSession`, `TuningProposal`, `TuningDecision`, `TuningTrial`.
  - Execution/result layer: `TrainingTaskSpec`, `ExternalTrainingJob`, `ExperimentResult`, `EvidenceCandidate`.
  - Evaluation fact layer: `MetricObservation`, `ComparisonObservation`, `ImplementationDecisionSignal`, `PaperTableFactSet`.
  - Paper bridge: `PaperExperimentSidecar`.
  - Common refs/status: source refs, version locks, hashes, readiness blockers, validation status.
- Non-goals:
  - No Prisma schema changes.
  - No backend routes/services/repositories.
  - No desktop UI.
  - No Aliyun or local adapter implementation.
  - No training execution logic.
  - No automatic tuning/search.
  - No leaderboard.
- Acceptance:
  - Contracts express all confirmed `DP-01` through `DP-11` decisions.
  - Schema tests accept canonical payloads.
  - Negative tests reject direct `RecipeDraft` execution, adapter-private `RunRecipe` fields, tuning without decision, incomplete sidecar trace locks/hashes, and loose metric-only facts.
- Verification commands:
  - `pnpm --filter @paper-engineering-assistant/shared typecheck`
  - `pnpm --filter @paper-engineering-assistant/shared test`
  - `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`

#### S2 - Persistence + Repository/Service Skeleton
- Scope:
  - Persist reusable assets, versions, recipes, jobs, results, evaluation facts, and sidecar refs only after DB SSOT approval.
  - Repository methods return domain DTOs, not Prisma objects.
  - Service skeletons enforce ownership boundaries before routes are added.
- Non-goals:
  - No desktop UI.
  - No platform execution.
  - No literature candidate automation.
- Acceptance:
  - Prisma changes, if needed, go through DB SSOT.
  - `docs/context/db/schema.json` is refreshed if schema changes.
  - Repository/service tests cover create/read/update and soft invalidation paths.

#### S3 - Asset CRUD/Search/Readiness API
- Scope:
  - Backend routes/services for dataset, baseline, benchmark, evaluation protocol, and readiness checks.
  - Search filters include asset kind, lifecycle state, verification state, access state, tags/source refs, and stale/broken status.
  - Readiness reports expose blockers without mutating assets by default.
- Non-goals:
  - No literature import.
  - No training task submission.
  - No paper sidecar binding.
- Acceptance:
  - API/service tests cover CRUD, search, detail, readiness blockers, stale/deprecated/broken filtering, and invalid payloads.

#### S4 - Literature-to-Asset Candidate Flow
- Scope:
  - Map literature key-content categories into dataset/baseline/benchmark/evaluation candidates.
  - Preserve source refs and candidate provenance.
  - Auto-promote low-risk complete candidates; escalate only high-risk/incomplete/conflicting candidates.
- Non-goals:
  - No default human blocking gate.
  - No ungrounded candidate promotion.
- Acceptance:
  - Tests prove source refs survive promotion.
  - Low-risk auto-promotion passes.
  - Ungrounded or incomplete candidates become `needs_info` or `rejected`.

#### S5 - Recipe/Tuning/Evaluation Fact Services
- Scope:
  - `RecipeDraft` create/update, `RunRecipe` lock generation, and `TrainingTaskSpec` materialization boundary.
  - Human/LLM-in-loop tuning sessions, proposals, decisions, and trials.
  - Result validation, metric/comparison observations, implementation decision signals, and paper table fact sets.
- Non-goals:
  - No automatic hyperparameter search.
  - No leaderboard.
  - No direct execution from tuning proposals.
- Acceptance:
  - Tests block adapter-private fields in `RunRecipe`.
  - Tests block proposal execution without `TuningDecision`.
  - Fact extraction keeps result/recipe/asset/protocol/split/seed/repeat/provenance context.

#### S6 - PaperExperimentSidecar Bridge
- Scope:
  - Attach paper-project to frozen experiment trace refs.
  - Store run recipe ids, result ids, evidence candidate ids, task spec ids, external job ids, version locks, hashes, provenance, event log, and status snapshots.
  - Expose sidecar query/update surfaces without expanding core paper-project DTOs.
- Non-goals:
  - No reusable asset DTO copying into paper-project.
  - No final claim acceptance.
- Acceptance:
  - Trace-chain tests traverse paper -> sidecar -> evidence -> result -> job -> task -> recipe -> assets -> source refs.
  - Missing locks/hashes/status snapshots are rejected.

#### S7 - LocalScript Execution Control Pipeline
- Scope:
  - Implement `LocalScriptAdapter` for local smoke execution and pipeline validation.
  - Validate `Resolve -> Validate -> Materialize -> Submit -> Monitor -> Collect -> Validate Result` without cloud credentials.
  - Collect local metrics/logs/artifacts/config snapshots into structured result packets.
- Non-goals:
  - No Aliyun credentials or PAI-DLC private fields.
  - No production scheduler.
- Acceptance:
  - Local adapter tests cover success, failure, cancellation/unknown status, missing output contract, and invalid metrics.
  - Result validation produces `ExperimentResult` and eligible `EvidenceCandidate`.

#### S8 - Aliyun PAI-DLC Adapter + Cloud Mirror
- Scope:
  - Implement `AliyunPaiDlcAdapter` behind `TrainingPlatformAdapter`.
  - Use `DatasetMirror` refs for OSS/PAI Dataset execution inputs.
  - Submit, monitor, collect logs/artifacts/metrics/config snapshots from PAI-DLC/OSS.
- Non-goals:
  - No cloud canonical dataset metadata.
  - No `CustomHttpAdapter`.
  - No platform-private fields in core `TrainingTaskSpec`.
- Acceptance:
  - Mocked Aliyun tests cover submit/status/log/result/cancel behavior.
  - Mirror tests block stale checksum and policy-disallowed mirroring.
  - Collected outputs satisfy `ExperimentResult` / `FineTuningResult` contracts.

#### S9 - Desktop “实验基座” Workbench
- Scope:
  - Desktop nav entry below “文献管理”.
  - Views for asset list/search/detail, readiness blockers, recipe/tuning workflow, external jobs, result/fact summaries, and sidecar trace refs.
  - UI consumes contracts/API without owning experiment semantics.
- Non-goals:
  - No legacy CSS dependency.
  - No client-side source of truth for assets/results.
- Acceptance:
  - UI governance and smoke checks pass.
  - The workbench renders “实验基座” and does not modify `apps/desktop/src/renderer/styles/**`.

### Phase 2 - Persistence and backend API
- Objective: make assets durable and queryable.
- Deliverables:
  - Prisma schema/migration if persistence is approved
  - repository/service/controller/routes
  - search and detail read models
  - readiness check service
- Verification:
  - backend route/service tests
  - DB schema context refresh if schema changes
- Rollback:
  - revert migration before data is depended on, or add follow-up migration to remove unused tables if already applied

### Phase 3 - Literature-to-asset candidate flow
- Objective: reuse literature extraction outputs as asset candidates.
- Deliverables:
  - candidate import from literature key-content categories
  - provenance-preserving source refs
  - triage states: `candidate`, `auto_promoted`, `manual_review_required`, `accepted`, `rejected`, `merged`, `needs_info`
  - deterministic auto-promotion checks
- Verification:
  - unit tests proving source refs survive candidate promotion
  - positive tests for low-risk auto-promotion
  - negative tests for ungrounded candidate rejection or `needs_info`
- Rollback:
  - disable candidate import route/entry point while preserving manually registered assets

### Phase 4 - Research-argument and paper-project binding
- Objective: make implementation-stage assets consumable downstream.
- Deliverables:
  - asset ref binding in research-argument workspace or sidecar refs
  - `RecipeDraft` creation while selected dataset/baseline/protocol/method inputs are incomplete
  - `RunRecipe` generation from locked dataset/baseline/protocol/method assets
  - `TrainingTaskSpec` materialization boundary from valid `RunRecipe`
  - `PaperExperimentSidecar` attachment with frozen refs, version locks, hashes, provenance, event log, and status snapshots
  - human/LLM-in-loop tuning sessions linked to paper implementation stages
  - tuning proposals, decisions, and trials linked to recipe/result/evidence records
  - structured evaluation facts extracted from validated results
  - paper-table-ready fact sets with missing-cell warnings
  - implementation decision signals linked to tuning sessions and result facts
  - compatibility hash inputs for dataset/evaluation protocol
- Verification:
  - tests for no direct metadata duplication
  - readiness tests for missing license/version/hash/protocol/entrypoint
  - sidecar trace-chain tests from paper project to source refs
  - tuning decision tests proving unaccepted proposals cannot execute
  - fact extraction tests proving table support fields and decision signals preserve result/protocol context
- Rollback:
  - keep asset library standalone and remove downstream binding paths

### Phase 5 - External training platform control pipeline
- Objective: connect implementation recipes to external training platforms without owning the platform runtime.
- Deliverables:
  - `ExecutionPlatform`
  - `TrainingTaskSpec`
  - `ExternalTrainingJob`
  - `ExperimentResult`
  - `EvidenceCandidate`
  - `TrainingPlatformAdapter` interface
  - fixed pipeline: `Resolve -> Validate -> Materialize -> Submit -> Monitor -> Collect -> Validate Result`
  - mirror step for execution platforms that require cloud-accessible data refs
  - `LocalScriptAdapter`
  - `AliyunPaiDlcAdapter`
- Verification:
  - adapter contract tests
  - local smoke adapter tests
  - Aliyun PAI-DLC adapter contract tests with mocked platform responses
  - dataset mirror checksum and policy tests
  - status transition tests
  - failed submission and partial result tests
  - result validation tests against `EvaluationProtocol`
  - result collection tests for required metrics/artifacts/logs/config snapshot/validation report
  - LLM fine-tuning readiness tests for base model license, dataset policy, tokenizer/chat template, context length, contamination risk, resource estimate, and output contract
- Rollback:
  - disable submit/sync/collect routes while preserving generated `RunRecipe` and reusable asset library

### Phase 6 - Desktop experiment foundation workbench
- Objective: expose reusable asset workflows in the desktop UI.
- Deliverables:
  - navigation entry below “文献管理”
  - asset list/search/detail
  - readiness status and blockers
  - bind-to-workspace/paper action draft
  - external job status and result summary surfaces
- Verification:
  - UI contract/governance checks
  - visual smoke check
  - no new dependency on `apps/desktop/src/renderer/styles/**`
- Rollback:
  - hide nav entry behind feature flag while keeping backend/contracts intact

### Phase 7 - Verification, docs, and handoff
- Objective: leave a maintainable, context-recoverable feature baseline.
- Deliverables:
  - updated `docs/context/` contracts
  - dev-docs verification records
  - project governance sync/lint
- Verification:
  - `pnpm` checks selected by implementation scope
  - `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`
- Rollback:
  - archive or park task with explicit state and known incomplete surfaces

## Verification and acceptance criteria
- Build/typecheck:
  - `pnpm --filter @paper-engineering-assistant/shared typecheck`
  - `pnpm --filter @paper-engineering-assistant/backend typecheck`
  - frontend typecheck command selected after UI package inspection
- Automated tests:
  - shared contract schema tests
  - backend service/route tests for assets, candidate flow, readiness, and run recipe generation
  - adapter contract tests for external training task submission, status sync, result collection, and cancellation
  - UI contract/governance checks for desktop workbench
- Manual checks:
  - register dataset asset
  - register baseline asset
  - import candidate from literature key content
  - search and bind reusable assets
  - compose a run recipe from asset + method recipe + evaluation protocol records
  - create a fine-tuning task from base model + fine-tuning dataset + strategy refs
  - generate a run recipe with traceable refs
  - create/reuse an Aliyun OSS or PAI Dataset mirror for an approved dataset version
  - submit a training task through a configured adapter
  - sync external job status and collect a structured result
  - verify collected result against evaluation protocol and produce an evidence candidate only when valid or accepted partial
- Acceptance criteria:
  - `experiment-foundation` has a stable canonical vocabulary and module boundary.
  - Dataset/baseline/benchmark/protocol assets can be registered, searched, reviewed, and reused.
  - Dataset metadata/version/split/checksum/policy is canonical locally; cloud mirrors are validated execution refs.
  - Method recipe records can be selected and instantiated into `RunRecipe`.
  - Human/LLM-in-loop tuning is supported through auditable proposals, decisions, trials, results, and evidence links.
  - LLM fine-tuning is supported as a specialized training profile with dedicated readiness checks and artifact collection.
  - Evaluation layer records define metric/test/statistical/reporting/comparison requirements for result validation and produce structured facts for paper-table support.
  - Implementation decisions can cite structured facts to decide continue/adjust/rerun/abandon/needs-more-data.
  - Literature-derived candidates preserve source refs; low-risk complete candidates can auto-promote, while high-risk/incomplete candidates require escalation.
  - Research-argument/paper-project can consume asset refs without duplicating asset metadata.
  - Paper-project can trace from `PaperExperimentSidecar` to evidence candidate, result, external job, task spec, run recipe, asset versions, and source refs.
  - External training platforms are integrated through adapters; this repo does not own scheduler/runtime execution.
  - The fixed execution pipeline creates `TrainingTaskSpec`, tracks `ExternalTrainingJob`, validates `ExperimentResult`, and produces `EvidenceCandidate`.
  - `ExperimentResult` and `FineTuningResult` include metrics, artifacts, logs, config snapshot, and validation report.
  - Readiness checks block missing version/license/access/protocol/entrypoint conditions.
  - Desktop entry appears below “文献管理” without extending frozen legacy CSS.
  - Governance sync/lint passes and task docs stay current.

## Risks and mitigations
| Risk | Likelihood | Impact | Mitigation | Detection | Rollback |
|---|---:|---:|---|---|---|
| Semantic drift into a broad “论文管理” bucket | med | high | Use `experiment-foundation`, `literature`, `research-argument`, `paper-project` as separate names | docs/context glossary and contract review | rename/refactor before public API freeze |
| Duplicating `research-argument.baseline_set` | med | high | Baseline assets are reusable catalog entries; baseline sets are workspace selections | contract test and architecture review | remove duplicate DTO fields before persistence |
| Raw data handling violates local/rights constraints | med | high | Store refs, checksums, access status, and protocols, not restricted raw copies | readiness report and storage audit | disable import/download path |
| Cloud mirror becomes accidental canonical source | med | high | Treat OSS/PAI Dataset as `DatasetMirror`; require checksum validation against local manifest | mirror freshness check | mark mirror stale and regenerate |
| V1 becomes full experiment runner too early | high | med | Limit V1 to asset library, run recipe, and external platform control plane | scope review at Phase 1 and 2 | disable submit/sync routes |
| Platform-specific API leaks into core contracts | med | high | Keep platform-specific fields in adapter metadata | contract review and adapter tests | move fields back behind adapter boundary |
| Aliyun adapter overfits PAI-DLC shape | med | med | Keep core services dependent on `TrainingPlatformAdapter`; isolate PAI-DLC fields in adapter metadata | adapter contract tests | refactor private fields behind adapter |
| External job results directly become paper claims | med | high | Store results as `EvidenceCandidate` until claim-evidence review accepts them | evidence mapping review | remove auto-claim path |
| Result collection produces untraceable loose files | med | high | Enforce metrics/artifacts/logs/config snapshot/validation report contract | result schema validation | mark result partial/invalid |
| LLM fine-tuning introduces license/privacy/contamination/resource risk | med | high | Add fine-tuning readiness gate and block incomplete base model/dataset/policy/template/resource/eval metadata | readiness report | block fine-tuning submit path |
| Auto-promotion admits hallucinated or risky assets | med | high | Require source refs, metadata completeness, duplicate check, policy check, confidence threshold, and risk classifier before auto-promotion | candidate triage report | demote to needs_info/manual_review_required |
| UI adds legacy CSS debt | med | med | Use data-ui/token path and avoid frozen legacy styles | UI governance gate | hide/revert UI entry |
| Asset reuse hides stale/broken baselines | med | high | Add verification status, last checked timestamp, and stale triggers | readiness check and search filters | mark asset deprecated/broken |
| Full benchmark becomes baseline entry blocker | med | med | Separate baseline and benchmark verification ladders; require full benchmark only for paper-grade strong evidence | readiness policy tests | allow catalog entry with lower verification state |
| RunRecipe leaks platform-private execution details | med | high | Keep `RunRecipe` platform-neutral; materialize platform payload into `TrainingTaskSpec` and adapter metadata | contract tests and adapter review | move fields behind materialization boundary |
| PaperProject sidecar becomes untraceable loose ids | med | high | Require frozen refs, version locks, hashes, provenance refs, event log, and status snapshots | sidecar trace-chain tests | reject incomplete sidecar binding |
| Human/LLM tuning becomes hidden auto-search | med | high | Require proposal, decision, readiness, trial, result, and evidence links for each tuning iteration | tuning workflow tests | block direct execution from proposal |
| Evaluation layer loses factual context | med | high | Store metric/comparison/table/decision facts with result, recipe, asset/protocol, split/seed/repeat, validation, and provenance refs | fact extraction tests | mark facts incomplete and block table/evidence use |

## Decision alignment points
| Decision | Options | Recommended default | Needed before |
|---|---|---|---|
| UI label | confirmed: 实验基座 | confirmed: 实验基座 | Phase 5 |
| Storage scope | local path only / cloud canonical / local canonical + cloud execution mirror | confirmed: local canonical + cloud execution mirror | Phase 1 |
| Baseline/benchmark verification bar | metadata/reachable / smoke/evaluator smoke / full benchmark/comparison certification | confirmed: tiered verification; full benchmark is not a baseline catalog-entry blocker | Phase 2 |
| RunRecipe depth | loose config / executable script / materializable recipe | confirmed: `RecipeDraft -> RunRecipe -> TrainingTaskSpec`; RunRecipe is locked and platform-neutral | Phase 2 |
| Downstream binding | research-argument only / paper-project only / both via refs | confirmed: research-argument first, paper-project via `PaperExperimentSidecar` frozen trace refs | Phase 4 |
| Execution ownership | self-built training platform / external platform control plane | external platform control plane | Phase 5 |
| First platform adapter | LocalScriptAdapter / AliyunPaiDlcAdapter / CustomHttpAdapter | confirmed: LocalScriptAdapter + AliyunPaiDlcAdapter; no CustomHttpAdapter in V1 | Phase 5 |
| Result collection contract | metrics only / metrics + artifacts / full result packet | confirmed: metrics + artifacts + logs + config snapshot + validation report | Phase 5 |
| Candidate promotion | auto-promote low-risk / human review required / confidence threshold only | confirmed: auto-promote low-risk; manual review only for high-risk or incomplete candidates | Phase 3 |
| Method recipe V1 scope | recipes only / automatic tuning / human+LLM-in-loop tuning | confirmed: reusable method recipes plus human/LLM-in-loop tuning; no automatic hyperparameter optimization | Phase 1 |
| Evaluation layer V1 scope | loose metrics / facts + protocol / full leaderboard | confirmed: protocol + validation + structured fact layer; no full leaderboard | Phase 1 |
| LLM fine-tuning support | out of scope / generic training task / specialized training profile | specialized `TrainingTaskSpec` profile | Phase 1 / Phase 5 |

## Optional detailed documentation layout (convention)
```
dev-docs/active/experiment-foundation-v1/
  roadmap.md
  00-overview.md
  01-plan.md
  02-architecture.md
  03-implementation-notes.md
  04-verification.md
  05-pitfalls.md
```

## To-dos
- [x] Confirm planning-mode signal handling and fallback record
- [x] Confirm input sources and trust levels
- [x] Confirm merge decisions and conflict log entries
- [x] Confirm open questions
- [x] Confirm phase ordering and DoD
- [x] Confirm verification/acceptance criteria
- [x] Confirm rollout/rollback strategy
