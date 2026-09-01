import { chmod, mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { randomBytes } from "node:crypto";
import { launchEnvironmentOf } from "@deepseek-ai/dsh-launch-environment";
import { isRecord, type GrokAuthAccountView, type GrokAuthStatus } from "../common/contract.js";
import type { GrokSession, GrokSessionStore } from "./types.js";

export type { GrokSession, GrokSessionStore };

/** File name under `$DSH_HOME`. Never `~/.grok/auth.json`. */
export const GROK_SESSION_FILENAME = "grok-oauth.json";
export const GROK_SESSION_VERSION = 2;

export function expandHome(path: string): string {
  if (path === "~") return homedir();
  if (path.startsWith("~/") || path.startsWith("~\\")) return join(homedir(), path.slice(2));
  return path;
}

/**
 * Resolve `$DSH_HOME` from the launch-environment snapshot, then `~/.dsh`.
 * @param ctx - Host plugin context that may carry a launcher snapshot.
 * @returns the absolute session file path.
 */
export function resolveGrokSessionPath(ctx: unknown): string {
  const fromEnv = launchEnvironmentOf(ctx as any)?.get("DSH_HOME")?.value;
  const home = fromEnv !== undefined && fromEnv.trim().length > 0 ? expandHome(fromEnv.trim()) : join(homedir(), ".dsh");
  return join(home, GROK_SESSION_FILENAME);
}

/**
 * Build the session path under an already-resolved harness home.
 * @param dshHome - absolute or home-relative harness home.
 */
export function sessionPathForHome(dshHome: string): string {
  return join(dshHome, GROK_SESSION_FILENAME);
}

export function accountKeyOf(session: GrokSession): string | undefined {
  if (typeof session.userId === "string" && session.userId.length > 0) return session.userId;
  if (typeof session.email === "string" && session.email.length > 0) return session.email.toLowerCase();
  return undefined;
}

export function publicAccountId(session: GrokSession): string {
  return accountKeyOf(session) ?? session.expiresAt;
}

export function sameAccount(left: GrokSession, right: GrokSession): boolean {
  const leftKey = accountKeyOf(left);
  const rightKey = accountKeyOf(right);
  return leftKey !== undefined && rightKey !== undefined && leftKey === rightKey;
}

export function cloneSession(session: GrokSession): GrokSession {
  return {
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    expiresAt: session.expiresAt,
    ...(session.email === undefined ? {} : { email: session.email }),
    ...(session.userId === undefined ? {} : { userId: session.userId })
  };
}

export function emptyStore(): GrokSessionStore {
  return {
    version: GROK_SESSION_VERSION,
    accounts: []
  };
}

export function storeFromLegacySession(session: GrokSession): GrokSessionStore {
  const cloned = cloneSession(session);
  const id = accountKeyOf(cloned);
  return {
    version: GROK_SESSION_VERSION,
    ...(id === undefined ? {} : { activeAccountId: id }),
    accounts: [cloned]
  };
}

export function decodeGrokSession(value: unknown): GrokSession | undefined {
  if (!isRecord(value)) return undefined;
  const accessToken = value["accessToken"];
  const refreshToken = value["refreshToken"];
  const expiresAt = value["expiresAt"];
  const email = value["email"];
  const userId = value["userId"];
  if (typeof accessToken !== "string" || accessToken.length === 0) return undefined;
  if (typeof refreshToken !== "string" || refreshToken.length === 0) return undefined;
  if (typeof expiresAt !== "string" || expiresAt.length === 0 || Number.isNaN(Date.parse(expiresAt))) return undefined;
  if (email !== undefined && (typeof email !== "string" || email.length === 0)) return undefined;
  if (userId !== undefined && (typeof userId !== "string" || userId.length === 0)) return undefined;
  return {
    accessToken,
    refreshToken,
    expiresAt,
    ...(typeof email === "string" ? { email } : {}),
    ...(typeof userId === "string" ? { userId } : {})
  };
}

export function findAccountIndex(store: GrokSessionStore, accountId?: string): number {
  if (typeof accountId !== "string" || accountId.length === 0) return -1;
  const needle = accountId.trim();
  const lowered = needle.toLowerCase();
  return store.accounts.findIndex(
    (account) =>
      accountKeyOf(account) === needle ||
      (typeof account.email === "string" && account.email.toLowerCase() === lowered)
  );
}

export function activeAccountFrom(store: GrokSessionStore): GrokSession | undefined {
  if (store.accounts.length === 0) return undefined;
  const index = findAccountIndex(store, store.activeAccountId);
  return store.accounts[index >= 0 ? index : 0];
}

export function withActiveAccount(store: GrokSessionStore, session: GrokSession): GrokSessionStore {
  const next = cloneSession(session);
  const id = accountKeyOf(next);
  return {
    version: GROK_SESSION_VERSION,
    ...(id === undefined ? {} : { activeAccountId: id }),
    accounts: store.accounts.map((account) => (sameAccount(account, next) ? next : cloneSession(account)))
  };
}

export function upsertAccount(store: GrokSessionStore, session: GrokSession, activate?: boolean): GrokSessionStore {
  const next = cloneSession(session);
  const accounts: GrokSession[] = [];
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
  const activeId =
    activate === false && store.activeAccountId !== undefined
      ? store.activeAccountId
      : accountKeyOf(next) ?? store.activeAccountId;
  return {
    version: GROK_SESSION_VERSION,
    ...(activeId === undefined ? {} : { activeAccountId: activeId }),
    accounts
  };
}

export function switchActiveAccount(store: GrokSessionStore, accountId: string): GrokSessionStore | undefined {
  const index = findAccountIndex(store, accountId);
  if (index < 0) return undefined;
  const id = accountKeyOf(store.accounts[index]);
  return {
    version: GROK_SESSION_VERSION,
    ...(id === undefined ? {} : { activeAccountId: id }),
    accounts: store.accounts.map(cloneSession)
  };
}

export function removeAccount(store: GrokSessionStore, accountId: string): GrokSessionStore {
  const index = findAccountIndex(store, accountId);
  if (index < 0) {
    return store.accounts.length === 0
      ? emptyStore()
      : {
          version: GROK_SESSION_VERSION,
          ...(store.activeAccountId === undefined ? {} : { activeAccountId: store.activeAccountId }),
          accounts: store.accounts.map(cloneSession)
        };
  }
  const accounts = store.accounts.filter((_, at) => at !== index).map(cloneSession);
  if (accounts.length === 0) return emptyStore();
  const removedWasActive =
    findAccountIndex(store, store.activeAccountId) === index || store.activeAccountId === undefined;
  const nextActive = removedWasActive ? accountKeyOf(accounts[0]) : store.activeAccountId;
  return {
    version: GROK_SESSION_VERSION,
    ...(nextActive === undefined ? {} : { activeAccountId: nextActive }),
    accounts
  };
}

export function decodeGrokSessionStore(value: unknown): GrokSessionStore | undefined {
  if (!isRecord(value)) return undefined;
  const accountsValue = value["accounts"];
  if (Array.isArray(accountsValue)) {
    const accounts: GrokSession[] = [];
    for (const entry of accountsValue) {
      const session = decodeGrokSession(entry);
      if (session === undefined) return undefined;
      accounts.push(session);
    }
    const activeAccountId = value["activeAccountId"];
    if (activeAccountId !== undefined && (typeof activeAccountId !== "string" || activeAccountId.length === 0)) {
      return undefined;
    }
    const store: GrokSessionStore = {
      version: GROK_SESSION_VERSION,
      ...(typeof activeAccountId === "string" ? { activeAccountId } : {}),
      accounts
    };
    const active = activeAccountFrom(store);
    if (active !== undefined) {
      const id = accountKeyOf(active);
      if (id !== undefined) store.activeAccountId = id;
    } else {
      delete store.activeAccountId;
    }
    return store;
  }
  const legacy = decodeGrokSession(value);
  return legacy === undefined ? undefined : storeFromLegacySession(legacy);
}

/**
 * Read the session file. Missing or corrupt documents are treated as signed-out.
 * @param path - absolute session path.
 */
export async function readSessionStore(path: string): Promise<GrokSessionStore> {
  try {
    const raw = await readFile(path, "utf8");
    return decodeGrokSessionStore(JSON.parse(raw)) ?? emptyStore();
  } catch {
    return emptyStore();
  }
}

export async function readSession(path: string): Promise<GrokSession | undefined> {
  return activeAccountFrom(await readSessionStore(path));
}

export async function writeSessionStore(path: string, store: GrokSessionStore): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const tmp = `${path}.${randomBytes(8).toString("hex")}.tmp`;
  const body = `${JSON.stringify(
    {
      version: GROK_SESSION_VERSION,
      ...(store.activeAccountId === undefined ? {} : { activeAccountId: store.activeAccountId }),
      accounts: store.accounts.map(cloneSession)
    },
    null,
    2
  )}\n`;
  try {
    await writeFile(tmp, body, {
      encoding: "utf8",
      mode: 384
    });
    await chmod(tmp, 384);
    await rename(tmp, path);
    await chmod(path, 384);
  } catch (error) {
    await unlink(tmp).catch(() => undefined);
    throw error;
  }
}

