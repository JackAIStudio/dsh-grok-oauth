# dsh-grok-oauth

DeepSeek Harness 自有、独立维护的 **Grok (xAI) 供应商插件**。

不依赖上游 `dsh-llm-grok`(github 包)。源码就在本目录,由你本地持有,上游更新不会覆盖。

## 功能

- **xAI 订阅 OAuth (PKCE) 登录 / 退出**——走 `auth.x.ai`,不要求 console API key。
- **跨平台打开浏览器**:macOS 用 `open`,Windows 用 `cmd /c start`,Linux 用 `xdg-open` / `sensible-open`(修复了上游只会 `xdg-open`、在 macOS 上无法打开登录页的问题)。
- 会话写入 `$DSH_HOME/grok-oauth.json`,自动刷新 token。
- 在设置 → LLM 供应商 显示 Grok 卡片:登录状态、模型选择、启用 `grok_image_gen`。
- 模型元数据(grok-4.x)与推理档位沿用。

## 安装(已接入当前 profile)

`~/.dsh/profiles/web/package.json` 依赖与 bundles 均已指向本插件:

```json
"dependencies": { "dsh-grok-oauth": "file:/Users/jkw/Documents/dshspace/2026-8-26/dsh-grok-oauth" }
"dsh.profile.bundles": [ ... "dsh-grok-oauth" ... ]
```

## 改代码后如何生效

`file:` 依赖会把源码**打包复制**进 `node_modules`,所以修改源码后需要:

```bash
cd ~/.dsh/profiles/web
pnpm install --force     # 从源目录重新打包复制
dsh-web --stop && dsh-web --no-open   # 重启,加载新代码
```

> 注意:直接改 `node_modules/dsh-grok-oauth/` 里的文件会被下次 `pnpm install` 覆盖;请改本源目录。

## 目录结构

- `index.js` —— host 侧:GroK 供应商适配器 + OAuth/PKCE 登录 + RPC + 用量 + 图片生成。
- `client.js` —— 客户端 UI(Grok 卡片、模型选择)。
- `cordis.patch.yml` —— 把 `llm-grok` 这一 loader 行注册到本 bundle。

## 上游来源与许可

逻辑/结构基于 MIT 授权的 `NOirBRight/dsh-llm-grok`(v0.2.7)改作;保留 MIT 许可与版权声明。
