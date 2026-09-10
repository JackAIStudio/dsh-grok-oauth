import React, { useCallback, useEffect, useMemo, useState } from "react";
import { GROK_IMAGE_GEN_TOOL_NAME } from "../../common/constants.js";
import { formatTemplate } from "../locales.js";
import { BrandMark } from "./BrandMark.js";

const cssId = "dsh-grok-oauth/image-row.css";
const css = [
  ".grok-image-row{display:flex;flex-direction:column;gap:8px;min-width:0}",
  ".grok-image-row-head{display:flex;align-items:center;min-width:0;height:24px}",
  ".grok-image-row-lead{width:16px;height:16px;flex:none;margin-right:6px;color:var(--dsw-alias-label-tertiary);display:inline-flex;align-items:center;justify-content:center}",
  ".grok-image-row-title{flex:none;color:var(--dsw-alias-label-secondary);font-size:14px;line-height:24px}",
  ".grok-image-row-sep{width:2px;height:2px;flex:none;margin:0 8px;border-radius:1px;background:var(--dsw-alias-label-caption)}",
  ".grok-image-row-summary{min-width:0;flex:auto;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-tertiary);font-size:14px;line-height:24px}",
  ".grok-image-row-summary.is-error{color:var(--dsw-alias-state-error-primary)}",
  ".grok-image-row-path{appearance:none;border:0;padding:0;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;line-height:18px;text-align:left;cursor:pointer;text-decoration:underline;text-underline-offset:2px}",
  ".grok-image-row-path:hover,.grok-image-row-path:focus-visible{color:var(--dsw-alias-label-primary);outline:none}",
  ".grok-image-gallery{display:flex;flex-wrap:wrap;gap:10px;max-width:100%}",
  ".grok-image-frame{appearance:none;border:.5px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-interactive-bg-hover);cursor:zoom-in;border-radius:16px;flex:none;min-width:44px;min-height:44px;padding:0;display:grid;place-items:center;overflow:hidden}",
  ".grok-image-frame img{width:100%;height:100%;object-fit:cover;display:block}",
  ".grok-image-frame.is-tile{width:64px;min-width:64px;height:64px;min-height:64px}",
  ".grok-image-frame.is-loading,.grok-image-frame.is-error{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}",
  ".grok-image-frame.is-error{background:var(--dsw-alias-interactive-bg-hover-danger);cursor:pointer;max-width:240px;padding:10px 12px}",
  ".grok-image-lightbox{position:fixed;inset:0;z-index:80;display:grid;place-items:center;background:color-mix(in srgb, var(--dsw-alias-bg-base) 72%, transparent);padding:24px}",
  ".grok-image-lightbox img{max-width:min(100vw - 48px, 1200px);max-height:min(100vh - 48px, 90vh);object-fit:contain;border-radius:12px;box-shadow:0 16px 48px color-mix(in srgb, #000 45%, transparent)}",
  ".grok-image-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}"
].join("");

if (typeof document !== "undefined") {
  let tag = document.querySelector(`style[data-plugin-css="${cssId}"]`);
  if (tag === null) {
    tag = document.createElement("style");
    (tag as HTMLElement).dataset.plugin = "dsh-grok-oauth";
    (tag as HTMLElement).dataset.pluginCss = cssId;
    document.head.appendChild(tag);
  }
  tag.textContent = css;
}

function firstLine(text: string): string {
  const newline = text.indexOf("\n");
  return newline === -1 ? text : text.slice(0, newline);
}

function parseArgs(argsRaw: string): Record<string, unknown> | undefined {
  try {
    const value = JSON.parse(argsRaw);
    return typeof value === "object" && value !== null && !Array.isArray(value) ? value : undefined;
  } catch {
    return undefined;
  }
}

function callArgsRaw(block: any): string {
  return (("kind" in block ? block.call?.argsRaw : block.argsRaw) ?? "") as string;
}

function imagesOf(block: any): any[] {
  if (block == null || !("kind" in block) || !Array.isArray(block.content)) return [];
  const images = [];
  for (const item of block.content) {
    if (item?.type === "image" && item.attachment?.attachmentId) images.push(item.attachment);
  }
  return images;
}

function pathOf(block: any): string | undefined {
  const args = parseArgs(callArgsRaw(block));
  if (typeof args?.path === "string" && args.path.trim() !== "") return args.path.trim();
  if (block == null || !("kind" in block) || !Array.isArray(block.content)) return undefined;
  for (const item of block.content) {
    if (item?.type !== "text" || typeof item.text !== "string") continue;
    const match = item.text.match(/<path>([^<]+)<\/path>/);
    if (match?.[1]?.trim()) return match[1].trim();
  }
  return undefined;
}

function promptOf(block: any): string {
  const args = parseArgs(callArgsRaw(block));
  return typeof args?.prompt === "string" ? firstLine(args.prompt) : "";
}

function rowState(block: any): "running" | "error" | "stopped" | "ok" {
  if (block == null || !("kind" in block)) return "running";
  if (block.error?.code === "interrupted") return "stopped";
  if (block.isError) return "error";
  return "ok";
}

function singleFit(width?: number, height?: number) {
  if (width == null || height == null || width <= 0 || height <= 0) {
    return { width: 240, height: 240, objectPosition: "center" };
  }
  const natural = width / height;
  const ratio = Math.min(4, Math.max(0.25, natural));
  const box = ratio >= 1 ? { width: 240, height: 240 / ratio } : { width: 240 * ratio, height: 240 };
  const scale = Math.min(1, width / box.width, height / box.height);
  return {
    width: Math.max(1, Math.round(box.width * scale)),
    height: Math.max(1, Math.round(box.height * scale)),
    objectPosition: natural < 0.25 ? "center top" : natural > 4 ? "left center" : "center"
  };
}

