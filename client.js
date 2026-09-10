window.__ModuleLoader__.load({
	id: "dsh-grok-oauth",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name2 in all)
    __defProp(target, name2, { get: all[name2], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.tsx
var index_exports = {};
__export(index_exports, {
  apply: () => apply,
  inject: () => inject,
  name: () => name
});
module.exports = __toCommonJS(index_exports);

// src/common/constants.ts
var GROK_SETTINGS_NAMESPACE = "llm-grok";
var GROK_RPC_CHANNEL = "/grok";
var GROK_AUTH_START_ENDPOINT = "auth/start";
var GROK_AUTH_STATUS_ENDPOINT = "auth/status";
var GROK_AUTH_LOGOUT_ENDPOINT = "auth/logout";
var GROK_AUTH_COMPLETE_ENDPOINT = "auth/complete";
var GROK_AUTH_SWITCH_ENDPOINT = "auth/switch";
var GROK_AUTH_REMOVE_ENDPOINT = "auth/remove";
var GROK_USAGE_ENDPOINT = "usage/read";
var GROK_USAGE_ALL_ENDPOINT = "usage/readAll";
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
var GROK_IMAGE_GEN_TOOL_NAME = "grok_image_gen";

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

// src/client/locales.ts
var en = {
  title: "Grok",
  description: "Sign in with an xAI subscription. Save more than one Google login and switch when a SuperGrok quota is used up. This plugin does not use a console API key.",
  expand: "Expand settings",
  collapse: "Collapse settings",
  signedOut: "Not signed in.",
  signedInAs: "Signed in as {email}.",
  signedInNoEmail: "Signed in.",
  signIn: "Sign in with xAI",
  addAccount: "Add account",
  signOut: "Sign out",
  accounts: "Saved accounts",
  accountsEmpty: "No Grok accounts saved yet.",
  accountsHelp: "Each saved login shows its SuperGrok quota. Chat, Imagine, and the usage chip always use the active account.",
  accountActive: "Active",
  useAccount: "Use",
  removeAccount: "Remove",
  accountAdded: "Saved {email} and made it active.",
  accountReused: "That Google login is already {email}. Choose a different account in the browser.",
  accountSwitched: "Now using {email}.",
  switchFailed: "Could not switch Grok accounts.",
  removeFailed: "Could not remove that Grok account.",
  summaryAccounts: "{count} accounts",
  signingIn: "Waiting for browser sign-in\u2026",
  pasteCode: "If the page asks you to copy a code into Grok Build, paste it here.",
  pasteCodeLabel: "Sign-in code",
  pasteCodeSubmit: "Submit code",
  pasteCodeEmpty: "Paste the code from the browser page.",
  signInFailed: "Sign-in did not complete. You can try again.",
  signOutFailed: "Could not sign out. Try again.",
  statusFailed: "Could not read sign-in status.",
  loading: "Loading plugin settings\u2026",
  remoteAccess: "A remote browser cannot edit plugin settings. Open this page on the host, or forward the port.",
  models: "Model catalog",
  summaryModels: "{count} models",
  summaryOn: "Signed in",
  summaryOff: "Not signed in",
  unsaved: "Unsaved changes",
  modelDetails: "Details",
  dragModel: "Drag to reorder",
  fetchModels: "Choose from account",
  fetchingModels: "Loading account models\u2026",
  fetchEmpty: "The account returned no models.",
  addModel: "Add model manually",
  modelId: "Model ID",
  modelName: "Display name",
  thinking: "Reasoning",
  vision: "Vision",
  tools: "Tools",
  defaultEffort: "Default thinking",
  contextWindow: "Context window",
  contextWindowDefault: "500000",
  remove: "Remove",
  inherited: "Showing the default catalog",
  customized: "Custom catalog",
  discard: "Discard",
  save: "Save",
  saving: "Saving\u2026",
  saved: "Saved",
  invalidModel: "Every model needs a unique ID.",
  requestFailed: "Request failed.",
  pickerTitle: "Choose models",
  pickerDescription: "Pick which account models appear in the conversation selector.",
  pickerLoading: "Loading models\u2026",
  close: "Close",
  cancel: "Cancel",
  applySelected: "Use selected",
  usage: "Subscription usage",
  usageRefresh: "Refresh",
  usageLoading: "Reading usage\u2026",
  usageUsed: "Used",
  usageUnsupported: "This subscription does not report usage.",
  usageFailed: "Could not read usage.",
  usageRefreshFailed: "Refresh failed",
  usageUpdatedAt: "Updated {time}",
  usageResetAt: "Resets {time}",
  usageResetAtDays: "Usage limits reset on {date} ({count} days left)",
  usageWindowSuperGrok: "Weekly SuperGrok limit",
  usageWindowGrokBuild: "Grok Build",
  usageWindowGrokImagine: "Imagine",
  usageWindowGrokAppBuilder: "App Builder",
  dockUsed: "{percent}% used",
  dockClick: "Click to refresh",
  capabilities: "Capabilities",
  enableImageGen: "Enable grok_image_gen tool",
  enableImageGenHelp: "Lets any conversation model draw with Grok Imagine using this SuperGrok login. Distinct from Codex codex_generate_image.",
  imageRowTitle: "Grok image",
  imageRowRunning: "Generating",
  imageRowFailed: "Generation failed",
  imageRowOpen: "View original",
  imageRowOpenNamed: "View {name}",
  imageRowLoading: "Loading",
  imageRowLoadFailed: "Couldn't load. Click to retry",
  imageRowLightboxClose: "Close",
  imageRowOpenFile: "Open file",
  serverSearch: "Grok server-side search (experimental)",
  serverSearchHelp: "Injects Grok\u2019s own web_search / x_search. Results come back encrypted and are only replayed on the next request, so keep off to let Grok use DSH\u2019s own tools in the agent loop; turn on only if you rely on the Grok Build-style server search.",
  network: "Network",
  proxyLabel: "HTTP proxy (Grok traffic only)",
  proxyPlaceholder: "e.g. 127.0.0.1:7897 (leave empty to follow the environment)",
  proxyHelp: "Only x.ai / grok.com requests (sign-in, Grok chat, Imagine) use this proxy; other models such as DeepSeek stay on the direct connection. Empty = use HTTPS_PROXY / ALL_PROXY from the environment; with no such variables the plugin connects directly. Enter direct to force a direct connection.",
  proxyAutoSaved: "Proxy saved. Starting sign-in\u2026"
};
var zh = {
  title: "Grok",
  description: "\u4F7F\u7528 xAI \u8BA2\u9605\u767B\u5F55\uFF0C\u53EF\u4FDD\u5B58\u591A\u4E2A Google \u8D26\u53F7\u5E76\u5728\u989D\u5EA6\u7528\u5B8C\u540E\u5207\u6362\u3002\u672C\u63D2\u4EF6\u4E0D\u4F7F\u7528 console API key\u3002",
  expand: "\u5C55\u5F00\u8BBE\u7F6E",
  collapse: "\u6298\u53E0\u8BBE\u7F6E",
  signedOut: "\u5C1A\u672A\u767B\u5F55\u3002",
  signedInAs: "\u5DF2\u767B\u5F55\u4E3A {email}\u3002",
  signedInNoEmail: "\u5DF2\u767B\u5F55\u3002",
  signIn: "\u7528 xAI \u767B\u5F55",
  addAccount: "\u6DFB\u52A0\u8D26\u53F7",
  signOut: "\u9000\u51FA\u767B\u5F55",
  accounts: "\u5DF2\u4FDD\u5B58\u8D26\u53F7",
  accountsEmpty: "\u8FD8\u6CA1\u6709\u4FDD\u5B58 Grok \u8D26\u53F7\u3002",
  accountsHelp: "\u6BCF\u4E2A\u5DF2\u4FDD\u5B58\u8D26\u53F7\u90FD\u4F1A\u663E\u793A\u81EA\u5DF1\u7684\u989D\u5EA6\uFF0C\u4E0D\u7528\u5148\u5207\u6362\u3002\u5BF9\u8BDD\u3001Imagine \u548C\u5E95\u90E8\u989D\u5EA6\u82AF\u7247\u59CB\u7EC8\u4F7F\u7528\u5F53\u524D\u8D26\u53F7\u3002",
  accountActive: "\u5F53\u524D\u4F7F\u7528",
  useAccount: "\u4F7F\u7528",
  removeAccount: "\u79FB\u9664",
  accountAdded: "\u5DF2\u4FDD\u5B58 {email}\uFF0C\u5E76\u5207\u6362\u4E3A\u5F53\u524D\u8D26\u53F7\u3002",
  accountReused: "\u6D4F\u89C8\u5668\u8FD8\u662F\u9009\u4E86 {email}\u3002\u8BF7\u6362\u6210\u53E6\u4E00\u4E2A Google \u8D26\u53F7\u540E\u518D\u8BD5\u3002",
  accountSwitched: "\u5DF2\u5207\u6362\u5230 {email}\u3002",
  switchFailed: "\u65E0\u6CD5\u5207\u6362 Grok \u8D26\u53F7\u3002",
  removeFailed: "\u65E0\u6CD5\u79FB\u9664\u8FD9\u4E2A Grok \u8D26\u53F7\u3002",
  summaryAccounts: "{count} \u4E2A\u8D26\u53F7",
  signingIn: "\u6B63\u5728\u7B49\u5F85\u6D4F\u89C8\u5668\u767B\u5F55\u2026",
  pasteCode: "\u5982\u679C\u9875\u9762\u8981\u4F60\u628A\u4EE3\u7801\u590D\u5236\u5230 Grok Build\uFF0C\u628A\u5B83\u8D34\u5230\u8FD9\u91CC\u3002",
  pasteCodeLabel: "\u767B\u5F55\u4EE3\u7801",
  pasteCodeSubmit: "\u63D0\u4EA4\u4EE3\u7801",
  pasteCodeEmpty: "\u8BF7\u7C98\u8D34\u6D4F\u89C8\u5668\u9875\u9762\u4E0A\u7684\u4EE3\u7801\u3002",
  signInFailed: "\u767B\u5F55\u672A\u5B8C\u6210\u3002\u53EF\u4EE5\u91CD\u8BD5\u3002",
  signOutFailed: "\u65E0\u6CD5\u9000\u51FA\u767B\u5F55\u3002\u8BF7\u91CD\u8BD5\u3002",
  statusFailed: "\u65E0\u6CD5\u8BFB\u53D6\u767B\u5F55\u72B6\u6001\u3002",
  loading: "\u6B63\u5728\u52A0\u8F7D\u63D2\u4EF6\u8BBE\u7F6E\u2026",
  remoteAccess: "\u8FDC\u7A0B\u6D4F\u89C8\u5668\u65E0\u6CD5\u7F16\u8F91\u63D2\u4EF6\u8BBE\u7F6E\u3002\u8BF7\u5728\u4E3B\u673A\u672C\u673A\u6253\u5F00\u9875\u9762\uFF0C\u6216\u5148\u505A\u7AEF\u53E3\u8F6C\u53D1\u3002",
  models: "\u6A21\u578B\u76EE\u5F55",
  summaryModels: "{count} \u4E2A\u6A21\u578B",
  summaryOn: "\u5DF2\u767B\u5F55",
  summaryOff: "\u672A\u767B\u5F55",
  unsaved: "\u672A\u4FDD\u5B58\u7684\u66F4\u6539",
  modelDetails: "\u8BE6\u7EC6\u8BBE\u7F6E",
  dragModel: "\u62D6\u52A8\u8C03\u6574\u987A\u5E8F",
  fetchModels: "\u4ECE\u8D26\u6237\u4E2D\u9009\u62E9",
  fetchingModels: "\u6B63\u5728\u52A0\u8F7D\u8D26\u6237\u6A21\u578B\u2026",
  fetchEmpty: "\u8D26\u6237\u6CA1\u6709\u8FD4\u56DE\u4EFB\u4F55\u6A21\u578B\u3002",
  addModel: "\u624B\u52A8\u6DFB\u52A0\u6A21\u578B",
  modelId: "\u6A21\u578B ID",
  modelName: "\u663E\u793A\u540D\u79F0",
  thinking: "\u63A8\u7406",
  vision: "\u89C6\u89C9",
  tools: "\u5DE5\u5177",
  defaultEffort: "\u9ED8\u8BA4\u601D\u8003",
  contextWindow: "\u4E0A\u4E0B\u6587\u7A97\u53E3",
  contextWindowDefault: "500000",
  remove: "\u5220\u9664",
  inherited: "\u4F7F\u7528\u9ED8\u8BA4\u76EE\u5F55",
  customized: "\u81EA\u5B9A\u4E49\u76EE\u5F55",
  discard: "\u653E\u5F03",
  save: "\u4FDD\u5B58",
  saving: "\u6B63\u5728\u4FDD\u5B58\u2026",
  saved: "\u5DF2\u4FDD\u5B58",
  invalidModel: "\u6BCF\u4E2A\u6A21\u578B\u90FD\u9700\u8981\u552F\u4E00\u7684 ID\u3002",
  requestFailed: "\u8BF7\u6C42\u5931\u8D25\u3002",
  pickerTitle: "\u9009\u62E9\u6A21\u578B",
  pickerDescription: "\u9009\u62E9\u8981\u5728\u5BF9\u8BDD\u9009\u62E9\u5668\u91CC\u663E\u793A\u7684\u8D26\u6237\u6A21\u578B\u3002",
  pickerLoading: "\u6B63\u5728\u52A0\u8F7D\u6A21\u578B\u2026",
  close: "\u5173\u95ED",
  cancel: "\u53D6\u6D88",
  applySelected: "\u4F7F\u7528\u6240\u9009",
  usage: "\u8BA2\u9605\u989D\u5EA6",
  usageRefresh: "\u5237\u65B0",
  usageLoading: "\u6B63\u5728\u8BFB\u53D6\u989D\u5EA6\u2026",
  usageUsed: "\u5DF2\u7528",
  usageUnsupported: "\u6B64\u8BA2\u9605\u4E0D\u63D0\u4F9B\u989D\u5EA6\u4FE1\u606F\u3002",
  usageFailed: "\u65E0\u6CD5\u8BFB\u53D6\u989D\u5EA6\u3002",
  usageRefreshFailed: "\u5237\u65B0\u5931\u8D25",
  usageUpdatedAt: "{time} \u5DF2\u66F4\u65B0",
  usageResetAt: "\u91CD\u7F6E\u65F6\u95F4\uFF1A{time}",
  usageResetAtDays: "\u91CD\u7F6E\u65F6\u95F4\uFF1A{date}\uFF08\u8FD8\u5269 {count} \u5929\uFF09",
  usageWindowSuperGrok: "\u6BCF\u5468 SuperGrok \u9650\u989D",
  usageWindowGrokBuild: "Grok Build",
  usageWindowGrokImagine: "Imagine",
  usageWindowGrokAppBuilder: "App Builder",
  dockUsed: "{percent}% \u5DF2\u4F7F\u7528",
  dockClick: "\u70B9\u51FB\u5237\u65B0",
  capabilities: "\u80FD\u529B",
  enableImageGen: "\u542F\u7528 grok_image_gen \u5DE5\u5177",
  enableImageGenHelp: "\u8BA9\u4EFB\u610F\u4F1A\u8BDD\u6A21\u578B\u7528\u672C\u5361\u7684 SuperGrok \u767B\u5F55\u8C03\u7528 Grok Imagine \u751F\u56FE\u3002\u4E0E Codex \u7684 codex_generate_image \u4E0D\u540C\u540D\u3002",
  imageRowTitle: "Grok \u751F\u56FE",
  imageRowRunning: "\u6B63\u5728\u751F\u6210",
  imageRowFailed: "\u751F\u6210\u5931\u8D25",
  imageRowOpen: "\u67E5\u770B\u5927\u56FE",
  imageRowOpenNamed: "\u67E5\u770B {name}",
  imageRowLoading: "\u52A0\u8F7D\u4E2D",
  imageRowLoadFailed: "\u52A0\u8F7D\u5931\u8D25\uFF0C\u70B9\u51FB\u91CD\u8BD5",
  imageRowLightboxClose: "\u5173\u95ED",
  imageRowOpenFile: "\u6253\u5F00\u6587\u4EF6",
  serverSearch: "Grok \u670D\u52A1\u7AEF\u641C\u7D22\uFF08\u5B9E\u9A8C\uFF09",
  serverSearchHelp: "\u6CE8\u5165 Grok \u81EA\u5E26\u7684 web_search / x_search\u3002\u641C\u7D22\u7ED3\u679C\u4EE5\u52A0\u5BC6\u9879\u56DE\u4F20\u4E14\u53EA\u5728\u4E0B\u4E00\u8BF7\u6C42\u56DE\u653E\uFF0Cagent \u5FAA\u73AF\u62FF\u4E0D\u5230\u7ED3\u679C\uFF1B\u5EFA\u8BAE\u4FDD\u6301\u5173\u95ED\uFF0C\u8BA9 Grok \u8D70 DSH \u81EA\u5DF1\u7684\u5DE5\u5177\u5FAA\u73AF\u3002\u4EC5\u5F53\u4F60\u4F9D\u8D56 Grok Build \u98CE\u683C\u7684\u670D\u52A1\u7AEF\u641C\u7D22\u65F6\u5F00\u542F\u3002",
  network: "\u7F51\u7EDC",
  proxyLabel: "HTTP \u4EE3\u7406\uFF08\u4EC5 Grok \u6D41\u91CF\uFF09",
  proxyPlaceholder: "\u5982 127.0.0.1:7897\uFF08\u7559\u7A7A = \u8DDF\u968F\u73AF\u5883\u53D8\u91CF\uFF09",
  proxyHelp: "\u53EA\u6709 x.ai / grok.com \u7684\u8BF7\u6C42\uFF08\u767B\u5F55\u3001Grok \u5BF9\u8BDD\u3001Imagine\uFF09\u8D70\u6B64\u4EE3\u7406\uFF1BDeepSeek \u7B49\u5176\u4ED6\u6A21\u578B\u4FDD\u6301\u76F4\u8FDE\u4E0D\u53D7\u5F71\u54CD\u3002\u7559\u7A7A = \u8DDF\u968F\u73AF\u5883\u53D8\u91CF HTTPS_PROXY / ALL_PROXY\uFF1B\u6CA1\u6709\u73AF\u5883\u53D8\u91CF\u65F6\u76F4\u8FDE\u3002\u672C\u673A\u4EE3\u7406\u6CA1\u5BFC\u51FA\u5230\u73AF\u5883\u53D8\u91CF\uFF08\u5982 Clash TUN \u6A21\u5F0F\uFF09\u8BF7\u586B 127.0.0.1:7897\uFF1B\u586B direct \u5F3A\u5236\u76F4\u8FDE\u3002",
  proxyAutoSaved: "\u4EE3\u7406\u5DF2\u4FDD\u5B58\uFF0C\u5F00\u59CB\u767B\u5F55\u2026"
};
function formatTemplate(template, vars) {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? `{${key}}`));
}

// src/client/components/BrandMark.tsx
var import_jsx_runtime = require("react/jsx-runtime");
var SIZE = 18;
function BrandMark({ size = SIZE } = {}) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
    "svg",
    {
      width: size,
      height: size,
      viewBox: "0 0 18 18",
      "aria-hidden": "true",
      shapeRendering: "geometricPrecision",
      style: {
        display: "block",
        flex: "none"
      },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "9", cy: "9", r: "6.75", fill: "none", stroke: "currentColor", strokeWidth: "2.5" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { fill: "currentColor", d: "M1.55 16.45 7.65 10.35a1.2 1.2 0 0 1 1.7 0L16.45 1.55 10.35 7.65a1.2 1.2 0 0 1-1.7 0z" })
      ]
    }
  );
}

