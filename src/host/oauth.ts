import { createHash, randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { isRecord, type GrokAuthLogoutReply, type GrokAuthStartReply, type GrokAuthStatus } from "../common/contract.js";
import {
  GROK_OAUTH_CLIENT_ID,
  GROK_OAUTH_ISSUER,
  GROK_OAUTH_SCOPE,
  GROK_OAUTH_TIMEOUT_MS,
  GROK_OAUTH_REFRESH_SKEW_MS,
  GROK_OAUTH_AUTHORIZE_PATH,
  GROK_OAUTH_TOKEN_PATH
} from "../common/constants.js";
import {
  activeAccountFrom,
  cloneSession,
  deleteSession,
  emptyStore,
  publicAccountId,
  readSessionStore,
  removeAccount,
  sameAccount,
  statusFromStore,
  switchActiveAccount,
  upsertAccount,
  withActiveAccount,
  writeSessionStore,
  accountKeyOf
} from "./session.js";
import { authNetworkHint, authRejectionHint } from "./proxy.js";
import { closeServer, listenLoopback, waitForCallback } from "./loopback.js";
import type { GrokAuthRuntime, GrokSession, GrokSessionStore } from "./types.js";

export function retryable(message: string): { ok: false; retryable: true; message: string } {
  return {
    ok: false,
    retryable: true,
    message
  };
}

export function randomUrlSafe(bytes: number): string {
  return randomBytes(bytes).toString("base64url");
}

export function createPkcePair(): { verifier: string; challenge: string; state: string } {
  const verifier = randomUrlSafe(32);
  return {
    verifier,
    challenge: createHash("sha256").update(verifier).digest("base64url"),
    state: randomUrlSafe(16)
  };
}

export function decodeJwtPayload(token: string): Record<string, unknown> | undefined {
  const parts = token.split(".");
  const payload = parts[1];
  if (parts.length < 2 || payload === undefined) return undefined;
  try {
    const json = Buffer.from(payload, "base64url").toString("utf8");
    const value = JSON.parse(json);
    return isRecord(value) ? value : undefined;
  } catch {
    return undefined;
  }
}

export function joinUrl(issuer: string, path: string): string {
  return `${issuer.replace(/\/+$/u, "")}${path}`;
}

export interface OidcEndpoints {
  authorizationEndpoint: string;
  tokenEndpoint: string;
  userinfoEndpoint?: string;
}

export async function discoverOidcEndpoints(issuer: string, fetchImpl: typeof fetch = fetch): Promise<OidcEndpoints> {
  const fallback: OidcEndpoints = {
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
      ...(typeof userinfoEndpoint === "string" && userinfoEndpoint.length > 0 ? { userinfoEndpoint } : {})
    };
  } catch {
    return fallback;
  }
}

