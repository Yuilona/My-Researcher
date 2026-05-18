# 01 Plan

## Phases
1. Discovery and semantic freeze
2. Contracts and data model
3. Persistence and backend API
4. Literature-to-asset candidate flow
5. Research-argument and paper-project binding
6. Training platform control pipeline
7. Desktop experiment foundation workbench
8. Verification, docs, and handoff

## Execution slices
| Slice | Scope | Owns | Must not do | Exit criteria |
|---|---|---|---|---|
| S0 | Design review sync + child task split | parent/child task map, review coverage, S1-A/S1-B boundary repair | product code, Prisma, API, UI | child packages exist; coverage matrix has no high-risk gaps; governance lint passes |
| S1 | Shared contracts + schema tests | DTOs, const enums, JSON schemas, exports, canonical/negative schema tests | Prisma, backend routes, UI, adapters, execution | shared typecheck/test pass; contract boundaries express DP-01 to DP-11 |
| S2 | Persistence + repository/service skeleton | Prisma via DB SSOT if approved, repositories returning domain DTOs, service skeletons | UI, adapter execution, candidate automation | DB/context sync if schema changes; repository/service tests pass |
| S3 | Asset CRUD/search/readiness API | dataset/baseline/benchmark/protocol APIs, search filters, readiness blockers | literature import, training submission | API/service tests cover CRUD/search/readiness and stale/broken assets |
| S4 | Literature-to-asset candidate flow | key-content mapping, source refs, deterministic triage, auto-promote low-risk candidates | default human blocking gate, ungrounded promotion | candidate tests cover provenance, auto-promotion, needs_info/reject |
| S5 | Recipe/tuning/evaluation fact services | `RecipeDraft`, `RunRecipe`, tuning workflow, result validation, evaluation facts, table fact sets, decision signals | automatic hyperparameter search, leaderboard, direct proposal execution | service tests cover recipe locks, tuning decisions, fact extraction |
| S6 | PaperExperimentSidecar bridge | frozen trace refs, version locks, hashes, status snapshots, paper-project sidecar read/write | copying reusable asset DTOs into paper-project core | trace-chain tests from paper to source refs pass |
| S7 | LocalScript execution control pipeline | local adapter, local materialization, status sync, local result collection, validation | cloud credentials, Aliyun fields, production scheduler | local smoke adapter and pipeline tests pass |
| S8 | Aliyun PAI-DLC adapter + cloud mirror | OSS/PAI Dataset mirror refs, PAI-DLC submit/monitor/collect, cloud result artifacts | cloud as canonical data, CustomHttpAdapter | mocked Aliyun adapter tests and mirror checksum/policy tests pass |
| S9 | Desktop “实验基座” workbench | nav below “文献管理”, asset/readiness/recipe/job/result/fact/sidecar views | legacy CSS dependencies, backend contract drift | UI governance/smoke checks pass; no frozen legacy CSS dependency |

## Detailed steps
### Phase 1 - Discovery and semantic freeze
- Confirm canonical names:
  - `experiment-foundation`
  - `DatasetAsset`
  - `BenchmarkAsset`
  - `BaselineAsset`
  - `EvaluationProtocol`
  - `RunRecipe`
- Confirm UI label and placement under “文献管理”.
- Inventory existing fields:
  - literature key-content categories
  - research-argument `baseline_set`
  - research-argument bridge `baseline_set_ids`
  - lifecycle `dataset_protocol_hash` / `evaluation_protocol_hash`
- Produce a short ownership matrix.
- Maintain child task coverage matrix in `06-child-task-review.md`.
- Close `S0` before starting shared contract implementation.

### Phase 2 - Contracts and data model
- First implementation slice `S1` is split into:
  - `S1-A`: minimum closed-loop contracts: reusable assets, dataset version/storage refs, baseline implementation version, benchmark/protocol version, version locks, readiness, RecipeDraft, RunRecipe, materialization boundary, result validation, EvidenceCandidate, and PaperExperimentSidecar.
  - `S1-B`: extension shells: method components, fine-tuning profile, tuning session/proposal/decision/trial, evaluation fact extensions, comparison observations, implementation decision signals, and paper-table-ready fact grouping.
