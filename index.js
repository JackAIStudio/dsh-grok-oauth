/** dsh-grok-oauth Host plugin - Modular Build */


// src/host/index.ts
import Schema from "@deepseek-ai/schemastery";
import { MAX_TIMER_DELAY_MS } from "@deepseek-ai/dsh-timeout";
import { RetryPolicySchema, resolveRetryPolicy } from "@deepseek-ai/dsh-llm";

// src/common/constants.ts
var GROK_SETTINGS_NAMESPACE = "llm-grok";
var GROK_PROVIDER = "grok";
var GROK_DEFAULT_STREAM_IDLE_TIMEOUT_MS = 3e5;
var GROK_RPC_CHANNEL = "/grok";
var GROK_AUTH_START_ENDPOINT = "auth/start";
var GROK_AUTH_STATUS_ENDPOINT = "auth/status";
var GROK_AUTH_LOGOUT_ENDPOINT = "auth/logout";
var GROK_AUTH_COMPLETE_ENDPOINT = "auth/complete";
var GROK_AUTH_SWITCH_ENDPOINT = "auth/switch";
var GROK_AUTH_REMOVE_ENDPOINT = "auth/remove";
var GROK_USAGE_ENDPOINT = "usage/read";
var GROK_USAGE_ALL_ENDPOINT = "usage/readAll";
var GROK_USAGE_HTTP_PATH = "/dsh-grok-oauth/usage";
var GROK_4_6_EFFORTS = Object.freeze([
  Object.freeze({
    id: "xhigh",
    value: "xhigh",
    label: "Extra High Effort",
    description: "Highest effort and reasoning level"
  }),
  Object.freeze({
    id: "high",
    value: "high",
    label: "High Effort",
    description: "Higher implementation quality with extensive reasoning"
  }),
  Object.freeze({
    id: "medium",
    value: "medium",
    label: "Medium Effort",
    description: "Balanced effort with standard implementation and testing"
  }),
  Object.freeze({
    id: "low",
    value: "low",
    label: "Low Effort",
    description: "Quick, fast implementations"
  })
]);
var GROK_CATALOG = Object.freeze([
  Object.freeze({
    id: "grok-4.6",
    name: "Grok 4.6",
    thinking: true,
    vision: true,
    contextWindow: 5e5,
    defaultReasoningEffort: "high",
    reasoningEfforts: GROK_4_6_EFFORTS
  }),
  Object.freeze({
    id: "grok-4.5",
    name: "Grok 4.5",
    thinking: true,
    vision: true,
    contextWindow: 5e5,
    defaultReasoningEffort: "high",
    reasoningEfforts: Object.freeze(GROK_4_6_EFFORTS.filter((effort) => effort.value !== "xhigh"))
  })
]);
var GROK_MODELS_ENDPOINT = "models/list";
var GROK_SAVE_ENDPOINT = "settings/save";
var GROK_OAUTH_ISSUER = "https://auth.x.ai";
var GROK_OAUTH_CLIENT_ID = "b1a00492-073a-47ea-816f-4c329264a828";
var GROK_OAUTH_SCOPE = [
  "openid",
  "profile",
  "email",
  "offline_access",
  "grok-cli:access",
  "api:access",
  "conversations:read",
  "conversations:write",
  "workspaces:read",
  "workspaces:write"
];
var GROK_OAUTH_AUTHORIZE_PATH = "/oauth2/authorize";
var GROK_OAUTH_TOKEN_PATH = "/oauth2/token";
var GROK_OAUTH_TIMEOUT_MS = 3e5;
var GROK_OAUTH_REFRESH_SKEW_MS = 6e4;
var GROK_CHAT_BASE_URL = "https://cli-chat-proxy.grok.com/v1";
var GROK_DEFAULT_CONTEXT_WINDOW = 5e5;
var GROK_DEFAULT_MODEL_MAX_TOKENS = 32768;
var GROK_MODELS_URL = "https://cli-chat-proxy.grok.com/v1/models-v2";
var GROK_BILLING_URL = "https://cli-chat-proxy.grok.com/v1/billing?format=credits";
var DEFAULT_USAGE_REQUEST_TIMEOUT_MS = 15e3;
var MAX_USAGE_BYTES = 1048576;
var GROK_IMAGINE_BASE_URL = "https://api.x.ai/v1";
var GROK_IMAGINE_MODEL = "grok-imagine-image-2.0";
var GROK_IMAGINE_ASPECT_RATIOS = [
  "1:1",
  "16:9",
  "9:16",
  "4:3",
  "3:4",
  "3:2",
  "2:3",
  "2:1",
  "1:2",
  "19.5:9",
  "9:19.5",
  "20:9",
  "9:20",
  "21:9",
  "5:2",
  "auto"
];
var GROK_IMAGE_GEN_TIMEOUT_MS = 3e5;
var GROK_IMAGE_GEN_TOOL_NAME = "grok_image_gen";
var GROK_PACKED_REASONING_TYPE = "dsh-grok-packed-reasoning";
var GROK_SERVER_SEARCH_TOOLS = [{ type: "web_search" }, { type: "x_search" }];

// src/common/contract.ts
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
var TOKEN_FIELD = /^(?:accessToken|refreshToken|access_token|refresh_token|id_token|idToken|token)$/iu;
function hasTokenFields(value) {
  return Object.keys(value).some((key) => TOKEN_FIELD.test(key));
}
function optionalNonEmptyString(value) {
  return value === void 0 || typeof value === "string" && value.length > 0;
}
function decodeGrokReasoningEffort(value) {
  if (!isRecord(value) || hasTokenFields(value)) return void 0;
  const id = value["id"];
  const wire = value["value"];
  const label = value["label"];
  const description = value["description"];
  if (typeof id !== "string" || id.length === 0) return void 0;
  if (typeof wire !== "string" || wire.length === 0) return void 0;
  if (label !== void 0 && (typeof label !== "string" || label.length === 0)) return void 0;
  if (description !== void 0 && (typeof description !== "string" || description.length === 0)) return void 0;
  return {
    id,
    value: wire,
    ...typeof label === "string" ? { label } : {},
    ...typeof description === "string" ? { description } : {}
  };
}
function decodeGrokCatalogModel(value) {
  if (!isRecord(value) || hasTokenFields(value)) return void 0;
  const id = value["id"];
  const name2 = value["name"];
  const thinking = value["thinking"];
  const vision = value["vision"];
  const contextWindow = value["contextWindow"];
  const defaultReasoningEffort = value["defaultReasoningEffort"];
  const reasoningEffortsValue = value["reasoningEfforts"];
  if (typeof id !== "string" || id.length === 0) return void 0;
  if (name2 !== void 0 && (typeof name2 !== "string" || name2.length === 0)) return void 0;
  if (thinking !== void 0 && typeof thinking !== "boolean") return void 0;
  if (vision !== void 0 && typeof vision !== "boolean") return void 0;
  if (contextWindow !== void 0 && (typeof contextWindow !== "number" || !Number.isInteger(contextWindow) || contextWindow <= 0)) return void 0;
  if (defaultReasoningEffort !== void 0 && (typeof defaultReasoningEffort !== "string" || defaultReasoningEffort.length === 0)) return void 0;
  let reasoningEfforts;
  if (reasoningEffortsValue !== void 0) {
    if (!Array.isArray(reasoningEffortsValue)) return void 0;
    reasoningEfforts = [];
    for (const entry of reasoningEffortsValue) {
      const effort = decodeGrokReasoningEffort(entry);
      if (effort === void 0) return void 0;
      reasoningEfforts.push(effort);
    }
  }
  return {
    id,
    ...typeof name2 === "string" ? { name: name2 } : {},
    ...typeof thinking === "boolean" ? { thinking } : {},
    ...typeof vision === "boolean" ? { vision } : {},
    ...typeof contextWindow === "number" ? { contextWindow } : {},
    ...typeof defaultReasoningEffort === "string" ? { defaultReasoningEffort } : {},
    ...reasoningEfforts !== void 0 ? { reasoningEfforts } : {}
  };
}
function decodeGrokSettings(value) {
  if (!isRecord(value)) return void 0;
  const streamIdleTimeoutMs = value["streamIdleTimeoutMs"];
  if (typeof streamIdleTimeoutMs !== "number" || !Number.isFinite(streamIdleTimeoutMs) || streamIdleTimeoutMs <= 0) return void 0;
  const modelsValue = value["models"];
  const enableImageGen = value["enableImageGen"] === true;
  const serverSearch = value["serverSearch"];
  if (serverSearch !== void 0 && typeof serverSearch !== "boolean") return void 0;
  const proxy = value["proxy"];
  if (proxy !== void 0 && typeof proxy !== "string") return void 0;
  if (modelsValue === void 0) {
    return {
      streamIdleTimeoutMs,
      models: GROK_CATALOG.map((model) => ({ ...model })),
      enableImageGen,
      ...typeof serverSearch === "boolean" ? { serverSearch } : {},
      ...typeof proxy === "string" ? { proxy } : {}
    };
  }
  if (!Array.isArray(modelsValue)) return void 0;
  const models = [];
  for (const entry of modelsValue) {
    const model = decodeGrokCatalogModel(entry);
    if (model === void 0) return void 0;
    models.push(model);
  }
  return {
    streamIdleTimeoutMs,
    models,
    enableImageGen,
    ...typeof serverSearch === "boolean" ? { serverSearch } : {},
    ...typeof proxy === "string" ? { proxy } : {}
  };
}
function decodeGrokAuthAccountView(value) {
  if (!isRecord(value) || hasTokenFields(value)) return void 0;
  const id = value["id"];
  const email = value["email"];
  const expiresAt = value["expiresAt"];
  const active = value["active"];
  if (typeof id !== "string" || id.length === 0) return void 0;
  if (!optionalNonEmptyString(email) || !optionalNonEmptyString(expiresAt)) return void 0;
  if (active !== void 0 && typeof active !== "boolean") return void 0;
  return {
    id,
    ...email === void 0 ? {} : { email },
    ...expiresAt === void 0 ? {} : { expiresAt },
    active: active === true
  };
}
function decodeGrokAuthStartReply(value) {
  if (!isRecord(value) || hasTokenFields(value) || typeof value["ok"] !== "boolean") return void 0;
  if (value["ok"] === true) {
    const reused = value["reused"];
    const email = value["email"];
    const accountId = value["accountId"];
    if (reused !== void 0 && typeof reused !== "boolean") return void 0;
    if (!optionalNonEmptyString(email) || !optionalNonEmptyString(accountId)) return void 0;
    return {
      ok: true,
      ...reused === true ? { reused: true } : {},
      ...email === void 0 ? {} : { email },
      ...accountId === void 0 ? {} : { accountId }
    };
  }
  if (value["retryable"] !== true || typeof value["message"] !== "string" || value["message"].length === 0) return void 0;
  return {
    ok: false,
    retryable: true,
    message: value["message"]
  };
}
function decodeGrokAuthStatus(value) {
  if (!isRecord(value) || hasTokenFields(value) || typeof value["loggedIn"] !== "boolean") return void 0;
  const email = value["email"];
  const expiresAt = value["expiresAt"];
  const activeAccountId = value["activeAccountId"];
  if (!optionalNonEmptyString(email) || !optionalNonEmptyString(expiresAt) || !optionalNonEmptyString(activeAccountId)) return void 0;
  const accounts = [];
  const accountsValue = value["accounts"];
  if (accountsValue !== void 0) {
    if (!Array.isArray(accountsValue)) return void 0;
    for (const entry of accountsValue) {
      const account = decodeGrokAuthAccountView(entry);
      if (account === void 0) return void 0;
      accounts.push(account);
    }
  }
  return {
    loggedIn: value["loggedIn"],
    ...email === void 0 ? {} : { email },
    ...expiresAt === void 0 ? {} : { expiresAt },
    ...activeAccountId === void 0 ? {} : { activeAccountId },
    accounts
  };
}
function decodeGrokAuthLogoutReply(value) {
  if (!isRecord(value) || hasTokenFields(value) || typeof value["ok"] !== "boolean") return void 0;
  if (value["ok"] !== true) {
    if (value["retryable"] !== true || typeof value["message"] !== "string" || value["message"].length === 0) return void 0;
    return {
      ok: false,
      retryable: true,
      message: value["message"]
    };
  }
  const status = value["status"] === void 0 ? void 0 : decodeGrokAuthStatus(value["status"]);
  if (value["status"] !== void 0 && status === void 0) return void 0;
  return {
    ok: true,
    ...status === void 0 ? {} : { status }
  };
}
function decodeGrokUsageWindow(value) {
  if (!isRecord(value) || hasTokenFields(value)) return void 0;
  const id = value["id"];
  const used = value["used"];
  const limit = value["limit"];
  const period = value["period"];
  const unit = value["unit"];
  const resetsAt = value["resetsAt"];
  if (typeof id !== "string" || id.length === 0) return void 0;
  if (typeof used !== "number" || !Number.isFinite(used) || used < 0) return void 0;
  if (typeof limit !== "number" || !Number.isFinite(limit) || limit < 0) return void 0;
  if (!optionalNonEmptyString(period)) return void 0;
  if (unit !== void 0 && unit !== "percent") return void 0;
  if (!optionalNonEmptyString(resetsAt)) return void 0;
  return {
    id,
    used,
    limit,
    ...typeof period === "string" ? { period } : {},
    ...unit === "percent" ? { unit: "percent" } : {},
    ...typeof resetsAt === "string" ? { resetsAt } : {}
  };
}
function decodeGrokUsageView(value) {
  if (!isRecord(value) || hasTokenFields(value)) return void 0;
  if (typeof value["fetchedAt"] !== "string" || value["fetchedAt"].length === 0) return void 0;
  if (!Array.isArray(value["windows"]) || value["windows"].length === 0) return void 0;
  const windows = [];
  for (const entry of value["windows"]) {
    const decoded = decodeGrokUsageWindow(entry);
    if (decoded === void 0) return void 0;
    windows.push(decoded);
  }
  return {
    fetchedAt: value["fetchedAt"],
    windows
  };
}
function decodeGrokUsageReply(value) {
  if (!isRecord(value) || hasTokenFields(value)) return void 0;
  if (value["status"] === "unsupported") return { status: "unsupported" };
  if (value["status"] === "logged-out") return { status: "logged-out" };
  if (value["status"] !== "ok") return void 0;
  const usage = decodeGrokUsageView(value["usage"]);
  return usage === void 0 ? void 0 : {
    status: "ok",
    usage
  };
}
function decodeGrokAccountUsageView(value) {
  if (!isRecord(value) || hasTokenFields(value)) return void 0;
  const accountId = value["accountId"];
  const email = value["email"];
  const active = value["active"];
  const status = value["status"];
  if (typeof accountId !== "string" || accountId.length === 0) return void 0;
  if (!optionalNonEmptyString(email)) return void 0;
  if (typeof active !== "boolean") return void 0;
  if (status === "unsupported") {
    return {
      accountId,
      ...email === void 0 ? {} : { email },
      active,
      status: "unsupported"
    };
  }
  if (status === "error") {
    const message = value["message"];
    if (typeof message !== "string" || message.length === 0) return void 0;
    return {
      accountId,
      ...email === void 0 ? {} : { email },
      active,
      status: "error",
      message
    };
  }
  if (status !== "ok") return void 0;
  const usage = decodeGrokUsageView(value["usage"]);
  return usage === void 0 ? void 0 : {
    accountId,
    ...email === void 0 ? {} : { email },
    active,
    status: "ok",
    usage
  };
}
function decodeGrokAccountsUsageReply(value) {
  if (!isRecord(value) || hasTokenFields(value)) return void 0;
  if (value["status"] === "logged-out") {
    return {
      status: "logged-out",
      accounts: []
    };
  }
  if (value["status"] !== "ok" || !Array.isArray(value["accounts"])) return void 0;
  const accounts = [];
  for (const entry of value["accounts"]) {
    const decoded = decodeGrokAccountUsageView(entry);
    if (decoded === void 0) return void 0;
    accounts.push(decoded);
  }
  return {
    status: "ok",
    accounts
  };
}
function decodeGrokModelsReply(value) {
  if (!isRecord(value) || hasTokenFields(value) || !Array.isArray(value["models"])) return void 0;
  const models = [];
  for (const entry of value["models"]) {
    const model = decodeGrokCatalogModel(entry);
    if (model === void 0) return void 0;
    models.push(model);
  }
  return { models };
}
function decodeGrokSaveRequest(value) {
  if (!isRecord(value) || hasTokenFields(value)) return void 0;
  const expectedRevision = value["expectedRevision"];
  if (!Array.isArray(value["models"]) || typeof expectedRevision !== "number" || !Number.isSafeInteger(expectedRevision)) return void 0;
  if (value["enableImageGen"] !== void 0 && typeof value["enableImageGen"] !== "boolean") return void 0;
  const serverSearch = value["serverSearch"];
  if (serverSearch !== void 0 && typeof serverSearch !== "boolean") return void 0;
  const proxy = value["proxy"];
  if (proxy !== void 0 && typeof proxy !== "string") return void 0;
  const models = [];
  for (const entry of value["models"]) {
    const model = decodeGrokCatalogModel(entry);
    if (model === void 0) return void 0;
    models.push(model);
  }
  return {
    models,
    expectedRevision,
    ...typeof value["enableImageGen"] === "boolean" ? { enableImageGen: value["enableImageGen"] } : {},
    ...typeof serverSearch === "boolean" ? { serverSearch } : {},
    ...typeof proxy === "string" ? { proxy } : {}
  };
}
function decodeGrokSaveResult(value) {
  if (!isRecord(value) || hasTokenFields(value)) return void 0;
  const revision = value["revision"];
  if (typeof revision !== "number" || !Number.isSafeInteger(revision)) return void 0;
  const settings = decodeGrokSettings(value["settings"]);
  return settings === void 0 ? void 0 : {
    settings,
    revision
  };
}
function decodeGrokAuthCompleteRequest(value) {
  if (!isRecord(value) || hasTokenFields(value)) return void 0;
  const code = value["code"];
  if (typeof code !== "string" || code.trim().length === 0) return void 0;
  return { code: code.trim() };
}
function decodeGrokEmptyRequest(value) {
  if (value === void 0 || value === null) return {};
  if (!isRecord(value) || hasTokenFields(value)) return void 0;
  return {};
}
function decodeGrokAccountIdRequest(value) {
  if (value === void 0 || value === null) return {};
  if (!isRecord(value) || hasTokenFields(value)) return void 0;
  const accountId = value["accountId"] ?? value["id"];
  if (accountId === void 0) return {};
  if (typeof accountId !== "string" || accountId.trim().length === 0) return void 0;
  return { accountId: accountId.trim() };
}

