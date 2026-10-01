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

export const grokUsageDockCss = "";

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
  syncGrokToGlobalBus(grokUsageSnapshot);
}

export function syncGrokToGlobalBus(snapshot: GrokUsageSnapshot, t?: (key: keyof LocaleDict) => string): void {
  if (typeof window === "undefined") return;
  const bus = (window as any).__DSH_MODEL_QUOTAS__;
  if (!bus || typeof bus.set !== "function") return;
  const usage = snapshot.usage ?? grokUsageLast;
  if (!usage) return;
  const used = officialUsedPercent(usage);
  if (used === undefined) return;
  const kind = used >= GROK_USAGE_ALERT ? "alert" : used >= GROK_USAGE_WARN ? "warn" : "ready";
  const amount = `${used}% 已使用`;
  const title = typeof t === "function" ? grokUsageTitle(usage, t) : `Grok ${amount}`;
  bus.set("grok", {
    label: amount,
    val: used,
    kind,
    loading: snapshot.status === "loading",
    tooltip: title,
    fetchedAt: usage.fetchedAt,
  });
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
  if (typeof document !== "undefined") {
    const phase = document.querySelector("[data-phase]")?.getAttribute("data-phase");
    if (phase === "hero" || phase === "settling") return true;
    if (phase === "active") return false;
  }
  if (typeof useSession !== "function") return true;
  const snap = useSession((s: any) => s);
  if (snap && typeof snap === "object") {
    if (snap.composerPhase === "blank") return true;
    if (snap.blank === true && snap.promptAttempted !== true) return true;
  }
  return false;
}

export interface GrokUsageChipProps {
  t: (key: keyof LocaleDict) => string;
  seat: "dock" | "hero";
  useSession?: any;
}

export function GrokUsageChip(props: GrokUsageChipProps) {
  const t = props.t ?? ((key: any) => (key === "dockUsed" ? "{percent}% 已用" : key));
  const blank = isBlankComposer(props.useSession);
  const snapshot = useGrokUsageStore();
  const running = typeof props.useSession === "function" ? props.useSession((s: any) => s.running) : false;
  const prevRunning = useRef(running);

  useEffect(() => {
    if (snapshot.status === "idle" || (snapshot.usage === undefined && grokUsageLast === undefined)) {
      void loadGrokUsage(true);
    }
  }, [snapshot.status]);

  useEffect(() => {
    if (prevRunning.current === true && running === false) loadGrokUsage(true);
    prevRunning.current = running;
  }, [running]);

  if ((props.seat === "hero") !== blank) return null;
  const usage = snapshot.usage ?? grokUsageLast;
  if (usage === undefined) {
    if (snapshot.status === "loading" || snapshot.status === "idle") {
      return (
        <div className="grok-usage-dock">
          <button
            type="button"
            className="grok-usage is-loading"
            title="Grok 额度查询中..."
            aria-label="Grok 额度查询中..."
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void loadGrokUsage(true);
            }}
          >
            <span className="grok-usage-mark">
              <BrandMark size={12} />
            </span>
            <span className="grok-usage-amount">...</span>
          </button>
        </div>
      );
    }
    return null;
  }
  const used = officialUsedPercent(usage);
  if (used === undefined) return null;

  const loading = snapshot.status === "loading";
  const kind = used >= GROK_USAGE_ALERT ? "alert" : used >= GROK_USAGE_WARN ? "warn" : "ready";
  const className = [
    "grok-usage",
    loading ? "is-loading" : "",
    kind === "warn" ? "is-warn" : "",
    kind === "alert" ? "is-alert" : ""
  ]
    .filter(Boolean)
    .join(" ");
  const amount = (typeof t === "function" ? t("dockUsed") : "{percent}% 已用").replace("{percent}", String(used));

  return (
    <div className="grok-usage-dock">
      <button
        type="button"
        className={className}
        title={typeof t === "function" ? grokUsageTitle(usage, t) : `Grok ${amount}`}
        aria-label={`${typeof t === "function" ? t("usageWindowSuperGrok") : "SuperGrok"} ${amount}`}
        onMouseDown={(e) => e.preventDefault()}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          loadGrokUsage(true);
        }}
      >
        <span className="grok-usage-mark">
          <BrandMark size={12} />
        </span>
        <span className="grok-usage-amount">{amount}</span>
      </button>
    </div>
  );
}
