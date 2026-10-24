# magpie-chat UI 重设计规格

## 目标
让对话页看起来像 magpie 原生页面，不是套了个网页 UI。所有像素值、变量、组件都直接抄 magpie 的 app.css。

## 设计令牌（复制自 magpie app.css，不要用别的色值）
见 _magpie_docs/design-tokens.txt（第一屏 4.2KB 是完整的 :root 浅色 + @media dark + data-theme dark/light 覆盖）。全部 --bg/--card/--card-2/--pill/--pill-hover/--seg-track/--seg-thumb/--line/--line-2/--fg/--fg-2/--muted/--faint/--accent/--accent-soft/--accent-fg/--green/--green-soft/--red/--red-soft/--amber/--amber-soft/--sel/--pop-bg/--shadow/--font/--code 都要支持。字体栈照抄。正文 13px，按钮 12.5px，meta 11-12px。

## 布局（贴合 magpie 的 Sessions/Library 页，不要再用「网页侧边栏 + 顶栏 + 气泡」）

左侧竖排会话列表（仿 Library 的 pill 子导航）：
- 宽 176px，背景 --bg，右缘 1px --line
- 顶部一行小标题「对话」+ 新建按钮（icon pill）
- 每条会话是一个 pill：高 26-30px，radius 6px，选中态背景 --card + box-shadow var(--seg-edge)，hover 背景 --pill
- 每条只显示标题 + 相对时间，不要加号图标橙色徽章

主区：
- 没有顶栏。顶部一行 pill 工具栏（仿 Sessions 页顶的过滤 pills）：模型 pill（点开是下拉）、思考强度 pill、设置 icon pill、新建 icon pill。
  - pill 样式：background var(--pill)，hover var(--pill-hover)，radius 6px，高 24px，padding 0 10px，font-size 12.5px，color var(--ctl-fg)，激活/有值时 color var(--fg)
  - 下拉是 popover：background var(--pop-bg)，backdrop-filter blur，radius 10px，box-shadow var(--shadow)，选项 hover var(--sel)，选中 var(--sel) + 加粗
- 消息区：不要气泡。每轮对话是一个区块，仿 magpie 的 row 样式：
  - 用户消息：左侧小标签「你」（11px, --muted），正文直接流式排版，无背景框
  - 助手消息：左侧小标签用模型显示名（11px, --muted），正文 markdown 流式排版，无背景框
  - 轮与轮之间用 1px --line-2 hairline 分隔（border-top）
  - 工具调用卡片：折叠 details，1px --line 边框，radius 9px，背景 --bg（像 .sess-talk）
  - 思考过程：折叠 details，文字颜色 --fg-2，1px --line-2 左边框
  - 代码块：background --card-2，1px --line-2，radius 7px，font --code
- 底部输入框：一个 field 容器（仿 magpie .field）：
  - background var(--card)，border 1px solid var(--line)，radius 12px，内部 padding 10px 12px
  - textarea 无边框透明背景，placeholder 色 --faint
  - 发送按钮：主按钮样式 —— height 24px，padding 0 12px，radius 6px，background var(--accent)，color var(--accent-fg)，font-size 12.5px；disabled 时 opacity .5
  - 停止时同色但内容是 ■ 图标
- 设置：不用右抽屉。点设置 icon pill 弹出一个 popover 面板（仿 magpie 的 pop/编辑面板）：
  - position absolute，锚在按钮下方右侧，width min(320px, calc(100vw - 32px))，max-height 70vh 可滚
  - background var(--pop-bg)，backdrop-filter blur(18px)，radius 10px，box-shadow var(--shadow)，padding 12px 14px
  - 内部用 magpie 的 field/row 样式：label 左 + 控件右，hairline 分隔
  - 点面板外或 Esc 关闭

## 组件细节
- 开关（switch）：width 28px height 16px，track --pill，on 时 --accent，thumb 12px 圆形 --card，on 时 translateX(12px)
- select/自定义下拉：统一用 popover 模式，不用原生 <select>（原生 <select> 样式不搭）
- 空态：「开始一段对话」居中，标题 14px --fg，副文 12px --muted，下方 3 个建议 pill（--pill 背景）
- 滚动条：细条，::-webkit-scrollbar width 8px，thumb color-mix(in srgb, var(--fg) 18%, transparent)

## 硬约束（和之前一样）
- 无 localStorage/sessionStorage/indexedDB/cookie，状态全部 /api/*
- 无外部 CDN/网络字体/图标；图标全部内联 SVG
- 模型输出必须 HTML 转义，自实现最小 Markdown
- 主题：?theme=dark|light 优先于 prefers-color-scheme；light/dark 两组变量都从 magpie app.css 抄，不要自己配色
- 页面内 0 个 iframe
- 按钮字体、字号、高度全部按 magpie 的：12.5px / 24px / 6px radius

## 验证要求
- node --check chat/app.js 通过
- 用 playwright 起假后端跑一遍，截图：浅色空态、浅色对话中（含思考块展开）、深色对话中、设置 popover 打开
- 报告里贴截图路径
