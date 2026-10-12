# 流任务 P1 设计师审核交接

日期：2026-09-21
对象：`examples/stream-task/prototype`
自查角色：主 Agent 同宿主自查
设计状态：`awaiting_designer`

## 当前结论

当前原型已达到进入设计师集中审核的条件。用户对当前视觉还原度的体感约为 80%；该数字仅用于表达审核阶段，不等同于设计签字或自动验收分数。

本轮没有修改页面代码或上游 Sens 资产，只补充审核入口和真实运行证据。设计师未给出明确决策前，`prototype-spec.json > review.designStatus` 保持 `awaiting_designer`。

## 自动检查结果

| 类别 | 状态 | 证据 |
| --- | --- | --- |
| 需求 | `pass` | 列表、创建、预览、详情、编辑、复制和主状态闭环已实现；需求与来源引用见 `../prototype-spec.json`。 |
| Sens | `pass` | `npm run check:sens`：9/9 通过；业务源码仅从 `@sens/prototype-kit 0.1.0-p0.6` 消费正式出口。 |
| 交互 | `pass` | `npm run test:review`：14 通过、22 个按配置跳过、0 失败；跳过项为只需在 1440px 执行一次的重复场景。 |
| 视觉 | `not_run` | 已生成 1440px 关键状态截图，但未获得设计师最终视觉结论。 |
| 交付 | `pass` | `npm run build` 通过；`dist` 已更新。未获授权发布，因此无公开预览链接。 |

构建仍会提示主 JavaScript 产物约 3.37 MB；这是交付风险，不影响本轮设计审核入口。

## 建议审核路径

1. 列表：检查 Tab 节奏与通栏分割线、200px 搜索框、状态色、操作列与“更多”菜单。
2. 删除确认：检查小型二次确认的按钮尺寸、排列、文案和浮层位置。
3. 创建初始态：检查页面左右 24px 留白、右侧锚点、禁用态与区块节奏。
4. 来源和字段映射：检查两列对齐、标题字号字重、标签与输入框间距、映射图标。
5. 执行规则与报警：检查标题/正文 Token、单选/复选对齐、Hash 标签中心线和报警卡片留白。
6. 创建后详情：检查回显信息、只读层级、顶部操作与各分区密度。

## 关键状态证据

| 编号 | 状态 | 截图 |
| --- | --- | --- |
| 01 | 流任务列表 | `screenshots/2026-09-21/01-list-loaded-1440.png` |
| 02 | 列表删除确认 | `screenshots/2026-09-21/02-list-delete-confirm-1440.png` |
| 03 | 创建初始态 | `screenshots/2026-09-21/03-create-initial-1440.png` |
| 04 | 来源、目标与字段映射 | `screenshots/2026-09-21/04-create-field-mapping-1440.png` |
| 05 | 任务执行规则 | `screenshots/2026-09-21/05-create-execution-1440.png` |
| 06 | 报警监控 | `screenshots/2026-09-21/06-create-alarm-1440.png` |
| 07 | 创建成功后详情 | `screenshots/2026-09-21/07-detail-created-1440.png` |

## 待设计师判定

- 13 个 Figma 状态与当前原型的字体层级、间距、对齐、浮层和整体密度是否可接受。
- 当前页面对 Sens 基础组件的组合方式是否符合正式产品的视觉语义。
- 仅在当前原型局部处理的对齐问题，是否允许留在本需求，或需要单独进入 Sens 候选队列。

## Sens 能力缺口（本轮不改上游）

1. 固定资产包未登记 Tabs、Modal、Alert、状态 Tag 和日期范围选择器。
2. `TableShell` 未完整封装业务表头、筛选器、状态单元格和操作列组合。
3. 未登记单页锚点/步骤导航、Hash 字段有序拖拽和长表格唯一吸顶表头模式。
4. 当前固定版本 `SensDropdownButton` 存在 inline baseline 问题，原型只在表格操作列做了局部居中。
5. 运行记录与运行日志尚无完整页面规格。

## 本轮明确排除

- 真实 Kafka、Schema、任务调度、权限、Licence 和日志服务。
- 运行记录和运行日志的完整页面。
- P5 快捷筛选、列目设置、真实数据预览和外部连接详情。
- 上游 `sens-preview` 修改、国际化文案、真实文件下载。

## 审核后处置

- `blocker` / `major`：优先修复并重新回归。
- `minor` / `suggestion`：标记当前需求、Sens 候选或本期接受。
- 只有设计师明确给出结论后，才更新 `prototype-spec.json > review.designStatus` 与 `designerDecision`。
