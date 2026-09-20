# 设计师审核记录：feature-selection

> 当前状态：`awaiting_designer`。自动验收不能代替设计师签字，也不能把该状态自动改成通过。

## 审核对象

- 原型：`feature-selection`
- 规格：`../prototype-spec.json`
- 线上预览：<https://qearl100001.github.io/sens-prototype/>
- 本轮版本：`p0.6-p0-6b-2026-09-20`
- 自动验收：`../acceptance/2026-09-20-p0-6b.md`

## 审核结论

- 审核人：待填写
- 审核时间：待填写
- 决策：`awaiting_designer`
  - 可选值：`approved` / `approved_with_followups` / `changes_requested`

## 五类检查

| 类别 | 状态 | 设计师检查重点 | 证据/备注 |
| --- | --- | --- | --- |
| 需求 | `not_run` | PRD 与截图要求是否被正确理解，是否遗漏关键状态 | 待填写 |
| Sens | `not_run` | 是否使用正确的 Sens 基础组件、复合组件、Token 与页面骨架 | 待填写 |
| 视觉 | `not_run` | 字体层级、间距、对齐、抽屉尺寸、浮层和各宽度下布局 | 待填写 |
| 交互 | `not_run` | 主流程、失败态、放弃确认、保存反馈与按钮是否都可操作 | 待填写 |
| 交付 | `not_run` | 链接、构建、静态资源、独立运行与验收证据是否完整 | 待填写 |

## 问题清单

| ID | 严重度 | 页面/状态 | 问题 | 证据 | 负责人 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| 待填写 | blocker / major / minor / suggestion | 待填写 | 待填写 | 截图或链接 | 待填写 | open |

## 签字规则

- `approved`：无 blocker/major，且五类检查均完成。
- `approved_with_followups`：无 blocker；遗留项不阻塞 PM 继续迭代，并已明确负责人。
- `changes_requested`：存在 blocker/major，或关键流程、Sens 组件、布局规则与输入资料不一致。
- 审核结论写回时，应同时更新 `prototype-spec.json > review.designStatus` 与 `designerDecision`，保留问题证据，不覆盖自动验收结果。
