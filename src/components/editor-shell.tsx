"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { signOutUser } from "@/app/signin/actions";
import { defaultBlogDraft, type BlogDraft, type FreeformItem, type Section, type SiteDraft } from "@/lib/content-schema";
import {
  addFlowBlock,
  changePageRoute,
  addZoneItem,
  applyText,
  changeLines,
  createPage,
  deleteFlowBlock,
  deleteItem,
  deleteSection,
  duplicateFlowBlock,
  duplicateItem,
  duplicatePage,
  duplicateSection,
  groupItems,
  imageUsage,
  insertSection,
  insertSectionCopy,
  moveFlowBlockById,
  moveSectionById,
  pageByRoute,
  patchChrome,
  patchItem,
  placeItems,
  saveSectionTemplate,
  setBlockHidden,
  setImageSource,
  setSectionHidden,
  updatePageMeta,
} from "@/lib/editor-ops";
import { blockFitsInZone, createId } from "@/lib/page-documents";
import { entryById, recommendedFor, sectionForEntry, type LibraryEntry } from "@/lib/library";
import { emptySelection, VIEWPORTS, type EditorApi, type MediaItem, type Publication, type RailPanel, type SaveState, type Selection, type Snapshot, type Viewport } from "@/components/editor/types";
import { StatusBar, ToolRail, TopBar, type Zoom } from "@/components/editor/chrome";
import { Canvas } from "@/components/editor/canvas";
import { DesignPanel, LayersPanel, MediaPanel, PagesPanel } from "@/components/editor/panels";
import { LibraryBrowser } from "@/components/editor/library";
import { Inspector } from "@/components/editor/inspector";
import { previewFrame as frame, readMarks, toFrame, useCanvasMessages, type CanvasMessage } from "@/components/editor/use-canvas-messages";
import { useEditorHistory } from "@/components/editor/use-editor-history";
import { AddPageDialog, CropDialog, ImagePickerDialog, InsertDialog, PublishDialog, ShortcutsDialog, TemplateDialog, type PageForm } from "@/components/editor/dialogs";

type Toast = { id: number; message: string; tone: "info" | "error"; action?: { label: string; run: () => void } };
type Insert = { beforeId: string };

