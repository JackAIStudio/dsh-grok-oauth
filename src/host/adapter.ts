import * as piAi from "@earendil-works/pi-ai";
import { createProvider } from "@earendil-works/pi-ai";
import * as openAIResponses from "@earendil-works/pi-ai/api/openai-responses";
import { LlmAdapter, LlmError, ReasoningEffortId } from "@deepseek-ai/dsh-llm";
import { PiAiAdapter } from "@deepseek-ai/dsh-llm-pi-ai";
import { isRecord, type GrokCatalogModel } from "../common/contract.js";

function openAIResponsesApi() {
  if (typeof (piAi as any).openAIResponsesApi === "function") {
    return (piAi as any).openAIResponsesApi();
  }
  return openAIResponses;
}
import {
  GROK_CATALOG,
  GROK_CHAT_BASE_URL,
  GROK_DEFAULT_CONTEXT_WINDOW,
  GROK_DEFAULT_MODEL_MAX_TOKENS,
  GROK_PROVIDER,
  GROK_SERVER_SEARCH_TOOLS
} from "../common/constants.js";
import {
  applyGrokReasoningWire,
  grokThinkingLevelMap,
  isGrokReasoningWire,
  officialDefaultEffort,
  officialEffortsFor
} from "../common/reasoning.js";
import { expandPackedGrokReasoningInput, filterGrokThinkingStream } from "./thinking.js";
import { GROK_CLI_REQUEST_HEADERS, ensureFreshSession, type FullGrokAuthRuntime } from "./oauth.js";
import { GROK_PLUGIN_IDENTITY_HEADER } from "./image-gen.js";
import { accountKeyOf, readSession } from "./session.js";

function toolType(tool: unknown): string | undefined {
  if (!isRecord(tool)) return undefined;
  return typeof tool["type"] === "string" ? tool["type"] : undefined;
}

function toolName(tool: unknown): string | undefined {
  if (!isRecord(tool)) return undefined;
  return typeof tool["name"] === "string" ? tool["name"] : undefined;
}

function occupiesServerTool(tool: unknown, type: string): boolean {
  return toolType(tool) === type || toolName(tool) === type;
}

export function injectGrokServerSearchTools(payload: unknown): unknown {
  if (!isRecord(payload)) return payload;
  const existing = payload["tools"];
  const tools = Array.isArray(existing) ? [...existing] : [];
  for (const extra of GROK_SERVER_SEARCH_TOOLS) {
    if (!tools.some((tool) => occupiesServerTool(tool, extra.type))) {
      tools.push({ type: extra.type });
    }
  }
  return {
    ...payload,
    tools
  };
}

function catalogFor(model: { id: string; reasoning?: boolean }, models: GrokCatalogModel[]): GrokCatalogModel {
  return (
    models.find((entry) => entry.id === model.id) ?? {
      id: model.id,
      thinking: model.reasoning
    }
  );
}

function withGrokResponsesBody(
  streamFn: (model: any, context: any, options: any) => any,
  models: GrokCatalogModel[],
  serverSearch?: boolean
) {
  return (model: any, context: any, options: any) => {
    const original = options?.onPayload;
    return streamFn(model, context, {
      ...options,
      onPayload: async (payload: any, nextModel: any) => {
        const next = original === undefined ? payload : await original(payload, nextModel);
        const body = next === undefined ? payload : next;
        const wired = applyGrokReasoningWire(body, catalogFor(nextModel, models));
        if (serverSearch === true) return expandPackedGrokReasoningInput(injectGrokServerSearchTools(wired));
        return expandPackedGrokReasoningInput(wired);
      }
    });
  };
}

function withHiddenOpaqueThinking(streamFn: (model: any, context: any, options: any) => any) {
  return (model: any, context: any, options: any) => filterGrokThinkingStream(streamFn(model, context, options));
}

export function grokResponsesApi(models: GrokCatalogModel[] = [], serverSearch = false) {
  const base = openAIResponsesApi();
  return {
    stream: withHiddenOpaqueThinking(withGrokResponsesBody(base.stream, models, serverSearch)),
    streamSimple: withHiddenOpaqueThinking(withGrokResponsesBody(base.streamSimple, models, serverSearch))
  };
}

const NO_COST = {
  input: 0,
  output: 0,
  cacheRead: 0,
  cacheWrite: 0
};

function proxyHeaders() {
  return {
    ...GROK_CLI_REQUEST_HEADERS,
    "X-Dsh-Plugin": GROK_PLUGIN_IDENTITY_HEADER
  };
}

