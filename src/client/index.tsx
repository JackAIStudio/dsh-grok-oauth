import React from "react";
import {
  decodeGrokAccountsUsageReply,
  decodeGrokAuthLogoutReply,
  decodeGrokAuthStartReply,
  decodeGrokAuthStatus,
  decodeGrokModelsReply,
  decodeGrokSaveResult,
  decodeGrokSettings,
  decodeGrokUsageReply,
  type GrokAuthLogoutReply,
  type GrokCatalogModel,
  type GrokSettings
} from "../common/contract.js";
import {
  GROK_AUTH_COMPLETE_ENDPOINT,
  GROK_AUTH_LOGOUT_ENDPOINT,
  GROK_AUTH_REMOVE_ENDPOINT,
  GROK_AUTH_START_ENDPOINT,
  GROK_AUTH_STATUS_ENDPOINT,
  GROK_AUTH_SWITCH_ENDPOINT,
  GROK_MODELS_ENDPOINT,
  GROK_RPC_CHANNEL,
  GROK_SAVE_ENDPOINT,
  GROK_SETTINGS_NAMESPACE,
  GROK_USAGE_ALL_ENDPOINT,
  GROK_USAGE_ENDPOINT
} from "../common/constants.js";
import { en, zh } from "./locales.js";
import { BrandMark } from "./components/BrandMark.js";
import { GrokModelPicker, GrokModelPickerController } from "./components/GrokModelPicker.js";
import { GrokPluginCard } from "./components/GrokPluginCard.js";
import { registerGrokImageToolview } from "./components/GrokImageRow.js";
import {
  GrokUsageChip,
  loadGrokUsage,
  onGrokUsageFocus,
  onGrokUsageVisibility,
  setGrokUsageFetch,
  grokUsageListeners
} from "./components/UsageChip.js";
import {
  duplicateSection,
  GROK_AUTH_ITEM_SLOT,
  GROK_AUTH_LOCALE_NS,
  GROK_AUTH_SECTION_ID,
  grokAuthCopy,
  GrokAuthSection
} from "./components/GrokAuthSection.js";

export const name = "dsh-llm-grok-client";

export const inject = ["slots", "locale", "connection", "settingsScope", "uiConversation"];

