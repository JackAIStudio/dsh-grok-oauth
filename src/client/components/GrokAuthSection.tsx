import React from "react";
import { GROK_SETTINGS_NAMESPACE } from "../../common/constants.js";

export const GROK_AUTH_SECTION_ID = "grok-oauth-login";
export const GROK_AUTH_ITEM_SLOT = "settings.grok.auth";
export const GROK_AUTH_LOCALE_NS = "settings.grok-auth";

export const grokAuthCopy = {
  zh: {
    nav: "Grok OAuth 登录",
    title: "Grok OAuth 登录",
    subtitle: "使用 xAI 订阅登录 Grok，并管理模型。"
  },
  en: {
    nav: "Grok OAuth Login",
    title: "Grok OAuth Login",
    subtitle: "Sign in to Grok with your xAI subscription and manage models."
  }
};

const pageStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 24,
  boxSizing: "border-box",
  width: "100%",
  padding: "32px 32px 48px"
};

const titleStyle: React.CSSProperties = {
  margin: "0 0 4px",
  fontSize: 20,
  fontWeight: 600,
  lineHeight: "28px",
  color: "var(--dsw-alias-label-primary)"
};

const subtitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 14,
  lineHeight: "20px",
  color: "var(--dsw-alias-label-secondary)"
};

export function duplicateSection(error: unknown): boolean {
  return error instanceof Error && /already has|requires options/.test(error.message);
}

export function GrokAuthSection(props: {
  t?: (key: string) => string;
  renderSlot?: (slotName: string, props: any, options: { entryKey: string }) => React.ReactNode;
}) {
  const t = props.t ?? ((key: string) => key);
  const renderSlot = props.renderSlot;
  const node = renderSlot?.(GROK_AUTH_ITEM_SLOT, {}, { entryKey: GROK_SETTINGS_NAMESPACE });
  return (
    <div data-grok-auth-section={GROK_AUTH_LOCALE_NS} style={pageStyle}>
      <header>
        <h2 style={titleStyle}>{t("title")}</h2>
        <p style={subtitleStyle}>{t("subtitle")}</p>
      </header>
      {node == null ? null : node}
    </div>
  );
}