// src/common/reasoning.ts
var GROK_REASONING_WIRES = [
  "low",
  "medium",
  "high",
  "xhigh"
];
var GROK_DEFAULT_REASONING_WIRE = "high";
var UNSUPPORTED = null;
var GROK_4_6_REASONING_EFFORTS = Object.freeze([
  Object.freeze({
    id: "xhigh",
    value: "xhigh",
    label: "Extra High Effort",
    description: "Highest effort and reasoning level"
  }),
  Object.freeze({
    id: "high",
    value: "high",
    label: "High Effort",
    description: "Higher implementation quality with extensive reasoning"
  }),
  Object.freeze({
    id: "medium",
    value: "medium",
    label: "Medium Effort",
    description: "Balanced effort with standard implementation and testing"
  }),
  Object.freeze({
    id: "low",
    value: "low",
    label: "Low Effort",
    description: "Quick, fast implementations"
  })
]);
var GROK_4_5_REASONING_EFFORTS = Object.freeze(
  GROK_4_6_REASONING_EFFORTS.filter((effort) => effort.value !== "xhigh")
);
function isGrokReasoningWire(value) {
  return typeof value === "string" && GROK_REASONING_WIRES.includes(value);
}
function officialEffortsFor(model) {
  if (model.reasoningEfforts !== void 0 && model.reasoningEfforts.length > 0) {
    return model.reasoningEfforts;
  }
  return model.id === "grok-4.5" ? GROK_4_5_REASONING_EFFORTS : GROK_4_6_REASONING_EFFORTS;
}
function officialDefaultEffort(model) {
  const values = new Set(officialEffortsFor(model).map((effort) => effort.value));
  const configured = model.defaultReasoningEffort;
  if (configured !== void 0 && values.has(configured) && isGrokReasoningWire(configured)) {
    return configured;
  }
  if (values.has("high")) return GROK_DEFAULT_REASONING_WIRE;
  for (const effort of officialEffortsFor(model)) {
    if (isGrokReasoningWire(effort.value)) return effort.value;
  }
  return GROK_DEFAULT_REASONING_WIRE;
}
function grokThinkingLevelMap(model) {
  const values = new Set(officialEffortsFor(model).map((effort) => effort.value));
  return {
    off: UNSUPPORTED,
    minimal: UNSUPPORTED,
    low: values.has("low") ? "low" : UNSUPPORTED,
    medium: values.has("medium") ? "medium" : UNSUPPORTED,
    high: values.has("high") ? "high" : UNSUPPORTED,
    xhigh: values.has("xhigh") ? "xhigh" : UNSUPPORTED,
    max: UNSUPPORTED
  };
}
function resolveGrokReasoningWire(requested, model) {
  const efforts = officialEffortsFor(model);
  const fallback = officialDefaultEffort(model);
  if (typeof requested !== "string" || requested.length === 0) return fallback;
  for (const effort of efforts) {
    if (effort.value === requested || effort.id === requested) {
      return isGrokReasoningWire(effort.value) ? effort.value : fallback;
    }
  }
  return fallback;
}
function applyGrokReasoningWire(payload, model) {
  if (!isRecord(payload) || model.thinking !== true) return payload;
  const reasoningObj = isRecord(payload["reasoning"]) ? payload["reasoning"] : void 0;
  const effort = resolveGrokReasoningWire(reasoningObj?.["effort"], model);
  return {
    ...payload,
    reasoning: { effort }
  };
}

