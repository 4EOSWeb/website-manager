"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { signOutUser } from "@/app/signin/actions";
import { Monitor, Redo2, Smartphone, Tablet, Undo2 } from "lucide-react";
import type { BlogDraft, HomeDraft } from "@/lib/content-schema";

type Route = { path: string; title: string; editable: boolean };
type MediaItem = { src: string; alt: string; filename: string };
type Publication = { status: string; summary: string; reviewUrl: string | null };

const viewports = [
  { id: "mobile", label: "Mobile", width: 390, icon: Smartphone },
  { id: "tablet", label: "Tablet", width: 768, icon: Tablet },
  { id: "desktop", label: "Desktop", width: 1280, icon: Monitor },
] as const;

export function EditorShell(props: {
  websiteId: string;
  websiteName: string;
  routes: Route[];
  initialHome: HomeDraft;
  initialBlog: BlogDraft;
  media: MediaItem[];
  canEdit: boolean;
  canPublish: boolean;
  role: string;
  userName: string;
  previewAccess: string;
  publications: Publication[];
}) {
  const [path, setPath] = useState("/");
  const [viewport, setViewport] = useState<(typeof viewports)[number]["id"]>("desktop");
  const [home, setHome] = useState(props.initialHome);
  const [past, setPast] = useState<HomeDraft[]>([]);
  const [future, setFuture] = useState<HomeDraft[]>([]);
  const [blog, setBlog] = useState(props.initialBlog);
  const [media, setMedia] = useState(props.media);
  const [panel, setPanel] = useState<"page" | "blog" | "media" | "history">("page");
  const [selected, setSelected] = useState("tagline");
  const [status, setStatus] = useState("Saved");
  const [notice, setNotice] = useState("");
  const [version, setVersion] = useState(0);
  const [publications, setPublications] = useState(props.publications);
  const skipFirstSave = useRef(true);

  function updateHome(next: HomeDraft) {
    setPast((items) => [...items.slice(-40), home]);
    setFuture([]);
    setHome(next);
  }

  useEffect(() => {
    if (skipFirstSave.current) {
      skipFirstSave.current = false;
      return;
    }
    const timer = window.setTimeout(async () => {
      if (!props.canEdit) return;
      setStatus("Saving");
      const response = await fetch(`/api/sites/${props.websiteId}/draft`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(home),
      });
      const body = (await response.json()) as { message?: string };
      setStatus(response.ok ? "Saved" : "Not saved");
      if (!response.ok && body.message) setNotice(body.message);
      if (response.ok) setVersion((value) => value + 1);
    }, 600);
    return () => window.clearTimeout(timer);
  }, [home, props.canEdit, props.websiteId]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      const frame = document.getElementById("site-preview") as HTMLIFrameElement | null;
      if (!frame || event.source !== frame.contentWindow) return;
      const data = event.data as { type?: string; path?: string; field?: string };
      if (data?.type === "4eos-navigate" && data.path) {
        const next = data.path.split("#")[0] || "/";
        setPath(next.startsWith("/preview/") ? "/" : next);
        setPanel("page");
      }
      if (data?.type === "4eos-select" && data.field) {
        setSelected(data.field);
        setPanel("page");
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    let timer = window.setTimeout(function idle() {
      void signOutUser();
    }, 30 * 60 * 1000);
    const reset = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => void signOutUser(), 30 * 60 * 1000);
    };
    window.addEventListener("pointerdown", reset);
    window.addEventListener("keydown", reset);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pointerdown", reset);
      window.removeEventListener("keydown", reset);
    };
  }, []);

  const width = viewports.find((item) => item.id === viewport)?.width ?? 1280;
  const previewSrc = useMemo(() => {
    const route = path === "/" ? "" : path;
    return `/preview/${props.websiteId}${route}?v=${version}&t=${encodeURIComponent(props.previewAccess)}`;
  }, [path, props.previewAccess, props.websiteId, version]);

  async function saveBlog() {
    setStatus("Saving");
    const response = await fetch(`/api/sites/${props.websiteId}/blog`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(blog),
    });
    const body = (await response.json()) as { message?: string };
    setStatus(response.ok ? "Saved" : "Not saved");
    setNotice(body.message ?? "");
    if (response.ok) {
      setPath(`/insights/${blog.slug}`);
      setVersion((value) => value + 1);
    }
  }

  async function upload(file: File) {
    const form = new FormData();
    form.set("file", file);
    form.set("alt", home.heroImage.alt);
    const response = await fetch(`/api/sites/${props.websiteId}/media`, { method: "POST", body: form });
    const body = (await response.json()) as { message?: string; src?: string; alt?: string; filename?: string };
    if (!response.ok || !body.src || !body.filename) {
      setNotice(body.message ?? "The image could not be added.");
      return;
    }
    setMedia((items) => [{ src: body.src!, alt: body.alt ?? "", filename: body.filename! }, ...items]);
    updateHome({ ...home, heroImage: { ...home.heroImage, src: body.src, alt: body.alt || home.heroImage.alt } });
  }

  async function confirmIdentity() {
    const response = await fetch(`/api/sites/${props.websiteId}/step-up`, { method: "POST" });
    const body = (await response.json()) as { message?: string };
    setNotice(body.message ?? "");
  }

  async function publish() {
    setStatus("Saving");
    const response = await fetch(`/api/sites/${props.websiteId}/publish`, { method: "POST" });
    const body = (await response.json()) as { message?: string; status?: string; reviewUrl?: string | null };
    setStatus(response.ok ? "Saved" : "Not saved");
    setNotice(body.message ?? "The changes could not be sent.");
    if (response.ok && body.status) {
      setPublications((items) => [{ status: body.status!, summary: body.message ?? "", reviewUrl: body.reviewUrl ?? null }, ...items]);
      setPanel("history");
    }
  }

  return (
    <div className="grid h-dvh grid-rows-[auto_1fr] bg-[var(--paper)] text-[var(--ink)]">
      <header className="flex items-center gap-3 border-b border-[var(--line)] bg-white px-4 py-2">
        <div className="min-w-0">
          <p className="truncate text-sm text-[var(--muted)]">{props.websiteName}</p>
          <p className="truncate font-medium">{props.routes.find((route) => route.path === path)?.title ?? path}</p>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <button className="icon-button" type="button" aria-label="Undo" disabled={past.length === 0} onClick={() => {
            const previous = past[past.length - 1];
            if (!previous) return;
            setPast(past.slice(0, -1));
            setFuture([home, ...future]);
            setHome(previous);
          }}>
            <Undo2 aria-hidden="true" size={16} />
          </button>
          <button className="icon-button" type="button" aria-label="Redo" disabled={future.length === 0} onClick={() => {
            const next = future[0];
            if (!next) return;
            setFuture(future.slice(1));
            setPast([...past, home]);
            setHome(next);
          }}>
            <Redo2 aria-hidden="true" size={16} />
          </button>
          {viewports.map((item) => (
            <button key={item.id} className={viewport === item.id ? "icon-button is-active" : "icon-button"} type="button" aria-label={item.label} aria-pressed={viewport === item.id} onClick={() => setViewport(item.id)}>
              <item.icon aria-hidden="true" size={16} />
            </button>
          ))}
          <span className="px-2 text-sm text-[var(--muted)]">{status}</span>
          {props.canPublish ? (
            <button className="bg-[var(--ink)] px-3 py-2 text-sm text-white" type="button" onClick={() => void publish()}>
              Submit for publish
            </button>
          ) : props.canEdit ? (
            <span className="px-2 text-sm text-[var(--muted)]">Drafts only</span>
          ) : (
            <span className="px-2 text-sm text-[var(--muted)]">View only</span>
          )}
          <details className="relative">
            <summary className="cursor-pointer list-none px-2 py-2 text-sm">{props.userName}</summary>
            <div className="absolute right-0 z-10 w-56 border border-[var(--line)] bg-white p-3 text-sm">
              <p>{props.role}</p>
              <form action={signOutUser} className="mt-2">
                <button type="submit">Sign out</button>
              </form>
            </div>
          </details>
        </div>
      </header>
      <div className="grid min-h-0 grid-cols-[16rem_1fr_20rem]">
        <aside className="overflow-auto border-r border-[var(--line)] bg-white p-3">
          <p className="px-2 text-xs tracking-wide text-[var(--muted)] uppercase">Pages</p>
          <ul className="mt-2">
            {props.routes.map((route) => (
              <li key={route.path}>
                <button className={path === route.path ? "nav-button is-active" : "nav-button"} type="button" onClick={() => { setPath(route.path); setPanel("page"); }}>
                  {route.title}
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-6 px-2 text-xs tracking-wide text-[var(--muted)] uppercase">Library</p>
          <button className={panel === "blog" ? "nav-button is-active" : "nav-button"} type="button" onClick={() => setPanel("blog")}>Insights draft</button>
          <button className={panel === "media" ? "nav-button is-active" : "nav-button"} type="button" onClick={() => setPanel("media")}>Media</button>
          <button className={panel === "history" ? "nav-button is-active" : "nav-button"} type="button" onClick={() => setPanel("history")}>Publish history</button>
        </aside>
        <div className="min-w-0 overflow-auto bg-[#e7e2da] p-4">
          <iframe id="site-preview" title={`${props.websiteName} preview`} sandbox="allow-scripts allow-forms" src={previewSrc} className="mx-auto h-full min-h-[40rem] border border-[var(--line)] bg-white" style={{ width: viewport === "desktop" ? "100%" : width }} />
        </div>
        <aside className="overflow-auto border-l border-[var(--line)] bg-white p-4">
          {notice ? <p className="mb-4 border border-[var(--line)] bg-[var(--paper)] p-3 text-sm leading-relaxed">{notice}</p> : null}
          {panel === "page" && path === "/" ? <HomeFields home={home} media={media} selected={selected} canEdit={props.canEdit} onChange={updateHome} onUpload={upload} /> : null}
          {panel === "page" && path !== "/" ? <p className="text-sm leading-relaxed">You can look through this page. Editing on this page is not open yet. The logo and its animation stay locked.</p> : null}
          {panel === "blog" ? <BlogFields blog={blog} canEdit={props.canEdit} onChange={setBlog} onSave={() => void saveBlog()} /> : null}
          {panel === "media" ? <MediaFields media={media} canEdit={props.canEdit} onUpload={upload} onUse={(src, alt) => updateHome({ ...home, heroImage: { ...home.heroImage, src, alt } })} /> : null}
          {panel === "history" ? <History publications={publications} onConfirm={() => void confirmIdentity()} /> : null}
        </aside>
      </div>
    </div>
  );
}

function HomeFields(props: {
  home: HomeDraft;
  media: MediaItem[];
  selected: string;
  canEdit: boolean;
  onChange: (home: HomeDraft) => void;
  onUpload: (file: File) => void;
}) {
  const disabled = !props.canEdit;
  return (
    <form className="grid gap-4" onSubmit={(event) => event.preventDefault()}>
      <label className="grid gap-1 text-sm">
        Heading
        <textarea className={props.selected === "tagline" ? "field is-active" : "field"} disabled={disabled} value={props.home.tagline} onChange={(event) => props.onChange({ ...props.home, tagline: event.target.value })} />
      </label>
      <label className="grid gap-1 text-sm">
        Paragraph
        <textarea className={props.selected === "positioning" ? "field is-active" : "field"} disabled={disabled} value={props.home.positioning} onChange={(event) => props.onChange({ ...props.home, positioning: event.target.value })} />
      </label>
      <label className="grid gap-1 text-sm">
        Button label
        <input className={props.selected === "primaryButton" ? "field is-active" : "field"} disabled={disabled} value={props.home.primaryButton.label} onChange={(event) => props.onChange({ ...props.home, primaryButton: { ...props.home.primaryButton, label: event.target.value } })} />
      </label>
      <label className="grid gap-1 text-sm">
        Button destination
        <input className="field" disabled={disabled} value={props.home.primaryButton.href} onChange={(event) => props.onChange({ ...props.home, primaryButton: { ...props.home.primaryButton, href: event.target.value } })} />
      </label>
      <fieldset className="grid gap-2 border border-[var(--line)] p-3" disabled={disabled}>
        <legend className="px-1 text-sm">Image placement</legend>
        <label className="text-sm">Where
          <select className="field" value={props.home.heroImage.placement} onChange={(event) => props.onChange({ ...props.home, heroImage: { ...props.home.heroImage, placement: event.target.value as HomeDraft["heroImage"]["placement"] } })}>
            <option value="with-copy">With the introduction</option>
            <option value="beside-mark">Beside the logo</option>
          </select>
        </label>
        <label className="text-sm">Alignment
          <select className="field" value={props.home.heroImage.align} onChange={(event) => props.onChange({ ...props.home, heroImage: { ...props.home.heroImage, align: event.target.value as HomeDraft["heroImage"]["align"] } })}>
            <option value="start">Left</option>
            <option value="end">Right</option>
          </select>
        </label>
        <label className="text-sm">Width
          <select className="field" value={props.home.heroImage.width} onChange={(event) => props.onChange({ ...props.home, heroImage: { ...props.home.heroImage, width: event.target.value as HomeDraft["heroImage"]["width"] } })}>
            <option value="narrow">Narrow</option>
            <option value="medium">Medium</option>
            <option value="wide">Wide</option>
          </select>
        </label>
        <label className="text-sm">Shape
          <select className="field" value={props.home.heroImage.aspect} onChange={(event) => props.onChange({ ...props.home, heroImage: { ...props.home.heroImage, aspect: event.target.value as HomeDraft["heroImage"]["aspect"] } })}>
            <option value="auto">Original</option>
            <option value="landscape">Landscape</option>
            <option value="square">Square</option>
          </select>
        </label>
        <label className="text-sm">Focal point
          <select className="field" value={props.home.heroImage.focal} onChange={(event) => props.onChange({ ...props.home, heroImage: { ...props.home.heroImage, focal: event.target.value as HomeDraft["heroImage"]["focal"] } })}>
            <option value="center">Center</option>
            <option value="top">Top</option>
            <option value="bottom">Bottom</option>
            <option value="left">Left</option>
            <option value="right">Right</option>
          </select>
        </label>
        <label className="text-sm">Library
          <select className="field" value={props.home.heroImage.src} onChange={(event) => {
            const chosen = props.media.find((item) => item.src === event.target.value);
            props.onChange({ ...props.home, heroImage: { ...props.home.heroImage, src: event.target.value, alt: chosen?.alt || props.home.heroImage.alt } });
          }}>
            <option value="">No image</option>
            {props.media.map((item) => <option key={item.filename} value={item.src}>{item.filename}</option>)}
          </select>
        </label>
        <label className="text-sm">Description
          <input className="field" value={props.home.heroImage.alt} onChange={(event) => props.onChange({ ...props.home, heroImage: { ...props.home.heroImage, alt: event.target.value } })} />
        </label>
        <label className="text-sm">Replace image
          <input className="field" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) props.onUpload(file);
          }} />
        </label>
      </fieldset>
    </form>
  );
}