// src/client/components/GrokModelPicker.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
var GrokModelPickerController = class {
  snapshot = {
    open: false,
    loading: false,
    candidates: [],
    picked: /* @__PURE__ */ new Set()
  };
  listeners = /* @__PURE__ */ new Set();
  onAdopt;
  getSnapshot = () => this.snapshot;
  subscribe = (listener) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  begin(onAdopt, initiallyPicked = /* @__PURE__ */ new Set()) {
    this.onAdopt = onAdopt;
    this.publish({
      open: true,
      loading: true,
      candidates: [],
      picked: new Set(initiallyPicked)
    });
  }
  complete(candidates) {
    if (!this.snapshot.open || !this.snapshot.loading) return;
    const candidateIds = new Set(candidates.map((model) => model.id));
    this.publish({
      open: true,
      loading: false,
      candidates: [...candidates],
      picked: new Set([...this.snapshot.picked].filter((id) => candidateIds.has(id)))
    });
  }
  fail(message) {
    if (!this.snapshot.open || !this.snapshot.loading) return;
    this.publish({
      open: true,
      loading: false,
      candidates: [],
      picked: /* @__PURE__ */ new Set(),
      error: message
    });
  }
  close = () => {
    this.onAdopt = void 0;
    this.publish({
      open: false,
      loading: false,
      candidates: [],
      picked: /* @__PURE__ */ new Set()
    });
  };
  toggle = (id) => {
    const picked = new Set(this.snapshot.picked);
    if (picked.has(id)) picked.delete(id);
    else picked.add(id);
    this.publish({
      ...this.snapshot,
      picked
    });
  };
  adopt = () => {
    if (this.snapshot.loading || this.snapshot.error !== void 0) return;
    const callback = this.onAdopt;
    const selected = this.snapshot.candidates.filter((model) => this.snapshot.picked.has(model.id));
    this.close();
    callback?.(selected);
  };
  publish(snapshot) {
    this.snapshot = snapshot;
    for (const listener of this.listeners) listener();
  }
};
var rootStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 1e3,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  padding: 24
};
var maskStyle = {
  position: "absolute",
  inset: 0,
  background: "var(--dsw-alias-bg-mask-1)",
  backdropFilter: "var(--dsw-mask-blur)"
};
var dialogStyle = {
  position: "relative",
  zIndex: 1,
  display: "flex",
  flexDirection: "column",
  width: "min(520px, 100%)",
  maxHeight: "min(680px, calc(100vh - 48px))",
  overflow: "hidden",
  border: "1px solid var(--dsw-alias-border-inverted)",
  borderRadius: 24,
  background: "var(--dsw-alias-bg-layer-2)",
  boxShadow: "var(--dsw-shadow-lv3)",
  color: "var(--dsw-alias-label-primary)"
};
var headerStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  padding: "22px 14px 12px 24px"
};
var titleStyle = {
  margin: 0,
  fontSize: 16,
  lineHeight: "24px",
  fontWeight: 500
};
var closeStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 28,
  height: 28,
  border: 0,
  borderRadius: 8,
  background: "transparent",
  color: "var(--dsw-alias-label-secondary)",
  cursor: "pointer",
  fontSize: 22
};
var descriptionStyle = {
  margin: 0,
  padding: "0 24px",
  fontSize: 14,
  lineHeight: "22px",
  color: "var(--dsw-alias-label-primary)"
};
var listStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 14,
  minHeight: 0,
  margin: "20px 24px",
  padding: 0,
  overflowY: "auto",
  listStyle: "none"
};
var candidateStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  fontSize: 14,
  lineHeight: "22px",
  cursor: "pointer"
};
var statusStyle = {
  display: "flex",
  alignItems: "center",
  minHeight: 96,
  margin: "20px 24px",
  fontSize: 14,
  lineHeight: "22px",
  color: "var(--dsw-alias-label-secondary)"
};
var errorStyle = {
  ...statusStyle,
  color: "var(--dsw-alias-state-error-primary)"
};
var footerStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: 8,
  padding: "0 24px 24px"
};
var outlineButtonStyle = {
  height: 36,
  padding: "0 14px",
  border: "1px solid var(--dsw-alias-border-l2)",
  borderRadius: 18,
  background: "transparent",
  color: "var(--dsw-alias-label-primary)",
  cursor: "pointer",
  fontSize: 14
};
var solidButtonStyle = {
  ...outlineButtonStyle,
  border: 0,
  background: "var(--dsw-alias-state-business-primary)",
  color: "var(--dsw-alias-state-business-primary-foreground)"
};
function GrokModelPicker(props) {
  const { t, useGrokModelPicker, closePicker, togglePickerModel, adoptPickerModels } = props;
  const snapshot = useGrokModelPicker((value) => value);
  if (!snapshot.open) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: rootStyle, role: "dialog", "aria-modal": "true", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: maskStyle, onClick: closePicker }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: dialogStyle, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: headerStyle, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h2", { style: titleStyle, children: t("pickerTitle") }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", style: closeStyle, onClick: closePicker, "aria-label": t("close"), children: "\xD7" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { style: descriptionStyle, children: t("pickerDescription") }),
      snapshot.loading ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: statusStyle, children: t("pickerLoading") }) : snapshot.error !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: errorStyle, children: snapshot.error }) : snapshot.candidates.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: statusStyle, children: t("fetchEmpty") }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("ul", { style: listStyle, children: snapshot.candidates.map((model) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { style: candidateStyle, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          "input",
          {
            type: "checkbox",
            checked: snapshot.picked.has(model.id),
            onChange: () => togglePickerModel(model.id)
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: model.name ?? model.id })
      ] }) }, model.id)) }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: footerStyle, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", style: outlineButtonStyle, onClick: closePicker, children: t("cancel") }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          "button",
          {
            type: "button",
            style: solidButtonStyle,
            disabled: snapshot.loading || snapshot.error !== void 0,
            onClick: adoptPickerModels,
            children: t("applySelected")
          }
        )
      ] })
    ] })
  ] });
}

// src/client/components/GrokPluginCard.tsx
var import_react3 = require("react");

// src/common/reasoning.ts
var GROK_REASONING_WIRES = [
  "low",
  "medium",
  "high",
  "xhigh"
];
var GROK_DEFAULT_REASONING_WIRE = "high";
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