function GrokImageThumb({
  attachment,
  loadImage,
  tile,
  t
}: {
  attachment: any;
  loadImage?: ((attachment: any) => Promise<string>) & { peek?: (attachment: any) => string | undefined };
  tile: boolean;
  t: (key: string, params?: Record<string, unknown>) => string;
}) {
  const [src, setSrc] = useState<string | null>(() => loadImage?.peek?.(attachment) ?? null);
  const [error, setError] = useState(false);
  const [open, setOpen] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const fit = useMemo(
    () => (tile ? undefined : singleFit(attachment.width, attachment.height)),
    [attachment.height, attachment.width, tile]
  );
  const name = typeof attachment.name === "string" && attachment.name !== "" ? attachment.name : t("imageRowTitle");

  useEffect(() => {
    if (loadImage == null) {
      setError(true);
      return;
    }
    let live = true;
    setError(false);
    setSrc(loadImage.peek?.(attachment) ?? null);
    loadImage(attachment)
      .then((url) => {
        if (live) setSrc(url);
      })
      .catch(() => {
        if (live) setError(true);
      });
    return () => {
      live = false;
    };
  }, [attachment, attempt, loadImage]);

  if (error) {
    return (
      <button type="button" className="grok-image-frame is-error" onClick={() => setAttempt((n) => n + 1)}>
        {t("imageRowLoadFailed")}
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        className={tile ? "grok-image-frame is-tile" : "grok-image-frame"}
        style={fit === undefined ? undefined : { width: fit.width, height: fit.height }}
        title={t("imageRowOpen")}
        aria-label={formatTemplate(t("imageRowOpenNamed"), { name })}
        onClick={() => {
          if (src !== null) setOpen(true);
        }}
      >
        {src === null ? (
          <span className="grok-image-frame is-loading">{t("imageRowLoading")}</span>
        ) : (
          <img src={src} alt={name} style={fit === undefined ? undefined : { objectPosition: fit.objectPosition }} />
        )}
      </button>
      {open && src !== null ? <GrokImageLightbox src={src} alt={name} closeLabel={t("imageRowLightboxClose")} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function GrokImageLightbox({
  src,
  alt,
  closeLabel,
  onClose
}: {
  src: string;
  alt: string;
  closeLabel: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <button type="button" className="grok-image-lightbox" aria-label={closeLabel} onClick={onClose}>
      <img src={src} alt={alt} onClick={(event) => event.stopPropagation()} />
    </button>
  );
}

export function GrokImageRow({
  block,
  openFile,
  loadImage,
  t
}: {
  block: any;
  openFile?: (path: string) => void;
  loadImage?: ((attachment: any) => Promise<string>) & { peek?: (attachment: any) => string | undefined };
  t: (key: string, params?: Record<string, unknown>) => string;
}) {
  const state = rowState(block);
  const images = imagesOf(block);
  const filePath = pathOf(block);
  const prompt = promptOf(block);
  const summary =
    state === "error" ? t("imageRowFailed") : state === "running" ? t("imageRowRunning") : prompt || filePath || t("imageRowTitle");
  const tile = images.length > 1;
  const openSaved = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      if (filePath !== undefined) openFile?.(filePath);
    },
    [filePath, openFile]
  );

  return (
    <div className="grok-image-row" data-tool={GROK_IMAGE_GEN_TOOL_NAME} data-state={state}>
      {state !== "ok" ? <span className="grok-image-sr">{state === "running" ? t("imageRowRunning") : t("imageRowFailed")}</span> : null}
      <div className="grok-image-row-head">
        <span className="grok-image-row-lead">
          <BrandMark size={14} />
        </span>
        <span className="grok-image-row-title">{t("imageRowTitle")}</span>
        <span className="grok-image-row-sep" aria-hidden="true" />
        <span className={state === "error" ? "grok-image-row-summary is-error" : "grok-image-row-summary"}>{summary}</span>
      </div>
      {images.length > 0 ? (
        <div className="grok-image-gallery">
          {images.map((attachment, index) => (
            <GrokImageThumb
              key={`${attachment.attachmentId}:${index}`}
              attachment={attachment}
              loadImage={loadImage}
              tile={tile}
              t={t}
            />
          ))}
        </div>
      ) : null}
      {filePath !== undefined && openFile !== undefined ? (
        <button type="button" className="grok-image-row-path" onClick={openSaved} title={filePath}>
          {t("imageRowOpenFile")}
        </button>
      ) : null}
    </div>
  );
}

export function registerGrokImageToolview(ctx: any, localeNamespace: string) {
  ctx.slots.inject("tool.call.toolview", () =>
    ctx.slots.register(
      {
        name: "tool.call.toolview",
        key: GROK_IMAGE_GEN_TOOL_NAME,
        locale: localeNamespace,
        inject: (sessionId: string) => {
          const ui = ctx.uiConversation;
          if (ui == null) return {};
          const loadImage = ((attachment: any) => ui.imageUrl(sessionId, attachment)) as ((
            attachment: any
          ) => Promise<string>) & { peek?: (attachment: any) => string | undefined };
          loadImage.peek = (attachment: any) => ui.peekImageUrl(sessionId, attachment);
          return { loadImage };
        }
      },
      GrokImageRow
    )
  );
}