- First implementation child packages:
  - `experiment-foundation-dataset-registry-contracts`
  - `experiment-foundation-benchmark-protocol-contracts`
  - `experiment-foundation-version-lock-recipe-contracts`
  - `experiment-foundation-materialization-adapter-contracts`
  - `experiment-foundation-result-evidence-sidecar-contracts`
  - `experiment-foundation-candidate-promotion-contracts`
- Shared contract implementation scope:
  - Scope: shared contracts + schema tests only.
  - Primary file: `packages/shared/src/research-lifecycle/experiment-foundation-contracts.ts`.
  - Export updates:
    - `packages/shared/src/research-lifecycle/index.ts`
    - `packages/shared/package.json`
  - Test file: `packages/shared/src/research-lifecycle/experiment-foundation-contracts.schema.test.ts`.
  - Do not change Prisma, backend routes, desktop UI, platform adapters, or training execution in S1.
- Add shared contracts for:
  - asset identity and source refs
  - dataset/benchmark/baseline/protocol records
  - dataset versions, locations, mirrors, checksum manifests, split protocols, processing recipes, and data policies
  - base model and fine-tuning dataset records
  - training/inference strategy templates
  - fine-tuning strategy and fine-tuning task profile records
  - optimizer presets, architecture templates, hypotheses, hyperparameter spaces, and ablation plans
  - tuning sessions, proposals, decisions, and trials for human/LLM-in-the-loop tuning
  - metric definitions, test suites, statistical protocols, reporting protocols, and comparison policies
  - evaluation facts, metric observations, comparison observations, implementation decision signals, and paper table fact sets
  - readiness status and blockers
  - candidate review state
  - recipe draft payload
  - run recipe payload
  - training task materialization payload
  - paper experiment sidecar trace payload
- Define status enums:
  - canonical asset lifecycle: `registered | active | deprecated | archived`
  - candidate review state: `needs_info | manual_review_required | ready_for_promotion | promoted | rejected`
  - baseline verification: `unknown | metadata_complete | reachable | smoke_verified | protocol_compatible | benchmark_verified | broken`
  - benchmark verification: `unknown | protocol_complete | assets_reachable | evaluator_smoke_verified | reproducible_protocol | comparison_certified | broken`
  - access: `available | restricted | missing | unknown`
- Define source provenance:
  - literature refs
  - manual refs
  - repository refs
  - local path refs
  - cloud mirror refs
- Define storage semantics:
  - local registry is canonical.
  - local file refs and remote refs are asset locations.
  - cloud mirrors are execution mirrors, not canonical records.
  - data blobs must not be stored in the repo or relational DB.
- Define composition semantics:
  - fixed reusable assets MAY be directly referenced.
  - method recipe objects MUST be instantiated into a `RunRecipe` before execution.
  - evaluation objects MUST define comparability and result validity.
  - baseline assets MUST model the reusable comparison method/implementation.
  - benchmark assets MUST model the reusable comparison protocol/testbed.
  - full benchmark verification MUST NOT be required for baseline catalog entry.
  - `RecipeDraft` MAY be incomplete and editable, but MUST NOT be submitted.
  - `RunRecipe` MUST lock selected refs, versions, protocol hashes, method params, and readiness results.
  - `RunRecipe` MUST remain platform-neutral and MUST NOT contain adapter-private fields.
  - `TrainingTaskSpec` MUST be materialized from a valid `RunRecipe` plus `MaterializeTrainingTaskSpecRequest.platform_id`.
  - method recipe records MAY feed a `TuningSession`, but MUST NOT execute by themselves.
  - `TuningProposal` MAY be authored by human, LLM, or system rule, but MUST produce a recorded `TuningDecision` before execution.
  - accepted tuning decisions MAY update `RecipeDraft` or produce a new recipe revision; they MUST NOT bypass readiness checks.
  - evaluation facts MUST be structured records derived from validated results, not loose metric scalars.
  - paper-table-ready fact sets MAY support later writing/table generation, but MUST NOT act as a leaderboard.
  - implementation decision signals MUST reference factual observations and MUST NOT become paper claims.
- Add shared schema tests.
  - positive canonical payload tests for assets, recipes, execution/result packets, tuning, evaluation facts, and sidecar trace refs
  - negative tests for direct `RecipeDraft` execution, adapter-private fields in `RunRecipe`, missing tuning decision, missing sidecar locks/hashes, and loose metric facts
  - negative tests from `06-child-task-review.md` owner packages before entering S2

