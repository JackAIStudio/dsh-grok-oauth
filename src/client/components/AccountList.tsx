import React from "react";
import type { GrokAccountUsageView, GrokAuthAccountView } from "../../common/contract.js";
import type { LocaleDict } from "../locales.js";
import { officialUsedPercent, renderUsageSnapshot } from "./UsageElements.js";

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  color: "var(--dsw-alias-label-secondary)"
};

const hintStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 12,
  color: "var(--dsw-alias-label-tertiary)"
};

const errorStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 13,
  color: "var(--dsw-alias-state-error-primary)"
};

const buttonStyle: React.CSSProperties = {
  alignSelf: "flex-start",
  minHeight: 34,
  border: "1px solid var(--dsw-alias-border-l2)",
  borderRadius: 18,
  padding: "6px 14px",
  background: "var(--dsw-alias-bg-layer-1)",
  color: "var(--dsw-alias-label-primary)",
  font: "inherit",
  cursor: "pointer"
};

const quietButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  minHeight: 28,
  padding: "4px 10px",
  fontSize: 12
};

const accountListStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8
};

const accountRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  border: "1px solid var(--dsw-alias-border-l2)",
  borderRadius: 10,
  padding: "10px 12px",
  background: "var(--dsw-alias-bg-layer-1)"
};

const accountMetaStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 2,
  minWidth: 0,
  flex: 1
};

export const GROK_USAGE_WARN = 80;
export const GROK_USAGE_ALERT = 95;

export function accountLabelOf(account: GrokAuthAccountView): string {
  return account.email ?? account.id;
}

export function usedPercentTone(used?: number): string {
  if (used === undefined) return "var(--dsw-alias-label-tertiary)";
  if (used >= GROK_USAGE_ALERT) return "var(--dsw-alias-state-error-primary)";
  if (used >= GROK_USAGE_WARN) return "var(--dsw-alias-state-warn-primary)";
  return "var(--dsw-alias-label-tertiary)";
}

export function accountUsageOf(accounts: GrokAccountUsageView[] | undefined, accountId: string): GrokAccountUsageView | undefined {
  if (!Array.isArray(accounts)) return undefined;
  return accounts.find((entry) => entry.accountId === accountId || entry.email === accountId);
}

export function accountUsageCaption(
  entry: GrokAccountUsageView | undefined,
  t: (key: keyof LocaleDict) => string
): { text: string; color: string } | undefined {
  if (entry === undefined) return undefined;
  if (entry.status === "ok") {
    const used = officialUsedPercent(entry.usage);
    if (used === undefined) return undefined;
    return {
      text: t("dockUsed").replace("{percent}", String(used)),
      color: usedPercentTone(used)
    };
  }
  if (entry.status === "unsupported") {
    return {
      text: t("usageUnsupported"),
      color: "var(--dsw-alias-label-tertiary)"
    };
  }
  if (entry.status === "error") {
    return {
      text: t("usageFailed"),
      color: "var(--dsw-alias-state-error-primary)"
    };
  }
  return undefined;
}

export function renderAccountUsageBody(entry: GrokAccountUsageView, t: (key: keyof LocaleDict) => string) {
  if (entry.status === "ok" && entry.usage !== undefined) return renderUsageSnapshot(entry.usage, t);
  if (entry.status === "unsupported") return <p style={hintStyle}>{t("usageUnsupported")}</p>;
  if (entry.status === "error") return <p style={errorStyle}>{entry.message}</p>;
  return null;
}

export function renderAccountsUsage(accounts: GrokAccountUsageView[], t: (key: keyof LocaleDict) => string) {
  if (accounts.length <= 1) {
    const only = accounts[0];
    return only === undefined ? null : renderAccountUsageBody(only, t);
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {accounts.map((entry) => (
        <div
          key={entry.accountId}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            border: "1px solid var(--dsw-alias-border-l2)",
            borderRadius: 10,
            padding: "10px 12px",
            background: "var(--dsw-alias-bg-layer-1)"
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
            <span style={{ ...labelStyle, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
              {entry.email ?? entry.accountId}
            </span>
            {entry.active ? <span style={hintStyle}>{t("accountActive")}</span> : null}
          </div>
          {renderAccountUsageBody(entry, t)}
        </div>
      ))}
    </div>
  );
}

export interface AccountListProps {
  accounts: GrokAuthAccountView[];
  lastAccounts?: GrokAccountUsageView[];
  disabled: boolean;
  onSwitch: (id: string) => void;
  onRemove: (id: string) => void;
  t: (key: keyof LocaleDict) => string;
}

export function AccountList({ accounts, lastAccounts, disabled, onSwitch, onRemove, t }: AccountListProps) {
  return (
    <div style={accountListStyle}>
      {accounts.map((account) => {
        const usage = accountUsageOf(lastAccounts, account.id);
        const caption = accountUsageCaption(usage, t);
        return (
          <div key={account.id} style={accountRowStyle}>
            <div style={accountMetaStyle}>
              <span
                style={{
                  ...labelStyle,
                  fontWeight: account.active ? 600 : 400,
                  overflow: "hidden",
                  textOverflow: "ellipsis"
                }}
              >
                {account.email ?? account.id}
              </span>
              {caption !== undefined ? (
                <span style={{ fontSize: 12, color: caption.color }}>{caption.text}</span>
              ) : account.active ? (
                <span style={hintStyle}>{t("accountActive")}</span>
              ) : null}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flex: "none" }}>
              {!account.active ? (
                <button
                  type="button"
                  style={quietButtonStyle}
                  disabled={disabled}
                  onClick={() => onSwitch(account.id)}
                >
                  {t("useAccount")}
                </button>
              ) : null}
              <button
                type="button"
                style={quietButtonStyle}
                disabled={disabled}
                onClick={() => onRemove(account.id)}
              >
                {t("removeAccount")}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
