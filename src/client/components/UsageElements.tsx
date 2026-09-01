import React from "react";
import type { GrokUsageView, GrokUsageWindow } from "../../common/contract.js";
import { formatTemplate, type LocaleDict } from "../locales.js";
import { ensureMotionStyles, RefreshIcon } from "./Icons.js";

const iconButtonStyle: React.CSSProperties = {
  boxSizing: "border-box",
  width: 28,
  height: 28,
  padding: 0,
  border: "1px solid var(--dsw-alias-border-l2)",
  borderRadius: 999,
  background: "transparent",
  color: "var(--dsw-alias-label-primary)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  flex: "none"
};

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  color: "var(--dsw-alias-label-secondary)"
};

const hintStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 12,
  color: "var(--dsw-alias-label-tertiary)"
};

const trackStyle: React.CSSProperties = {
  boxSizing: "border-box",
  height: 14,
  overflow: "hidden",
  borderRadius: 999,
  background: "color-mix(in srgb, var(--dsw-alias-label-primary) 14%, transparent)"
};

const barTrackStyle: React.CSSProperties = {
  boxSizing: "border-box",
  height: 14,
  display: "flex",
  overflow: "hidden",
  borderRadius: 999,
  background: "color-mix(in srgb, var(--dsw-alias-label-primary) 14%, transparent)"
};

const shimmerStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  height: "100%",
  background:
    "linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--dsw-alias-label-primary) 22%, transparent) 50%, transparent 100%)",
  backgroundSize: "200% 100%",
  animation: "dsh-provider-shimmer 1.25s ease-in-out infinite"
};

const chipStyle: React.CSSProperties = {
  display: "inline-block",
  height: 12,
  borderRadius: 4,
  background:
    "linear-gradient(90deg, color-mix(in srgb, var(--dsw-alias-label-primary) 10%, transparent) 0%, color-mix(in srgb, var(--dsw-alias-label-primary) 22%, transparent) 50%, color-mix(in srgb, var(--dsw-alias-label-primary) 10%, transparent) 100%)",
  backgroundSize: "200% 100%",
  animation: "dsh-provider-shimmer 1.25s ease-in-out infinite"
};

export function formatUsageClock(at: Date): string {
  return at.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}

function chineseLocale(locales?: string | string[]): boolean {
  const locale =
    typeof locales === "string"
      ? locales
      : locales?.[0] ?? (typeof navigator === "undefined" ? undefined : navigator.language);
  return typeof locale === "string" && /^zh\b/iu.test(locale);
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function formatResetStamp(iso: string, locales?: string | string[]): string {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return iso;
  if (chineseLocale(locales)) {
    return `${at.getFullYear()}年${at.getMonth() + 1}月${at.getDate()}日 ${pad2(at.getHours())}:${pad2(at.getMinutes())}`;
  }
  return new Intl.DateTimeFormat(locales, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(at);
}

function formatResetDate(iso: string, locales?: string | string[]): string {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return iso;
  if (chineseLocale(locales)) {
    return `${at.getMonth() + 1}月${at.getDate()}日`;
  }
  return new Intl.DateTimeFormat(locales, {
    month: "short",
    day: "numeric"
  }).format(at);
}

function remainingResetDays(iso: string, now = Date.now()): number | undefined {
  const at = Date.parse(iso);
  if (!Number.isFinite(at)) return undefined;
  const days = Math.round((at - now) / 86400000);
  return days >= 1 ? days : undefined;
}

export function resetLabelOf(iso?: string, copy?: { at: string; atDays: string }, now?: number): string | undefined {
  if (iso === undefined || copy === undefined) return undefined;
  const locales = copy.at.includes("重置") ? "zh-CN" : "en";
  const days = remainingResetDays(iso, now);
  if (days !== undefined) {
    return formatTemplate(copy.atDays, {
      date: formatResetDate(iso, locales),
      count: days
    });
  }
  return formatTemplate(copy.at, { time: formatResetStamp(iso, locales) });
}

export function usageWindowLabelOf(id: string, t: (key: keyof LocaleDict) => string): string {
  if (id === "SuperGrok" || id === "weekly") return t("usageWindowSuperGrok");
  if (id === "GrokBuild") return t("usageWindowGrokBuild");
  if (id === "GrokImagine") return t("usageWindowGrokImagine");
  if (id === "GrokAppBuilder") return t("usageWindowGrokAppBuilder");
  return id;
}

export function usageResetCopy(t: (key: keyof LocaleDict) => string) {
  return {
    at: t("usageResetAt"),
    atDays: t("usageResetAtDays")
  };
}

export function UsageRefreshButton({
  spinning,
  disabled,
  label,
  busyLabel,
  onClick
}: {
  spinning?: boolean;
  disabled?: boolean;
  label: string;
  busyLabel: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      style={iconButtonStyle}
      disabled={disabled === true}
      aria-label={spinning ? busyLabel : label}
      onClick={onClick}
    >
      <RefreshIcon spinning={spinning} />
    </button>
  );
}

export function UsageSkeleton({ rows = 2 }: { rows?: number }) {
  ensureMotionStyles();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }} aria-hidden="true">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
            <span style={{ ...chipStyle, width: index === 0 ? 92 : 78 }} />
            <span style={{ ...chipStyle, width: 36 }} />
          </div>
          <div style={trackStyle}>
            <span style={shimmerStyle} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function UsageHeader({
  title,
  spinning,
  disabled,
  refreshLabel,
  busyLabel,
  onRefresh,
  error
}: {
  title: string;
  spinning?: boolean;
  disabled?: boolean;
  refreshLabel: string;
  busyLabel: string;
  onRefresh: () => void;
  error?: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
      <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, lineHeight: "18px" }}>{title}</h3>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 8, flex: "none" }}>
        {error !== undefined && error.length > 0 ? (
          <span style={{ fontSize: 12, lineHeight: "18px", color: "var(--dsw-alias-state-error-primary)" }}>
            {error}
          </span>
        ) : null}
        <UsageRefreshButton
          spinning={spinning}
          disabled={disabled === true}
          label={refreshLabel}
          busyLabel={busyLabel}
          onClick={onRefresh}
        />
      </span>
    </div>
  );
}

