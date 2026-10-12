"use client";

import { useEffect, useRef, useState } from "react";
import type { LayerNode } from "@/components/editor/layers/rows";
import { layerLabel, layerStorageKey } from "@/components/editor/layers/rows";

/** Remembers which rows are open for this website and page. */
export function useLayerOpen(websiteId: string, pageId: string, defaults: string[]) {
  const key = layerStorageKey(websiteId, pageId);
  const defaultsRef = useRef(defaults);
  defaultsRef.current = defaults;
  const [open, setOpen] = useState<string[]>(defaults);
  useEffect(() => {
    const fallback = defaultsRef.current;
    const raw = sessionStorage.getItem(key);
    if (!raw) {
      sessionStorage.setItem(key, JSON.stringify(fallback));
      return;
    }
    try {
      const ids = JSON.parse(raw) as unknown;
      if (Array.isArray(ids) && ids.every((id) => typeof id === "string")) setOpen(ids);
    } catch {
      sessionStorage.setItem(key, JSON.stringify(fallback));
    }
  }, [key]);
  const toggle = (id: string) => {
    setOpen((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      sessionStorage.setItem(key, JSON.stringify(next));
      return next;
    });
  };
  return { open: new Set(open), toggle };
}

function Branch(props: { node: LayerNode; depth: number; open: Set<string>; onToggle: (id: string) => void }) {
  const { node, depth, open, onToggle } = props;
  const children = node.children ?? [];
  const expanded = children.length > 0 && open.has(node.id);
  return (
    <li
      role="treeitem"
      aria-expanded={children.length > 0 ? expanded : undefined}
      data-node-id={node.id}
      data-provider-managed={node.source?.providerManaged ? "true" : undefined}
      data-locked={node.locked?.locked ? "true" : undefined}
    >
      <div className={depth > 0 ? "ed-tree-row is-child" : "ed-tree-row"}>
        <span className="ed-tree-main">
          <span className="truncate">{layerLabel(node)}</span>
        </span>
        {children.length > 0 ? (
          <button type="button" className="ed-icon is-small" aria-label={expanded ? "Collapse" : "Expand"} data-layer-toggle={node.id} onClick={() => onToggle(node.id)}>
            {expanded ? "–" : "+"}
          </button>
        ) : null}
      </div>
      {expanded ? (
        <ul role="group">
          {children.map((child) => <Branch key={child.id} node={child} depth={depth + 1} open={open} onToggle={onToggle} />)}
        </ul>
      ) : null}
    </li>
  );
}

/** The active page as a tree. Locked and provider-managed nodes stay in the list. */
export function LayerTree(props: { root: LayerNode; open: Set<string>; onToggle: (id: string) => void }) {
  return <Branch node={props.root} depth={0} open={props.open} onToggle={props.onToggle} />;
}