### Phase 2 Review Close
- Before moving from S1-A to S1-B, review:
  - `DatasetAsset` has no version/checksum/storage fields.
  - `BenchmarkAsset` references protocol versions rather than embedding full rules.
  - `RunRecipe` locks refs/hashes and remains platform-neutral.
  - `TrainingTaskSpec` profile supports fine-tuning without a bypass path.
  - `EvidenceCandidate` blocks invalid result-to-claim flow.
- Before moving from S1-B to S2, review all child task `04-verification.md` planned checks and ensure contract tests cover negative cases.

### Phase 3 - Persistence and backend API
- Decide whether V1 needs Prisma tables immediately.
- If persisted:
  - add Prisma models and migration through DB SSOT workflow
  - add repository methods that return domain DTOs, not Prisma objects
- Add service and route surfaces for:
  - create/update/search/detail
  - readiness check
  - candidate triage/promote/reject
  - run recipe generation
- Add route/service tests.

### Phase 4 - Literature-to-asset candidate flow
- Map literature key-content categories to candidate types:
  - `datasets_and_benchmarks` -> dataset/benchmark candidates
  - `experiments` -> evaluation protocol hints
  - `reproducibility` -> baseline setup hints
  - `claim_evidence_map` -> evidence refs
- Require resolvable source refs before candidate import.
- Auto-promote low-risk candidates when required metadata, source refs, policy fields, and duplicate checks pass.
- Escalate only high-risk or incomplete candidates to manual review.
- Add tests that ungrounded candidates are rejected or marked `needs_info`.

### Phase 5 - Research-argument and paper-project binding
- Define asset ref consumption rules:
  - research-argument baseline sets reference `BaselineAsset` ids where applicable
  - protocol readiness references `EvaluationProtocol` and `BenchmarkAsset`
  - `PaperProject` receives `PaperExperimentSidecar` trace refs rather than full asset snapshots
  - `PaperExperimentSidecar` records frozen refs, version locks, hashes, provenance, event log, and status snapshot
  - core `PaperProject` DTOs are not expanded with reusable asset details in V1
- Create `RecipeDraft` while selected assets, method choices, or protocols are still incomplete.
- Promote a draft into `RunRecipe` only after refs, versions, method params, evaluation protocol, and readiness result are locked.
- Compose `RunRecipe` from:
  - fixed assets
  - method recipe objects
  - evaluation protocol objects
  - capability-oriented execution profile requirements
- Materialize `TrainingTaskSpec` from `RunRecipe` only at execution boundary.
  - platform selection belongs to `MaterializeTrainingTaskSpecRequest`, not `RunRecipe`.
- Compute compatibility inputs:
  - dataset protocol hash
  - evaluation protocol hash
  - baseline set hash if needed
- Add tests for missing required assets, stale/broken assets, and sidecar trace-chain completeness.
- Add tests for tuning proposal acceptance/rejection, decision traceability, and prevention of direct execution from unaccepted proposals.
- Add tests for evaluation fact extraction, table fact completeness, and implementation decision signal traceability.

### Phase 6 - Training platform control pipeline
- Define execution boundary:
  - experiment foundation owns task specification, submission, monitoring, result collection, validation, and evidence conversion
  - external platforms own scheduling, compute execution, GPU allocation, low-level retries, and platform-native logs
  - cloud storage such as OSS owns execution input/output objects but not canonical dataset metadata
- Add shared contracts for:
  - `ExecutionPlatform`
  - `TrainingTaskSpec`
  - `FineTuningTaskProfile`
  - `TrainingTaskMaterializationResult`
  - `ExternalTrainingJob`
  - `ExperimentResult`
  - `FineTuningResult`
  - `EvidenceCandidate`
- Define the fixed pipeline:
  - `Resolve`
  - `Validate`
  - `Mirror`
  - `Materialize`
  - `Submit`
  - `Monitor`
  - `Collect`
  - `Validate Result`
- Define `TrainingPlatformAdapter` interface:
  - `submit`
  - `getStatus`
  - `getLogs`
  - `collectResults`
  - `cancel`
- Select the first adapter implementation after platform decision:
  - `LocalScriptAdapter` for smoke and local pipeline validation
  - `AliyunPaiDlcAdapter` for first real cloud execution
  - `CustomHttpAdapter` is explicitly out of V1 scope
