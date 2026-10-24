# 发布到 npm

## 为什么 npm 是最可靠的路径

magpie 的「搜索插件」走 npm 的 `/-/v1/search`，而 GitHub 列表那条路在你这里会超时：

| 路径 | 实测 |
|---|---|
| `api.github.com` 直连 | 不通（000） |
| `gh-proxy.com` 镜像 | 通（200, 4.6s） |
| magpie 抓 GitHub 的预算 | 8 秒，要读 123+ 个仓库的 package.json → `no answer in 8s` |
| `registry.npmjs.org` | **通（200, 0.7s）** |

## 卡在哪

包名是 `@magpie-community/page-chat`。npm 上 `@magpie-community` 这个 scope 属于 **yetone**（维护者），
我这边没有该组织的发布权限。两个选择：

### A. 拿到 @magpie-community 的发布权限（推荐，名字最正）

请 yetone 在 npm 上把你加进 `@magpie-community` 组织，然后：

```powershell
npm login --registry=https://registry.npmjs.org/
bash scripts/publish-npm.sh
```

### B. 用自己的 scope 发布（立刻可用）

把包名改成 `@Magiczerowxy/page-chat` 或 `magpie-chat`（无 scope）：

```powershell
node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync('package.json'));p.name='magpie-chat';fs.writeFileSync('package.json',JSON.stringify(p,null,2)+'\n')"
npm login --registry=https://registry.npmjs.org/
npm publish --registry=https://registry.npmjs.org/ --access public
```

装法就是 `magpie plugin add magpie-chat`，magpie 的搜索框也能直接搜到。

## 当前 npm token 已失效

`~/.npmrc` 里的 `_authToken` 对 `registry.npmjs.org` 返回 401 / 空响应，
需要重新 `npm login`。另外你的 registry 指向 `registry.npmmirror.com`（只读镜像，不能发布），
发布时必须显式加 `--registry=https://registry.npmjs.org/`。

## 发布后

magpie 的「插件 → 发现 → 搜索」框输入包名即可安装；也可以直接
`magpie plugin add <包名>`。

GitHub 那条路仍然可用，只是要设镜像：

```powershell
$env:MAGPIE_GITHUB_MIRROR='https://gh-proxy.com'
magpie
```