// src/host/session.ts
import { chmod, mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { randomBytes } from "node:crypto";
import { launchEnvironmentOf } from "@deepseek-ai/dsh-launch-environment";
var GROK_SESSION_FILENAME = "grok-oauth.json";
var GROK_SESSION_VERSION = 2;
function expandHome(path) {
  if (path === "~") return homedir();
  if (path.startsWith("~/") || path.startsWith("~\\")) return join(homedir(), path.slice(2));
  return path;
}
function resolveGrokSessionPath(ctx) {
  const fromEnv = launchEnvironmentOf(ctx)?.get("DSH_HOME")?.value;
  const home = fromEnv !== void 0 && fromEnv.trim().length > 0 ? expandHome(fromEnv.trim()) : join(homedir(), ".dsh");
  return join(home, GROK_SESSION_FILENAME);
}
function accountKeyOf(session) {
  if (typeof session.userId === "string" && session.userId.length > 0) return session.userId;
  if (typeof session.email === "string" && session.email.length > 0) return session.email.toLowerCase();
  return void 0;
}
function publicAccountId(session) {
  return accountKeyOf(session) ?? session.expiresAt;
}
function sameAccount(left, right) {
  const leftKey = accountKeyOf(left);
  const rightKey = accountKeyOf(right);
  return leftKey !== void 0 && rightKey !== void 0 && leftKey === rightKey;
}
function cloneSession(session) {
  return {
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    expiresAt: session.expiresAt,
    ...session.email === void 0 ? {} : { email: session.email },
    ...session.userId === void 0 ? {} : { userId: session.userId }
  };
}
function emptyStore() {
  return {
    version: GROK_SESSION_VERSION,
    accounts: []
  };
}
function storeFromLegacySession(session) {
  const cloned = cloneSession(session);
  const id = accountKeyOf(cloned);
  return {
    version: GROK_SESSION_VERSION,
    ...id === void 0 ? {} : { activeAccountId: id },
    accounts: [cloned]
  };
}
function decodeGrokSession(value) {
  if (!isRecord(value)) return void 0;
  const accessToken = value["accessToken"];
  const refreshToken = value["refreshToken"];
  const expiresAt = value["expiresAt"];
  const email = value["email"];
  const userId = value["userId"];
  if (typeof accessToken !== "string" || accessToken.length === 0) return void 0;
  if (typeof refreshToken !== "string" || refreshToken.length === 0) return void 0;
  if (typeof expiresAt !== "string" || expiresAt.length === 0 || Number.isNaN(Date.parse(expiresAt))) return void 0;
  if (email !== void 0 && (typeof email !== "string" || email.length === 0)) return void 0;
  if (userId !== void 0 && (typeof userId !== "string" || userId.length === 0)) return void 0;
  return {
    accessToken,
    refreshToken,
    expiresAt,
    ...typeof email === "string" ? { email } : {},
    ...typeof userId === "string" ? { userId } : {}
  };
}
function findAccountIndex(store, accountId) {
  if (typeof accountId !== "string" || accountId.length === 0) return -1;
  const needle = accountId.trim();
  const lowered = needle.toLowerCase();
  return store.accounts.findIndex(
    (account) => accountKeyOf(account) === needle || typeof account.email === "string" && account.email.toLowerCase() === lowered
  );
}
function activeAccountFrom(store) {
  if (store.accounts.length === 0) return void 0;
  const index = findAccountIndex(store, store.activeAccountId);
  return store.accounts[index >= 0 ? index : 0];
}
function withActiveAccount(store, session) {
  const next = cloneSession(session);
  const id = accountKeyOf(next);
  return {
    version: GROK_SESSION_VERSION,
    ...id === void 0 ? {} : { activeAccountId: id },
    accounts: store.accounts.map((account) => sameAccount(account, next) ? next : cloneSession(account))
  };
}
function upsertAccount(store, session, activate) {
  const next = cloneSession(session);
  const accounts = [];
  let replaced = false;
  for (const account of store.accounts) {
    if (sameAccount(account, next)) {
      accounts.push(next);
      replaced = true;
    } else {
      accounts.push(cloneSession(account));
    }
  }
  if (!replaced) accounts.push(next);
  const activeId = activate === false && store.activeAccountId !== void 0 ? store.activeAccountId : accountKeyOf(next) ?? store.activeAccountId;
  return {
    version: GROK_SESSION_VERSION,
    ...activeId === void 0 ? {} : { activeAccountId: activeId },
    accounts
  };
}
function switchActiveAccount(store, accountId) {
  const index = findAccountIndex(store, accountId);
  if (index < 0) return void 0;
  const id = accountKeyOf(store.accounts[index]);
  return {
    version: GROK_SESSION_VERSION,
    ...id === void 0 ? {} : { activeAccountId: id },
    accounts: store.accounts.map(cloneSession)
  };
}
function removeAccount(store, accountId) {
  const index = findAccountIndex(store, accountId);
  if (index < 0) {
    return store.accounts.length === 0 ? emptyStore() : {
      version: GROK_SESSION_VERSION,
      ...store.activeAccountId === void 0 ? {} : { activeAccountId: store.activeAccountId },
      accounts: store.accounts.map(cloneSession)
    };
  }
  const accounts = store.accounts.filter((_, at) => at !== index).map(cloneSession);
  if (accounts.length === 0) return emptyStore();
  const removedWasActive = findAccountIndex(store, store.activeAccountId) === index || store.activeAccountId === void 0;
  const nextActive = removedWasActive ? accountKeyOf(accounts[0]) : store.activeAccountId;
  return {
    version: GROK_SESSION_VERSION,
    ...nextActive === void 0 ? {} : { activeAccountId: nextActive },
    accounts
  };
}
function decodeGrokSessionStore(value) {
  if (!isRecord(value)) return void 0;
  const accountsValue = value["accounts"];
  if (Array.isArray(accountsValue)) {
    const accounts = [];
    for (const entry of accountsValue) {
      const session = decodeGrokSession(entry);
      if (session === void 0) return void 0;
      accounts.push(session);
    }
    const activeAccountId = value["activeAccountId"];
    if (activeAccountId !== void 0 && (typeof activeAccountId !== "string" || activeAccountId.length === 0)) {
      return void 0;
    }
    const store = {
      version: GROK_SESSION_VERSION,
      ...typeof activeAccountId === "string" ? { activeAccountId } : {},
      accounts
    };
    const active = activeAccountFrom(store);
    if (active !== void 0) {
      const id = accountKeyOf(active);
      if (id !== void 0) store.activeAccountId = id;
    } else {
      delete store.activeAccountId;
    }
    return store;
  }
  const legacy = decodeGrokSession(value);
  return legacy === void 0 ? void 0 : storeFromLegacySession(legacy);
}
async function readSessionStore(path) {
  try {
    const raw = await readFile(path, "utf8");
    return decodeGrokSessionStore(JSON.parse(raw)) ?? emptyStore();
  } catch {
    return emptyStore();
  }
}
async function readSession(path) {
  return activeAccountFrom(await readSessionStore(path));
}
async function writeSessionStore(path, store) {
  await mkdir(dirname(path), { recursive: true });
  const tmp = `${path}.${randomBytes(8).toString("hex")}.tmp`;
  const body = `${JSON.stringify(
    {
      version: GROK_SESSION_VERSION,
      ...store.activeAccountId === void 0 ? {} : { activeAccountId: store.activeAccountId },
      accounts: store.accounts.map(cloneSession)
    },
    null,
    2
  )}
`;
  try {
    await writeFile(tmp, body, {
      encoding: "utf8",
      mode: 384
    });
    await chmod(tmp, 384);
    await rename(tmp, path);
    await chmod(path, 384);
  } catch (error) {
    await unlink(tmp).catch(() => void 0);
    throw error;
  }
}
async function writeSession(path, sessionOrStore) {
  const store = sessionOrStore !== void 0 && isRecord(sessionOrStore) && Array.isArray(sessionOrStore.accounts) ? sessionOrStore : upsertAccount(await readSessionStore(path), sessionOrStore, true);
  await writeSessionStore(path, store);
}
async function deleteSession(path) {
  try {
    await unlink(path);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}
function accountViewOf(session, active) {
  return {
    id: publicAccountId(session),
    ...session.email === void 0 ? {} : { email: session.email },
    expiresAt: session.expiresAt,
    active: active === true
  };
}
function statusFromStore(store) {
  const active = activeAccountFrom(store);
  if (active === void 0) {
    return {
      loggedIn: false,
      accounts: []
    };
  }
  const activeId = publicAccountId(active);
  return {
    loggedIn: true,
    ...active.email === void 0 ? {} : { email: active.email },
    expiresAt: active.expiresAt,
    activeAccountId: activeId,
    accounts: store.accounts.map((account) => accountViewOf(account, publicAccountId(account) === activeId))
  };
}
function statusFromSession(session) {
  if (session === void 0) return { loggedIn: false, accounts: [] };
  const id = publicAccountId(session);
  return {
    loggedIn: true,
    ...session.email === void 0 ? {} : { email: session.email },
    expiresAt: session.expiresAt,
    activeAccountId: id,
    accounts: [accountViewOf(session, true)]
  };
}

// src/host/proxy.ts
import { ProxyAgent, EnvHttpProxyAgent, fetch as undiciFetch } from "undici";
var PROXY_DIRECT_VALUE = /^(?:direct|off|none)$/iu;
function resolveProxySetting(value) {
  if (typeof value !== "string" || value.trim().length === 0) return { mode: "auto" };
  const trimmed = value.trim();
  if (PROXY_DIRECT_VALUE.test(trimmed)) return { mode: "direct" };
  const url = /^[a-z][a-z0-9+.-]*:\/\//iu.test(trimmed) ? trimmed : `http://${trimmed}`;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return { mode: "invalid", value: trimmed };
    return { mode: "explicit", url: parsed.toString() };
  } catch {
    return { mode: "invalid", value: trimmed };
  }
}
function proxyEnvValue() {
  return process.env.HTTPS_PROXY ?? process.env.https_proxy ?? process.env.ALL_PROXY ?? process.env.all_proxy ?? void 0;
}
function proxyLabel(value) {
  if (typeof value !== "string" || value.length === 0) return "environment proxy";
  try {
    const parsed = new URL(/^[a-z][a-z0-9+.-]*:\/\//iu.test(value) ? value : `http://${value}`);
    parsed.username = "";
    parsed.password = "";
    return parsed.toString();
  } catch {
    return "proxy";
  }
}
function createGrokFetch(setting, logger) {
  const resolved = resolveProxySetting(setting);
  if (resolved.mode === "direct") return globalThis.fetch;
  if (resolved.mode === "invalid") {
    logger?.warn?.(`llm-grok: ignoring invalid proxy setting "${resolved.value}"; falling back to the environment proxy`);
  }
  if (resolved.mode === "explicit" && resolved.url !== void 0) {
    const agent2 = new ProxyAgent(resolved.url);
    logger?.debug?.(`llm-grok: routing Grok requests through ${proxyLabel(resolved.url)}`);
    return (input, init) => undiciFetch(input, { ...init, dispatcher: agent2 });
  }
  const envProxy = proxyEnvValue();
  if (envProxy === void 0) return globalThis.fetch;
  const agent = new EnvHttpProxyAgent();
  logger?.debug?.(`llm-grok: routing Grok requests through ${proxyLabel(envProxy)}`);
  return (input, init) => undiciFetch(input, { ...init, dispatcher: agent });
}
function hasActiveProxy(setting) {
  const resolved = resolveProxySetting(setting);
  if (resolved.mode === "direct") return false;
  if (resolved.mode === "explicit") return true;
  return proxyEnvValue() !== void 0;
}
function shouldBypassProxy(input) {
  let url;
  try {
    url = typeof input === "string" ? new URL(input) : new URL(input.url);
  } catch {
    return true;
  }
  const host = url.hostname;
  if (host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "[::1]") return true;
  const noProxy = process.env.NO_PROXY ?? process.env.no_proxy ?? "";
  if (noProxy.trim().length === 0) return false;
  const probe = host.toLowerCase();
  for (const entry of noProxy.split(",")) {
    const domain = entry.trim().toLowerCase();
    if (domain.length === 0) continue;
    if (domain === "*") return true;
    if (domain.startsWith(".")) {
      if (probe.endsWith(domain) && probe.length > domain.length) return true;
    } else if (probe === domain || probe.endsWith(`.${domain}`)) {
      return true;
    }
  }
  return false;
}
var GROK_PROXY_DOMAIN = /(?:^|\.)(?:x\.ai|grok\.com)$/iu;
function isGrokRequest(input) {
  try {
    const url = typeof input === "string" ? new URL(input) : new URL(input.url);
    return GROK_PROXY_DOMAIN.test(url.hostname);
  } catch {
    return false;
  }
}
function authNetworkHint(error) {
  const detail = error instanceof Error && error.message.length > 0 ? error.message : "connection failed";
  return `Could not reach auth.x.ai (${detail}). Check the plugin proxy setting or HTTPS_PROXY, then try again.`;
}
function redactSecrets(message, secrets) {
  let result = message;
  for (const secret of secrets) {
    if (typeof secret === "string" && secret.length > 0) {
      result = result.replaceAll(secret, "[REDACTED]");
    }
  }
  return result;
}
function readString(record, key) {
  const value = record[key];
  return typeof value === "string" && value.length > 0 ? value : void 0;
}
async function authRejectionHint(response, secrets) {
  let detail = "";
  try {
    const body = await response.json();
    if (isRecord(body)) {
      const error = readString(body, "error");
      const description = readString(body, "error_description");
      detail = [error, description].filter((part) => part !== void 0).join(" \u2014 ");
    }
  } catch {
  }
  detail = redactSecrets(detail, secrets);
  return `auth.x.ai rejected the sign-in (HTTP ${response.status})${detail.length > 0 ? `: ${detail}` : ""}.`;
}

// src/host/oauth.ts
import { createHash, randomBytes as randomBytes2 } from "node:crypto";
import { spawn } from "node:child_process";

// src/host/loopback.ts
import { createServer } from "node:http";
var CALLBACK_OK = "<!doctype html><title>Grok</title><p>Sign-in complete. You can close this window.</p>";
var CALLBACK_FAIL = "<!doctype html><title>Grok</title><p>Sign-in did not complete. You can close this window and try again.</p>";
function listenLoopback() {
  const server = createServer();
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (address === null || typeof address === "string") {
        server.close();
        reject(new Error("loopback listener has no port"));
        return;
      }
      resolve({
        server,
        port: address.port
      });
    });
  });
}
function closeServer(server) {
  return new Promise((resolve) => {
    server.close(() => resolve());
  });
}
function waitForCallback(server, expectedState, timeoutMs, signal) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
      server.removeListener("request", onRequest);
      if (result instanceof Error) reject(result);
      else resolve(result);
    };
    const onAbort = () => {
      finish(Object.assign(new Error("Sign-in was cancelled."), { code: "ABORT_ERR" }));
    };
    const timer = setTimeout(() => {
      finish(Object.assign(new Error("Sign-in timed out."), { code: "TIMEOUT" }));
    }, timeoutMs);
    const onRequest = (request, response) => {
      try {
        const url = new URL(request.url ?? "/", "http://127.0.0.1");
        if (url.pathname !== "/callback") {
          response.writeHead(404, { "content-type": "text/plain" }).end("not found");
          return;
        }
        const state = url.searchParams.get("state");
        const code = url.searchParams.get("code");
        const error = url.searchParams.get("error");
        if (state !== expectedState) {
          response.writeHead(400, { "content-type": "text/html; charset=utf-8" }).end(CALLBACK_FAIL);
          finish({ kind: "mismatch" });
          return;
        }
        if (error !== null || code === null || code.length === 0) {
          response.writeHead(400, { "content-type": "text/html; charset=utf-8" }).end(CALLBACK_FAIL);
          finish({ kind: "denied" });
          return;
        }
        response.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(CALLBACK_OK);
        finish({
          kind: "code",
          code
        });
      } catch (error) {
        response.writeHead(400).end();
        finish(error instanceof Error ? error : new Error("invalid callback"));
      }
    };
    if (signal?.aborted === true) {
      onAbort();
      return;
    }
    signal?.addEventListener("abort", onAbort, { once: true });
    server.on("request", onRequest);
  });
}
function isLoopbackAddress(address) {
  if (typeof address !== "string" || address.length === 0) return false;
  return address === "127.0.0.1" || address === "::1" || address === "::ffff:127.0.0.1";
}
function sendJson(res, statusCode, value) {
  res.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    connection: "close"
  }).end(`${JSON.stringify(value)}
`);
}

