/**
 * Browser-safe constants shared by the Host and client plugin faces.
 */

/** Settings namespace owned by the Grok plugin. */
export const GROK_SETTINGS_NAMESPACE = "llm-grok";

/** Provider route owned by the Grok plugin. Distinct from the built-in `xai` console-key route. */
export const GROK_PROVIDER = "grok";

/** Default maximum idle interval while a stream read is outstanding. */
export const GROK_DEFAULT_STREAM_IDLE_TIMEOUT_MS = 300000;

/** Private Connection RPC channel used by this package's Host and Web faces. */
export const GROK_RPC_CHANNEL = "/grok";

/** Begin a Host-owned PKCE sign-in against auth.x.ai. */
export const GROK_AUTH_START_ENDPOINT = "auth/start";

/** Secret-free login snapshot. */
export const GROK_AUTH_STATUS_ENDPOINT = "auth/status";

/** Remove one saved account, or the active account when no id is sent. */
export const GROK_AUTH_LOGOUT_ENDPOINT = "auth/logout";

/** Deliver a Grok Build paste-code into the in-flight PKCE exchange. */
export const GROK_AUTH_COMPLETE_ENDPOINT = "auth/complete";

/** Switch the active saved account. */
export const GROK_AUTH_SWITCH_ENDPOINT = "auth/switch";

/** Remove one saved account by id. */
export const GROK_AUTH_REMOVE_ENDPOINT = "auth/remove";

/** Secret-free subscription-usage snapshot inside {@link GROK_RPC_CHANNEL}. */
export const GROK_USAGE_ENDPOINT = "usage/read";

/** Secret-free usage snapshot for every saved account, without switching the active one. */
export const GROK_USAGE_ALL_ENDPOINT = "usage/readAll";

/** Loopback HTTP snapshot of usage/read for host-local consumers such as dsh-mobile-plus. */
export const GROK_USAGE_HTTP_PATH = "/dsh-grok-oauth/usage";

/**
 * Offline fallback when the account catalog cannot be read. Live ids come
 * from GET /v1/models-v2 after sign-in.
 */
export const GROK_4_6_EFFORTS = Object.freeze([
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

export const GROK_CATALOG = Object.freeze([
  Object.freeze({
    id: "grok-4.6",
    name: "Grok 4.6",
    thinking: true,
    vision: true,
    contextWindow: 500000,
    defaultReasoningEffort: "high",
    reasoningEfforts: GROK_4_6_EFFORTS
  }),
  Object.freeze({
    id: "grok-4.5",
    name: "Grok 4.5",
    thinking: true,
    vision: true,
    contextWindow: 500000,
    defaultReasoningEffort: "high",
    reasoningEfforts: Object.freeze(GROK_4_6_EFFORTS.filter((effort) => effort.value !== "xhigh"))
  })
]);

/** Account model list inside {@link GROK_RPC_CHANNEL}. */
export const GROK_MODELS_ENDPOINT = "models/list";

/** Atomic settings-save endpoint. */
export const GROK_SAVE_ENDPOINT = "settings/save";

/** OAuth & API URLs */
export const GROK_OAUTH_ISSUER = "https://auth.x.ai";
export const GROK_OAUTH_CLIENT_ID = "b1a00492-073a-47ea-816f-4c329264a828";
/**
 * Scopes the official Grok CLI requests. `grok-cli:access` is what
 * cli-chat-proxy billing and chat treat as a CLI token; `api:access` alone
 * signs in but is rejected as "must be performed by Grok CLI token users".
 */
export const GROK_OAUTH_SCOPE = [
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
export const GROK_OAUTH_AUTHORIZE_PATH = "/oauth2/authorize";
export const GROK_OAUTH_TOKEN_PATH = "/oauth2/token";
export const GROK_OAUTH_TIMEOUT_MS = 300000;
export const GROK_OAUTH_REFRESH_SKEW_MS = 60000;

export const GROK_CHAT_BASE_URL = "https://cli-chat-proxy.grok.com/v1";
export const GROK_DEFAULT_CONTEXT_WINDOW = 500000;
export const GROK_DEFAULT_MODEL_MAX_TOKENS = 32768;

export const GROK_MODELS_URL = "https://cli-chat-proxy.grok.com/v1/models-v2";
export const GROK_BILLING_URL = "https://cli-chat-proxy.grok.com/v1/billing?format=credits";
export const DEFAULT_USAGE_REQUEST_TIMEOUT_MS = 15000;
export const MAX_USAGE_BYTES = 1048576;

export const GROK_IMAGINE_BASE_URL = "https://api.x.ai/v1";
export const GROK_IMAGINE_MODEL = "grok-imagine-image-quality";
export const GROK_IMAGINE_ASPECT_RATIOS = [
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
  "auto"
];
export const GROK_IMAGE_GEN_TIMEOUT_MS = 300000;
export const GROK_IMAGE_GEN_TOOL_NAME = "grok_image_gen";
export const GROK_PACKED_REASONING_TYPE = "dsh-grok-packed-reasoning";
export const GROK_SERVER_SEARCH_TOOLS = [{ type: "web_search" }, { type: "x_search" }];