// src/client/components/SortableList.tsx
var import_react = require("react");
var import_react_dom = require("react-dom");
var import_jsx_runtime3 = require("react/jsx-runtime");
var listStyle2 = {
  display: "flex",
  flexDirection: "column",
  gap: 8
};
var rowStyle = {
  display: "grid",
  gridTemplateColumns: "30px minmax(0, 1fr)",
  alignItems: "stretch",
  overflow: "hidden",
  border: "1px solid var(--dsw-alias-border-l2)",
  borderRadius: 8,
  background: "var(--dsw-alias-bg-layer-1)",
  transition: "box-shadow 150ms ease, opacity 150ms ease, transform 150ms ease"
};
var handleStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 30,
  minHeight: 42,
  border: 0,
  borderRight: "1px solid var(--dsw-alias-border-l2)",
  padding: 0,
  touchAction: "none",
  userSelect: "none",
  background: "transparent",
  color: "var(--dsw-alias-label-tertiary)"
};
var ghostStyle = {
  ...rowStyle,
  position: "fixed",
  zIndex: 1e4,
  pointerEvents: "none",
  opacity: 0.96,
  boxShadow: "var(--dsw-shadow-lv2, 0 10px 30px rgba(0, 0, 0, 0.18))",
  outline: "2px solid color-mix(in srgb, var(--dsw-alias-state-business-primary) 22%, transparent)"
};
function IconGrip() {
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("svg", { width: "10", height: "14", viewBox: "0 0 10 14", fill: "currentColor", "aria-hidden": true, children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("circle", { cx: "2.5", cy: "2.5", r: "1.2" }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("circle", { cx: "7.5", cy: "2.5", r: "1.2" }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("circle", { cx: "2.5", cy: "7", r: "1.2" }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("circle", { cx: "7.5", cy: "7", r: "1.2" }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("circle", { cx: "2.5", cy: "11.5", r: "1.2" }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("circle", { cx: "7.5", cy: "11.5", r: "1.2" })
  ] });
}
function sameOrder(left, right, getId) {
  return left.length === right.length && left.every((item, index) => {
    const other = right[index];
    return other !== void 0 && getId(item) === getId(other);
  });
}
function SortableList({
  items,
  getId,
  renderItem,
  dragLabel,
  onReorder,
  disabled = false
}) {
  const [draggedId, setDraggedId] = (0, import_react.useState)(null);
  const [dropTargetId, setDropTargetId] = (0, import_react.useState)(null);
  const [previewItems, setPreviewItems] = (0, import_react.useState)(null);
  const [dragGhost, setDragGhost] = (0, import_react.useState)(null);
  const rowRefs = (0, import_react.useRef)(/* @__PURE__ */ new Map());
  const previousRects = (0, import_react.useRef)(null);
  const previewRef = (0, import_react.useRef)(null);
  const dragGhostRef = (0, import_react.useRef)(null);
  const renderedItems = previewItems ?? items;
  const draggedItem = draggedId === null ? void 0 : renderedItems.find((item) => getId(item) === draggedId) ?? items.find((item) => getId(item) === draggedId);
  (0, import_react.useEffect)(() => {
    if (draggedId === null) return;
    const style = document.createElement("style");
    style.textContent = "html.ollama-sortable-dragging, html.ollama-sortable-dragging * { cursor: grabbing !important; user-select: none !important; }";
    const previousRootCursor = document.documentElement.style.cursor;
    const previousBodyCursor = document.body.style.cursor;
    document.head.appendChild(style);
    document.documentElement.classList.add("ollama-sortable-dragging");
    document.documentElement.style.cursor = "grabbing";
    document.body.style.cursor = "grabbing";
    return () => {
      document.documentElement.classList.remove("ollama-sortable-dragging");
      style.remove();
      document.documentElement.style.cursor = previousRootCursor;
      document.body.style.cursor = previousBodyCursor;
    };
  }, [draggedId]);
  (0, import_react.useEffect)(() => {
    if (draggedId === null) return;
    const handlePointerMove = (event) => {
      const currentGhost = dragGhostRef.current;
      if (currentGhost === null) return;
      event.preventDefault();
      const nextGhost = {
        ...currentGhost,
        x: event.clientX - currentGhost.offsetX,
        y: event.clientY - currentGhost.offsetY
      };
      dragGhostRef.current = nextGhost;
      setDragGhost(nextGhost);
      movePreviewFromPointer(nextGhost.y + nextGhost.height / 2);
    };
    const handlePointerUp = (event) => {
      event.preventDefault();
      finishDrag(true);
    };
    const handlePointerCancel = (event) => {
      event.preventDefault();
      finishDrag(false);
    };
    const handleKeyDown = (event) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      finishDrag(false);
    };
    window.addEventListener("pointermove", handlePointerMove, { passive: false });
    window.addEventListener("pointerup", handlePointerUp, { passive: false });
    window.addEventListener("pointercancel", handlePointerCancel, { passive: false });
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerCancel);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [draggedId]);
  (0, import_react.useLayoutEffect)(() => {
    const rects = previousRects.current;
    if (rects === null) return;
    previousRects.current = null;
    rowRefs.current.forEach((node, id) => {
      const previous = rects.get(id);
      if (previous === void 0) return;
      const next = node.getBoundingClientRect();
      const deltaX = previous.left - next.left;
      const deltaY = previous.top - next.top;
      if (deltaX === 0 && deltaY === 0 || typeof node.animate !== "function") return;
      node.animate(
        [
          { transform: `translate(${String(deltaX)}px, ${String(deltaY)}px)` },
          { transform: "translate(0, 0)" }
        ],
        {
          duration: 160,
          easing: "cubic-bezier(0.2, 0, 0, 1)"
        }
      );
    });
  }, [renderedItems]);
  const startDrag = (event, id) => {
    if (disabled || event.button !== 0) return;
    const row = event.currentTarget.closest('[data-sortable-row="true"]');
    if (!(row instanceof HTMLElement)) return;
    event.preventDefault();
    event.currentTarget.focus();
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
    }
    const rect = row.getBoundingClientRect();
    const nextGhost = {
      id,
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top
    };
    dragGhostRef.current = nextGhost;
    const initial = [...items];
    previewRef.current = initial;
    setPreviewItems(initial);
    setDragGhost(nextGhost);
    setDraggedId(id);
  };
  const finishDrag = (commit) => {
    const next = previewRef.current;
    if (commit && next !== null && !sameOrder(next, items, getId)) onReorder(next);
    previewRef.current = null;
    dragGhostRef.current = null;
    setPreviewItems(null);
    setDragGhost(null);
    setDraggedId(null);
    setDropTargetId(null);
  };
  const captureRects = () => {
    previousRects.current = new Map(
      Array.from(rowRefs.current.entries()).map(([id, node]) => [id, node.getBoundingClientRect()])
    );
  };
  const setRowRef = (id, node) => {
    if (node === null) rowRefs.current.delete(id);
    else rowRefs.current.set(id, node);
  };
  const movePreviewFromPointer = (pointerY) => {
    if (draggedId === null) return;
    const current = previewRef.current ?? [...items];
    const from = current.findIndex((item) => getId(item) === draggedId);
    if (from < 0) return;
    const dragged = current[from];
    if (dragged === void 0) return;
    const remaining = current.filter((item) => getId(item) !== draggedId);
    let insertionIndex = remaining.length;
    let nextDropTargetId = remaining.length === 0 ? null : getId(remaining[remaining.length - 1]);
    for (let index = 0; index < remaining.length; index += 1) {
      const item = remaining[index];
      if (item === void 0) continue;
      const id = getId(item);
      const node = rowRefs.current.get(id);
      if (node === void 0) continue;
      const rect = node.getBoundingClientRect();
      if (pointerY < rect.top + rect.height / 2) {
        insertionIndex = index;
        nextDropTargetId = id;
        break;
      }
    }
    const next = [...remaining.slice(0, insertionIndex), dragged, ...remaining.slice(insertionIndex)];
    setDropTargetId(nextDropTargetId);
    if (sameOrder(next, current, getId)) return;
    captureRects();
    previewRef.current = next;
    setPreviewItems(next);
  };
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: listStyle2, children: [
    renderedItems.map((item, index) => {
      const id = getId(item);
      const dragging = draggedId === id;
      const targeted = dropTargetId === id && draggedId !== id;
      return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
        "div",
        {
          ref: (node) => {
            setRowRef(id, node);
          },
          "data-sortable-row": "true",
          style: {
            ...rowStyle,
            visibility: dragging ? "hidden" : "visible",
            pointerEvents: dragging ? "none" : "auto",
            borderColor: dragging ? "transparent" : "var(--dsw-alias-border-l2)",
            boxShadow: targeted ? "0 0 0 2px color-mix(in srgb, var(--dsw-alias-state-business-primary) 20%, transparent)" : "none"
          },
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
              "button",
              {
                type: "button",
                style: {
                  ...handleStyle,
                  cursor: disabled ? "default" : draggedId === null ? "grab" : "grabbing"
                },
                "aria-label": dragLabel(item, index),
                "aria-grabbed": dragging,
                title: dragLabel(item, index),
                disabled,
                onDragStart: (event) => {
                  event.preventDefault();
                },
                onPointerDown: (event) => {
                  startDrag(event, id);
                },
                children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(IconGrip, {})
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: { minWidth: 0 }, children: renderItem(item, index) })
          ]
        },
        id
      );
    }),
    dragGhost !== null && draggedItem !== void 0 ? (0, import_react_dom.createPortal)(
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
        "div",
        {
          "data-sortable-ghost": "true",
          style: {
            ...ghostStyle,
            left: dragGhost.x,
            top: dragGhost.y,
            width: dragGhost.width,
            minHeight: dragGhost.height
          },
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
              "div",
              {
                style: {
                  ...handleStyle,
                  cursor: "grabbing"
                },
                children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(IconGrip, {})
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: { minWidth: 0 }, children: renderItem(draggedItem, renderedItems.findIndex((item) => getId(item) === draggedId)) })
          ]
        }
      ),
      document.body
    ) : null
  ] });
}

// src/client/components/Icons.tsx
var import_jsx_runtime4 = require("react/jsx-runtime");
function IconChevron({ open }) {
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
    "svg",
    {
      width: "12",
      height: "12",
      viewBox: "0 0 16 16",
      fill: "none",
      "aria-hidden": true,
      style: {
        flex: "none",
        transform: open ? "rotate(90deg)" : "none",
        transition: "transform 120ms ease"
      },
      children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("path", { d: "M6 3.5L10.5 8L6 12.5", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" })
    }
  );
}
function IconTrash() {
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("svg", { width: "14", height: "14", viewBox: "0 0 16 16", fill: "none", "aria-hidden": true, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
    "path",
    {
      d: "M2.5 4h11M6.5 4V2.5h3V4M4 4l.7 9a1 1 0 001 .9h4.6a1 1 0 001-.9L12 4M6.5 6.8v4.4M9.5 6.8v4.4",
      stroke: "currentColor",
      strokeWidth: "1.3",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }
  ) });
}
var REFRESH_PATH = "M1.272 6.21348C1.70645 3.08888 4.59169 0.908064 7.71634 1.34239C8.95495 1.51469 10.0438 2.07331 10.8814 2.87755L11.9458 1.81407C12.1347 1.6255 12.4572 1.75911 12.4575 2.02598V5.08751C12.4574 5.25303 12.3233 5.38731 12.1577 5.38731H9.0972C8.82993 5.38731 8.69629 5.06361 8.88528 4.87462L10.0327 3.72618C9.3732 3.09994 8.52006 2.66569 7.5513 2.53087C5.08313 2.18779 2.80376 3.91044 2.46048 6.37852C2.11747 8.84665 3.84009 11.1261 6.30814 11.4693C8.77612 11.8121 11.0557 10.0896 11.399 7.62169L11.9937 7.70372L12.5874 7.78673C12.153 10.9112 9.26756 13.0919 6.1431 12.6578C3.01854 12.2234 0.837738 9.33809 1.272 6.21348Z";
function ensureMotionStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById("dsh-provider-motion") !== null) return;
  const style = document.createElement("style");
  style.id = "dsh-provider-motion";
  style.textContent = [
    "@keyframes dsh-provider-spin{to{transform:rotate(360deg)}}",
    "@keyframes dsh-provider-shimmer{0%{background-position:100% 0}100%{background-position:-100% 0}}"
  ].join("");
  document.head.appendChild(style);
}
function RefreshIcon({ spinning }) {
  ensureMotionStyles();
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
    "svg",
    {
      width: "14",
      height: "14",
      viewBox: "0 0 14 14",
      fill: "none",
      "aria-hidden": "true",
      style: spinning === true ? { animation: "dsh-provider-spin 0.8s linear infinite" } : void 0,
      children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("path", { fill: "currentColor", d: REFRESH_PATH })
    }
  );
}

// src/client/components/UsageElements.tsx
var import_jsx_runtime5 = require("react/jsx-runtime");
var iconButtonStyle = {
  boxSizing: "border-box",
  width: 28,
  height: 28,
  padding: 0,
  border: "1px solid var(--dsw-alias-border-l2)",
  borderRadius: 999,
  background: "transparent",
  color: "var(--dsw-alias-label-primary)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  flex: "none"
};
var labelStyle = {
  fontSize: 13,
  color: "var(--dsw-alias-label-secondary)"
};
var hintStyle = {
  margin: 0,
  fontSize: 12,
  color: "var(--dsw-alias-label-tertiary)"
};
var trackStyle = {
  boxSizing: "border-box",
  height: 14,
  overflow: "hidden",
  borderRadius: 999,
  background: "color-mix(in srgb, var(--dsw-alias-label-primary) 14%, transparent)"
};
var barTrackStyle = {
  boxSizing: "border-box",
  height: 14,
  display: "flex",
  overflow: "hidden",
  borderRadius: 999,
  background: "color-mix(in srgb, var(--dsw-alias-label-primary) 14%, transparent)"
};
var shimmerStyle = {
  display: "block",
  width: "100%",
  height: "100%",
  background: "linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--dsw-alias-label-primary) 22%, transparent) 50%, transparent 100%)",
  backgroundSize: "200% 100%",
  animation: "dsh-provider-shimmer 1.25s ease-in-out infinite"
};
var chipStyle = {
  display: "inline-block",
  height: 12,
  borderRadius: 4,
  background: "linear-gradient(90deg, color-mix(in srgb, var(--dsw-alias-label-primary) 10%, transparent) 0%, color-mix(in srgb, var(--dsw-alias-label-primary) 22%, transparent) 50%, color-mix(in srgb, var(--dsw-alias-label-primary) 10%, transparent) 100%)",
  backgroundSize: "200% 100%",
  animation: "dsh-provider-shimmer 1.25s ease-in-out infinite"
};
function formatUsageClock(at) {
  return at.toLocaleTimeString(void 0, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}
function chineseLocale(locales) {
  const locale = typeof locales === "string" ? locales : locales?.[0] ?? (typeof navigator === "undefined" ? void 0 : navigator.language);
  return typeof locale === "string" && /^zh\b/iu.test(locale);
}
function pad2(value) {
  return String(value).padStart(2, "0");
}
function formatResetStamp(iso, locales) {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return iso;
  if (chineseLocale(locales)) {
    return `${at.getFullYear()}\u5E74${at.getMonth() + 1}\u6708${at.getDate()}\u65E5 ${pad2(at.getHours())}:${pad2(at.getMinutes())}`;
  }
  return new Intl.DateTimeFormat(locales, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(at);
}
function formatResetDate(iso, locales) {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return iso;
  if (chineseLocale(locales)) {
    return `${at.getMonth() + 1}\u6708${at.getDate()}\u65E5`;
  }
  return new Intl.DateTimeFormat(locales, {
    month: "short",
    day: "numeric"
  }).format(at);
}
function remainingResetDays(iso, now = Date.now()) {
  const at = Date.parse(iso);
  if (!Number.isFinite(at)) return void 0;
  const days = Math.round((at - now) / 864e5);
  return days >= 1 ? days : void 0;
}
function resetLabelOf(iso, copy, now) {
  if (iso === void 0 || copy === void 0) return void 0;
  const locales = copy.at.includes("\u91CD\u7F6E") ? "zh-CN" : "en";
  const days = remainingResetDays(iso, now);
  if (days !== void 0) {
    return formatTemplate(copy.atDays, {
      date: formatResetDate(iso, locales),
      count: days
    });
  }
  return formatTemplate(copy.at, { time: formatResetStamp(iso, locales) });
}
function usageWindowLabelOf(id, t) {
  if (id === "SuperGrok" || id === "weekly") return t("usageWindowSuperGrok");
  if (id === "GrokBuild") return t("usageWindowGrokBuild");
  if (id === "GrokImagine") return t("usageWindowGrokImagine");
  if (id === "GrokAppBuilder") return t("usageWindowGrokAppBuilder");
  return id;
}
function usageResetCopy(t) {
  return {
    at: t("usageResetAt"),
    atDays: t("usageResetAtDays")
  };
}
function UsageRefreshButton({
  spinning,
  disabled,
  label,
  busyLabel,
  onClick
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
    "button",
    {
      type: "button",
      style: iconButtonStyle,
      disabled: disabled === true,
      "aria-label": spinning ? busyLabel : label,
      onClick,
      children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(RefreshIcon, { spinning })
    }
  );
}
function UsageSkeleton({ rows = 2 }) {
  ensureMotionStyles();
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { style: { display: "flex", flexDirection: "column", gap: 10 }, "aria-hidden": "true", children: Array.from({ length: rows }, (_, index) => /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: 6 }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: { display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { style: { ...chipStyle, width: index === 0 ? 92 : 78 } }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { style: { ...chipStyle, width: 36 } })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { style: trackStyle, children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { style: shimmerStyle }) })
  ] }, index)) });
}
function UsageHeader({
  title,
  spinning,
  disabled,
  refreshLabel,
  busyLabel,
  onRefresh,
  error
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("h3", { style: { margin: 0, fontSize: 13, fontWeight: 600, lineHeight: "18px" }, children: title }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("span", { style: { display: "inline-flex", alignItems: "center", gap: 8, flex: "none" }, children: [
      error !== void 0 && error.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { style: { fontSize: 12, lineHeight: "18px", color: "var(--dsw-alias-state-error-primary)" }, children: error }) : null,
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
        UsageRefreshButton,
        {
          spinning,
          disabled: disabled === true,
          label: refreshLabel,
          busyLabel,
          onClick: onRefresh
        }
      )
    ] })
  ] });
}
function UsageResetAt({ label }) {
  if (label === void 0 || label.length === 0) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { style: { margin: 0, fontSize: 12, lineHeight: "18px", color: "var(--dsw-alias-label-tertiary)" }, children: label });
}
function UsageUpdatedAt({ at, label }) {
  if (at === void 0 || label === void 0) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
    "p",
    {
      style: {
        margin: 0,
        textAlign: "right",
        fontSize: 12,
        lineHeight: "18px",
        color: "var(--dsw-alias-label-tertiary)"
      },
      children: label
    }
  );
}
function UsageBar({
  usedText,
  window: quota,
  t
}) {
  const ratio = quota.limit > 0 ? quota.used / quota.limit : quota.used > 0 ? 1 : 0;
  const percent = Math.round(ratio * 1e3) / 10;
  const fill = Math.min(100, Math.max(0, percent));
  const name2 = usageWindowLabelOf(quota.id, t);
  const label = quota.period === void 0 || quota.resetsAt !== void 0 ? name2 : `${name2} (${quota.period})`;
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: 6 }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: { display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { style: labelStyle, children: label }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { style: hintStyle, children: quota.unit === "percent" ? `${quota.used}%` : `${usedText} ${quota.used} / ${quota.limit}` })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
      "div",
      {
        style: barTrackStyle,
        role: "progressbar",
        "aria-label": label,
        "aria-valuemin": 0,
        "aria-valuemax": 100,
        "aria-valuenow": Math.round(fill),
        children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
          "span",
          {
            "data-usage-fill": "true",
            style: {
              width: `${fill}%`,
              height: "100%",
              flex: "none",
              background: "var(--dsw-alias-state-business-primary)",
              transition: "width 200ms ease"
            }
          }
        )
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(UsageResetAt, { label: resetLabelOf(quota.resetsAt, usageResetCopy(t)) })
  ] });
}
function UsageStackedBar({
  total,
  products,
  t
}) {
  const used = total.used;
  const label = usageWindowLabelOf(total.id, t);
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: 6 }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: { display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { style: labelStyle, children: label }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { style: hintStyle, children: t("dockUsed").replace("{percent}", String(used)) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
      "div",
      {
        style: barTrackStyle,
        role: "progressbar",
        "aria-label": label,
        "aria-valuemin": 0,
        "aria-valuemax": 100,
        "aria-valuenow": Math.round(used),
        children: products.map((product, index) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
          "span",
          {
            title: `${usageWindowLabelOf(product.id, t)} ${product.used}%`,
            style: {
              width: `${product.used}%`,
              height: "100%",
              flex: "none",
              background: "var(--dsw-alias-state-business-primary)",
              opacity: String(Math.max(0.4, 1 - index * 0.28)),
              transition: "width 200ms ease"
            }
          },
          `${product.id}:${index}`
        ))
      }
    ),
    products.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { style: hintStyle, children: products.map((product) => `${usageWindowLabelOf(product.id, t)} ${product.used}%`).join(" \xB7 ") }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(UsageResetAt, { label: resetLabelOf(total.resetsAt, usageResetCopy(t)) })
  ] });
}
function usagePresentation(usage) {
  const total = usage.windows.find((w) => w.id === "SuperGrok");
  const products = usage.windows.filter((w) => w.id !== "SuperGrok" && w.id !== "monthly");
  return { total, products };
}
function officialUsedPercent(usage) {
  if (usage === void 0) return void 0;
  const view = usagePresentation(usage);
  if (view.total !== void 0) return view.total.used;
  const first = usage.windows[0];
  if (first === void 0) return void 0;
  return first.unit === "percent" ? first.used : first.limit > 0 ? Math.round(first.used / first.limit * 100) : void 0;
}
function renderUsageSnapshot(usage, t) {
  const view = usagePresentation(usage);
  if (view.total !== void 0 && view.products.length > 0) {
    return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(UsageStackedBar, { total: view.total, products: view.products, t });
  }
  if (view.total !== void 0) {
    return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(UsageBar, { usedText: t("usageUsed"), window: view.total, t });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_jsx_runtime5.Fragment, { children: usage.windows.map((window2, index) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(UsageBar, { usedText: t("usageUsed"), window: window2, t }, `${window2.id}:${index}`)) });
}