// src/host/oauth.ts
function retryable(message) {
  return {
    ok: false,
    retryable: true,
    message
  };
}
function randomUrlSafe(bytes) {
  return randomBytes2(bytes).toString("base64url");
}
function createPkcePair() {
  const verifier = randomUrlSafe(32);
  return {
    verifier,
    challenge: createHash("sha256").update(verifier).digest("base64url"),
    state: randomUrlSafe(16)
  };
}
function decodeJwtPayload(token) {
  const parts = token.split(".");
  const payload = parts[1];
  if (parts.length < 2 || payload === void 0) return void 0;
  try {
    const json = Buffer.from(payload, "base64url").toString("utf8");
    const value = JSON.parse(json);
    return isRecord(value) ? value : void 0;
  } catch {
    return void 0;
  }
}
function joinUrl(issuer, path) {
  return `${issuer.replace(/\/+$/u, "")}${path}`;
}
async function discoverOidcEndpoints(issuer, fetchImpl = fetch) {
  const fallback = {
    authorizationEndpoint: joinUrl(issuer, GROK_OAUTH_AUTHORIZE_PATH),
    tokenEndpoint: joinUrl(issuer, GROK_OAUTH_TOKEN_PATH)
  };
  try {
    const response = await fetchImpl(joinUrl(issuer, "/.well-known/openid-configuration"), {
      headers: { accept: "application/json" }
    });
    if (!response.ok) return fallback;
    const body = await response.json();
    if (!isRecord(body)) return fallback;
    const authorizationEndpoint = body["authorization_endpoint"];
    const tokenEndpoint = body["token_endpoint"];
    const userinfoEndpoint = body["userinfo_endpoint"];
    if (typeof authorizationEndpoint !== "string" || authorizationEndpoint.length === 0) return fallback;
    if (typeof tokenEndpoint !== "string" || tokenEndpoint.length === 0) return fallback;
    return {
      authorizationEndpoint,
      tokenEndpoint,
      ...typeof userinfoEndpoint === "string" && userinfoEndpoint.length > 0 ? { userinfoEndpoint } : {}
    };
  } catch {
    return fallback;
  }
}
function spawnDetached(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "ignore",
      detached: true
    });
    child.once("error", reject);
    child.once("spawn", () => {
      child.unref();
      resolve();
    });
  });
}
async function openSystemBrowser(url) {
  if (!/^https?:\/\//u.test(url)) throw new Error("refusing to open a non-http url");
  const platform = typeof process !== "undefined" ? process.platform : "";
  const commands = platform === "darwin" ? [["open", [url]]] : platform === "win32" ? [["cmd", ["/c", "start", '""', url]]] : [
    ["xdg-open", [url]],
    ["sensible-open", [url]]
  ];
  let last;
  for (const [command, args] of commands) {
    try {
      await spawnDetached(command, args);
      return;
    } catch (error) {
      last = error;
    }
  }
  throw last instanceof Error ? last : new Error("could not open a system browser");
}
function createGrokAuthRuntime(overrides) {
  return {
    issuer: GROK_OAUTH_ISSUER,
    clientId: GROK_OAUTH_CLIENT_ID,
    scope: GROK_OAUTH_SCOPE.join(" "),
    openBrowser: openSystemBrowser,
    fetch,
    now: () => Date.now(),
    timeoutMs: GROK_OAUTH_TIMEOUT_MS,
    refreshSkewMs: GROK_OAUTH_REFRESH_SKEW_MS,
    ...overrides
  };
}
function readString2(record, key) {
  const value = record[key];
  return typeof value === "string" && value.length > 0 ? value : void 0;
}
function expiresAtFromTokens(body, now) {
  const expiresIn = body["expires_in"];
  if (typeof expiresIn === "number" && Number.isFinite(expiresIn) && expiresIn > 0) {
    return new Date(now + expiresIn * 1e3).toISOString();
  }
  for (const token of [body["id_token"], body["access_token"]]) {
    if (typeof token !== "string") continue;
    const exp = decodeJwtPayload(token)?.["exp"];
    if (typeof exp === "number" && Number.isFinite(exp) && exp > 0) {
      return new Date(exp * 1e3).toISOString();
    }
  }
  return new Date(now).toISOString();
}
async function accountFromTokens(body, accessToken, userinfoEndpoint, fetchImpl) {
  const idToken = readString2(body, "id_token");
  const claims = idToken === void 0 ? void 0 : decodeJwtPayload(idToken);
  let email = claims !== void 0 ? readString2(claims, "email") : void 0;
  let userId = claims !== void 0 ? readString2(claims, "sub") : void 0;
  if ((email === void 0 || userId === void 0) && userinfoEndpoint !== void 0) {
    try {
      const response = await fetchImpl(userinfoEndpoint, {
        headers: {
          authorization: `Bearer ${accessToken}`,
          accept: "application/json"
        }
      });
      if (response.ok) {
        const info = await response.json();
        if (isRecord(info)) {
          email ??= readString2(info, "email");
          userId ??= readString2(info, "sub");
        }
      }
    } catch {
    }
  }
  return {
    ...email === void 0 ? {} : { email },
    ...userId === void 0 ? {} : { userId }
  };
}
async function parseTokenResponse(response, now, userinfoEndpoint, fetchImpl, previous) {
  if (!response.ok) return void 0;
  let body;
  try {
    body = await response.json();
  } catch {
    return void 0;
  }
  if (!isRecord(body)) return void 0;
  const accessToken = readString2(body, "access_token");
  const refreshToken = readString2(body, "refresh_token") ?? previous?.refreshToken;
  if (accessToken === void 0 || refreshToken === void 0) return void 0;
  const account = await accountFromTokens(body, accessToken, userinfoEndpoint, fetchImpl);
  const email = account.email ?? previous?.email;
  const userId = account.userId ?? previous?.userId;
  return {
    accessToken,
    refreshToken,
    expiresAt: expiresAtFromTokens(body, now),
    ...email === void 0 ? {} : { email },
    ...userId === void 0 ? {} : { userId }
  };
}
async function refreshSession(runtime, session) {
  const endpoints = await discoverOidcEndpoints(runtime.issuer, runtime.fetch);
  let response;
  try {
    response = await runtime.fetch(endpoints.tokenEndpoint, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        accept: "application/json"
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: session.refreshToken,
        client_id: runtime.clientId
      })
    });
  } catch {
    return { ok: false, network: true };
  }
  if (!response.ok) return { ok: false };
  const refreshed = await parseTokenResponse(response, runtime.now(), endpoints.userinfoEndpoint, runtime.fetch, session);
  if (refreshed === void 0) return { ok: false };
  return { ok: true, session: refreshed };
}
async function ensureFreshStore(runtime) {
  const path = runtime.resolveSessionPath();
  const store = await readSessionStore(path);
  if (store.accounts.length === 0) return emptyStore();
  const active = activeAccountFrom(store);
  if (active === void 0) return store;
  if (Date.parse(active.expiresAt) - runtime.now() > runtime.refreshSkewMs) return store;
  const refreshed = await refreshSession(runtime, active);
  if (!refreshed.ok) {
    if ("network" in refreshed && refreshed.network === true) return store;
    const next2 = removeAccount(store, publicAccountId(active));
    if (next2.accounts.length === 0) await deleteSession(path);
    else await writeSessionStore(path, next2);
    return next2;
  }
  const next = withActiveAccount(store, refreshed.session);
  await writeSessionStore(path, next);
  return next;
}
async function ensureFreshSession(runtime) {
  return activeAccountFrom(await ensureFreshStore(runtime));
}
async function ensureFreshAccounts(runtime) {
  const path = runtime.resolveSessionPath();
  const store = await readSessionStore(path);
  if (store.accounts.length === 0) return emptyStore();
  const kept = [];
  let changed = false;
  for (const account of store.accounts) {
    if (Date.parse(account.expiresAt) - runtime.now() > runtime.refreshSkewMs) {
      kept.push(cloneSession(account));
      continue;
    }
    const refreshed = await refreshSession(runtime, account);
    if (!refreshed.ok) {
      if ("network" in refreshed && refreshed.network === true) {
        kept.push(cloneSession(account));
        continue;
      }
      changed = true;
      continue;
    }
    changed = true;
    kept.push(cloneSession(refreshed.session));
  }
  if (!changed) return store;
  if (kept.length === 0) {
    await deleteSession(path);
    return emptyStore();
  }
  const previousActive = store.activeAccountId;
  const stillHasActive = previousActive !== void 0 && kept.some((account) => accountKeyOf(account) === previousActive || publicAccountId(account) === previousActive);
  const nextActive = stillHasActive ? previousActive : accountKeyOf(kept[0]);
  const next = {
    version: store.version,
    ...nextActive === void 0 ? {} : { activeAccountId: nextActive },
    accounts: kept
  };
  await writeSessionStore(path, next);
  return next;
}
async function statusFromRuntime(runtime) {
  return statusFromStore(await ensureFreshStore(runtime));
}
async function switchRuntimeAccount(runtime, accountId) {
  const path = runtime.resolveSessionPath();
  const switched = switchActiveAccount(await readSessionStore(path), accountId);
  if (switched === void 0) return retryable("That Grok account is not saved on this machine.");
  await writeSessionStore(path, switched);
  return { ok: true, status: statusFromStore(await ensureFreshStore(runtime)) };
}
async function removeRuntimeAccount(runtime, accountId) {
  const path = runtime.resolveSessionPath();
  const store = await readSessionStore(path);
  const active = activeAccountFrom(store);
  const targetId = accountId ?? (active === void 0 ? void 0 : publicAccountId(active));
  if (targetId === void 0) {
    await deleteSession(path);
    return { ok: true, status: statusFromStore(emptyStore()) };
  }
  const next = removeAccount(store, targetId);
  if (next.accounts.length === 0) await deleteSession(path);
  else await writeSessionStore(path, next);
  return {
    ok: true,
    status: statusFromStore(next.accounts.length === 0 ? emptyStore() : await ensureFreshStore(runtime))
  };
}
var loginInFlight = /* @__PURE__ */ new WeakSet();
var pendingPaste = /* @__PURE__ */ new WeakMap();
function createPendingPaste() {
  let deliver = () => void 0;
  const wait = new Promise((resolve) => {
    deliver = resolve;
  });
  return {
    deliver,
    wait
  };
}
async function startPkceLogin(runtime, signal) {
  if (loginInFlight.has(runtime)) return retryable("Sign-in is already in progress.");
  loginInFlight.add(runtime);
  let server;
  const local = new AbortController();
  const onParentAbort = () => {
    local.abort();
  };
  signal?.addEventListener("abort", onParentAbort);
  try {
    if (signal?.aborted === true || local.signal.aborted) return retryable("Sign-in was cancelled.");
    const endpoints = await discoverOidcEndpoints(runtime.issuer, runtime.fetch);
    const listener = await listenLoopback();
    server = listener.server;
    const pkce = createPkcePair();
    const redirectUri = `http://127.0.0.1:${String(listener.port)}/callback`;
    const authorize = new URL(endpoints.authorizationEndpoint);
    authorize.searchParams.set("response_type", "code");
    authorize.searchParams.set("client_id", runtime.clientId);
    authorize.searchParams.set("redirect_uri", redirectUri);
    authorize.searchParams.set("scope", runtime.scope);
    authorize.searchParams.set("state", pkce.state);
    authorize.searchParams.set("code_challenge", pkce.challenge);
    authorize.searchParams.set("code_challenge_method", "S256");
    authorize.searchParams.set("prompt", "select_account");
    const paste = createPendingPaste();
    pendingPaste.set(runtime, paste);
    const callback = waitForCallback(server, pkce.state, runtime.timeoutMs, local.signal);
    try {
      await runtime.openBrowser(authorize.toString());
    } catch {
      local.abort();
      await callback.catch(() => void 0);
      return retryable("Sign-in could not be completed.");
    }
    const pasted = paste.wait.then((code) => ({
      kind: "code",
      code
    }));
    const result = await Promise.race([callback, pasted]);
    if (result.kind === "mismatch") return retryable("Sign-in rejected a mismatched state.");
    if (result.kind === "denied") return retryable("Sign-in did not complete.");
    let tokenResponse;
    try {
      tokenResponse = await runtime.fetch(endpoints.tokenEndpoint, {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          accept: "application/json"
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: result.code,
          redirect_uri: redirectUri,
          client_id: runtime.clientId,
          code_verifier: pkce.verifier
        })
      });
    } catch (error) {
      return retryable(authNetworkHint(error));
    }
    if (!tokenResponse.ok) {
      return retryable(await authRejectionHint(tokenResponse, [result.code, pkce.verifier]));
    }
    const session = await parseTokenResponse(tokenResponse, runtime.now(), endpoints.userinfoEndpoint, runtime.fetch);
    if (session === void 0) return retryable("auth.x.ai returned an unexpected token response. Try signing in again.");
    const path = runtime.resolveSessionPath();
    const before = await readSessionStore(path);
    const existing = before.accounts.find((account) => sameAccount(account, session));
    const next = upsertAccount(before, session, true);
    await writeSessionStore(path, next);
    return {
      ok: true,
      ...existing === void 0 ? {} : { reused: true },
      ...session.email === void 0 ? {} : { email: session.email },
      accountId: publicAccountId(session)
    };
  } catch (error) {
    const code = error.code;
    if (code === "ABORT_ERR" || signal?.aborted === true || local.signal.aborted) return retryable("Sign-in was cancelled.");
    if (code === "TIMEOUT") return retryable("Sign-in timed out.");
    return retryable("Sign-in could not be completed.");
  } finally {
    signal?.removeEventListener("abort", onParentAbort);
    if (server !== void 0) await closeServer(server);
    pendingPaste.delete(runtime);
    loginInFlight.delete(runtime);
  }
}
async function completePkceLogin(runtime, code) {
  const trimmed = code.trim();
  if (trimmed.length === 0) return retryable("Paste the sign-in code from the browser page.");
  const pending = pendingPaste.get(runtime);
  if (pending === void 0) return retryable("Sign-in is not waiting for a code.");
  pending.deliver(trimmed);
  return { ok: true };
}
var GROK_CLI_REQUEST_HEADERS = Object.freeze({
  "x-grok-client-version": "1.0.4",
  "x-grok-client-identifier": "grok-shell"
});

// src/host/thinking.ts
import { createAssistantMessageEventStream } from "@earendil-works/pi-ai";
var GROK_SERVER_SEARCH_CALL_PREFIXES = [
  "xs_call-",
  "ws_call-",
  "web_search_call-"
];
function isGrokServerSearchToolCallId(id) {
  if (id === void 0 || id.length === 0) return false;
  const callId = id.split("|")[0] ?? id;
  return GROK_SERVER_SEARCH_CALL_PREFIXES.some((prefix) => callId.startsWith(prefix));
}
function toolCallFromEvent(event) {
  if (event.type === "toolcall_end") {
    return {
      id: event.toolCall.id,
      name: event.toolCall.name
    };
  }
  if (event.type !== "toolcall_start" && event.type !== "toolcall_delta") return void 0;
  const block = event.partial?.content?.[event.contentIndex];
  if (!isRecord(block) || block["type"] !== "toolCall") return void 0;
  const id = typeof block["id"] === "string" ? block["id"] : void 0;
  const name2 = typeof block["name"] === "string" ? block["name"] : void 0;
  if (id === void 0 || name2 === void 0) return void 0;
  return { id, name: name2 };
}
function stripGrokServerSearchToolCalls(message) {
  if (!message || !Array.isArray(message.content)) return message;
  const content = message.content.filter(
    (block) => !(block.type === "toolCall" && isGrokServerSearchToolCallId(block.id))
  );
  if (content.length === message.content.length) return message;
  const stillCalling = content.some((block) => block.type === "toolCall");
  const stopReason = message.stopReason === "toolUse" && !stillCalling ? "stop" : message.stopReason;
  return {
    ...message,
    content,
    stopReason
  };
}
var GrokServerSearchCallFilter = class {
  hidden = /* @__PURE__ */ new Set();
  take(event) {
    switch (event.type) {
      case "toolcall_start":
      case "toolcall_delta":
      case "toolcall_end": {
        if (this.hidden.has(event.contentIndex)) return [];
        const call = toolCallFromEvent(event);
        if (call !== void 0 && isGrokServerSearchToolCallId(call.id)) {
          this.hidden.add(event.contentIndex);
          return [];
        }
        return [event];
      }
      case "done": {
        const message = stripGrokServerSearchToolCalls(event.message);
        const reason = message.stopReason === "stop" || message.stopReason === "length" || message.stopReason === "toolUse" ? message.stopReason : event.reason;
        return [
          {
            ...event,
            message,
            reason
          }
        ];
      }
      case "error":
        return [
          {
            ...event,
            error: stripGrokServerSearchToolCalls(event.error)
          }
        ];
      default:
        return [event];
    }
  }
};
function isDisplayableThinking(text) {
  return (text ?? "").trim().length > 0;
}
function isGrokPackedReasoning(value) {
  if (!isRecord(value) || value["type"] !== GROK_PACKED_REASONING_TYPE) return false;
  return Array.isArray(value["items"]);
}
function unpackSignature(raw) {
  if (raw === void 0 || raw.length === 0) return [];
  try {
    const parsed = JSON.parse(raw);
    if (isGrokPackedReasoning(parsed)) return parsed.items;
    return [parsed];
  } catch {
    return [];
  }
}
function withPackedSignature(block, items) {
  if (items.length === 0) return block;
  if (items.length === 1 && !isGrokPackedReasoning(items[0])) {
    return {
      ...block,
      thinkingSignature: JSON.stringify(items[0])
    };
  }
  const packed = {
    type: GROK_PACKED_REASONING_TYPE,
    items
  };
  return {
    ...block,
    thinkingSignature: JSON.stringify(packed)
  };
}
function packGrokThinkingBlocks(content) {
  const leading = [];
  const out = [];
  let carrierIndex = -1;
  for (const block of content) {
    if (block.type !== "thinking") {
      out.push(block);
      continue;
    }
    const items = unpackSignature(block.thinkingSignature);
    if (isDisplayableThinking(block.thinking)) {
      const packed = withPackedSignature(block, [...leading, ...items]);
      leading.length = 0;
      carrierIndex = out.length;
      out.push(packed);
      continue;
    }
    leading.push(
      ...items.length > 0 ? items : [
        {
          type: "reasoning",
          summary: []
        }
      ]
    );
  }
  if (leading.length === 0) return out;
  if (carrierIndex >= 0) {
    const carrier = out[carrierIndex];
    if (carrier !== void 0) {
      out[carrierIndex] = withPackedSignature(carrier, [...unpackSignature(carrier.thinkingSignature), ...leading]);
    }
    return out;
  }
  const first = content.find((block) => block.type === "thinking");
  if (first === void 0) return out;
  out.unshift(withPackedSignature(first, leading));
  return out;
}
function expandPackedGrokReasoningInput(payload) {
  if (!isRecord(payload) || !Array.isArray(payload["input"])) return payload;
  const input = [];
  for (const item of payload["input"]) {
    if (isGrokPackedReasoning(item)) input.push(...item.items);
    else input.push(item);
  }
  return {
    ...payload,
    input
  };
}
var GrokThinkingFilter = class {
  heldStarts = /* @__PURE__ */ new Map();
  opened = /* @__PURE__ */ new Set();
  take(event) {
    switch (event.type) {
      case "thinking_start":
        this.heldStarts.set(event.contentIndex, event);
        return [];
      case "thinking_delta":
        if (!isDisplayableThinking(event.delta) && !this.opened.has(event.contentIndex)) return [];
        return this.openAnd(event);
      case "thinking_end":
        if (!isDisplayableThinking(event.content) && !this.opened.has(event.contentIndex)) {
          this.heldStarts.delete(event.contentIndex);
          return [];
        }
        return this.openAnd(event);
      case "done":
        return [
          {
            ...event,
            message: packAssistant(event.message)
          }
        ];
      case "error":
        return [
          {
            ...event,
            error: packAssistant(event.error)
          }
        ];
      default:
        return [event];
    }
  }
  openAnd(event) {
    const forwarded = [];
    const held = this.heldStarts.get(event.contentIndex);
    if (held !== void 0 && !this.opened.has(event.contentIndex)) forwarded.push(held);
    this.heldStarts.delete(event.contentIndex);
    this.opened.add(event.contentIndex);
    forwarded.push(event);
    return forwarded;
  }
};
function packAssistant(message) {
  if (!message || !Array.isArray(message.content)) return message;
  return {
    ...message,
    content: packGrokThinkingBlocks(message.content)
  };
}
function filterGrokThinkingStream(inner) {
  const out = createAssistantMessageEventStream();
  pumpGrokThinkingStream(inner, out);
  return out;
}
async function pumpGrokThinkingStream(inner, out) {
  const search = new GrokServerSearchCallFilter();
  const thinking = new GrokThinkingFilter();
  try {
    for await (const event of inner) {
      for (const afterSearch of search.take(event)) {
        for (const next of thinking.take(afterSearch)) {
          out.push(next);
        }
      }
    }
  } finally {
    out.end();
  }
}

