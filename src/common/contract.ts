import { GROK_CATALOG } from "./constants.js";

export interface GrokReasoningEffort {
  id: string;
  value: string;
  label?: string;
  description?: string;
}

export interface GrokCatalogModel {
  id: string;
  name?: string;
  thinking?: boolean;
  vision?: boolean;
  contextWindow?: number;
  defaultReasoningEffort?: string;
  reasoningEfforts?: readonly GrokReasoningEffort[] | GrokReasoningEffort[];
}

export interface GrokSettings {
  streamIdleTimeoutMs: number;
  models: GrokCatalogModel[];
  enableImageGen: boolean;
  serverSearch?: boolean;
  proxy?: string;
}

export interface GrokAuthAccountView {
  id: string;
  email?: string;
  expiresAt?: string;
  active: boolean;
}

export interface GrokAuthStatus {
  loggedIn: boolean;
  email?: string;
  expiresAt?: string;
  activeAccountId?: string;
  accounts?: GrokAuthAccountView[];
}

export type GrokAuthStartReply =
  | { ok: true; reused?: boolean; email?: string; accountId?: string }
  | { ok: false; retryable: true; message: string };

export type GrokAuthLogoutReply =
  | { ok: true; status?: GrokAuthStatus }
  | { ok: false; retryable: true; message: string };

export interface GrokUsageWindow {
  id: string;
  used: number;
  limit: number;
  period?: string;
  unit?: "percent";
  resetsAt?: string;
}

export interface GrokUsageView {
  fetchedAt: string;
  windows: GrokUsageWindow[];
}

export type GrokUsageReply =
  | { status: "unsupported" }
  | { status: "logged-out" }
  | { status: "ok"; usage: GrokUsageView };

export interface GrokAccountUsageView {
  accountId: string;
  email?: string;
  active: boolean;
  status: "unsupported" | "error" | "ok";
  message?: string;
  usage?: GrokUsageView;
}

export interface GrokAccountsUsageReply {
  status: "logged-out" | "ok";
  accounts: GrokAccountUsageView[];
}

export interface GrokModelsReply {
  models: GrokCatalogModel[];
}

export interface GrokSaveRequest {
  models: GrokCatalogModel[];
  expectedRevision: number;
  enableImageGen?: boolean;
  serverSearch?: boolean;
  proxy?: string;
}