function BlogFields(props: { blog: BlogDraft; canEdit: boolean; onChange: (blog: BlogDraft) => void; onSave: () => void }) {
  const disabled = !props.canEdit;
  const first = props.blog.blocks[0];
  return (
    <form className="grid gap-3" onSubmit={(event) => { event.preventDefault(); props.onSave(); }}>
      <p className="text-sm leading-relaxed text-[var(--muted)]">This creates an Insights draft. It uses the website’s article layout and does not accept raw HTML.</p>
      <label className="text-sm">Title<input className="field" disabled={disabled} value={props.blog.title} onChange={(event) => props.onChange({ ...props.blog, title: event.target.value })} /></label>
      <label className="text-sm">Web address<input className="field" disabled={disabled} value={props.blog.slug} onChange={(event) => props.onChange({ ...props.blog, slug: event.target.value })} /></label>
      <label className="text-sm">Excerpt<textarea className="field" disabled={disabled} value={props.blog.excerpt} onChange={(event) => props.onChange({ ...props.blog, excerpt: event.target.value })} /></label>
      <label className="text-sm">Author<input className="field" disabled={disabled} value={props.blog.authorDisplayName} onChange={(event) => props.onChange({ ...props.blog, authorDisplayName: event.target.value })} /></label>
      <label className="text-sm">Search title<input className="field" disabled={disabled} value={props.blog.seoTitle} onChange={(event) => props.onChange({ ...props.blog, seoTitle: event.target.value })} /></label>
      <label className="text-sm">Search description<textarea className="field" disabled={disabled} value={props.blog.metaDescription} onChange={(event) => props.onChange({ ...props.blog, metaDescription: event.target.value })} /></label>
      <label className="text-sm">Opening paragraph<textarea className="field" disabled={disabled} value={first && first.type === "paragraph" ? first.text : ""} onChange={(event) => props.onChange({ ...props.blog, blocks: [{ type: "paragraph", text: event.target.value }] })} /></label>
      <button className="bg-[var(--ink)] px-3 py-2 text-sm text-white" type="submit" disabled={disabled}>Save Insights draft</button>
    </form>
  );
}

