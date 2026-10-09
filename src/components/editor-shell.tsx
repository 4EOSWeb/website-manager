"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { signOutUser } from "@/app/signin/actions";
import { Monitor, Redo2, Smartphone, Tablet, Undo2 } from "lucide-react";
import {
  PROVIDER_LOCK_MESSAGE,
  SITE_AUTHORS,
  type BlogDraft,
  type FreeformItem,
  type PageDocument,
  type Section,
  type SiteDraft,
} from "@/lib/content-schema";
import { defaultBlogDraft } from "@/lib/content-schema";
import {
  addZoneItem,
  alignItems,
  applyText,
  createPage,
  deleteItem,
  deleteSection,
  duplicateItem,
  duplicatePage,
  duplicateSection,
  groupItems,
  imageUsage,
  insertSection,
  librarySection,
  deleteFlowBlock,
  duplicateFlowBlock,
  moveFlowBlock,
  moveSection,
  pageByRoute,
  patchChrome,
  patchItem,
  pinBlock,
  placeItems,
  renameZone,
  saveSectionTemplate,
  setArchived,
  setImageSource,
  reorderPages,
  setBlockHidden,
  setNavVisible,
  setSectionHidden,
  slugify,
  updatePageMeta,
} from "@/lib/editor-ops";
import { LIBRARY_BLOCKS, blockFitsInZone, catalogSection, createId } from "@/lib/page-documents";

type MediaItem = {
  src: string;
  alt: string;
  filename: string;
  bytes?: number;
  width?: number | null;
  height?: number | null;
  usedBy?: string[];
};
type Publication = { status: string; summary: string; reviewUrl: string | null };
type Selection = { sectionId: string; itemId: string; itemIds: string[]; overlay: boolean; locked: boolean };
type Snapshot = { site: SiteDraft; posts: BlogDraft[] };
type LibraryState = { index: number | null } | null;

const viewports = [
  { id: "mobile", label: "Mobile", width: 390, icon: Smartphone },
  { id: "tablet", label: "Tablet", width: 768, icon: Tablet },
  { id: "desktop", label: "Desktop", width: 1280, icon: Monitor },
] as const;

const emptySelection: Selection = { sectionId: "", itemId: "", itemIds: [], overlay: false, locked: false };