// src/client/components/AccountList.tsx
var import_jsx_runtime6 = require("react/jsx-runtime");
var labelStyle2 = {
  fontSize: 13,
  color: "var(--dsw-alias-label-secondary)"
};
var hintStyle2 = {
  margin: 0,
  fontSize: 12,
  color: "var(--dsw-alias-label-tertiary)"
};
var errorStyle2 = {
  margin: 0,
  fontSize: 13,
  color: "var(--dsw-alias-state-error-primary)"
};
var buttonStyle = {
  alignSelf: "flex-start",
  minHeight: 34,
  border: "1px solid var(--dsw-alias-border-l2)",
  borderRadius: 18,
  padding: "6px 14px",
  background: "var(--dsw-alias-bg-layer-1)",
  color: "var(--dsw-alias-label-primary)",
  font: "inherit",
  cursor: "pointer"
};
var quietButtonStyle = {
  ...buttonStyle,
  minHeight: 28,
  padding: "4px 10px",
  fontSize: 12
};
var GROK_USAGE_WARN = 80;
var GROK_USAGE_ALERT = 95;
function accountLabelOf(account) {
  return account.email ?? account.id;
}
function usedPercentTone(used) {
  if (used === void 0) return "var(--dsw-alias-label-tertiary)";
  if (used >= GROK_USAGE_ALERT) return "var(--dsw-alias-state-error-primary)";
  if (used >= GROK_USAGE_WARN) return "var(--dsw-alias-state-warn-primary)";
  return "var(--dsw-alias-label-tertiary)";
}
function accountUsageOf(accounts, accountId) {
  if (!Array.isArray(accounts)) return void 0;
  return accounts.find((entry) => entry.accountId === accountId || entry.email === accountId);
}
function accountUsageCaption(entry, t) {
  if (entry === void 0) return void 0;
  if (entry.status === "ok") {
    const used = officialUsedPercent(entry.usage);
    if (used === void 0) return void 0;
    return {
      text: t("dockUsed").replace("{percent}", String(used)),
      color: usedPercentTone(used)
    };
  }
  if (entry.status === "unsupported") {
    return {
      text: t("usageUnsupported"),
      color: "var(--dsw-alias-label-tertiary)"
    };
  }
  if (entry.status === "error") {
    return {
      text: t("usageFailed"),
      color: "var(--dsw-alias-state-error-primary)"
    };
  }
  return void 0;
}
function renderAccountUsageBody(entry, t) {
  if (entry.status === "ok" && entry.usage !== void 0) return renderUsageSnapshot(entry.usage, t);
  if (entry.status === "unsupported") return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { style: hintStyle2, children: t("usageUnsupported") });
  if (entry.status === "error") return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { style: errorStyle2, children: entry.message });
  return null;
}
function renderAccountsUsage(accounts, t) {
  if (accounts.length <= 1) {
    const only = accounts[0];
    return only === void 0 ? null : renderAccountUsageBody(only, t);
  }
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { style: { display: "flex", flexDirection: "column", gap: 14 }, children: accounts.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 8,
        border: "1px solid var(--dsw-alias-border-l2)",
        borderRadius: 10,
        padding: "10px 12px",
        background: "var(--dsw-alias-bg-layer-1)"
      },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { style: { display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { style: { ...labelStyle2, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }, children: entry.email ?? entry.accountId }),
          entry.active ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { style: hintStyle2, children: t("accountActive") }) : null
        ] }),
        renderAccountUsageBody(entry, t)
      ]
    },
    entry.accountId
  )) });
}

// src/client/components/UsageChip.tsx
var import_react2 = require("react");
var import_jsx_runtime7 = require("react/jsx-runtime");
var GROK_USAGE_FOCUS_DEBOUNCE_MS = 15e3;
var grokUsageDockCss = [
  '[data-slot="conversation.composer.dock"]:has(> .grok-usage-dock){display:flex!important;flex-flow:row nowrap;justify-content:center;align-items:center;box-sizing:border-box;width:100%;max-width:var(--dsh-chat-content-width);min-width:0;padding:4px calc(var(--dsh-composer-side-clearance) + 16px) 0;overflow:hidden}',
  '[data-slot="conversation.composer.dock"]:has(> .grok-usage-dock)>*{box-sizing:border-box;flex:0 1 auto;min-width:0;width:auto!important;max-width:none!important;margin:0!important;padding:0!important}',
  '[data-phase="hero"] [data-slot="conversation.input.dock"]:has(> .grok-usage-dock){display:flex!important;flex:none!important;flex-flow:row nowrap;justify-content:center;align-items:center;box-sizing:border-box;width:100%;max-width:var(--dsh-chat-content-width);min-width:0;min-height:20px;padding:4px calc(var(--dsh-composer-side-clearance) + 16px);overflow:visible;order:30;align-self:center}',
  '[data-phase="hero"] [data-slot="conversation.input.dock"]:has(> .grok-usage-dock)>*{box-sizing:border-box;flex:0 1 auto;min-width:0;width:auto!important;max-width:none!important;margin:0!important;padding:0!important}',
  ".grok-usage-dock{display:inline-flex;align-items:center;flex:none;line-height:20px}",
  '[data-slot="conversation.composer.dock"]:has(> .grok-usage-dock)>.grok-usage-dock{flex:none;overflow:visible}',
  '[data-phase="hero"] [data-slot="conversation.input.dock"]:has(> .grok-usage-dock)>.grok-usage-dock{flex:none;overflow:visible}',
  '.grok-usage-dock:not(:last-child):after{content:"|";color:var(--dsw-alias-separator-primary);margin:0 10px;font-size:12px;line-height:20px}',
  ".grok-usage{appearance:none;display:inline-flex;align-items:center;gap:6px;height:20px;padding:0 2px;border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-label-tertiary);font:inherit;font-size:12px;line-height:20px;letter-spacing:.01em;white-space:nowrap;cursor:pointer;user-select:none}",
  ".grok-usage:hover,.grok-usage:focus-visible{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-secondary);outline:none}",
  '.grok-usage-amount{color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;font-feature-settings:"tnum"}',
  ".grok-usage.is-warn .grok-usage-amount{color:var(--dsw-alias-state-warn-primary)}",
  ".grok-usage.is-alert .grok-usage-amount{color:var(--dsw-alias-state-error-primary)}",
  ".grok-usage-mark{display:block;opacity:.78;flex:none}",
  ".grok-usage:hover .grok-usage-mark,.grok-usage:focus-visible .grok-usage-mark{opacity:.95}",
  ".grok-usage.is-loading .grok-usage-mark{opacity:.95;animation:grok-usage-spin .8s linear infinite}",
  "@media (prefers-reduced-motion:reduce){.grok-usage.is-loading .grok-usage-mark{animation:none}}",
  "@keyframes grok-usage-spin{to{transform:rotate(360deg)}}",
  '@media (max-width:640px){[data-slot="conversation.composer.dock"]:has(> .grok-usage-dock),[data-phase="hero"] [data-slot="conversation.input.dock"]:has(> .grok-usage-dock){padding-left:12px;padding-right:12px}}'
].join("");
var grokUsageCssId = "dsh-grok-oauth/usage-dock.css";
if (typeof document !== "undefined") {
  let grokUsageTag = document.querySelector(`style[data-plugin-css="${grokUsageCssId}"]`);
  if (grokUsageTag === null) {
    grokUsageTag = document.createElement("style");
    grokUsageTag.dataset.plugin = "dsh-grok-oauth";
    grokUsageTag.dataset.pluginCss = grokUsageCssId;
    document.head.appendChild(grokUsageTag);
  }
  grokUsageTag.textContent = grokUsageDockCss;
}
var grokUsageFetch = null;
var grokUsageSnapshot = { status: "idle" };
var grokUsageLast = void 0;
var grokUsageLastFetchAt = 0;
var grokUsageInFlight = null;
var grokUsageListeners = /* @__PURE__ */ new Set();
function setGrokUsageFetch(fn) {
  grokUsageFetch = fn;
}
function grokUsageEmit() {
  for (const listener of grokUsageListeners) listener();
}
function useGrokUsageStore() {
  const [, bump] = (0, import_react2.useState)(0);
  (0, import_react2.useEffect)(() => {
    const onChange = () => bump((n) => n + 1);
    grokUsageListeners.add(onChange);
    return () => {
      grokUsageListeners.delete(onChange);
    };
  }, []);
  return grokUsageSnapshot;
}
function loadGrokUsage(force) {
  if (grokUsageFetch === null) return Promise.resolve(grokUsageSnapshot);
  if (grokUsageInFlight !== null) return grokUsageInFlight;
  if (!force && grokUsageLastFetchAt > 0 && Date.now() - grokUsageLastFetchAt < GROK_USAGE_FOCUS_DEBOUNCE_MS && grokUsageSnapshot.status === "ready") {
    return Promise.resolve(grokUsageSnapshot);
  }
  grokUsageSnapshot = {
    status: "loading",
    usage: grokUsageLast,
    error: grokUsageSnapshot.status === "error" ? grokUsageSnapshot.error : void 0
  };
  grokUsageEmit();
  grokUsageInFlight = grokUsageFetch().then(
    (read) => {
      grokUsageInFlight = null;
      grokUsageLastFetchAt = Date.now();
      if (read.status === "logged-out") {
        grokUsageLast = void 0;
        grokUsageSnapshot = { status: "logged-out" };
      } else if (read.status === "unsupported") {
        grokUsageSnapshot = {
          status: "unsupported",
          usage: grokUsageLast
        };
      } else {
        grokUsageLast = read.usage;
        grokUsageSnapshot = {
          status: "ready",
          usage: read.usage
        };
      }
      grokUsageEmit();
      return grokUsageSnapshot;
    },
    (error) => {
      grokUsageInFlight = null;
      grokUsageLastFetchAt = Date.now();
      grokUsageSnapshot = {
        status: "error",
        usage: grokUsageLast,
        error: error instanceof Error && error.message.length > 0 ? error.message : "usage failed"
      };
      grokUsageEmit();
      return grokUsageSnapshot;
    }
  );
  return grokUsageInFlight;
}
function grokUsageVisible() {
  return typeof document === "undefined" || document.visibilityState !== "hidden";
}
function onGrokUsageVisibility() {
  if (grokUsageVisible()) loadGrokUsage(false);
}
function onGrokUsageFocus() {
  loadGrokUsage(false);
}
function grokUsageTitle(usage, t) {
  const view = usagePresentation(usage);
  const parts = [t("usageWindowSuperGrok")];
  if (view.products.length > 0) {
    parts.push(
      view.products.map((product) => `${usageWindowLabelOf(product.id, t)} ${product.used}%`).join(" \xB7 ")
    );
  }
  const reset = resetLabelOf(view.total?.resetsAt, usageResetCopy(t));
  if (reset !== void 0) parts.push(reset);
  if (usage.fetchedAt) {
    const stamp = formatUsageClock(new Date(usage.fetchedAt));
    if (stamp) parts.push(t("usageUpdatedAt").replace("{time}", stamp));
  }
  parts.push(t("dockClick"));
  return parts.join("\n");
}
function isBlankComposer(useSession) {
  if (typeof document !== "undefined") {
    const phase = document.querySelector("[data-phase]")?.getAttribute("data-phase");
    if (phase === "hero" || phase === "settling") return true;
    if (phase === "active") return false;
  }
  if (typeof useSession !== "function") return true;
  const snap = useSession((s) => s);
  if (snap && typeof snap === "object") {
    if (snap.composerPhase === "blank") return true;
    if (snap.blank === true && snap.promptAttempted !== true) return true;
  }
  return false;
}
function GrokUsageChip(props) {
  const t = props.t ?? ((key) => key === "dockUsed" ? "{percent}% \u5DF2\u7528" : key);
  const blank = isBlankComposer(props.useSession);
  const snapshot = useGrokUsageStore();
  const running = typeof props.useSession === "function" ? props.useSession((s) => s.running) : false;
  const prevRunning = (0, import_react2.useRef)(running);
  (0, import_react2.useEffect)(() => {
    if (snapshot.status === "idle" || snapshot.usage === void 0 && grokUsageLast === void 0) {
      void loadGrokUsage(true);
    }
  }, [snapshot.status]);
  (0, import_react2.useEffect)(() => {
    if (prevRunning.current === true && running === false) loadGrokUsage(true);
    prevRunning.current = running;
  }, [running]);
  if (props.seat === "hero" !== blank) return null;
  const usage = snapshot.usage ?? grokUsageLast;
  if (usage === void 0) {
    if (snapshot.status === "loading" || snapshot.status === "idle") {
      return /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "grok-usage-dock", children: /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
        "button",
        {
          type: "button",
          className: "grok-usage is-loading",
          title: "Grok \u989D\u5EA6\u67E5\u8BE2\u4E2D...",
          "aria-label": "Grok \u989D\u5EA6\u67E5\u8BE2\u4E2D...",
          onMouseDown: (e) => e.preventDefault(),
          onClick: (e) => {
            e.preventDefault();
            e.stopPropagation();
            void loadGrokUsage(true);
          },
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "grok-usage-mark", children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(BrandMark, { size: 12 }) }),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "grok-usage-amount", children: "..." })
          ]
        }
      ) });
    }
    return null;
  }
  const used = officialUsedPercent(usage);
  if (used === void 0) return null;
  const loading = snapshot.status === "loading";
  const kind = used >= GROK_USAGE_ALERT ? "alert" : used >= GROK_USAGE_WARN ? "warn" : "ready";
  const className = [
    "grok-usage",
    loading ? "is-loading" : "",
    kind === "warn" ? "is-warn" : "",
    kind === "alert" ? "is-alert" : ""
  ].filter(Boolean).join(" ");
  const amount = (typeof t === "function" ? t("dockUsed") : "{percent}% \u5DF2\u7528").replace("{percent}", String(used));
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "grok-usage-dock", children: /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
    "button",
    {
      type: "button",
      className,
      title: typeof t === "function" ? grokUsageTitle(usage, t) : `Grok ${amount}`,
      "aria-label": `${typeof t === "function" ? t("usageWindowSuperGrok") : "SuperGrok"} ${amount}`,
      onMouseDown: (e) => e.preventDefault(),
      onClick: (e) => {
        e.preventDefault();
        e.stopPropagation();
        loadGrokUsage(true);
      },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "grok-usage-mark", children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(BrandMark, { size: 12 }) }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "grok-usage-amount", children: amount })
      ]
    }
  ) });
}