// src/host/billing.ts
function asEffort(value) {
  if (!isRecord(value)) return void 0;
  const id = value["id"];
  const wire = value["value"];
  const label = value["label"];
  const description = value["description"];
  if (typeof id !== "string" || id.length === 0) return void 0;
  if (typeof wire !== "string" || wire.length === 0) return void 0;
  return {
    id,
    value: wire,
    ...typeof label === "string" && label.length > 0 ? { label } : {},
    ...typeof description === "string" && description.length > 0 ? { description } : {}
  };
}
function asEfforts(value) {
  if (!Array.isArray(value)) return void 0;
  const efforts = [];
  const seen = /* @__PURE__ */ new Set();
  for (const entry of value) {
    const effort = asEffort(entry);
    if (effort === void 0 || seen.has(effort.value)) continue;
    seen.add(effort.value);
    efforts.push(effort);
  }
  return efforts.length > 0 ? efforts : void 0;
}
function asModel(value) {
  if (!isRecord(value)) return void 0;
  const id = value["id"];
  if (typeof id !== "string" || id.length === 0) return void 0;
  const name2 = value["name"];
  const thinking = value["supports_reasoning_effort"] === true || value["thinking"] === true;
  const defaultReasoningEffort = value["reasoning_effort"];
  const reasoningEfforts = asEfforts(value["reasoning_efforts"]);
  const contextWindow = value["context_window"] ?? value["contextWindow"];
  return {
    id,
    ...typeof name2 === "string" && name2.length > 0 ? { name: name2 } : {},
    thinking,
    vision: true,
    ...typeof contextWindow === "number" && Number.isInteger(contextWindow) && contextWindow > 0 ? { contextWindow } : {},
    ...thinking && typeof defaultReasoningEffort === "string" && defaultReasoningEffort.length > 0 ? { defaultReasoningEffort } : {},
    ...thinking && reasoningEfforts !== void 0 ? { reasoningEfforts } : {}
  };
}
function parseGrokModels(value) {
  if (!isRecord(value) || !Array.isArray(value["data"])) return void 0;
  const models = [];
  const seen = /* @__PURE__ */ new Set();
  for (const entry of value["data"]) {
    const model = asModel(entry);
    if (model === void 0 || seen.has(model.id)) continue;
    seen.add(model.id);
    models.push(model);
  }
  return models.length > 0 ? models : void 0;
}
async function readGrokModels(request) {
  const url = request.modelsURL ?? GROK_MODELS_URL;
  const fetchImpl = request.fetch ?? fetch;
  try {
    const response = await fetchImpl(url, {
      headers: {
        accept: "application/json",
        authorization: `Bearer ${request.accessToken}`,
        ...GROK_CLI_REQUEST_HEADERS
      },
      redirect: "error",
      ...request.signal === void 0 ? {} : { signal: request.signal }
    });
    if (!response.ok) {
      await response.body?.cancel();
      return void 0;
    }
    return parseGrokModels(await response.json());
  } catch {
    return void 0;
  }
}
function fallbackGrokCatalog() {
  return GROK_CATALOG.map((model) => ({ ...model }));
}
function redactSecrets2(message, secrets) {
  let next = message;
  for (const secret of secrets) {
    if (secret === void 0 || secret.length === 0) continue;
    next = next.split(secret).join("[redacted]");
  }
  return next;
}
function isoInstant(value) {
  if (typeof value === "string" && value.length > 0) {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? new Date(parsed).toISOString() : void 0;
  }
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    const ms = value < 1e12 ? value * 1e3 : value;
    const date = new Date(ms);
    return Number.isNaN(date.getTime()) ? void 0 : date.toISOString();
  }
  return void 0;
}
function parseWindow(value) {
  if (!isRecord(value)) return void 0;
  const id = value["id"];
  const used = value["used"];
  const limit = value["limit"];
  const period = value["period"];
  const resetsAt = isoInstant(value["resetsAt"] ?? value["resetAt"] ?? value["reset_at"] ?? value["end"]);
  if (typeof id !== "string" || id.length === 0) return void 0;
  if (typeof used !== "number" || !Number.isFinite(used) || used < 0) return void 0;
  if (typeof limit !== "number" || !Number.isFinite(limit) || limit < 0) return void 0;
  if (period !== void 0 && (typeof period !== "string" || period.length === 0)) return void 0;
  return {
    id,
    used,
    limit,
    ...period === void 0 ? {} : { period },
    ...resetsAt === void 0 ? {} : { resetsAt }
  };
}
function moneyVal(value) {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) return value;
  if (!isRecord(value)) return void 0;
  const val = value["val"];
  if (typeof val !== "number" || !Number.isFinite(val) || val < 0) return void 0;
  return val;
}
function periodFromConfig(config) {
  const type = (isRecord(config["currentPeriod"]) ? config["currentPeriod"] : void 0)?.["type"];
  if (type === "USAGE_PERIOD_TYPE_WEEKLY") return "week";
  if (type === "USAGE_PERIOD_TYPE_MONTHLY") return "month";
  return void 0;
}
function resetFromConfig(config) {
  return isoInstant((isRecord(config["currentPeriod"]) ? config["currentPeriod"] : void 0)?.["end"] ?? config["billingPeriodEnd"]);
}
function percentWindow(id, percent, period, resetsAt) {
  return {
    id,
    used: Math.min(100, Math.max(0, Math.round(percent * 10) / 10)),
    limit: 100,
    unit: "percent",
    ...period === void 0 ? {} : { period },
    ...resetsAt === void 0 ? {} : { resetsAt }
  };
}
function isCreditsSurface(config) {
  return isRecord(config["currentPeriod"]) || config["isUnifiedBillingUser"] === true;
}
function parseCreditsConfig(config, fetchedAt) {
  const period = periodFromConfig(config);
  const resetsAt = resetFromConfig(config);
  const products = [];
  const productUsage = config["productUsage"];
  if (Array.isArray(productUsage)) {
    for (const entry of productUsage) {
      if (!isRecord(entry)) continue;
      const product = entry["product"];
      if (typeof product !== "string" || product.length === 0) continue;
      const percent = entry["usagePercent"];
      if (typeof percent === "number" && Number.isFinite(percent)) {
        products.push(percentWindow(product, percent, period, resetsAt));
      } else {
        products.push(percentWindow(product, 0, period, resetsAt));
      }
    }
  }
  const windows = [];
  const reportedTotal = config["creditUsagePercent"];
  const totalPercent = typeof reportedTotal === "number" && Number.isFinite(reportedTotal) ? reportedTotal : products.length > 0 ? products.reduce((sum, item) => sum + item.used, 0) : isCreditsSurface(config) ? 0 : void 0;
  if (totalPercent !== void 0) windows.push(percentWindow("SuperGrok", totalPercent, period, resetsAt));
  windows.push(...products);
  return windows.length === 0 ? void 0 : {
    fetchedAt,
    windows
  };
}
function parsePrepaidConfig(config, fetchedAt) {
  const used = moneyVal(config["used"]);
  const limit = moneyVal(config["monthlyLimit"]);
  if (used === void 0 || limit === void 0) return void 0;
  if (used === 0 && limit === 0) return void 0;
  const period = periodFromConfig(config);
  const resetsAt = resetFromConfig(config);
  return {
    fetchedAt,
    windows: [
      {
        id: "monthly",
        used,
        limit,
        ...period === void 0 ? {} : { period },
        ...resetsAt === void 0 ? {} : { resetsAt }
      }
    ]
  };
}
function parseCliBillingConfig(value, fetchedAt) {
  if (!isRecord(value)) return void 0;
  const config = value["config"];
  if (!isRecord(config)) return void 0;
  return parseCreditsConfig(config, fetchedAt) ?? parsePrepaidConfig(config, fetchedAt);
}
function parseGrokBilling(value, fetchedAt) {
  const fromConfig = parseCliBillingConfig(value, fetchedAt);
  if (fromConfig !== void 0) return fromConfig;
  const windowsValue = isRecord(value) ? value.windows : void 0;
  if (!Array.isArray(windowsValue)) return void 0;
  const windows = [];
  for (const entry of windowsValue) {
    const window = parseWindow(entry);
    if (window !== void 0) windows.push(window);
  }
  if (windows.length === 0) return void 0;
  return {
    fetchedAt,
    windows
  };
}
async function readGrokUsage(request) {
  const url = request.billingURL ?? GROK_BILLING_URL;
  const fetchImpl = request.fetch ?? fetch;
  const fetchedAt = new Date((request.now ?? Date.now)()).toISOString();
  const timeout = AbortSignal.timeout(DEFAULT_USAGE_REQUEST_TIMEOUT_MS);
  const signal = request.signal === void 0 ? timeout : AbortSignal.any([request.signal, timeout]);
  const secrets = [request.accessToken];
  let response;
  try {
    response = await fetchImpl(url, {
      method: "GET",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${request.accessToken}`,
        ...GROK_CLI_REQUEST_HEADERS
      },
      redirect: "error",
      signal
    });
  } catch (error) {
    if (request.signal?.aborted === true) throw new Error(redactSecrets2("Grok usage read aborted by caller", secrets));
    const detail = error instanceof Error && error.message.length > 0 ? `: ${error.message}` : "";
    throw new Error(redactSecrets2(`could not reach ${url}${detail}`, secrets));
  }
  if (response.status === 404) {
    await response.body?.cancel();
    return { status: "unsupported" };
  }
  if (response.status === 403) {
    await response.body?.cancel();
    throw new Error("This session cannot read Grok CLI billing. Sign out and sign in again.");
  }
  if (!response.ok) {
    await response.body?.cancel();
    throw new Error(redactSecrets2(`${url} answered ${String(response.status)}`, secrets));
  }
  const declared = Number(response.headers.get("content-length") ?? NaN);
  if (Number.isFinite(declared) && declared > MAX_USAGE_BYTES) {
    await response.body?.cancel();
    throw new Error(redactSecrets2(`${url} answered with more than ${String(MAX_USAGE_BYTES)} bytes`, secrets));
  }
  let text;
  try {
    text = await response.text();
  } catch (error) {
    const detail = error instanceof Error && error.message.length > 0 ? `: ${error.message}` : "";
    throw new Error(redactSecrets2(`${url} could not be read${detail}`, secrets));
  }
  if (text.length > MAX_USAGE_BYTES) {
    throw new Error(redactSecrets2(`${url} answered with more than ${String(MAX_USAGE_BYTES)} bytes`, secrets));
  }
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    return { status: "unsupported" };
  }
  const usage = parseGrokBilling(body, fetchedAt);
  return usage === void 0 ? { status: "unsupported" } : {
    status: "ok",
    usage
  };
}
function accountUsageFailure(error, session, active) {
  const secrets = [session.accessToken, session.refreshToken];
  let message = error instanceof Error && error.message.length > 0 ? error.message : "Grok usage read failed";
  for (const secret of secrets) {
    if (!secret || secret.length === 0) continue;
    message = message.split(secret).join("[redacted]");
  }
  return {
    accountId: publicAccountId(session),
    ...session.email === void 0 ? {} : { email: session.email },
    active,
    status: "error",
    message
  };
}
async function readAllAccountUsage(runtime, options, signal) {
  const store = await ensureFreshAccounts(runtime);
  if (store.accounts.length === 0) {
    return {
      status: "logged-out",
      accounts: []
    };
  }
  const active = activeAccountFrom(store);
  const activeId = active === void 0 ? void 0 : publicAccountId(active);
  const accounts = await Promise.all(
    store.accounts.map(async (session) => {
      const accountId = publicAccountId(session);
      const activeAccount = accountId === activeId;
      const base = {
        accountId,
        ...session.email === void 0 ? {} : { email: session.email },
        active: activeAccount
      };
      try {
        const result = await readGrokUsage({
          accessToken: session.accessToken,
          ...options?.billingURL === void 0 ? {} : { billingURL: options.billingURL },
          fetch: runtime.fetch,
          now: runtime.now,
          signal
        });
        if (result.status === "unsupported" || result.status === "logged-out") {
          return {
            ...base,
            status: "unsupported"
          };
        }
        return {
          ...base,
          status: "ok",
          usage: result.usage
        };
      } catch (error) {
        return accountUsageFailure(error, session, activeAccount);
      }
    })
  );
  return {
    status: "ok",
    accounts
  };
}

// src/host/adapter.ts
import * as piAi from "@earendil-works/pi-ai";
import { createProvider } from "@earendil-works/pi-ai";
import * as openAIResponses from "@earendil-works/pi-ai/api/openai-responses";
import { LlmAdapter, LlmError, ReasoningEffortId } from "@deepseek-ai/dsh-llm";
import { PiAiAdapter } from "@deepseek-ai/dsh-llm-pi-ai";

// src/host/image-gen.ts
import { mkdir as mkdir2, readFile as readFile2, writeFile as writeFile2 } from "node:fs/promises";
import { basename, dirname as dirname2 } from "node:path";
import { createRequire } from "node:module";
import { AttachmentId } from "@deepseek-ai/dsh-attachment";
import { defineTool } from "@deepseek-ai/dsh-tools";
import { createUserMessage } from "@deepseek-ai/dsh-llm";
var { name: PACKAGE_NAME, version: PACKAGE_VERSION } = createRequire(import.meta.url)("./package.json");
var GROK_PLUGIN_IDENTITY_HEADER = `${PACKAGE_NAME}/${PACKAGE_VERSION}`;
function mediaTypeOf(data) {
  if (data.length >= 8 && data[0] === 137 && data[1] === 80 && data[2] === 78 && data[3] === 71 && data[4] === 13 && data[5] === 10 && data[6] === 26 && data[7] === 10)
    return "image/png";
  if (data.length >= 3 && data[0] === 255 && data[1] === 216 && data[2] === 255) return "image/jpeg";
  if (data.length >= 6) {
    const signature = String.fromCharCode(...data.subarray(0, 6));
    if (signature === "GIF87a" || signature === "GIF89a") return "image/gif";
  }
  if (data.length >= 12 && String.fromCharCode(...data.subarray(0, 4)) === "RIFF" && String.fromCharCode(...data.subarray(8, 12)) === "WEBP")
    return "image/webp";
  return void 0;
}
function extensionOf(mediaType) {
  if (mediaType === "image/jpeg") return "jpg";
  if (mediaType === "image/webp") return "webp";
  if (mediaType === "image/gif") return "gif";
  return "png";
}
function redact(message, secret) {
  return secret.length === 0 ? message : message.split(secret).join("[redacted]");
}
function fail(message, secret) {
  throw new Error(redact(message, secret));
}
function errorMessage(error) {
  return error instanceof Error && error.message.length > 0 ? error.message : "network error";
}
function isTransportDrop(error) {
  return /\bterminated\b|premature close|ECONNRESET|ECONNABORTED|other side closed|fetch failed/i.test(
    errorMessage(error)
  );
}
function describeNetworkFailure(error, user, timeout, timeoutMs) {
  if (user?.aborted) return "Grok Imagine request was cancelled";
  if (timeout.aborted) return `Grok Imagine timed out after ${String(timeoutMs / 1e3)}s`;
  if (isTransportDrop(error)) return "Grok Imagine connection dropped while reading the image (undici: terminated)";
  return `Grok Imagine request failed: ${errorMessage(error)}`;
}
function combineSignals(user, timeoutMs) {
  const timeout = AbortSignal.timeout(timeoutMs);
  if (user === void 0) {
    return {
      signal: timeout,
      timeout,
      dispose: () => void 0
    };
  }
  if (typeof AbortSignal.any === "function") {
    return {
      signal: AbortSignal.any([user, timeout]),
      timeout,
      dispose: () => void 0
    };
  }
  const controller = new AbortController();
  const onAbort = () => {
    controller.abort(user.aborted ? user.reason : timeout.reason);
  };
  user.addEventListener("abort", onAbort);
  timeout.addEventListener("abort", onAbort);
  if (user.aborted || timeout.aborted) onAbort();
  return {
    signal: controller.signal,
    timeout,
    dispose: () => {
      user.removeEventListener("abort", onAbort);
      timeout.removeEventListener("abort", onAbort);
    }
  };
}
function requestHeaders(accessToken) {
  return {
    ...GROK_CLI_REQUEST_HEADERS,
    "X-Dsh-Plugin": GROK_PLUGIN_IDENTITY_HEADER,
    authorization: `Bearer ${accessToken}`,
    "content-type": "application/json"
  };
}
function imagesURL(override) {
  if (override !== void 0 && override.length > 0) return override;
  return "https://api.x.ai/v1/images/generations";
}
function decodeB64(value, secret) {
  try {
    return Uint8Array.from(Buffer.from(value, "base64"));
  } catch (error) {
    fail(
      `Grok Imagine returned unreadable image data: ${error instanceof Error && error.message.length > 0 ? error.message : "invalid base64"}`,
      secret
    );
  }
}
async function downloadUrl(url, accessToken, fetchImpl, signal) {
  let response;
  try {
    response = await fetchImpl(url, {
      method: "GET",
      headers: { authorization: `Bearer ${accessToken}` },
      signal
    });
  } catch (error) {
    fail(
      `Grok Imagine image download failed: ${error instanceof Error && error.message.length > 0 ? error.message : "network error"}`,
      accessToken
    );
  }
  if (!response.ok) fail(`Grok Imagine image download failed with HTTP ${String(response.status)}`, accessToken);
  return new Uint8Array(await response.arrayBuffer());
}
function firstImage(payload, secret) {
  if (!isRecord(payload)) fail("Grok Imagine returned an unparseable body", secret);
  const data = payload["data"];
  if (!Array.isArray(data) || data.length === 0 || !isRecord(data[0])) {
    fail("Grok Imagine returned no image data", secret);
  }
  const row = data[0];
  const b64 = typeof row["b64_json"] === "string" && row["b64_json"].length > 0 ? row["b64_json"] : void 0;
  const url = typeof row["url"] === "string" && row["url"].length > 0 ? row["url"] : void 0;
  const revisedPrompt = typeof row["revised_prompt"] === "string" && row["revised_prompt"].length > 0 ? row["revised_prompt"] : void 0;
  return {
    ...b64 === void 0 ? {} : { b64 },
    ...url === void 0 ? {} : { url },
    ...revisedPrompt === void 0 ? {} : { revisedPrompt }
  };
}
async function generateGrokImage(request) {
  const prompt = request.prompt.trim();
  if (prompt.length === 0) throw new Error("grok_image_gen prompt must not be empty");
  if (request.aspectRatio !== void 0 && !GROK_IMAGINE_ASPECT_RATIOS.includes(request.aspectRatio)) {
    throw new Error(`grok_image_gen aspect_ratio must be one of ${GROK_IMAGINE_ASPECT_RATIOS.join(", ")}`);
  }
  const timeoutMs = request.timeoutMs ?? GROK_IMAGE_GEN_TIMEOUT_MS;
  const fetchImpl = request.fetchImpl ?? fetch;
  const isEdit = request.referenceImages !== void 0 && request.referenceImages.length > 0;
  const wants2k = /\b2k\b/i.test(prompt);
  const body = isEdit ? {
    model: GROK_IMAGINE_MODEL,
    prompt,
    n: 1,
    images: request.referenceImages,
    response_format: "b64_json",
    ...request.aspectRatio === void 0 ? {} : { aspect_ratio: request.aspectRatio },
    ...wants2k ? { resolution: "2k" } : {}
  } : {
    model: GROK_IMAGINE_MODEL,
    prompt,
    n: 1,
    quality: "medium",
    response_format: "b64_json",
    ...request.aspectRatio === void 0 ? {} : { aspect_ratio: request.aspectRatio },
    ...wants2k ? { resolution: "2k" } : {}
  };
  const endpoint = isEdit ? `${GROK_IMAGINE_BASE_URL}/images/edits` : imagesURL(request.imagesURL);
  const attempts = 2;
  let raw = "";
  let response;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const { signal, timeout, dispose } = combineSignals(request.signal, timeoutMs);
    try {
      response = await fetchImpl(endpoint, {
        method: "POST",
        headers: requestHeaders(request.accessToken),
        body: JSON.stringify(body),
        signal
      });
      raw = await response.text();
      dispose();
      break;
    } catch (error) {
      dispose();
      if (!(attempt < attempts && !request.signal?.aborted && !timeout.aborted && isTransportDrop(error))) {
        fail(describeNetworkFailure(error, request.signal, timeout, timeoutMs), request.accessToken);
      }
    }
  }
  if (response === void 0) fail("Grok Imagine request failed: network error", request.accessToken);
  if (!response.ok) {
    let detail = raw.slice(0, 500);
    try {
      const parsed2 = JSON.parse(raw);
      if (isRecord(parsed2) && isRecord(parsed2["error"]) && typeof parsed2["error"]["message"] === "string") {
        detail = parsed2["error"]["message"];
      }
    } catch {
    }
    fail(`Grok Imagine failed with HTTP ${String(response.status)}: ${detail}`, request.accessToken);
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    fail("Grok Imagine returned an unparseable body", request.accessToken);
  }
  const image = firstImage(parsed, request.accessToken);
  const bytes = image.b64 !== void 0 ? decodeB64(image.b64, request.accessToken) : image.url === void 0 ? fail("Grok Imagine returned no image data", request.accessToken) : await downloadUrl(image.url, request.accessToken, fetchImpl, request.signal ?? AbortSignal.timeout(timeoutMs));
  const mediaType = mediaTypeOf(bytes);
  if (mediaType === void 0) {
    fail("Grok Imagine returned image data that is not PNG, JPEG, WebP, or GIF", request.accessToken);
  }
  return {
    bytes,
    mediaType,
    ...image.revisedPrompt === void 0 ? {} : { revisedPrompt: image.revisedPrompt }
  };
}
function refOf(image) {
  return {
    attachmentId: AttachmentId(image.attachmentId),
    mediaType: image.mediaType,
    bytes: image.bytes,
    width: image.width,
    height: image.height,
    ...image.name === void 0 ? {} : { name: image.name }
  };
}
function contentOf(value) {
  const lines = [
    `<path>${value.path}</path>`,
    `<model>${value.model}</model>`,
    `<image>${value.image.mediaType}, ${String(value.image.width)}x${String(value.image.height)} px, ${String(
      value.image.bytes
    )} bytes</image>`
  ];
  if (value.revisedPrompt !== void 0) lines.push(`<revised_prompt>${value.revisedPrompt}</revised_prompt>`);
  if (value.saveWarning !== void 0) lines.push(`<warning>${value.saveWarning}</warning>`);
  return [
    {
      type: "text",
      text: lines.join("\n")
    },
    {
      type: "image",
      attachment: refOf(value.image)
    }
  ];
}
function sanitizeFilePart(value) {
  const cleaned = value.replace(/[^a-zA-Z0-9_-]+/gu, "_").replace(/^_+|_+$/gu, "");
  return cleaned.length > 0 ? cleaned.slice(0, 48) : "image";
}
function defaultRelativePath(prompt, mediaType) {
  return `generated/grok-${(/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/gu, "-").replace(/T/u, "-").replace(/Z$/u, "")}-${sanitizeFilePart(prompt)}.${extensionOf(mediaType)}`;
}
async function writeGeneratedFile(ctx, exec, relativePath, bytes) {
  const cwd = exec.agent?.session.header.cwd;
  const target = await ctx.fs.resolve(relativePath, {
    ...cwd === void 0 ? {} : { cwd },
    signal: exec.signal
  });
  const processPath = ctx.fs.processPath(target);
  await mkdir2(dirname2(processPath), { recursive: true });
  await writeFile2(processPath, bytes);
  const info = await ctx.fs.stat(target, exec.signal);
  if (info !== void 0) {
    ctx.emit(
      "fs/observed",
      target,
      {
        kind: "present",
        version: info.version
      },
      exec
    );
  }
  return target.displayPath;
}
function aspectRatioOf(value) {
  if (value === void 0) return void 0;
  const trimmed = value.trim();
  if (trimmed.length === 0) return void 0;
  if (!GROK_IMAGINE_ASPECT_RATIOS.includes(trimmed)) {
    throw new Error(`grok_image_gen aspect_ratio must be one of ${GROK_IMAGINE_ASPECT_RATIOS.join(", ")}`);
  }
  return trimmed;
}
function grokImageGenTool(ctx, options) {
  return defineTool({
    name: GROK_IMAGE_GEN_TOOL_NAME,
    description: 'Generate a raster image with Grok Imagine (xAI SuperGrok / Grok Build session). Uses this plugin\'s xAI login and subscription credits. When reference_images is provided, the request becomes a multi-reference edit on /v1/images/edits (up to 5 reference images; refer to them as <IMAGE_0>, <IMAGE_1>, ... in the prompt). If the prompt contains "2k", the image is generated at 2k resolution (default: 1k). Distinct from Codex `codex_generate_image`. Do not call unless the user asked for a bitmap image.',
    parameters: {
      prompt: {
        type: "string",
        required: true,
        description: "Image prompt. Be specific about subject, composition, style, text, and constraints."
      },
      aspect_ratio: {
        type: "string",
        enum: [...GROK_IMAGINE_ASPECT_RATIOS],
        description: "Optional aspect ratio. Examples: 1:1, 16:9, 9:16, auto."
      },
      reference_images: {
        type: "array",
        items: { type: "string" },
        description: "Optional. 1-5 local image paths (PNG/JPEG/WebP/GIF) used as reference images for multi-image editing. When provided, the request goes to /v1/images/edits and the prompt should refer to them as <IMAGE_0>, <IMAGE_1>, etc."
      },
      path: {
        type: "string",
        description: "Workspace-relative destination. Defaults to generated/grok-<stamp>.<ext> under the session cwd."
      }
    },
    output: {
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          path: {
            type: "string",
            required: true
          },
          prompt: {
            type: "string",
            required: true
          },
          model: {
            type: "string",
            required: true
          },
          revisedPrompt: { type: "string" },
          saveWarning: { type: "string" },
          image: {
            type: "object",
            required: true,
            additionalProperties: false,
            properties: {
              attachmentId: {
                type: "string",
                required: true
              },
              mediaType: {
                type: "string",
                required: true,
                enum: ["image/png", "image/jpeg", "image/webp", "image/gif"]
              },
              bytes: {
                type: "integer",
                required: true
              },
              width: {
                type: "integer",
                required: true
              },
              height: {
                type: "integer",
                required: true
              },
              name: { type: "string" }
            }
          }
        }
      },
      render: (_args, value) => contentOf(value)
    },
    timeoutMs: GROK_IMAGE_GEN_TIMEOUT_MS,
    isConcurrencySafe: () => false,
    async execute(args, exec) {
      const prompt = args.prompt.trim();
      if (prompt.length === 0) throw new Error("grok_image_gen prompt must not be empty");
      const attachments = ctx.attachments;
      const accessToken = await options.resolveAccessToken();
      const aspectRatio = aspectRatioOf(args.aspect_ratio);
      let referenceImages;
      if (Array.isArray(args.reference_images) && args.reference_images.length > 0) {
        const cwd = exec.agent?.session.header.cwd;
        referenceImages = [];
        for (const ref2 of args.reference_images.slice(0, 5)) {
          const refPath = String(ref2);
          const resolved = await ctx.fs.resolve(refPath, {
            ...cwd === void 0 ? {} : { cwd },
            signal: exec.signal
          });
          const bytes = await readFile2(ctx.fs.processPath(resolved));
          const mediaType = mediaTypeOf(bytes);
          if (mediaType === void 0) {
            throw new Error(`reference image ${refPath} is not a PNG, JPEG, WebP, or GIF file`);
          }
          referenceImages.push({ url: `data:${mediaType};base64,${Buffer.from(bytes).toString("base64")}` });
        }
      }
      const generated = await generateGrokImage({
        accessToken,
        prompt,
        signal: exec.signal,
        ...aspectRatio === void 0 ? {} : { aspectRatio },
        ...referenceImages === void 0 ? {} : { referenceImages },
        ...options.imagesURL === void 0 ? {} : { imagesURL: options.imagesURL },
        ...options.fetchImpl === void 0 ? {} : { fetchImpl: options.fetchImpl }
      }).catch((error) => {
        const message = error instanceof Error ? error.message : String(error);
        if (/^terminated$/i.test(message)) {
          throw new Error("Grok Imagine connection dropped while reading the image (undici: terminated)");
        }
        throw error;
      });
      if (!attachments.imageLimits.mediaTypes.includes(generated.mediaType)) {
        throw new Error(`${generated.mediaType} images are disabled by this deployment`);
      }
      const requestedPath = args.path === void 0 || args.path.trim().length === 0 ? defaultRelativePath(prompt, generated.mediaType) : args.path.trim();
      const desiredExt = extensionOf(generated.mediaType);
      const currentExt = basename(requestedPath).includes(".") ? basename(requestedPath).split(".").pop() : "";
      const relativePath = currentExt.length > 0 && currentExt.toLowerCase() !== desiredExt ? requestedPath.replace(/\.[^.]+$/, `.${desiredExt}`) : requestedPath;
      const ref = await attachments.saveImage({
        data: generated.bytes,
        mediaType: generated.mediaType,
        name: basename(relativePath)
      });
      let path = relativePath;
      let saveWarning;
      try {
        path = await writeGeneratedFile(ctx, exec, relativePath, generated.bytes);
      } catch (error) {
        saveWarning = `Image generation succeeded, but the image could not be saved to disk: ${error instanceof Error && error.message.length > 0 ? error.message : String(error)}`;
      }
      const value = {
        path,
        prompt,
        model: GROK_IMAGINE_MODEL,
        image: {
          attachmentId: ref.attachmentId,
          mediaType: ref.mediaType,
          bytes: ref.bytes,
          width: ref.width,
          height: ref.height,
          ...ref.name === void 0 ? {} : { name: ref.name }
        },
        ...generated.revisedPrompt === void 0 ? {} : { revisedPrompt: generated.revisedPrompt },
        ...saveWarning === void 0 ? {} : { saveWarning }
      };
      if (exec.parent !== void 0) {
        exec.deferContext(
          createUserMessage({
            content: contentOf(value),
            source: {
              kind: "plugin",
              plugin: "dsh-llm-grok"
            }
          })
        );
      }
      return value;
    },
    presentCall: (args) => ({
      card: "generic",
      title: `Grok image: ${args.prompt}`,
      kind: "other",
      rawInput: args.prompt,
      ...args.path === void 0 || args.path.trim().length === 0 ? {} : { locations: [{ path: args.path }] }
    })
  });
}

// src/host/adapter.ts
function openAIResponsesApi2() {
  if (typeof piAi.openAIResponsesApi === "function") {
    return piAi.openAIResponsesApi();
  }
  return openAIResponses;
}
function toolType(tool) {
  if (!isRecord(tool)) return void 0;
  return typeof tool["type"] === "string" ? tool["type"] : void 0;
}
function toolName(tool) {
  if (!isRecord(tool)) return void 0;
  return typeof tool["name"] === "string" ? tool["name"] : void 0;
}
function occupiesServerTool(tool, type) {
  return toolType(tool) === type || toolName(tool) === type;
}
function injectGrokServerSearchTools(payload) {
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
function catalogFor(model, models) {
  return models.find((entry) => entry.id === model.id) ?? {
    id: model.id,
    thinking: model.reasoning
  };
}
function withGrokResponsesBody(streamFn, models, serverSearch) {
  return (model, context, options) => {
    const original = options?.onPayload;
    return streamFn(model, context, {
      ...options,
      onPayload: async (payload, nextModel) => {
        const next = original === void 0 ? payload : await original(payload, nextModel);
        const body = next === void 0 ? payload : next;
        const wired = applyGrokReasoningWire(body, catalogFor(nextModel, models));
        if (serverSearch === true) return expandPackedGrokReasoningInput(injectGrokServerSearchTools(wired));
        return expandPackedGrokReasoningInput(wired);
      }
    });
  };
}
function withHiddenOpaqueThinking(streamFn) {
  return (model, context, options) => filterGrokThinkingStream(streamFn(model, context, options));
}
function grokResponsesApi(models = [], serverSearch = false) {
  const base = openAIResponsesApi2();
  return {
    stream: withHiddenOpaqueThinking(withGrokResponsesBody(base.stream, models, serverSearch)),
    streamSimple: withHiddenOpaqueThinking(withGrokResponsesBody(base.streamSimple, models, serverSearch))
  };
}
var NO_COST = {
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
function thinkingLevelMap(model) {
  if (model.thinking !== true) return void 0;
  return grokThinkingLevelMap(model);
}
function toPiAiModel(model, baseUrl) {
  const levels = thinkingLevelMap(model);
  return {
    id: model.id,
    name: model.name ?? model.id,
    api: "openai-responses",
    provider: GROK_PROVIDER,
    baseUrl,
    reasoning: model.thinking === true,
    ...levels === void 0 ? {} : { thinkingLevelMap: levels },
    input: model.vision === true ? ["text", "image"] : ["text"],
    cost: NO_COST,
    contextWindow: model.contextWindow ?? GROK_DEFAULT_CONTEXT_WINDOW,
    maxTokens: model.maxTokens ?? GROK_DEFAULT_MODEL_MAX_TOKENS,
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
      resolve: ({ credential }) => Promise.resolve({
        auth: credential?.key === void 0 ? {} : { apiKey: credential.key },
        source: "Grok"
      })
    }
  };
}
function createGrokPiAiProfile(connection) {
  const baseURL = connection.baseURL.replace(/\/+$/u, "");
  const source = connection.models.length > 0 ? connection.models : GROK_CATALOG;
  const models = source.map((model) => toPiAiModel(model, baseURL));
  const configuredMaxTokens = /* @__PURE__ */ new Map();
  const headers = proxyHeaders();
  const piProvider = createProvider({
    id: GROK_PROVIDER,
    name: "Grok",
    baseUrl: baseURL,
    auth: grokAuth(),
    models,
    api: grokResponsesApi(source, connection.serverSearch === true),
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
    modelErrors: /* @__PURE__ */ new Map(),
    headers
  };
}
function createGrokPiAiAuth() {
  const stored = /* @__PURE__ */ new Map();
  return {
    credentials: {
      read: (id) => Promise.resolve(stored.get(id)),
      list: () => Promise.resolve(
        [...stored].map(([providerId, credential]) => ({
          providerId,
          type: credential.type
        }))
      ),
      async modify(id, mutate) {
        const next = await mutate(stored.get(id));
        if (next !== void 0) stored.set(id, next);
        return stored.get(id);
      },
      delete: (id) => {
        stored.delete(id);
        return Promise.resolve();
      }
    },
    authContext: {
      env: () => Promise.resolve(void 0),
      fileExists: () => Promise.resolve(false)
    }
  };
}
async function resolveGrokAccessToken(runtime) {
  const existing = await readSession(runtime.resolveSessionPath());
  const existingKey = existing === void 0 ? void 0 : accountKeyOf(existing);
  const session = await ensureFreshSession(runtime);
  if (session === void 0) {
    if (existing !== void 0) {
      throw new LlmError("llm-grok: session refresh failed; sign in again with an xAI subscription", "AUTH");
    }
    throw new LlmError(
      "llm-grok: not signed in; sign in with an xAI subscription from Plugin configuration",
      "MISSING_CREDENTIAL"
    );
  }
  if (existingKey !== void 0 && accountKeyOf(session) !== existingKey) {
    throw new LlmError("llm-grok: session refresh failed; sign in again with an xAI subscription", "AUTH");
  }
  return session.accessToken;
}
function applyOfficialReasoningMetadata(info, catalog) {
  if (info.reasoning === void 0 || catalog === void 0 || catalog.thinking !== true) return info;
  const supported = new Set(info.reasoning.efforts.map((effort) => effort.id));
  const efforts = officialEffortsFor(catalog).flatMap((effort) => {
    if (!isGrokReasoningWire(effort.value) || !supported.has(ReasoningEffortId(effort.value))) return [];
    return [
      {
        id: ReasoningEffortId(effort.value),
        name: effort.label ?? effort.value,
        ...effort.description === void 0 ? {} : { description: effort.description }
      }
    ];
  });
  if (efforts.length === 0) return info;
  const preferred = ReasoningEffortId(officialDefaultEffort(catalog));
  const defaultEffort = efforts.some((effort) => effort.id === preferred) ? preferred : efforts[0]?.id;
  return {
    ...info,
    reasoning: {
      efforts,
      ...defaultEffort === void 0 ? {} : { defaultEffort }
    }
  };
}
function classifyGrokTransientError(chunk) {
  if (chunk.type !== "finish" || chunk.reason?.kind !== "error" || chunk.reason.failure?.code !== "PI_AI_ERROR") {
    return chunk;
  }
  const message = chunk.reason.failure.message;
  const code = /currently at capacity|high demand/iu.test(message) ? "RATE_LIMIT" : /service temporarily unavailable|availability is currently degraded/iu.test(message) ? "SERVER" : void 0;
  if (code === void 0) return chunk;
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
var GrokAdapter = class extends LlmAdapter {
  config;
  auth = createGrokPiAiAuth();
  snapshot;
  constructor(config) {
    super();
    this.config = config;
  }
  current() {
    const options = this.config.options();
    if (this.snapshot?.options === options) return this.snapshot.adapter;
    const profile = createGrokPiAiProfile(options);
    const profiles = /* @__PURE__ */ new Map([[GROK_PROVIDER, profile]]);
    const adapterOptions = {
      profiles: () => profiles,
      resolveApiKey: () => this.config.resolveApiKey(),
      auth: this.auth,
      ...this.config.resolveAttachments === void 0 ? {} : { resolveAttachments: this.config.resolveAttachments }
    };
    const adapter = new PiAiAdapter(adapterOptions);
    this.snapshot = {
      options,
      adapter
    };
    return adapter;
  }
  providerInfo(provider) {
    return this.current().providerInfo(provider);
  }
  providerRetryPolicy(provider) {
    return this.current().providerRetryPolicy(provider);
  }
  async listModels(provider) {
    this.snapshot = void 0;
    return this.current().listModels(provider);
  }
  async resolveModel(provider, model, signal) {
    return applyOfficialReasoningMetadata(
      await this.current().resolveModel(provider, model, signal),
      this.config.options().models.find((entry) => entry.id === model)
    );
  }
  async *stream(options) {
    for await (const chunk of this.current().stream(options)) {
      yield classifyGrokTransientError(chunk);
    }
  }
  async prepareCall(provider, model, signal) {
    const delegate = this.current();
    const inner = typeof delegate.prepareCall === "function" ? await delegate.prepareCall(provider, model, signal) : {
      model: await this.resolveModel(provider, model, signal),
      stream: (options) => delegate.stream(options)
    };
    return {
      model: inner.model,
      stream: async function* (options) {
        for await (const chunk of inner.stream(options)) {
          yield classifyGrokTransientError(chunk);
        }
      }
    };
  }
};

// src/host/native-search.ts
var GROK_NATIVE_SEARCH_SERVICE = "grokNativeSearch";
function pushSource(sources, seen, url, title) {
  if (typeof url !== "string" || !/^https?:\/\//u.test(url)) return;
  const label = typeof title === "string" && title.length > 0 && title !== url ? title : void 0;
  if (seen.has(url)) {
    const existing = sources.find((source) => source.url === url);
    if (existing !== void 0 && existing.title === void 0 && label !== void 0) existing.title = label;
    return;
  }
  seen.add(url);
  const item = { url };
  if (label !== void 0) item.title = label;
  sources.push(item);
}
function fillTitlesFromText(sources, text) {
  const byUrl = new Map(sources.map((source) => [source.url, source]));
  const line = /^(.*?)\s+[-–—|]\s+(https?:\/\/\S+)/gmu;
  for (const match of text.matchAll(line)) {
    const title = match[1]?.trim();
    const url = match[2];
    if (!url || !title) continue;
    const existing = byUrl.get(url);
    if (existing && existing.title === void 0) existing.title = title;
  }
}
function parseGrokSearchSources(payload, maxResults) {
  const sources = [];
  const seen = /* @__PURE__ */ new Set();
  if (!isRecord(payload) || !Array.isArray(payload["output"])) {
    return { sources, truncated: false };
  }
  const texts = [];
  for (const block of payload["output"]) {
    if (!isRecord(block)) continue;
    if (block["type"] === "web_search_call") {
      const action = isRecord(block["action"]) ? block["action"] : void 0;
      const listed = action !== void 0 && Array.isArray(action["sources"]) ? action["sources"] : [];
      for (const entry of listed) {
        if (!isRecord(entry)) continue;
        pushSource(sources, seen, entry["url"], entry["title"]);
      }
    }
    const content = Array.isArray(block["content"]) ? block["content"] : [];
    for (const part of content) {
      if (!isRecord(part)) continue;
      if (typeof part["text"] === "string") texts.push(part["text"]);
      const annotations = Array.isArray(part["annotations"]) ? part["annotations"] : [];
      for (const annotation of annotations) {
        if (!isRecord(annotation)) continue;
        pushSource(sources, seen, annotation["url"], annotation["title"]);
      }
    }
  }
  if (texts.length > 0) fillTitlesFromText(sources, texts.join("\n"));
  const limit = typeof maxResults === "number" && maxResults > 0 ? maxResults : sources.length;
  return {
    sources: sources.slice(0, limit),
    truncated: sources.length > limit
  };
}
async function grokNativeWebSearch(input) {
  const query = input.query.trim();
  if (query.length === 0) throw new Error("grok native search: query must be non-empty");
  const body = {
    model: input.model && input.model.length > 0 ? input.model : "grok-4.6",
    stream: false,
    max_output_tokens: 2048,
    tools: [{ type: "web_search" }],
    input: `Perform a web search for the query: ${query}. Return only source titles and URLs.`,
    reasoning: { effort: "low" }
  };
  const response = await input.fetch(`${GROK_CHAT_BASE_URL}/responses`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${input.accessToken}`,
      "content-type": "application/json",
      accept: "application/json",
      ...GROK_CLI_REQUEST_HEADERS
    },
    body: JSON.stringify(body),
    signal: input.signal
  });
  const raw = await response.text();
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    throw new Error(`grok native search: unreadable response (HTTP ${response.status})`);
  }
  if (!response.ok) {
    const record = isRecord(payload) ? payload : {};
    const detail = isRecord(record["error"]) ? record["error"]["message"] : record["message"];
    const suffix = typeof detail === "string" && detail.length > 0 ? `: ${detail}` : "";
    throw new Error(`grok native search: HTTP ${response.status}${suffix}`);
  }
  const parsed = parseGrokSearchSources(payload, input.maxResults);
  return parsed;
}
function installGrokNativeSearch(ctx, input) {
  const api = {
    available() {
      return true;
    },
    async search(query, options) {
      const accessToken = await resolveGrokAccessToken(input.runtime);
      const fetchImpl = createGrokFetch(input.proxy(), ctx.logger);
      return grokNativeWebSearch({
        fetch: fetchImpl,
        accessToken,
        query,
        model: options?.model,
        maxResults: options?.maxResults,
        signal: options?.signal
      });
    }
  };
  return api;
}