const RECENT_KEY = "4eos-editor-recent-library";
const TIP_KEY = "4eos-editor-tip-dismissed";
const READY_TIMEOUT = 20000;

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
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [zoom, setZoom] = useState<Zoom>("fit");
  const [scale, setScale] = useState(1);
  const [site, setSite] = useState(props.initialSite);
  const [posts, setPosts] = useState(props.initialPosts);
  const history = useEditorHistory<Snapshot>();
  const [media, setMedia] = useState(props.media);
  const [recentImages, setRecentImages] = useState<string[]>([]);
  const [recentLibrary, setRecentLibrary] = useState<string[]>([]);
  const [rail, setRail] = useState<RailPanel | null>("pages");
  const [selection, setSelection] = useState<Selection>(emptySelection);
  const [version, setVersion] = useState(0);
  const [publications, setPublications] = useState(props.publications);
  const [progress, setProgress] = useState<number | null>(null);
  const [save, setSave] = useState<SaveState>("saved");
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [editing, setEditing] = useState(false);
  const [frameFailed, setFrameFailed] = useState(false);
  const [clipboard, setClipboard] = useState<Section | null>(null);
  const [tipDismissed, setTipDismissed] = useState(true);
  const [picker, setPicker] = useState(false);
  const [crop, setCrop] = useState<{ filename: string; sectionId: string; itemId: string } | null>(null);
  const [templateFor, setTemplateFor] = useState("");
  const [addingPage, setAddingPage] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishBusy, setPublishBusy] = useState(false);
  const [publishMessage, setPublishMessage] = useState("");
  const [shortcuts, setShortcuts] = useState(false);
  const [insert, setInsert] = useState<Insert | null>(null);

  const skipSite = useRef(true);
  const skipPost = useRef(true);
  const reloadAfter = useRef(false);
  const textKey = useRef("");
  const saveSeq = useRef(0);
  const siteRef = useRef(site);
  const scrollByPath = useRef<Record<string, number>>({});
  const readyFor = useRef("");
  const toastId = useRef(0);

  const page = pageByRoute(site, path);
  const activePost = posts.find((item) => path === `/insights/${item.slug}`);
  const managedRoute = !page && !activePost;
  const section = page?.sections.find((item) => item.id === selection.sectionId);

  useEffect(() => {
    siteRef.current = site;
  }, [site]);

  useEffect(() => {
    try {
      const stored = JSON.parse(window.localStorage.getItem(RECENT_KEY) ?? "[]");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (Array.isArray(stored)) setRecentLibrary(stored.filter((item): item is string => typeof item === "string").slice(0, 8));
      setTipDismissed(window.localStorage.getItem(TIP_KEY) === "1");
    } catch {
      setTipDismissed(false);
    }
  }, []);

  const notify = useCallback((message: string, tone: "info" | "error" = "info", action?: Toast["action"]) => {
    toastId.current += 1;
    const id = toastId.current;
    setToasts((items) => [...items.slice(-2), { id, message, tone, action }]);
    window.setTimeout(() => setToasts((items) => items.filter((item) => item.id !== id)), tone === "error" ? 9000 : action ? 7000 : 4000);
  }, []);

  function rememberHistory() {
    history.record({ site, posts });
  }

  function commit(next: SiteDraft, reload: boolean) {
    if (!props.canEdit || next === site) return;
    textKey.current = "";
    rememberHistory();
    setSite(next);
    if (reload) reloadAfter.current = true;
  }

  function commitText(next: SiteDraft, key: string, reload = false) {
    if (!props.canEdit || JSON.stringify(next) === JSON.stringify(site)) return;
    if (textKey.current !== key) {
      textKey.current = key;
      rememberHistory();
    }
    setSite(next);
    if (reload) reloadAfter.current = true;
  }

  function undo() {
    const previous = history.undo({ site, posts });
    if (!previous) return;
    setSite(previous.site);
    setPosts(previous.posts);
    reloadAfter.current = true;
    textKey.current = "";
  }

  function redo() {
    const next = history.redo({ site, posts });
    if (!next) return;
    setSite(next.site);
    setPosts(next.posts);
    reloadAfter.current = true;
    textKey.current = "";
  }

  const persistSite = useCallback(
    async (next: SiteDraft) => {
      saveSeq.current += 1;
      const seq = saveSeq.current;
      setSave("saving");
      try {
        const response = await fetch(`/api/sites/${props.websiteId}/draft`, {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(next),
        });
        const body = (await response.json().catch(() => ({}))) as { message?: string };
        if (!response.ok) {
          setSave("error");
          notify(body.message ?? "Your last change was not saved. Check your connection and press Retry.", "error");
          return false;
        }
        if (seq === saveSeq.current) {
          setSave("saved");
          setSavedAt(Date.now());
        }
        return true;
      } catch {
        setSave("error");
        notify("Your last change was not saved. Check your connection and press Retry.", "error");
        return false;
      }
    },
    [notify, props.websiteId],
  );

  useEffect(() => {
    if (skipSite.current) {
      skipSite.current = false;
      return;
    }
    if (!props.canEdit) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSave("pending");
    const timer = window.setTimeout(async () => {
      const shouldReload = reloadAfter.current;
      const ok = await persistSite(site);
      if (ok && shouldReload) {
        reloadAfter.current = false;
        setVersion((value) => value + 1);
        void fetch(`/api/sites/${props.websiteId}/revisions`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(site) }).catch(() => undefined);
      }
    }, 500);
    return () => window.clearTimeout(timer);
  }, [site, props.canEdit, props.websiteId, persistSite]);

  useEffect(() => {
    if (skipPost.current) {
      skipPost.current = false;
      return;
    }
    if (!activePost || !props.canEdit) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSave("pending");
    const timer = window.setTimeout(async () => {
      const shouldReload = reloadAfter.current;
      setSave("saving");
      try {
        const response = await fetch(`/api/sites/${props.websiteId}/blog`, {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(activePost),
        });
        const body = (await response.json().catch(() => ({}))) as { message?: string };
        if (!response.ok) {
          setSave("error");
          notify(body.message ?? "The post was not saved.", "error");
          return;
        }
        setSave("saved");
        setSavedAt(Date.now());
        if (shouldReload) {
          reloadAfter.current = false;
          setVersion((value) => value + 1);
        }
      } catch {
        setSave("error");
        notify("The post was not saved. Check your connection and press Retry.", "error");
      }
    }, 700);
    return () => window.clearTimeout(timer);
  }, [activePost, props.canEdit, props.websiteId, notify]);

  function retrySave() {
    void persistSite(siteRef.current).then((ok) => {
      if (ok && reloadAfter.current) {
        reloadAfter.current = false;
        setVersion((value) => value + 1);
      }
    });
  }

  useEffect(() => {
    if (save === "saved") return;
    function onLeave(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [save]);

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

  function selectionFor(sectionId: string, itemId = ""): Selection {
    const target = page?.sections.find((item) => item.id === sectionId);
    if (!target) return emptySelection;
    const block = target.type === "flow" ? target.blocks.find((item) => item.id === itemId) : undefined;
    const locked = (target.type === "preset" && Boolean(target.providerLocked)) || Boolean(block?.locked);
    return { ...emptySelection, sectionId, itemId, itemIds: itemId ? [itemId] : [], locked, kind: block?.kind ?? target.type };
  }

  function selectNode(sectionId: string, itemId = "") {
    setSelection(selectionFor(sectionId, itemId));
    toFrame({ type: "4eos-select-node", sectionId, itemId });
  }

  function selectChrome(part: "header" | "footer") {
    setSelection({ ...emptySelection, chrome: part, kind: part });
    toFrame({ type: "4eos-select-node", chrome: part });
  }

  function clearSelection() {
    setSelection(emptySelection);
    toFrame({ type: "4eos-clear" });
  }

  function imageSrc(sectionId: string, itemId: string) {
    const current = page?.sections.find((item) => item.id === sectionId);
    if (!current) return activePost?.featuredImage?.src ?? "";
    if (itemId && current.type === "flow") return current.blocks.find((item) => item.id === itemId)?.src ?? "";
    if (itemId && current.type === "freeform") return current.items.find((item) => item.id === itemId)?.src ?? "";
    if (itemId && current.type === "preset") return (current.overlay ?? []).find((item) => item.id === itemId)?.src ?? "";
    if (current.type === "image") return current.src;
    if (current.type === "preset" && current.heroImage) return current.heroImage.src;
    return "";
  }

  function openCrop(sectionId = selection.sectionId, itemId = selection.itemId) {
    const filename = imageSrc(sectionId, itemId).split("/").pop() ?? "";
    if (filename) setCrop({ filename, sectionId, itemId });
    else notify("Add an image first, then you can crop it.");
  }

  function rememberImage(filename: string) {
    setRecentImages((items) => [filename, ...items.filter((item) => item !== filename)].slice(0, 8));
  }

  function rememberLibrary(id: string) {
    setRecentLibrary((items) => {
      const next = [id, ...items.filter((item) => item !== id)].slice(0, 8);
      try {
        window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
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
        let parsed: MediaItem & { message?: string };
        try {
          parsed = JSON.parse(xhr.responseText) as MediaItem & { message?: string };
        } catch {
          reject(new Error("The image could not be added."));
          return;
        }
        if (xhr.status >= 400) reject(new Error(parsed.message || "The image could not be added."));
        else resolve(parsed);
      };
      xhr.onerror = () => {
        setProgress(null);
        reject(new Error("The image could not be added. Check your connection and try again."));
      };
      const form = new FormData();
      form.set("file", file);
      form.set("alt", alt);
      xhr.send(form);
    });
    setMedia((items) => [body, ...items.filter((item) => item.filename !== body.filename)]);
    rememberImage(body.filename);
    return body;
  }

  function uploadOnly(file: File) {
    void upload(file, "")
      .then((saved) => notify(`${saved.filename} is in your library.`))
      .catch((error: Error) => notify(error.message, "error"));
  }

  async function placeDropped(dataUrl: string, name: string, sectionId: string, itemId: string, overlay: boolean) {
    try {
      const saved = await upload(fileFromDataUrl(dataUrl, name), "");
      if (activePost && !sectionId) {
        setPosts((items) => items.map((item) => (item.slug === activePost.slug ? { ...item, featuredImage: { src: saved.src, alt: saved.alt } } : item)));
        reloadAfter.current = true;
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
      notify("Image replaced. Add a description in the panel on the right.");
    } catch (error) {
      notify(error instanceof Error ? error.message : "The image could not be added.", "error");
    }
  }

  function chooseImage(item: MediaItem) {
    rememberImage(item.filename);
    setPicker(false);
    if (activePost && !selection.sectionId) {
      rememberHistory();
      setPosts((items) => items.map((post) => (post.slug === activePost.slug ? { ...post, featuredImage: { src: item.src, alt: item.alt } } : post)));
      reloadAfter.current = true;
      return;
    }
    if (!selection.sectionId) {
      notify("Select an image on the page first.");
      return;
    }
    commit(setImageSource(site, path, selection.sectionId, item.src, item.alt, selection.itemId || undefined), true);
  }

  async function removeMedia(item: MediaItem) {
    try {
      const response = await fetch(`/api/sites/${props.websiteId}/media`, {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ filename: item.filename }),
      });
      const body = (await response.json().catch(() => ({}))) as { message?: string };
      if (response.ok) {
        setMedia((items) => items.filter((entry) => entry.filename !== item.filename));
        notify("Image deleted.");
      } else notify(body.message ?? "The image could not be deleted.", "error");
    } catch {
      notify("The image could not be deleted. Check your connection.", "error");
    }
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
                rows: block.rows.map((row, currentRow) => (currentRow === rowIndex ? row.map((cell, currentCell) => (currentCell === cellIndex ? value : cell)) : row)),
              };
            }
            return block;
          }),
        };
      }),
    );
  }

  function updatePost(next: BlogDraft) {
    if (!props.canEdit) return;
    const key = `post:${next.slug}`;
    if (textKey.current !== key) {
      textKey.current = key;
      rememberHistory();
    }
    setPosts((items) => items.map((item) => (item.slug === next.slug ? next : item)));
  }

  function addBlogBlock(block: BlogDraft["blocks"][number]) {
    if (!activePost || !props.canEdit) return;
    rememberHistory();
    textKey.current = "";
    reloadAfter.current = true;
    setPosts((items) => items.map((post) => (post.slug === activePost.slug ? { ...post, blocks: [...post.blocks, block] } : post)));
  }

  async function createInsight() {
    const post = { ...defaultBlogDraft, slug: `note-${createId("n").slice(-4)}`, title: "New insight" };
    setSave("saving");
    try {
      const response = await fetch(`/api/sites/${props.websiteId}/blog`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(post),
      });
      const body = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        setSave("error");
        notify(body.message ?? "The post could not be created.", "error");
        return;
      }
    } catch {
      setSave("error");
      notify("The post could not be created. Check your connection.", "error");
      return;
    }
    rememberHistory();
    skipPost.current = true;
    setPosts((items) => [post, ...items]);
    setSave("saved");
    openPage(`/insights/${post.slug}`);
  }

  async function createPageFrom(form: PageForm) {
    const result = createPage(site, form);
    if (result.error) return result.error;
    const created = result.site.pages[result.site.pages.length - 1];
    const ok = await persistSite(result.site);
    if (!ok || !created) return "The page could not be saved. Try again.";
    rememberHistory();
    skipSite.current = true;
    setSite(result.site);
    setAddingPage(false);
    openPage(created.route);
    notify(`${created.title} is ready. Click any text on it to start editing.`);
    return undefined;
  }

  async function changeCurrentRoute(to: string) {
    const result = changePageRoute(site, path, to);
    if (result.error || !result.route) return result.error ?? "This page keeps its address.";
    if (result.route === path) return "";
    const ok = await persistSite(result.site);
    if (!ok) return "The new address could not be saved. Try again.";
    rememberHistory();
    skipSite.current = true;
    setSite(result.site);
    openPage(result.route);
    notify(`This page now lives at ${result.route}.`);
    return "";
  }

  function duplicateCurrentPage() {
    if (!page) return;
    const result = duplicatePage(site, page.route);
    if (result.error || !result.route) {
      notify(result.error ?? "This page cannot be duplicated.", "error");
      return;
    }
    const route = result.route;
    void persistSite(result.site).then((ok) => {
      if (!ok) return;
      rememberHistory();
      skipSite.current = true;
      setSite(result.site);
      openPage(route);
      notify("Page duplicated. It is hidden from the menu until you turn it on.");
    });
  }

  function runAction(action: string, sectionId: string, itemId: string, overlay: boolean, itemIds: string[] = []) {
    if (!sectionId || !page) return;
    const target = page.sections.find((item) => item.id === sectionId);
    if (!target) return;
    const removed = () => {
      setSelection(emptySelection);
      notify(itemId ? "Item deleted." : "Section deleted.", "info", { label: "Undo", run: () => undoRef.current() });
    };
    if (action === "copy") {
      if (!itemId) {
        setClipboard(structuredClone(target));
        notify("Section copied. Use Paste in any section's menu.");
      }
      return;
    }
    if (action === "paste") {
      if (!clipboard) return;
      commit(insertSectionCopy(site, path, sectionId, clipboard), true);
      notify("Section pasted below.");
      return;
    }
    if (action === "template") {
      setTemplateFor(sectionId);
      return;
    }
    if (itemId && target.type === "flow") {
      if (action === "duplicate") commit(duplicateFlowBlock(site, path, sectionId, itemId), true);
      else if (action === "delete") {
        commit(deleteFlowBlock(site, path, sectionId, itemId), true);
        removed();
      } else if (action === "hide" || action === "show") commit(setBlockHidden(site, path, sectionId, itemId, action === "hide"), true);
      return;
    }
    if (itemId) {
      if (action === "duplicate") commit(duplicateItem(site, path, sectionId, itemId, overlay), true);
      else if (action === "delete") {
        commit(deleteItem(site, path, sectionId, itemId, overlay), true);
        removed();
      } else if (action === "hide" || action === "show") commit(patchItem(site, path, sectionId, itemId, { hidden: action === "hide" }, overlay), true);
      else if (action === "lock" || action === "unlock") commit(patchItem(site, path, sectionId, itemId, { locked: action === "lock" }, overlay), true);
      else if (action === "forward" || action === "back") {
        const items: FreeformItem[] = overlay && target.type === "preset" ? target.overlay ?? [] : target.type === "freeform" ? target.items : [];
        const item = items.find((entry) => entry.id === itemId);
        commit(patchItem(site, path, sectionId, itemId, { zIndex: Math.max(0, (item?.zIndex ?? 1) + (action === "forward" ? 1 : -1)) }, overlay), true);
      } else if (action === "group") commit(groupItems(site, path, sectionId, itemIds.length > 1 ? itemIds : [itemId], overlay), true);
      return;
    }
    if (action === "duplicate") commit(duplicateSection(site, path, sectionId), true);
    else if (action === "delete") {
      commit(deleteSection(site, path, sectionId), true);
      removed();
    } else if (action === "hide" || action === "show") commit(setSectionHidden(site, path, sectionId, action === "hide"), true);
  }

  function insertEntry(entry: LibraryEntry, at?: Insert) {
    if (!page || !props.canEdit) {
      notify(managedRoute ? "This page is managed for you, so nothing can be added here." : "You can view this site but not change it.");
      return;
    }
    rememberLibrary(entry.id);
    const [group, type] = entry.id.split(":");
    if (!at && entry.block && section?.type === "flow" && !selection.locked) {
      commit(addFlowBlock(site, path, section.id, entry.block, selection.itemId || undefined), true);
      notify(`${entry.label} added to this section.`);
      return;
    }
    const zoneKind = blockFitsInZone(entry.block ?? type ?? "");
    if (!at && zoneKind && section && (section.type === "freeform" || (selection.overlay && section.type === "preset"))) {
      commit(addZoneItem(site, path, section.id, zoneKind as FreeformItem["kind"], section.type === "preset"), true);
      notify(`${entry.label} added to the zone.`);
      return;
    }
    const created = sectionForEntry(entry, props.canEmbed);
    if (!created) {
      notify("That item cannot be added here.", "error");
      return;
    }
    const index = at ? (at.beforeId ? page.sections.findIndex((item) => item.id === at.beforeId) : page.sections.length) : section ? page.sections.findIndex((item) => item.id === section.id) + 1 : page.sections.length;
    commit(insertSection(site, path, index < 0 ? page.sections.length : index, created), true);
    setSelection(selectionFor(created.id));
    notify(group === "block" ? `${entry.label} added in a new section.` : `${entry.label} added.`);
  }

  function insertTemplate(id: string, at?: Insert) {
    const template = site.sectionTemplates.find((item) => item.id === id);
    if (!template || !page) return;
    const copy = structuredClone(template.section);
    copy.id = createId("sec");
    const index = at?.beforeId ? page.sections.findIndex((item) => item.id === at.beforeId) : section && !at ? page.sections.findIndex((item) => item.id === section.id) + 1 : page.sections.length;
    commit(insertSection(site, path, index < 0 ? page.sections.length : index, copy), true);
    notify(`${template.name} added.`);
  }

  function sitePath(pathname: string) {
    const prefix = `/preview/${props.websiteId}`;
    const clean = pathname.split("#")[0]?.split("?")[0] ?? "/";
    const route = clean.startsWith(prefix) ? clean.slice(prefix.length) : clean;
    return route.replace(/\/$/, "") || "/";
  }

  function openPage(route: string) {
    setPath(route);
    setSelection(emptySelection);
    setVersion((value) => value + 1);
  }

  const undoRef = useRef(undo);

  function postConfig(route: string) {
    toFrame({ type: "4eos-config", scale, clipboard: Boolean(clipboard), scrollY: scrollByPath.current[route] ?? 0, selection: { sectionId: selection.sectionId, itemId: selection.itemId } });
  }

  function onMessage(data: CanvasMessage, node: HTMLIFrameElement) {
    const text = (key: string) => String(data[key] ?? "");
    switch (data.type) {
      case "4eos-ready": {
        readyFor.current = node.src;
        setFrameFailed(false);
        postConfig(sitePath(text("path")));
        break;
      }
      case "4eos-scroll":
        scrollByPath.current[sitePath(text("path"))] = Number(data.y) || 0;
        break;
      case "4eos-navigate": {
        const next = sitePath(text("path"));
        if (next !== path) {
          setPath(next);
          setSelection(emptySelection);
        }
        break;
      }
      case "4eos-select": {
        const itemId = text("itemId");
        const itemIds = Array.isArray(data.itemIds) ? data.itemIds.map((item) => String(item)).filter(Boolean) : itemId ? [itemId] : [];
        const chrome = data.chrome === "header" || data.chrome === "footer" ? data.chrome : "";
        setSelection({ sectionId: text("sectionId"), itemId, itemIds, overlay: Boolean(data.overlay), locked: Boolean(data.locked), chrome, navRoute: text("navRoute"), kind: text("kind") });
        break;
      }
      case "4eos-editing":
        setEditing(Boolean(data.active));
        break;
      case "4eos-text": {
        const marks = readMarks(data.marks);
        commitText(applyText(site, path, text("sectionId"), text("field") || "text", text("value"), text("itemId") || undefined, marks), `${text("sectionId")}:${text("itemId")}:${text("field")}`);
        break;
      }
      case "4eos-nav":
        if (typeof data.route === "string") commitText(updatePageMeta(site, data.route, { navLabel: text("value") }), `nav:${data.route}`);
        break;
      case "4eos-chrome": {
        const field = text("field");
        const value = text("value");
        const chrome = structuredClone(site.chrome);
        if (field === "buttonLabel") chrome.header.buttonLabel = value;
        else if (field === "siteName") chrome.header.siteName = value;
        else if (field === "note") chrome.footer.note = value;
        else if (field === "copyright") chrome.footer.copyright = value;
        else if (field === "cookie") chrome.cookieText = value;
        else if (field === "announcement") chrome.announcement.text = value;
        else return;
        commitText(patchChrome(site, chrome), `chrome:${field}`);
        break;
      }
      case "4eos-move":
        commit(moveSectionById(site, path, text("sectionId"), text("beforeId")), true);
        break;
      case "4eos-reorder-block":
        commit(moveFlowBlockById(site, path, text("sectionId"), text("itemId"), text("targetId"), Boolean(data.after)), true);
        break;
      case "4eos-insert":
        if (!props.canEdit) return;
        setInsert({ beforeId: text("beforeId") });
        break;
      case "4eos-insert-type": {
        const entry = entryById(text("libraryType"));
        if (entry) insertEntry(entry, { beforeId: text("beforeId") });
        break;
      }
      case "4eos-action": {
        const ids = Array.isArray(data.itemIds) ? data.itemIds.map((item) => String(item)).filter(Boolean) : [];
        runAction(text("action"), text("sectionId"), text("itemId"), Boolean(data.overlay), ids);
        break;
      }
      case "4eos-menu": {
        const sectionId = text("sectionId");
        const itemId = text("itemId");
        const action = text("action");
        setSelection((current) => (current.sectionId === sectionId && current.itemId === itemId ? current : { ...selectionFor(sectionId, itemId), overlay: Boolean(data.overlay) }));
        if (action === "replace") setPicker(true);
        else if (action === "crop") openCrop(sectionId, itemId);
        else if (action === "alt") notify("Write the image description in the panel on the right.");
        break;
      }
      case "4eos-place": {
        if (!Array.isArray(data.items)) return;
        const name = data.viewport === "mobile" || data.viewport === "tablet" ? data.viewport : "desktop";
        const items = (data.items as { id: string; placement: { x: number; y: number; w: number; h: number } }[]).filter((item) => item && item.placement);
        commit(placeItems(site, path, text("sectionId"), name, items, Boolean(data.overlay)), false);
        break;
      }
      case "4eos-drop":
        if (typeof data.dataUrl === "string") void placeDropped(data.dataUrl, text("name") || "image.png", text("sectionId"), text("itemId"), Boolean(data.overlay));
        break;
      case "4eos-drop-error":
        notify(`${text("name") || "That file"} is not an image this site can use. Use PNG, JPEG, WebP, or SVG.`, "error");
        break;
      case "4eos-blog":
        updateBlog(text("field"), data.index, text("value"));
        break;
      case "4eos-key":
        if (data.key === "z") {
          if (data.shift) redo();
          else undo();
        }
        break;
    }
  }

  useEffect(() => {
    undoRef.current = undo;
  });

  useCanvasMessages(onMessage);

  useEffect(() => {
    toFrame({ type: "4eos-config", scale, clipboard: Boolean(clipboard) });
  }, [scale, clipboard]);

  const previewSrc = useMemo(() => {
    const route = path === "/" ? "" : path;
    return `/preview/${props.websiteId}${route}?v=${version}&t=${encodeURIComponent(props.previewAccess)}`;
  }, [path, props.previewAccess, props.websiteId, version]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const node = frame();
      if (node && readyFor.current !== node.src) setFrameFailed(true);
    }, READY_TIMEOUT);
    return () => window.clearTimeout(timer);
  }, [previewSrc]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing = Boolean(target?.closest("input, textarea, select, [contenteditable=true]"));
      const mod = event.metaKey || event.ctrlKey;
      if (mod && event.key.toLowerCase() === "s") {
        event.preventDefault();
        if (save === "error") retrySave();
        else notify("Changes save automatically.");
        return;
      }
      if (typing) return;
      if (mod && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      } else if (mod && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
      } else if (event.key === "?" && !document.querySelector(".ed-dialog")) {
        event.preventDefault();
        setShortcuts(true);
      } else if (event.key === "Escape" && !document.querySelector(".ed-dialog") && (selection.sectionId || selection.chrome)) {
        clearSelection();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const mediaWithUse = media.map((item) => ({ ...item, usedBy: imageUsage(site, posts, item.filename) }));
  const api: EditorApi = {
    websiteId: props.websiteId,
    site,
    path,
    page,
    canEdit: props.canEdit,
    viewport,
    selection,
    commit,
    commitText,
    notify,
    selectNode,
    openPicker: () => setPicker(true),
    openCrop: () => openCrop(),
    run: (action) => runAction(action, selection.sectionId, selection.itemId, selection.overlay, selection.itemIds),
    changeRoute: changeCurrentRoute,
    media: mediaWithUse,
  };

  const width = VIEWPORTS.find((item) => item.id === viewport)?.width ?? 1280;
  const recommended = recommendedFor(page?.sections ?? []);
  const recommendedHere = recommendedFor(page?.sections ?? [], section?.type === "flow" && !selection.locked);
  const templates = site.sectionTemplates.map((item) => ({ id: item.id, name: item.name }));
  const canPlaceImage = Boolean(selection.sectionId && (selection.kind === "image" || imageSrc(selection.sectionId, selection.itemId)));
  const pageTitle = page?.title ?? activePost?.title ?? (path === "/" ? "Home" : path);
  const statusMessage = !props.canEdit
    ? "You can look around, but this account cannot change the site."
    : managedRoute
      ? "This page is managed for you. Pick a page on the left to edit."
      : selection.locked
        ? "This part is managed for you."
        : selection.itemId || selection.navRoute || selection.chrome
          ? "Double-click text to type. Drag the handle to move. Right-click for more."
          : selection.sectionId
            ? "Drag the handle to move this section, or use the menu for more."
            : "Click anything on the page to select it.";

  function dismissTip() {
    setTipDismissed(true);
    try {
      window.localStorage.setItem(TIP_KEY, "1");
    } catch {}
  }

  async function confirmIdentity() {
    try {
      const response = await fetch(`/api/sites/${props.websiteId}/step-up`, { method: "POST" });
      const body = (await response.json().catch(() => ({}))) as { message?: string };
      notify(body.message ?? (response.ok ? "Confirmed." : "That did not work. Try again."), response.ok ? "info" : "error");
      if (publishing) setPublishMessage(body.message ?? "");
    } catch {
      notify("That did not work. Check your connection.", "error");
    }
  }

  async function publish() {
    if (save !== "saved") {
      setPublishMessage("Wait for your changes to finish saving, then send them.");
      return;
    }
    setPublishBusy(true);
    try {
      const response = await fetch(`/api/sites/${props.websiteId}/publish`, { method: "POST" });
      const body = (await response.json().catch(() => ({}))) as { message?: string; status?: string; reviewUrl?: string | null };
      setPublishMessage(body.message ?? "The changes could not be sent.");
      if (response.ok && body.status) setPublications((items) => [{ status: body.status!, summary: body.message ?? "", reviewUrl: body.reviewUrl ?? null, createdAt: new Date().toISOString() }, ...items]);
    } catch {
      setPublishMessage("The changes could not be sent. Check your connection and try again.");
    } finally {
      setPublishBusy(false);
    }
  }

  return (
    <div className="ed-root">
      <TopBar
        websiteName={props.websiteName}
        pageTitle={pageTitle}
        onPages={() => setRail("pages")}
        onNewPage={() => setAddingPage(true)}
        viewport={viewport}
        onViewport={setViewport}
        canUndo={history.canUndo}
        canRedo={history.canRedo}
        onUndo={undo}
        onRedo={redo}
        save={save}
        savedAt={savedAt}
        onRetry={retrySave}
        previewHref={`${previewSrc}&clean=1`}
        canEdit={props.canEdit}
        canPublish={props.canPublish}
        onPublish={() => {
          setPublishMessage("");
          setPublishing(true);
        }}
        userName={props.userName}
        role={props.role}
        onConfirm={() => void confirmIdentity()}
        onShortcuts={() => setShortcuts(true)}
      />
      <div className={rail ? "ed-body" : "ed-body is-rail-closed"}>
        <ToolRail active={rail} onChange={setRail} />
        {rail ? (
          <aside className="ed-side" aria-label="Panel">
            {rail === "add" ? (
              <div className="ed-panel">
                <div className="ed-panel-head">
                  <h2>Add</h2>
                </div>
                <LibraryBrowser canEmbed={props.canEmbed} recent={recentLibrary} recommended={recommendedHere} templates={templates} onChoose={(entry) => insertEntry(entry)} onTemplate={(id) => insertTemplate(id)} dense />
              </div>
            ) : null}
            {rail === "pages" ? (
              <PagesPanel
                site={site}
                posts={posts}
                path={path}
                canEdit={props.canEdit}
                onOpen={openPage}
                onAddPage={() => setAddingPage(true)}
                onNewPost={() => void createInsight()}
                onSettings={(route) => {
                  if (route !== path) openPage(route);
                  else clearSelection();
                }}
                commit={commit}
              />
            ) : null}
            {rail === "layers" ? <LayersPanel api={api} chromeFocus={selection.chrome} onSelect={selectNode} onChrome={selectChrome} /> : null}
            {rail === "design" ? <DesignPanel site={site} canEdit={props.canEdit} commit={commit} commitText={commitText} /> : null}
            {rail === "media" ? (
              <MediaPanel
                websiteId={props.websiteId}
                media={mediaWithUse}
                recent={recentImages}
                canEdit={props.canEdit}
                progress={progress}
                canPlace={canPlaceImage}
                onUpload={uploadOnly}
                onUse={chooseImage}
                onDelete={(item) => void removeMedia(item)}
              />
            ) : null}
          </aside>
        ) : null}
        <main className="ed-stage" aria-label="Page canvas">
          {!tipDismissed && props.canEdit ? (
            <div className="ed-tip" role="note">
              <p>
                <strong>Getting started:</strong> click anything to select it, double-click text to type, and use <em>Add section</em> between sections to add more.
              </p>
              <button type="button" className="ed-icon is-small" aria-label="Dismiss tip" onClick={dismissTip}>
                <X size={14} aria-hidden="true" />
              </button>
            </div>
          ) : null}
          <Canvas
            src={previewSrc}
            width={width}
            zoom={zoom}
            title={`${props.websiteName} preview`}
            onScale={setScale}
            failed={frameFailed}
            onRetry={() => {
              setFrameFailed(false);
              setVersion((value) => value + 1);
            }}
          />
        </main>
        <Inspector
          api={api}
          post={activePost}
          onPost={updatePost}
          onPostBlock={addBlogBlock}
          onDuplicatePage={duplicateCurrentPage}
          onOpenPage={openPage}
          onClear={clearSelection}
          managedRoute={managedRoute}
        />
      </div>
      <StatusBar message={statusMessage} viewport={viewport} scale={scale} zoom={zoom} onZoom={setZoom} role={props.role} editing={editing} onShortcuts={() => setShortcuts(true)} />
      <div className="ed-toasts" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={toast.tone === "error" ? "ed-toast is-error" : "ed-toast"} role={toast.tone === "error" ? "alert" : "status"}>
            <span>{toast.message}</span>
            {toast.action ? (
              <button
                type="button"
                className="ed-link"
                onClick={() => {
                  toast.action?.run();
                  setToasts((items) => items.filter((item) => item.id !== toast.id));
                }}
              >
                {toast.action.label}
              </button>
            ) : null}
            <button type="button" className="ed-icon is-small" aria-label="Dismiss" onClick={() => setToasts((items) => items.filter((item) => item.id !== toast.id))}>
              <X size={13} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
      {insert ? (
        <InsertDialog
          canEmbed={props.canEmbed}
          recent={recentLibrary}
          recommended={recommended}
          templates={templates}
          onChoose={(entry) => {
            insertEntry(entry, insert);
            setInsert(null);
          }}
          onTemplate={(id) => {
            insertTemplate(id, insert);
            setInsert(null);
          }}
          onClose={() => setInsert(null)}
        />
      ) : null}
      {addingPage ? <AddPageDialog site={site} onCreate={createPageFrom} onClose={() => setAddingPage(false)} /> : null}
      {picker ? <ImagePickerDialog websiteId={props.websiteId} media={mediaWithUse} progress={progress} onChoose={chooseImage} onUpload={uploadOnly} onClose={() => setPicker(false)} /> : null}
      {crop ? (
        <CropDialog
          src={`/api/sites/${props.websiteId}/media?name=${encodeURIComponent(crop.filename)}`}
          onClose={() => setCrop(null)}
          onSave={async (file) => {
            try {
              const saved = await upload(file, "");
              commit(setImageSource(site, path, crop.sectionId, saved.src, saved.alt, crop.itemId || undefined), true);
              setCrop(null);
              notify("Cropped copy saved. The original is still in Media.");
            } catch (error) {
              notify(error instanceof Error ? error.message : "The crop could not be saved.", "error");
            }
          }}
        />
      ) : null}
      {templateFor ? (
        <TemplateDialog
          onClose={() => setTemplateFor("")}
          onSave={(name) => {
            commit(saveSectionTemplate(site, path, templateFor, name), false);
            setTemplateFor("");
            notify(`Saved “${name.trim()}”. Find it under Add, then Saved.`);
          }}
        />
      ) : null}
      {publishing ? (
        <PublishDialog
          changes={changeLines(site, posts)}
          publications={publications}
          busy={publishBusy}
          message={publishMessage}
          onSend={() => void publish()}
          onConfirm={() => void confirmIdentity()}
          onClose={() => setPublishing(false)}
        />
      ) : null}
      {shortcuts ? <ShortcutsDialog onClose={() => setShortcuts(false)} /> : null}
    </div>
  );
}

function fileFromDataUrl(dataUrl: string, name: string) {
  const [meta, data] = dataUrl.split(",");
  const mime = /data:(.*?);/.exec(meta ?? "")?.[1] || "image/png";
  const binary = atob(data ?? "");
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new File([bytes], name, { type: mime });
}