// src/client/components/GrokPluginCard.tsx
var import_jsx_runtime8 = require("react/jsx-runtime");
var cardStyle = {
  overflow: "hidden",
  border: "1px solid var(--dsw-alias-border-l2)",
  borderRadius: 10,
  background: "var(--dsw-alias-bg-module-platform)"
};
var staticHeaderStyle = {
  boxSizing: "border-box",
  width: "100%",
  minHeight: 68,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  border: 0,
  padding: "12px 14px",
  background: "transparent",
  color: "var(--dsw-alias-label-primary)",
  font: "inherit",
  textAlign: "left",
  cursor: "default"
};
var bodyStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 18,
  borderTop: "1px solid var(--dsw-alias-border-l2)",
  padding: "16px 14px 18px"
};
var sectionStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 12
};
var sectionTitleStyle = {
  margin: 0,
  fontSize: 14,
  lineHeight: "20px",
  fontWeight: 600,
  color: "var(--dsw-alias-label-primary)"
};
var hintStyle3 = {
  margin: 0,
  fontSize: 12,
  color: "var(--dsw-alias-label-tertiary)"
};
var labelStyle3 = {
  fontSize: 13,
  color: "var(--dsw-alias-label-secondary)"
};
var statusStyle2 = {
  margin: 0,
  fontSize: 13,
  color: "var(--dsw-alias-label-secondary)"
};
var errorStyle3 = {
  ...statusStyle2,
  color: "var(--dsw-alias-state-error-primary)"
};
var buttonStyle2 = {
  alignSelf: "flex-start",
  minHeight: 34,
  border: "1px solid var(--dsw-alias-border-l2)",
  borderRadius: 18,
  padding: "6px 14px",
  background: "var(--dsw-alias-bg-layer-1)",
  color: "var(--dsw-alias-label-primary)",
  font: "inherit",
  cursor: "pointer"
};
var primaryButtonStyle = {
  ...buttonStyle2,
  borderColor: "var(--dsw-alias-button-primary-fill)",
  background: "var(--dsw-alias-button-primary-fill)",
  color: "var(--dsw-alias-label-primary-foreground)"
};
var quietButtonStyle2 = {
  ...buttonStyle2,
  minHeight: 28,
  padding: "4px 10px",
  fontSize: 12
};
var accountListStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 8
};
var accountRowStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  border: "1px solid var(--dsw-alias-border-l2)",
  borderRadius: 10,
  padding: "10px 12px",
  background: "var(--dsw-alias-bg-layer-1)"
};
var accountMetaStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 2,
  minWidth: 0,
  flex: 1
};
var inputStyle = {
  boxSizing: "border-box",
  width: "100%",
  minHeight: 36,
  border: "1px solid var(--dsw-alias-border-l2)",
  borderRadius: 8,
  padding: "7px 10px",
  background: "var(--dsw-alias-bg-layer-1)",
  color: "var(--dsw-alias-label-primary)",
  font: "inherit"
};
var rowInputStyle = {
  ...inputStyle,
  minHeight: 32,
  padding: "4px 10px"
};
var actionsStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: 10
};
var iconButtonStyle2 = {
  boxSizing: "border-box",
  width: 28,
  height: 28,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flex: "none",
  border: 0,
  borderRadius: 6,
  padding: 0,
  background: "transparent",
  color: "var(--dsw-alias-label-tertiary)",
  font: "inherit",
  cursor: "pointer"
};
var disclosureStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  minWidth: 0,
  border: 0,
  padding: 0,
  background: "transparent",
  color: "var(--dsw-alias-label-primary)",
  font: "inherit",
  textAlign: "left",
  cursor: "pointer"
};
var modelContentStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr) auto auto",
  alignItems: "center",
  gap: 6,
  padding: "6px 8px"
};
var modelDetailStyle = {
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 14,
  borderTop: "1px solid var(--dsw-alias-border-l2)",
  padding: "10px 4px 4px"
};
var nextModelRow = 0;
function newModelRowId() {
  nextModelRow += 1;
  return `grok-model-row-${String(nextModelRow)}`;
}
function integerOf(text) {
  const trimmed = text.trim();
  if (trimmed.length === 0) return void 0;
  if (!/^[1-9]\d*$/u.test(trimmed)) return NaN;
  return Number(trimmed);
}
function modelDraftOf(model) {
  return {
    rowId: newModelRowId(),
    id: model.id,
    contextWindow: model.contextWindow === void 0 ? "" : String(model.contextWindow),
    ...model.name === void 0 ? {} : { name: model.name },
    ...model.thinking === void 0 ? {} : { thinking: model.thinking },
    ...model.vision === void 0 ? {} : { vision: model.vision },
    ...model.defaultReasoningEffort === void 0 ? {} : { defaultReasoningEffort: model.defaultReasoningEffort },
    ...model.reasoningEfforts === void 0 ? {} : { reasoningEfforts: model.reasoningEfforts }
  };
}
function modelSettingsOf(draft) {
  const contextWindow = integerOf(draft.contextWindow);
  return {
    id: draft.id.trim(),
    ...draft.name === void 0 || draft.name.trim().length === 0 ? {} : { name: draft.name.trim() },
    ...draft.thinking === void 0 ? {} : { thinking: draft.thinking },
    ...draft.vision === void 0 ? {} : { vision: draft.vision },
    ...draft.defaultReasoningEffort === void 0 ? {} : { defaultReasoningEffort: draft.defaultReasoningEffort },
    ...contextWindow === void 0 || Number.isNaN(contextWindow) ? {} : { contextWindow },
    ...draft.reasoningEfforts === void 0 ? {} : { reasoningEfforts: draft.reasoningEfforts }
  };
}
function sameDraft(left, right) {
  return JSON.stringify(left.map(modelSettingsOf)) === JSON.stringify(right.map(modelSettingsOf));
}
function modelFailure(models) {
  const ids = /* @__PURE__ */ new Set();
  for (const model of models) {
    const id = model.id.trim();
    if (id.length === 0 || ids.has(id)) return true;
    if (Number.isNaN(integerOf(model.contextWindow))) return true;
    ids.add(id);
  }
  return false;
}
function formatSignedIn(t, email) {
  if (email === void 0) return t("signedInNoEmail");
  return t("signedInAs").replace("{email}", email);
}
function formatProviderSummary(...parts) {
  return parts.filter((part) => typeof part === "string" && part.length > 0).map((part) => part.replace(/[。.]$/u, "")).join(" \xB7 ");
}
function ProviderCardHeader({
  title,
  mark,
  summary,
  unsaved,
  unsavedLabel
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(import_jsx_runtime8.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("span", { style: { display: "flex", minWidth: 0, flex: 1, flexDirection: "column", gap: 4 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("span", { style: { display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600, lineHeight: 1 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { style: { width: 18, height: 18, flex: "none", display: "block", overflow: "visible" }, children: mark }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { style: { lineHeight: "20px" }, children: title })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
        "span",
        {
          style: {
            fontSize: 13,
            lineHeight: "18px",
            color: "var(--dsw-alias-label-tertiary)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis"
          },
          children: summary
        }
      )
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { style: { display: "inline-flex", alignItems: "center", gap: 10, flex: "none" }, children: unsaved === true && unsavedLabel !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { style: { fontSize: 12, color: "var(--dsw-alias-label-tertiary)" }, children: unsavedLabel }) : null })
  ] });
}
function AuthToolbar({ status, action }) {
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { style: { minWidth: 0, flex: 1 }, children: status }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { style: { flex: "none" }, children: action })
  ] });
}
function Capability({
  label,
  checked,
  disabled,
  onChange
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("label", { style: { ...labelStyle3, display: "inline-flex", alignItems: "center", gap: 6 }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
      "input",
      {
        type: "checkbox",
        checked,
        disabled,
        onChange: (event) => {
          onChange(event.target.checked);
        }
      }
    ),
    label
  ] });
}
function messageOf(error, fallback) {
  return error instanceof Error && error.message.length > 0 ? error.message : fallback;
}
function authFromStatus(status, fallback) {
  if (status.loggedIn) {
    return {
      kind: "signed-in",
      ...status.email === void 0 ? {} : { email: status.email },
      ...status.activeAccountId === void 0 ? {} : { activeAccountId: status.activeAccountId },
      accounts: status.accounts ?? []
    };
  }
  return {
    kind: "signed-out",
    ...fallback === void 0 ? {} : { message: fallback },
    accounts: status.accounts ?? []
  };
}
function signedOutAuth(message, accounts) {
  return {
    kind: "signed-out",
    ...message === void 0 ? {} : { message },
    accounts: accounts ?? []
  };
}
function signingInAuth(current) {
  const accounts = current?.accounts ?? [];
  const email = current && "email" in current ? current.email : void 0;
  const activeAccountId = current && "activeAccountId" in current ? current.activeAccountId : void 0;
  return {
    kind: "signing-in",
    ...email === void 0 ? {} : { email },
    ...activeAccountId === void 0 ? {} : { activeAccountId },
    accounts
  };
}
function restoreAuthAfterSignIn(current, message) {
  const accounts = current.accounts ?? [];
  const active = accounts.find((account) => account.active === true);
  if (active === void 0) return signedOutAuth(message, accounts);
  return {
    kind: "signed-in",
    ...active.email === void 0 ? {} : { email: active.email },
    activeAccountId: active.id,
    accounts,
    message
  };
}
function applyAuthStatus(status, setAuth, extras) {
  const next = authFromStatus(status);
  setAuth(next);
  if (next.kind !== "signed-in") {
    extras?.onSignedOut?.();
  }
  return next;
}
function GrokPluginCard(props) {
  const {
    t,
    startAuth,
    completeAuth,
    readAuthStatus,
    logout,
    switchAccount,
    removeAccount,
    fetchAllUsage,
    fetchModels
  } = props;
  const snapshot = props.useGrokSettings((value) => value);
  const initial = (0, import_react3.useMemo)(
    () => snapshot.value === void 0 ? void 0 : snapshot.value.models.map(modelDraftOf),
    [snapshot.value]
  );
  const [source, setSource] = (0, import_react3.useState)(initial);
  const [draft, setDraft] = (0, import_react3.useState)(initial);
  const [sourceRevision, setSourceRevision] = (0, import_react3.useState)(snapshot.revision);
  const [auth, setAuth] = (0, import_react3.useState)({ kind: "signed-out", accounts: [] });
  const [pasteCode, setPasteCode] = (0, import_react3.useState)("");
  const [usage, setUsage] = (0, import_react3.useState)({
    status: "idle"
  });
  const [lastAccounts, setLastAccounts] = (0, import_react3.useState)(void 0);
  const [usageUpdatedAt, setUsageUpdatedAt] = (0, import_react3.useState)(void 0);
  const [enableImageGen, setEnableImageGen] = (0, import_react3.useState)(snapshot.value?.enableImageGen === true);
  const [sourceEnableImageGen, setSourceEnableImageGen] = (0, import_react3.useState)(snapshot.value?.enableImageGen === true);
  const [serverSearch, setServerSearch] = (0, import_react3.useState)(snapshot.value?.serverSearch === true);
  const [sourceServerSearch, setSourceServerSearch] = (0, import_react3.useState)(snapshot.value?.serverSearch === true);
  const [proxy, setProxy] = (0, import_react3.useState)(snapshot.value?.proxy ?? "");
  const [sourceProxy, setSourceProxy] = (0, import_react3.useState)(snapshot.value?.proxy ?? "");
  const [catalogOpen, setCatalogOpen] = (0, import_react3.useState)(false);
  const [expandedModels, setExpandedModels] = (0, import_react3.useState)(/* @__PURE__ */ new Set());
  const [busy, setBusy] = (0, import_react3.useState)(false);
  const [fetching, setFetching] = (0, import_react3.useState)(false);
  const [failure, setFailure] = (0, import_react3.useState)(void 0);
  const [notice, setNotice] = (0, import_react3.useState)(void 0);
  const title = t("title");
  const signingIn = auth.kind === "signing-in";
  const disabled = snapshot.status !== "ready" || !snapshot.writable || busy;
  const dirty = source !== void 0 && draft !== void 0 && !sameDraft(source, draft) || enableImageGen !== sourceEnableImageGen || serverSearch !== sourceServerSearch || proxy !== sourceProxy;
  const invalid = draft !== void 0 && modelFailure(draft);
  const customModels = snapshot.user !== void 0 && Object.prototype.hasOwnProperty.call(snapshot.user, "models");
  (0, import_react3.useEffect)(() => {
    if (snapshot.status !== "ready" || snapshot.value === void 0) return;
    if (snapshot.revision === sourceRevision) return;
    if (dirty) return;
    const next = snapshot.value.models.map(modelDraftOf);
    setSource(next);
    setDraft(next);
    setEnableImageGen(snapshot.value.enableImageGen);
    setSourceEnableImageGen(snapshot.value.enableImageGen);
    setServerSearch(snapshot.value.serverSearch === true);
    setSourceServerSearch(snapshot.value.serverSearch === true);
    setProxy(snapshot.value.proxy ?? "");
    setSourceProxy(snapshot.value.proxy ?? "");
    setSourceRevision(snapshot.revision);
  }, [dirty, snapshot.revision, snapshot.status, snapshot.value, sourceRevision]);
  (0, import_react3.useEffect)(() => () => {
    props.closeModelPicker();
  }, [props.closeModelPicker]);
  const loadUsage = async () => {
    setUsage((current) => ({
      status: "loading",
      ...current.accounts === void 0 ? {} : { accounts: current.accounts }
    }));
    try {
      const read = await fetchAllUsage();
      if (read.status === "logged-out") {
        setAuth((current) => signedOutAuth(void 0, current.accounts));
        setLastAccounts(void 0);
        setUsageUpdatedAt(void 0);
        setUsage({ status: "idle" });
        return;
      }
      setLastAccounts(read.accounts);
      setUsageUpdatedAt(/* @__PURE__ */ new Date());
      setUsage({
        status: "ready",
        accounts: read.accounts
      });
    } catch (error) {
      setUsage((current) => ({
        status: "error",
        message: messageOf(error, t("usageFailed")),
        ...current.accounts === void 0 ? {} : { accounts: current.accounts }
      }));
    }
  };
  const clearUsage = () => {
    setLastAccounts(void 0);
    setUsageUpdatedAt(void 0);
    setUsage({ status: "idle" });
  };
  (0, import_react3.useEffect)(() => {
    let cancelled = false;
    readAuthStatus().then((status) => {
      if (cancelled) return;
      const next = applyAuthStatus(status, setAuth);
      if (next.kind !== "signed-in") clearUsage();
    }).catch(() => {
      if (!cancelled) {
        setAuth(signedOutAuth(t("statusFailed")));
        clearUsage();
      }
    });
    return () => {
      cancelled = true;
    };
  }, [readAuthStatus, t]);
  const authEmail = "email" in auth ? auth.email : void 0;
  const authActiveAccountId = "activeAccountId" in auth ? auth.activeAccountId : void 0;
  (0, import_react3.useEffect)(() => {
    if (auth.kind !== "signed-in" && auth.kind !== "signing-in" || auth.kind === "signing-in" && authActiveAccountId === void 0)
      return;
    setUsage({ status: "loading" });
    loadUsage();
  }, [auth.kind, authActiveAccountId]);
  const patchDraft = (models) => {
    setDraft(models);
    setFailure(void 0);
    setNotice(void 0);
  };
  const patchModel = (index, patch) => {
    if (draft === void 0) return;
    patchDraft(
      draft.map((model, at) => {
        if (at !== index) return model;
        const next = { ...model };
        if (patch.id !== void 0) next.id = patch.id;
        if ("name" in patch) {
          if (patch.name === void 0) delete next.name;
          else next.name = patch.name;
        }
        if ("thinking" in patch) {
          if (patch.thinking === void 0) delete next.thinking;
          else next.thinking = patch.thinking;
        }
        if ("vision" in patch) {
          if (patch.vision === void 0) delete next.vision;
          else next.vision = patch.vision;
        }
        if ("defaultReasoningEffort" in patch) {
          if (patch.defaultReasoningEffort === void 0) delete next.defaultReasoningEffort;
          else next.defaultReasoningEffort = patch.defaultReasoningEffort;
        }
        if ("contextWindow" in patch) next.contextWindow = patch.contextWindow ?? "";
        return next;
      })
    );
  };
  const onSignIn = async () => {
    if (proxy !== sourceProxy && snapshot.value !== void 0) {
      try {
        const accepted = await props.saveConfiguration({
          ...snapshot.value,
          proxy
        });
        setProxy(accepted.settings.proxy ?? "");
        setSourceProxy(accepted.settings.proxy ?? "");
        setSourceRevision(accepted.revision);
        setNotice(t("proxyAutoSaved"));
      } catch {
      }
    }
    setAuth((current) => signingInAuth(current));
    setPasteCode("");
    if ((auth.accounts?.length ?? 0) === 0) setUsage({ status: "idle" });
    try {
      const started = await startAuth();
      if (!started.ok) {
        const message = started.message || t("signInFailed");
        setFailure(message);
        setAuth((current) => restoreAuthAfterSignIn(current, message));
        return;
      }
      const status = await readAuthStatus();
      const next = applyAuthStatus(status, setAuth, { onSignedOut: clearUsage });
      setFailure(void 0);
      const nextEmail = "email" in next ? next.email : void 0;
      if (started.reused === true) {
        setNotice(t("accountReused").replace("{email}", started.email ?? nextEmail ?? ""));
      } else if (next.kind === "signed-in") {
        setNotice(t("accountAdded").replace("{email}", nextEmail ?? ""));
      }
      loadGrokUsage(true);
    } catch {
      const message = t("signInFailed");
      setFailure(message);
      setAuth((current) => restoreAuthAfterSignIn(current, message));
    }
  };
  const onPasteCode = async () => {
    const code = pasteCode.trim();
    if (code.length === 0) {
      setAuth((current) => signingInAuth(current));
      return;
    }
    try {
      if (!(await completeAuth(code)).ok) setAuth((current) => signingInAuth(current));
    } catch {
      setAuth((current) => signingInAuth(current));
    }
  };
  const onSwitchAccount = async (accountId) => {
    try {
      const result = await switchAccount(accountId);
      if (!result.ok) {
        setFailure(result.message || t("switchFailed"));
        return;
      }
      const status = result.status ?? await readAuthStatus();
      applyAuthStatus(status, setAuth, { onSignedOut: clearUsage });
      setNotice(t("accountSwitched").replace("{email}", status.email ?? ""));
      setLastAccounts(
        (current) => current === void 0 ? current : current.map((entry) => ({
          ...entry,
          active: entry.accountId === accountId
        }))
      );
      setUsage((current) => {
        const accounts = current.accounts ?? lastAccounts;
        if (accounts === void 0) return { status: "loading" };
        return {
          status: "ready",
          accounts: accounts.map((entry) => ({
            ...entry,
            active: entry.accountId === accountId
          }))
        };
      });
      loadGrokUsage(true);
      await loadUsage();
    } catch (error) {
      setFailure(messageOf(error, t("switchFailed")));
    }
  };
  const onRemoveAccount = async (accountId) => {
    try {
      const result = await removeAccount(accountId);
      if (!result.ok) {
        setFailure(result.message || t("removeFailed"));
        return;
      }
      const status = result.status ?? await readAuthStatus();
      const next = applyAuthStatus(status, setAuth, { onSignedOut: clearUsage });
      if (next.kind === "signed-in") {
        setLastAccounts(void 0);
        setUsageUpdatedAt(void 0);
        setUsage({ status: "loading" });
        await loadUsage();
        loadGrokUsage(true);
      } else {
        clearUsage();
        loadGrokUsage(true);
      }
    } catch (error) {
      setFailure(messageOf(error, t("removeFailed")));
    }
  };
  const chooseFromAccount = async () => {
    if (draft === void 0) return;
    const currentModels = draft.map(modelSettingsOf);
    const initiallyPicked = new Set(currentModels.map((model) => model.id));
    setFetching(true);
    setFailure(void 0);
    setNotice(void 0);
    props.beginModelPicker(initiallyPicked, (selected) => {
      setDraft((current) => {
        if (current === void 0) return current;
        const currentById = new Map(current.map((model) => [model.id.trim(), model]));
        const next = /* @__PURE__ */ new Map();
        for (const candidate of selected) {
          const existing = currentById.get(candidate.id);
          const discovered = modelDraftOf(candidate);
          next.set(
            candidate.id,
            existing === void 0 ? discovered : {
              ...existing,
              ...discovered,
              rowId: existing.rowId
            }
          );
        }
        return [...next.values()];
      });
      setCatalogOpen(true);
      setFailure(void 0);
      setNotice(void 0);
    });
    try {
      const found = await fetchModels();
      if (found.length === 0) {
        const message = t("fetchEmpty");
        props.failModelPicker(message);
        setFailure(message);
        return;
      }
      const foundIds = new Set(found.map((model) => model.id));
      const currentOnly = currentModels.filter((model) => !foundIds.has(model.id));
      props.completeModelPicker([...found, ...currentOnly]);
    } catch (error) {
      const message = messageOf(error, t("requestFailed"));
      props.failModelPicker(message);
      setFailure(message);
    } finally {
      setFetching(false);
    }
  };
  const discard = () => {
    if (source !== void 0) setDraft(source.map((model) => ({ ...model })));
    setEnableImageGen(sourceEnableImageGen);
    setServerSearch(sourceServerSearch);
    setProxy(sourceProxy);
    setFailure(void 0);
    setNotice(void 0);
  };
  const save = async () => {
    if (draft === void 0 || snapshot.value === void 0 || invalid) return;
    setBusy(true);
    setFailure(void 0);
    setNotice(void 0);
    try {
      const accepted = await props.saveConfiguration({
        ...snapshot.value,
        models: draft.map(modelSettingsOf),
        enableImageGen,
        serverSearch,
        proxy
      });
      const next = accepted.settings.models.map(modelDraftOf);
      setSource(next);
      setDraft(next);
      setEnableImageGen(accepted.settings.enableImageGen);
      setSourceEnableImageGen(accepted.settings.enableImageGen);
      setServerSearch(accepted.settings.serverSearch === true);
      setSourceServerSearch(accepted.settings.serverSearch === true);
      setProxy(accepted.settings.proxy ?? "");
      setSourceProxy(accepted.settings.proxy ?? "");
      setSourceRevision(accepted.revision);
      setNotice(t("saved"));
    } catch (error) {
      setFailure(messageOf(error, t("requestFailed")));
    } finally {
      setBusy(false);
    }
  };
  const savedAccounts = auth.accounts ?? [];
  const usageAccounts = usage.accounts ?? lastAccounts;
  const accountCount = savedAccounts.length;
  const statusLabel = signingIn ? t("signingIn") : auth.kind === "signed-in" ? formatSignedIn(t, auth.email) : auth.message ?? t("signedOut");
  const modelCount = draft?.length ?? 0;
  const headerSummary = formatProviderSummary(
    auth.kind === "signed-in" || accountCount > 0 ? t("summaryOn") : t("summaryOff"),
    t("summaryAccounts").replace("{count}", String(accountCount)),
    t("summaryModels").replace("{count}", String(modelCount))
  );
  if (snapshot.status === "unavailable") {
    return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("li", { style: cardStyle, children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { style: staticHeaderStyle, children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(ProviderCardHeader, { title, mark: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(BrandMark, {}), summary: headerSummary }) }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { style: bodyStyle, children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { style: statusStyle2, role: "status", children: t("remoteAccess") }) })
    ] });
  }
  if (snapshot.status !== "ready" || draft === void 0) {
    return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("li", { style: cardStyle, children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { style: staticHeaderStyle, children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(ProviderCardHeader, { title, mark: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(BrandMark, {}), summary: headerSummary }) }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { style: bodyStyle, children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { style: statusStyle2, children: t("loading") }) })
    ] });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("li", { style: cardStyle, children: [
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { style: staticHeaderStyle, children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
      ProviderCardHeader,
      {
        title,
        mark: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(BrandMark, {}),
        summary: headerSummary,
        unsaved: dirty,
        unsavedLabel: t("unsaved")
      }
    ) }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { style: bodyStyle, children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { style: hintStyle3, children: t("description") }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("section", { style: sectionStyle, "aria-label": t("accounts"), children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
          AuthToolbar,
          {
            status: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { style: { ...statusStyle2, margin: 0 }, children: statusLabel }),
            action: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
              "button",
              {
                type: "button",
                style: buttonStyle2,
                disabled: signingIn,
                onClick: () => {
                  onSignIn();
                },
                children: t(accountCount > 0 ? "addAccount" : "signIn")
              }
            )
          }
        ),
        savedAccounts.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { style: accountListStyle, children: savedAccounts.map((account) => /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { style: accountRowStyle, children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { style: accountMetaStyle, children: [
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { style: { ...statusStyle2, margin: 0, color: "var(--dsw-alias-label-primary)" }, children: accountLabelOf(account) }),
            (() => {
              const caption = accountUsageCaption(accountUsageOf(usageAccounts, account.id), t);
              if (!account.active && caption === void 0) return null;
              return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { style: { ...hintStyle3, display: "flex", flexWrap: "wrap", gap: 6 }, children: [
                account.active ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { children: t("accountActive") }) : null,
                caption === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { style: { color: caption.color }, children: caption.text })
              ] });
            })()
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { style: { display: "flex", gap: 8, flex: "none" }, children: [
            account.active ? null : /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
              "button",
              {
                type: "button",
                style: quietButtonStyle2,
                disabled: signingIn,
                onClick: () => {
                  onSwitchAccount(account.id);
                },
                children: t("useAccount")
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
              "button",
              {
                type: "button",
                style: quietButtonStyle2,
                disabled: signingIn,
                onClick: () => {
                  onRemoveAccount(account.id);
                },
                children: t("removeAccount")
              }
            )
          ] })
        ] }, account.id)) }) : /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { style: hintStyle3, children: t("accountsEmpty") }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { style: hintStyle3, children: t("accountsHelp") }),
        auth.kind === "signing-in" ? /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: 8 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { style: hintStyle3, children: t("pasteCode") }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("label", { style: labelStyle3, htmlFor: "grok-oauth-code", children: t("pasteCodeLabel") }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
            "input",
            {
              id: "grok-oauth-code",
              style: inputStyle,
              value: pasteCode,
              autoComplete: "off",
              spellCheck: false,
              "aria-label": t("pasteCodeLabel"),
              onChange: (event) => {
                setPasteCode(event.target.value);
              }
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
            "button",
            {
              type: "button",
              style: buttonStyle2,
              disabled: pasteCode.trim().length === 0,
              onClick: () => {
                onPasteCode();
              },
              children: t("pasteCodeSubmit")
            }
          )
        ] }) : null
      ] }),
      auth.kind === "signed-in" || authActiveAccountId !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("section", { style: sectionStyle, "aria-label": t("usage"), children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
          UsageHeader,
          {
            title: t("usage"),
            spinning: usage.status === "loading" || usage.status === "idle",
            disabled: usage.status === "loading",
            refreshLabel: t("usageRefresh"),
            busyLabel: t("usageLoading"),
            ...usage.status === "error" ? { error: t("usageRefreshFailed") } : {},
            onRefresh: () => {
              loadUsage();
            }
          }
        ),
        (() => {
          if (usageAccounts !== void 0) {
            return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(import_jsx_runtime8.Fragment, { children: [
              renderAccountsUsage(usageAccounts, t),
              usage.status === "error" ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { style: errorStyle3, children: usage.message }) : null
            ] });
          }
          if (usage.status === "loading" || usage.status === "idle") {
            return /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(UsageSkeleton, { rows: (usageAccounts?.length ?? 0) > 1 ? 2 : 1 });
          }
          if (usage.status === "unsupported") return /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { style: hintStyle3, children: t("usageUnsupported") });
          if (usage.status === "error") return /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { style: errorStyle3, children: usage.message });
          return /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(UsageSkeleton, { rows: 1 });
        })(),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
          UsageUpdatedAt,
          {
            at: usageUpdatedAt,
            label: usageUpdatedAt === void 0 ? "" : t("usageUpdatedAt").replace("{time}", formatUsageClock(usageUpdatedAt))
          }
        )
      ] }) : null,
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("section", { style: sectionStyle, "aria-label": t("models"), children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(
            "button",
            {
              type: "button",
              style: disclosureStyle,
              "aria-expanded": catalogOpen,
              "aria-label": t("models"),
              onClick: () => {
                setCatalogOpen(!catalogOpen);
              },
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(IconChevron, { open: catalogOpen }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { style: sectionTitleStyle, children: t("models") }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { style: hintStyle3, children: customModels ? t("customized") : t("inherited") })
              ]
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
            "button",
            {
              type: "button",
              style: buttonStyle2,
              disabled: fetching || disabled,
              onClick: () => {
                chooseFromAccount();
              },
              children: t(fetching ? "fetchingModels" : "fetchModels")
            }
          )
        ] }),
        catalogOpen ? /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(import_jsx_runtime8.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
            SortableList,
            {
              items: draft,
              getId: (model) => model.rowId,
              disabled,
              dragLabel: (model, index) => {
                const label = model.id.trim().length > 0 ? model.id.trim() : String(index + 1);
                return `${t("dragModel")}: ${label}`;
              },
              onReorder: patchDraft,
              renderItem: (model, index) => {
                const expanded = expandedModels.has(model.rowId);
                const label = model.id.trim().length > 0 ? model.id.trim() : String(index + 1);
                return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { "data-model-row": label, style: modelContentStyle, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                    "input",
                    {
                      style: rowInputStyle,
                      value: model.id,
                      placeholder: t("modelId"),
                      "aria-label": `${t("modelId")} ${String(index + 1)}`,
                      disabled,
                      onChange: (event) => {
                        patchModel(index, { id: event.target.value });
                      }
                    }
                  ),
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                    "input",
                    {
                      style: rowInputStyle,
                      value: model.name ?? "",
                      placeholder: t("modelName"),
                      "aria-label": `${t("modelName")} ${String(index + 1)}`,
                      disabled,
                      onChange: (event) => {
                        patchModel(index, { name: event.target.value || void 0 });
                      }
                    }
                  ),
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                    "button",
                    {
                      type: "button",
                      style: iconButtonStyle2,
                      "aria-label": `${t("modelDetails")}: ${label}`,
                      "aria-expanded": expanded,
                      title: t("modelDetails"),
                      onClick: () => {
                        setExpandedModels((current) => {
                          const next = new Set(current);
                          if (!next.delete(model.rowId)) next.add(model.rowId);
                          return next;
                        });
                      },
                      children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(IconChevron, { open: expanded })
                    }
                  ),
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                    "button",
                    {
                      type: "button",
                      style: iconButtonStyle2,
                      "aria-label": `${t("remove")} ${label}`,
                      title: t("remove"),
                      disabled,
                      onClick: () => {
                        patchDraft(draft.filter((_, at) => at !== index));
                      },
                      children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(IconTrash, {})
                    }
                  ),
                  expanded ? /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { style: { ...modelDetailStyle, gridColumn: "1 / -1" }, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                      Capability,
                      {
                        label: t("vision"),
                        checked: model.vision === true,
                        disabled,
                        onChange: (vision) => {
                          patchModel(index, { vision });
                        }
                      }
                    ),
                    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                      Capability,
                      {
                        label: t("thinking"),
                        checked: model.thinking === true,
                        disabled,
                        onChange: (thinking) => {
                          if (!thinking) {
                            patchModel(index, { thinking, defaultReasoningEffort: void 0 });
                          } else {
                            patchModel(index, { thinking });
                          }
                        }
                      }
                    ),
                    (() => {
                      const settings = modelSettingsOf(model);
                      const efforts = settings.thinking === true ? officialEffortsFor(settings) : [];
                      if (efforts.length === 0) return null;
                      const suggested = officialDefaultEffort(settings);
                      return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("label", { style: { ...labelStyle3, display: "inline-flex", alignItems: "center", gap: 6 }, children: [
                        t("defaultEffort"),
                        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                          "select",
                          {
                            style: rowInputStyle,
                            value: model.defaultReasoningEffort ?? suggested,
                            disabled,
                            "aria-label": t("defaultEffort"),
                            onChange: (event) => {
                              const effort = efforts.find((entry) => entry.value === event.target.value);
                              patchModel(index, { defaultReasoningEffort: effort?.value });
                            },
                            children: efforts.map((effort) => /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("option", { value: effort.value, children: effort.label ?? effort.value }, effort.value))
                          }
                        )
                      ] });
                    })(),
                    /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("label", { style: { ...labelStyle3, display: "inline-flex", alignItems: "center", gap: 6 }, children: [
                      t("contextWindow"),
                      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                        "input",
                        {
                          style: { ...rowInputStyle, width: 110 },
                          inputMode: "numeric",
                          placeholder: t("contextWindowDefault"),
                          value: model.contextWindow,
                          disabled,
                          "aria-label": t("contextWindow"),
                          onChange: (event) => {
                            patchModel(index, { contextWindow: event.target.value });
                          }
                        }
                      )
                    ] })
                  ] }) : null
                ] });
              }
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
            "button",
            {
              type: "button",
              style: { ...buttonStyle2, alignSelf: "flex-start" },
              disabled,
              onClick: () => {
                const model = {
                  rowId: newModelRowId(),
                  id: "",
                  contextWindow: ""
                };
                patchDraft([...draft, model]);
                setExpandedModels((current) => new Set(current).add(model.rowId));
              },
              children: t("addModel")
            }
          )
        ] }) : null
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("section", { style: sectionStyle, "aria-label": t("capabilities"), children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { style: sectionTitleStyle, children: t("capabilities") }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
          Capability,
          {
            label: t("enableImageGen"),
            checked: enableImageGen,
            disabled,
            onChange: (checked) => {
              setEnableImageGen(checked);
              setFailure(void 0);
              setNotice(void 0);
            }
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
          Capability,
          {
            label: t("serverSearch"),
            checked: serverSearch,
            disabled,
            onChange: (checked) => {
              setServerSearch(checked);
              setFailure(void 0);
              setNotice(void 0);
            }
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { style: hintStyle3, children: t("serverSearchHelp") }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { style: hintStyle3, children: t("enableImageGenHelp") })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("section", { style: sectionStyle, "aria-label": t("network"), children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { style: sectionTitleStyle, children: t("network") }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("label", { style: labelStyle3, htmlFor: "grok-oauth-proxy", children: t("proxyLabel") }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
          "input",
          {
            id: "grok-oauth-proxy",
            style: inputStyle,
            value: proxy,
            autoComplete: "off",
            spellCheck: false,
            "aria-label": t("proxyLabel"),
            placeholder: t("proxyPlaceholder"),
            onChange: (event) => {
              setProxy(event.target.value);
              setFailure(void 0);
              setNotice(void 0);
            }
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { style: hintStyle3, children: t("proxyHelp") })
      ] }),
      invalid ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { style: errorStyle3, children: t("invalidModel") }) : null,
      failure !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { style: errorStyle3, children: failure }) : null,
      notice !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { style: statusStyle2, children: notice }) : null,
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { style: actionsStyle, children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { type: "button", style: buttonStyle2, disabled: !dirty || busy, onClick: discard, children: t("discard") }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
          "button",
          {
            type: "button",
            style: primaryButtonStyle,
            disabled: !dirty || invalid || disabled,
            onClick: () => {
              save();
            },
            children: t(busy ? "saving" : "save")
          }
        )
      ] })
    ] })
  ] });
}

