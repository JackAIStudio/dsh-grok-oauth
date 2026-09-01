import React, { useEffect, useRef, useState } from "react";
import type { GrokUsageReply, GrokUsageView } from "../../common/contract.js";
import { formatTemplate, type LocaleDict } from "../locales.js";
import { BrandMark } from "./BrandMark.js";
import {
  formatUsageClock,
  officialUsedPercent,
  resetLabelOf,
  usagePresentation,
  usageResetCopy,
  usageWindowLabelOf
} from "./UsageElements.js";
import { GROK_USAGE_ALERT, GROK_USAGE_WARN } from "./AccountList.js";

const GROK_USAGE_FOCUS_DEBOUNCE_MS = 15000;

export const grokUsageDockCss = [
  '[data-slot="conversation.composer.dock"]:has(> .grok-usage-dock){display:flex!important;flex-flow:row nowrap;justify-content:center;align-items:center;box-sizing:border-box;width:100%;max-width:var(--dsh-chat-content-width);min-width:0;padding:4px calc(var(--dsh-composer-side-clearance) + 16px) 0;overflow:hidden}',
  '[data-slot="conversation.composer.dock"]:has(> .grok-usage-dock)>*{box-sizing:border-box;flex:0 1 auto;min-width:0;width:auto!important;max-width:none!important;margin:0!important;padding:0!important}',
  '[data-phase="hero"] [data-slot="conversation.input.dock"]:has(> .grok-usage-dock){display:flex!important;flex:none!important;flex-flow:row nowrap;justify-content:center;align-items:center;box-sizing:border-box;width:100%;max-width:var(--dsh-chat-content-width);min-width:0;min-height:20px;padding:4px calc(var(--dsh-composer-side-clearance) + 16px);overflow:visible;order:30;align-self:center}',
  '[data-phase="hero"] [data-slot="conversation.input.dock"]:has(> .grok-usage-dock)>*{box-sizing:border-box;flex:0 1 auto;min-width:0;width:auto!important;max-width:none!important;margin:0!important;padding:0!important}',
  ".grok-usage-dock{display:inline-flex;align-items:center;flex:none;line-height:20px}",
  '[data-slot="conversation.composer.dock"]:has(> .grok-usage-dock)>.grok-usage-dock{flex:none;overflow:visible}',
  '[data-phase="hero"] [data-slot="conversation.input.dock"]:has(> .grok-usage-dock)>.grok-usage-dock{flex:none;overflow:visible}',
  '.grok-usage-dock:not(:last-child):after{content:"|";color:var(--dsw-alias-separator-primary);margin:0 10px;font-size:12px;line-height:20px}',
  ".grok-usage{appearance:none;display:inline-flex;align-items:center;gap:6px;height:20px;padding:0 2px;border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-label-tertiary);font:inherit;font-size:12px;line-height:20px;letter-spacing:.01em;white-space:nowrap;cursor:pointer;user-select:none}",
  ".grok-usage:hover,.grok-usage:focus-visible{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-secondary);outline:none}",
  '.grok-usage-amount{color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;font-feature-settings:"tnum"}',
  ".grok-usage.is-warn .grok-usage-amount{color:var(--dsw-alias-state-warn-primary)}",
  ".grok-usage.is-alert .grok-usage-amount{color:var(--dsw-alias-state-error-primary)}",
  ".grok-usage-mark{display:block;opacity:.78;flex:none}",
  ".grok-usage:hover .grok-usage-mark,.grok-usage:focus-visible .grok-usage-mark{opacity:.95}",
  ".grok-usage.is-loading .grok-usage-mark{opacity:.95;animation:grok-usage-spin .8s linear infinite}",
  "@media (prefers-reduced-motion:reduce){.grok-usage.is-loading .grok-usage-mark{animation:none}}",
  "@keyframes grok-usage-spin{to{transform:rotate(360deg)}}",
  '@media (max-width:640px){[data-slot="conversation.composer.dock"]:has(> .grok-usage-dock),[data-phase="hero"] [data-slot="conversation.input.dock"]:has(> .grok-usage-dock){padding-left:12px;padding-right:12px}}'
].join("");

const grokUsageCssId = "dsh-grok-oauth/usage-dock.css";

if (typeof document !== "undefined") {
  let grokUsageTag = document.querySelector(`style[data-plugin-css="${grokUsageCssId}"]`);
  if (grokUsageTag === null) {
    grokUsageTag = document.createElement("style");
    (grokUsageTag as HTMLElement).dataset.plugin = "dsh-grok-oauth";
    (grokUsageTag as HTMLElement).dataset.pluginCss = grokUsageCssId;
    document.head.appendChild(grokUsageTag);
  }
  grokUsageTag.textContent = grokUsageDockCss;
}

export type GrokUsageSnapshot = {
  status: "idle" | "loading" | "ready" | "unsupported" | "logged-out" | "error";
  usage?: GrokUsageView;
  error?: string;
};

export let grokUsageFetch: (() => Promise<GrokUsageReply>) | null = null;
export let grokUsageSnapshot: GrokUsageSnapshot = { status: "idle" };
export let grokUsageLast: GrokUsageView | undefined = undefined;
let grokUsageLastFetchAt = 0;
let grokUsageInFlight: Promise<GrokUsageSnapshot> | null = null;
export const grokUsageListeners = new Set<() => void>();

