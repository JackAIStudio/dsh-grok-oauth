import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const listStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8
};

const rowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "30px minmax(0, 1fr)",
  alignItems: "stretch",
  overflow: "hidden",
  border: "1px solid var(--dsw-alias-border-l2)",
  borderRadius: 8,
  background: "var(--dsw-alias-bg-layer-1)",
  transition: "box-shadow 150ms ease, opacity 150ms ease, transform 150ms ease"
};

const handleStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 30,
  minHeight: 42,
  border: 0,
  borderRight: "1px solid var(--dsw-alias-border-l2)",
  padding: 0,
  touchAction: "none",
  userSelect: "none",
  background: "transparent",
  color: "var(--dsw-alias-label-tertiary)"
};

const ghostStyle: React.CSSProperties = {
  ...rowStyle,
  position: "fixed",
  zIndex: 10000,
  pointerEvents: "none",
  opacity: 0.96,
  boxShadow: "var(--dsw-shadow-lv2, 0 10px 30px rgba(0, 0, 0, 0.18))",
  outline: "2px solid color-mix(in srgb, var(--dsw-alias-state-business-primary) 22%, transparent)"
};

function IconGrip() {
  return (
    <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor" aria-hidden={true}>
      <circle cx="2.5" cy="2.5" r="1.2" />
      <circle cx="7.5" cy="2.5" r="1.2" />
      <circle cx="2.5" cy="7" r="1.2" />
      <circle cx="7.5" cy="7" r="1.2" />
      <circle cx="2.5" cy="11.5" r="1.2" />
      <circle cx="7.5" cy="11.5" r="1.2" />
    </svg>
  );
}

function sameOrder<T>(left: T[], right: T[], getId: (item: T) => string): boolean {
  return (
    left.length === right.length &&
    left.every((item, index) => {
      const other = right[index];
      return other !== undefined && getId(item) === getId(other);
    })
  );
}

export interface SortableListProps<T> {
  items: T[];
  getId: (item: T) => string;
  renderItem: (item: T, index: number) => React.ReactNode;
  dragLabel: (item: T, index: number) => string;
  onReorder: (items: T[]) => void;
  disabled?: boolean;
}

