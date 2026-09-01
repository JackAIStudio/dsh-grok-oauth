import { isRecord, type GrokCatalogModel, type GrokReasoningEffort, type GrokUsageReply, type GrokAccountsUsageReply, type GrokAccountUsageView } from "../common/contract.js";
import {
  DEFAULT_USAGE_REQUEST_TIMEOUT_MS,
  GROK_BILLING_URL,
  GROK_CATALOG,
  GROK_MODELS_URL,
  MAX_USAGE_BYTES
} from "../common/constants.js";
import { GROK_CLI_REQUEST_HEADERS, ensureFreshAccounts, type FullGrokAuthRuntime } from "./oauth.js";
import { activeAccountFrom, cloneSession, publicAccountId, type GrokSession } from "./session.js";

function asEffort(value: unknown): GrokReasoningEffort | undefined {
  if (!isRecord(value)) return undefined;
  const id = value["id"];
  const wire = value["value"];
  const label = value["label"];
  const description = value["description"];
  if (typeof id !== "string" || id.length === 0) return undefined;
  if (typeof wire !== "string" || wire.length === 0) return undefined;
  return {
    id,
    value: wire,
    ...(typeof label === "string" && label.length > 0 ? { label } : {}),
    ...(typeof description === "string" && description.length > 0 ? { description } : {})
  };
}

function asEfforts(value: unknown): GrokReasoningEffort[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const efforts: GrokReasoningEffort[] = [];
  const seen = new Set<string>();
  for (const entry of value) {
    const effort = asEffort(entry);
    if (effort === undefined || seen.has(effort.value)) continue;
    seen.add(effort.value);
    efforts.push(effort);
  }
  return efforts.length > 0 ? efforts : undefined;
}

function asModel(value: unknown): GrokCatalogModel | undefined {
  if (!isRecord(value)) return undefined;
  const id = value["id"];
  if (typeof id !== "string" || id.length === 0) return undefined;
  const name = value["name"];
  const thinking = value["supports_reasoning_effort"] === true || value["thinking"] === true;
  const defaultReasoningEffort = value["reasoning_effort"];
  const reasoningEfforts = asEfforts(value["reasoning_efforts"]);
  const contextWindow = value["context_window"] ?? value["contextWindow"];
  return {
    id,
    ...(typeof name === "string" && name.length > 0 ? { name } : {}),
    thinking,
    vision: true,
    ...(typeof contextWindow === "number" && Number.isInteger(contextWindow) && contextWindow > 0 ? { contextWindow } : {}),
    ...(thinking && typeof defaultReasoningEffort === "string" && defaultReasoningEffort.length > 0 ? { defaultReasoningEffort } : {}),
    ...(thinking && reasoningEfforts !== undefined ? { reasoningEfforts } : {})
  };
}

/**
 * Parse a models-v2 (or /v1/models) list body.
 */
export function parseGrokModels(value: unknown): GrokCatalogModel[] | undefined {
  if (!isRecord(value) || !Array.isArray(value["data"])) return undefined;
  const models: GrokCatalogModel[] = [];
  const seen = new Set<string>();
  for (const entry of value["data"]) {
    const model = asModel(entry);
    if (model === undefined || seen.has(model.id)) continue;
    seen.add(model.id);
    models.push(model);
  }
  return models.length > 0 ? models : undefined;
}

export async function readGrokModels(request: {
  accessToken: string;
  modelsURL?: string;
  fetch?: typeof fetch;
  signal?: AbortSignal;
}): Promise<GrokCatalogModel[] | undefined> {
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
      ...(request.signal === undefined ? {} : { signal: request.signal })
    });
    if (!response.ok) {
      await response.body?.cancel();
      return undefined;
    }
    return parseGrokModels(await response.json());
  } catch {
    return undefined;
  }
}

export function fallbackGrokCatalog(): GrokCatalogModel[] {
  return GROK_CATALOG.map((model) => ({ ...model }));
}

function redactSecrets(message: string, secrets: (string | undefined)[]): string {
  let next = message;
  for (const secret of secrets) {
    if (secret === undefined || secret.length === 0) continue;
    next = next.split(secret).join("[redacted]");
  }
  return next;
}

