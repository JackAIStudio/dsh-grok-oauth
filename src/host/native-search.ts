import { GROK_CHAT_BASE_URL } from "../common/constants.js";
import { isRecord } from "../common/contract.js";
import { resolveGrokAccessToken } from "./adapter.js";
import { GROK_CLI_REQUEST_HEADERS, type FullGrokAuthRuntime } from "./oauth.js";
import { createGrokFetch } from "./proxy.js";

export const GROK_NATIVE_SEARCH_SERVICE = "grokNativeSearch";

export interface GrokSearchSource {
  url: string;
  title?: string;
  snippet?: string;
}

export interface GrokSearchResult {
  sources: GrokSearchSource[];
  truncated: boolean;
}

export interface GrokNativeSearch {
  available(): boolean;
  search(
    query: string,
    options?: { model?: string; maxResults?: number; signal?: AbortSignal }
  ): Promise<GrokSearchResult>;
}

function pushSource(sources: GrokSearchSource[], seen: Set<string>, url: unknown, title?: unknown) {
  if (typeof url !== "string" || !/^https?:\/\//u.test(url)) return;
  const label = typeof title === "string" && title.length > 0 && title !== url ? title : undefined;
  if (seen.has(url)) {
    const existing = sources.find((source) => source.url === url);
    if (existing !== undefined && existing.title === undefined && label !== undefined) existing.title = label;
    return;
  }
  seen.add(url);
  const item: GrokSearchSource = { url };
  if (label !== undefined) item.title = label;
  sources.push(item);
}

function fillTitlesFromText(sources: GrokSearchSource[], text: string) {
  const byUrl = new Map(sources.map((source) => [source.url, source]));
  const line = /^(.*?)\s+[-–—|]\s+(https?:\/\/\S+)/gmu;
  for (const match of text.matchAll(line)) {
    const title = match[1]?.trim();
    const url = match[2];
    if (!url || !title) continue;
    const existing = byUrl.get(url);
    if (existing && existing.title === undefined) existing.title = title;
  }
}

/** Map a Grok Responses body into DSH `ctx.web` sources. Ignores encrypted `tco_*` items. */
export function parseGrokSearchSources(payload: unknown, maxResults?: number): GrokSearchResult {
  const sources: GrokSearchSource[] = [];
  const seen = new Set<string>();
  if (!isRecord(payload) || !Array.isArray(payload["output"])) {
    return { sources, truncated: false };
  }
  const texts: string[] = [];
  for (const block of payload["output"]) {
    if (!isRecord(block)) continue;
    if (block["type"] === "web_search_call") {
      const action = isRecord(block["action"]) ? block["action"] : undefined;
      const listed = action !== undefined && Array.isArray(action["sources"]) ? action["sources"] : [];
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

export async function grokNativeWebSearch(input: {
  fetch: typeof fetch;
  accessToken: string;
  query: string;
  model?: string;
  maxResults?: number;
  signal?: AbortSignal;
}): Promise<GrokSearchResult> {
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
  let payload: unknown;
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

export function installGrokNativeSearch(
  ctx: { logger?: { error?: (error: unknown) => void } },
  input: {
    runtime: FullGrokAuthRuntime;
    proxy: () => string | undefined;
  }
): GrokNativeSearch {
  const api: GrokNativeSearch = {
    available() {
      return true;
    },
    async search(query, options) {
      const accessToken = await resolveGrokAccessToken(input.runtime);
      const fetchImpl = createGrokFetch(input.proxy(), ctx.logger as { warn?: (msg: string) => void; debug?: (msg: string) => void });
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
