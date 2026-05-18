# 04 Verification

> Phase 6 收口前可逐步补充；本文件先列计划，执行后填写实际结论。

## Automated checks
- `pnpm -w typecheck`（必跑）
- `pnpm --filter @paper-engineering-assistant/desktop typecheck`
- `pnpm --filter @paper-engineering-assistant/desktop build`
- 现有桌面 renderer 单元测试套件（如 `*.test.ts` / `*.spec.ts`）
- 新增覆盖：
  - reviewer card 渲染 / human-confirm 表单字段必填校验单测
  - `ActiveTitleCardContext` 切换语义单测
  - v1a/b/c API client 形状测试（schema shape 与 OpenAPI 对齐）
- 后端 contract drift：`docs/context/api/api-index.json` / `openapi.yaml` 不应被本任务改动；CI 已有 drift 检查应保持绿。

## Manual smoke checks

### Phase 1 冒烟（Shell + active title-card）
- [ ] `pnpm desktop:dev` 启动；侧边栏题目卡选择器可见，加载/空态正确
- [ ] 切换 active title-card，stage tab 内可拿到正确 id
- [ ] feature flag off 时旧 module 可访问，文献/论文/写作模块无回归

### Phase 2 冒烟（v1a）
- [ ] 选定空 title-card → 创建/接受 SearchPlan → 触发 SearchRun → EvidenceMap 出现 EvidenceUnit
- [ ] NeedCandidate Review 卡可 reject / revise / request search revision
- [ ] ValidatedNeed Decision 卡可 human-confirm；reviewer card 显示结论/证据/反证/blocker/next actions 5 段
- [ ] negative case：already_solved → reject + CandidateDecisionMemory 创建可在 UI 触发

### Phase 3 冒烟（v1b）
- [ ] 选定 human-confirmed ValidatedNeed → 看到 SliceOptionSet 推荐 → 选择 confirm
- [ ] TopicQuestionCandidateSet 比较 + 选择 confirm
- [ ] ValueAssessment 表单结构化填写（hard_gates / scored_dimensions / risk_penalty），不允许 raw JSON
- [ ] ValueDispositionDecision 可 advance_to_package / refine / park / drop
- [ ] TopicPackage(draft) 摘要可见 trace boundary check 结果

### Phase 4 冒烟（v1c）
- [ ] PromotionGateCheck 逐项 pass/fail 可见
- [ ] CommitmentProfile 缺字段时 promote 按钮禁用
- [ ] human-confirm promote → 创建 PaperProjectBridge，论文管理模块可看到对应 paper_id
- [ ] DownstreamFeedback / Recheck panel 显示 append-only 记录

### Phase 5 冒烟（横切）
- [ ] 4 类队列可用；按风险/阻断排序
- [ ] 任意 stage 内打开 TraceDrilldownDrawer，可看到 EvidenceUnit/SearchRun/LLMWorkflowRun 摘要
- [ ] AcceptedRisk / HumanOverride 缺字段不可提交
- [ ] reviewer cards 显示 inline blocker / accepted-risk / recheck badge

### Phase 6 联调
- [ ] 与 T-078 desktop-workbench 在 Sidebar/Topbar 改造上无冲突
- [ ] feature flag 默认开，旧 module 删除分支可独立合入

## Rollout / Backout

### Rollout
1. Phase 1 合并后 feature flag 默认关，灰度开启
2. Phase 2–5 各 phase 单独合并 PR，feature flag 一直可用
3. Phase 6 验收通过后 flag 默认开 + 旧 module 删除 PR

### Backout
- 任一 phase 出问题：设置 `VITE_TOPIC_WORKBENCH_V1ABC=false` 重启即恢复旧 module
- Phase 6 删除旧 module 后若仍需回滚：从分支 `archive/title-card-management-pre-v1abc` 恢复
