import type { GrokCatalogModel } from "../common/contract.js";

export interface GrokSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  email?: string;
  userId?: string;
}

export interface GrokSessionStore {
  version: number;
  activeAccountId?: string;
  accounts: GrokSession[];
}

export interface GrokAuthRuntime {
  openBrowser(url: string): Promise<void | boolean>;
  now(): number;
}

export interface GrokAdapterOptions {
  models?: GrokCatalogModel[];
  enableImageGen?: boolean;
  serverSearch?: boolean;
  proxy?: string;
  streamIdleTimeoutMs?: number;
  maxRetries?: number;
}
