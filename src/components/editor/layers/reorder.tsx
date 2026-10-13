"use client";

import { useRef, useState } from "react";
import { dropIsAfter, layerDragAllowed } from "@/components/editor/layers/reorder-drop";

const THRESHOLD = 4;

export type LayerReorderDrop = {
  id: string;
  parentId: string;
  targetId: string;
  targetParentId: string;
  targetSectionType: string;
  targetContainer: boolean;
  after: boolean;
};

type DropHint = { id: string; parentId: string; sectionType: string; container: boolean; after: boolean };

/** Pointer-drag a layer row onto a sibling. Text fields never start the drag. A locked row reports locked and does not move. */
export function useLayerReorder(enabled: boolean, onDrop: (drop: LayerReorderDrop) => void, onReject?: (reason: "locked") => void) {
  const onDropRef = useRef(onDrop);
  onDropRef.current = onDrop;
  const onRejectRef = useRef(onReject);
  onRejectRef.current = onReject;
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  const dropRef = useRef<DropHint | null>(null);
  const [drop, setDrop] = useState<DropHint | null>(null);

  function onPointerDown(event: React.PointerEvent<HTMLLIElement>) {
    if (!enabledRef.current || event.button !== 0) return;
    if (!layerDragAllowed(event.target)) return;
    const row = event.currentTarget;
    const hit = event.target instanceof Element ? event.target.closest("[data-layer-id]") : null;
    if (hit !== row) return;
    const id = row.getAttribute("data-layer-id") ?? "";
    const parentId = row.getAttribute("data-layer-parent") ?? "";
    if (!id || !parentId || parentId === "chrome") return;
    if (row.getAttribute("data-locked") === "true") {
      const startX = event.clientX;
      const startY = event.clientY;
      let reported = false;
      const move = (ev: PointerEvent) => {
        if (reported || Math.hypot(ev.clientX - startX, ev.clientY - startY) < THRESHOLD) return;
        reported = true;
        onRejectRef.current?.("locked");
      };
      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        window.removeEventListener("pointercancel", up);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
      window.addEventListener("pointercancel", up);
      return;
    }
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
      if (!target || !targetId || !targetParent || targetId === id) {
        dropRef.current = null;
        setDrop(null);
        return;
      }
      const rect = target.getBoundingClientRect();
      const next = {
        id: targetId,
        parentId: targetParent,
        sectionType: target.getAttribute("data-section-type") ?? "",
        container: target.getAttribute("data-layer-container") === "true",
        after: dropIsAfter(ev.clientY, rect.top, rect.height),
      };
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
      if (active && hint) {
        onDropRef.current({
          id,
          parentId,
          targetId: hint.id,
          targetParentId: hint.parentId,
          targetSectionType: hint.sectionType,
          targetContainer: hint.container,
          after: hint.after,
        });
      }
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  }

  return { drop, onPointerDown };
}