export interface GrokSaveResult {
  settings: GrokSettings;
  revision: number;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const TOKEN_FIELD = /^(?:accessToken|refreshToken|access_token|refresh_token|id_token|idToken|token)$/iu;

export function hasTokenFields(value: Record<string, unknown>): boolean {
  return Object.keys(value).some((key) => TOKEN_FIELD.test(key));
}

export function optionalNonEmptyString(value: unknown): value is string | undefined {
  return value === undefined || (typeof value === "string" && value.length > 0);
}

export function decodeGrokReasoningEffort(value: unknown): GrokReasoningEffort | undefined {
  if (!isRecord(value) || hasTokenFields(value)) return undefined;
  const id = value["id"];
  const wire = value["value"];
  const label = value["label"];
  const description = value["description"];
  if (typeof id !== "string" || id.length === 0) return undefined;
  if (typeof wire !== "string" || wire.length === 0) return undefined;
  if (label !== undefined && (typeof label !== "string" || label.length === 0)) return undefined;
  if (description !== undefined && (typeof description !== "string" || description.length === 0)) return undefined;
  return {
    id,
    value: wire,
    ...(typeof label === "string" ? { label } : {}),
    ...(typeof description === "string" ? { description } : {})
  };
}

export function decodeGrokCatalogModel(value: unknown): GrokCatalogModel | undefined {
  if (!isRecord(value) || hasTokenFields(value)) return undefined;
  const id = value["id"];
  const name = value["name"];
  const thinking = value["thinking"];
  const vision = value["vision"];
  const contextWindow = value["contextWindow"];
  const defaultReasoningEffort = value["defaultReasoningEffort"];
  const reasoningEffortsValue = value["reasoningEfforts"];
  if (typeof id !== "string" || id.length === 0) return undefined;
  if (name !== undefined && (typeof name !== "string" || name.length === 0)) return undefined;
  if (thinking !== undefined && typeof thinking !== "boolean") return undefined;
  if (vision !== undefined && typeof vision !== "boolean") return undefined;
  if (contextWindow !== undefined && (typeof contextWindow !== "number" || !Number.isInteger(contextWindow) || contextWindow <= 0)) return undefined;
  if (defaultReasoningEffort !== undefined && (typeof defaultReasoningEffort !== "string" || defaultReasoningEffort.length === 0)) return undefined;
  let reasoningEfforts: GrokReasoningEffort[] | undefined;
  if (reasoningEffortsValue !== undefined) {
    if (!Array.isArray(reasoningEffortsValue)) return undefined;
    reasoningEfforts = [];
    for (const entry of reasoningEffortsValue) {
      const effort = decodeGrokReasoningEffort(entry);
      if (effort === undefined) return undefined;
      reasoningEfforts.push(effort);
    }
  }
  return {
    id,
    ...(typeof name === "string" ? { name } : {}),
    ...(typeof thinking === "boolean" ? { thinking } : {}),
    ...(typeof vision === "boolean" ? { vision } : {}),
    ...(typeof contextWindow === "number" ? { contextWindow } : {}),
    ...(typeof defaultReasoningEffort === "string" ? { defaultReasoningEffort } : {}),
    ...(reasoningEfforts !== undefined ? { reasoningEfforts } : {})
  };
}

export function decodeGrokSettings(value: unknown): GrokSettings | undefined {
  if (!isRecord(value)) return undefined;
  const streamIdleTimeoutMs = value["streamIdleTimeoutMs"];
  if (typeof streamIdleTimeoutMs !== "number" || !Number.isFinite(streamIdleTimeoutMs) || streamIdleTimeoutMs <= 0) return undefined;
  const modelsValue = value["models"];
  const enableImageGen = value["enableImageGen"] === true;
  const serverSearch = value["serverSearch"];
  if (serverSearch !== undefined && typeof serverSearch !== "boolean") return undefined;
  const proxy = value["proxy"];
  if (proxy !== undefined && typeof proxy !== "string") return undefined;
  if (modelsValue === undefined) {
    return {
      streamIdleTimeoutMs,
      models: GROK_CATALOG.map((model) => ({ ...model })),
      enableImageGen,
      ...(typeof serverSearch === "boolean" ? { serverSearch } : {}),
      ...(typeof proxy === "string" ? { proxy } : {})
    };
  }
  if (!Array.isArray(modelsValue)) return undefined;
  const models: GrokCatalogModel[] = [];
  for (const entry of modelsValue) {
    const model = decodeGrokCatalogModel(entry);
    if (model === undefined) return undefined;
    models.push(model);
  }
  return {
    streamIdleTimeoutMs,
    models,
    enableImageGen,
    ...(typeof serverSearch === "boolean" ? { serverSearch } : {}),
    ...(typeof proxy === "string" ? { proxy } : {})
  };
}

export function decodeGrokAuthAccountView(value: unknown): GrokAuthAccountView | undefined {
  if (!isRecord(value) || hasTokenFields(value)) return undefined;
  const id = value["id"];
  const email = value["email"];
  const expiresAt = value["expiresAt"];
  const active = value["active"];
  if (typeof id !== "string" || id.length === 0) return undefined;
  if (!optionalNonEmptyString(email) || !optionalNonEmptyString(expiresAt)) return undefined;
  if (active !== undefined && typeof active !== "boolean") return undefined;
  return {
    id,
    ...(email === undefined ? {} : { email }),
    ...(expiresAt === undefined ? {} : { expiresAt }),
    active: active === true
  };
}

export function decodeGrokAuthStartReply(value: unknown): GrokAuthStartReply | undefined {
  if (!isRecord(value) || hasTokenFields(value) || typeof value["ok"] !== "boolean") return undefined;
  if (value["ok"] === true) {
    const reused = value["reused"];
    const email = value["email"];
    const accountId = value["accountId"];
    if (reused !== undefined && typeof reused !== "boolean") return undefined;
    if (!optionalNonEmptyString(email) || !optionalNonEmptyString(accountId)) return undefined;
    return {
      ok: true,
      ...(reused === true ? { reused: true } : {}),
      ...(email === undefined ? {} : { email }),
      ...(accountId === undefined ? {} : { accountId })
    };
  }
  if (value["retryable"] !== true || typeof value["message"] !== "string" || value["message"].length === 0) return undefined;
  return {
    ok: false,
    retryable: true,
    message: value["message"]
  };
}

export function decodeGrokAuthStatus(value: unknown): GrokAuthStatus | undefined {
  if (!isRecord(value) || hasTokenFields(value) || typeof value["loggedIn"] !== "boolean") return undefined;
  const email = value["email"];
  const expiresAt = value["expiresAt"];
  const activeAccountId = value["activeAccountId"];
  if (!optionalNonEmptyString(email) || !optionalNonEmptyString(expiresAt) || !optionalNonEmptyString(activeAccountId)) return undefined;
  const accounts: GrokAuthAccountView[] = [];
  const accountsValue = value["accounts"];
  if (accountsValue !== undefined) {
    if (!Array.isArray(accountsValue)) return undefined;
    for (const entry of accountsValue) {
      const account = decodeGrokAuthAccountView(entry);
      if (account === undefined) return undefined;
      accounts.push(account);
    }
  }
  return {
    loggedIn: value["loggedIn"],
    ...(email === undefined ? {} : { email }),
    ...(expiresAt === undefined ? {} : { expiresAt }),
    ...(activeAccountId === undefined ? {} : { activeAccountId }),
    accounts
  };
}

export function decodeGrokAuthLogoutReply(value: unknown): GrokAuthLogoutReply | undefined {
  if (!isRecord(value) || hasTokenFields(value) || typeof value["ok"] !== "boolean") return undefined;
  if (value["ok"] !== true) {
    if (value["retryable"] !== true || typeof value["message"] !== "string" || value["message"].length === 0) return undefined;
    return {
      ok: false,
      retryable: true,
      message: value["message"]
    };
  }
  const status = value["status"] === undefined ? undefined : decodeGrokAuthStatus(value["status"]);
  if (value["status"] !== undefined && status === undefined) return undefined;
  return {
    ok: true,
    ...(status === undefined ? {} : { status })
  };
}

export function decodeGrokUsageWindow(value: unknown): GrokUsageWindow | undefined {
  if (!isRecord(value) || hasTokenFields(value)) return undefined;
  const id = value["id"];
  const used = value["used"];
  const limit = value["limit"];
  const period = value["period"];
  const unit = value["unit"];
  const resetsAt = value["resetsAt"];
  if (typeof id !== "string" || id.length === 0) return undefined;
  if (typeof used !== "number" || !Number.isFinite(used) || used < 0) return undefined;
  if (typeof limit !== "number" || !Number.isFinite(limit) || limit < 0) return undefined;
  if (!optionalNonEmptyString(period)) return undefined;
  if (unit !== undefined && unit !== "percent") return undefined;
  if (!optionalNonEmptyString(resetsAt)) return undefined;
  return {
    id,
    used,
    limit,
    ...(typeof period === "string" ? { period } : {}),
    ...(unit === "percent" ? { unit: "percent" as const } : {}),
    ...(typeof resetsAt === "string" ? { resetsAt } : {})
  };
}

export function decodeGrokUsageView(value: unknown): GrokUsageView | undefined {
  if (!isRecord(value) || hasTokenFields(value)) return undefined;
  if (typeof value["fetchedAt"] !== "string" || value["fetchedAt"].length === 0) return undefined;
  if (!Array.isArray(value["windows"]) || value["windows"].length === 0) return undefined;
  const windows: GrokUsageWindow[] = [];
  for (const entry of value["windows"]) {
    const decoded = decodeGrokUsageWindow(entry);
    if (decoded === undefined) return undefined;
    windows.push(decoded);
  }
  return {
    fetchedAt: value["fetchedAt"],
    windows
  };
}

export function decodeGrokUsageReply(value: unknown): GrokUsageReply | undefined {
  if (!isRecord(value) || hasTokenFields(value)) return undefined;
  if (value["status"] === "unsupported") return { status: "unsupported" };
  if (value["status"] === "logged-out") return { status: "logged-out" };
  if (value["status"] !== "ok") return undefined;
  const usage = decodeGrokUsageView(value["usage"]);
  return usage === undefined ? undefined : {
    status: "ok",
    usage
  };
}

export function decodeGrokAccountUsageView(value: unknown): GrokAccountUsageView | undefined {
  if (!isRecord(value) || hasTokenFields(value)) return undefined;
  const accountId = value["accountId"];
  const email = value["email"];
  const active = value["active"];
  const status = value["status"];
  if (typeof accountId !== "string" || accountId.length === 0) return undefined;
  if (!optionalNonEmptyString(email)) return undefined;
  if (typeof active !== "boolean") return undefined;
  if (status === "unsupported") {
    return {
      accountId,
      ...(email === undefined ? {} : { email }),
      active,
      status: "unsupported"
    };
  }
  if (status === "error") {
    const message = value["message"];
    if (typeof message !== "string" || message.length === 0) return undefined;
    return {
      accountId,
      ...(email === undefined ? {} : { email }),
      active,
      status: "error",
      message
    };
  }
  if (status !== "ok") return undefined;
  const usage = decodeGrokUsageView(value["usage"]);
  return usage === undefined ? undefined : {
    accountId,
    ...(email === undefined ? {} : { email }),
    active,
    status: "ok",
    usage
  };
}

export function decodeGrokAccountsUsageReply(value: unknown): GrokAccountsUsageReply | undefined {
  if (!isRecord(value) || hasTokenFields(value)) return undefined;
  if (value["status"] === "logged-out") {
    return {
      status: "logged-out",
      accounts: []
    };
  }
  if (value["status"] !== "ok" || !Array.isArray(value["accounts"])) return undefined;
  const accounts: GrokAccountUsageView[] = [];
  for (const entry of value["accounts"]) {
    const decoded = decodeGrokAccountUsageView(entry);
    if (decoded === undefined) return undefined;
    accounts.push(decoded);
  }
  return {
    status: "ok",
    accounts
  };
}

export function decodeGrokModelsReply(value: unknown): GrokModelsReply | undefined {
  if (!isRecord(value) || hasTokenFields(value) || !Array.isArray(value["models"])) return undefined;
  const models: GrokCatalogModel[] = [];
  for (const entry of value["models"]) {
    const model = decodeGrokCatalogModel(entry);
    if (model === undefined) return undefined;
    models.push(model);
  }
  return { models };
}

export function decodeGrokSaveRequest(value: unknown): GrokSaveRequest | undefined {
  if (!isRecord(value) || hasTokenFields(value)) return undefined;
  const expectedRevision = value["expectedRevision"];
  if (!Array.isArray(value["models"]) || typeof expectedRevision !== "number" || !Number.isSafeInteger(expectedRevision)) return undefined;
  if (value["enableImageGen"] !== undefined && typeof value["enableImageGen"] !== "boolean") return undefined;
  const serverSearch = value["serverSearch"];
  if (serverSearch !== undefined && typeof serverSearch !== "boolean") return undefined;
  const proxy = value["proxy"];
  if (proxy !== undefined && typeof proxy !== "string") return undefined;
  const models: GrokCatalogModel[] = [];
  for (const entry of value["models"]) {
    const model = decodeGrokCatalogModel(entry);
    if (model === undefined) return undefined;
    models.push(model);
  }
  return {
    models,
    expectedRevision,
    ...(typeof value["enableImageGen"] === "boolean" ? { enableImageGen: value["enableImageGen"] } : {}),
    ...(typeof serverSearch === "boolean" ? { serverSearch } : {}),
    ...(typeof proxy === "string" ? { proxy } : {})
  };
}

export function decodeGrokSaveResult(value: unknown): GrokSaveResult | undefined {
  if (!isRecord(value) || hasTokenFields(value)) return undefined;
  const revision = value["revision"];
  if (typeof revision !== "number" || !Number.isSafeInteger(revision)) return undefined;
  const settings = decodeGrokSettings(value["settings"]);
  return settings === undefined ? undefined : {
    settings,
    revision
  };
}

export function decodeGrokAuthCompleteRequest(value: unknown): { code: string } | undefined {
  if (!isRecord(value) || hasTokenFields(value)) return undefined;
  const code = value["code"];
  if (typeof code !== "string" || code.trim().length === 0) return undefined;
  return { code: code.trim() };
}

export function decodeGrokEmptyRequest(value: unknown): Record<string, never> | undefined {
  if (value === undefined || value === null) return {};
  if (!isRecord(value) || hasTokenFields(value)) return undefined;
  return {};
}

export function decodeGrokAccountIdRequest(value: unknown): { accountId?: string } | undefined {
  if (value === undefined || value === null) return {};
  if (!isRecord(value) || hasTokenFields(value)) return undefined;
  const accountId = value["accountId"] ?? value["id"];
  if (accountId === undefined) return {};
  if (typeof accountId !== "string" || accountId.trim().length === 0) return undefined;
  return { accountId: accountId.trim() };
}
