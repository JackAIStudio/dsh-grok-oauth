import React, { useSyncExternalStore } from "react";
import type { GrokCatalogModel } from "../../common/contract.js";
import type { LocaleDict } from "../locales.js";

export interface GrokModelPickerSnapshot {
  open: boolean;
  loading: boolean;
  candidates: GrokCatalogModel[];
  picked: Set<string>;
  error?: string;
}

export class GrokModelPickerController {
  snapshot: GrokModelPickerSnapshot = {
    open: false,
    loading: false,
    candidates: [],
    picked: new Set()
  };
  listeners = new Set<() => void>();
  onAdopt?: (selected: GrokCatalogModel[]) => void;

  getSnapshot = () => this.snapshot;

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  begin(onAdopt: (selected: GrokCatalogModel[]) => void, initiallyPicked: Set<string> = new Set()) {
    this.onAdopt = onAdopt;
    this.publish({
      open: true,
      loading: true,
      candidates: [],
      picked: new Set(initiallyPicked)
    });
  }

  complete(candidates: GrokCatalogModel[]) {
    if (!this.snapshot.open || !this.snapshot.loading) return;
    const candidateIds = new Set(candidates.map((model) => model.id));
    this.publish({
      open: true,
      loading: false,
      candidates: [...candidates],
      picked: new Set([...this.snapshot.picked].filter((id) => candidateIds.has(id)))
    });
  }

  fail(message: string) {
    if (!this.snapshot.open || !this.snapshot.loading) return;
    this.publish({
      open: true,
      loading: false,
      candidates: [],
      picked: new Set(),
      error: message
    });
  }

  close = () => {
    this.onAdopt = undefined;
    this.publish({
      open: false,
      loading: false,
      candidates: [],
      picked: new Set()
    });
  };

  toggle = (id: string) => {
    const picked = new Set(this.snapshot.picked);
    if (picked.has(id)) picked.delete(id);
    else picked.add(id);
    this.publish({
      ...this.snapshot,
      picked
    });
  };

  adopt = () => {
    if (this.snapshot.loading || this.snapshot.error !== undefined) return;
    const callback = this.onAdopt;
    const selected = this.snapshot.candidates.filter((model) => this.snapshot.picked.has(model.id));
    this.close();
    callback?.(selected);
  };

  private publish(snapshot: GrokModelPickerSnapshot) {
    this.snapshot = snapshot;
    for (const listener of this.listeners) listener();
  }
}

const rootStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 1000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  padding: 24
};

const maskStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  background: "var(--dsw-alias-bg-mask-1)",
  backdropFilter: "var(--dsw-mask-blur)"
};

const dialogStyle: React.CSSProperties = {
  position: "relative",
  zIndex: 1,
  display: "flex",
  flexDirection: "column",
  width: "min(520px, 100%)",
  maxHeight: "min(680px, calc(100vh - 48px))",
  overflow: "hidden",
  border: "1px solid var(--dsw-alias-border-inverted)",
  borderRadius: 24,
  background: "var(--dsw-alias-bg-layer-2)",
  boxShadow: "var(--dsw-shadow-lv3)",
  color: "var(--dsw-alias-label-primary)"
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  padding: "22px 14px 12px 24px"
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 16,
  lineHeight: "24px",
  fontWeight: 500
};

const closeStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 28,
  height: 28,
  border: 0,
  borderRadius: 8,
  background: "transparent",
  color: "var(--dsw-alias-label-secondary)",
  cursor: "pointer",
  fontSize: 22
};

const descriptionStyle: React.CSSProperties = {
  margin: 0,
  padding: "0 24px",
  fontSize: 14,
  lineHeight: "22px",
  color: "var(--dsw-alias-label-primary)"
};

const listStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 14,
  minHeight: 0,
  margin: "20px 24px",
  padding: 0,
  overflowY: "auto",
  listStyle: "none"
};

const candidateStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  fontSize: 14,
  lineHeight: "22px",
  cursor: "pointer"
};

const statusStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  minHeight: 96,
  margin: "20px 24px",
  fontSize: 14,
  lineHeight: "22px",
  color: "var(--dsw-alias-label-secondary)"
};

const errorStyle: React.CSSProperties = {
  ...statusStyle,
  color: "var(--dsw-alias-state-error-primary)"
};

const footerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: 8,
  padding: "0 24px 24px"
};

const outlineButtonStyle: React.CSSProperties = {
  height: 36,
  padding: "0 14px",
  border: "1px solid var(--dsw-alias-border-l2)",
  borderRadius: 18,
  background: "transparent",
  color: "var(--dsw-alias-label-primary)",
  cursor: "pointer",
  fontSize: 14
};

const solidButtonStyle: React.CSSProperties = {
  ...outlineButtonStyle,
  border: 0,
  background: "var(--dsw-alias-state-business-primary)",
  color: "var(--dsw-alias-state-business-primary-foreground)"
};

export interface GrokModelPickerProps {
  t: (key: keyof LocaleDict) => string;
  hooks: { grokModelPicker: GrokModelPickerController };
  closePicker: () => void;
  togglePickerModel: (id: string) => void;
  adoptPickerModels: () => void;
}

export function GrokModelPicker(props: GrokModelPickerProps) {
  const { t, hooks, closePicker, togglePickerModel, adoptPickerModels } = props;
  const snapshot = useSyncExternalStore(hooks.grokModelPicker.subscribe, hooks.grokModelPicker.getSnapshot);
  if (!snapshot.open) return null;
  return (
    <div style={rootStyle} role="dialog" aria-modal="true">
      <div style={maskStyle} onClick={closePicker} />
      <div style={dialogStyle}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>{t("pickerTitle")}</h2>
          <button type="button" style={closeStyle} onClick={closePicker} aria-label={t("close")}>
            ×
          </button>
        </div>
        <p style={descriptionStyle}>{t("pickerDescription")}</p>
        {snapshot.loading ? (
          <div style={statusStyle}>{t("pickerLoading")}</div>
        ) : snapshot.error !== undefined ? (
          <div style={errorStyle}>{snapshot.error}</div>
        ) : snapshot.candidates.length === 0 ? (
          <div style={statusStyle}>{t("fetchEmpty")}</div>
        ) : (
          <ul style={listStyle}>
            {snapshot.candidates.map((model) => (
              <li key={model.id}>
                <label style={candidateStyle}>
                  <input
                    type="checkbox"
                    checked={snapshot.picked.has(model.id)}
                    onChange={() => togglePickerModel(model.id)}
                  />
                  <span>{model.name ?? model.id}</span>
                </label>
              </li>
            ))}
          </ul>
        )}
        <div style={footerStyle}>
          <button type="button" style={outlineButtonStyle} onClick={closePicker}>
            {t("cancel")}
          </button>
          <button
            type="button"
            style={solidButtonStyle}
            disabled={snapshot.loading || snapshot.error !== undefined}
            onClick={adoptPickerModels}
          >
            {t("applySelected")}
          </button>
        </div>
      </div>
    </div>
  );
}