- Add tests for status transitions, failed submissions, partial results, and invalid metrics.
- Add mirror tests:
  - local dataset version can create a cloud mirror record
  - stale mirror is detected by checksum mismatch
  - restricted data cannot be mirrored without policy approval
- Add LLM fine-tuning readiness checks:
  - base model license and use policy
  - fine-tuning dataset license/privacy/copyright risk
  - SFT/DPO/continued-pretraining data format
  - tokenizer/chat template and max context length compatibility
  - estimated VRAM/resource needs
  - evaluation protocol presence
  - overfitting/contamination risk
  - checkpoint/model card output contract

### Phase 7 - Desktop experiment foundation workbench
- Add nav entry below “文献管理”.
- Build views for:
  - asset search/list
  - asset detail
  - readiness blockers
  - literature candidate review
  - bind/generate recipe action draft
  - external training job status and result summary
- Follow data-ui/token path and avoid `apps/desktop/src/renderer/styles/**`.
- Add UI smoke/governance checks selected by the existing desktop test setup.

### Phase 8 - Verification, docs, and handoff
- Refresh `docs/context/` if APIs, schemas, DB, or module contracts change.
- Record all verification commands in `04-verification.md`.
- Run project governance sync/lint.
- Update handoff notes and archive only after implementation is complete and verified.

## Decision points before implementation
| ID | Decision | Default proposal | Blocks |
|---|---|---|---|
| DP-01 | UI 中文名称 | confirmed: 实验基座 | UI copy and nav |
| DP-02 | V1 storage scope | confirmed: local canonical registry + local file refs + optional cloud execution mirror | contracts and backend |
| DP-03 | Candidate promotion policy | confirmed: auto-promote low-risk candidates; manual review only for high-risk/incomplete cases, not a default blocking gate | literature candidate flow |
| DP-04 | Baseline/benchmark usage and verification bar | confirmed: baseline = comparison implementation, benchmark = comparison protocol; tiered verification; full benchmark is not an entry blocker | readiness service |
| DP-05 | RunRecipe depth | confirmed: materializable recipe with `RecipeDraft -> RunRecipe -> TrainingTaskSpec`; RunRecipe is locked and platform-neutral | downstream binding |
| DP-06 | PaperProject integration | confirmed: `PaperExperimentSidecar` with frozen trace refs; no reusable asset DTO expansion in core `PaperProject` | bridge design |
| DP-07 | First training platform adapter | confirmed: LocalScriptAdapter for smoke + AliyunPaiDlcAdapter for first real cloud execution; no CustomHttpAdapter in V1 | execution pipeline |
| DP-08 | Result collection contract | confirmed: metrics + artifacts + logs + config snapshot + validation report | evidence conversion |
| DP-09 | Method recipe V1 scope | confirmed: reusable strategy/preset/search-space/ablation/fine-tuning recipes plus human/LLM-in-loop tuning sessions; no automatic hyperparameter optimization | run recipe composition |
| DP-10 | Evaluation layer V1 scope | confirmed: protocol + validation + structured fact layer for table support and implementation decisions; no full leaderboard | result validation |
| DP-11 | LLM fine-tuning support | specialized `TrainingTaskSpec` profile, not a separate platform | execution pipeline and readiness |

## Risks & mitigations
- Risk: 与 `research-argument.baseline_set` 语义重复。
  - Mitigation: 把 `BaselineAsset` 定义为 reusable catalog object，把 `baseline_set` 定义为 workspace selection。
- Risk: 数据集资产管理变成未授权数据复制。
  - Mitigation: 默认保存 refs、checksums、access status 和 protocols，不复制受限 raw data；云端镜像必须通过 policy gate。
- Risk: V1 范围膨胀成完整实验平台。
  - Mitigation: V1 只做资产库、readiness、RunRecipe 和外部训练平台控制面；计算执行由外部平台负责。
- Risk: 平台适配器把平台私有字段泄漏进核心合同。
  - Mitigation: 核心合同只表达标准 `TrainingTaskSpec`、`ExternalTrainingJob`、`ExperimentResult`；平台私有字段放 adapter metadata。
- Risk: 阿里云 adapter 过早绑定平台私有 shape。
  - Mitigation: 先冻结 `TrainingPlatformAdapter` 标准合同；`AliyunPaiDlcAdapter` 只在 adapter metadata 中保留 PAI-DLC 私有字段。
