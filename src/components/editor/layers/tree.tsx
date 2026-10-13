"use client";

import { useEffect, useRef, useState } from "react";
import type { LayerNode } from "@/components/editor/layers/rows";
import { layerLabel, layerRowSelected, layerStorageKey, type LayerSelection } from "@/components/editor/layers/rows";
import { Lock } from "lucide-react";
import { LayerLockButton } from "@/components/editor/layers/lock";
import { LayerRename } from "@/components/editor/layers/rename";

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

function Branch(props: {
  node: LayerNode;
  parentId: string;
  depth: number;
  open: Set<string>;
  onToggle: (id: string) => void;
  selection: LayerSelection;
  onSelect: (node: LayerNode) => void;
  renamingId: string;
  onRenameStart: (node: LayerNode) => void;
  onRename: (node: LayerNode, name: string) => void;
  onRenameCancel: () => void;
  onLock?: (node: LayerNode) => void;
  onPointerDown?: (event: React.PointerEvent<HTMLLIElement>) => void;
  dropHint?: { id: string; after: boolean } | null;
}) {
  const { node, parentId, depth, open, onToggle, selection, onSelect, renamingId, onRenameStart, onRename, onRenameCancel, onLock, onPointerDown, dropHint } = props;
  const children = node.children ?? [];
  const expanded = children.length > 0 && open.has(node.id);
  const selected = layerRowSelected(node, selection);
  return (
    <li
      role="treeitem"
      aria-selected={selected}
      aria-expanded={children.length > 0 ? expanded : undefined}
      data-node-id={node.id}
      data-layer-id={node.id}
      data-layer-parent={parentId || undefined}
      data-layer-container={children.length > 0 ? "true" : undefined}
      data-section-type={node.type}
      data-layer-drop={dropHint?.id === node.id ? (dropHint.after ? "after" : "before") : undefined}
      data-provider-managed={node.source?.providerManaged ? "true" : undefined}
      data-locked={node.locked?.locked ? "true" : undefined}
      onPointerDown={onPointerDown}
    >
      <div className={selected ? (depth > 0 ? "ed-tree-row is-child is-active" : "ed-tree-row is-active") : (depth > 0 ? "ed-tree-row is-child" : "ed-tree-row")}>
        {renamingId === node.id ? (
          <LayerRename value={typeof node.metadata?.name === "string" ? node.metadata.name : ""} label="Layer name" onCommit={(value) => onRename(node, value)} onCancel={onRenameCancel} />
        ) : (
          <button type="button" className="ed-tree-main" onClick={() => onSelect(node)} onDoubleClick={() => onRenameStart(node)}>
            <span className="truncate">{layerLabel(node)}</span>
            {node.locked?.locked ? <Lock size={12} aria-label="Locked" className="ed-muted-icon" /> : null}
          </button>
        )}
        {onLock && !node.locked?.locked ? <LayerLockButton label={`Lock ${layerLabel(node)}`} onLock={() => onLock(node)} /> : null}
        {children.length > 0 ? (
          <button type="button" className="ed-icon is-small" aria-label={expanded ? "Collapse" : "Expand"} data-layer-toggle={node.id} onClick={() => onToggle(node.id)}>
            {expanded ? "–" : "+"}
          </button>
        ) : null}
      </div>
      {expanded ? (
        <ul role="group">
          {children.map((child) => (
            <Branch key={child.id} node={child} parentId={node.id} depth={depth + 1} open={open} onToggle={onToggle} selection={selection} onSelect={onSelect} renamingId={renamingId} onRenameStart={onRenameStart} onRename={onRename} onRenameCancel={onRenameCancel} onLock={onLock} onPointerDown={onPointerDown} dropHint={dropHint} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

/** The active page as a tree. Locked and provider-managed nodes stay in the list. */
export function LayerTree(props: {
  root: LayerNode;
  open: Set<string>;
  onToggle: (id: string) => void;
  selection: LayerSelection;
  onSelect: (node: LayerNode) => void;
  renamingId: string;
  onRenameStart: (node: LayerNode) => void;
  onRename: (node: LayerNode, name: string) => void;
  onRenameCancel: () => void;
  onLock?: (node: LayerNode) => void;
  onPointerDown?: (event: React.PointerEvent<HTMLLIElement>) => void;
  dropHint?: { id: string; after: boolean } | null;
}) {
  return (
    <Branch
      node={props.root}
      parentId=""
      depth={0}
      open={props.open}
      onToggle={props.onToggle}
      selection={props.selection}
      onSelect={props.onSelect}
      renamingId={props.renamingId}
      onRenameStart={props.onRenameStart}
      onRename={props.onRename}
      onRenameCancel={props.onRenameCancel}
      onLock={props.onLock}
      onPointerDown={props.onPointerDown}
      dropHint={props.dropHint}
    />
  );
}