export function isoInstant(value: unknown): string | undefined {
  if (typeof value === "string" && value.length > 0) {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? new Date(parsed).toISOString() : undefined;
  }
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    const ms = value < 0xe8d4a51000 ? value * 1000 : value;
    const date = new Date(ms);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
  }
  return undefined;
}

export function parseWindow(value: unknown): any | undefined {
  if (!isRecord(value)) return undefined;
  const id = value["id"];
  const used = value["used"];
  const limit = value["limit"];
  const period = value["period"];
  const resetsAt = isoInstant(value["resetsAt"] ?? value["resetAt"] ?? value["reset_at"] ?? value["end"]);
  if (typeof id !== "string" || id.length === 0) return undefined;
  if (typeof used !== "number" || !Number.isFinite(used) || used < 0) return undefined;
  if (typeof limit !== "number" || !Number.isFinite(limit) || limit < 0) return undefined;
  if (period !== undefined && (typeof period !== "string" || period.length === 0)) return undefined;
  return {
    id,
    used,
    limit,
    ...(period === undefined ? {} : { period }),
    ...(resetsAt === undefined ? {} : { resetsAt })
  };
}

export function moneyVal(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) return value;
  if (!isRecord(value)) return undefined;
  const val = value["val"];
  if (typeof val !== "number" || !Number.isFinite(val) || val < 0) return undefined;
  return val;
}

export function periodFromConfig(config: Record<string, unknown>): string | undefined {
  const type = (isRecord(config["currentPeriod"]) ? config["currentPeriod"] : undefined)?.["type"];
  if (type === "USAGE_PERIOD_TYPE_WEEKLY") return "week";
  if (type === "USAGE_PERIOD_TYPE_MONTHLY") return "month";
  return undefined;
}

export function resetFromConfig(config: Record<string, unknown>): string | undefined {
  return isoInstant((isRecord(config["currentPeriod"]) ? config["currentPeriod"] : undefined)?.["end"] ?? config["billingPeriodEnd"]);
}

export function percentWindow(id: string, percent: number, period?: string, resetsAt?: string): any {
  return {
    id,
    used: Math.min(100, Math.max(0, Math.round(percent * 10) / 10)),
    limit: 100,
    unit: "percent",
    ...(period === undefined ? {} : { period }),
    ...(resetsAt === undefined ? {} : { resetsAt })
  };
}

export function isCreditsSurface(config: Record<string, unknown>): boolean {
  return isRecord(config["currentPeriod"]) || config["isUnifiedBillingUser"] === true;
}

export function parseCreditsConfig(config: Record<string, unknown>, fetchedAt: string): any | undefined {
  const period = periodFromConfig(config);
  const resetsAt = resetFromConfig(config);
  const products: any[] = [];
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
  const windows: any[] = [];
  const reportedTotal = config["creditUsagePercent"];
  const totalPercent =
    typeof reportedTotal === "number" && Number.isFinite(reportedTotal)
      ? reportedTotal
      : products.length > 0
      ? products.reduce((sum, item) => sum + item.used, 0)
      : isCreditsSurface(config)
      ? 0
      : undefined;
  if (totalPercent !== undefined) windows.push(percentWindow("SuperGrok", totalPercent, period, resetsAt));
  windows.push(...products);
  return windows.length === 0 ? undefined : {
    fetchedAt,
    windows
  };
}

export function parsePrepaidConfig(config: Record<string, unknown>, fetchedAt: string): any | undefined {
  const used = moneyVal(config["used"]);
  const limit = moneyVal(config["monthlyLimit"]);
  if (used === undefined || limit === undefined) return undefined;
  if (used === 0 && limit === 0) return undefined;
  const period = periodFromConfig(config);
  const resetsAt = resetFromConfig(config);
  return {
    fetchedAt,
    windows: [
      {
        id: "monthly",
        used,
        limit,
        ...(period === undefined ? {} : { period }),
        ...(resetsAt === undefined ? {} : { resetsAt })
      }
    ]
  };
}

export function parseCliBillingConfig(value: unknown, fetchedAt: string): any | undefined {
  if (!isRecord(value)) return undefined;
  const config = value["config"];
  if (!isRecord(config)) return undefined;
  return parseCreditsConfig(config, fetchedAt) ?? parsePrepaidConfig(config, fetchedAt);
}