export function spawnDetached(command: string, args: string[]): Promise<void> {
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

export async function openSystemBrowser(url: string): Promise<void> {
  if (!/^https?:\/\//u.test(url)) throw new Error("refusing to open a non-http url");
  const platform = typeof process !== "undefined" ? process.platform : "";
  const commands: [string, string[]][] =
    platform === "darwin"
      ? [["open", [url]]]
      : platform === "win32"
      ? [["cmd", ["/c", "start", '""', url]]]
      : [
          ["xdg-open", [url]],
          ["sensible-open", [url]]
        ];
  let last: unknown;
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

export interface FullGrokAuthRuntime extends GrokAuthRuntime {
  issuer: string;
  clientId: string;
  scope: string;
  fetch: typeof fetch;
  timeoutMs: number;
  refreshSkewMs: number;
  resolveSessionPath: () => string;
}

export function createGrokAuthRuntime(
  overrides: Partial<FullGrokAuthRuntime> & { resolveSessionPath: () => string }
): FullGrokAuthRuntime {
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

function readString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export function expiresAtFromTokens(body: Record<string, unknown>, now: number): string {
  const expiresIn = body["expires_in"];
  if (typeof expiresIn === "number" && Number.isFinite(expiresIn) && expiresIn > 0) {
    return new Date(now + expiresIn * 1000).toISOString();
  }
  for (const token of [body["id_token"], body["access_token"]]) {
    if (typeof token !== "string") continue;
    const exp = decodeJwtPayload(token)?.["exp"];
    if (typeof exp === "number" && Number.isFinite(exp) && exp > 0) {
      return new Date(exp * 1000).toISOString();
    }
  }
  return new Date(now).toISOString();
}

async function accountFromTokens(
  body: Record<string, unknown>,
  accessToken: string,
  userinfoEndpoint: string | undefined,
  fetchImpl: typeof fetch
): Promise<{ email?: string; userId?: string }> {
  const idToken = readString(body, "id_token");
  const claims = idToken === undefined ? undefined : decodeJwtPayload(idToken);
  let email = claims !== undefined ? readString(claims, "email") : undefined;
  let userId = claims !== undefined ? readString(claims, "sub") : undefined;
  if ((email === undefined || userId === undefined) && userinfoEndpoint !== undefined) {
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
          email ??= readString(info, "email");
          userId ??= readString(info, "sub");
        }
      }
    } catch {}
  }
  return {
    ...(email === undefined ? {} : { email }),
    ...(userId === undefined ? {} : { userId })
  };
}

async function parseTokenResponse(
  response: Response,
  now: number,
  userinfoEndpoint: string | undefined,
  fetchImpl: typeof fetch,
  previous?: GrokSession
): Promise<GrokSession | undefined> {
  if (!response.ok) return undefined;
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return undefined;
  }
  if (!isRecord(body)) return undefined;
  const accessToken = readString(body, "access_token");
  const refreshToken = readString(body, "refresh_token") ?? previous?.refreshToken;
  if (accessToken === undefined || refreshToken === undefined) return undefined;
  const account = await accountFromTokens(body, accessToken, userinfoEndpoint, fetchImpl);
  const email = account.email ?? previous?.email;
  const userId = account.userId ?? previous?.userId;
  return {
    accessToken,
    refreshToken,
    expiresAt: expiresAtFromTokens(body, now),
    ...(email === undefined ? {} : { email }),
    ...(userId === undefined ? {} : { userId })
  };
}

export type RefreshResult =
  | { ok: true; session: GrokSession }
  | { ok: false; network?: boolean };

export async function refreshSession(runtime: FullGrokAuthRuntime, session: GrokSession): Promise<RefreshResult> {
  const endpoints = await discoverOidcEndpoints(runtime.issuer, runtime.fetch);
  let response: Response;
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
  if (refreshed === undefined) return { ok: false };
  return { ok: true, session: refreshed };
}

export async function ensureFreshStore(runtime: FullGrokAuthRuntime): Promise<GrokSessionStore> {
  const path = runtime.resolveSessionPath();
  const store = await readSessionStore(path);
  if (store.accounts.length === 0) return emptyStore();
  const active = activeAccountFrom(store);
  if (active === undefined) return store;
  if (Date.parse(active.expiresAt) - runtime.now() > runtime.refreshSkewMs) return store;
  const refreshed = await refreshSession(runtime, active);
  if (!refreshed.ok) {
    if ("network" in refreshed && refreshed.network === true) return store;
    const next = removeAccount(store, publicAccountId(active));
    if (next.accounts.length === 0) await deleteSession(path);
    else await writeSessionStore(path, next);
    return next;
  }
  const next = withActiveAccount(store, refreshed.session);
  await writeSessionStore(path, next);
  return next;
}

export async function ensureFreshSession(runtime: FullGrokAuthRuntime): Promise<GrokSession | undefined> {
  return activeAccountFrom(await ensureFreshStore(runtime));
}

export async function ensureFreshAccounts(runtime: FullGrokAuthRuntime): Promise<GrokSessionStore> {
  const path = runtime.resolveSessionPath();
  const store = await readSessionStore(path);
  if (store.accounts.length === 0) return emptyStore();
  const kept: GrokSession[] = [];
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
  const stillHasActive =
    previousActive !== undefined &&
    kept.some((account) => accountKeyOf(account) === previousActive || publicAccountId(account) === previousActive);
  const nextActive = stillHasActive ? previousActive : accountKeyOf(kept[0]);
  const next: GrokSessionStore = {
    version: store.version,
    ...(nextActive === undefined ? {} : { activeAccountId: nextActive }),
    accounts: kept
  };
  await writeSessionStore(path, next);
  return next;
}

