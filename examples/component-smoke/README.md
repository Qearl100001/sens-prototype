# 独立组件验证
这是 P0-3 的技术验证工程，不是正式 PRD 页面，也不是产品壳样板。

## 运行
安装 Node.js 和 npm 后，在本目录执行：
```sh
npm ci
npm run dev
npm run build
npm run preview
```

仅依赖 vendor 中的固定版本 Sens 安装包和 npm 依赖；不需要 sens-preview 源码或其开发服务。构建产物为 dist，须经 HTTP 静态服务访问，不承诺双击 HTML 可用。未发布外网。

## 演示
创建 → 空值提交（字段下报错）→ 输入名称 → 提交 → 创建成功提示且表格新增。
取消、返回、Esc 均放弃未提交草稿；重置恢复初始记录。数据仅在内存中，刷新恢复初始状态。此演示不定义正式业务的退出挽留策略。

## 来源与边界
用户确认的组件接入验证范围；固定依赖 @sens/prototype-kit 0.1.0-p0.2。
按钮、表格、表单、输入、抽屉、标题栏及提示来自该包。
规则可在安装后的 node_modules/@sens/prototype-kit/rules/src/design-system/components/base 查阅。
不直接导入 antd，不重写 Sens 控件；页面无新增颜色、间距、圆角、阴影值。reset.css 仅归零浏览器默认外边距。
尚无完整导航、正式布局骨架或自动生成能力；不等同于 Figma 还原验收。验收见 acceptance.md。