// src/host/rpc.ts
var deepEqualJson = (a, b) => JSON.stringify(a) === JSON.stringify(b);
var settingsNamespace = (ns) => ns;
var NS = settingsNamespace(GROK_SETTINGS_NAMESPACE);
function internalError(message) {
  return {
    ok: false,
    error: {
      code: "internal",
      message,
      details: {}
    }
  };
}
function usageFailure(error, secrets) {
  let message = error instanceof Error && error.message.length > 0 ? error.message : "Grok usage read failed";
  for (const secret of secrets) {
    if (secret.length === 0) continue;
    message = message.split(secret).join("[redacted]");
  }
  return internalError(message);
}
function createGrokRpcHandler(runtime, options) {
  return async (endpoint, payload, signal) => {
    if (endpoint === "auth/start") {
      if (decodeGrokEmptyRequest(payload) === void 0) return internalError("invalid Grok auth start request");
      return {
        ok: true,
        value: await startPkceLogin(runtime, signal)
      };
    }
    if (endpoint === "auth/status") {
      if (decodeGrokEmptyRequest(payload) === void 0) return internalError("invalid Grok auth status request");
      return {
        ok: true,
        value: await statusFromRuntime(runtime)
      };
    }
    if (endpoint === "auth/logout") {
      const request = decodeGrokAccountIdRequest(payload);
      if (request === void 0) return internalError("invalid Grok auth logout request");
      return {
        ok: true,
        value: await removeRuntimeAccount(runtime, request.accountId)
      };
    }
    if (endpoint === "auth/switch") {
      const request = decodeGrokAccountIdRequest(payload);
      if (request === void 0 || request.accountId === void 0) return internalError("invalid Grok auth switch request");
      return {
        ok: true,
        value: await switchRuntimeAccount(runtime, request.accountId)
      };
    }
    if (endpoint === "auth/remove") {
      const request = decodeGrokAccountIdRequest(payload);
      if (request === void 0 || request.accountId === void 0) return internalError("invalid Grok auth remove request");
      return {
        ok: true,
        value: await removeRuntimeAccount(runtime, request.accountId)
      };
    }
    if (endpoint === "auth/complete") {
      const request = decodeGrokAuthCompleteRequest(payload);
      if (request === void 0) return internalError("invalid Grok auth complete request");
      return {
        ok: true,
        value: await completePkceLogin(runtime, request.code)
      };
    }
    if (endpoint === "models/list") {
      if (decodeGrokEmptyRequest(payload) === void 0) return internalError("invalid Grok models request");
      const session = await ensureFreshSession(runtime);
      if (session === void 0) {
        return {
          ok: true,
          value: { models: fallbackGrokCatalog() }
        };
      }
      return {
        ok: true,
        value: {
          models: await readGrokModels({
            accessToken: session.accessToken,
            ...options?.modelsURL === void 0 ? {} : { modelsURL: options.modelsURL },
            fetch: runtime.fetch,
            signal
          }) ?? fallbackGrokCatalog()
        }
      };
    }
    if (endpoint === "usage/read") {
      const request = decodeGrokAccountIdRequest(payload);
      if (request === void 0) return internalError("invalid Grok usage request");
      let session;
      if (request.accountId === void 0) {
        session = await ensureFreshSession(runtime);
      } else {
        const store = await ensureFreshAccounts(runtime);
        const index = findAccountIndex(store, request.accountId);
        if (index < 0) return internalError("That Grok account is not saved on this machine.");
        session = store.accounts[index];
      }
      if (session === void 0) {
        return {
          ok: true,
          value: { status: "logged-out" }
        };
      }
      try {
        return {
          ok: true,
          value: await readGrokUsage({
            accessToken: session.accessToken,
            ...options?.billingURL === void 0 ? {} : { billingURL: options.billingURL },
            fetch: runtime.fetch,
            now: runtime.now,
            signal
          })
        };
      } catch (error) {
        return usageFailure(error, [session.accessToken, session.refreshToken]);
      }
    }
    if (endpoint === "usage/readAll") {
      if (decodeGrokEmptyRequest(payload) === void 0) return internalError("invalid Grok usage request");
      try {
        return {
          ok: true,
          value: await readAllAccountUsage(runtime, options, signal)
        };
      } catch (error) {
        return usageFailure(error, []);
      }
    }
    return internalError(`unknown Grok endpoint: ${endpoint}`);
  };
}
async function saveDisplayedCatalog(ctx, payload) {
  const request = decodeGrokSaveRequest(payload);
  if (request === void 0) return internalError("invalid Grok settings request");
  const settings = ctx.get("settings");
  if (settings === void 0) return internalError("Grok settings are unavailable");
  try {
    const before = settings.describe().find((descriptor) => descriptor.ns === NS);
    if (before === void 0) return internalError("Grok settings are unavailable");
    const current = decodeGrokSettings(before.value);
    if (current === void 0) return internalError("Grok settings are invalid");
    const ops = [];
    if (!deepEqualJson(current.models, request.models)) {
      ops.push({
        op: "set",
        path: ["models"],
        value: request.models
      });
    }
    if (request.enableImageGen !== void 0 && current.enableImageGen !== request.enableImageGen) {
      ops.push({
        op: "set",
        path: ["enableImageGen"],
        value: request.enableImageGen
      });
    }
    if (request.serverSearch !== void 0 && current.serverSearch !== request.serverSearch) {
      ops.push({
        op: "set",
        path: ["serverSearch"],
        value: request.serverSearch
      });
    }
    if (request.proxy !== void 0 && current.proxy !== request.proxy) {
      ops.push({
        op: "set",
        path: ["proxy"],
        value: request.proxy
      });
    }
    if (ops.length > 0) await settings.mutate(NS, ops, request.expectedRevision);
    const accepted = settings.describe().find((descriptor) => descriptor.ns === NS);
    const acceptedSettings = decodeGrokSettings(accepted?.value);
    if (accepted === void 0 || acceptedSettings === void 0) {
      return internalError("Grok settings could not be reloaded");
    }
    return {
      ok: true,
      value: {
        settings: acceptedSettings,
        revision: accepted.revision
      }
    };
  } catch (error) {
    return internalError(error instanceof Error && error.message.length > 0 ? error.message : "Grok settings save failed");
  }
}

