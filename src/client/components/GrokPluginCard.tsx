import React, { useEffect, useMemo, useState } from "react";
import type {
  GrokAccountUsageView,
  GrokAuthAccountView,
  GrokAuthLogoutReply,
  GrokAuthStartReply,
  GrokAuthStatus,
  GrokCatalogModel,
  GrokSaveResult,
  GrokSettings,
  GrokUsageReply,
  GrokUsageView
} from "../../common/contract.js";
import { officialDefaultEffort, officialEffortsFor } from "../../common/reasoning.js";
import type { LocaleDict } from "../locales.js";
import { BrandMark } from "./BrandMark.js";
import { SortableList } from "./SortableList.js";
import { IconChevron, IconTrash } from "./Icons.js";
import {
  formatUsageClock,
  UsageHeader,
  UsageSkeleton,
  UsageUpdatedAt
} from "./UsageElements.js";
import {
  accountLabelOf,
  AccountList,
  accountUsageCaption,
  accountUsageOf,
  renderAccountsUsage
} from "./AccountList.js";
import { loadGrokUsage } from "./UsageChip.js";

const cardStyle: React.CSSProperties = {
  overflow: "hidden",
  border: "1px solid var(--dsw-alias-border-l2)",
  borderRadius: 10,
  background: "var(--dsw-alias-bg-module-platform)"
};

const staticHeaderStyle: React.CSSProperties = {
  boxSizing: "border-box",
  width: "100%",
  minHeight: 68,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  border: 0,
  padding: "12px 14px",
  background: "transparent",
  color: "var(--dsw-alias-label-primary)",
  font: "inherit",
  textAlign: "left",
  cursor: "default"
};

const bodyStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 18,
  borderTop: "1px solid var(--dsw-alias-border-l2)",
  padding: "16px 14px 18px"
};

const sectionStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12
};

const sectionTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 14,
  lineHeight: "20px",
  fontWeight: 600,
  color: "var(--dsw-alias-label-primary)"
};

const hintStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 12,
  color: "var(--dsw-alias-label-tertiary)"
};

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  color: "var(--dsw-alias-label-secondary)"
};

const statusStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 13,
  color: "var(--dsw-alias-label-secondary)"
};

const errorStyle: React.CSSProperties = {
  ...statusStyle,
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

const primaryButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  borderColor: "var(--dsw-alias-button-primary-fill)",
  background: "var(--dsw-alias-button-primary-fill)",
  color: "var(--dsw-alias-label-primary-foreground)"
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

const inputStyle: React.CSSProperties = {
  boxSizing: "border-box",
  width: "100%",
  minHeight: 36,
  border: "1px solid var(--dsw-alias-border-l2)",
  borderRadius: 8,
  padding: "7px 10px",
  background: "var(--dsw-alias-bg-layer-1)",
  color: "var(--dsw-alias-label-primary)",
  font: "inherit"
};

const rowInputStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: 32,
  padding: "4px 10px"
};

const actionsStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: 10
};

const iconButtonStyle: React.CSSProperties = {
  boxSizing: "border-box",
  width: 28,
  height: 28,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flex: "none",
  border: 0,
  borderRadius: 6,
  padding: 0,
  background: "transparent",
  color: "var(--dsw-alias-label-tertiary)",
  font: "inherit",
  cursor: "pointer"
};

const disclosureStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  minWidth: 0,
  border: 0,
  padding: 0,
  background: "transparent",
  color: "var(--dsw-alias-label-primary)",
  font: "inherit",
  textAlign: "left",
  cursor: "pointer"
};

const modelContentStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr) auto auto",
  alignItems: "center",
  gap: 6,
  padding: "6px 8px"
};

const modelDetailStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 14,
  borderTop: "1px solid var(--dsw-alias-border-l2)",
  padding: "10px 4px 4px"
};

let nextModelRow = 0;
function newModelRowId(): string {
  nextModelRow += 1;
  return `grok-model-row-${String(nextModelRow)}`;
}

function integerOf(text: string): number | undefined {
  const trimmed = text.trim();
  if (trimmed.length === 0) return undefined;
  if (!/^[1-9]\d*$/u.test(trimmed)) return NaN;
  return Number(trimmed);
}

export interface ModelDraft {
  rowId: string;
  id: string;
  name?: string;
  thinking?: boolean;
  vision?: boolean;
  defaultReasoningEffort?: string;
  contextWindow: string;
  reasoningEfforts?: readonly any[] | any[];
}

function modelDraftOf(model: GrokCatalogModel): ModelDraft {
  return {
    rowId: newModelRowId(),
    id: model.id,
    contextWindow: model.contextWindow === undefined ? "" : String(model.contextWindow),
    ...(model.name === undefined ? {} : { name: model.name }),
    ...(model.thinking === undefined ? {} : { thinking: model.thinking }),
    ...(model.vision === undefined ? {} : { vision: model.vision }),
    ...(model.defaultReasoningEffort === undefined ? {} : { defaultReasoningEffort: model.defaultReasoningEffort }),
    ...(model.reasoningEfforts === undefined ? {} : { reasoningEfforts: model.reasoningEfforts })
  };
}

