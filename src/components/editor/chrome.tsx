"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Check, ChevronDown, CloudUpload, Eye, FilePlus2, Files, ImageIcon, Keyboard, Layers, LoaderCircle, LogOut, Monitor, Palette, Plus, Redo2, ShieldCheck, Smartphone, Tablet, Undo2 } from "lucide-react";
import { signOutUser } from "@/app/signin/actions";
import type { RailPanel, SaveState, Viewport } from "@/components/editor/types";
import { IconButton } from "@/components/editor/ui";

export type Zoom = "fit" | 50 | 75 | 100;

const DEVICES: { id: Viewport; label: string; icon: React.ReactNode }[] = [
  { id: "desktop", label: "Desktop", icon: <Monitor size={16} aria-hidden="true" /> },
  { id: "tablet", label: "Tablet", icon: <Tablet size={16} aria-hidden="true" /> },
  { id: "mobile", label: "Phone", icon: <Smartphone size={16} aria-hidden="true" /> },
];

export function SaveStatus({ state, onRetry }: { state: SaveState; onRetry: () => void }) {
  if (state === "error") {
    return (
      <span className="ed-save is-error" role="alert">
        <AlertCircle size={14} aria-hidden="true" /> Not saved
        <button type="button" className="ed-link" onClick={onRetry}>Retry</button>
      </span>
    );
  }
  return (
    <span className={`ed-save is-${state}`} role="status" aria-live="polite">
      {state === "saved" ? <Check size={14} aria-hidden="true" /> : <LoaderCircle size={14} aria-hidden="true" className="ed-spin" />}
      {state === "saved" ? "Saved" : state === "saving" ? "Saving…" : "Unsaved changes"}
    </span>
  );
}