export function UsageResetAt({ label }: { label?: string }) {
  if (label === undefined || label.length === 0) return null;
  return (
    <p style={{ margin: 0, fontSize: 12, lineHeight: "18px", color: "var(--dsw-alias-label-tertiary)" }}>{label}</p>
  );
}

export function UsageUpdatedAt({ at, label }: { at?: Date; label?: string }) {
  if (at === undefined || label === undefined) return null;
  return (
    <p
      style={{
        margin: 0,
        textAlign: "right",
        fontSize: 12,
        lineHeight: "18px",
        color: "var(--dsw-alias-label-tertiary)"
      }}
    >
      {label}
    </p>
  );
}

export function UsageBar({
  usedText,
  window: quota,
  t
}: {
  usedText: string;
  window: GrokUsageWindow;
  t: (key: keyof LocaleDict) => string;
}) {
  const ratio = quota.limit > 0 ? quota.used / quota.limit : quota.used > 0 ? 1 : 0;
  const percent = Math.round(ratio * 1000) / 10;
  const fill = Math.min(100, Math.max(0, percent));
  const name = usageWindowLabelOf(quota.id, t);
  const label = quota.period === undefined || quota.resetsAt !== undefined ? name : `${name} (${quota.period})`;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
        <span style={labelStyle}>{label}</span>
        <span style={hintStyle}>
          {quota.unit === "percent" ? `${quota.used}%` : `${usedText} ${quota.used} / ${quota.limit}`}
        </span>
      </div>
      <div
        style={barTrackStyle}
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(fill)}
      >
        <span
          data-usage-fill="true"
          style={{
            width: `${fill}%`,
            height: "100%",
            flex: "none",
            background: "var(--dsw-alias-state-business-primary)",
            transition: "width 200ms ease"
          }}
        />
      </div>
      <UsageResetAt label={resetLabelOf(quota.resetsAt, usageResetCopy(t))} />
    </div>
  );
}

export function UsageStackedBar({
  total,
  products,
  t
}: {
  total: GrokUsageWindow;
  products: GrokUsageWindow[];
  t: (key: keyof LocaleDict) => string;
}) {
  const used = total.used;
  const label = usageWindowLabelOf(total.id, t);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
        <span style={labelStyle}>{label}</span>
        <span style={hintStyle}>{t("dockUsed").replace("{percent}", String(used))}</span>
      </div>
      <div
        style={barTrackStyle}
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(used)}
      >
        {products.map((product, index) => (
          <span
            key={`${product.id}:${index}`}
            title={`${usageWindowLabelOf(product.id, t)} ${product.used}%`}
            style={{
              width: `${product.used}%`,
              height: "100%",
              flex: "none",
              background: "var(--dsw-alias-state-business-primary)",
              opacity: String(Math.max(0.4, 1 - index * 0.28)),
              transition: "width 200ms ease"
            }}
          />
        ))}
      </div>
      {products.length > 0 ? (
        <p style={hintStyle}>
          {products.map((product) => `${usageWindowLabelOf(product.id, t)} ${product.used}%`).join(" · ")}
        </p>
      ) : null}
      <UsageResetAt label={resetLabelOf(total.resetsAt, usageResetCopy(t))} />
    </div>
  );
}

export function usagePresentation(usage: GrokUsageView): {
  total?: GrokUsageWindow;
  products: GrokUsageWindow[];
} {
  const total = usage.windows.find((w) => w.id === "SuperGrok");
  const products = usage.windows.filter((w) => w.id !== "SuperGrok" && w.id !== "monthly");
  return { total, products };
}

export function officialUsedPercent(usage?: GrokUsageView): number | undefined {
  if (usage === undefined) return undefined;
  const view = usagePresentation(usage);
  if (view.total !== undefined) return view.total.used;
  const first = usage.windows[0];
  if (first === undefined) return undefined;
  return first.unit === "percent"
    ? first.used
    : first.limit > 0
    ? Math.round((first.used / first.limit) * 100)
    : undefined;
}

export function renderUsageSnapshot(usage: GrokUsageView, t: (key: keyof LocaleDict) => string) {
  const view = usagePresentation(usage);
  if (view.total !== undefined && view.products.length > 0) {
    return <UsageStackedBar total={view.total} products={view.products} t={t} />;
  }
  if (view.total !== undefined) {
    return <UsageBar usedText={t("usageUsed")} window={view.total} t={t} />;
  }
  return (
    <>
      {usage.windows.map((window, index) => (
        <UsageBar key={`${window.id}:${index}`} usedText={t("usageUsed")} window={window} t={t} />
      ))}
    </>
  );
}
