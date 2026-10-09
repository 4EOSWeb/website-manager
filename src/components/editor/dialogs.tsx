"use client";

import { useRef, useState } from "react";
import { ExternalLink, ShieldCheck, Upload } from "lucide-react";
import type { PageDocument, SiteDraft } from "@/lib/content-schema";
import { slugify } from "@/lib/editor-ops";
import type { LibraryEntry } from "@/lib/library";
import type { MediaItem, Publication } from "@/components/editor/types";
import { Dialog, Field, Kbd, Select, TextArea, TextInput, Toggle } from "@/components/editor/ui";
import { LibraryBrowser } from "@/components/editor/library";

export type PageForm = { title: string; route: string; template: PageDocument["template"]; navVisible: boolean; seoTitle: string; metaDescription: string };

const TEMPLATES = [
  { value: "blank", label: "Blank page" },
  { value: "landing", label: "Landing page" },
  { value: "service", label: "Service page" },
  { value: "resource", label: "Resource page" },
  { value: "insights-landing", label: "Insights landing page" },
] as const;

export function AddPageDialog(props: { site: SiteDraft; onCreate: (form: PageForm) => Promise<string | undefined>; onClose: () => void }) {
  const [form, setForm] = useState<PageForm>({ title: "", route: "", template: "landing", navVisible: true, seoTitle: "", metaDescription: "" });
  const [routeTouched, setRouteTouched] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const route = form.route || (form.title ? `/${slugify(form.title)}` : "");
  const taken = props.site.pages.some((page) => page.route === route);
  async function submit() {
    if (!form.title.trim()) {
      setError("Give the page a name.");
      return;
    }
    setBusy(true);
    const problem = await props.onCreate({ ...form, route });
    setBusy(false);
    if (problem) setError(problem);
  }
  return (
    <Dialog
      title="Add a page"
      onClose={props.onClose}
      footer={
        <>
          <button type="button" className="ed-button" onClick={props.onClose}>Cancel</button>
          <button type="button" className="ed-button is-primary" disabled={busy} onClick={() => void submit()}>{busy ? "Creating…" : "Create page"}</button>
        </>
      }
    >
      <form className="ed-form" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
        <Field label="Page name">
          <TextInput autoFocus value={form.title} maxLength={80} placeholder="Our services" onChange={(title) => { setError(""); setForm({ ...form, title, route: routeTouched ? form.route : title ? `/${slugify(title)}` : "" }); }} />
        </Field>
        <Field label="Web address" hint={taken ? "That address is already used." : "Lowercase words joined by dashes."}>
          <TextInput value={route} placeholder="/our-services" onChange={(value) => { setError(""); setRouteTouched(true); setForm({ ...form, route: value }); }} />
        </Field>
        <Field label="Starting layout">
          <Select label="Starting layout" value={form.template as (typeof TEMPLATES)[number]["value"]} options={TEMPLATES} onChange={(template) => setForm({ ...form, template })} />
        </Field>
        <Toggle label="Show in the menu" checked={form.navVisible} onChange={(navVisible) => setForm({ ...form, navVisible })} />
        <Field label="Title in search results" count={{ value: form.seoTitle.length, max: 60 }}>
          <TextInput value={form.seoTitle} maxLength={70} onChange={(seoTitle) => setForm({ ...form, seoTitle })} />
        </Field>
        <Field label="Search description" count={{ value: form.metaDescription.length, max: 160 }}>
          <TextArea value={form.metaDescription} maxLength={200} rows={3} onChange={(metaDescription) => setForm({ ...form, metaDescription })} />
        </Field>
        {error ? <p className="ed-error" role="alert">{error}</p> : null}
        <button type="submit" hidden />
      </form>
    </Dialog>
  );
}

export function ImagePickerDialog(props: { websiteId: string; media: MediaItem[]; progress: number | null; onChoose: (item: MediaItem) => void; onUpload: (file: File) => void; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const items = props.media.filter((item) => `${item.alt} ${item.filename}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <Dialog title="Choose an image" wide onClose={props.onClose} description="Pick a picture from the library or upload a new one.">
      <div className="ed-picker-bar">
        <label className="ed-search is-flush">
          <input placeholder="Search images" aria-label="Search images" value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <label className="ed-button">
          <Upload size={14} aria-hidden="true" /> {props.progress !== null ? `Uploading ${props.progress}%` : "Upload"}
          <input className="sr-only" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={(event) => { const file = event.target.files?.[0]; if (file) props.onUpload(file); event.target.value = ""; }} />
        </label>
      </div>
      {items.length ? (
        <ul className="ed-picker-grid">
          {items.map((item) => (
            <li key={item.filename}>
              <button type="button" className="ed-picker-item" onClick={() => props.onChoose(item)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/api/sites/${props.websiteId}/media?name=${encodeURIComponent(item.filename)}`} alt="" loading="lazy" />
                <span className="truncate">{item.alt || item.filename}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="ed-hint ed-pad">{props.media.length ? "No images match that search." : "No images yet. Upload one to get started."}</p>
      )}
    </Dialog>
  );
}