function modelSettingsOf(draft: ModelDraft): GrokCatalogModel {
  const contextWindow = integerOf(draft.contextWindow);
  return {
    id: draft.id.trim(),
    ...(draft.name === undefined || draft.name.trim().length === 0 ? {} : { name: draft.name.trim() }),
    ...(draft.thinking === undefined ? {} : { thinking: draft.thinking }),
    ...(draft.vision === undefined ? {} : { vision: draft.vision }),
    ...(draft.defaultReasoningEffort === undefined ? {} : { defaultReasoningEffort: draft.defaultReasoningEffort }),
    ...(contextWindow === undefined || Number.isNaN(contextWindow) ? {} : { contextWindow }),
    ...(draft.reasoningEfforts === undefined ? {} : { reasoningEfforts: draft.reasoningEfforts })
  };
}

function sameDraft(left: ModelDraft[], right: ModelDraft[]): boolean {
  return JSON.stringify(left.map(modelSettingsOf)) === JSON.stringify(right.map(modelSettingsOf));
}

function modelFailure(models: ModelDraft[]): boolean {
  const ids = new Set<string>();
  for (const model of models) {
    const id = model.id.trim();
    if (id.length === 0 || ids.has(id)) return true;
    if (Number.isNaN(integerOf(model.contextWindow))) return true;
    ids.add(id);
  }
  return false;
}

function formatSignedIn(t: (key: keyof LocaleDict) => string, email?: string): string {
  if (email === undefined) return t("signedInNoEmail");
  return t("signedInAs").replace("{email}", email);
}

function formatProviderSummary(...parts: (string | undefined)[]): string {
  return parts
    .filter((part): part is string => typeof part === "string" && part.length > 0)
    .map((part) => part.replace(/[。.]$/u, ""))
    .join(" · ");
}

function ProviderCardHeader({
  title,
  mark,
  summary,
  unsaved,
  unsavedLabel
}: {
  title: string;
  mark: React.ReactNode;
  summary: string;
  unsaved?: boolean;
  unsavedLabel?: string;
}) {
  return (
    <>
      <span style={{ display: "flex", minWidth: 0, flex: 1, flexDirection: "column", gap: 4 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600, lineHeight: 1 }}>
          <span style={{ width: 18, height: 18, flex: "none", display: "block", overflow: "visible" }}>{mark}</span>
          <span style={{ lineHeight: "20px" }}>{title}</span>
        </span>
        <span
          style={{
            fontSize: 13,
            lineHeight: "18px",
            color: "var(--dsw-alias-label-tertiary)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis"
          }}
        >
          {summary}
        </span>
      </span>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 10, flex: "none" }}>
        {unsaved === true && unsavedLabel !== undefined ? (
          <span style={{ fontSize: 12, color: "var(--dsw-alias-label-tertiary)" }}>{unsavedLabel}</span>
        ) : null}
      </span>
    </>
  );
}

function AuthToolbar({ status, action }: { status: React.ReactNode; action: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <div style={{ minWidth: 0, flex: 1 }}>{status}</div>
      <div style={{ flex: "none" }}>{action}</div>
    </div>
  );
}

function Capability({
  label,
  checked,
  disabled,
  onChange
}: {
  label: string;
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label style={{ ...labelStyle, display: "inline-flex", alignItems: "center", gap: 6 }}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => {
          onChange(event.target.checked);
        }}
      />
      {label}
    </label>
  );
}

function messageOf(error: unknown, fallback: string): string {
  return error instanceof Error && error.message.length > 0 ? error.message : fallback;
}

type AuthState =
  | { kind: "signed-in"; email?: string; activeAccountId?: string; accounts: GrokAuthAccountView[]; message?: string }
  | { kind: "signing-in"; email?: string; activeAccountId?: string; accounts: GrokAuthAccountView[] }
  | { kind: "signed-out"; message?: string; accounts: GrokAuthAccountView[] };

function authFromStatus(status: GrokAuthStatus, fallback?: string): AuthState {
  if (status.loggedIn) {
    return {
      kind: "signed-in",
      ...(status.email === undefined ? {} : { email: status.email }),
      ...(status.activeAccountId === undefined ? {} : { activeAccountId: status.activeAccountId }),
      accounts: status.accounts ?? []
    };
  }
  return {
    kind: "signed-out",
    ...(fallback === undefined ? {} : { message: fallback }),
    accounts: status.accounts ?? []
  };
}

function signedOutAuth(message?: string, accounts?: GrokAuthAccountView[]): AuthState {
  return {
    kind: "signed-out",
    ...(message === undefined ? {} : { message }),
    accounts: accounts ?? []
  };
}

