# P0-3 独立组件工程验收

日期：2026-09-16。阶段：P0-3｜第二步收尾。
对象：component-smoke，Sens 安装包 0.1.0-p0.2。
方式：同一 Agent 使用 Playwright + Chrome 自查，不是独立审核。设计师状态：awaiting_designer。

## 当前结论

- 独立安装、TypeScript 检查与 Vite 生产构建通过，产出 dist。
- Playwright 的 11 项功能与视口检查全部通过。此前浏览器连接受阻，后经用户授权改用 Playwright 完成验证。
- 红框复验通过；撤销此前因颜色过渡未结束的截图造成的灰框误判，没有为此修改组件。
- 仅代表最小演示通过本批检查，不代表全量组件状态、主题组合、正式 PRD 或 Figma 还原全部通过。

## 分项验收

| 类别 | 结果 | 边界 |
| --- | --- | --- |
| 需求 | 最小演示路径通过 | 无真实业务后端 |
| Sens 使用 | 调用方式与错误边框已核对，截图已检查 | 全量组件状态、主题与完整布局未验 |
| 交互 | 本批 11 项自动检查通过 | 非全量交互验收 |
| 交付 | 独立构建和本机 HTTP 加载通过 | 未发布团队链接；仍有 favicon 404 和包体积告警 |

## 原始测试及补充复验

[原始报告](acceptance-evidence/2026-09-16/report.json)保留当时结果，11 项为：初始渲染；创建及必填校验；保存更新表格与成功提示；取消；返回；Esc；重置；1280、1440、1920 三个视口；刷新恢复初始数据。

取消、返回、Esc 检查还覆盖草稿不保存、重新打开为空、焦点返回创建按钮。视口检查覆盖抽屉未越界和页面无横向溢出，不等同于完整视觉评分。

无 pageerror。原始报告 failedRequests 为空，但 console 有资源 404；后续单独定位为 /favicon.ico，因此不能称所有资源均无错误。

红框补充测试采用 toHaveCSS 等待颜色稳定：报错边框达到 rgb(229, 69, 69)，对应 Sens warning-color；有效输入并失焦后恢复 rgba(0, 21, 64, 0.16)。两项断言通过，[稳定红框截图](acceptance-evidence/2026-09-16/error-settled.png)已查看。

补充断言和 favicon 定位来自本次会话后续命令输出，不在原始 report.json 中；不改写原始报告。早期 validation.png、error-detail.png 与视口截图处于过渡时序，不能单独用于判断稳定边框颜色。

## 证据

- [原始测试脚本](acceptance-evidence/2026-09-16/check.mjs)：含当时本机运行时和临时输出路径，仅为历史证据，不是可移植的团队测试入口。
- [初始页面](acceptance-evidence/2026-09-16/initial.png)
- [保存成功](acceptance-evidence/2026-09-16/saved.png)
- [1280](acceptance-evidence/2026-09-16/viewport-1280.png)、[1440](acceptance-evidence/2026-09-16/viewport-1440.png)、[1920](acceptance-evidence/2026-09-16/viewport-1920.png)

## 工程与样式边界

固定版本包来自 vendor，依赖锁定于 package-lock.json。业务只从 @sens/prototype-kit 消费 Sens 能力，无直接 antd 导入、同级 sens-preview 源码引用或组件复制。本批没有关闭用户的 sens-preview 服务做停服试验，不把独立依赖检查冒充停服实测。

页面无新增 hex、rgba、px、.ant-* 覆盖或 !important；reset.css 仅做根节点默认外边距归零和最小高度归一化。颜色、间距、字体、圆角、阴影由现有 Sens 组件的 Token/helper 承担。本次仅更新记录并归档证据，未改页面、组件或 Token。

## 保留问题

- favicon.ico 404，不阻断本批业务操作，本轮未修复。
- 生产脚本约 2.92 MB，gzip 约 1.06 MB，存在 chunk 体积告警，后续需评估图标与依赖裁剪。
- 构建出现 antd 的 use client 指令忽略告警；浏览器实测未捕获脚本异常。Sens 内部既有 antd 和历史覆盖样式未重构。
- 未验全量 hover/active/disabled、主题组合、完整焦点陷阱、全量图标和多浏览器兼容性。
- 不含完整产品导航与布局，不作为正式业务还原结果。
- 数据仅在内存中，无后端、跨设备保存或公开发布；静态产物需 HTTP 服务，不承诺双击 HTML。

## 下一步

仍在 P0-3：先整理标准导航与布局骨架的提取方案、影响文件和验收清单，经确认后实施。P0-4 真实 PRD 试点尚未开始。
标题栏出口遗漏提示未来资产登记应检查组合依赖；本批仅记录，不自动修改上游规则。
