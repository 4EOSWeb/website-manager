"use client";

import { useRef, useState } from "react";
import { dropIsAfter, layerDragAllowed } from "@/components/editor/layers/reorder-drop";

const THRESHOLD = 4;

export type LayerReorderDrop = { id: string; parentId: string; targetId: string; after: boolean };

/** Pointer-drag a layer row onto a sibling. Text fields never start the drag. */
export function useLayerReorder(enabled: boolean, onDrop: (drop: LayerReorderDrop) => void) {
  const onDropRef = useRef(onDrop);
  onDropRef.current = onDrop;
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  const dropRef = useRef<{ id: string; after: boolean } | null>(null);
  const [drop, setDrop] = useState<{ id: string; after: boolean } | null>(null);

  function onPointerDown(event: React.PointerEvent<HTMLLIElement>) {
    if (!enabledRef.current || event.button !== 0) return;
    if (!layerDragAllowed(event.target)) return;
    const row = event.currentTarget;
    const hit = event.target instanceof Element ? event.target.closest("[data-layer-id]") : null;
    if (hit !== row) return;
    const id = row.getAttribute("data-layer-id") ?? "";
    const parentId = row.getAttribute("data-layer-parent") ?? "";
    if (!id || !parentId || row.getAttribute("data-locked") === "true") return;
    const startX = event.clientX;
    const startY = event.clientY;
    let active = false;

    const move = (ev: PointerEvent) => {
      if (!active && Math.hypot(ev.clientX - startX, ev.clientY - startY) < THRESHOLD) return;
      active = true;
      const under = document.elementFromPoint(ev.clientX, ev.clientY);
      const target = under?.closest?.("[data-layer-id]");
      const targetId = target?.getAttribute("data-layer-id") ?? "";
      const targetParent = target?.getAttribute("data-layer-parent") ?? "";
      if (!target || !targetId || targetId === id || targetParent !== parentId) {
        dropRef.current = null;
        setDrop(null);
        return;
      }
      const rect = target.getBoundingClientRect();
      const next = { id: targetId, after: dropIsAfter(ev.clientY, rect.top, rect.height) };
      dropRef.current = next;
      setDrop(next);
    };

    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      const hint = dropRef.current;
      dropRef.current = null;
      setDrop(null);
      if (active && hint) onDropRef.current({ id, parentId, targetId: hint.id, after: hint.after });
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  }

  return { drop, onPointerDown };
}
