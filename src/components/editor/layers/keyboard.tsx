"use client";

import { useEffect, type RefObject } from "react";
import { layerKeyAction, type LayerKeyAction, type LayerKeyRow } from "@/components/editor/layers/keyboard-nav";

function readRows(tree: HTMLElement): LayerKeyRow[] {
  return [...tree.querySelectorAll<HTMLElement>('[role="treeitem"]')].map((row) => ({
    id: row.getAttribute("data-layer-id") || "",
    parentId: row.getAttribute("data-layer-parent"),
    expanded: row.hasAttribute("aria-expanded") ? row.getAttribute("aria-expanded") === "true" : null,
  }));
}

function activeLayerId(tree: HTMLElement) {
  const selected = [...tree.querySelectorAll<HTMLElement>('[role="treeitem"][aria-selected="true"]')];
  const last = selected.at(-1);
  if (last?.getAttribute("data-layer-id")) return last.getAttribute("data-layer-id") || "";
  const focused = document.activeElement instanceof HTMLElement ? document.activeElement.closest<HTMLElement>('[role="treeitem"]') : null;
  if (focused && tree.contains(focused)) return focused.getAttribute("data-layer-id") || "";
  return "";
}

function applyLayerKey(tree: HTMLElement, action: LayerKeyAction) {
  if (action.type === "ignore") return;
  if (action.type === "expand" || action.type === "collapse") {
    const toggle = tree.querySelector<HTMLButtonElement>(`[data-layer-toggle="${CSS.escape(action.id)}"]`);
    toggle?.focus();
    toggle?.click();
    return;
  }
  const row = tree.querySelector<HTMLElement>(`[data-layer-id="${CSS.escape(action.id)}"]`);
  const button = row?.querySelector<HTMLButtonElement>(".ed-tree-main");
  button?.focus();
  button?.click();
}

/** Arrow keys stay on this tree. They do not run while a rename field is focused. */
export function useLayerKeyboard(tree: RefObject<HTMLElement | null>, source: string) {
  useEffect(() => {
    const node = tree.current;
    if (!node) return;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target;
      const renameFocused = target instanceof HTMLElement && Boolean(target.closest("input, textarea, [contenteditable='true']"));
      const action = layerKeyAction(readRows(node), activeLayerId(node), event.key, renameFocused);
      if (action.type === "ignore") return;
      event.preventDefault();
      event.stopPropagation();
      applyLayerKey(node, action);
    };
    node.addEventListener("keydown", onKey);
    return () => node.removeEventListener("keydown", onKey);
  }, [tree, source]);
}