export function SortableList<T>({
  items,
  getId,
  renderItem,
  dragLabel,
  onReorder,
  disabled = false
}: SortableListProps<T>) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [previewItems, setPreviewItems] = useState<T[] | null>(null);
  const [dragGhost, setDragGhost] = useState<{
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  const rowRefs = useRef(new Map<string, HTMLElement>());
  const previousRects = useRef<Map<string, DOMRect> | null>(null);
  const previewRef = useRef<T[] | null>(null);
  const dragGhostRef = useRef<typeof dragGhost>(null);

  const renderedItems = previewItems ?? items;
  const draggedItem =
    draggedId === null
      ? undefined
      : renderedItems.find((item) => getId(item) === draggedId) ?? items.find((item) => getId(item) === draggedId);

  useEffect(() => {
    if (draggedId === null) return;
    const style = document.createElement("style");
    style.textContent =
      "html.ollama-sortable-dragging, html.ollama-sortable-dragging * { cursor: grabbing !important; user-select: none !important; }";
    const previousRootCursor = document.documentElement.style.cursor;
    const previousBodyCursor = document.body.style.cursor;
    document.head.appendChild(style);
    document.documentElement.classList.add("ollama-sortable-dragging");
    document.documentElement.style.cursor = "grabbing";
    document.body.style.cursor = "grabbing";
    return () => {
      document.documentElement.classList.remove("ollama-sortable-dragging");
      style.remove();
      document.documentElement.style.cursor = previousRootCursor;
      document.body.style.cursor = previousBodyCursor;
    };
  }, [draggedId]);

  useEffect(() => {
    if (draggedId === null) return;
    const handlePointerMove = (event: PointerEvent) => {
      const currentGhost = dragGhostRef.current;
      if (currentGhost === null) return;
      event.preventDefault();
      const nextGhost = {
        ...currentGhost,
        x: event.clientX - currentGhost.offsetX,
        y: event.clientY - currentGhost.offsetY
      };
      dragGhostRef.current = nextGhost;
      setDragGhost(nextGhost);
      movePreviewFromPointer(nextGhost.y + nextGhost.height / 2);
    };
    const handlePointerUp = (event: PointerEvent) => {
      event.preventDefault();
      finishDrag(true);
    };
    const handlePointerCancel = (event: PointerEvent) => {
      event.preventDefault();
      finishDrag(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      finishDrag(false);
    };
    window.addEventListener("pointermove", handlePointerMove, { passive: false });
    window.addEventListener("pointerup", handlePointerUp, { passive: false });
    window.addEventListener("pointercancel", handlePointerCancel, { passive: false });
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerCancel);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [draggedId]);

  useLayoutEffect(() => {
    const rects = previousRects.current;
    if (rects === null) return;
    previousRects.current = null;
    rowRefs.current.forEach((node, id) => {
      const previous = rects.get(id);
      if (previous === undefined) return;
      const next = node.getBoundingClientRect();
      const deltaX = previous.left - next.left;
      const deltaY = previous.top - next.top;
      if ((deltaX === 0 && deltaY === 0) || typeof node.animate !== "function") return;
      node.animate(
        [
          { transform: `translate(${String(deltaX)}px, ${String(deltaY)}px)` },
          { transform: "translate(0, 0)" }
        ],
        {
          duration: 160,
          easing: "cubic-bezier(0.2, 0, 0, 1)"
        }
      );
    });
  }, [renderedItems]);

  const startDrag = (event: React.PointerEvent<HTMLButtonElement>, id: string) => {
    if (disabled || event.button !== 0) return;
    const row = event.currentTarget.closest('[data-sortable-row="true"]');
    if (!(row instanceof HTMLElement)) return;
    event.preventDefault();
    event.currentTarget.focus();
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {}
    const rect = row.getBoundingClientRect();
    const nextGhost = {
      id,
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top
    };
    dragGhostRef.current = nextGhost;
    const initial = [...items];
    previewRef.current = initial;
    setPreviewItems(initial);
    setDragGhost(nextGhost);
    setDraggedId(id);
  };

  const finishDrag = (commit: boolean) => {
    const next = previewRef.current;
    if (commit && next !== null && !sameOrder(next, items, getId)) onReorder(next);
    previewRef.current = null;
    dragGhostRef.current = null;
    setPreviewItems(null);
    setDragGhost(null);
    setDraggedId(null);
    setDropTargetId(null);
  };

  const captureRects = () => {
    previousRects.current = new Map(
      Array.from(rowRefs.current.entries()).map(([id, node]) => [id, node.getBoundingClientRect()])
    );
  };

  const setRowRef = (id: string, node: HTMLElement | null) => {
    if (node === null) rowRefs.current.delete(id);
    else rowRefs.current.set(id, node);
  };

  const movePreviewFromPointer = (pointerY: number) => {
    if (draggedId === null) return;
    const current = previewRef.current ?? [...items];
    const from = current.findIndex((item) => getId(item) === draggedId);
    if (from < 0) return;
    const dragged = current[from];
    if (dragged === undefined) return;
    const remaining = current.filter((item) => getId(item) !== draggedId);
    let insertionIndex = remaining.length;
    let nextDropTargetId = remaining.length === 0 ? null : getId(remaining[remaining.length - 1]);
    for (let index = 0; index < remaining.length; index += 1) {
      const item = remaining[index];
      if (item === undefined) continue;
      const id = getId(item);
      const node = rowRefs.current.get(id);
      if (node === undefined) continue;
      const rect = node.getBoundingClientRect();
      if (pointerY < rect.top + rect.height / 2) {
        insertionIndex = index;
        nextDropTargetId = id;
        break;
      }
    }
    const next = [...remaining.slice(0, insertionIndex), dragged, ...remaining.slice(insertionIndex)];
    setDropTargetId(nextDropTargetId);
    if (sameOrder(next, current, getId)) return;
    captureRects();
    previewRef.current = next;
    setPreviewItems(next);
  };

  return (
    <div style={listStyle}>
      {renderedItems.map((item, index) => {
        const id = getId(item);
        const dragging = draggedId === id;
        const targeted = dropTargetId === id && draggedId !== id;
        return (
          <div
            key={id}
            ref={(node) => {
              setRowRef(id, node);
            }}
            data-sortable-row="true"
            style={{
              ...rowStyle,
              visibility: dragging ? "hidden" : "visible",
              pointerEvents: dragging ? "none" : "auto",
              borderColor: dragging ? "transparent" : "var(--dsw-alias-border-l2)",
              boxShadow: targeted
                ? "0 0 0 2px color-mix(in srgb, var(--dsw-alias-state-business-primary) 20%, transparent)"
                : "none"
            }}
          >
            <button
              type="button"
              style={{
                ...handleStyle,
                cursor: disabled ? "default" : draggedId === null ? "grab" : "grabbing"
              }}
              aria-label={dragLabel(item, index)}
              aria-grabbed={dragging}
              title={dragLabel(item, index)}
              disabled={disabled}
              onDragStart={(event) => {
                event.preventDefault();
              }}
              onPointerDown={(event) => {
                startDrag(event, id);
              }}
            >
              <IconGrip />
            </button>
            <div style={{ minWidth: 0 }}>{renderItem(item, index)}</div>
          </div>
        );
      })}
      {dragGhost !== null && draggedItem !== undefined
        ? createPortal(
            <div
              data-sortable-ghost="true"
              style={{
                ...ghostStyle,
                left: dragGhost.x,
                top: dragGhost.y,
                width: dragGhost.width,
                minHeight: dragGhost.height
              }}
            >
              <div
                style={{
                  ...handleStyle,
                  cursor: "grabbing"
                }}
              >
                <IconGrip />
              </div>
              <div style={{ minWidth: 0 }}>
                {renderItem(draggedItem, renderedItems.findIndex((item) => getId(item) === draggedId))}
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
