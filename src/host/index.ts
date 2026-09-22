import Schema from "@deepseek-ai/schemastery";
const z = Schema;
function installSectionCompat(ctx: any, ns: string, schema: any, entry: any, hooks: any) {
  ctx.inject(["settings"], (sctx: any) => {
    if (sctx.settings && typeof sctx.settings.installSection === "function") {
      sctx.settings.installSection(ctx, ns, schema, entry, hooks);
    } else if (sctx.settings && typeof sctx.settings.register === "function") {
      const scope = sctx.settings.register(ns, schema, {
        base: entry,
        ...(hooks.validate ? { validate: hooks.validate } : {}),
      });
      hooks.setSource(() => scope.get());
      hooks.onChange();
      scope.watch?.(() => hooks.onChange());
    }
  });
}
const deepEqualJson = (a: any, b: any) => JSON.stringify(a) === JSON.stringify(b);
const settingsNamespace = (ns: string) => ns as any;
import { MAX_TIMER_DELAY_MS } from "@deepseek-ai/dsh-timeout";
import { RetryPolicySchema, resolveRetryPolicy } from "@deepseek-ai/dsh-llm";
import {
  DEFAULT_USAGE_REQUEST_TIMEOUT_MS,
  GROK_AUTH_COMPLETE_ENDPOINT,
  GROK_AUTH_LOGOUT_ENDPOINT,
  GROK_AUTH_REMOVE_ENDPOINT,
  GROK_AUTH_START_ENDPOINT,
  GROK_AUTH_STATUS_ENDPOINT,
  GROK_AUTH_SWITCH_ENDPOINT,
  GROK_BILLING_URL,
  GROK_CATALOG,
  GROK_CHAT_BASE_URL,
  GROK_DEFAULT_CONTEXT_WINDOW,
  GROK_DEFAULT_MODEL_MAX_TOKENS,
  GROK_DEFAULT_STREAM_IDLE_TIMEOUT_MS,
  GROK_IMAGE_GEN_TOOL_NAME,
  GROK_IMAGINE_ASPECT_RATIOS,
  GROK_IMAGINE_BASE_URL,
  GROK_IMAGINE_MODEL,
  GROK_MODELS_ENDPOINT,
  GROK_MODELS_URL,
  GROK_OAUTH_CLIENT_ID,
  GROK_OAUTH_ISSUER,
  GROK_OAUTH_SCOPE,
  GROK_PACKED_REASONING_TYPE,
  GROK_PROVIDER,
  GROK_RPC_CHANNEL,
  GROK_SAVE_ENDPOINT,
  GROK_SERVER_SEARCH_TOOLS,
  GROK_SETTINGS_NAMESPACE,
  GROK_USAGE_ALL_ENDPOINT,
  GROK_USAGE_ENDPOINT,
  GROK_USAGE_HTTP_PATH
} from "../common/constants.js";
import {
  decodeGrokAccountIdRequest,
  decodeGrokAccountUsageView,
  decodeGrokAccountsUsageReply,
  decodeGrokAuthAccountView,
  decodeGrokAuthCompleteRequest,
  decodeGrokAuthLogoutReply,
  decodeGrokAuthStartReply,
  decodeGrokAuthStatus,
  decodeGrokCatalogModel,
  decodeGrokEmptyRequest,
  decodeGrokModelsReply,
  decodeGrokReasoningEffort,
  decodeGrokSaveRequest,
  decodeGrokSaveResult,
  decodeGrokSettings,
  decodeGrokUsageReply,
  decodeGrokUsageView,
  decodeGrokUsageWindow,
  type GrokCatalogModel
} from "../common/contract.js";
import {
  GROK_4_5_REASONING_EFFORTS,
  GROK_4_6_REASONING_EFFORTS,
  GROK_DEFAULT_REASONING_WIRE,
  GROK_REASONING_WIRES,
  applyGrokReasoningWire,
  grokThinkingLevelMap,
  isGrokReasoningWire,
  officialDefaultEffort,
  officialEffortsFor,
  resolveGrokReasoningWire
} from "../common/reasoning.js";
import {
  GROK_SESSION_FILENAME,
  accountKeyOf,
  activeAccountFrom,
  cloneSession,
  decodeGrokSession,
  decodeGrokSessionStore,
  deleteSession,
  emptyStore,
  findAccountIndex,
  publicAccountId,
  readSession,
  readSessionStore,
  removeAccount,
  resolveGrokSessionPath,
  sameAccount,
  sessionPathForHome,
  statusFromSession,
  statusFromStore,
  storeFromLegacySession,
  switchActiveAccount,
  upsertAccount,
  withActiveAccount,
  writeSession,
  writeSessionStore
} from "./session.js";
import {
  authNetworkHint,
  authRejectionHint,
  createGrokFetch,
  hasActiveProxy,
  isGrokRequest,
  proxyEnvValue,
  proxyLabel,
  resolveProxySetting,
  shouldBypassProxy
} from "./proxy.js";
import {
  completePkceLogin,
  createGrokAuthRuntime,
  discoverOidcEndpoints,
  ensureFreshAccounts,
  ensureFreshSession,
  ensureFreshStore,
  expiresAtFromTokens,
  openSystemBrowser,
  randomUrlSafe,
  removeRuntimeAccount,
  retryable,
  spawnDetached,
  startPkceLogin,
  statusFromRuntime,
  switchRuntimeAccount,
  GROK_CLI_REQUEST_HEADERS
} from "./oauth.js";
import {
  expandPackedGrokReasoningInput,
  filterGrokThinkingStream,
  isDisplayableThinking,
  isGrokPackedReasoning,
  isGrokServerSearchToolCallId,
  packAssistant,
  packGrokThinkingBlocks,
  stripGrokServerSearchToolCalls
} from "./thinking.js";
import {
  fallbackGrokCatalog,
  parseGrokBilling,
  parseGrokModels,
  readAllAccountUsage,
  readGrokModels,
  readGrokUsage
} from "./billing.js";
import {
  GrokAdapter,
  applyOfficialReasoningMetadata,
  classifyGrokTransientError,
  createGrokPiAiAuth,
  createGrokPiAiProfile,
  grokResponsesApi,
  injectGrokServerSearchTools,
  resolveGrokAccessToken,
  toPiAiModel
} from "./adapter.js";
import {
  GROK_PLUGIN_IDENTITY_HEADER,
  extensionOf,
  generateGrokImage,
  grokImageGenTool,
  mediaTypeOf
} from "./image-gen.js";
import { isLoopbackAddress, sendJson } from "./loopback.js";
import {
  GROK_NATIVE_SEARCH_SERVICE,
  grokNativeWebSearch,
  installGrokNativeSearch,
  parseGrokSearchSources
} from "./native-search.js";
import { createGrokRpcHandler, saveDisplayedCatalog } from "./rpc.js";