export function parseGrokBilling(value: unknown, fetchedAt: string): any | undefined {
  const fromConfig = parseCliBillingConfig(value, fetchedAt);
  if (fromConfig !== undefined) return fromConfig;
  const windowsValue = isRecord(value) ? value.windows : undefined;
  if (!Array.isArray(windowsValue)) return undefined;
  const windows: any[] = [];
  for (const entry of windowsValue) {
    const window = parseWindow(entry);
    if (window !== undefined) windows.push(window);
  }
  if (windows.length === 0) return undefined;
  return {
    fetchedAt,
    windows
  };
}

export async function readGrokUsage(request: {
  accessToken: string;
  billingURL?: string;
  fetch?: typeof fetch;
  now?: () => number;
  signal?: AbortSignal;
}): Promise<GrokUsageReply> {
  const url = request.billingURL ?? GROK_BILLING_URL;
  const fetchImpl = request.fetch ?? fetch;
  const fetchedAt = new Date((request.now ?? Date.now)()).toISOString();
  const timeout = AbortSignal.timeout(DEFAULT_USAGE_REQUEST_TIMEOUT_MS);
  const signal = request.signal === undefined ? timeout : AbortSignal.any([request.signal, timeout]);
  const secrets = [request.accessToken];
  let response: Response;
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
  } catch (error: any) {
    if (request.signal?.aborted === true) throw new Error(redactSecrets("Grok usage read aborted by caller", secrets));
    const detail = error instanceof Error && error.message.length > 0 ? `: ${error.message}` : "";
    throw new Error(redactSecrets(`could not reach ${url}${detail}`, secrets));
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
    throw new Error(redactSecrets(`${url} answered ${String(response.status)}`, secrets));
  }
  const declared = Number(response.headers.get("content-length") ?? NaN);
  if (Number.isFinite(declared) && declared > MAX_USAGE_BYTES) {
    await response.body?.cancel();
    throw new Error(redactSecrets(`${url} answered with more than ${String(MAX_USAGE_BYTES)} bytes`, secrets));
  }
  let text: string;
  try {
    text = await response.text();
  } catch (error: any) {
    const detail = error instanceof Error && error.message.length > 0 ? `: ${error.message}` : "";
    throw new Error(redactSecrets(`${url} could not be read${detail}`, secrets));
  }
  if (text.length > MAX_USAGE_BYTES) {
    throw new Error(redactSecrets(`${url} answered with more than ${String(MAX_USAGE_BYTES)} bytes`, secrets));
  }
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return { status: "unsupported" };
  }
  const usage = parseGrokBilling(body, fetchedAt);
  return usage === undefined ? { status: "unsupported" } : {
    status: "ok",
    usage
  };
}

function accountUsageFailure(error: unknown, session: GrokSession, active: boolean): GrokAccountUsageView {
  const secrets = [session.accessToken, session.refreshToken];
  let message = error instanceof Error && error.message.length > 0 ? error.message : "Grok usage read failed";
  for (const secret of secrets) {
    if (!secret || secret.length === 0) continue;
    message = message.split(secret).join("[redacted]");
  }
  return {
    accountId: publicAccountId(session),
    ...(session.email === undefined ? {} : { email: session.email }),
    active,
    status: "error",
    message
  };
}

export async function readAllAccountUsage(
  runtime: FullGrokAuthRuntime,
  options?: { billingURL?: string },
  signal?: AbortSignal
): Promise<GrokAccountsUsageReply> {
  const store = await ensureFreshAccounts(runtime);
  if (store.accounts.length === 0) {
    return {
      status: "logged-out",
      accounts: []
    };
  }
  const active = activeAccountFrom(store);
  const activeId = active === undefined ? undefined : publicAccountId(active);
  const accounts = await Promise.all(
    store.accounts.map(async (session) => {
      const accountId = publicAccountId(session);
      const activeAccount = accountId === activeId;
      const base = {
        accountId,
        ...(session.email === undefined ? {} : { email: session.email }),
        active: activeAccount
      };
      try {
        const result = await readGrokUsage({
          accessToken: session.accessToken,
          ...(options?.billingURL === undefined ? {} : { billingURL: options.billingURL }),
          fetch: runtime.fetch,
          now: runtime.now,
          signal
        });
        if (result.status === "unsupported" || result.status === "logged-out") {
          return {
            ...base,
            status: "unsupported" as const
          };
        }
        return {
          ...base,
          status: "ok" as const,
          usage: (result as any).usage
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