export function EditorShell(props: {
  websiteId: string;
  websiteName: string;
  initialSite: SiteDraft;
  initialPosts: BlogDraft[];
  media: MediaItem[];
  canEdit: boolean;
  canPublish: boolean;
  canEmbed: boolean;
  role: string;
  userName: string;
  previewAccess: string;
  publications: Publication[];
}) {
  const [path, setPath] = useState("/");
  const [viewport, setViewport] = useState<(typeof viewports)[number]["id"]>("desktop");
  const [site, setSite] = useState(props.initialSite);
  const [past, setPast] = useState<Snapshot[]>([]);
  const [future, setFuture] = useState<Snapshot[]>([]);
  const [posts, setPosts] = useState(props.initialPosts);
  const [media, setMedia] = useState(props.media);
  const [recent, setRecent] = useState<string[]>([]);
  const [panel, setPanel] = useState<"page" | "media" | "history">("page");
  const [rail, setRail] = useState<"add" | "pages" | "layers" | "design" | "media" | null>("pages");
  const [propTab, setPropTab] = useState<"content" | "design" | "layout">("content");
  const [chromeHidden, setChromeHidden] = useState(false);
  const [pageQuery, setPageQuery] = useState("");
  const [selection, setSelection] = useState<Selection>(emptySelection);
  const [library, setLibrary] = useState<LibraryState>(null);
  const [status, setStatus] = useState("Saved");
  const [notice, setNotice] = useState("");
  const [version, setVersion] = useState(0);
  const [publications, setPublications] = useState(props.publications);
  const [progress, setProgress] = useState<number | null>(null);
  const [picker, setPicker] = useState(false);
  const [crop, setCrop] = useState<{ filename: string; sectionId: string; itemId: string; overlay: boolean } | null>(null);
  const [templateFor, setTemplateFor] = useState("");
  const [addingPage, setAddingPage] = useState(false);
  const [pageForm, setPageForm] = useState({ title: "", route: "", template: "landing" as PageDocument["template"], navVisible: true, seoTitle: "", metaDescription: "" });
  const [routeTouched, setRouteTouched] = useState(false);
  const skipSite = useRef(true);
  const reloadAfter = useRef(false);
  const textKey = useRef("");
  const skipPost = useRef(true);

  const page = pageByRoute(site, path);
  const section = page?.sections.find((item) => item.id === selection.sectionId);
  const selectedBlock = section?.type === "flow" ? section.blocks.find((block) => block.id === selection.itemId) : undefined;
  const selectedText = selectedBlock?.text && typeof selectedBlock.text === "object" ? selectedBlock.text.text : "";
  const activePost = posts.find((item) => path === `/insights/${item.slug}`);

  function remember(filename: string) {
    setRecent((items) => [filename, ...items.filter((item) => item !== filename)].slice(0, 8));
  }

  function rememberHistory() {
    setPast((items) => [...items.slice(-40), { site, posts }]);
    setFuture([]);
  }

  function commit(next: SiteDraft, reload: boolean) {
    if (!props.canEdit) return;
    textKey.current = "";
    rememberHistory();
    setSite(next);
    if (reload) reloadAfter.current = true;
  }

  function commitText(next: SiteDraft, key: string) {
    if (!props.canEdit) return;
    if (textKey.current !== key) {
      textKey.current = key;
      rememberHistory();
    }
    setSite(next);
  }

  function undo() {
    const previous = past[past.length - 1];
    if (!previous) return;
    setPast(past.slice(0, -1));
    setFuture([{ site, posts }, ...future]);
    setSite(previous.site);
    setPosts(previous.posts);
    reloadAfter.current = true;
    textKey.current = "";
  }

  function redo() {
    const next = future[0];
    if (!next) return;
    setFuture(future.slice(1));
    setPast([...past, { site, posts }]);
    setSite(next.site);
    setPosts(next.posts);
    reloadAfter.current = true;
  }

  async function persistSite(next: SiteDraft) {
    setStatus("Saving");
    const response = await fetch(`/api/sites/${props.websiteId}/draft`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(next),
    });
    const body = (await response.json()) as { message?: string };
    setStatus(response.ok ? "Saved" : "Not saved");
    if (!response.ok && body.message) setNotice(body.message);
    return response.ok;
  }

  useEffect(() => {
    if (skipSite.current) {
      skipSite.current = false;
      return;
    }
    const shouldReload = reloadAfter.current;
    const timer = window.setTimeout(async () => {
      if (!props.canEdit) return;
      setStatus("Saving");
      const response = await fetch(`/api/sites/${props.websiteId}/draft`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(site),
      });
      const body = (await response.json()) as { message?: string };
      setStatus(response.ok ? "Saved" : "Not saved");
      if (!response.ok && body.message) setNotice(body.message);
      if (response.ok && shouldReload) {
        setVersion((value) => value + 1);
        void fetch(`/api/sites/${props.websiteId}/revisions`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(site) });
      }
      reloadAfter.current = false;
    }, 500);
    return () => window.clearTimeout(timer);
  }, [site, props.canEdit, props.websiteId]);

  useEffect(() => {
    if (skipPost.current) {
      skipPost.current = false;
      return;
    }
    if (!activePost || !props.canEdit) return;
    const shouldReload = reloadAfter.current;
    const timer = window.setTimeout(async () => {
      setStatus("Saving");
      const response = await fetch(`/api/sites/${props.websiteId}/blog`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(activePost),
      });
      const body = (await response.json()) as { message?: string };
      setStatus(response.ok ? "Saved" : "Not saved");
      if (!response.ok && body.message) setNotice(body.message);
      if (response.ok && shouldReload) {
        reloadAfter.current = false;
        setVersion((value) => value + 1);
      }
    }, 700);
    return () => window.clearTimeout(timer);
  }, [activePost, props.canEdit, props.websiteId]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, [contenteditable=true]")) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  useEffect(() => {
    let timer = window.setTimeout(() => void signOutUser(), 30 * 60 * 1000);
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

  function formatBlock(kind: "bold" | "italic" | "clear") {
    if (!selectedBlock || section?.type !== "flow") return;
    const current = selectedBlock.text && typeof selectedBlock.text === "object" ? selectedBlock.text : { text: "", marks: [] };
    const marks = kind === "clear" || current.text.length === 0 ? [] : [{ start: 0, end: current.text.length, kind }];
    commit(applyText(site, path, section.id, "text", current.text, selectedBlock.id, marks), false);
  }

  function runAction(action: string, sectionId: string, itemId: string, overlay: boolean, itemIdsFromCanvas: string[] = []) {
    if (action === "drag" || !sectionId) return;
    const flow = page?.sections.find((item) => item.id === sectionId);
    if (itemId && flow?.type === "flow") {
      if (action === "duplicate") commit(duplicateFlowBlock(site, path, sectionId, itemId), true);
      else if (action === "delete") commit(deleteFlowBlock(site, path, sectionId, itemId), true);
      else if (action === "hide" || action === "show") commit(setBlockHidden(site, path, sectionId, itemId, action === "hide"), true);
      else if (action === "pin") commit(pinBlock(site, path, sectionId, itemId, true), true);
      return;
    }
    if (itemId && action === "duplicate") commit(duplicateItem(site, path, sectionId, itemId, overlay), true);
    else if (itemId && action === "delete") commit(deleteItem(site, path, sectionId, itemId, overlay), true);
    else if (itemId && (action === "hide" || action === "show")) commit(patchItem(site, path, sectionId, itemId, { hidden: action === "hide" }, overlay), true);
    else if (itemId && (action === "lock" || action === "unlock")) commit(patchItem(site, path, sectionId, itemId, { locked: action === "lock" }, overlay), true);
    else if (itemId && (action === "forward" || action === "back")) {
      const items = overlay && section?.type === "preset" ? section.overlay ?? [] : section?.type === "freeform" ? section.items : [];
      const item = items.find((entry) => entry.id === itemId);
      commit(patchItem(site, path, sectionId, itemId, { zIndex: Math.max(0, (item?.zIndex ?? 1) + (action === "forward" ? 1 : -1)) }, overlay), true);
    } else if (itemId && action === "group") {
      const ids = itemIdsFromCanvas.length > 1 ? itemIdsFromCanvas : selection.itemIds.length > 1 ? selection.itemIds : [itemId];
      commit(groupItems(site, path, sectionId, ids, overlay), true);
    }
    else if (action === "duplicate") commit(duplicateSection(site, path, sectionId), true);
    else if (action === "delete") commit(deleteSection(site, path, sectionId), true);
    else if (action === "hide" || action === "show") commit(setSectionHidden(site, path, sectionId, action === "hide"), true);
    else if (action === "up" || action === "down") {
      const index = page?.sections.findIndex((item) => item.id === sectionId) ?? -1;
      if (index < 0) return;
      commit(moveSection(site, path, index, action === "up" ? index - 1 : index + 2), true);
    } else if (action === "template") setTemplateFor(sectionId);
  }

  function runMenu(action: string, sectionId: string, itemId: string, overlay: boolean) {
    if (action === "replace") {
      setSelection({ sectionId, itemId, itemIds: itemId ? [itemId] : [], overlay, locked: false });
      setPicker(true);
    } else if (action === "alt") {
      setSelection({ sectionId, itemId, itemIds: itemId ? [itemId] : [], overlay, locked: false });
    } else if (action === "crop") {
      const filename = imageSrc(sectionId, itemId).split("/").pop() ?? "";
      if (filename) setCrop({ filename, sectionId, itemId, overlay });
    } else runAction(action === "duplicate" || action === "delete" ? action : action, sectionId, itemId, overlay);
  }

  function imageSrc(sectionId: string, itemId: string) {
    const current = page?.sections.find((item) => item.id === sectionId);
    if (!current) return activePost?.featuredImage?.src ?? "";
    if (itemId && current.type === "freeform") return current.items.find((item) => item.id === itemId)?.src ?? "";
    if (itemId && current.type === "preset") return (current.overlay ?? []).find((item) => item.id === itemId)?.src ?? "";
    if (current.type === "image") return current.src;
    if (current.type === "preset" && current.heroImage) return current.heroImage.src;
    return "";
  }

  async function upload(file: File, alt: string) {
    setProgress(0);
    const body = await new Promise<MediaItem>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `/api/sites/${props.websiteId}/media`);
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) setProgress(Math.round((event.loaded / event.total) * 100));
      };
      xhr.onload = () => {
        setProgress(null);
        const parsed = JSON.parse(xhr.responseText) as MediaItem & { message?: string };
        if (xhr.status >= 400) reject(new Error(parsed.message || "The image could not be added."));
        else resolve(parsed);
      };
      xhr.onerror = () => {
        setProgress(null);
        reject(new Error("The image could not be added."));
      };
      const form = new FormData();
      form.set("file", file);
      form.set("alt", alt);
      xhr.send(form);
    });
    setMedia((items) => [body, ...items.filter((item) => item.filename !== body.filename)]);
    remember(body.filename);
    return body;
  }

  async function placeDropped(dataUrl: string, name: string, sectionId: string, itemId: string, overlay: boolean) {
    try {
      const file = fileFromDataUrl(dataUrl, name);
      const saved = await upload(file, "");
      if (activePost && path.startsWith("/insights/") && !sectionId) {
        setPosts((items) => items.map((item) => (item.slug === activePost.slug ? { ...item, featuredImage: { src: saved.src, alt: saved.alt } } : item)));
        reloadAfter.current = true;
        setVersion((value) => value + 1);
        return;
      }
      if (!sectionId) return;
      const current = pageByRoute(site, path)?.sections.find((item) => item.id === sectionId);
      if (!itemId && (current?.type === "freeform" || overlay)) {
        const withItem = addZoneItem(site, path, sectionId, "image", overlay);
        const added = pageByRoute(withItem, path)?.sections.find((item) => item.id === sectionId);
        const items = added && added.type === "freeform" ? added.items : added && added.type === "preset" ? added.overlay ?? [] : [];
        const created = items[items.length - 1];
        commit(created ? setImageSource(withItem, path, sectionId, saved.src, saved.alt, created.id) : withItem, true);
        return;
      }
      commit(setImageSource(site, path, sectionId, saved.src, saved.alt, itemId || undefined), true);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The image could not be added.");
    }
  }

  function chooseImage(item: MediaItem) {
    remember(item.filename);
    if (activePost && picker && path.startsWith("/insights/")) {
      setPosts((items) => items.map((post) => (post.slug === activePost.slug ? { ...post, featuredImage: { src: item.src, alt: item.alt } } : post)));
      setPicker(false);
      reloadAfter.current = true;
      setVersion((value) => value + 1);
      return;
    }
    if (!selection.sectionId) return;
    commit(setImageSource(site, path, selection.sectionId, item.src, item.alt, selection.itemId || undefined), true);
    setPicker(false);
  }

  function updateBlog(field: string, index: unknown, value: string) {
    if (!activePost) return;
    const key = `blog:${field}:${String(index ?? "")}`;
    if (textKey.current !== key) {
      textKey.current = key;
      rememberHistory();
    }
    setPosts((items) =>
      items.map((post) => {
        if (post.slug !== activePost.slug) return post;
        if (field === "title") return { ...post, title: value };
        if (field === "author") return { ...post, authorDisplayName: value };
        const blockIndex = Number(index);
        if (!Number.isInteger(blockIndex)) return post;
        return {
          ...post,
          blocks: post.blocks.map((block, blockAt) => {
            if (blockAt !== blockIndex) return block;
            if ((block.type === "paragraph" || block.type === "heading" || block.type === "quote") && field === "text") return { ...block, text: value };
            if (block.type === "link" && field === "label") return { ...block, label: value };
            if (block.type === "list" && field.startsWith("item.")) {
              const itemIndex = Number(field.split(".")[1]);
              return { ...block, items: block.items.map((entry, entryIndex) => (entryIndex === itemIndex ? value : entry)) };
            }
            if (block.type === "table" && field.startsWith("header.")) {
              const headerIndex = Number(field.split(".")[1]);
              return { ...block, headers: block.headers.map((entry, entryIndex) => (entryIndex === headerIndex ? value : entry)) };
            }
            if (block.type === "table" && field.startsWith("cell.")) {
              const [, rowText, cellText] = field.split(".");
              const rowIndex = Number(rowText);
              const cellIndex = Number(cellText);
              return {
                ...block,
                rows: block.rows.map((row, currentRow) =>
                  currentRow === rowIndex ? row.map((cell, currentCell) => (currentCell === cellIndex ? value : cell)) : row,
                ),
              };
            }
            return block;
          }),
        };
      }),
    );
  }

  function addBlogBlock(block: BlogDraft["blocks"][number]) {
    if (!activePost) return;
    rememberHistory();
    reloadAfter.current = true;
    setPosts((items) => items.map((post) => (post.slug === activePost.slug ? { ...post, blocks: [...post.blocks, block] } : post)));
  }

  async function createInsight() {
    const post = { ...defaultBlogDraft, slug: `note-${createId("n").slice(-4)}`, title: "New insight" };
    setStatus("Saving");
    const response = await fetch(`/api/sites/${props.websiteId}/blog`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(post),
    });
    const body = (await response.json()) as { message?: string };
    if (!response.ok) {
      setStatus("Not saved");
      setNotice(body.message ?? "The post could not be created.");
      return;
    }
    rememberHistory();
    skipPost.current = true;
    setPosts((items) => [post, ...items]);
    setStatus("Saved");
    openPage(`/insights/${post.slug}`);
  }

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      const frame = document.getElementById("site-preview") as HTMLIFrameElement | null;
      if (!frame || event.source !== frame.contentWindow || !event.data || typeof event.data !== "object") return;
      const data = event.data as Record<string, unknown>;
      if (data.type === "4eos-navigate" && typeof data.path === "string") {
        const next = data.path.split("#")[0] || "/";
        setPath(next.startsWith("/preview/") ? "/" : next);
        setPanel("page");
        setSelection(emptySelection);
      }
      if (data.type === "4eos-select") {
        const itemId = String(data.itemId ?? "");
        const itemIds = Array.isArray(data.itemIds) ? data.itemIds.map((item) => String(item)).filter(Boolean) : itemId ? [itemId] : [];
        setSelection({
          sectionId: String(data.sectionId ?? ""),
          itemId,
          itemIds,
          overlay: Boolean(data.overlay),
          locked: Boolean(data.locked),
        });
        setPanel("page");
      }
      if (data.type === "4eos-text") {
        const marks = Array.isArray(data.marks) ? data.marks.flatMap((mark) => {
          if (!mark || typeof mark !== "object") return [];
          const item = mark as { start?: number; end?: number; kind?: string; href?: string; color?: string };
          if (item.kind !== "bold" && item.kind !== "italic" && item.kind !== "link" && item.kind !== "color") return [];
          const kind = item.kind as "bold" | "italic" | "link" | "color";
          return [{ start: Number(item.start), end: Number(item.end), kind, href: item.href, color: item.color }];
        }) : undefined;
        commitText(
          applyText(site, path, String(data.sectionId ?? ""), String(data.field ?? "text"), String(data.value ?? ""), String(data.itemId ?? "") || undefined, marks),
          `${data.sectionId}:${data.itemId}:${data.field}`,
        );
      }
      if (data.type === "4eos-nav" && typeof data.route === "string") {
        commit(updatePageMeta(site, data.route, { navLabel: String(data.value ?? "") }), false);
      }
      if (data.type === "4eos-reorder-block") {
        commit(moveFlowBlock(site, path, String(data.sectionId ?? ""), Number(data.from), Number(data.to)), true);
      }
      if (data.type === "4eos-insert") setLibrary({ index: Number(data.index ?? 0) });
      if (data.type === "4eos-move") commit(moveSection(site, path, Number(data.from), Number(data.to)), true);
      if (data.type === "4eos-chrome") {
        const field = String(data.field ?? "");
        const value = String(data.value ?? "");
        const chrome = structuredClone(site.chrome);
        if (field === "buttonLabel") chrome.header.buttonLabel = value;
        if (field === "note") chrome.footer.note = value;
        if (field === "copyright") chrome.footer.copyright = value;
        if (field === "cookie") chrome.cookieText = value;
        if (field === "announcement") chrome.announcement.text = value;
        commit(patchChrome(site, chrome), false);
      }
      if (data.type === "4eos-action") {
        const canvasIds = Array.isArray(data.itemIds) ? data.itemIds.map((item) => String(item)).filter(Boolean) : [];
        runAction(String(data.action ?? ""), String(data.sectionId ?? ""), String(data.itemId ?? ""), Boolean(data.overlay), canvasIds);
      }
      if (data.type === "4eos-place" && Array.isArray(data.items)) {
        const viewportName = data.viewport === "mobile" || data.viewport === "tablet" || data.viewport === "desktop" ? data.viewport : "desktop";
        commit(
          placeItems(
            site,
            path,
            String(data.sectionId ?? ""),
            viewportName,
            (data.items as { id: string; placement: { x: number; y: number; w: number; h: number } }[]).filter((item) => item && item.placement),
            Boolean(data.overlay),
          ),
          false,
        );
      }
      if (data.type === "4eos-drop" && typeof data.dataUrl === "string") {
        void placeDropped(String(data.dataUrl), String(data.name ?? "image.png"), String(data.sectionId ?? ""), String(data.itemId ?? ""), Boolean(data.overlay));
      }
      if (data.type === "4eos-menu") runMenu(String(data.action ?? ""), String(data.sectionId ?? ""), String(data.itemId ?? ""), Boolean(data.overlay));
      if (data.type === "4eos-blog") updateBlog(String(data.field ?? ""), data.index, String(data.value ?? ""));
      if (data.type === "4eos-key" && data.key === "z") {
        if (data.shift) redo();
        else undo();
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  });

  function chooseLibrary(type: (typeof LIBRARY_BLOCKS)[number]["type"]) {
    const block = librarySection(type, props.canEmbed);
    const kind = blockFitsInZone(type);
    const intoZone = library?.index == null && kind && section && (section.type === "freeform" || (selection.overlay && section.type === "preset"));
    if (intoZone && kind) {
      commit(addZoneItem(site, path, section.id, kind as FreeformItem["kind"], selection.overlay || section.type === "preset"), true);
    } else if (block) {
      const index = library?.index ?? page?.sections.length ?? 0;
      commit(insertSection(site, path, index, block), true);
    }
    setLibrary(null);
  }

  function openPage(route: string) {
    setPath(route);
    setPanel("page");
    setSelection(emptySelection);
    setVersion((value) => value + 1);
    document.getElementById("site-preview")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  const width = viewports.find((item) => item.id === viewport)?.width ?? 1280;
  const previewSrc = useMemo(() => {
    const route = path === "/" ? "" : path;
    return `/preview/${props.websiteId}${route}?v=${version}&t=${encodeURIComponent(props.previewAccess)}`;
  }, [path, props.previewAccess, props.websiteId, version]);

  const usedHere = media.map((item) => ({ ...item, usedBy: item.usedBy ?? imageUsage(site, posts, item.filename) }));

  return (
    <div className="grid h-dvh grid-rows-[auto_1fr] bg-[var(--paper)] text-[var(--ink)]">
      <header className="flex items-center gap-3 border-b border-[var(--line)] bg-white px-4 py-2">
        <div className="min-w-0">
          <p className="truncate text-sm text-[var(--muted)]">{props.websiteName}</p>
          <p className="truncate font-medium">{page?.title ?? activePost?.title ?? path}</p>
        </div>
        <div className="ml-auto flex items-center gap-1">
          {selection.sectionId && !selection.locked ? (
            <>
              <button className="icon-button" type="button" onClick={() => runAction("duplicate", selection.sectionId, selection.itemId, selection.overlay, selection.itemIds)}>Duplicate</button>
              <button className="icon-button" type="button" onClick={() => runAction("delete", selection.sectionId, selection.itemId, selection.overlay, selection.itemIds)}>Delete</button>
              <button className="icon-button" type="button" onClick={() => runAction(selection.itemId ? "hide" : "hide", selection.sectionId, selection.itemId, selection.overlay, selection.itemIds)}>Hide</button>
              <button className="icon-button" type="button" onClick={() => setPropTab("design")}>Design</button>
            </>
          ) : null}
          <button className="icon-button" type="button" aria-label="Undo" disabled={past.length === 0} onClick={undo}><Undo2 aria-hidden="true" size={16} /></button>
          <button className="icon-button" type="button" aria-label="Redo" disabled={future.length === 0} onClick={redo}><Redo2 aria-hidden="true" size={16} /></button>
          {viewports.map((item) => (
            <button key={item.id} className={viewport === item.id ? "icon-button is-active" : "icon-button"} type="button" aria-label={item.label} aria-pressed={viewport === item.id} onClick={() => setViewport(item.id)}>
              <item.icon aria-hidden="true" size={16} />
            </button>
          ))}
          <button className="icon-button" type="button" onClick={() => setChromeHidden((value) => !value)}>{chromeHidden ? "Show panels" : "Hide panels"}</button>
          <a className="icon-button" href={previewSrc} target="_blank" rel="noreferrer">Preview</a>
          <span className="px-2 text-sm text-[var(--muted)]">{status}</span>
          {progress !== null ? <span className="px-2 text-sm">Uploading {progress}%</span> : null}
          {props.canPublish ? (
            <button className="bg-[var(--ink)] px-3 py-2 text-sm text-white" type="button" onClick={() => void publish()}>Submit for publish</button>
          ) : props.canEdit ? (
            <span className="px-2 text-sm text-[var(--muted)]">Drafts only</span>
          ) : (
            <span className="px-2 text-sm text-[var(--muted)]">View only</span>
          )}
          <details className="relative">
            <summary className="cursor-pointer list-none px-2 py-2 text-sm">{props.userName}</summary>
            <div className="absolute right-0 z-10 w-56 border border-[var(--line)] bg-white p-3 text-sm">
              <p>{props.role}</p>
              <form action={signOutUser} className="mt-2"><button type="submit">Sign out</button></form>
            </div>
          </details>
        </div>
      </header>
      <div className={`grid min-h-0 ${chromeHidden ? "grid-cols-[3.5rem_1fr]" : "grid-cols-[auto_1fr_20rem]"}`}>
        <div className="flex min-h-0">
        <nav className="flex w-14 shrink-0 flex-col items-center gap-1 bg-[#2f1d31] py-2 text-white" aria-label="Editor">
          {([
            ["add", "Add"],
            ["pages", "Pages"],
            ["layers", "Layers"],
            ["design", "Design"],
            ["media", "Media"],
          ] as const).map(([id, label]) => (
            <button key={id} type="button" className={`min-h-11 w-12 text-[10px] ${rail === id ? "bg-white/20" : ""}`} onClick={() => setRail((current) => (current === id ? null : id))}>{label}</button>
          ))}
        </nav>
        {rail && !chromeHidden ? <aside className="w-64 overflow-auto border-r border-[var(--line)] bg-white p-3">
          {rail === "pages" ? (
            <>
              <div className="flex items-center justify-between">
                <p className="px-2 text-xs tracking-wide text-[var(--muted)] uppercase">Main navigation</p>
                {props.canEdit ? <button className="px-2 text-sm" type="button" onClick={() => { setRouteTouched(false); setPageForm({ title: "", route: "", template: "landing", navVisible: true, seoTitle: "", metaDescription: "" }); setAddingPage(true); }}>Add page</button> : null}
              </div>
              <input className="field mt-2" placeholder="Search pages" value={pageQuery} onChange={(event) => setPageQuery(event.target.value)} />
              <ul className="mt-2">
                {site.pages.filter((item) => !item.archived && item.navVisible && `${item.title} ${item.route}`.toLowerCase().includes(pageQuery.toLowerCase())).map((item, index) => (
                  <li key={item.route} draggable={item.route !== "/"} onDragStart={(event) => event.dataTransfer.setData("text/plain", String(index))} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); commit(reorderPages(site, Number(event.dataTransfer.getData("text/plain")), index), true); }}>
                    <button className={path === item.route ? "nav-button is-active" : "nav-button"} type="button" onClick={() => openPage(item.route)}>
                      {item.route === "/" ? "Home · " : ""}{item.navLabel || item.title}{item.locked ? " · Managed" : ""}
                    </button>
                  </li>
                ))}
              </ul>
              <p className="mt-6 px-2 text-xs tracking-wide text-[var(--muted)] uppercase">Not in the menu</p>
              <ul>
                {site.pages.filter((item) => !item.archived && !item.navVisible).map((item) => (
                  <li key={item.route}><button className="nav-button" type="button" onClick={() => openPage(item.route)}>{item.title}</button></li>
                ))}
              </ul>
              <p className="mt-6 px-2 text-xs tracking-wide text-[var(--muted)] uppercase">Archived</p>
              <ul>
                {site.pages.filter((item) => item.archived).map((item) => (
                  <li key={item.route}><button className="nav-button" type="button" onClick={() => openPage(item.route)}>{item.title}</button></li>
                ))}
              </ul>
              <button className="nav-button" type="button" onClick={() => void createInsight()}>New Insights post</button>
              {posts.map((post) => (
                <button key={post.slug} className={path === `/insights/${post.slug}` ? "nav-button is-active" : "nav-button"} type="button" onClick={() => openPage(`/insights/${post.slug}`)}>{post.title}</button>
              ))}
              <button className="nav-button" type="button" onClick={() => setPanel("history")}>Publish history</button>
            </>
          ) : null}
          {rail === "add" ? (
            <div className="grid gap-2">
              <p className="px-2 text-xs tracking-wide text-[var(--muted)] uppercase">Sections</p>
              {(["hero", "split", "cards", "list", "stack"] as const).map((layout) => (
                <button key={layout} className="nav-button" type="button" onClick={() => page && commit(insertSection(site, path, page.sections.length, catalogSection(layout)), true)}>{layout === "hero" ? "Hero" : layout === "split" ? "Text beside an image" : layout === "cards" ? "Features" : layout === "list" ? "List" : "Blank"}</button>
              ))}
              <p className="mt-4 px-2 text-xs tracking-wide text-[var(--muted)] uppercase">Blocks</p>
              {LIBRARY_BLOCKS.filter((item) => item.type !== "embed" || props.canEmbed).map((item) => (
                <button key={item.type} className="nav-button" type="button" onClick={() => chooseLibrary(item.type)}>{item.label}</button>
              ))}
            </div>
          ) : null}
          {rail === "layers" ? (
            <div>
              <p className="px-2 text-xs tracking-wide text-[var(--muted)] uppercase">This page</p>
              <button className="nav-button" type="button" onClick={() => setSelection(emptySelection)}>Header</button>
              {(page?.sections ?? []).map((item, index) => (
                <div key={item.id}>
                  <button className={selection.sectionId === item.id && !selection.itemId ? "nav-button is-active" : "nav-button"} type="button" draggable onDragStart={(event) => event.dataTransfer.setData("text/plain", String(index))} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); commit(moveSection(site, path, Number(event.dataTransfer.getData("text/plain")), index), true); }} onClick={() => setSelection({ sectionId: item.id, itemId: "", itemIds: [], overlay: false, locked: false })}>
                    {item.editorName || item.type}
                  </button>
                  {item.type === "flow" ? item.blocks.map((block) => (
                    <button key={block.id} className={selection.itemId === block.id ? "nav-button is-active pl-6" : "nav-button pl-6"} type="button" onClick={() => setSelection({ sectionId: item.id, itemId: block.id, itemIds: [block.id], overlay: false, locked: Boolean(block.locked) })}>{block.editorName || block.kind}</button>
                  )) : null}
                </div>
              ))}
              <button className="nav-button" type="button">Footer</button>
              {viewport === "mobile" ? <p className="mt-4 px-2 text-xs text-[var(--muted)]">Hidden on this phone</p> : null}
            </div>
          ) : null}
          {rail === "design" ? (
            <div className="grid gap-3 text-sm">
              <p className="font-medium">Site styles</p>
              <label>Button style
                <select className="field" value={site.chrome.theme.button} onChange={(event) => commit(patchChrome(site, { ...site.chrome, theme: { ...site.chrome.theme, button: event.target.value as "filled" | "outline" } }), true)}>
                  <option value="filled">Filled</option>
                  <option value="outline">Outline</option>
                </select>
              </label>
              <label>Type
                <select className="field" value={site.chrome.theme.font} onChange={(event) => commit(patchChrome(site, { ...site.chrome, theme: { ...site.chrome.theme, font: event.target.value as "serif" | "sans" } }), true)}>
                  <option value="serif">Serif headings</option>
                  <option value="sans">Sans headings</option>
                </select>
              </label>
              <label>Spacing
                <select className="field" value={site.chrome.theme.spacing} onChange={(event) => commit(patchChrome(site, { ...site.chrome, theme: { ...site.chrome.theme, spacing: event.target.value as "compact" | "comfortable" | "roomy" } }), true)}>
                  <option value="compact">Compact</option>
                  <option value="comfortable">Comfortable</option>
                  <option value="roomy">Roomy</option>
                </select>
              </label>
              <label>Business name<input className="field" value={site.chrome.profile.name} onChange={(event) => commit(patchChrome(site, { ...site.chrome, profile: { ...site.chrome.profile, name: event.target.value } }), false)} /></label>
              <label>Phone<input className="field" value={site.chrome.profile.phone} onChange={(event) => commit(patchChrome(site, { ...site.chrome, profile: { ...site.chrome.profile, phone: event.target.value } }), false)} /></label>
              <label>Email<input className="field" value={site.chrome.profile.email} onChange={(event) => commit(patchChrome(site, { ...site.chrome, profile: { ...site.chrome.profile, email: event.target.value } }), false)} /></label>
              <label>Address<textarea className="field" value={site.chrome.profile.address} onChange={(event) => commit(patchChrome(site, { ...site.chrome, profile: { ...site.chrome.profile, address: event.target.value } }), false)} /></label>
              <label>Cookie notice<textarea className="field" value={site.chrome.cookieText} onChange={(event) => commit(patchChrome(site, { ...site.chrome, cookieText: event.target.value }), false)} /></label>
              <label>Analytics id for review<input className="field" value={site.chrome.analyticsId} onChange={(event) => commit(patchChrome(site, { ...site.chrome, analyticsId: event.target.value.replace(/[^A-Za-z0-9-]/g, "") }), false)} /></label>
            </div>
          ) : null}
          {rail === "media" ? (
            <MediaPanel media={usedHere} recent={recent} canEdit={props.canEdit} progress={progress} onUpload={(file) => void upload(file, "").catch((error: Error) => setNotice(error.message))} onUse={chooseImage} onDelete={(filename) => void removeMedia(filename)} />
          ) : null}
        </aside> : null}
        </div>
        <div className="min-w-0 overflow-auto bg-[#e7e2da] p-4">
          <iframe id="site-preview" title={`${props.websiteName} preview`} sandbox="allow-scripts allow-forms" src={previewSrc} className="mx-auto h-full min-h-[40rem] border border-[var(--line)] bg-white" style={{ width }} />
        </div>
        {!chromeHidden ? <aside className="overflow-auto border-l border-[var(--line)] bg-white p-4">
          <div className="mb-4 flex gap-2 text-sm">
            {(["content", "design", "layout"] as const).map((tab) => (
              <button key={tab} type="button" className={propTab === tab ? "border-b-2 border-[var(--ink)]" : ""} onClick={() => setPropTab(tab)}>{tab[0]?.toUpperCase()}{tab.slice(1)}</button>
            ))}
          </div>
          {notice ? <p className="mb-4 border border-[var(--line)] bg-[var(--paper)] p-3 text-sm leading-relaxed">{notice}</p> : null}
          {selection.locked ? <p className="text-sm leading-relaxed">{PROVIDER_LOCK_MESSAGE}</p> : null}
          {panel === "history" ? <History publications={publications} onConfirm={() => void confirmIdentity()} /> : null}
          {panel === "media" ? (
            <MediaPanel
              media={usedHere}
              recent={recent}
              canEdit={props.canEdit}
              progress={progress}
              onUpload={(file) => void upload(file, "").catch((error: Error) => setNotice(error.message))}
              onUse={chooseImage}
              onDelete={(filename) => void removeMedia(filename)}
            />
          ) : null}
          {selectedBlock && ["eyebrow", "heading", "paragraph", "button", "link", "card", "quote", "person"].includes(selectedBlock.kind) ? (
            <div className="mb-4 grid gap-2 border border-[var(--line)] p-3">
              <p className="font-medium">Text</p>
              <p>{selectedText}</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => formatBlock("bold")}>Bold</button>
                <button type="button" onClick={() => formatBlock("italic")}>Italic</button>
                <button type="button" onClick={() => formatBlock("clear")}>Clear formatting</button>
              </div>
              {selectedBlock.kind === "button" || selectedBlock.kind === "link" ? (
                <label>Where this goes<input className="field" value={selectedBlock.href ?? ""} onChange={(event) => section && commit(applyText(site, path, section.id, "href", event.target.value, selectedBlock.id), false)} /></label>
              ) : null}
            </div>
          ) : null}
          {panel === "page" && !selection.locked ? (
            <Settings
              page={page}
              section={section}
              selection={selection}
              post={activePost}
              canEdit={props.canEdit}
              viewport={viewport}
              onPage={(patch) => page && commit(updatePageMeta(site, page.route, patch), false)}
              onNav={(visible) => page && commit(setNavVisible(site, page.route, visible), true)}
              onArchive={(archived) => page && commit(setArchived(site, page.route, archived), true)}
              onDuplicate={() => {
                if (!page) return;
                const result = duplicatePage(site, page.route);
                if (result.error) setNotice(result.error);
                else if (result.route) void persistSite(result.site).then((ok) => {
                  if (!ok || !result.route) return;
                  rememberHistory();
                  skipSite.current = true;
                  setSite(result.site);
                  openPage(result.route);
                });
              }}
              onZoneName={(name) => selection.sectionId && commit(renameZone(site, path, selection.sectionId, name), false)}
              onAlign={(mode) => {
                const ids = selection.itemIds.length > 0 ? selection.itemIds : selection.itemId ? [selection.itemId] : [];
                if (selection.sectionId && ids.length) commit(alignItems(site, path, selection.sectionId, ids, viewport, mode, selection.overlay), true);
              }}
              onAlt={(alt) => {
                if (!selection.sectionId) return;
                if (selection.itemId) commit(patchItem(site, path, selection.sectionId, selection.itemId, { alt }, selection.overlay), false);
                else if (section?.type === "preset" && section.heroImage) commit(applySectionHero(site, path, section.id, { ...section.heroImage, alt }), false);
                else commit(applyText(site, path, selection.sectionId, "alt", alt), false);
              }}
              onHref={(href) => selection.sectionId && commit(applyText(site, path, selection.sectionId, section?.type === "button" ? "href" : section?.type === "preset" ? "buttonHref" : "href", href, selection.itemId || undefined), false)}
              onVideo={(url) => selection.sectionId && commit(applyText(site, path, selection.sectionId, "url", url), false)}
              onHero={(patch) => {
                if (!section || section.type !== "preset" || !section.heroImage) return;
                commit(applySectionHero(site, path, section.id, { ...section.heroImage, ...patch }), true);
              }}
              onReplace={() => setPicker(true)}
              onPost={(next) => {
                rememberHistory();
                textKey.current = "";
                setPosts((items) => items.map((item) => (item.slug === next.slug ? next : item)));
              }}
              onBlogBlock={addBlogBlock}
              templateFor={templateFor}
              onTemplate={(name) => {
                commit(saveSectionTemplate(site, path, templateFor, name), false);
                setTemplateFor("");
              }}
            />
          ) : null}
        </aside> : null}
      </div>
      {library ? (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/30 p-6">
          <div className="max-h-[80vh] w-full max-w-3xl overflow-auto bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-2xl">Add element</h2>
              <button type="button" onClick={() => setLibrary(null)}>Close</button>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {LIBRARY_BLOCKS.filter((item) => item.type !== "embed" || props.canEmbed).map((item) => (
                <button key={item.type} className="border border-[var(--line)] px-3 py-4 text-left" type="button" onClick={() => chooseLibrary(item.type)}>{item.label}</button>
              ))}
            </div>
            {site.sectionTemplates.length > 0 ? <p className="mt-6 text-sm text-[var(--muted)]">Saved templates</p> : null}
            <div className="mt-2 grid gap-2">
              {site.sectionTemplates.map((item) => (
                <button key={item.id} className="border border-[var(--line)] px-3 py-3 text-left" type="button" onClick={() => {
                  const copy = structuredClone(item.section);
                  copy.id = createId("sec");
                  commit(insertSection(site, path, library.index ?? page?.sections.length ?? 0, copy), true);
                  setLibrary(null);
                }}>{item.name}</button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
      {addingPage ? (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/30 p-6">
          <form className="grid w-full max-w-lg gap-3 bg-white p-6" onSubmit={(event) => { void (async () => {
            event.preventDefault();
            const result = createPage(site, pageForm.route ? pageForm : { ...pageForm, route: `/${slugify(pageForm.title)}` });
            if (result.error) setNotice(result.error);
            else {
              const created = result.site.pages[result.site.pages.length - 1];
              const ok = await persistSite(result.site);
              if (!ok || !created) return;
              rememberHistory();
              skipSite.current = true;
              setSite(result.site);
              setAddingPage(false);
              openPage(created.route);
            }
          })(); }}>
            <h2 className="font-serif text-2xl">Add page</h2>
            <label className="text-sm">Page name<input className="field" value={pageForm.title} onChange={(event) => setPageForm({ ...pageForm, title: event.target.value, route: routeTouched ? pageForm.route : `/${slugify(event.target.value)}` })} /></label>
            <label className="text-sm">Web address<input className="field" value={pageForm.route} onChange={(event) => { setRouteTouched(true); setPageForm({ ...pageForm, route: event.target.value }); }} /></label>
            <label className="text-sm">Starting layout
              <select className="field" value={pageForm.template} onChange={(event) => setPageForm({ ...pageForm, template: event.target.value as PageDocument["template"] })}>
                <option value="blank">Blank page</option>
                <option value="landing">Landing page</option>
                <option value="service">Service page</option>
                <option value="resource">Resource page</option>
                <option value="insights-landing">Insights landing page</option>
              </select>
            </label>
            <label className="text-sm"><input type="checkbox" checked={pageForm.navVisible} onChange={(event) => setPageForm({ ...pageForm, navVisible: event.target.checked })} /> Show in navigation</label>
            <label className="text-sm">Title in search results<input className="field" value={pageForm.seoTitle} onChange={(event) => setPageForm({ ...pageForm, seoTitle: event.target.value })} /></label>
            <label className="text-sm">Search description<textarea className="field" value={pageForm.metaDescription} onChange={(event) => setPageForm({ ...pageForm, metaDescription: event.target.value })} /></label>
            <div className="flex gap-2">
              <button className="bg-[var(--ink)] px-3 py-2 text-sm text-white" type="submit">Create page</button>
              <button type="button" onClick={() => setAddingPage(false)}>Cancel</button>
            </div>
          </form>
        </div>
      ) : null}
      {picker ? (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/30 p-6">
          <div className="max-h-[80vh] w-full max-w-3xl overflow-auto bg-white p-6">
            <div className="flex items-center justify-between"><h2 className="font-serif text-2xl">Choose an image</h2><button type="button" onClick={() => setPicker(false)}>Close</button></div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {usedHere.map((item) => (
                <button key={item.filename} type="button" className="border border-[var(--line)] p-2 text-left" onClick={() => chooseImage(item)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/api/sites/${props.websiteId}/media?name=${encodeURIComponent(item.filename)}`} alt={item.alt} className="h-24 w-full object-cover" />
                  <span className="mt-1 block text-xs">{item.alt || "Image"}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
      {crop ? (
        <CropDialog
          src={`/api/sites/${props.websiteId}/media?name=${encodeURIComponent(crop.filename)}`}
          onClose={() => setCrop(null)}
          onSave={async (file) => {
            const saved = await upload(file, "");
            commit(setImageSource(site, path, crop.sectionId, saved.src, saved.alt, crop.itemId || undefined), true);
            setCrop(null);
          }}
        />
      ) : null}
    </div>
  );

  async function confirmIdentity() {
    const response = await fetch(`/api/sites/${props.websiteId}/step-up`, { method: "POST" });
    const body = (await response.json()) as { message?: string };
    setNotice(body.message ?? "");
  }

  async function publish() {
    const response = await fetch(`/api/sites/${props.websiteId}/publish`, { method: "POST" });
    const body = (await response.json()) as { message?: string; status?: string; reviewUrl?: string | null };
    setNotice(body.message ?? "The changes could not be sent.");
    if (response.ok && body.status) {
      setPublications((items) => [{ status: body.status!, summary: body.message ?? "", reviewUrl: body.reviewUrl ?? null }, ...items]);
      setPanel("history");
    }
  }

  async function removeMedia(filename: string) {
    const response = await fetch(`/api/sites/${props.websiteId}/media`, {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ filename }),
    });
    const body = (await response.json()) as { message?: string };
    setNotice(body.message ?? "");
    if (response.ok) setMedia((items) => items.filter((item) => item.filename !== filename));
  }
}

function applySectionHero(site: SiteDraft, route: string, sectionId: string, heroImage: Extract<Section, { type: "preset" }>["heroImage"]) {
  return {
    ...site,
    pages: site.pages.map((page) =>
      page.route === route
        ? { ...page, sections: page.sections.map((section) => (section.id === sectionId && section.type === "preset" ? { ...section, heroImage } : section)) }
        : page,
    ),
  };
}

function fileFromDataUrl(dataUrl: string, name: string) {
  const [meta, data] = dataUrl.split(",");
  const mime = /data:(.*?);/.exec(meta ?? "")?.[1] || "image/png";
  const binary = atob(data ?? "");
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new File([bytes], name, { type: mime });
}

function Settings(props: {
  page?: PageDocument;
  section?: Section;
  selection: Selection;
  post?: BlogDraft;
  canEdit: boolean;
  viewport: "desktop" | "tablet" | "mobile";
  onPage: (patch: Partial<Pick<PageDocument, "title" | "seoTitle" | "metaDescription">>) => void;
  onNav: (visible: boolean) => void;
  onArchive: (archived: boolean) => void;
  onDuplicate: () => void;
  onZoneName: (name: string) => void;
  onAlign: (mode: "left" | "center" | "right" | "top" | "middle") => void;
  onAlt: (alt: string) => void;
  onHref: (href: string) => void;
  onVideo: (url: string) => void;
  onHero: (patch: Partial<NonNullable<Extract<Section, { type: "preset" }>["heroImage"]>>) => void;
  onReplace: () => void;
  onPost: (post: BlogDraft) => void;
  onBlogBlock: (block: BlogDraft["blocks"][number]) => void;
  templateFor: string;
  onTemplate: (name: string) => void;
}) {
  const disabled = !props.canEdit;
  const hero = props.section?.type === "preset" ? props.section.heroImage : undefined;
  const alt = props.selection.itemId
    ? (props.section?.type === "freeform" ? props.section.items : props.section?.type === "preset" ? props.section.overlay ?? [] : []).find((item) => item.id === props.selection.itemId)?.alt ?? ""
    : props.section?.type === "image" ? props.section.alt : hero?.alt ?? "";
  const href = props.section?.type === "button" ? props.section.href : props.section?.type === "preset" ? props.section.buttonHref ?? "" : props.section?.type === "cta" ? props.section.href : "";
  return (
    <div className="grid gap-4 text-sm">
      {!props.selection.sectionId ? <p className="leading-relaxed text-[var(--muted)]">Click something to edit it.</p> : null}
      {props.templateFor ? (
        <form className="grid gap-2" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); props.onTemplate(String(data.get("name") ?? "")); }}>
          <label>Template name<input className="field" name="name" placeholder="Testimonial layout" /></label>
          <button className="bg-[var(--ink)] px-3 py-2 text-white" type="submit">Save template</button>
        </form>
      ) : null}
      {props.page && !props.selection.sectionId && props.page.route !== "/" ? (
        <div className="grid gap-2 border border-[var(--line)] p-3">
          <p className="font-medium">{props.page.archived ? "Archived" : "This page"}</p>
          <label>Title in search results<input className="field" disabled={disabled} value={props.page.seoTitle} onChange={(event) => props.onPage({ seoTitle: event.target.value })} /></label>
          <label>Search description<textarea className="field" disabled={disabled} value={props.page.metaDescription} onChange={(event) => props.onPage({ metaDescription: event.target.value })} /></label>
          <label><input type="checkbox" disabled={disabled || props.page.locked} checked={props.page.navVisible} onChange={(event) => props.onNav(event.target.checked)} /> Show in navigation</label>
          {props.page.route !== "/" && !props.page.locked ? (
            <div className="flex gap-2">
              <button type="button" disabled={disabled} onClick={props.onDuplicate}>Duplicate</button>
              <button type="button" disabled={disabled} onClick={() => props.onArchive(!props.page?.archived)}>{props.page.archived ? "Restore" : "Archive"}</button>
            </div>
          ) : null}
        </div>
      ) : null}
      {props.page?.route === "/" && !props.selection.sectionId ? (
        <label>Title in search results<input className="field" disabled={disabled} value={props.page.seoTitle} onChange={(event) => props.onPage({ seoTitle: event.target.value })} /></label>
      ) : null}
      {props.section?.type === "freeform" ? (
        <label>Zone name<input className="field" disabled={disabled} value={props.section.name} onChange={(event) => props.onZoneName(event.target.value)} /></label>
      ) : null}
      {props.section?.type === "preset" && props.selection.overlay ? (
        <label>Zone name<input className="field" disabled={disabled} value={props.section.overlayName ?? "Hero callouts"} onChange={(event) => props.onZoneName(event.target.value)} /></label>
      ) : null}
      {props.selection.itemId && (props.section?.type === "freeform" || props.section?.type === "preset" || props.section?.type === "flow" && props.section.layout === "fluid") ? (
        <div className="flex flex-wrap gap-1">
          {(["left", "center", "right", "top", "middle"] as const).map((mode) => (
            <button key={mode} type="button" className="border border-[var(--line)] px-2 py-1" disabled={disabled} onClick={() => props.onAlign(mode)}>{mode}</button>
          ))}
          <p className="w-full text-[var(--muted)]">Aligns this item inside the zone on {props.viewport}.</p>
        </div>
      ) : null}
      {href ? <label>Where this goes<input className="field" disabled={disabled} value={href} onChange={(event) => props.onHref(event.target.value)} /></label> : null}
      {props.section?.type === "video" ? <label>Video link<input className="field" disabled={disabled} value={props.section.url} placeholder="https://www.youtube.com/watch?v=" onChange={(event) => props.onVideo(event.target.value)} /></label> : null}
      {props.section?.type === "image" || (props.section?.type === "flow" && props.section.blocks.find((block) => block.id === props.selection.itemId)?.kind === "image") ? (
        <div className="grid gap-2">
          <label>Description for people who cannot see the image<input className="field" disabled={disabled} value={alt} onChange={(event) => props.onAlt(event.target.value)} /></label>
          <button type="button" disabled={disabled} onClick={props.onReplace}>Replace image</button>
          <label>Which part of the image stays in view<select className="field" disabled={disabled} defaultValue="center"><option value="center">Center</option><option value="top">Top</option><option value="bottom">Bottom</option></select></label>
        </div>
      ) : null}
      {props.post ? (
        <div className="grid gap-2 border border-[var(--line)] p-3">
          <p className="font-medium">Insights draft</p>
          <label>Author
            <input className="field" list="authors" disabled={disabled} value={props.post.authorDisplayName} onChange={(event) => props.onPost({ ...props.post!, authorDisplayName: event.target.value })} />
            <datalist id="authors">{SITE_AUTHORS.map((name) => <option key={name} value={name} />)}</datalist>
          </label>
          <label>Search title<input className="field" disabled={disabled} value={props.post.seoTitle} onChange={(event) => props.onPost({ ...props.post!, seoTitle: event.target.value })} /></label>
          <label>Search description<textarea className="field" disabled={disabled} value={props.post.metaDescription} onChange={(event) => props.onPost({ ...props.post!, metaDescription: event.target.value })} /></label>
          <label>Requested publish time
            <input className="field" type="datetime-local" disabled={disabled} value={props.post.publishAt ?? ""} onChange={(event) => props.onPost({ ...props.post!, publishAt: event.target.value })} />
          </label>
          <p className="text-[var(--muted)]">This time is saved with the draft and shown in the review. The live website changes only after someone merges that review.</p>
          <div className="flex flex-wrap gap-1">
            <button type="button" disabled={disabled} onClick={() => props.onBlogBlock({ type: "paragraph", text: "" })}>Paragraph</button>
            <button type="button" disabled={disabled} onClick={() => props.onBlogBlock({ type: "heading", level: 2, text: "Heading" })}>Heading</button>
            <button type="button" disabled={disabled} onClick={() => props.onBlogBlock({ type: "quote", text: "" })}>Pull quote</button>
            <button type="button" disabled={disabled} onClick={() => props.onBlogBlock({ type: "list", ordered: false, items: ["First point"] })}>List</button>
            <button type="button" disabled={disabled} onClick={() => props.onBlogBlock({ type: "table", headers: ["Column", "Detail"], rows: [["", ""]] })}>Table</button>
            <button type="button" disabled={disabled} onClick={() => props.onBlogBlock({ type: "image", src: "", alt: "" })}>Image</button>
            <button type="button" disabled={disabled} onClick={() => props.onBlogBlock({ type: "link", href: "/contact", label: "Related page" })}>Link</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MediaPanel(props: {
  media: MediaItem[];
  recent: string[];
  canEdit: boolean;
  progress: number | null;
  onUpload: (file: File) => void;
  onUse: (item: MediaItem) => void;
  onDelete: (filename: string) => void;
}) {
  const recentUploads = props.media.slice(0, 8);
  const recentUsed = props.recent.map((filename) => props.media.find((item) => item.filename === filename)).filter((item): item is MediaItem => Boolean(item));
  return (
    <div className="grid gap-4 text-sm">
      {props.canEdit ? <label>Upload<input className="field" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={(event) => { const file = event.target.files?.[0]; if (file) props.onUpload(file); }} /></label> : null}
      {props.progress !== null ? <p>Uploading {props.progress}%</p> : null}
      <ImageGroup title="Recently used" items={recentUsed} onUse={props.onUse} onDelete={props.onDelete} />
      <ImageGroup title="Recently uploaded" items={recentUploads} onUse={props.onUse} onDelete={props.onDelete} />
    </div>
  );
}

function ImageGroup(props: { title: string; items: MediaItem[]; onUse: (item: MediaItem) => void; onDelete: (filename: string) => void }) {
  if (props.items.length === 0) return null;
  return (
    <div>
      <p className="font-medium">{props.title}</p>
      <ul className="mt-2 grid gap-2">
        {props.items.map((item) => (
          <li key={item.filename} className="border border-[var(--line)] p-2">
            <button type="button" className="text-left" onClick={() => props.onUse(item)}>{item.alt || "Image"}</button>
            <p className="text-[var(--muted)]">{item.width && item.height ? `${item.width}×${item.height}` : "Image"}{item.bytes ? ` · ${Math.ceil(item.bytes / 1024)} KB` : ""}</p>
            <p className="text-[var(--muted)]">{item.usedBy && item.usedBy.length > 0 ? `Used on ${item.usedBy.join(", ")}` : "Not used on a page"}</p>
            <button type="button" onClick={() => props.onDelete(item.filename)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function History(props: { publications: Publication[]; onConfirm: () => void }) {
  return (
    <div className="grid gap-3 text-sm">
      <p className="leading-relaxed">Submitting sends a review copy. It does not change the live website.</p>
      <button className="border border-[var(--ink)] px-3 py-2" type="button" onClick={props.onConfirm}>Confirm it’s you</button>
      <ul className="grid gap-3">
        {props.publications.length === 0 ? <li className="text-[var(--muted)]">No reviews yet.</li> : null}
        {props.publications.map((item, index) => (
          <li key={`${item.status}-${index}`} className="border border-[var(--line)] p-3">
            <p className="font-medium">{item.status.replaceAll("_", " ").toLowerCase()}</p>
            <p className="mt-2 whitespace-pre-wrap leading-relaxed">{item.summary}</p>
            {item.reviewUrl ? <a className="mt-2 inline-block underline" href={item.reviewUrl}>Open the review</a> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CropDialog(props: { src: string; onClose: () => void; onSave: (file: File) => Promise<void> }) {
  const imageRef = useRef<HTMLImageElement>(null);
  const [box, setBox] = useState({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 });
  const drag = useRef<{ x: number; y: number; box: { x: number; y: number; w: number; h: number } } | null>(null);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-6">
      <div className="w-full max-w-3xl bg-white p-4">
        <div className="relative" onPointerDown={(event) => { drag.current = { x: event.clientX, y: event.clientY, box }; }} onPointerMove={(event) => {
          if (!drag.current || !imageRef.current) return;
          const rect = imageRef.current.getBoundingClientRect();
          const next = { ...drag.current.box, x: drag.current.box.x + (event.clientX - drag.current.x) / rect.width, y: drag.current.box.y + (event.clientY - drag.current.y) / rect.height };
          setBox(next);
        }} onPointerUp={() => { drag.current = null; }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img ref={imageRef} src={props.src} alt="" className="max-h-[60vh] w-full object-contain" />
          <div className="pointer-events-none absolute border-2 border-white" style={{ left: `${box.x * 100}%`, top: `${box.y * 100}%`, width: `${box.w * 100}%`, height: `${box.h * 100}%` }} />
        </div>
        <p className="mt-2 text-sm">Drag the photo to move the crop. The original stays in the library.</p>
        <div className="mt-3 flex gap-2">
          <button className="bg-[var(--ink)] px-3 py-2 text-sm text-white" type="button" onClick={() => {
            const image = imageRef.current;
            if (!image) return;
            const canvas = document.createElement("canvas");
            const width = Math.max(1, Math.round(image.naturalWidth * box.w));
            const height = Math.max(1, Math.round(image.naturalHeight * box.h));
            canvas.width = width;
            canvas.height = height;
            canvas.getContext("2d")?.drawImage(image, image.naturalWidth * box.x, image.naturalHeight * box.y, width, height, 0, 0, width, height);
            canvas.toBlob((blob) => {
              if (blob) void props.onSave(new File([blob], "crop.png", { type: "image/png" }));
            }, "image/png");
          }}>Save crop</button>
          <button type="button" onClick={props.onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
