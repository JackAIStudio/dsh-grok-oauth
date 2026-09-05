import {
  decodeGrokAccountIdRequest,
  decodeGrokAuthCompleteRequest,
  decodeGrokEmptyRequest,
  decodeGrokSaveRequest,
  decodeGrokSettings,
  type GrokSaveResult
} from "../common/contract.js";
const deepEqualJson = (a: any, b: any) => JSON.stringify(a) === JSON.stringify(b);
const settingsNamespace = (ns: string) => ns as any;
import { GROK_SETTINGS_NAMESPACE } from "../common/constants.js";
import {
  completePkceLogin,
  ensureFreshAccounts,
  ensureFreshSession,
  removeRuntimeAccount,
  startPkceLogin,
  statusFromRuntime,
  switchRuntimeAccount,
  type FullGrokAuthRuntime
} from "./oauth.js";
import { findAccountIndex } from "./session.js";
import { fallbackGrokCatalog, readAllAccountUsage, readGrokModels, readGrokUsage } from "./billing.js";

const NS = settingsNamespace(GROK_SETTINGS_NAMESPACE);

export function internalError(message: string): { ok: false; error: { code: string; message: string; details: Record<string, never> } } {
  return {
    ok: false,
    error: {
      code: "internal",
      message,
      details: {}
    }
  };
}

export function usageFailure(error: unknown, secrets: string[]) {
  let message = error instanceof Error && error.message.length > 0 ? error.message : "Grok usage read failed";
  for (const secret of secrets) {
    if (secret.length === 0) continue;
    message = message.split(secret).join("[redacted]");
  }
  return internalError(message);
}

export function createGrokRpcHandler(runtime: FullGrokAuthRuntime, options?: { modelsURL?: string; billingURL?: string }) {
  return async (endpoint: string, payload: unknown, signal?: AbortSignal): Promise<any> => {
    if (endpoint === "auth/start") {
      if (decodeGrokEmptyRequest(payload) === undefined) return internalError("invalid Grok auth start request");
      return {
        ok: true,
        value: await startPkceLogin(runtime, signal)
      };
    }
    if (endpoint === "auth/status") {
      if (decodeGrokEmptyRequest(payload) === undefined) return internalError("invalid Grok auth status request");
      return {
        ok: true,
        value: await statusFromRuntime(runtime)
      };
    }
    if (endpoint === "auth/logout") {
      const request = decodeGrokAccountIdRequest(payload);
      if (request === undefined) return internalError("invalid Grok auth logout request");
      return {
        ok: true,
        value: await removeRuntimeAccount(runtime, request.accountId)
      };
    }
    if (endpoint === "auth/switch") {
      const request = decodeGrokAccountIdRequest(payload);
      if (request === undefined || request.accountId === undefined) return internalError("invalid Grok auth switch request");
      return {
        ok: true,
        value: await switchRuntimeAccount(runtime, request.accountId)
      };
    }
    if (endpoint === "auth/remove") {
      const request = decodeGrokAccountIdRequest(payload);
      if (request === undefined || request.accountId === undefined) return internalError("invalid Grok auth remove request");
      return {
        ok: true,
        value: await removeRuntimeAccount(runtime, request.accountId)
      };
    }
    if (endpoint === "auth/complete") {
      const request = decodeGrokAuthCompleteRequest(payload);
      if (request === undefined) return internalError("invalid Grok auth complete request");
      return {
        ok: true,
        value: await completePkceLogin(runtime, request.code)
      };
    }
    if (endpoint === "models/list") {
      if (decodeGrokEmptyRequest(payload) === undefined) return internalError("invalid Grok models request");
      const session = await ensureFreshSession(runtime);
      if (session === undefined) {
        return {
          ok: true,
          value: { models: fallbackGrokCatalog() }
        };
      }
      return {
        ok: true,
        value: {
          models:
            (await readGrokModels({
              accessToken: session.accessToken,
              ...(options?.modelsURL === undefined ? {} : { modelsURL: options.modelsURL }),
              fetch: runtime.fetch,
              signal
            })) ?? fallbackGrokCatalog()
        }
      };
    }
    if (endpoint === "usage/read") {
      const request = decodeGrokAccountIdRequest(payload);
      if (request === undefined) return internalError("invalid Grok usage request");
      let session;
      if (request.accountId === undefined) {
        session = await ensureFreshSession(runtime);
      } else {
        const store = await ensureFreshAccounts(runtime);
        const index = findAccountIndex(store, request.accountId);
        if (index < 0) return internalError("That Grok account is not saved on this machine.");
        session = store.accounts[index];
      }
      if (session === undefined) {
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
            ...(options?.billingURL === undefined ? {} : { billingURL: options.billingURL }),
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
      if (decodeGrokEmptyRequest(payload) === undefined) return internalError("invalid Grok usage request");
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

export async function saveDisplayedCatalog(ctx: any, payload: unknown): Promise<{ ok: true; value: GrokSaveResult } | { ok: false; error: any }> {
  const request = decodeGrokSaveRequest(payload);
  if (request === undefined) return internalError("invalid Grok settings request");
  const settings = ctx.get("settings");
  if (settings === undefined) return internalError("Grok settings are unavailable");
  try {
    const before = settings.describe().find((descriptor: any) => descriptor.ns === NS);
    if (before === undefined) return internalError("Grok settings are unavailable");
    const current = decodeGrokSettings(before.value);
    if (current === undefined) return internalError("Grok settings are invalid");
    const ops: any[] = [];
    if (!deepEqualJson(current.models, request.models)) {
      ops.push({
        op: "set",
        path: ["models"],
        value: request.models
      });
    }
    if (request.enableImageGen !== undefined && current.enableImageGen !== request.enableImageGen) {
      ops.push({
        op: "set",
        path: ["enableImageGen"],
        value: request.enableImageGen
      });
    }
    if (request.serverSearch !== undefined && current.serverSearch !== request.serverSearch) {
      ops.push({
        op: "set",
        path: ["serverSearch"],
        value: request.serverSearch
      });
    }
    if (request.proxy !== undefined && current.proxy !== request.proxy) {
      ops.push({
        op: "set",
        path: ["proxy"],
        value: request.proxy
      });
    }
    if (ops.length > 0) await settings.mutate(NS, ops, request.expectedRevision);
    const accepted = settings.describe().find((descriptor: any) => descriptor.ns === NS);
    const acceptedSettings = decodeGrokSettings(accepted?.value);
    if (accepted === undefined || acceptedSettings === undefined) {
      return internalError("Grok settings could not be reloaded");
    }
    return {
      ok: true,
      value: {
        settings: acceptedSettings,
        revision: accepted.revision
      }
    };
  } catch (error: any) {
    return internalError(error instanceof Error && error.message.length > 0 ? error.message : "Grok settings save failed");
  }
}
