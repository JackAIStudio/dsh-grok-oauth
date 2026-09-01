# dsh-grok-oauth 仓库与 Agent 维护规范（AGENTS）

> 本文件是本项目的**工程化与代码维护硬性规范**。
> 所有人类开发者与 AI Agent 在修改、重构或新增本插件功能时，**必须严格遵守以下规则**。

---

## 1. 核心铁律（必须遵守）

1. **严禁直接修改根目录的构建产物（`index.js` 与 `client.js`）**：
   - 根目录的 `index.js`（Host 端）和 `client.js`（Web 端）是由构建脚本自动生成的 bundle 产物。
   - **所有代码改动必须在 `src/` 目录下进行**。
   - 修改源码后，必须运行 `pnpm build` 重新生成产物。

2. **单文件体积与拆分红线（严禁单文件再次膨胀）**：
   - **单文件行数上限**：单个源码文件建议控制在 **50 ~ 300 行**以内，绝对**不得超过 400 行**。
   - **禁止在单个文件无限追加代码**：如果新增功能或组件逻辑超过 100 行，必须独立新建文件（如新建 `src/client/components/YourFeature.tsx` 或 `src/host/your-service.ts`），然后在入口处引入。
   - **单一职责原则（Single Responsibility）**：一个文件只做一件事（如：一个独立组件、一组特定的 API 编解码、一个 OAuth 流程分支）。

3. **修改后的闭环三步体验收**：
   每次修改完 `src/` 源码后，必须执行以下三条命令进行验证：
   ```bash
   pnpm build      # 1. 重新打包生成 index.js 和 client.js
   pnpm typecheck  # 2. TypeScript 严格类型检查（必须 0 错误）
   pnpm test       # 3. 运行自动化冒烟测试（必须全绿通过）
   ```

---

## 2. 目录架构与职责划分

```
src/
├── common/                  # 前后端共享层（纯 TS/JS，零环境依赖）
│   ├── constants.ts         # 共享常量（RPC 频道、Endpoint 名、默认模型与比例）
│   ├── contract.ts          # 数据接口定义与安全解码函数（Decoders）
│   └── reasoning.ts         # Reasoning Wire 映射与思考档位计算
│
├── host/                    # 后端 Node.js 宿主插件模块
│   ├── types.ts             # Host 内部数据结构与接口
│   ├── session.ts           # grok-oauth.json 读写与多账号会话管理
│   ├── oauth.ts             # PKCE 生成、Token 刷新、跨平台浏览器唤起
│   ├── loopback.ts          # 本地 OAuth 回调 HTTP 服务
│   ├── proxy.ts             # Undici 代理探测、网络重试与 fetch 包装
│   ├── thinking.ts          # 思维链打包/解包与 Server Search 工具过滤
│   ├── billing.ts           # 额度与模型目录解析（parseGrokBilling、models-v2）
│   ├── adapter.ts           # Pi-AI 适配器对接与 GrokAdapter 类实现
│   ├── image-gen.ts         # Grok Imagine 生图工具（grok_image_gen）
│   ├── rpc.ts               # RPC 请求路由与分发处理
│   └── index.ts             # Cordis 插件入口（apply、Config、生命周期装配）
│
└── client/                  # 前端 Web UI 模块（React 18）
    ├── locales.ts           # 中英文多语言字典 (zh / en)
    ├── index.tsx            # Client 插件入口与 Slot/路由注入
    └── components/          # 细粒度 UI 组件（单组件单文件）
        ├── BrandMark.tsx    # Grok 矢量 Logo
        ├── Icons.tsx        # 图标集合与动画样式
        ├── SortableList.tsx # 模型列表拖拽排序
        ├── UsageElements.tsx# 额度进度条、刷新按钮、骨架屏
        ├── AccountList.tsx  # 多账号列表与切换/删除面板
        ├── GrokModelPicker.tsx # 账户模型同步与选择弹窗
        ├── UsageChip.tsx    # 对话框/底部状态栏额度胶囊
        ├── GrokAuthSection.tsx # 设置页独立导航
        └── GrokPluginCard.tsx  # 设置页主交互卡片
```

---

## 3. 分层开发准则

### 1. 共享协议层 (`src/common/`)
- 仅放置前后端共用的常量、类型、解码器。
- **严禁引入环境专属模块**（不要 import `node:*`、不要 import `react`、不要 import `document`/`window`）。
- 数据解析必须使用防越界、防泄密的安全解码器（Decoders），严禁把包含 Token 的敏感对象直接穿透到前端。

### 2. 后端 Host 模块 (`src/host/`)
- 跨平台路径严禁写死 `/Users/...` 或 `C:\...`，必须使用 `node:path`、`os.homedir()` 或 `$DSH_HOME`。
- 跨平台打开浏览器必须保持对 macOS (`open`)、Windows (`start`)、Linux (`xdg-open` / `sensible-open`) 的全兼容。
- 代理逻辑必须严格保持**仅对 `*.x.ai` 和 `*.grok.com` 生效**，不得干扰其它 LLM 提供商或本地 loopback 流量。

### 3. 前端 UI 组件 (`src/client/`)
- 所有用户可见文案必须在 `src/client/locales.ts` 中维护中英文对照，禁止在 JSX 组件中硬编码中文或英文。
- 复杂 UI 必须拆分成子组件放入 `src/client/components/`，每个组件文件尽量保持在 100~200 行内。
- 保持深色/浅色模式视觉对齐，统一使用 DSH CSS 变量（如 `var(--dsw-alias-border-l2)`、`var(--dsw-alias-bg-layer-1)` 等）。

---

## 4. 常见任务指引（修改代码时去哪找？）

- **调整多账号切换/存储逻辑** → `src/host/session.ts` + `src/client/components/AccountList.tsx`
- **调整 SuperGrok 额度计算或解析** → `src/host/billing.ts` + `src/client/components/UsageElements.tsx`
- **修改底部/输入框额度芯片显示** → `src/client/components/UsageChip.tsx`
- **调整代理探测与网络提示** → `src/host/proxy.ts`
- **修改 Grok 4.6 思考链/Reasoning 档位** → `src/common/reasoning.ts` + `src/host/thinking.ts`
- **调整生图工具参数或文案** → `src/host/image-gen.ts`
- **修改设置页文案** → `src/client/locales.ts`