export function apply(ctx: any) {
  const localeNamespace = "settings.grok";
  ctx.effect(
    () =>
      ctx.locale.register(localeNamespace, {
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
        ok: false as const,
        retryable: true as const,
        message: result.error.message
      };
    }
    const decoded = decodeGrokAuthStartReply(result.value);
    if (decoded === undefined) {
      return {
        ok: false as const,
        retryable: true as const,
        message: t("signInFailed")
      };
    }
    return decoded;
  };

  const completeAuth = async (code: string) => {
    const result = await rpc.call(GROK_RPC_CHANNEL, GROK_AUTH_COMPLETE_ENDPOINT, { code });
    if (!result.ok) {
      return {
        ok: false as const,
        retryable: true as const,
        message: result.error.message
      };
    }
    const decoded = decodeGrokAuthStartReply(result.value);
    if (decoded === undefined) {
      return {
        ok: false as const,
        retryable: true as const,
        message: t("signInFailed")
      };
    }
    return decoded;
  };

  const readAuthStatus = async () => {
    const result = await rpc.call(GROK_RPC_CHANNEL, GROK_AUTH_STATUS_ENDPOINT, {});
    if (!result.ok) throw new Error(result.error.message);
    const decoded = decodeGrokAuthStatus(result.value);
    if (decoded === undefined) throw new Error(t("statusFailed"));
    return decoded;
  };

  const decodeAccountMutation = (value: unknown, fallback: string): GrokAuthLogoutReply => {
    const decoded = decodeGrokAuthLogoutReply(value);
    if (decoded === undefined) throw new Error(t(fallback as any));
    return decoded;
  };

  const logout = async (accountId?: string) => {
    const result = await rpc.call(GROK_RPC_CHANNEL, GROK_AUTH_LOGOUT_ENDPOINT, accountId === undefined ? {} : { accountId });
    if (!result.ok) throw new Error(result.error.message);
    return decodeAccountMutation(result.value, "signOutFailed");
  };

  const switchAccount = async (accountId: string) => {
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

  const removeAccount = async (accountId: string) => {
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

  const fetchModels = async (): Promise<GrokCatalogModel[]> => {
    const result = await rpc.call(GROK_RPC_CHANNEL, GROK_MODELS_ENDPOINT, {});
    if (!result.ok) throw new Error(result.error.message);
    const decoded = decodeGrokModelsReply(result.value);
    if (decoded === undefined) throw new Error(t("statusFailed"));
    return decoded.models;
  };

  const fetchUsage = async () => {
    const result = await rpc.call(GROK_RPC_CHANNEL, GROK_USAGE_ENDPOINT, {});
    if (!result.ok) throw new Error(result.error.message);
    const decoded = decodeGrokUsageReply(result.value);
    if (decoded === undefined) throw new Error(t("usageFailed"));
    return decoded;
  };

  const fetchAllUsage = async () => {
    const result = await rpc.call(GROK_RPC_CHANNEL, GROK_USAGE_ALL_ENDPOINT, {});
    if (result.ok) {
      const decoded = decodeGrokAccountsUsageReply(result.value);
      if (decoded !== undefined) return decoded;
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

  const saveConfiguration = async (settings: GrokSettings) => {
    const snapshot = scope.getSnapshot();
    if (snapshot.revision === undefined) throw new Error(t("requestFailed"));
    const saved = await rpc.call(GROK_RPC_CHANNEL, GROK_SAVE_ENDPOINT, {
      models: settings.models,
      enableImageGen: settings.enableImageGen,
      ...(settings.serverSearch === undefined ? {} : { serverSearch: settings.serverSearch }),
      ...(settings.proxy === undefined ? {} : { proxy: settings.proxy }),
      expectedRevision: snapshot.revision
    });
    if (!saved.ok) throw new Error(saved.error.message);
    const accepted = decodeGrokSaveResult(saved.value);
    if (accepted === undefined) throw new Error(t("requestFailed"));
    return accepted;
  };

  ctx.slots.inject("shell.overlay", () =>
    ctx.slots.register(
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
    beginModelPicker: (initiallyPicked: Set<string>, onAdopt: (selected: GrokCatalogModel[]) => void) => {
      picker.begin(onAdopt, initiallyPicked);
    },
    completeModelPicker: (candidates: GrokCatalogModel[]) => {
      picker.complete(candidates);
    },
    failModelPicker: (message: string) => {
      picker.fail(message);
    },
    closeModelPicker: picker.close
  });

  const GROK_NAV_MARKER = "data-dsh-grok-settings-nav";
const GROK_NAV_STYLE_ID = "dsh-grok-settings-nav-style";
const GROK_SLASH_PATH = "M1.55 16.45 7.65 10.35a1.2 1.2 0 0 1 1.7 0L16.45 1.55 10.35 7.65a1.2 1.2 0 0 1-1.7 0z";
const GROK_MASK_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 18 18'%3E%3Ccircle cx='9' cy='9' r='6.75' fill='none' stroke='black' stroke-width='2.2'/%3E%3Cpath fill='black' d='${GROK_SLASH_PATH}'/%3E%3C/svg%3E")`;

function installGrokNavStyle(): void {
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

function registerGrokSettingsNavIcon(getLabel?: () => string): () => void {
  if (typeof document === "undefined") return () => {};
  installGrokNavStyle();
  let disposed = false;
  const sync = () => {
    if (disposed) return;
    const buttons = document.querySelectorAll<HTMLButtonElement>('[role="dialog"] nav button');
    const label = getLabel ? getLabel().trim() : "";
    for (const b of buttons) {
      const text = b.textContent ? b.textContent.trim() : "";
      const match = (label.length > 0 && text === label) || text === "Grok OAuth 登录" || text === "Grok OAuth Login";
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

// Dedicated "Grok OAuth 登录" settings module (owned by dsh-grok-oauth).
  ctx.slots.inject("settings.section", () => {
    let disposeSection: (() => void) | undefined;
    let disposeLocale: (() => void) | undefined;
    const claim = () => {
      if (disposeSection !== undefined) return;
      disposeLocale ??= ctx.locale.register(GROK_AUTH_LOCALE_NS, grokAuthCopy);
      const t = ctx.locale.bind(GROK_AUTH_LOCALE_NS);
      try {
        disposeSection = ctx.slots.register(
          {
            name: "settings.section",
            id: GROK_AUTH_SECTION_ID,
            order: 11,
            label: () => t("nav"),
            icon: <BrandMark size={14} />,
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
      disposeSection = undefined;
      disposeLocale?.();
      disposeLocale = undefined;
    };
  });

  ctx.slots.inject(GROK_AUTH_ITEM_SLOT, () =>
    ctx.slots.register(
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

  ctx.slots.inject("conversation.composer.dock", () =>
    ctx.slots.register(
      {
        name: "conversation.composer.dock",
        id: "dsh-grok-oauth-usage",
        order: -8,
        label: () => t("usageWindowSuperGrok")
      },
      (props: any) => <GrokUsageChip {...props} seat="dock" t={t} />
    )
  );

  ctx.slots.inject("conversation.input.dock", () =>
    ctx.slots.register(
      {
        name: "conversation.input.dock",
        id: "dsh-grok-oauth-usage-hero",
        order: 52,
        label: () => t("usageWindowSuperGrok")
      },
      (props: any) => <GrokUsageChip {...props} seat="hero" t={t} />
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