type Box = { x: number; y: number; w: number; h: number };
const ASPECTS = [
  { value: "free", label: "Free" },
  { value: "1", label: "Square" },
  { value: "1.5", label: "3:2" },
  { value: "1.7778", label: "16:9" },
] as const;

export function CropDialog(props: { src: string; onClose: () => void; onSave: (file: File) => Promise<void> }) {
  const imageRef = useRef<HTMLImageElement>(null);
  const [box, setBox] = useState<Box>({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 });
  const [aspect, setAspect] = useState<(typeof ASPECTS)[number]["value"]>("free");
  const [saving, setSaving] = useState(false);
  const drag = useRef<{ x: number; y: number; box: Box; mode: "move" | "size" } | null>(null);
  const clamp = (next: Box): Box => {
    const w = Math.min(1, Math.max(0.05, next.w));
    const h = Math.min(1, Math.max(0.05, next.h));
    return { w, h, x: Math.min(1 - w, Math.max(0, next.x)), y: Math.min(1 - h, Math.max(0, next.y)) };
  };
  function applyAspect(value: (typeof ASPECTS)[number]["value"]) {
    setAspect(value);
    const image = imageRef.current;
    if (value === "free" || !image?.naturalWidth) return;
    const ratio = Number(value) * (image.naturalHeight / image.naturalWidth);
    setBox((current) => clamp({ ...current, h: current.w * ratio }));
  }
  function save() {
    const image = imageRef.current;
    if (!image) return;
    setSaving(true);
    const canvas = document.createElement("canvas");
    const width = Math.max(1, Math.round(image.naturalWidth * box.w));
    const height = Math.max(1, Math.round(image.naturalHeight * box.h));
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d")?.drawImage(image, image.naturalWidth * box.x, image.naturalHeight * box.y, width, height, 0, 0, width, height);
    canvas.toBlob((blob) => {
      if (!blob) {
        setSaving(false);
        return;
      }
      void props.onSave(new File([blob], "crop.png", { type: "image/png" })).finally(() => setSaving(false));
    }, "image/png");
  }
  function onKey(event: React.KeyboardEvent) {
    const step = event.shiftKey ? 0.05 : 0.01;
    const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    setBox((current) => clamp({ ...current, x: current.x + move[0], y: current.y + move[1] }));
  }
  return (
    <Dialog
      title="Crop image"
      wide
      onClose={props.onClose}
      description="Drag the box to move it. Drag the corner to resize. The original stays in the library."
      footer={
        <>
          <button type="button" className="ed-button" onClick={props.onClose}>Cancel</button>
          <button type="button" className="ed-button is-primary" disabled={saving} onClick={save}>{saving ? "Saving…" : "Save crop"}</button>
        </>
      }
    >
      <div className="ed-crop-tools">
        <span className="ed-hint">Shape</span>
        <div className="ed-segmented" role="radiogroup" aria-label="Crop shape">
          {ASPECTS.map((item) => (
            <button key={item.value} type="button" role="radio" aria-checked={aspect === item.value} onClick={() => applyAspect(item.value)}>{item.label}</button>
          ))}
        </div>
      </div>
      <div
        className="ed-crop"
        onPointerMove={(event) => {
          const start = drag.current;
          const image = imageRef.current;
          if (!start || !image) return;
          const rect = image.getBoundingClientRect();
          const dx = (event.clientX - start.x) / rect.width;
          const dy = (event.clientY - start.y) / rect.height;
          if (start.mode === "move") setBox(clamp({ ...start.box, x: start.box.x + dx, y: start.box.y + dy }));
          else {
            const w = start.box.w + dx;
            const ratio = aspect === "free" ? 0 : Number(aspect) * (image.naturalHeight / image.naturalWidth);
            setBox(clamp({ ...start.box, w, h: ratio ? w * ratio : start.box.h + dy }));
          }
        }}
        onPointerUp={() => { drag.current = null; }}
        onPointerCancel={() => { drag.current = null; }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img ref={imageRef} src={props.src} alt="" draggable={false} />
        <div
          className="ed-crop-box"
          role="slider"
          tabIndex={0}
          aria-label="Crop area. Use arrow keys to move it."
          aria-valuenow={Math.round(box.w * 100)}
          aria-valuemin={5}
          aria-valuemax={100}
          aria-valuetext={`${Math.round(box.w * 100)}% wide, ${Math.round(box.h * 100)}% tall`}
          style={{ left: `${box.x * 100}%`, top: `${box.y * 100}%`, width: `${box.w * 100}%`, height: `${box.h * 100}%` }}
          onKeyDown={onKey}
          onPointerDown={(event) => {
            event.currentTarget.parentElement?.setPointerCapture(event.pointerId);
            drag.current = { x: event.clientX, y: event.clientY, box, mode: (event.target as HTMLElement).dataset.handle ? "size" : "move" };
          }}
        >
          <span className="ed-crop-handle" data-handle="se" aria-hidden="true" />
        </div>
      </div>
    </Dialog>
  );
}

export function TemplateDialog(props: { onSave: (name: string) => void; onClose: () => void }) {
  const [name, setName] = useState("");
  return (
    <Dialog
      title="Save as a template"
      onClose={props.onClose}
      description="Saved templates appear under Saved in Add, so you can reuse this section on any page."
      footer={
        <>
          <button type="button" className="ed-button" onClick={props.onClose}>Cancel</button>
          <button type="button" className="ed-button is-primary" disabled={!name.trim()} onClick={() => props.onSave(name)}>Save template</button>
        </>
      }
    >
      <form className="ed-form" onSubmit={(event) => { event.preventDefault(); if (name.trim()) props.onSave(name); }}>
        <Field label="Template name">
          <TextInput autoFocus value={name} maxLength={80} placeholder="Client quote" onChange={setName} />
        </Field>
      </form>
    </Dialog>
  );
}

export function PublishDialog(props: {
  changes: string;
  publications: Publication[];
  busy: boolean;
  message: string;
  onSend: () => void;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const lines = props.changes.split("\n").filter(Boolean);
  return (
    <Dialog
      title="Send changes for review"
      wide
      onClose={props.onClose}
      description="This sends a review copy to your website provider. The live site changes only after they approve it."
      footer={
        <>
          <button type="button" className="ed-button" onClick={props.onConfirm}><ShieldCheck size={14} aria-hidden="true" /> Confirm it’s you</button>
          <span className="ed-grow" />
          <button type="button" className="ed-button" onClick={props.onClose}>Close</button>
          <button type="button" className="ed-button is-primary" disabled={props.busy} onClick={props.onSend}>{props.busy ? "Sending…" : "Send for review"}</button>
        </>
      }
    >
      {props.message ? <p className="ed-callout" role="status">{props.message}</p> : null}
      <h3 className="ed-subhead">What will be sent</h3>
      {lines.length ? (
        <ul className="ed-change-list">{lines.map((line, index) => <li key={`${index}-${line}`}>{line}</li>)}</ul>
      ) : (
        <p className="ed-hint">Nothing has changed since the last review.</p>
      )}
      <h3 className="ed-subhead">Earlier reviews</h3>
      {props.publications.length ? (
        <ul className="ed-history">
          {props.publications.map((item, index) => (
            <li key={`${item.status}-${index}`}>
              <span className="ed-tag">{item.status.replaceAll("_", " ").toLowerCase()}</span>
              <p>{item.summary.split("\n")[0]}</p>
              {item.reviewUrl ? <a className="ed-link" href={item.reviewUrl} target="_blank" rel="noreferrer">Open the review <ExternalLink size={12} aria-hidden="true" /></a> : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="ed-hint">No reviews yet.</p>
      )}
    </Dialog>
  );
}

const SHORTCUTS: [string, string][] = [
  ["Double-click or Enter", "Edit the selected text"],
  ["Esc", "Finish typing, then clear the selection"],
  ["Mod+B / Mod+I / Mod+U", "Bold, italic, underline"],
  ["Mod+K", "Add a link to selected words"],
  ["Mod+Z / Mod+Shift+Z", "Undo and redo"],
  ["Mod+D", "Duplicate the selection"],
  ["Delete", "Delete the selection"],
  ["Alt+Up / Alt+Down", "Move a section up or down"],
  ["Arrow keys", "Nudge a freeform item (Shift for bigger steps)"],
  ["G", "Show or hide the grid in a freeform zone"],
  ["?", "Show these shortcuts"],
];

export function ShortcutsDialog(props: { onClose: () => void }) {
  const mod = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl";
  return (
    <Dialog title="Keyboard shortcuts" onClose={props.onClose}>
      <dl className="ed-shortcuts">
        {SHORTCUTS.map(([keys, label]) => (
          <div key={keys}>
            <dt>{keys.split(" / ").map((combo, index) => <span key={combo}>{index ? " / " : ""}<Kbd>{combo.replaceAll("Mod", mod)}</Kbd></span>)}</dt>
            <dd>{label}</dd>
          </div>
        ))}
      </dl>
    </Dialog>
  );
}

export function ConfirmDialog(props: { title: string; body: string; confirmLabel: string; danger?: boolean; onConfirm: () => void; onClose: () => void }) {
  return (
    <Dialog
      title={props.title}
      onClose={props.onClose}
      footer={
        <>
          <button type="button" className="ed-button" onClick={props.onClose}>Cancel</button>
          <button type="button" className={props.danger ? "ed-button is-danger" : "ed-button is-primary"} onClick={props.onConfirm}>{props.confirmLabel}</button>
        </>
      }
    >
      <p>{props.body}</p>
    </Dialog>
  );
}

export function InsertDialog(props: {
  canEmbed: boolean;
  recent: string[];
  recommended: string[];
  templates: { id: string; name: string }[];
  onChoose: (entry: LibraryEntry) => void;
  onTemplate: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <Dialog title="Add a section here" wide onClose={props.onClose}>
      <LibraryBrowser canEmbed={props.canEmbed} recent={props.recent} recommended={props.recommended} templates={props.templates} onChoose={props.onChoose} onTemplate={props.onTemplate} autoFocus />
    </Dialog>
  );
}