// src/host/index.ts
var z = Schema;
function installSectionCompat(ctx, ns, schema, entry, hooks) {
  ctx.inject(["settings"], (sctx) => {
    if (sctx.settings && typeof sctx.settings.installSection === "function") {
      sctx.settings.installSection(ctx, ns, schema, entry, hooks);
    } else if (sctx.settings && typeof sctx.settings.register === "function") {
      const scope = sctx.settings.register(ns, schema, {
        base: entry,
        ...hooks.validate ? { validate: hooks.validate } : {}
      });
      hooks.setSource(() => scope.get());
      hooks.onChange();
      scope.watch?.(() => hooks.onChange());
    }
  });
}
var deepEqualJson2 = (a, b) => JSON.stringify(a) === JSON.stringify(b);
var settingsNamespace2 = (ns) => ns;
var DEFAULT_MAX_RETRIES = 2;
var name = "llm-grok";
var inject = ["llm"];
var NS2 = settingsNamespace2(GROK_SETTINGS_NAMESPACE);
function resolveModels(models) {
  const seen = /* @__PURE__ */ new Set();
  return (models ?? GROK_CATALOG).map((model) => {
    if (model.id.length === 0) throw new Error("llm-grok: catalog model ids must be non-empty");
    if (model.name !== void 0 && model.name.length === 0) {
      throw new Error(`llm-grok: catalog model "${model.id}" has an empty name`);
    }
    if (seen.has(model.id)) throw new Error(`llm-grok: duplicate catalog model "${model.id}"`);
    seen.add(model.id);
    return {
      id: model.id,
      ...model.name === void 0 ? {} : { name: model.name },
      ...model.description === void 0 ? {} : { description: model.description },
      ...model.contextWindow === void 0 ? {} : { contextWindow: model.contextWindow },
      ...model.maxTokens === void 0 ? {} : { maxTokens: model.maxTokens },
      ...model.thinking === void 0 ? {} : { thinking: model.thinking },
      ...model.vision === void 0 ? {} : { vision: model.vision },
      ...model.tools === void 0 ? {} : { tools: model.tools },
      ...model.defaultReasoningEffort === void 0 ? {} : { defaultReasoningEffort: model.defaultReasoningEffort },
      ...model.reasoningEfforts === void 0 ? {} : { reasoningEfforts: model.reasoningEfforts }
    };
  });
}
function resolveAdapterOptions(config) {
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
var catalogModel = z.object({
  id: z.string().required(),
  name: z.string(),
  description: z.string(),
  contextWindow: z.number().step(1).min(1),
  maxTokens: z.number().step(1).min(1),
  vision: z.boolean(),
  thinking: z.boolean(),
  tools: z.boolean()
});
var Config = z.object({
  streamIdleTimeoutMs: z.number().min(Number.MIN_VALUE).max(MAX_TIMER_DELAY_MS).default(GROK_DEFAULT_STREAM_IDLE_TIMEOUT_MS),
  models: z.array(catalogModel),
  enableImageGen: z.boolean().default(false),
  serverSearch: z.boolean().default(false),
  proxy: z.string().default(""),
  retryPolicy: RetryPolicySchema
});
function apply(ctx, config) {
  let current = () => config;
  let lastRaw;
  let lastGood;
  const options = () => {
    const raw = current();
    if (raw === lastRaw && lastGood !== void 0) return lastGood;
    try {
      const next = resolveAdapterOptions(raw);
      lastRaw = raw;
      lastGood = next;
      return next;
    } catch (error) {
      if (lastGood === void 0) throw error;
      lastRaw = raw;
      ctx.logger?.error("llm-grok: keeping the last good configuration after an invalid settings section");
      ctx.logger?.error(error);
      return lastGood;
    }
  };
  options();
  let grokFetch = globalThis.fetch;
  let originalFetch;
  const patchGlobalFetch = () => {
    if (originalFetch !== void 0) return;
    originalFetch = globalThis.fetch;
    globalThis.fetch = (input, init) => isGrokRequest(input) && !shouldBypassProxy(input) ? grokFetch(input, init) : originalFetch(input, init);
  };
  const unpatchGlobalFetch = () => {
    if (originalFetch === void 0) return;
    globalThis.fetch = originalFetch;
    originalFetch = void 0;
  };
  const applyTransport = () => {
    grokFetch = createGrokFetch(options().proxy, ctx.logger);
    if (hasActiveProxy(options().proxy)) patchGlobalFetch();
    else unpatchGlobalFetch();
  };
  applyTransport();
  const runtime = createGrokAuthRuntime({
    resolveSessionPath: () => resolveGrokSessionPath(ctx),
    fetch: (input, init) => grokFetch(input, init)
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
    resolveAttachments: () => ctx.get("attachments")
  });
  ctx.llm.registerConfigurableProviders([
    {
      provider: GROK_PROVIDER,
      displayName: "Grok",
      settingsNs: NS2,
      settingsPath: []
    }
  ]);
  const registration = ctx.llm.registerAdapter([GROK_PROVIDER], adapter);
  let registeredPolicy = options().retryPolicy;
  const ensureRegistrationFacts = () => {
    lastRaw = void 0;
    const policy = options().retryPolicy;
    if (deepEqualJson2(policy, registeredPolicy)) return;
    registration.replace([GROK_PROVIDER]);
    registeredPolicy = policy;
  };
  const grokRpc = createGrokRpcHandler(runtime);
  ctx.inject(["connection", "webServer"], (connectionCtx) => {
    const rpcHandler = async (endpoint, payload, signal) => {
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
    }
    const webServer = connectionCtx.get?.("webServer") ?? connectionCtx.webServer;
    if (webServer && !webServer.prefixes?.has(GROK_RPC_CHANNEL)) {
      if (typeof connectionCtx.connection?.register === "function") {
        connectionCtx.connection.register(connectionCtx, GROK_RPC_CHANNEL, rpcHandler);
      }
    }
  });
  ctx.inject(["webServer"], (web) => {
    const webServer = web.get("webServer");
    web.effect(
      () => webServer.register({
        kind: "exact",
        path: GROK_USAGE_HTTP_PATH,
        handler: async (req, res) => {
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
          } catch (error) {
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
  installSectionCompat(ctx, NS2, Config, config, {
    setSource: (source) => {
      current = source;
    },
    onChange: scheduleCapabilities
  });
  let stopped = false;
  let imageGenFiber;
  let imageGenTail = Promise.resolve();
  const reconcileImageGen = async () => {
    if (stopped) return;
    const enabled = current().enableImageGen === true;
    if (enabled === (imageGenFiber !== void 0)) return;
    const previous = imageGenFiber;
    imageGenFiber = void 0;
    if (previous !== void 0) await previous.dispose();
    if (stopped || !enabled) return;
    const fiber = ctx.inject(
      ["tools", "fs", "attachments"],
      (toolCtx) => toolCtx.tools.register(
        grokImageGenTool(toolCtx, { resolveAccessToken: () => resolveGrokAccessToken(runtime) })
      )
    );
    imageGenFiber = fiber;
    Promise.resolve(fiber).catch((error) => {
      if (imageGenFiber === fiber) imageGenFiber = void 0;
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
    imageGenFiber = void 0;
    await imageGen?.dispose();
  });
}
export {
  Config,
  DEFAULT_USAGE_REQUEST_TIMEOUT_MS,
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
  GROK_NATIVE_SEARCH_SERVICE,
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
  accountKeyOf,
  activeAccountFrom,
  apply,
  applyGrokReasoningWire,
  authNetworkHint,
  authRejectionHint,
  completePkceLogin,
  createGrokAuthRuntime,
  createGrokFetch,
  createGrokPiAiProfile,
  createGrokRpcHandler,
  decodeGrokAccountIdRequest,
  decodeGrokAccountUsageView,
  decodeGrokAccountsUsageReply,
  decodeGrokAuthCompleteRequest,
  decodeGrokAuthLogoutReply,
  decodeGrokAuthStartReply,
  decodeGrokAuthStatus,
  decodeGrokEmptyRequest,
  decodeGrokModelsReply,
  decodeGrokSaveRequest,
  decodeGrokSaveResult,
  decodeGrokSessionStore,
  decodeGrokSettings,
  decodeGrokUsageReply,
  decodeGrokUsageView,
  deleteSession,
  emptyStore,
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
  grokThinkingLevelMap,
  hasActiveProxy,
  inject,
  injectGrokServerSearchTools,
  installGrokNativeSearch,
  isDisplayableThinking,
  isGrokPackedReasoning,
  isGrokRequest,
  isGrokServerSearchToolCallId,
  name,
  officialDefaultEffort,
  officialEffortsFor,
  packGrokThinkingBlocks,
  parseGrokBilling,
  parseGrokModels,
  parseGrokSearchSources,
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