function thinkingLevelMap(model: GrokCatalogModel) {
  if (model.thinking !== true) return undefined;
  return grokThinkingLevelMap(model);
}

export function toPiAiModel(model: GrokCatalogModel, baseUrl: string) {
  const levels = thinkingLevelMap(model);
  return {
    id: model.id,
    name: model.name ?? model.id,
    api: "openai-responses",
    provider: GROK_PROVIDER,
    baseUrl,
    reasoning: model.thinking === true,
    ...(levels === undefined ? {} : { thinkingLevelMap: levels }),
    input: model.vision === true ? ["text", "image"] : ["text"],
    cost: NO_COST,
    contextWindow: model.contextWindow ?? GROK_DEFAULT_CONTEXT_WINDOW,
    maxTokens: (model as any).maxTokens ?? GROK_DEFAULT_MODEL_MAX_TOKENS,
    compat: {
      supportsDeveloperRole: false,
      supportsLongCacheRetention: false,
      supportsStrictMode: false,
      supportsOpenAIGrammarTools: false,
      supportsToolSearch: false,
      supportsExplicitPromptCacheMode: false
    }
  };
}

function grokAuth() {
  return {
    apiKey: {
      name: "Grok subscription",
      resolve: ({ credential }: any) =>
        Promise.resolve({
          auth: credential?.key === undefined ? {} : { apiKey: credential.key },
          source: "Grok"
        })
    }
  };
}

export interface GrokPiAiConnection {
  baseURL: string;
  models: GrokCatalogModel[];
  serverSearch?: boolean;
  streamIdleTimeoutMs?: number;
  retryPolicy?: any;
}

export function createGrokPiAiProfile(connection: GrokPiAiConnection) {
  const baseURL = connection.baseURL.replace(/\/+$/u, "");
  const source = connection.models.length > 0 ? connection.models : (GROK_CATALOG as GrokCatalogModel[]);
  const models = source.map((model) => toPiAiModel(model, baseURL));
  const configuredMaxTokens = new Map<string, number>();
  const headers = proxyHeaders();
  const piProvider = createProvider({
    id: GROK_PROVIDER,
    name: "Grok",
    baseUrl: baseURL,
    auth: grokAuth(),
    models: models as any,
    api: grokResponsesApi(source, connection.serverSearch === true) as any,
    headers
  });
  return {
    provider: GROK_PROVIDER,
    displayName: "Grok",
    baseURL,
    defaultContextWindow: GROK_DEFAULT_CONTEXT_WINDOW,
    defaultMaxTokens: GROK_DEFAULT_MODEL_MAX_TOKENS,
    defaultInput: ["text"],
    streamIdleTimeoutMs: connection.streamIdleTimeoutMs,
    retryPolicy: connection.retryPolicy,
    maxRequestImageBytes: 20971520,
    requestImagePixelBudget: 2048 * 2048,
    requestImageMaxBytes: 1048576,
    piProvider,
    configuredMaxTokens,
    modelErrors: new Map(),
    headers
  };
}

export function createGrokPiAiAuth() {
  const stored = new Map<string, any>();
  return {
    credentials: {
      read: (id: string) => Promise.resolve(stored.get(id)),
      list: () =>
        Promise.resolve(
          [...stored].map(([providerId, credential]) => ({
            providerId,
            type: credential.type
          }))
        ),
      async modify(id: string, mutate: (val: any) => Promise<any>) {
        const next = await mutate(stored.get(id));
        if (next !== undefined) stored.set(id, next);
        return stored.get(id);
      },
      delete: (id: string) => {
        stored.delete(id);
        return Promise.resolve();
      }
    },
    authContext: {
      env: () => Promise.resolve(undefined),
      fileExists: () => Promise.resolve(false)
    }
  };
}

export async function resolveGrokAccessToken(runtime: FullGrokAuthRuntime): Promise<string> {
  const existing = await readSession(runtime.resolveSessionPath());
  const existingKey = existing === undefined ? undefined : accountKeyOf(existing);
  const session = await ensureFreshSession(runtime);
  if (session === undefined) {
    if (existing !== undefined) {
      throw new LlmError("llm-grok: session refresh failed; sign in again with an xAI subscription", "AUTH" as any);
    }
    throw new LlmError(
      "llm-grok: not signed in; sign in with an xAI subscription from Plugin configuration",
      "MISSING_CREDENTIAL" as any
    );
  }
  if (existingKey !== undefined && accountKeyOf(session) !== existingKey) {
    throw new LlmError("llm-grok: session refresh failed; sign in again with an xAI subscription", "AUTH" as any);
  }
  return session.accessToken;
}