- Risk: 结果回收后直接污染论文 claim。
  - Mitigation: 结果先进入 `EvidenceCandidate`，必须经过 evaluation protocol validation 和后续 claim-evidence review。
- Risk: 结果回收只有散落文件，无法进入证据链。
  - Mitigation: 固定 `ExperimentResult` 最小合同：metrics、artifacts、logs、config snapshot、validation report；缺少核心字段时标记 partial/invalid。
- Risk: 大模型微调引入 license、隐私、数据污染或资源成本风险。
  - Mitigation: 为 fine-tuning profile 增加专项 readiness gate，阻断缺 base model license、dataset policy、chat template、context length、resource estimate 或 evaluation protocol 的任务。
- Risk: UI 插入时违反 legacy CSS freeze。
  - Mitigation: 新 UI 使用 data-ui/token path，禁止新增 legacy CSS dependency。
- Risk: 自动候选引入 hallucinated assets。
  - Mitigation: 候选必须带 source refs 且通过 deterministic checks；高风险/不完整候选升级人工 review，低风险候选可自动晋级。
- Risk: 把 full benchmark 跑完作为 baseline 入库阻断条件，导致可复用资产沉淀过重。
  - Mitigation: baseline 和 benchmark 分开建模、分层验证；catalog 入库只要求 metadata/reachability，正式论文证据才要求 benchmark-verified/comparison-certified。
- Risk: `RunRecipe` 漂移成平台私有执行脚本或松散静态配置。
  - Mitigation: 固定 `RecipeDraft -> RunRecipe -> TrainingTaskSpec` 三层；`RunRecipe` 只锁定领域 refs/params/protocol/readiness，平台私有字段留在 adapter metadata。
- Risk: `paper-project` 复制实验资产详情后与 `experiment-foundation` 发生追溯漂移。
  - Mitigation: V1 只通过 `PaperExperimentSidecar` 保存冻结 refs、version locks、hashes、provenance、event log 和 status snapshots，不复制 reusable asset DTO。
- Risk: 人/LLM 在回路的调参演变成无边界自动调参或无记录试错。
  - Mitigation: 固定 `TuningSession -> TuningProposal -> TuningDecision -> RecipeDraft/RunRecipe -> Result` 链路；未接受提案不能执行，每次试验必须绑定 decision、recipe、result 和 evidence refs。
- Risk: 评估结果退化为 loose metrics，无法支撑论文表格或实施判断。
  - Mitigation: 固定 evaluation fact layer；每个 fact 必须带 result、recipe、asset/protocol version、metric、split/seed/repeat、validation status 和 provenance refs。

## Acceptance checkpoints
- [x] DP-01 到 DP-11 已确认或记录为明确假设。
- [ ] Contract PR 前已有 object ownership matrix。
- [x] `S1` shared contracts slice 已冻结文件范围和非目标。
- [ ] `DP-02` 存储决策已在合同、后端和阿里云 adapter 设计中保持一致。
- [ ] Persistence 方案走 DB SSOT 决策，不绕过 `prisma/schema.prisma`。
- [ ] Backend API 先通过 shared contracts 冻结 request/response。
- [ ] 平台控制管道合同先于任何 adapter 实现冻结。
- [ ] `DP-07` adapter scope 已固定：LocalScriptAdapter + AliyunPaiDlcAdapter；V1 不做 CustomHttpAdapter。
- [ ] `DP-08` result collection contract 已固定并由 `ExperimentResult` / `FineTuningResult` schema 表达。
- [x] `DP-03` candidate promotion 已固定为 auto-promote low-risk + manual review escalation。
- [x] `DP-04` baseline/benchmark 边界和分层验证已固定，不把 full benchmark 作为 baseline 入库阻断条件。
- [x] `DP-05` RunRecipe 深度已固定为 materializable recipe，不做松散静态配置或平台私有执行脚本。
- [x] `DP-06` PaperProject 集成已固定为 `PaperExperimentSidecar` 冻结追溯引用，不扩展核心 DTO 复制资产详情。
- [x] `DP-09` method recipe V1 范围已固定为可复用方法配方 + 人/LLM 在回路调参，不做自动调参系统。
- [x] `DP-10` evaluation layer V1 范围已固定为协议/校验 + 结构化事实层，不做完整 leaderboard。
- [ ] UI workbench 不依赖 frozen legacy CSS。
- [ ] Verification 记录完整，不遗留临时脚本或测试文件。