// src/client/components/GrokImageRow.tsx
var import_react4 = require("react");
var import_jsx_runtime9 = require("react/jsx-runtime");
var cssId = "dsh-grok-oauth/image-row.css";
var css = [
  ".grok-image-row{display:flex;flex-direction:column;gap:8px;min-width:0}",
  ".grok-image-row-head{display:flex;align-items:center;min-width:0;height:24px}",
  ".grok-image-row-lead{width:16px;height:16px;flex:none;margin-right:6px;color:var(--dsw-alias-label-tertiary);display:inline-flex;align-items:center;justify-content:center}",
  ".grok-image-row-title{flex:none;color:var(--dsw-alias-label-secondary);font-size:14px;line-height:24px}",
  ".grok-image-row-sep{width:2px;height:2px;flex:none;margin:0 8px;border-radius:1px;background:var(--dsw-alias-label-caption)}",
  ".grok-image-row-summary{min-width:0;flex:auto;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-tertiary);font-size:14px;line-height:24px}",
  ".grok-image-row-summary.is-error{color:var(--dsw-alias-state-error-primary)}",
  ".grok-image-row-path{appearance:none;border:0;padding:0;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;line-height:18px;text-align:left;cursor:pointer;text-decoration:underline;text-underline-offset:2px}",
  ".grok-image-row-path:hover,.grok-image-row-path:focus-visible{color:var(--dsw-alias-label-primary);outline:none}",
  ".grok-image-gallery{display:flex;flex-wrap:wrap;gap:10px;max-width:100%}",
  ".grok-image-frame{appearance:none;border:.5px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-interactive-bg-hover);cursor:zoom-in;border-radius:16px;flex:none;min-width:44px;min-height:44px;padding:0;display:grid;place-items:center;overflow:hidden}",
  ".grok-image-frame img{width:100%;height:100%;object-fit:cover;display:block}",
  ".grok-image-frame.is-tile{width:64px;min-width:64px;height:64px;min-height:64px}",
  ".grok-image-frame.is-loading,.grok-image-frame.is-error{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}",
  ".grok-image-frame.is-error{background:var(--dsw-alias-interactive-bg-hover-danger);cursor:pointer;max-width:240px;padding:10px 12px}",
  ".grok-image-lightbox{position:fixed;inset:0;z-index:80;display:grid;place-items:center;background:color-mix(in srgb, var(--dsw-alias-bg-base) 72%, transparent);padding:24px}",
  ".grok-image-lightbox img{max-width:min(100vw - 48px, 1200px);max-height:min(100vh - 48px, 90vh);object-fit:contain;border-radius:12px;box-shadow:0 16px 48px color-mix(in srgb, #000 45%, transparent)}",
  ".grok-image-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}"
].join("");
if (typeof document !== "undefined") {
  let tag = document.querySelector(`style[data-plugin-css="${cssId}"]`);
  if (tag === null) {
    tag = document.createElement("style");
    tag.dataset.plugin = "dsh-grok-oauth";
    tag.dataset.pluginCss = cssId;
    document.head.appendChild(tag);
  }
  tag.textContent = css;
}
function firstLine(text) {
  const newline = text.indexOf("\n");
  return newline === -1 ? text : text.slice(0, newline);
}
function parseArgs(argsRaw) {
  try {
    const value = JSON.parse(argsRaw);
    return typeof value === "object" && value !== null && !Array.isArray(value) ? value : void 0;
  } catch {
    return void 0;
  }
}
function callArgsRaw(block) {
  return ("kind" in block ? block.call?.argsRaw : block.argsRaw) ?? "";
}
function imagesOf(block) {
  if (block == null || !("kind" in block) || !Array.isArray(block.content)) return [];
  const images = [];
  for (const item of block.content) {
    if (item?.type === "image" && item.attachment?.attachmentId) images.push(item.attachment);
  }
  return images;
}
function pathOf(block) {
  const args = parseArgs(callArgsRaw(block));
  if (typeof args?.path === "string" && args.path.trim() !== "") return args.path.trim();
  if (block == null || !("kind" in block) || !Array.isArray(block.content)) return void 0;
  for (const item of block.content) {
    if (item?.type !== "text" || typeof item.text !== "string") continue;
    const match = item.text.match(/<path>([^<]+)<\/path>/);
    if (match?.[1]?.trim()) return match[1].trim();
  }
  return void 0;
}
function promptOf(block) {
  const args = parseArgs(callArgsRaw(block));
  return typeof args?.prompt === "string" ? firstLine(args.prompt) : "";
}
function rowState(block) {
  if (block == null || !("kind" in block)) return "running";
  if (block.error?.code === "interrupted") return "stopped";
  if (block.isError) return "error";
  return "ok";
}
function singleFit(width, height) {
  if (width == null || height == null || width <= 0 || height <= 0) {
    return { width: 240, height: 240, objectPosition: "center" };
  }
  const natural = width / height;
  const ratio = Math.min(4, Math.max(0.25, natural));
  const box = ratio >= 1 ? { width: 240, height: 240 / ratio } : { width: 240 * ratio, height: 240 };
  const scale = Math.min(1, width / box.width, height / box.height);
  return {
    width: Math.max(1, Math.round(box.width * scale)),
    height: Math.max(1, Math.round(box.height * scale)),
    objectPosition: natural < 0.25 ? "center top" : natural > 4 ? "left center" : "center"
  };
}
function GrokImageThumb({
  attachment,
  loadImage,
  tile,
  t
}) {
  const [src, setSrc] = (0, import_react4.useState)(() => loadImage?.peek?.(attachment) ?? null);
  const [error, setError] = (0, import_react4.useState)(false);
  const [open, setOpen] = (0, import_react4.useState)(false);
  const [attempt, setAttempt] = (0, import_react4.useState)(0);
  const fit = (0, import_react4.useMemo)(
    () => tile ? void 0 : singleFit(attachment.width, attachment.height),
    [attachment.height, attachment.width, tile]
  );
  const name2 = typeof attachment.name === "string" && attachment.name !== "" ? attachment.name : t("imageRowTitle");
  (0, import_react4.useEffect)(() => {
    if (loadImage == null) {
      setError(true);
      return;
    }
    let live = true;
    setError(false);
    setSrc(loadImage.peek?.(attachment) ?? null);
    loadImage(attachment).then((url) => {
      if (live) setSrc(url);
    }).catch(() => {
      if (live) setError(true);
    });
    return () => {
      live = false;
    };
  }, [attachment, attempt, loadImage]);
  if (error) {
    return /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("button", { type: "button", className: "grok-image-frame is-error", onClick: () => setAttempt((n) => n + 1), children: t("imageRowLoadFailed") });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(import_jsx_runtime9.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
      "button",
      {
        type: "button",
        className: tile ? "grok-image-frame is-tile" : "grok-image-frame",
        style: fit === void 0 ? void 0 : { width: fit.width, height: fit.height },
        title: t("imageRowOpen"),
        "aria-label": formatTemplate(t("imageRowOpenNamed"), { name: name2 }),
        onClick: () => {
          if (src !== null) setOpen(true);
        },
        children: src === null ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "grok-image-frame is-loading", children: t("imageRowLoading") }) : /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("img", { src, alt: name2, style: fit === void 0 ? void 0 : { objectPosition: fit.objectPosition } })
      }
    ),
    open && src !== null ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(GrokImageLightbox, { src, alt: name2, closeLabel: t("imageRowLightboxClose"), onClose: () => setOpen(false) }) : null
  ] });
}
function GrokImageLightbox({
  src,
  alt,
  closeLabel,
  onClose
}) {
  (0, import_react4.useEffect)(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("button", { type: "button", className: "grok-image-lightbox", "aria-label": closeLabel, onClick: onClose, children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("img", { src, alt, onClick: (event) => event.stopPropagation() }) });
}
function GrokImageRow({
  block,
  openFile,
  loadImage,
  t
}) {
  const state = rowState(block);
  const images = imagesOf(block);
  const filePath = pathOf(block);
  const prompt = promptOf(block);
  const summary = state === "error" ? t("imageRowFailed") : state === "running" ? t("imageRowRunning") : prompt || filePath || t("imageRowTitle");
  const tile = images.length > 1;
  const openSaved = (0, import_react4.useCallback)(
    (event) => {
      event.stopPropagation();
      if (filePath !== void 0) openFile?.(filePath);
    },
    [filePath, openFile]
  );
  return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "grok-image-row", "data-tool": GROK_IMAGE_GEN_TOOL_NAME, "data-state": state, children: [
    state !== "ok" ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "grok-image-sr", children: state === "running" ? t("imageRowRunning") : t("imageRowFailed") }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "grok-image-row-head", children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "grok-image-row-lead", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(BrandMark, { size: 14 }) }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "grok-image-row-title", children: t("imageRowTitle") }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "grok-image-row-sep", "aria-hidden": "true" }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: state === "error" ? "grok-image-row-summary is-error" : "grok-image-row-summary", children: summary })
    ] }),
    images.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "grok-image-gallery", children: images.map((attachment, index) => /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
      GrokImageThumb,
      {
        attachment,
        loadImage,
        tile,
        t
      },
      `${attachment.attachmentId}:${index}`
    )) }) : null,
    filePath !== void 0 && openFile !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("button", { type: "button", className: "grok-image-row-path", onClick: openSaved, title: filePath, children: t("imageRowOpenFile") }) : null
  ] });
}
function registerGrokImageToolview(ctx, localeNamespace) {
  ctx.slots.inject(
    "tool.call.toolview",
    () => ctx.slots.register(
      {
        name: "tool.call.toolview",
        key: GROK_IMAGE_GEN_TOOL_NAME,
        locale: localeNamespace,
        inject: (sessionId) => {
          const ui = ctx.uiConversation;
          if (ui == null) return {};
          const loadImage = ((attachment) => ui.imageUrl(sessionId, attachment));
          loadImage.peek = (attachment) => ui.peekImageUrl(sessionId, attachment);
          return { loadImage };
        }
      },
      GrokImageRow
    )
  );
}