function AccountMenu(props: { userName: string; role: string; onConfirm: () => void; onShortcuts: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    function onDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  const initials = props.userName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "?";
  return (
    <div className="ed-account" ref={ref}>
      <button type="button" className="ed-avatar" aria-haspopup="menu" aria-expanded={open} aria-label={`Account: ${props.userName}`} onClick={() => setOpen((value) => !value)}>
        {initials}
      </button>
      {open ? (
        <div className="ed-popover" role="menu">
          <div className="ed-popover-head">
            <strong>{props.userName}</strong>
            <span className="ed-hint">{props.role.replaceAll("_", " ").toLowerCase()}</span>
          </div>
          <button type="button" role="menuitem" onClick={() => { setOpen(false); props.onConfirm(); }}><ShieldCheck size={14} aria-hidden="true" /> Confirm it’s you</button>
          <button type="button" role="menuitem" onClick={() => { setOpen(false); props.onShortcuts(); }}><Keyboard size={14} aria-hidden="true" /> Keyboard shortcuts</button>
          <form action={signOutUser}>
            <button type="submit" role="menuitem"><LogOut size={14} aria-hidden="true" /> Sign out</button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

export function TopBar(props: {
  websiteName: string;
  pageTitle: string;
  onPages: () => void;
  onNewPage: () => void;
  viewport: Viewport;
  onViewport: (viewport: Viewport) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  save: SaveState;
  onRetry: () => void;
  previewHref: string;
  canEdit: boolean;
  canPublish: boolean;
  onPublish: () => void;
  userName: string;
  role: string;
  onConfirm: () => void;
  onShortcuts: () => void;
}) {
  const mod = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl+";
  return (
    <header className="ed-topbar">
      <div className="ed-topbar-left">
        <span className="ed-brand" aria-hidden="true">4E</span>
        <span className="ed-site truncate">{props.websiteName}</span>
        <span className="ed-slash" aria-hidden="true">/</span>
        <button type="button" className="ed-page-switch" onClick={props.onPages} aria-label={`Current page: ${props.pageTitle}. Show pages`}>
          <span className="truncate">{props.pageTitle}</span>
          <ChevronDown size={14} aria-hidden="true" />
        </button>
        {props.canEdit ? (
          <IconButton label="New page" onClick={props.onNewPage}>
            <FilePlus2 size={16} aria-hidden="true" />
          </IconButton>
        ) : null}
      </div>
      <div className="ed-topbar-center">
        <div className="ed-segmented is-toolbar" role="radiogroup" aria-label="Preview size">
          {DEVICES.map((device) => (
            <button key={device.id} type="button" role="radio" aria-checked={props.viewport === device.id} aria-label={device.label} data-tip={device.label} onClick={() => props.onViewport(device.id)}>
              {device.icon}
            </button>
          ))}
        </div>
      </div>
      <div className="ed-topbar-right">
        <IconButton label="Undo" shortcut={`${mod}Z`} disabled={!props.canUndo} onClick={props.onUndo}><Undo2 size={16} aria-hidden="true" /></IconButton>
        <IconButton label="Redo" shortcut={`${mod}Shift+Z`} disabled={!props.canRedo} onClick={props.onRedo}><Redo2 size={16} aria-hidden="true" /></IconButton>
        <SaveStatus state={props.save} onRetry={props.onRetry} />
        <a className="ed-button" href={props.previewHref} target="_blank" rel="noreferrer">
          <Eye size={14} aria-hidden="true" /> Preview
        </a>
        {props.canPublish ? (
          <button type="button" className="ed-button is-primary" onClick={props.onPublish}>
            <CloudUpload size={14} aria-hidden="true" /> Submit for review
          </button>
        ) : (
          <span className="ed-tag">{props.canEdit ? "Drafts only" : "View only"}</span>
        )}
        <AccountMenu userName={props.userName} role={props.role} onConfirm={props.onConfirm} onShortcuts={props.onShortcuts} />
      </div>
    </header>
  );
}

export function ToolRail(props: { active: RailPanel | null; onChange: (panel: RailPanel | null) => void }) {
  const items: { id: RailPanel; label: string; icon: React.ReactNode }[] = [
    { id: "add", label: "Add", icon: <Plus size={20} aria-hidden="true" /> },
    { id: "pages", label: "Pages", icon: <Files size={20} aria-hidden="true" /> },
    { id: "layers", label: "Layers", icon: <Layers size={20} aria-hidden="true" /> },
    { id: "design", label: "Site styles", icon: <Palette size={20} aria-hidden="true" /> },
    { id: "media", label: "Media", icon: <ImageIcon size={20} aria-hidden="true" /> },
  ];
  return (
    <nav className="ed-rail" aria-label="Editor panels">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={props.active === item.id ? "is-active" : ""}
          aria-pressed={props.active === item.id}
          aria-label={item.label}
          data-tip={item.label}
          data-tip-side="right"
          onClick={() => props.onChange(props.active === item.id ? null : item.id)}
        >
          {item.icon}
          <span className="ed-rail-label">{item.id === "design" ? "Styles" : item.label}</span>
        </button>
      ))}
    </nav>
  );
}

export function StatusBar(props: { message: string; viewport: Viewport; scale: number; zoom: Zoom; onZoom: (zoom: Zoom) => void; role: string; editing: boolean; onShortcuts: () => void }) {
  return (
    <footer className="ed-status">
      <span className="truncate">{props.editing ? "Typing. Press Esc when you're done." : props.message}</span>
      <span className="ed-status-right">
        <span>{props.viewport === "mobile" ? "Phone" : props.viewport === "tablet" ? "Tablet" : "Desktop"}</span>
        <label className="ed-zoom">
          <span className="sr-only">Zoom</span>
          <select className="ed-input ed-select is-compact" value={String(props.zoom)} onChange={(event) => props.onZoom(event.target.value === "fit" ? "fit" : (Number(event.target.value) as Zoom))}>
            <option value="fit">Fit ({Math.round(props.scale * 100)}%)</option>
            <option value="50">50%</option>
            <option value="75">75%</option>
            <option value="100">100%</option>
          </select>
        </label>
        <button type="button" className="ed-link" onClick={props.onShortcuts}>Shortcuts</button>
      </span>
    </footer>
  );
}