export function applyOfficialReasoningMetadata(info: any, catalog?: GrokCatalogModel) {
  if (info.reasoning === undefined || catalog === undefined || catalog.thinking !== true) return info;
  const supported = new Set(info.reasoning.efforts.map((effort: any) => effort.id));
  const efforts = officialEffortsFor(catalog).flatMap((effort) => {
    if (!isGrokReasoningWire(effort.value) || !supported.has(ReasoningEffortId(effort.value as any))) return [];
    return [
      {
        id: ReasoningEffortId(effort.value as any),
        name: effort.label ?? effort.value,
        ...(effort.description === undefined ? {} : { description: effort.description })
      }
    ];
  });
  if (efforts.length === 0) return info;
  const preferred = ReasoningEffortId(officialDefaultEffort(catalog) as any);
  const defaultEffort = efforts.some((effort) => effort.id === preferred) ? preferred : efforts[0]?.id;
  return {
    ...info,
    reasoning: {
      efforts,
      ...(defaultEffort === undefined ? {} : { defaultEffort })
    }
  };
}

export function classifyGrokTransientError(chunk: any) {
  if (chunk.type !== "finish" || chunk.reason?.kind !== "error" || chunk.reason.failure?.code !== "PI_AI_ERROR") {
    return chunk;
  }
  const message = chunk.reason.failure.message;
  const code = /currently at capacity|high demand/iu.test(message)
    ? "RATE_LIMIT"
    : /service temporarily unavailable|availability is currently degraded/iu.test(message)
    ? "SERVER"
    : undefined;
  if (code === undefined) return chunk;
  return {
    ...chunk,
    reason: {
      ...chunk.reason,
      failure: {
        ...chunk.reason.failure,
        code
      }
    }
  };
}

export interface GrokAdapterConfig {
  options: () => {
    baseURL: string;
    models: GrokCatalogModel[];
    serverSearch?: boolean;
    streamIdleTimeoutMs?: number;
    retryPolicy?: any;
  };
  resolveApiKey: () => Promise<string | undefined>;
  resolveAttachments?: any;
}

export class GrokAdapter extends LlmAdapter {
  config: GrokAdapterConfig;
  auth = createGrokPiAiAuth();
  snapshot?: { options: any; adapter: any };

  constructor(config: GrokAdapterConfig) {
    super();
    this.config = config;
  }

  current() {
    const options = this.config.options();
    if (this.snapshot?.options === options) return this.snapshot.adapter;
    const profile = createGrokPiAiProfile(options);
    const profiles = new Map([[GROK_PROVIDER, profile]]);
    const adapterOptions = {
      profiles: () => profiles,
      resolveApiKey: () => this.config.resolveApiKey(),
      auth: this.auth,
      ...(this.config.resolveAttachments === undefined ? {} : { resolveAttachments: this.config.resolveAttachments })
    };
    const adapter = new PiAiAdapter(adapterOptions as any);
    this.snapshot = {
      options,
      adapter
    };
    return adapter;
  }

  providerInfo(provider: any) {
    return this.current().providerInfo(provider);
  }

  providerRetryPolicy(provider: any) {
    return this.current().providerRetryPolicy(provider);
  }

  async listModels(provider: any) {
    this.snapshot = undefined;
    return this.current().listModels(provider);
  }

  async resolveModel(provider: any, model: any, signal: any) {
    return applyOfficialReasoningMetadata(
      await this.current().resolveModel(provider, model, signal),
      this.config.options().models.find((entry) => entry.id === model)
    );
  }

  async *stream(options: any) {
    for await (const chunk of this.current().stream(options)) {
      yield classifyGrokTransientError(chunk);
    }
  }

  async prepareCall(provider: any, model: any, signal: any) {
    const delegate = this.current();
    const inner =
      typeof (delegate as any).prepareCall === "function"
        ? await (delegate as any).prepareCall(provider, model, signal)
        : {
            model: await this.resolveModel(provider, model, signal),
            stream: (options: any) => delegate.stream(options)
          };
    return {
      model: inner.model,
      stream: async function* (options: any) {
        for await (const chunk of inner.stream(options)) {
          yield classifyGrokTransientError(chunk);
        }
      }
    };
  }
}
