# dsh-grok-oauth

DeepSeek Harness 自有、独立维护的 **Grok (xAI) 供应商插件**。

不依赖上游 `dsh-llm-grok`(github 包)。源码就在本目录,由你本地持有,上游更新不会覆盖。

## 功能

- **xAI 订阅 OAuth (PKCE) 登录 / 退出**——走 `auth.x.ai`,不要求 console API key。
- **跨平台打开浏览器**:macOS 用 `open`,Windows 用 `cmd /c start`,Linux 用 `xdg-open` / `sensible-open`(修复了上游只会 `xdg-open`、在 macOS 上无法打开登录页的问题)。
- **代理自适应(仅 Grok 流量)**:只有 `*.x.ai` / `*.grok.com`(登录、Grok 对话、Imagine)走代理,其他模型如 DeepSeek 保持直连——你在国内无需为模型主链路挂代理。默认继承 `HTTPS_PROXY` / `ALL_PROXY` 环境变量(尊重 `NO_PROXY`);也可在设置卡「网络」里显式填 `host:port` / `http://host:port`,或填 `direct` 强制直连。host 端经 undici `ProxyAgent` / `EnvHttpProxyAgent` 走代理,不影响浏览器端授权页;loopback 与 `NO_PROXY` 域名直通。
- **可诊断的失败**:token 交换失败会区分「网络/代理不可达」与「IdP 拒绝(含 HTTP 状态与 error code)」,不再统一显示 `Sign-in could not be completed.`。
- 会话写入 `$DSH_HOME/grok-oauth.json`,自动刷新 token;网络抖动导致刷新失败时**保留会话**,不会悄悄登出。
- 在设置 → LLM 供应商 显示 Grok 卡片:登录状态、模型选择、启用 `grok_image_gen`。
- 模型元数据(grok-4.x)与推理档位沿用。
- **工具循环走 DSH 原生工具(默认)**:不再默认注入 Grok 服务端 web_search / x_search(其结果为加密 tco_* 项、只在下一请求回放,agent 循环拿不到结果,会导致模型写一句计划就停下)。需要 Grok Build 风格服务端搜索时,在设置卡「能力」开启「Grok 服务端搜索(实验)」。

## 常见网络环境

| 环境 | 配置 |
|---|---|
| 已设 `HTTPS_PROXY` / `ALL_PROXY` | 无需配置,自动生效 |
| 代理没有写入环境变量(如 Clash TUN + 系统代理关闭) | 设置卡「网络」填 `127.0.0.1:7897`(Clash 混合端口)等 |
| 想绕过企业代理直连 | 设置卡「网络」填 `direct` |
| 只有 SOCKS5 代理 | 先在本地把 SOCKS 桥接成 HTTP(或将 `socks5://` 换成本地 HTTP 中转),再按上表配置 |

## 安装

源码在 `~/Documents/dshspace/plugins/dsh-grok-oauth`。

```bash
# 开发机（symlink，改源码立刻生效）
dsh plugin --profile web add link:$HOME/Documents/dshspace/plugins/dsh-grok-oauth

# 新电脑
dsh plugin --profile web add github:JackAIStudio/dsh-grok-oauth
```

然后重启 `dsh web`。

开发机用 `link:` 时，还要在插件目录补上 host 侧 peer（否则 `dsh web` 会因找不到 `@deepseek-ai/schemastery` 起不来）：

```bash
cd "$HOME/Documents/dshspace/plugins/dsh-grok-oauth"
npm install --omit=dev --ignore-scripts   # 装 undici 等自身依赖
./scripts/link-host-peers.sh             # 把 ~/.dsh/profiles 里的 DSH peer 链回来
```

`node_modules/` 已 gitignore，不要提交。`npm install` 会清掉 peer 软链，装完后重新跑一次 `link-host-peers.sh`。

## 目录结构

- `index.js` —— host 侧:GroK 供应商适配器 + OAuth/PKCE 登录 + RPC + 用量 + 图片生成。
- `client.js` —— 客户端 UI(Grok 卡片、模型选择)。
- `cordis.patch.yml` —— 把 `llm-grok` 这一 loader 行注册到本 bundle。

## 上游来源与许可

逻辑/结构基于 MIT 授权的 `NOirBRight/dsh-llm-grok`(v0.2.7)改作;保留 MIT 许可与版权声明。