function MediaFields(props: { media: MediaItem[]; canEdit: boolean; onUpload: (file: File) => void; onUse: (src: string, alt: string) => void }) {
  return (
    <div className="grid gap-3">
      {props.canEdit ? (
        <label className="text-sm">Upload
          <input className="field" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) props.onUpload(file);
          }} />
        </label>
      ) : null}
      <ul className="grid gap-2">
        {props.media.length === 0 ? <li className="text-sm text-[var(--muted)]">No images yet.</li> : null}
        {props.media.map((item) => (
          <li key={item.filename}>
            <button className="nav-button" type="button" onClick={() => props.onUse(item.src, item.alt)}>{item.filename}</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function History(props: { publications: Publication[]; onConfirm: () => void }) {
  return (
    <div className="grid gap-3">
      <p className="text-sm leading-relaxed">Submitting sends a review copy. It does not change the live website.</p>
      <button className="border border-[var(--ink)] px-3 py-2 text-sm" type="button" onClick={props.onConfirm}>Confirm it’s you</button>
      <ul className="grid gap-3">
        {props.publications.length === 0 ? <li className="text-sm text-[var(--muted)]">No reviews yet.</li> : null}
        {props.publications.map((item, index) => (
          <li key={`${item.status}-${index}`} className="border border-[var(--line)] p-3 text-sm">
            <p className="font-medium">{item.status.replaceAll("_", " ").toLowerCase()}</p>
            <p className="mt-2 whitespace-pre-wrap leading-relaxed">{item.summary}</p>
            {item.reviewUrl ? <a className="mt-2 inline-block underline" href={item.reviewUrl}>Open the review</a> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