const DEFAULT_MAX_RETRIES = 2;
export const name = "llm-grok";
export const inject = ["llm"];
const NS = settingsNamespace(GROK_SETTINGS_NAMESPACE);

function resolveModels(models?: GrokCatalogModel[]): GrokCatalogModel[] {
  const seen = new Set<string>();
  return (models ?? GROK_CATALOG).map((model) => {
    if (model.id.length === 0) throw new Error("llm-grok: catalog model ids must be non-empty");
    if (model.name !== undefined && model.name.length === 0) {
      throw new Error(`llm-grok: catalog model "${model.id}" has an empty name`);
    }
    if (seen.has(model.id)) throw new Error(`llm-grok: duplicate catalog model "${model.id}"`);
    seen.add(model.id);
    return {
      id: model.id,
      ...(model.name === undefined ? {} : { name: model.name }),
      ...((model as any).description === undefined ? {} : { description: (model as any).description }),
      ...(model.contextWindow === undefined ? {} : { contextWindow: model.contextWindow }),
      ...((model as any).maxTokens === undefined ? {} : { maxTokens: (model as any).maxTokens }),
      ...(model.thinking === undefined ? {} : { thinking: model.thinking }),
      ...(model.vision === undefined ? {} : { vision: model.vision }),
      ...((model as any).tools === undefined ? {} : { tools: (model as any).tools }),
      ...(model.defaultReasoningEffort === undefined ? {} : { defaultReasoningEffort: model.defaultReasoningEffort }),
      ...(model.reasoningEfforts === undefined ? {} : { reasoningEfforts: model.reasoningEfforts })
    };
  });
}