/**
 * Atomically write the session file with mode `0600`.
 * @param path - absolute session path.
 * @param sessionOrStore - tokens and account identity, or a v2 store.
 */
export async function writeSession(path: string, sessionOrStore?: GrokSession | GrokSessionStore): Promise<void> {
  const store =
    sessionOrStore !== undefined && isRecord(sessionOrStore) && Array.isArray((sessionOrStore as any).accounts)
      ? (sessionOrStore as GrokSessionStore)
      : upsertAccount(await readSessionStore(path), sessionOrStore as GrokSession, true);
  await writeSessionStore(path, store);
}

/**
 * Delete the session file. Missing files are success.
 * @param path - absolute session path.
 */
export async function deleteSession(path: string): Promise<void> {
  try {
    await unlink(path);
  } catch (error: any) {
    if (error.code !== "ENOENT") throw error;
  }
}

export function accountViewOf(session: GrokSession, active: boolean): GrokAuthAccountView {
  return {
    id: publicAccountId(session),
    ...(session.email === undefined ? {} : { email: session.email }),
    expiresAt: session.expiresAt,
    active: active === true
  };
}

export function statusFromStore(store: GrokSessionStore): GrokAuthStatus {
  const active = activeAccountFrom(store);
  if (active === undefined) {
    return {
      loggedIn: false,
      accounts: []
    };
  }
  const activeId = publicAccountId(active);
  return {
    loggedIn: true,
    ...(active.email === undefined ? {} : { email: active.email }),
    expiresAt: active.expiresAt,
    activeAccountId: activeId,
    accounts: store.accounts.map((account) => accountViewOf(account, publicAccountId(account) === activeId))
  };
}

/**
 * Project a Host session into the secret-free RPC status view.
 * @param session - current session, if any.
 */
export function statusFromSession(session?: GrokSession): GrokAuthStatus {
  if (session === undefined) return { loggedIn: false, accounts: [] };
  const id = publicAccountId(session);
  return {
    loggedIn: true,
    ...(session.email === undefined ? {} : { email: session.email }),
    expiresAt: session.expiresAt,
    activeAccountId: id,
    accounts: [accountViewOf(session, true)]
  };
}
