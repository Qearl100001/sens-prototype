---
name: sens-prototype
description: 将 PM 提供的 PRD、现有页面截图和可选局部 Figma 转换为使用 Sens 资产的可交互原型。用于需求理解、页面规格、组件匹配、模拟状态和原型生成；不用于修改上游 sens-preview 规则或组件。
---

# Sens Prototype

为 PM 生成可供设计师继续调整的 Sens 交互原型。产物是业务半成品，不代表生产实现，设计师保留最终审核权。

## 开始前

1. 阅读项目根目录 `AGENTS.md`、`README.md` 和 `contracts/prototype-spec.schema.json`。
2. 读取当前需求已有的 `prototype-spec.json`、输入引用、原型和审核记录；不存在时建立最小规格。
3. 从已安装的 `@sens/prototype-kit` 公开入口与 `catalog.json` 查找能力，不从同级 `sens-preview` 源码导入。

## 来源裁决

- PRD决定业务目标、限制、流程和结果。
- 明确的局部 Figma 决定该局部的新视觉和交互。
- 截图只证明可见上下文和保留区域，不证明隐藏状态。
- 未被前述来源覆盖的布局、样式和组件行为遵循固定版本 Sens。
- 冲突和缺口写入规格；只追问会改变业务含义、页面范围或交付结果的问题。

## 工作流

1. Phase A 先归档输入来源，提取业务目标、用户与角色、核心任务、数据和内容要求、页面范围以及必须保留的区域。
2. 将需求区分为 `explicit`、`confirmed` 和 `inferred`。推断需求必须标明 readiness 影响并关联问题；影响页面边界、入口或核心状态的推断在 PM 确认前不得进入 `ready`。
3. 按页确认所属产品、侧导航路径、页面层级、入口、上级页面、返回目标和深链策略，写入 `informationArchitecture.nodes`。不得根据功能名称自行加入侧导航。
4. 明确每个页面的核心状态，并用 `flows` 把有序 interaction 组成主流程和异常流程。异常流程不适用时必须在 readiness 中说明原因。
5. 读取固定版本包的 `catalog.json`，严格按“页面样板 → 复合组件 → 基础组件 → Token”完成匹配；把选择结果写入 `designSystem.templateRefs`、`compositeRefs` 和 `mappings`。
6. 列出阻塞和非阻塞问题，并将页面边界、入口返回、核心状态、主/异常流程、数据内容、范围、Sens 匹配和验收计划的 PM 结论写入 `readiness`。
7. 只有 `readiness.decision=confirmed`、核心确认项已确认、没有开放阻塞问题且没有阻塞性推断时，规格才能从 `intake` 进入 `ready`。运行 `npm run check:specs` 验证该门槛。
8. 已登记的样板或复合组件必须直接消费公开资产，禁止复制其 DOM、布局、状态或样式。正式资产缺失时写入 `gaps`，需求级 Token 组合必须标明替换条件。
9. 使用模拟数据实现主路径和 PRD 明确要求的成功、失败及本地校验状态。
10. 运行规格门禁、资产目录校验、类型检查、构建和浏览器检查；没有实际证据的项目标记为 `not_run` 或 `blocked`。
11. 交付源码、构建产物、可访问预览和审核记录，并保持设计状态为 `awaiting_designer`，直到设计师明确批准。

## 边界

- 不自动修改 `sens-preview`。必要的上游能力缺口单独报告并等待授权。
- 不复制 Sens 组件源码到业务原型，不猜测不存在的公开 API。
- 已登记样板或复合组件的公开出口不足以消费时，记录上游缺口并判定为 `blocked`；不得根据相似外观在业务层复刻。
- 不把临时本地地址描述为已发布链接。
- 不把构建成功当成视觉或交互验收通过。