function resolveAdapterOptions(config: any) {
  const streamIdleTimeoutMs = config.streamIdleTimeoutMs ?? GROK_DEFAULT_STREAM_IDLE_TIMEOUT_MS;
  if (!Number.isFinite(streamIdleTimeoutMs) || streamIdleTimeoutMs <= 0 || streamIdleTimeoutMs > MAX_TIMER_DELAY_MS) {
    throw new Error(`llm-grok: streamIdleTimeoutMs must be a positive finite number no greater than ${MAX_TIMER_DELAY_MS}`);
  }
  return {
    baseURL: GROK_CHAT_BASE_URL,
    models: resolveModels(config.models),
    streamIdleTimeoutMs,
    serverSearch: config.serverSearch === true,
    proxy: typeof config.proxy === "string" ? config.proxy : "",
    retryPolicy: resolveRetryPolicy(
      config.retryPolicy ?? {
        mode: "normal",
        maxRetries: DEFAULT_MAX_RETRIES
      },
      "llm-grok: retryPolicy"
    )
  };
}

const catalogModel = z.object({
  id: z.string().required(),
  name: z.string(),
  description: z.string(),
  contextWindow: z.number().step(1).min(1),
  maxTokens: z.number().step(1).min(1),
  vision: z.boolean(),
  thinking: z.boolean(),
  tools: z.boolean()
});

export const Config = z.object({
  streamIdleTimeoutMs: z.number().min(Number.MIN_VALUE).max(MAX_TIMER_DELAY_MS).default(GROK_DEFAULT_STREAM_IDLE_TIMEOUT_MS),
  models: z.array(catalogModel),
  enableImageGen: z.boolean().default(false),
  serverSearch: z.boolean().default(false),
  proxy: z.string().default(""),
  retryPolicy: RetryPolicySchema
});

