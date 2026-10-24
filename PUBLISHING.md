# 发布说明

这个插件**不需要构建**：仓库里的文件就是 magpie 加载的文件。

## 符合 magpie 的 GitHub 发布要求

magpie 文档「发布与上架 → GitHub 标签」的要求，逐条对照：

| 要求 | 本仓库 |
|---|---|
| 仓库打上 `magpie-plugin` topic | 已打（另有 `opencode-plugin`、`chat`） |
| `package.json` 在仓库根目录 | 是 |
| 加载的文件必须提交进仓库（不能只在发布时构建） | 无构建步骤，源码直接提交 |
| 卡片图标来自 `magpie.icon` | `data:image/svg+xml;base64,…`（570 字符） |
| 不能是 fork / archived / magpie-community 仓库 | 独立仓库 |

装法（任选）：

```powershell
magpie plugin add Magiczerowxy/magpie-chat        # GitHub
magpie plugin add ./magpie-chat                   # 本地文件夹
```

## package.json 里与 magpie 有关的字段

| 字段 | 值 | 作用 |
|---|---|---|
| `magpie.page` | `page/index.html` | 侧栏里的「对话」页面 |
| `magpie.page.titles` | `zh / zh-TW / ja` | 多语言页面名 |
| `magpie.icon` | data URI | 发现页卡片与已安装行的图标 |
| `keywords` | 含 `opencode` + `opencode-plugin` | npm 搜索与插件市场识别 |
| `main` | `./index.mjs` | 入口（导出 `{ id, server }`，OpenCode v1 形式） |
| `dependencies` | 无 | 不需要装任何依赖 |

## 发版流程

改 `package.json` 的 `version`，提交并推到 `main`：

```powershell
git add -A
git commit -m "magpie-chat x.y.z: 改了什么"
git push
```

magpie 最多每十分钟查一次 GitHub 仓库；打上 topic 后，仓库出现在
**插件 → 发现 → 非官方插件 · GitHub**。

如果将来发布到 npm，`repository` 已指向本仓库，magpie 会优先从 npm 安装；否则按仓库代码安装。

## 发布前自检（本次已跑）

```powershell
# 1) 入口与页面文件都在
test index.mjs, package.json, page/index.html, page/boot.js, chat/index.html

# 2) 用真实 magpie 从 GitHub 装一遍
magpie plugin add Magiczerowxy/magpie-chat
#   ✓ added Magiczerowxy/magpie-chat
#   Magiczerowxy/magpie-chat (magpie-chat 0.1.0)  on
#     page  Chat (reads nothing)

# 3) 页面能起来、能拿到模型
curl http://127.0.0.1:3477/api/bootstrap
#   models: 18 | library mcp: 4 | version: 0.1.0
```

## 收进官方推荐列表（可选）

想在 **插件 → 发现** 的推荐区出现，需要给
[magpie-community/plugins](https://github.com/magpie-community/plugins) 的 `registry.json`
提一个 PR：

```json
{
  "package": "magpie-chat",
  "name": "Chat",
  "icon": "https://raw.githubusercontent.com/Magiczerowxy/magpie-chat/main/assets/icon.svg",
  "kind": "page",
  "summary": {
    "en": "Chat with magpie's own models, MCP servers, instructions and skills.",
    "zh": "用 magpie 自己的模型、MCP 服务器、指令和技能聊天。"
  }
}
```

`kind` 是 `page`（只有页面的插件），不写 `providers`。