function signingInAuth(current?: AuthState): AuthState {
  const accounts = current?.accounts ?? [];
  const email = current && "email" in current ? current.email : undefined;
  const activeAccountId = current && "activeAccountId" in current ? current.activeAccountId : undefined;
  return {
    kind: "signing-in",
    ...(email === undefined ? {} : { email }),
    ...(activeAccountId === undefined ? {} : { activeAccountId }),
    accounts
  };
}

function restoreAuthAfterSignIn(current: AuthState, message?: string): AuthState {
  const accounts = current.accounts ?? [];
  const active = accounts.find((account) => account.active === true);
  if (active === undefined) return signedOutAuth(message, accounts);
  return {
    kind: "signed-in",
    ...(active.email === undefined ? {} : { email: active.email }),
    activeAccountId: active.id,
    accounts,
    message
  };
}

function applyAuthStatus(status: GrokAuthStatus, setAuth: React.Dispatch<React.SetStateAction<AuthState>>, extras?: { onSignedOut?: () => void }): AuthState {
  const next = authFromStatus(status);
  setAuth(next);
  if (next.kind !== "signed-in") {
    extras?.onSignedOut?.();
  }
  return next;
}

export interface GrokPluginCardProps {
  t: (key: keyof LocaleDict) => string;
  useGrokSettings: (selector: (state: any) => any) => any;
  startAuth: () => Promise<GrokAuthStartReply>;
  completeAuth: (code: string) => Promise<GrokAuthStartReply>;
  readAuthStatus: () => Promise<GrokAuthStatus>;
  logout: (accountId?: string) => Promise<GrokAuthLogoutReply>;
  switchAccount: (accountId: string) => Promise<any>;
  removeAccount: (accountId: string) => Promise<any>;
  fetchUsage: () => Promise<GrokUsageReply>;
  fetchAllUsage: () => Promise<any>;
  fetchModels: () => Promise<GrokCatalogModel[]>;
  saveConfiguration: (settings: GrokSettings) => Promise<GrokSaveResult>;
  beginModelPicker: (initiallyPicked: Set<string>, onAdopt: (selected: GrokCatalogModel[]) => void) => void;
  completeModelPicker: (candidates: GrokCatalogModel[]) => void;
  failModelPicker: (message: string) => void;
  closeModelPicker: () => void;
}