export function apply(ctx: any, config: any): void {
  let current = () => config;
  let lastRaw: any;
  let lastGood: any;
  const options = () => {
    const raw = current();
    if (raw === lastRaw && lastGood !== undefined) return lastGood;
    try {
      const next = resolveAdapterOptions(raw);
      lastRaw = raw;
      lastGood = next;
      return next;
    } catch (error) {
      if (lastGood === undefined) throw error;
      lastRaw = raw;
      ctx.logger?.error("llm-grok: keeping the last good configuration after an invalid settings section");
      ctx.logger?.error(error);
      return lastGood;
    }
  };
  options();

  let grokFetch = globalThis.fetch;
  let originalFetch: typeof globalThis.fetch | undefined;
  const patchGlobalFetch = () => {
    if (originalFetch !== undefined) return;
    originalFetch = globalThis.fetch;
    globalThis.fetch = (input: any, init?: any) =>
      isGrokRequest(input) && !shouldBypassProxy(input) ? grokFetch(input, init) : originalFetch!(input, init);
  };
  const unpatchGlobalFetch = () => {
    if (originalFetch === undefined) return;
    globalThis.fetch = originalFetch;
    originalFetch = undefined;
  };
  const applyTransport = () => {
    grokFetch = createGrokFetch(options().proxy, ctx.logger);
    if (hasActiveProxy(options().proxy)) patchGlobalFetch();
    else unpatchGlobalFetch();
  };
  applyTransport();

  const runtime = createGrokAuthRuntime({
    resolveSessionPath: () => resolveGrokSessionPath(ctx),
    fetch: (input: any, init?: any) => grokFetch(input, init)
  });
  const grokNativeSearch = installGrokNativeSearch(ctx, {
    runtime,
    proxy: () => options().proxy
  });
  if (typeof ctx.provide === "function") ctx.provide(GROK_NATIVE_SEARCH_SERVICE, grokNativeSearch);
  else ctx[GROK_NATIVE_SEARCH_SERVICE] = grokNativeSearch;

  const adapter = new GrokAdapter({
    options,
    resolveApiKey: () => resolveGrokAccessToken(runtime),
    resolveAttachments: () => ctx.get("attachments"),
    mapHostPath: hostPath => ctx.get("fs")?.processPathFromHostPath(hostPath)
  });

  ctx.llm.registerConfigurableProviders([
    {
      provider: GROK_PROVIDER,
      displayName: "Grok",
      settingsNs: NS,
      settingsPath: []
    }
  ]);
  const registration = ctx.llm.registerAdapter([GROK_PROVIDER], adapter);
  let registeredPolicy = options().retryPolicy;
  const ensureRegistrationFacts = () => {
    lastRaw = undefined;
    const policy = options().retryPolicy;
    if (deepEqualJson(policy, registeredPolicy)) return;
    registration.replace([GROK_PROVIDER]);
    registeredPolicy = policy;
  };

  const grokRpc = createGrokRpcHandler(runtime);
  ctx.inject(["connection", "webServer"], (connectionCtx: any) => {
    const rpcHandler = async (endpoint: string, payload: unknown, signal?: AbortSignal) => {
      if (endpoint === "settings/save") return saveDisplayedCatalog(ctx, payload);
      return grokRpc(endpoint, payload, signal);
    };

    try {
      connectionCtx.connection.rpc.handle(
        GROK_RPC_CHANNEL,
        rpcHandler,
        { authority: "loopback" }
      );
    } catch {
      // ignore
    }

    // 兼容低版本底座（如 DSH 0.1.2 生产环境）
    // 0.1.2 中 connection.rpc.handle 因 owner 缺少 webServer 而失效，需直接通过 connection.register(connectionCtx, ...) 挂载
    const webServer = connectionCtx.get?.("webServer") ?? connectionCtx.webServer;
    if (webServer && !webServer.prefixes?.has(GROK_RPC_CHANNEL)) {
      if (typeof connectionCtx.connection?.register === "function") {
        connectionCtx.connection.register(connectionCtx, GROK_RPC_CHANNEL, rpcHandler);
      }
    }
  });

  ctx.inject(["webServer"], (web: any) => {
    const webServer = web.get("webServer");
    web.effect(
      () =>
        webServer.register({
          kind: "exact",
          path: GROK_USAGE_HTTP_PATH,
          handler: async (req: any, res: any) => {
            if (!isLoopbackAddress(req.socket?.remoteAddress)) {
              sendJson(res, 403, {
                ok: false,
                code: "remote-not-supported",
                error: "Grok usage is only available on the machine running `dsh web`."
              });
              return;
            }
            if (req.method !== "GET") {
              res.setHeader("allow", "GET");
              sendJson(res, 405, {
                ok: false,
                code: "method",
                error: "Method not allowed."
              });
              return;
            }
            const ac = new AbortController();
            const onClose = () => ac.abort();
            res.on("close", onClose);
            try {
              const result = await grokRpc("usage/read", {}, ac.signal);
              if (ac.signal.aborted) return;
              if (!result.ok) {
                sendJson(res, 200, {
                  ok: false,
                  code: typeof result.error?.code === "string" ? result.error.code : "internal",
                  error: typeof result.error?.message === "string" ? result.error.message : "Grok usage read failed"
                });
                return;
              }
              sendJson(res, 200, {
                ok: true,
                ...result.value
              });
            } catch (error: any) {
              if (ac.signal.aborted) return;
              sendJson(res, 200, {
                ok: false,
                code: "internal",
                error: error instanceof Error && error.message.length > 0 ? error.message : "Grok usage read failed"
              });
            } finally {
              res.off("close", onClose);
            }
          }
        }),
      "dsh-grok-oauth/usage"
    );
  });

  installSectionCompat(ctx, NS, Config, config, {
    setSource: (source: any) => {
      current = source;
    },
    onChange: scheduleCapabilities
  });

  let stopped = false;
  let imageGenFiber: any;
  let imageGenTail = Promise.resolve();
  const reconcileImageGen = async () => {
    if (stopped) return;
    const enabled = current().enableImageGen === true;
    if (enabled === (imageGenFiber !== undefined)) return;
    const previous = imageGenFiber;
    imageGenFiber = undefined;
    if (previous !== undefined) await previous.dispose();
    if (stopped || !enabled) return;
    const fiber = ctx.inject(["tools", "fs", "attachments"], (toolCtx: any) =>
      toolCtx.tools.register(
        grokImageGenTool(toolCtx, { resolveAccessToken: () => resolveGrokAccessToken(runtime) })
      )
    );
    imageGenFiber = fiber;
    Promise.resolve(fiber).catch((error) => {
      if (imageGenFiber === fiber) imageGenFiber = undefined;
      ctx.logger?.error("llm-grok: optional grok_image_gen tool failed to activate");
      ctx.logger?.error(error);
    });
  };

  function scheduleCapabilities() {
    ensureRegistrationFacts();
    applyTransport();
    imageGenTail = imageGenTail.then(reconcileImageGen, reconcileImageGen).catch((error) => {
      ctx.logger?.error("llm-grok: could not apply the updated grok_image_gen configuration");
      ctx.logger?.error(error);
    });
  }
  scheduleCapabilities();

  ctx.effect(() => async () => {
    stopped = true;
    unpatchGlobalFetch();
    await imageGenTail;
    const imageGen = imageGenFiber;
    imageGenFiber = undefined;
    await imageGen?.dispose();
  });
}