// src/client/components/GrokAuthSection.tsx
var import_jsx_runtime10 = require("react/jsx-runtime");
var GROK_AUTH_SECTION_ID = "grok-oauth-login";
var GROK_AUTH_ITEM_SLOT = "settings.grok.auth";
var GROK_AUTH_LOCALE_NS = "settings.grok-auth";
var grokAuthCopy = {
  zh: {
    nav: "Grok OAuth \u767B\u5F55",
    title: "Grok OAuth \u767B\u5F55",
    subtitle: "\u4F7F\u7528 xAI \u8BA2\u9605\u767B\u5F55 Grok\uFF0C\u5E76\u7BA1\u7406\u6A21\u578B\u3002"
  },
  en: {
    nav: "Grok OAuth Login",
    title: "Grok OAuth Login",
    subtitle: "Sign in to Grok with your xAI subscription and manage models."
  }
};
var pageStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 24,
  boxSizing: "border-box",
  width: "100%",
  padding: "32px 32px 48px"
};
var titleStyle2 = {
  margin: "0 0 4px",
  fontSize: 20,
  fontWeight: 600,
  lineHeight: "28px",
  color: "var(--dsw-alias-label-primary)"
};
var subtitleStyle = {
  margin: 0,
  fontSize: 14,
  lineHeight: "20px",
  color: "var(--dsw-alias-label-secondary)"
};
function duplicateSection(error) {
  return error instanceof Error && /already has|requires options/.test(error.message);
}
function GrokAuthSection(props) {
  const t = props.t ?? ((key) => key);
  const renderSlot = props.renderSlot;
  const node = renderSlot?.(GROK_AUTH_ITEM_SLOT, {}, { entryKey: GROK_SETTINGS_NAMESPACE });
  return /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { "data-grok-auth-section": GROK_AUTH_LOCALE_NS, style: pageStyle, children: [
    /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("header", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("h2", { style: titleStyle2, children: t("title") }),
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("p", { style: subtitleStyle, children: t("subtitle") })
    ] }),
    node == null ? null : node
  ] });
}