export function GrokPluginCard(props: GrokPluginCardProps) {
  const {
    t,
    startAuth,
    completeAuth,
    readAuthStatus,
    logout,
    switchAccount,
    removeAccount,
    fetchAllUsage,
    fetchModels
  } = props;
  const snapshot = props.useGrokSettings((value: any) => value);

  const initial = useMemo(
    () => (snapshot.value === undefined ? undefined : snapshot.value.models.map(modelDraftOf)),
    [snapshot.value]
  );
  const [source, setSource] = useState<ModelDraft[] | undefined>(initial);
  const [draft, setDraft] = useState<ModelDraft[] | undefined>(initial);
  const [sourceRevision, setSourceRevision] = useState(snapshot.revision);
  const [auth, setAuth] = useState<AuthState>({ kind: "signed-out", accounts: [] });
  const [pasteCode, setPasteCode] = useState("");
  const [usage, setUsage] = useState<{ status: string; accounts?: GrokAccountUsageView[]; message?: string }>({
    status: "idle"
  });
  const [lastAccounts, setLastAccounts] = useState<GrokAccountUsageView[] | undefined>(undefined);
  const [usageUpdatedAt, setUsageUpdatedAt] = useState<Date | undefined>(undefined);
  const [enableImageGen, setEnableImageGen] = useState(snapshot.value?.enableImageGen === true);
  const [sourceEnableImageGen, setSourceEnableImageGen] = useState(snapshot.value?.enableImageGen === true);
  const [serverSearch, setServerSearch] = useState(snapshot.value?.serverSearch === true);
  const [sourceServerSearch, setSourceServerSearch] = useState(snapshot.value?.serverSearch === true);
  const [proxy, setProxy] = useState(snapshot.value?.proxy ?? "");
  const [sourceProxy, setSourceProxy] = useState(snapshot.value?.proxy ?? "");
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [expandedModels, setExpandedModels] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [failure, setFailure] = useState<string | undefined>(undefined);
  const [notice, setNotice] = useState<string | undefined>(undefined);

  const title = t("title");
  const signingIn = auth.kind === "signing-in";
  const disabled = snapshot.status !== "ready" || !snapshot.writable || busy;
  const dirty =
    (source !== undefined && draft !== undefined && !sameDraft(source, draft)) ||
    enableImageGen !== sourceEnableImageGen ||
    serverSearch !== sourceServerSearch ||
    proxy !== sourceProxy;
  const invalid = draft !== undefined && modelFailure(draft);
  const customModels = snapshot.user !== undefined && Object.prototype.hasOwnProperty.call(snapshot.user, "models");

  useEffect(() => {
    if (snapshot.status !== "ready" || snapshot.value === undefined) return;
    if (snapshot.revision === sourceRevision) return;
    if (dirty) return;
    const next = snapshot.value.models.map(modelDraftOf);
    setSource(next);
    setDraft(next);
    setEnableImageGen(snapshot.value.enableImageGen);
    setSourceEnableImageGen(snapshot.value.enableImageGen);
    setServerSearch(snapshot.value.serverSearch === true);
    setSourceServerSearch(snapshot.value.serverSearch === true);
    setProxy(snapshot.value.proxy ?? "");
    setSourceProxy(snapshot.value.proxy ?? "");
    setSourceRevision(snapshot.revision);
  }, [dirty, snapshot.revision, snapshot.status, snapshot.value, sourceRevision]);

  useEffect(() => () => {
    props.closeModelPicker();
  }, [props.closeModelPicker]);

  const loadUsage = async () => {
    setUsage((current) => ({
      status: "loading",
      ...(current.accounts === undefined ? {} : { accounts: current.accounts })
    }));
    try {
      const read = await fetchAllUsage();
      if (read.status === "logged-out") {
        setAuth((current) => signedOutAuth(undefined, current.accounts));
        setLastAccounts(undefined);
        setUsageUpdatedAt(undefined);
        setUsage({ status: "idle" });
        return;
      }
      setLastAccounts(read.accounts);
      setUsageUpdatedAt(new Date());
      setUsage({
        status: "ready",
        accounts: read.accounts
      });
    } catch (error) {
      setUsage((current) => ({
        status: "error",
        message: messageOf(error, t("usageFailed")),
        ...(current.accounts === undefined ? {} : { accounts: current.accounts })
      }));
    }
  };

  const clearUsage = () => {
    setLastAccounts(undefined);
    setUsageUpdatedAt(undefined);
    setUsage({ status: "idle" });
  };

  useEffect(() => {
    let cancelled = false;
    readAuthStatus()
      .then((status) => {
        if (cancelled) return;
        const next = applyAuthStatus(status, setAuth);
        if (next.kind !== "signed-in") clearUsage();
      })
      .catch(() => {
        if (!cancelled) {
          setAuth(signedOutAuth(t("statusFailed")));
          clearUsage();
        }
      });
    return () => {
      cancelled = true;
    };
  }, [readAuthStatus, t]);

  const authEmail = "email" in auth ? auth.email : undefined;
  const authActiveAccountId = "activeAccountId" in auth ? auth.activeAccountId : undefined;

  useEffect(() => {
    if (
      (auth.kind !== "signed-in" && auth.kind !== "signing-in") ||
      (auth.kind === "signing-in" && authActiveAccountId === undefined)
    )
      return;
    setUsage({ status: "loading" });
    loadUsage();
  }, [auth.kind, authActiveAccountId]);

  const patchDraft = (models: ModelDraft[]) => {
    setDraft(models);
    setFailure(undefined);
    setNotice(undefined);
  };

  const patchModel = (index: number, patch: Partial<ModelDraft>) => {
    if (draft === undefined) return;
    patchDraft(
      draft.map((model, at) => {
        if (at !== index) return model;
        const next = { ...model };
        if (patch.id !== undefined) next.id = patch.id;
        if ("name" in patch) {
          if (patch.name === undefined) delete next.name;
          else next.name = patch.name;
        }
        if ("thinking" in patch) {
          if (patch.thinking === undefined) delete next.thinking;
          else next.thinking = patch.thinking;
        }
        if ("vision" in patch) {
          if (patch.vision === undefined) delete next.vision;
          else next.vision = patch.vision;
        }
        if ("defaultReasoningEffort" in patch) {
          if (patch.defaultReasoningEffort === undefined) delete next.defaultReasoningEffort;
          else next.defaultReasoningEffort = patch.defaultReasoningEffort;
        }
        if ("contextWindow" in patch) next.contextWindow = patch.contextWindow ?? "";
        return next;
      })
    );
  };

  const onSignIn = async () => {
    if (proxy !== sourceProxy && snapshot.value !== undefined) {
      try {
        const accepted = await props.saveConfiguration({
          ...snapshot.value,
          proxy
        });
        setProxy(accepted.settings.proxy ?? "");
        setSourceProxy(accepted.settings.proxy ?? "");
        setSourceRevision(accepted.revision);
        setNotice(t("proxyAutoSaved"));
      } catch {}
    }
    setAuth((current) => signingInAuth(current));
    setPasteCode("");
    if ((auth.accounts?.length ?? 0) === 0) setUsage({ status: "idle" });
    try {
      const started = await startAuth();
      if (!started.ok) {
        const message = (started as any).message || t("signInFailed");
        setFailure(message);
        setAuth((current) => restoreAuthAfterSignIn(current, message));
        return;
      }
      const status = await readAuthStatus();
      const next = applyAuthStatus(status, setAuth, { onSignedOut: clearUsage });
      setFailure(undefined);
      const nextEmail = "email" in next ? next.email : undefined;
      if (started.reused === true) {
        setNotice(t("accountReused").replace("{email}", started.email ?? nextEmail ?? ""));
      } else if (next.kind === "signed-in") {
        setNotice(t("accountAdded").replace("{email}", nextEmail ?? ""));
      }
      loadGrokUsage(true);
    } catch {
      const message = t("signInFailed");
      setFailure(message);
      setAuth((current) => restoreAuthAfterSignIn(current, message));
    }
  };

  const onPasteCode = async () => {
    const code = pasteCode.trim();
    if (code.length === 0) {
      setAuth((current) => signingInAuth(current));
      return;
    }
    try {
      if (!(await completeAuth(code)).ok) setAuth((current) => signingInAuth(current));
    } catch {
      setAuth((current) => signingInAuth(current));
    }
  };

  const onSwitchAccount = async (accountId: string) => {
    try {
      const result = await switchAccount(accountId);
      if (!result.ok) {
        setFailure(result.message || t("switchFailed"));
        return;
      }
      const status = result.status ?? (await readAuthStatus());
      applyAuthStatus(status, setAuth, { onSignedOut: clearUsage });
      setNotice(t("accountSwitched").replace("{email}", status.email ?? ""));
      setLastAccounts((current) =>
        current === undefined
          ? current
          : current.map((entry) => ({
              ...entry,
              active: entry.accountId === accountId
            }))
      );
      setUsage((current) => {
        const accounts = current.accounts ?? lastAccounts;
        if (accounts === undefined) return { status: "loading" };
        return {
          status: "ready",
          accounts: accounts.map((entry) => ({
            ...entry,
            active: entry.accountId === accountId
          }))
        };
      });
      loadGrokUsage(true);
      await loadUsage();
    } catch (error) {
      setFailure(messageOf(error, t("switchFailed")));
    }
  };

  const onRemoveAccount = async (accountId: string) => {
    try {
      const result = await removeAccount(accountId);
      if (!result.ok) {
        setFailure(result.message || t("removeFailed"));
        return;
      }
      const status = result.status ?? (await readAuthStatus());
      const next = applyAuthStatus(status, setAuth, { onSignedOut: clearUsage });
      if (next.kind === "signed-in") {
        setLastAccounts(undefined);
        setUsageUpdatedAt(undefined);
        setUsage({ status: "loading" });
        await loadUsage();
        loadGrokUsage(true);
      } else {
        clearUsage();
        loadGrokUsage(true);
      }
    } catch (error) {
      setFailure(messageOf(error, t("removeFailed")));
    }
  };

  const chooseFromAccount = async () => {
    if (draft === undefined) return;
    const currentModels = draft.map(modelSettingsOf);
    const initiallyPicked = new Set(currentModels.map((model) => model.id));
    setFetching(true);
    setFailure(undefined);
    setNotice(undefined);
    props.beginModelPicker(initiallyPicked, (selected) => {
      setDraft((current) => {
        if (current === undefined) return current;
        const currentById = new Map(current.map((model) => [model.id.trim(), model]));
        const next = new Map<string, ModelDraft>();
        for (const candidate of selected) {
          const existing = currentById.get(candidate.id);
          const discovered = modelDraftOf(candidate);
          next.set(
            candidate.id,
            existing === undefined
              ? discovered
              : {
                  ...existing,
                  ...discovered,
                  rowId: existing.rowId
                }
          );
        }
        return [...next.values()];
      });
      setCatalogOpen(true);
      setFailure(undefined);
      setNotice(undefined);
    });
    try {
      const found = await fetchModels();
      if (found.length === 0) {
        const message = t("fetchEmpty");
        props.failModelPicker(message);
        setFailure(message);
        return;
      }
      const foundIds = new Set(found.map((model) => model.id));
      const currentOnly = currentModels.filter((model) => !foundIds.has(model.id));
      props.completeModelPicker([...found, ...currentOnly]);
    } catch (error) {
      const message = messageOf(error, t("requestFailed"));
      props.failModelPicker(message);
      setFailure(message);
    } finally {
      setFetching(false);
    }
  };

  const discard = () => {
    if (source !== undefined) setDraft(source.map((model) => ({ ...model })));
    setEnableImageGen(sourceEnableImageGen);
    setServerSearch(sourceServerSearch);
    setProxy(sourceProxy);
    setFailure(undefined);
    setNotice(undefined);
  };

  const save = async () => {
    if (draft === undefined || snapshot.value === undefined || invalid) return;
    setBusy(true);
    setFailure(undefined);
    setNotice(undefined);
    try {
      const accepted = await props.saveConfiguration({
        ...snapshot.value,
        models: draft.map(modelSettingsOf),
        enableImageGen,
        serverSearch,
        proxy
      });
      const next = accepted.settings.models.map(modelDraftOf);
      setSource(next);
      setDraft(next);
      setEnableImageGen(accepted.settings.enableImageGen);
      setSourceEnableImageGen(accepted.settings.enableImageGen);
      setServerSearch(accepted.settings.serverSearch === true);
      setSourceServerSearch(accepted.settings.serverSearch === true);
      setProxy(accepted.settings.proxy ?? "");
      setSourceProxy(accepted.settings.proxy ?? "");
      setSourceRevision(accepted.revision);
      setNotice(t("saved"));
    } catch (error) {
      setFailure(messageOf(error, t("requestFailed")));
    } finally {
      setBusy(false);
    }
  };

  const savedAccounts = auth.accounts ?? [];
  const usageAccounts = usage.accounts ?? lastAccounts;
  const accountCount = savedAccounts.length;
  const statusLabel = signingIn
    ? t("signingIn")
    : auth.kind === "signed-in"
    ? formatSignedIn(t, auth.email)
    : auth.message ?? t("signedOut");
  const modelCount = draft?.length ?? 0;
  const headerSummary = formatProviderSummary(
    auth.kind === "signed-in" || accountCount > 0 ? t("summaryOn") : t("summaryOff"),
    t("summaryAccounts").replace("{count}", String(accountCount)),
    t("summaryModels").replace("{count}", String(modelCount))
  );

  if (snapshot.status === "unavailable") {
    return (
      <li style={cardStyle}>
        <div style={staticHeaderStyle}>
          <ProviderCardHeader title={title} mark={<BrandMark />} summary={headerSummary} />
        </div>
        <div style={bodyStyle}>
          <p style={statusStyle} role="status">
            {t("remoteAccess")}
          </p>
        </div>
      </li>
    );
  }

  if (snapshot.status !== "ready" || draft === undefined) {
    return (
      <li style={cardStyle}>
        <div style={staticHeaderStyle}>
          <ProviderCardHeader title={title} mark={<BrandMark />} summary={headerSummary} />
        </div>
        <div style={bodyStyle}>
          <p style={statusStyle}>{t("loading")}</p>
        </div>
      </li>
    );
  }

  return (
    <li style={cardStyle}>
      <div style={staticHeaderStyle}>
        <ProviderCardHeader
          title={title}
          mark={<BrandMark />}
          summary={headerSummary}
          unsaved={dirty}
          unsavedLabel={t("unsaved")}
        />
      </div>
      <div style={bodyStyle}>
        <p style={hintStyle}>{t("description")}</p>
        <section style={sectionStyle} aria-label={t("accounts")}>
          <AuthToolbar
            status={<p style={{ ...statusStyle, margin: 0 }}>{statusLabel}</p>}
            action={
              <button
                type="button"
                style={buttonStyle}
                disabled={signingIn}
                onClick={() => {
                  onSignIn();
                }}
              >
                {t(accountCount > 0 ? "addAccount" : "signIn")}
              </button>
            }
          />
          {savedAccounts.length > 0 ? (
            <div style={accountListStyle}>
              {savedAccounts.map((account) => (
                <div key={account.id} style={accountRowStyle}>
                  <div style={accountMetaStyle}>
                    <div style={{ ...statusStyle, margin: 0, color: "var(--dsw-alias-label-primary)" }}>
                      {accountLabelOf(account)}
                    </div>
                    {(() => {
                      const caption = accountUsageCaption(accountUsageOf(usageAccounts, account.id), t);
                      if (!account.active && caption === undefined) return null;
                      return (
                        <div style={{ ...hintStyle, display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {account.active ? <span>{t("accountActive")}</span> : null}
                          {caption === undefined ? null : <span style={{ color: caption.color }}>{caption.text}</span>}
                        </div>
                      );
                    })()}
                  </div>
                  <div style={{ display: "flex", gap: 8, flex: "none" }}>
                    {account.active ? null : (
                      <button
                        type="button"
                        style={quietButtonStyle}
                        disabled={signingIn}
                        onClick={() => {
                          onSwitchAccount(account.id);
                        }}
                      >
                        {t("useAccount")}
                      </button>
                    )}
                    <button
                      type="button"
                      style={quietButtonStyle}
                      disabled={signingIn}
                      onClick={() => {
                        onRemoveAccount(account.id);
                      }}
                    >
                      {t("removeAccount")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={hintStyle}>{t("accountsEmpty")}</p>
          )}
          <p style={hintStyle}>{t("accountsHelp")}</p>
          {auth.kind === "signing-in" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <p style={hintStyle}>{t("pasteCode")}</p>
              <label style={labelStyle} htmlFor="grok-oauth-code">
                {t("pasteCodeLabel")}
              </label>
              <input
                id="grok-oauth-code"
                style={inputStyle}
                value={pasteCode}
                autoComplete="off"
                spellCheck={false}
                aria-label={t("pasteCodeLabel")}
                onChange={(event) => {
                  setPasteCode(event.target.value);
                }}
              />
              <button
                type="button"
                style={buttonStyle}
                disabled={pasteCode.trim().length === 0}
                onClick={() => {
                  onPasteCode();
                }}
              >
                {t("pasteCodeSubmit")}
              </button>
            </div>
          ) : null}
        </section>

        {auth.kind === "signed-in" || authActiveAccountId !== undefined ? (
          <section style={sectionStyle} aria-label={t("usage")}>
            <UsageHeader
              title={t("usage")}
              spinning={usage.status === "loading" || usage.status === "idle"}
              disabled={usage.status === "loading"}
              refreshLabel={t("usageRefresh")}
              busyLabel={t("usageLoading")}
              {...(usage.status === "error" ? { error: t("usageRefreshFailed") } : {})}
              onRefresh={() => {
                loadUsage();
              }}
            />
            {(() => {
              if (usageAccounts !== undefined) {
                return (
                  <>
                    {renderAccountsUsage(usageAccounts, t)}
                    {usage.status === "error" ? <p style={errorStyle}>{usage.message}</p> : null}
                  </>
                );
              }
              if (usage.status === "loading" || usage.status === "idle") {
                return <UsageSkeleton rows={(usageAccounts?.length ?? 0) > 1 ? 2 : 1} />;
              }
              if (usage.status === "unsupported") return <p style={hintStyle}>{t("usageUnsupported")}</p>;
              if (usage.status === "error") return <p style={errorStyle}>{usage.message}</p>;
              return <UsageSkeleton rows={1} />;
            })()}
            <UsageUpdatedAt
              at={usageUpdatedAt}
              label={usageUpdatedAt === undefined ? "" : t("usageUpdatedAt").replace("{time}", formatUsageClock(usageUpdatedAt))}
            />
          </section>
        ) : null}

        <section style={sectionStyle} aria-label={t("models")}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <button
              type="button"
              style={disclosureStyle}
              aria-expanded={catalogOpen}
              aria-label={t("models")}
              onClick={() => {
                setCatalogOpen(!catalogOpen);
              }}
            >
              <IconChevron open={catalogOpen} />
              <span style={sectionTitleStyle}>{t("models")}</span>
              <span style={hintStyle}>{customModels ? t("customized") : t("inherited")}</span>
            </button>
            <button
              type="button"
              style={buttonStyle}
              disabled={fetching || disabled}
              onClick={() => {
                chooseFromAccount();
              }}
            >
              {t(fetching ? "fetchingModels" : "fetchModels")}
            </button>
          </div>
          {catalogOpen ? (
            <>
              <SortableList
                items={draft}
                getId={(model) => model.rowId}
                disabled={disabled}
                dragLabel={(model, index) => {
                  const label = model.id.trim().length > 0 ? model.id.trim() : String(index + 1);
                  return `${t("dragModel")}: ${label}`;
                }}
                onReorder={patchDraft}
                renderItem={(model, index) => {
                  const expanded = expandedModels.has(model.rowId);
                  const label = model.id.trim().length > 0 ? model.id.trim() : String(index + 1);
                  return (
                    <div data-model-row={label} style={modelContentStyle}>
                      <input
                        style={rowInputStyle}
                        value={model.id}
                        placeholder={t("modelId")}
                        aria-label={`${t("modelId")} ${String(index + 1)}`}
                        disabled={disabled}
                        onChange={(event) => {
                          patchModel(index, { id: event.target.value });
                        }}
                      />
                      <input
                        style={rowInputStyle}
                        value={model.name ?? ""}
                        placeholder={t("modelName")}
                        aria-label={`${t("modelName")} ${String(index + 1)}`}
                        disabled={disabled}
                        onChange={(event) => {
                          patchModel(index, { name: event.target.value || undefined });
                        }}
                      />
                      <button
                        type="button"
                        style={iconButtonStyle}
                        aria-label={`${t("modelDetails")}: ${label}`}
                        aria-expanded={expanded}
                        title={t("modelDetails")}
                        onClick={() => {
                          setExpandedModels((current) => {
                            const next = new Set(current);
                            if (!next.delete(model.rowId)) next.add(model.rowId);
                            return next;
                          });
                        }}
                      >
                        <IconChevron open={expanded} />
                      </button>
                      <button
                        type="button"
                        style={iconButtonStyle}
                        aria-label={`${t("remove")} ${label}`}
                        title={t("remove")}
                        disabled={disabled}
                        onClick={() => {
                          patchDraft(draft.filter((_, at) => at !== index));
                        }}
                      >
                        <IconTrash />
                      </button>
                      {expanded ? (
                        <div style={{ ...modelDetailStyle, gridColumn: "1 / -1" }}>
                          <Capability
                            label={t("vision")}
                            checked={model.vision === true}
                            disabled={disabled}
                            onChange={(vision) => {
                              patchModel(index, { vision });
                            }}
                          />
                          <Capability
                            label={t("thinking")}
                            checked={model.thinking === true}
                            disabled={disabled}
                            onChange={(thinking) => {
                              if (!thinking) {
                                patchModel(index, { thinking, defaultReasoningEffort: undefined });
                              } else {
                                patchModel(index, { thinking });
                              }
                            }}
                          />
                          {(() => {
                            const settings = modelSettingsOf(model);
                            const efforts = settings.thinking === true ? officialEffortsFor(settings) : [];
                            if (efforts.length === 0) return null;
                            const suggested = officialDefaultEffort(settings);
                            return (
                              <label style={{ ...labelStyle, display: "inline-flex", alignItems: "center", gap: 6 }}>
                                {t("defaultEffort")}
                                <select
                                  style={rowInputStyle}
                                  value={model.defaultReasoningEffort ?? suggested}
                                  disabled={disabled}
                                  aria-label={t("defaultEffort")}
                                  onChange={(event) => {
                                    const effort = efforts.find((entry) => entry.value === event.target.value);
                                    patchModel(index, { defaultReasoningEffort: effort?.value });
                                  }}
                                >
                                  {efforts.map((effort) => (
                                    <option key={effort.value} value={effort.value}>
                                      {effort.label ?? effort.value}
                                    </option>
                                  ))}
                                </select>
                              </label>
                            );
                          })()}
                          <label style={{ ...labelStyle, display: "inline-flex", alignItems: "center", gap: 6 }}>
                            {t("contextWindow")}
                            <input
                              style={{ ...rowInputStyle, width: 110 }}
                              inputMode="numeric"
                              placeholder={t("contextWindowDefault")}
                              value={model.contextWindow}
                              disabled={disabled}
                              aria-label={t("contextWindow")}
                              onChange={(event) => {
                                patchModel(index, { contextWindow: event.target.value });
                              }}
                            />
                          </label>
                        </div>
                      ) : null}
                    </div>
                  );
                }}
              />
              <button
                type="button"
                style={{ ...buttonStyle, alignSelf: "flex-start" }}
                disabled={disabled}
                onClick={() => {
                  const model: ModelDraft = {
                    rowId: newModelRowId(),
                    id: "",
                    contextWindow: ""
                  };
                  patchDraft([...draft, model]);
                  setExpandedModels((current) => new Set(current).add(model.rowId));
                }}
              >
                {t("addModel")}
              </button>
            </>
          ) : null}
        </section>

        <section style={sectionStyle} aria-label={t("capabilities")}>
          <p style={sectionTitleStyle}>{t("capabilities")}</p>
          <Capability
            label={t("enableImageGen")}
            checked={enableImageGen}
            disabled={disabled}
            onChange={(checked) => {
              setEnableImageGen(checked);
              setFailure(undefined);
              setNotice(undefined);
            }}
          />
          <Capability
            label={t("serverSearch")}
            checked={serverSearch}
            disabled={disabled}
            onChange={(checked) => {
              setServerSearch(checked);
              setFailure(undefined);
              setNotice(undefined);
            }}
          />
          <p style={hintStyle}>{t("serverSearchHelp")}</p>
          <p style={hintStyle}>{t("enableImageGenHelp")}</p>
        </section>

        <section style={sectionStyle} aria-label={t("network")}>
          <p style={sectionTitleStyle}>{t("network")}</p>
          <label style={labelStyle} htmlFor="grok-oauth-proxy">
            {t("proxyLabel")}
          </label>
          <input
            id="grok-oauth-proxy"
            style={inputStyle}
            value={proxy}
            autoComplete="off"
            spellCheck={false}
            aria-label={t("proxyLabel")}
            placeholder={t("proxyPlaceholder")}
            onChange={(event) => {
              setProxy(event.target.value);
              setFailure(undefined);
              setNotice(undefined);
            }}
          />
          <p style={hintStyle}>{t("proxyHelp")}</p>
        </section>

        {invalid ? <p style={errorStyle}>{t("invalidModel")}</p> : null}
        {failure !== undefined ? <p style={errorStyle}>{failure}</p> : null}
        {notice !== undefined ? <p style={statusStyle}>{notice}</p> : null}

        <div style={actionsStyle}>
          <button type="button" style={buttonStyle} disabled={!dirty || busy} onClick={discard}>
            {t("discard")}
          </button>
          <button
            type="button"
            style={primaryButtonStyle}
            disabled={!dirty || invalid || disabled}
            onClick={() => {
              save();
            }}
          >
            {t(busy ? "saving" : "save")}
          </button>
        </div>
      </div>
    </li>
  );
}