// Re-export every symbol that index.js previously exported
export {
  DEFAULT_USAGE_REQUEST_TIMEOUT_MS,
  GROK_NATIVE_SEARCH_SERVICE,
  GROK_4_5_REASONING_EFFORTS,
  GROK_4_6_REASONING_EFFORTS,
  GROK_AUTH_COMPLETE_ENDPOINT,
  GROK_AUTH_LOGOUT_ENDPOINT,
  GROK_AUTH_REMOVE_ENDPOINT,
  GROK_AUTH_START_ENDPOINT,
  GROK_AUTH_STATUS_ENDPOINT,
  GROK_AUTH_SWITCH_ENDPOINT,
  GROK_BILLING_URL,
  GROK_CATALOG,
  GROK_CHAT_BASE_URL,
  GROK_DEFAULT_CONTEXT_WINDOW,
  GROK_DEFAULT_MODEL_MAX_TOKENS,
  GROK_DEFAULT_REASONING_WIRE,
  GROK_DEFAULT_STREAM_IDLE_TIMEOUT_MS,
  GROK_IMAGE_GEN_TOOL_NAME,
  GROK_IMAGINE_ASPECT_RATIOS,
  GROK_IMAGINE_BASE_URL,
  GROK_IMAGINE_MODEL,
  GROK_MODELS_ENDPOINT,
  GROK_MODELS_URL,
  GROK_OAUTH_CLIENT_ID,
  GROK_OAUTH_ISSUER,
  GROK_OAUTH_SCOPE,
  GROK_PACKED_REASONING_TYPE,
  GROK_PLUGIN_IDENTITY_HEADER,
  GROK_PROVIDER,
  GROK_REASONING_WIRES,
  GROK_RPC_CHANNEL,
  GROK_SAVE_ENDPOINT,
  GROK_SERVER_SEARCH_TOOLS,
  GROK_SESSION_FILENAME,
  GROK_SETTINGS_NAMESPACE,
  GROK_USAGE_ALL_ENDPOINT,
  GROK_USAGE_ENDPOINT,
  GrokAdapter,
  applyGrokReasoningWire,
  authNetworkHint,
  authRejectionHint,
  completePkceLogin,
  createGrokAuthRuntime,
  createGrokFetch,
  createGrokPiAiProfile,
  createGrokRpcHandler,
  accountKeyOf,
  activeAccountFrom,
  decodeGrokAccountIdRequest,
  decodeGrokAuthCompleteRequest,
  decodeGrokSessionStore,
  emptyStore,
  decodeGrokAuthLogoutReply,
  decodeGrokAuthStartReply,
  decodeGrokAuthStatus,
  decodeGrokEmptyRequest,
  decodeGrokModelsReply,
  decodeGrokSaveRequest,
  decodeGrokSaveResult,
  decodeGrokSettings,
  decodeGrokAccountUsageView,
  decodeGrokAccountsUsageReply,
  decodeGrokUsageReply,
  decodeGrokUsageView,
  deleteSession,
  ensureFreshAccounts,
  ensureFreshSession,
  ensureFreshStore,
  expandPackedGrokReasoningInput,
  fallbackGrokCatalog,
  filterGrokThinkingStream,
  generateGrokImage,
  grokImageGenTool,
  grokNativeWebSearch,
  grokResponsesApi,
  hasActiveProxy,
  grokThinkingLevelMap,
  injectGrokServerSearchTools,
  installGrokNativeSearch,
  isDisplayableThinking,
  isGrokRequest,
  isGrokPackedReasoning,
  isGrokServerSearchToolCallId,
  officialDefaultEffort,
  officialEffortsFor,
  packGrokThinkingBlocks,
  parseGrokBilling,
  parseGrokSearchSources,
  parseGrokModels,
  readAllAccountUsage,
  readGrokModels,
  readGrokUsage,
  readSession,
  readSessionStore,
  resolveGrokAccessToken,
  resolveGrokReasoningWire,
  resolveGrokSessionPath,
  statusFromSession,
  statusFromStore,
  stripGrokServerSearchToolCalls,
  switchActiveAccount,
  switchRuntimeAccount,
  upsertAccount,
  withActiveAccount,
  writeSession,
  writeSessionStore
};