// src/client/index.tsx
var import_jsx_runtime11 = require("react/jsx-runtime");
var name = "dsh-llm-grok-client";
var inject = ["slots", "locale", "connection", "settingsScope", "uiConversation"];
function apply(ctx) {
  const localeNamespace = "settings.grok";
  ctx.effect(
    () => ctx.locale.register(localeNamespace, {
      zh,
      en
    }),
    "dsh-llm-grok: Plugin configuration copy"
  );
  const t = ctx.locale.bind(localeNamespace);
  const scope = ctx.settingsScope.bind({
    namespace: GROK_SETTINGS_NAMESPACE,
    decode: decodeGrokSettings
  });
  const picker = new GrokModelPickerController();
  const { rpc } = ctx.get("connection");
  const startAuth = async () => {
    const result = await rpc.call(GROK_RPC_CHANNEL, GROK_AUTH_START_ENDPOINT, {});
    if (!result.ok) {
      return {
        ok: false,
        retryable: true,
        message: result.error.message
      };
    }
    const decoded = decodeGrokAuthStartReply(result.value);
    if (decoded === void 0) {
      return {
        ok: false,
        retryable: true,
        message: t("signInFailed")
      };
    }
    return decoded;
  };
  const completeAuth = async (code) => {
    const result = await rpc.call(GROK_RPC_CHANNEL, GROK_AUTH_COMPLETE_ENDPOINT, { code });
    if (!result.ok) {
      return {
        ok: false,
        retryable: true,
        message: result.error.message
      };
    }
    const decoded = decodeGrokAuthStartReply(result.value);
    if (decoded === void 0) {
      return {
        ok: false,
        retryable: true,
        message: t("signInFailed")
      };
    }
    return decoded;
  };
  const readAuthStatus = async () => {
    const result = await rpc.call(GROK_RPC_CHANNEL, GROK_AUTH_STATUS_ENDPOINT, {});
    if (!result.ok) throw new Error(result.error.message);
    const decoded = decodeGrokAuthStatus(result.value);
    if (decoded === void 0) throw new Error(t("statusFailed"));
    return decoded;
  };
  const decodeAccountMutation = (value, fallback) => {
    const decoded = decodeGrokAuthLogoutReply(value);
    if (decoded === void 0) throw new Error(t(fallback));
    return decoded;
  };
  const logout = async (accountId) => {
    const result = await rpc.call(GROK_RPC_CHANNEL, GROK_AUTH_LOGOUT_ENDPOINT, accountId === void 0 ? {} : { accountId });
    if (!result.ok) throw new Error(result.error.message);
    return decodeAccountMutation(result.value, "signOutFailed");
  };
  const switchAccount = async (accountId) => {
    const result = await rpc.call(GROK_RPC_CHANNEL, GROK_AUTH_SWITCH_ENDPOINT, { accountId });
    if (!result.ok) {
      return {
        ok: false,
        retryable: true,
        message: result.error.message
      };
    }
    return decodeAccountMutation(result.value, "switchFailed");
  };
  const removeAccount = async (accountId) => {
    const result = await rpc.call(GROK_RPC_CHANNEL, GROK_AUTH_REMOVE_ENDPOINT, { accountId });
    if (!result.ok) {
      return {
        ok: false,
        retryable: true,
        message: result.error.message
      };
    }
    return decodeAccountMutation(result.value, "removeFailed");
  };
  const fetchModels = async () => {
    const result = await rpc.call(GROK_RPC_CHANNEL, GROK_MODELS_ENDPOINT, {});
    if (!result.ok) throw new Error(result.error.message);
    const decoded = decodeGrokModelsReply(result.value);
    if (decoded === void 0) throw new Error(t("statusFailed"));
    return decoded.models;
  };
  const fetchUsage = async () => {
    const result = await rpc.call(GROK_RPC_CHANNEL, GROK_USAGE_ENDPOINT, {});
    if (!result.ok) throw new Error(result.error.message);
    const decoded = decodeGrokUsageReply(result.value);
    if (decoded === void 0) throw new Error(t("usageFailed"));
    return decoded;
  };
  const fetchAllUsage = async () => {
    const result = await rpc.call(GROK_RPC_CHANNEL, GROK_USAGE_ALL_ENDPOINT, {});
    if (result.ok) {
      const decoded = decodeGrokAccountsUsageReply(result.value);
      if (decoded !== void 0) return decoded;
      throw new Error(t("usageFailed"));
    }
    const message = result.error?.message;
    if (typeof message === "string" && message.includes("unknown Grok endpoint")) {
      const single = await fetchUsage();
      if (single.status === "logged-out") {
        return {
          status: "logged-out",
          accounts: []
        };
      }
      if (single.status === "unsupported") {
        return {
          status: "ok",
          accounts: [
            {
              accountId: "active",
              active: true,
              status: "unsupported"
            }
          ]
        };
      }
      return {
        status: "ok",
        accounts: [
          {
            accountId: "active",
            active: true,
            status: "ok",
            usage: single.usage
          }
        ]
      };
    }
    throw new Error(typeof message === "string" && message.length > 0 ? message : t("usageFailed"));
  };
  setGrokUsageFetch(fetchUsage);
  loadGrokUsage(true);
  if (typeof document !== "undefined") document.addEventListener("visibilitychange", onGrokUsageVisibility);
  if (typeof window !== "undefined") window.addEventListener("focus", onGrokUsageFocus);
  const saveConfiguration = async (settings) => {
    const snapshot = scope.getSnapshot();
    if (snapshot.revision === void 0) throw new Error(t("requestFailed"));
    const saved = await rpc.call(GROK_RPC_CHANNEL, GROK_SAVE_ENDPOINT, {
      models: settings.models,
      enableImageGen: settings.enableImageGen,
      ...settings.serverSearch === void 0 ? {} : { serverSearch: settings.serverSearch },
      ...settings.proxy === void 0 ? {} : { proxy: settings.proxy },
      expectedRevision: snapshot.revision
    });
    if (!saved.ok) throw new Error(saved.error.message);
    const accepted = decodeGrokSaveResult(saved.value);
    if (accepted === void 0) throw new Error(t("requestFailed"));
    return accepted;
  };
  ctx.slots.inject(
    "shell.overlay",
    () => ctx.slots.register(
      {
        name: "shell.overlay",
        id: "grok-model-picker",
        order: 100,
        inject: () => ({
          t,
          hooks: { grokModelPicker: picker },
          closePicker: picker.close,
          togglePickerModel: picker.toggle,
          adoptPickerModels: picker.adopt
        })
      },
      GrokModelPicker
    )
  );
  const grokCardInject = () => ({
    t,
    hooks: { grokSettings: scope },
    startAuth,
    completeAuth,
    readAuthStatus,
    logout,
    switchAccount,
    removeAccount,
    fetchUsage,
    fetchAllUsage,
    fetchModels,
    saveConfiguration,
    beginModelPicker: (initiallyPicked, onAdopt) => {
      picker.begin(onAdopt, initiallyPicked);
    },
    completeModelPicker: (candidates) => {
      picker.complete(candidates);
    },
    failModelPicker: (message) => {
      picker.fail(message);
    },
    closeModelPicker: picker.close
  });
  const GROK_NAV_MARKER = "data-dsh-grok-settings-nav";
  const GROK_NAV_STYLE_ID = "dsh-grok-settings-nav-style";
  const GROK_SLASH_PATH = "M1.55 16.45 7.65 10.35a1.2 1.2 0 0 1 1.7 0L16.45 1.55 10.35 7.65a1.2 1.2 0 0 1-1.7 0z";
  const GROK_MASK_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 18 18'%3E%3Ccircle cx='9' cy='9' r='6.75' fill='none' stroke='black' stroke-width='2.2'/%3E%3Cpath fill='black' d='${GROK_SLASH_PATH}'/%3E%3C/svg%3E")`;
  function installGrokNavStyle() {
    if (typeof document === "undefined") return;
    if (document.getElementById(GROK_NAV_STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = GROK_NAV_STYLE_ID;
    style.textContent = `
    [${GROK_NAV_MARKER}] > svg:first-child {
      display: none !important;
    }
    [${GROK_NAV_MARKER}]::before {
      content: "" !important;
      flex: none !important;
      width: 16px !important;
      height: 16px !important;
      background: currentColor !important;
      -webkit-mask: ${GROK_MASK_SVG} center / contain no-repeat !important;
      mask: ${GROK_MASK_SVG} center / contain no-repeat !important;
    }
  `;
    document.head.appendChild(style);
  }
  function registerGrokSettingsNavIcon(getLabel) {
    if (typeof document === "undefined") return () => {
    };
    installGrokNavStyle();
    let disposed = false;
    const sync = () => {
      if (disposed) return;
      const buttons = document.querySelectorAll('[role="dialog"] nav button');
      const label = getLabel ? getLabel().trim() : "";
      for (const b of buttons) {
        const text = b.textContent ? b.textContent.trim() : "";
        const match = label.length > 0 && text === label || text === "Grok OAuth \u767B\u5F55" || text === "Grok OAuth Login";
        if (match) b.setAttribute(GROK_NAV_MARKER, "");
        else b.removeAttribute(GROK_NAV_MARKER);
      }
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });
    const onDocClick = () => {
      setTimeout(sync, 20);
      setTimeout(sync, 120);
    };
    document.addEventListener("click", onDocClick);
    return () => {
      disposed = true;
      observer.disconnect();
      document.removeEventListener("click", onDocClick);
      document.querySelectorAll(`[${GROK_NAV_MARKER}]`).forEach((el) => {
        el.removeAttribute(GROK_NAV_MARKER);
      });
    };
  }
  ctx.slots.inject("settings.section", () => {
    let disposeSection;
    let disposeLocale;
    const claim = () => {
      if (disposeSection !== void 0) return;
      disposeLocale ??= ctx.locale.register(GROK_AUTH_LOCALE_NS, grokAuthCopy);
      const t2 = ctx.locale.bind(GROK_AUTH_LOCALE_NS);
      try {
        disposeSection = ctx.slots.register(
          {
            name: "settings.section",
            id: GROK_AUTH_SECTION_ID,
            order: 11,
            label: () => t2("nav"),
            icon: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(BrandMark, { size: 14 }),
            locale: GROK_AUTH_LOCALE_NS,
            children: {
              [GROK_AUTH_ITEM_SLOT]: {
                kind: "keyed",
                scope: "root"
              }
            }
          },
          GrokAuthSection
        );
      } catch (error) {
        if (!duplicateSection(error)) throw error;
      }
    };
    claim();
    return () => {
      disposeSection?.();
      disposeSection = void 0;
      disposeLocale?.();
      disposeLocale = void 0;
    };
  });
  ctx.slots.inject(
    GROK_AUTH_ITEM_SLOT,
    () => ctx.slots.register(
      {
        name: GROK_AUTH_ITEM_SLOT,
        key: GROK_SETTINGS_NAMESPACE,
        locale: localeNamespace,
        inject: grokCardInject
      },
      GrokPluginCard
    )
  );
  registerGrokImageToolview(ctx, localeNamespace);
  ctx.slots.inject(
    "conversation.composer.dock",
    () => ctx.slots.register(
      {
        name: "conversation.composer.dock",
        id: "dsh-grok-oauth-usage",
        order: -8,
        label: () => t("usageWindowSuperGrok")
      },
      (props) => /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(GrokUsageChip, { ...props, seat: "dock", t })
    )
  );
  ctx.slots.inject(
    "conversation.input.dock",
    () => ctx.slots.register(
      {
        name: "conversation.input.dock",
        id: "dsh-grok-oauth-usage-hero",
        order: 52,
        label: () => t("usageWindowSuperGrok")
      },
      (props) => /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(GrokUsageChip, { ...props, seat: "hero", t })
    )
  );
  const cleanupGrokNavIcon = registerGrokSettingsNavIcon();
  ctx.effect(
    () => () => {
      cleanupGrokNavIcon();
      if (typeof document !== "undefined") document.removeEventListener("visibilitychange", onGrokUsageVisibility);
      if (typeof window !== "undefined") window.removeEventListener("focus", onGrokUsageFocus);
      grokUsageListeners.clear();
      setGrokUsageFetch(null);
    },
    "dsh-grok-oauth usage dock"
  );
}


		return module.exports;
	}
});
