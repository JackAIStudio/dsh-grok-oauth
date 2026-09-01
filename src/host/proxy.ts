import { ProxyAgent, EnvHttpProxyAgent, fetch as undiciFetch } from "undici";
import { isRecord } from "../common/contract.js";

const PROXY_DIRECT_VALUE = /^(?:direct|off|none)$/iu;

export type ProxyResolution =
  | { mode: "auto" }
  | { mode: "direct" }
  | { mode: "explicit"; url: string }
  | { mode: "invalid"; value: string };

/**
 * Resolve the plugin `proxy` setting into a transport decision.
 * Empty means "inherit the environment"; `direct`/`off`/`none` forces a
 * direct connection; anything else is treated as an HTTP(S) proxy URL
 * (`host:port` is normalized to `http://host:port`).
 */
export function resolveProxySetting(value?: string): ProxyResolution {
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

/** Standard proxy environment variables, most-specific first. */
export function proxyEnvValue(): string | undefined {
  return process.env.HTTPS_PROXY ?? process.env.https_proxy ?? process.env.ALL_PROXY ?? process.env.all_proxy ?? undefined;
}

/** Log-safe proxy label: credentials are stripped before any output. */
export function proxyLabel(value?: string): string {
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

/**
 * Build the Host fetch implementation for the current proxy setting.
 */
export function createGrokFetch(
  setting?: string,
  logger?: { warn?: (msg: string) => void; debug?: (msg: string) => void }
): typeof globalThis.fetch {
  const resolved = resolveProxySetting(setting);
  if (resolved.mode === "direct") return globalThis.fetch;
  if (resolved.mode === "invalid") {
    logger?.warn?.(`llm-grok: ignoring invalid proxy setting "${resolved.value}"; falling back to the environment proxy`);
  }
  if (resolved.mode === "explicit" && resolved.url !== undefined) {
    const agent = new ProxyAgent(resolved.url);
    logger?.debug?.(`llm-grok: routing Grok requests through ${proxyLabel(resolved.url)}`);
    return (input: any, init?: any) => undiciFetch(input, { ...init, dispatcher: agent }) as any;
  }
  const envProxy = proxyEnvValue();
  if (envProxy === undefined) return globalThis.fetch;
  const agent = new EnvHttpProxyAgent();
  logger?.debug?.(`llm-grok: routing Grok requests through ${proxyLabel(envProxy)}`);
  return (input: any, init?: any) => undiciFetch(input, { ...init, dispatcher: agent }) as any;
}

/** True when the configured transport actually routes through a proxy. */
export function hasActiveProxy(setting?: string): boolean {
  const resolved = resolveProxySetting(setting);
  if (resolved.mode === "direct") return false;
  if (resolved.mode === "explicit") return true;
  return proxyEnvValue() !== undefined;
}

/**
 * Loopback and NO_PROXY hosts must never hit the proxy.
 */
export function shouldBypassProxy(input: string | { url: string }): boolean {
  let url: URL;
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

/** Grok (xAI) hosts the proxy applies to. Everything else stays direct. */
export const GROK_PROXY_DOMAIN = /(?:^|\.)(?:x\.ai|grok\.com)$/iu;

/**
 * True for requests that must be routed through the proxy.
 */
export function isGrokRequest(input: string | { url: string }): boolean {
  try {
    const url = typeof input === "string" ? new URL(input) : new URL(input.url);
    return GROK_PROXY_DOMAIN.test(url.hostname);
  } catch {
    return false;
  }
}

/** Turn a thrown network error into the sign-in retryable reply. */
export function authNetworkHint(error: unknown): string {
  const detail = error instanceof Error && error.message.length > 0 ? error.message : "connection failed";
  return `Could not reach auth.x.ai (${detail}). Check the plugin proxy setting or HTTPS_PROXY, then try again.`;
}

function redactSecrets(message: string, secrets: (string | undefined)[]): string {
  let result = message;
  for (const secret of secrets) {
    if (typeof secret === "string" && secret.length > 0) {
      result = result.replaceAll(secret, "[REDACTED]");
    }
  }
  return result;
}

function readString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

/** Read the IdP rejection body and build a safe, actionable hint. */
export async function authRejectionHint(response: Response, secrets: (string | undefined)[]): Promise<string> {
  let detail = "";
  try {
    const body = await response.json();
    if (isRecord(body)) {
      const error = readString(body, "error");
      const description = readString(body, "error_description");
      detail = [error, description].filter((part) => part !== undefined).join(" — ");
    }
  } catch {
    // body is not JSON; keep the status-only hint
  }
  detail = redactSecrets(detail, secrets);
  return `auth.x.ai rejected the sign-in (HTTP ${response.status})${detail.length > 0 ? `: ${detail}` : ""}.`;
}