export async function statusFromRuntime(runtime: FullGrokAuthRuntime): Promise<GrokAuthStatus> {
  return statusFromStore(await ensureFreshStore(runtime));
}

export async function switchRuntimeAccount(
  runtime: FullGrokAuthRuntime,
  accountId: string
): Promise<{ ok: true; status: GrokAuthStatus } | { ok: false; retryable: true; message: string }> {
  const path = runtime.resolveSessionPath();
  const switched = switchActiveAccount(await readSessionStore(path), accountId);
  if (switched === undefined) return retryable("That Grok account is not saved on this machine.");
  await writeSessionStore(path, switched);
  return { ok: true, status: statusFromStore(await ensureFreshStore(runtime)) };
}

export async function removeRuntimeAccount(
  runtime: FullGrokAuthRuntime,
  accountId?: string
): Promise<GrokAuthLogoutReply> {
  const path = runtime.resolveSessionPath();
  const store = await readSessionStore(path);
  const active = activeAccountFrom(store);
  const targetId = accountId ?? (active === undefined ? undefined : publicAccountId(active));
  if (targetId === undefined) {
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

const loginInFlight = new WeakSet<object>();
const pendingPaste = new WeakMap<object, { deliver: (code: string) => void; wait: Promise<string> }>();

function createPendingPaste() {
  let deliver: (code: string) => void = () => undefined;
  const wait = new Promise<string>((resolve) => {
    deliver = resolve;
  });
  return {
    deliver,
    wait
  };
}

export async function startPkceLogin(runtime: FullGrokAuthRuntime, signal?: AbortSignal): Promise<GrokAuthStartReply> {
  if (loginInFlight.has(runtime)) return retryable("Sign-in is already in progress.");
  loginInFlight.add(runtime);
  let server: any;
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
      await callback.catch(() => undefined);
      return retryable("Sign-in could not be completed.");
    }
    const pasted = paste.wait.then((code) => ({
      kind: "code" as const,
      code
    }));
    const result = await Promise.race([callback, pasted]);
    if (result.kind === "mismatch") return retryable("Sign-in rejected a mismatched state.");
    if (result.kind === "denied") return retryable("Sign-in did not complete.");
    let tokenResponse: Response;
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
    if (session === undefined) return retryable("auth.x.ai returned an unexpected token response. Try signing in again.");
    const path = runtime.resolveSessionPath();
    const before = await readSessionStore(path);
    const existing = before.accounts.find((account) => sameAccount(account, session));
    const next = upsertAccount(before, session, true);
    await writeSessionStore(path, next);
    return {
      ok: true,
      ...(existing === undefined ? {} : { reused: true }),
      ...(session.email === undefined ? {} : { email: session.email }),
      accountId: publicAccountId(session)
    };
  } catch (error: any) {
    const code = error.code;
    if (code === "ABORT_ERR" || signal?.aborted === true || local.signal.aborted) return retryable("Sign-in was cancelled.");
    if (code === "TIMEOUT") return retryable("Sign-in timed out.");
    return retryable("Sign-in could not be completed.");
  } finally {
    signal?.removeEventListener("abort", onParentAbort);
    if (server !== undefined) await closeServer(server);
    pendingPaste.delete(runtime);
    loginInFlight.delete(runtime);
  }
}

export async function completePkceLogin(
  runtime: FullGrokAuthRuntime,
  code: string
): Promise<{ ok: true } | { ok: false; retryable: true; message: string }> {
  const trimmed = code.trim();
  if (trimmed.length === 0) return retryable("Paste the sign-in code from the browser page.");
  const pending = pendingPaste.get(runtime);
  if (pending === undefined) return retryable("Sign-in is not waiting for a code.");
  pending.deliver(trimmed);
  return { ok: true };
}

export const GROK_CLI_REQUEST_HEADERS = Object.freeze({
  "x-grok-client-version": "1.0.4",
  "x-grok-client-identifier": "grok-shell"
});