export function setGrokUsageFetch(fn: (() => Promise<GrokUsageReply>) | null) {
  grokUsageFetch = fn;
}

export function grokUsageEmit() {
  for (const listener of grokUsageListeners) listener();
}

export function useGrokUsageStore(): GrokUsageSnapshot {
  const [, bump] = useState(0);
  useEffect(() => {
    const onChange = () => bump((n) => n + 1);
    grokUsageListeners.add(onChange);
    return () => {
      grokUsageListeners.delete(onChange);
    };
  }, []);
  return grokUsageSnapshot;
}

export function loadGrokUsage(force?: boolean): Promise<GrokUsageSnapshot> {
  if (grokUsageFetch === null) return Promise.resolve(grokUsageSnapshot);
  if (grokUsageInFlight !== null) return grokUsageInFlight;
  if (
    !force &&
    grokUsageLastFetchAt > 0 &&
    Date.now() - grokUsageLastFetchAt < GROK_USAGE_FOCUS_DEBOUNCE_MS &&
    grokUsageSnapshot.status === "ready"
  ) {
    return Promise.resolve(grokUsageSnapshot);
  }
  grokUsageSnapshot = {
    status: "loading",
    usage: grokUsageLast,
    error: grokUsageSnapshot.status === "error" ? grokUsageSnapshot.error : undefined
  };
  grokUsageEmit();
  grokUsageInFlight = grokUsageFetch().then(
    (read) => {
      grokUsageInFlight = null;
      grokUsageLastFetchAt = Date.now();
      if (read.status === "logged-out") {
        grokUsageLast = undefined;
        grokUsageSnapshot = { status: "logged-out" };
      } else if (read.status === "unsupported") {
        grokUsageSnapshot = {
          status: "unsupported",
          usage: grokUsageLast
        };
      } else {
        grokUsageLast = read.usage;
        grokUsageSnapshot = {
          status: "ready",
          usage: read.usage
        };
      }
      grokUsageEmit();
      return grokUsageSnapshot;
    },
    (error) => {
      grokUsageInFlight = null;
      grokUsageLastFetchAt = Date.now();
      grokUsageSnapshot = {
        status: "error",
        usage: grokUsageLast,
        error: error instanceof Error && error.message.length > 0 ? error.message : "usage failed"
      };
      grokUsageEmit();
      return grokUsageSnapshot;
    }
  );
  return grokUsageInFlight;
}

function grokUsageVisible() {
  return typeof document === "undefined" || document.visibilityState !== "hidden";
}

export function onGrokUsageVisibility() {
  if (grokUsageVisible()) loadGrokUsage(false);
}

export function onGrokUsageFocus() {
  loadGrokUsage(false);
}

export function grokUsageTitle(usage: GrokUsageView, t: (key: keyof LocaleDict) => string): string {
  const view = usagePresentation(usage);
  const parts = [t("usageWindowSuperGrok")];
  if (view.products.length > 0) {
    parts.push(
      view.products.map((product) => `${usageWindowLabelOf(product.id, t)} ${product.used}%`).join(" · ")
    );
  }
  const reset = resetLabelOf(view.total?.resetsAt, usageResetCopy(t));
  if (reset !== undefined) parts.push(reset);
  if (usage.fetchedAt) {
    const stamp = formatUsageClock(new Date(usage.fetchedAt));
    if (stamp) parts.push(t("usageUpdatedAt").replace("{time}", stamp));
  }
  parts.push(t("dockClick"));
  return parts.join("\n");
}

function isBlankComposer(useSession: any) {
  return typeof useSession === "function" && useSession((s: any) => s.composerPhase) === "blank";
}

export interface GrokUsageChipProps {
  t: (key: keyof LocaleDict) => string;
  seat: "dock" | "hero";
  useSession?: any;
}

export function GrokUsageChip(props: GrokUsageChipProps) {
  const t = props.t;
  const blank = isBlankComposer(props.useSession);
  const snapshot = useGrokUsageStore();
  const running = typeof props.useSession === "function" ? props.useSession((s: any) => s.running) : false;
  const prevRunning = useRef(running);

  useEffect(() => {
    if (prevRunning.current === true && running === false) loadGrokUsage(true);
    prevRunning.current = running;
  }, [running]);

  if ((props.seat === "hero") !== blank) return null;
  const usage = snapshot.usage ?? grokUsageLast;
  if (usage === undefined) return null;
  const used = officialUsedPercent(usage);
  if (used === undefined) return null;

  const loading = snapshot.status === "loading" || snapshot.status === "idle";
  const kind = used >= GROK_USAGE_ALERT ? "alert" : used >= GROK_USAGE_WARN ? "warn" : "ready";
  const className = [
    "grok-usage",
    loading ? "is-loading" : "",
    kind === "warn" ? "is-warn" : "",
    kind === "alert" ? "is-alert" : ""
  ]
    .filter(Boolean)
    .join(" ");
  const amount = t("dockUsed").replace("{percent}", String(used));

  return (
    <div className="grok-usage-dock">
      <button
        type="button"
        className={className}
        title={grokUsageTitle(usage, t)}
        aria-label={`${t("usageWindowSuperGrok")} ${amount}`}
        onClick={() => loadGrokUsage(true)}
      >
        <span className="grok-usage-mark">
          <BrandMark size={12} />
        </span>
        <span className="grok-usage-amount">{amount}</span>
      </button>
    </div>
  );
}
