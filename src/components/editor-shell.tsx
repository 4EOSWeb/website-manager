"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { signOutUser } from "@/app/signin/actions";
import { defaultBlogDraft, type BlogDraft, type FlowBlock, type FreeformItem, type Section, type SiteDraft } from "@/lib/content-schema";
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
  bringForwardItems,
  sendBackwardItems,
  groupItems,
  ungroupItems,
  imageUsage,
  insertFlowBlock,
  insertSection,
  insertSectionCopy,
  moveBlockToSection,
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
import { validLink } from "@/lib/links";
import { blockFitsInZone, createId } from "@/lib/page-documents";
import { entryById, recommendedFor, sectionForEntry, type LibraryEntry } from "@/lib/library";
import { articlePatternFrom, articleRouteFor, articleSlug, selectActivePage } from "@/components/editor/state/page";
import { clearNodeSelection, nodeIdsFromLegacy } from "@/components/editor/state/selection";
import { activeSiteContext, createSiteState } from "@/components/editor/state/site";
import { breakpointWidth, previewRadioLabel, type BreakpointId } from "@/components/editor/state/breakpoint";
import { emptyDirty, markChanged, markSaved, shouldWarnBeforeUnload, switchWebsite } from "@/components/editor/state/dirty";
import { dismissEditorError, editorErrorFromSave, type EditorError } from "@/components/editor/state/errors";
import { mountEditorStore, unmountEditorStore } from "@/components/editor/state/store";
import { persistExperience, readExperience, type ExperienceMode } from "@/components/editor/state/experience";
import { emptySelection, type EditorApi, type MediaItem, type Publication, type RailPanel, type SaveState, type Selection, type Snapshot, type Viewport } from "@/components/editor/types";
import type { SiteContext } from "@/platform/context";
import { StatusBar, ToolRail, TopBar, type Zoom } from "@/components/editor/chrome";
import { Canvas } from "@/components/editor/canvas";
import { DragStatus, dragRejectReason, type DragRejectReason } from "@/components/editor/drag-status";
import { groupCanvas } from "@/platform/canvas/group";
import { canvasGroupId, ungroupCanvas } from "@/platform/canvas/ungroup";
import { bringForwardCanvas, sendBackwardCanvas } from "@/platform/canvas/z-order";
import { overflowWarning } from "@/platform/canvas/overflow";
import { toPercent } from "@/platform/canvas/percent";
import { placeOnCanvas } from "@/platform/drag/canvas-place";
import { flowReorder } from "@/platform/drag/flow-insert";
import { groupEnter } from "@/platform/drag/group-enter";
import { groupExit } from "@/platform/drag/group-exit";
import { keyboardMove, keyboardStep } from "@/platform/drag/keyboard";
import { libraryDrop } from "@/platform/drag/library-drop";
import { cancelDrag } from "@/platform/drag/cancel";
import { reparent } from "@/platform/drag/reparent";
import { DesignPanel, LayersPanel, MediaPanel, PagesPanel } from "@/components/editor/panels";
import { LibraryBrowser } from "@/components/editor/library";
import { Inspector } from "@/components/editor/inspector";
import { nodeIdFromCanvasMessage, previewFrame as frame, readMarks, selectionTargetForNode, toFrame, useCanvasMessages, type CanvasMessage } from "@/components/editor/use-canvas-messages";
import { selectNodeId } from "@/components/editor/state/selection";
import type { NodeDocument } from "@/platform/document/node";
import { insertAfter, insertNode, nodeIdsIn } from "@/platform/elements/create";
import { createButton, writeButtonField } from "@/platform/elements/button";
import { createIconButton } from "@/platform/elements/icon-button";
import { createContainer } from "@/platform/elements/container";
import { createInput } from "@/platform/elements/input";
import { createTextarea } from "@/platform/elements/textarea";
import { createSelect } from "@/platform/elements/select";
import { createCheckbox } from "@/platform/elements/checkbox";
import { createForm } from "@/platform/elements/form";
import { createFaq } from "@/platform/elements/faq";
import { createTestimonial } from "@/platform/elements/testimonial";
import { createCta } from "@/platform/elements/cta";
import { createCard } from "@/platform/elements/card";
import { createGroup } from "@/platform/elements/group";
import { createCanvas } from "@/platform/elements/canvas";
import { createGrid } from "@/platform/elements/grid";
import { createStack } from "@/platform/elements/stack";
import { createDivider } from "@/platform/elements/divider";
import { createIcon } from "@/platform/elements/icon";
import { createSpacer } from "@/platform/elements/spacer";
import { createImage, writeImage } from "@/platform/elements/image";
import { createGallery, writeGallery } from "@/platform/elements/gallery";
import { acceptVideoUrl, createVideo, writeVideoUrl } from "@/platform/elements/video";
import { createCustom, type CustomDefinition } from "@/platform/elements/custom";
import { createHeading } from "@/platform/elements/heading";
import { createLink, writeLinkHref } from "@/platform/elements/link";
import { createParagraph } from "@/platform/elements/paragraph";
import { createRichText, writeRichMarks } from "@/platform/elements/richtext";
import { useEditorHistory } from "@/components/editor/use-editor-history";
import { AddPageDialog, CropDialog, ImagePickerDialog, InsertDialog, PublishDialog, ShortcutsDialog, TemplateDialog, type PageForm } from "@/components/editor/dialogs";

type Toast = { id: number; message: string; tone: "info" | "error"; action?: { label: string; run: () => void } };
type Insert = { beforeId: string };

function flowBlockText(site: SiteDraft, route: string, blockId: string) {
  const page = site.pages.find((item) => item.route === route);
  for (const section of page?.sections ?? []) {
    if (section.type !== "flow") continue;
    const block = section.blocks.find((item) => item.id === blockId);
    if (block?.text && typeof block.text === "object") return block.text.text;
  }
  return "";
}

function sectionUrl(site: SiteDraft, route: string, sectionId: string) {
  const page = site.pages.find((item) => item.route === route);
  const section = page?.sections.find((item) => item.id === sectionId);
  return section && section.type === "video" ? section.url : "";
}

function flowBlockHref(site: SiteDraft, route: string, blockId: string) {
  const page = site.pages.find((item) => item.route === route);
  for (const section of page?.sections ?? []) {
    if (section.type !== "flow") continue;
    const block = section.blocks.find((item) => item.id === blockId);
    if (block) return block.href ?? "";
  }
  return "";
}

const RECENT_KEY = "4eos-editor-recent-library";
const TIP_KEY = "4eos-editor-tip-dismissed";
const READY_TIMEOUT = 20000;

export function EditorShell(props: {
  websiteId: string;
  siteContext: SiteContext;
  adapterId: string | null;
  adapter: Record<string, unknown> | null;
  visualDocument: unknown;
  websiteName: string;
  initialSite: SiteDraft;
  initialPosts: BlogDraft[];
  media: MediaItem[];
  canEdit: boolean;
  canPublish: boolean;
  canEmbed: boolean;
  canAdminister: boolean;
  role: string;
  userName: string;
  previewAccess: string;
  publications: Publication[];
}) {
  const [siteState] = useState(() => createSiteState(props.siteContext));
  const [adapterId] = useState(props.adapterId);
  const [adapter] = useState(props.adapter);
  const [path, setPath] = useState("/");
  const [viewport, setViewport] = useState<BreakpointId>("desktop");
  const [experience, setExperience] = useState<ExperienceMode>("basic");
  const [dirtyState, setDirtyState] = useState(() => emptyDirty(props.websiteId));
  const dirtyRef = useRef(dirtyState);
  dirtyRef.current = dirtyState;
  const dirtyWebsite = useRef(props.websiteId);
  useEffect(() => {
    setExperience(readExperience(window.localStorage, props.websiteId, props.canAdminister));
  }, [props.websiteId, props.canAdminister]);
  useEffect(() => {
    mountEditorStore(props.websiteId);
    return () => unmountEditorStore(props.websiteId, window.sessionStorage);
  }, [props.websiteId]);
  const [zoom, setZoom] = useState<Zoom>("fit");
  const [scale, setScale] = useState(1);
  const [site, setSite] = useState(props.initialSite);
  const [visualDocument, setVisualDocument] = useState<unknown>(props.visualDocument);
  const [visualNodeIds, setVisualNodeIds] = useState<string[]>([]);
  const pinnedNode = useRef<string | null>(null);
  const libraryFactory = useRef("");
  const dragActive = useRef(false);
  const dropIgnored = useRef(false);
  const [posts, setPosts] = useState(props.initialPosts);
  const history = useEditorHistory<Snapshot>(props.websiteId);
  const [media, setMedia] = useState(props.media);
  const [recentImages, setRecentImages] = useState<string[]>([]);
  const [recentLibrary, setRecentLibrary] = useState<string[]>([]);
  const [rail, setRail] = useState<RailPanel | null>("pages");
  const [selection, setSelection] = useState<Selection>(emptySelection);
  const [nodeIds, setNodeIds] = useState<string[]>([]);
  const [version, setVersion] = useState(0);
  const [publications, setPublications] = useState(props.publications);
  const [progress, setProgress] = useState<number | null>(null);
  const [save, setSave] = useState<SaveState>("saved");
  const [editorError, setEditorError] = useState<EditorError | null>(null);
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
  const [dragReason, setDragReason] = useState<DragRejectReason | null>(null);
  const [contentOverflow, setContentOverflow] = useState<string | null>(null);
  const [keyboardStatus, setKeyboardStatus] = useState("");

  const skipSite = useRef(true);
  const skipPost = useRef(true);
  const reloadAfter = useRef(false);
  const saveSeq = useRef(0);
  const pendingDraft = useRef<SiteDraft | null>(null);
  const saveFlight = useRef<Promise<boolean> | null>(null);
  const siteRef = useRef(site);
  const scrollByPath = useRef<Record<string, number>>({});
  const readyFor = useRef("");
  const richBlocks = useRef(new Map<string, string>());
  const linkBlocks = useRef(new Map<string, string>());
  const buttonBlocks = useRef(new Map<string, string>());
  const imageBlocks = useRef(new Map<string, string>());
  const formSections = useRef(new Map<string, string>());
  const gallerySections = useRef(new Map<string, string>());
  const videoSections = useRef(new Map<string, string>());
  const toastId = useRef(0);

  const page = pageByRoute(site, path);
  const articleRoute = articlePatternFrom(adapter);
  const pageState = selectActivePage(
    path,
    visualDocument,
    site.pages.map((item) => ({ id: item.id, route: item.route, title: item.title })),
  );
  const activePost = articleRoute ? posts.find((item) => articleSlug(articleRoute, path) === item.slug) : undefined;
  const managedRoute = !page && !activePost;
  const section = page?.sections.find((item) => item.id === selection.sectionId);

  useEffect(() => {
    siteRef.current = site;
  }, [site]);

  useEffect(() => {
    if (pinnedNode.current) return;
    setNodeIds(nodeIdsFromLegacy(selection).nodeIds);
  }, [selection]);

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
    history.record({ site, posts }, visualDocument);
  }

  function commit(next: SiteDraft, reload: boolean, nextVisual?: unknown) {
    if (!props.canEdit || (next === site && nextVisual === undefined)) return;
    rememberHistory();
    setDirtyState((state) => markChanged(state, nextVisual === undefined ? { version3: next } : { version3: next, visualDocument: nextVisual }));
    setSite(next);
    if (nextVisual !== undefined) setVisualDocument(nextVisual);
    if (reload) reloadAfter.current = true;
  }

  function commitText(next: SiteDraft, key: string, reload = false) {
    if (!props.canEdit || JSON.stringify(next) === JSON.stringify(site)) return;
    history.recordText({ site, posts }, key, visualDocument);
    const blockId = key.split(":")[0] ?? "";
    const field = key.split(":")[1] ?? "";
    const nodeId = buttonBlocks.current.get(blockId);
    const label = flowBlockText(next, path, blockId);
    let nextVisual = nodeId ? writeButtonField(visualDocument, nodeId, "label", label) : null;
    const videoNodeId = videoSections.current.get(blockId);
    if (videoNodeId && field === "url") {
      const url = sectionUrl(next, path, blockId);
      if (acceptVideoUrl(url)) nextVisual = writeVideoUrl(visualDocument, videoNodeId, url);
    }
    setDirtyState((state) => markChanged(state, nextVisual ? { version3: next, visualDocument: nextVisual } : { version3: next }));
    setSite(next);
    if (nextVisual) setVisualDocument(nextVisual);
    if (reload) reloadAfter.current = true;
  }

  function undo() {
    const previous = history.undo({ site, posts }, visualDocument);
    if (!previous) return;
    pinnedNode.current = null;
    setSite(previous.value.site);
    setPosts(previous.value.posts);
    setVisualDocument(previous.visualDocument);
    setVisualNodeIds(nodeIdsIn(previous.visualDocument));
    setNodeIds(nodeIdsFromLegacy(selection).nodeIds);
    reloadAfter.current = true;
    history.breakCoalesce();
  }

  function redo() {
    const next = history.redo({ site, posts }, visualDocument);
    if (!next) return;
    pinnedNode.current = null;
    setSite(next.value.site);
    setPosts(next.value.posts);
    setVisualDocument(next.visualDocument);
    setVisualNodeIds(nodeIdsIn(next.visualDocument));
    setNodeIds(nodeIdsFromLegacy(selection).nodeIds);
    reloadAfter.current = true;
    history.breakCoalesce();
  }

  const persistSite = useCallback(
    (next: SiteDraft) => {
      pendingDraft.current = next;
      if (saveFlight.current) return saveFlight.current;
      saveFlight.current = (async () => {
        let ok = true;
        try {
          while (pendingDraft.current) {
            const next = pendingDraft.current;
            pendingDraft.current = null;
            saveSeq.current += 1;
            const seq = saveSeq.current;
            setSave("saving");
            try {
              const response = await fetch(`/api/sites/${props.websiteId}/draft`, {
                method: "PUT",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                  websiteId: props.websiteId,
                  draft: next,
                  ...(visualDocument == null ? {} : { visualDocument }),
                }),
              });
              const body = (await response.json().catch(() => ({}))) as { message?: string };
              if (!response.ok) {
                ok = false;
                if (seq === saveSeq.current && !pendingDraft.current) {
                  const failure = editorErrorFromSave(body);
                  setEditorError(failure);
                  setSave("error");
                  notify(failure.message, "error");
                  break;
                }
                continue;
              }
              ok = true;
              if (seq === saveSeq.current && !pendingDraft.current) {
                setSave("saved");
                setSavedAt(Date.now());
                setEditorError(null);
                setDirtyState((state) => markSaved(state));
              }
            } catch {
              ok = false;
              if (seq === saveSeq.current && !pendingDraft.current) {
                const failure = editorErrorFromSave(null);
                setEditorError(failure);
                setSave("error");
                notify(failure.message, "error");
                break;
              }
            }
          }
          return ok;
        } finally {
          saveFlight.current = null;
        }
      })();
      return saveFlight.current;
    },
    [notify, props.websiteId, visualDocument],
  );

  useEffect(() => {
    if (dirtyWebsite.current === props.websiteId) return;
    const moved = switchWebsite(dirtyRef.current, props.websiteId);
    dirtyWebsite.current = props.websiteId;
    skipSite.current = true;
    setDirtyState(moved.state);
  }, [props.websiteId]);

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
        setDirtyState((state) => markSaved(state));
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
    if (save === "saved" && !shouldWarnBeforeUnload(dirtyState)) return;
    function onLeave(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [save, dirtyState]);

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
    const galleryNodeId = selection.itemId ? undefined : gallerySections.current.get(selection.sectionId);
    const nodeId = selection.itemId ? imageBlocks.current.get(selection.itemId) : undefined;
    const nextVisual = galleryNodeId ? writeGallery(visualDocument, galleryNodeId, item.src, item.alt) : nodeId ? writeImage(visualDocument, nodeId, item.src, item.alt) : null;
    commit(setImageSource(site, path, selection.sectionId, item.src, item.alt, galleryNodeId ? undefined : selection.itemId || undefined), true, nextVisual ?? undefined);
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
    history.recordText({ site, posts }, key, visualDocument);
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
    history.recordText({ site, posts }, key, visualDocument);
    setPosts((items) => items.map((item) => (item.slug === next.slug ? next : item)));
  }

  function addBlogBlock(block: BlogDraft["blocks"][number]) {
    if (!activePost || !props.canEdit) return;
    rememberHistory();
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
    setDirtyState((state) => markSaved(state));
    if (articleRoute) openPage(articleRouteFor(articleRoute, post.slug));
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
      else if (action === "forward") {
        const ordered = bringForwardCanvas(visualDocument, itemId);
        commit(bringForwardItems(site, path, sectionId, itemId, overlay), true, ordered && ordered.ok ? ordered.document : undefined);
      } else if (action === "back") {
        const ordered = sendBackwardCanvas(visualDocument, itemId);
        commit(sendBackwardItems(site, path, sectionId, itemId, overlay), true, ordered && ordered.ok ? ordered.document : undefined);
      } else if (action === "group") {
        const ids = itemIds.length > 1 ? itemIds : [itemId];
        const grouped = groupCanvas(visualDocument, ids);
        commit(groupItems(site, path, sectionId, ids, overlay), true, grouped && grouped.ok ? grouped.document : undefined);
      } else if (action === "ungroup") {
        const items: FreeformItem[] = overlay && target.type === "preset" ? target.overlay ?? [] : target.type === "freeform" ? target.items : [];
        const groupId = canvasGroupId(visualDocument, itemId) || items.find((entry) => entry.id === itemId)?.groupId || "";
        const released = groupId ? ungroupCanvas(visualDocument, groupId) : null;
        commit(ungroupItems(site, path, sectionId, itemId, overlay), true, released && released.ok ? released.document : undefined);
      }
      return;
    }
    if (action === "duplicate") commit(duplicateSection(site, path, sectionId), true);
    else if (action === "delete") {
      commit(deleteSection(site, path, sectionId), true);
      removed();
    } else if (action === "hide" || action === "show") commit(setSectionHidden(site, path, sectionId, action === "hide"), true);
  }

  function insertPreviewNode(node: NodeDocument, block: FlowBlock, libraryId: string, nextVisual: unknown | null, at?: Insert) {
    if (!page || !props.canEdit) {
      notify(managedRoute ? "This page is managed for you, so nothing can be added here." : "You can view this site but not change it.");
      return;
    }
    if (page.locked) {
      notify("This page is managed for you, so nothing can be added here.");
      return;
    }
    rememberLibrary(libraryId);
    const label = block.text?.text ?? "Item";
    let next: SiteDraft;
    if (!at && section?.type === "flow" && !selection.locked) {
      next = insertFlowBlock(site, path, section.id, block, selection.itemId || undefined);
    } else {
      const created: Section = { id: createId("sec"), type: "flow", hidden: false, editorName: label, layout: "stack", blocks: [block] };
      const index = at ? (at.beforeId ? page.sections.findIndex((item) => item.id === at.beforeId) : page.sections.length) : section ? page.sections.findIndex((item) => item.id === section.id) + 1 : page.sections.length;
      next = insertSection(site, path, index < 0 ? page.sections.length : index, created);
    }
    commit(next, true, nextVisual ?? undefined);
    pinnedNode.current = node.id;
    setNodeIds(selectNodeId(node.id).nodeIds);
    setVisualNodeIds(nextVisual ? nodeIdsIn(nextVisual) : [...visualNodeIds, node.id]);
    notify(`${label} added.`);
  }

  function insertCreatedHeading(node: NodeDocument, at?: Insert) {
    if (!at && section?.type === "freeform") {
      commit(addZoneItem(site, path, section.id, "heading", false), true);
      notify("Heading added to the zone.");
      return;
    }
    const parentId = nodeIds.find((id) => id.startsWith("node_") || id.startsWith("grp_")) ?? null;
    const block: FlowBlock = { id: createId("blk"), kind: "heading", hidden: false, text: { text: "Heading", marks: [] } };
    insertPreviewNode(node, block, "element:heading", insertNode(visualDocument, path, parentId, node), at);
  }

  function insertCreatedParagraph(node: NodeDocument, at?: Insert) {
    const afterId = nodeIds.find((id) => id.startsWith("node_") || id.startsWith("grp_")) ?? null;
    const block: FlowBlock = { id: createId("blk"), kind: "paragraph", hidden: false, text: { text: "Paragraph", marks: [] } };
    insertPreviewNode(node, block, "element:paragraph", insertAfter(visualDocument, path, afterId, node), at);
  }

  function insertCreatedRichText(node: NodeDocument, at?: Insert) {
    const afterId = nodeIds.find((id) => id.startsWith("node_") || id.startsWith("grp_")) ?? null;
    const block: FlowBlock = { id: createId("blk"), kind: "paragraph", hidden: false, text: { text: "Rich text", marks: [] } };
    richBlocks.current.set(block.id, node.id);
    insertPreviewNode(node, block, "element:richtext", insertAfter(visualDocument, path, afterId, node), at);
  }

  function insertCreatedLink(node: NodeDocument, at?: Insert) {
    const href = typeof node.props.href === "string" ? node.props.href : "";
    if (!validLink(href)) return;
    const afterId = nodeIds.find((id) => id.startsWith("node_") || id.startsWith("grp_")) ?? null;
    const label = typeof node.props.label === "string" ? node.props.label : "Link";
    const block: FlowBlock = { id: createId("blk"), kind: "link", hidden: false, text: { text: label, marks: [] }, href };
    linkBlocks.current.set(block.id, node.id);
    insertPreviewNode(node, block, "element:link", insertAfter(visualDocument, path, afterId, node), at);
  }

  function insertCreatedButton(node: NodeDocument, at?: Insert) {
    if (!at && section?.type === "freeform") {
      commit(addZoneItem(site, path, section.id, "button", false), true);
      notify("Button added to the zone.");
      return;
    }
    const href = typeof node.props.href === "string" && validLink(node.props.href) ? node.props.href : "/";
    const label = typeof node.props.label === "string" ? node.props.label : "Button";
    const afterId = nodeIds.find((id) => id.startsWith("node_") || id.startsWith("grp_")) ?? null;
    const icon = node.props.icon === "arrow" || node.props.icon === "external" || node.props.icon === "mail" || node.props.icon === "phone" ? node.props.icon : "none";
    const block: FlowBlock = {
      id: createId("blk"),
      kind: "button",
      hidden: false,
      text: { text: label, marks: [] },
      href,
      icon,
      variant: node.props.variant === "outline" || node.props.variant === "text" ? node.props.variant : "filled",
      size: node.props.size === "s" || node.props.size === "l" ? node.props.size : "m",
      align: node.props.align === "center" || node.props.align === "end" ? node.props.align : "start",
      target: node.props.target === "new" ? "new" : "same",
    };
    buttonBlocks.current.set(block.id, node.id);
    insertPreviewNode(node, block, node.componentId === "generic.icon-button" ? "element:icon-button" : "element:button", insertAfter(visualDocument, path, afterId, node), at);
  }

  function insertPreviewSection(node: NodeDocument, created: Section, libraryId: string, nextVisual: unknown | null) {
    if (!page || !props.canEdit) {
      notify(managedRoute ? "This page is managed for you, so nothing can be added here." : "You can view this site but not change it.");
      return;
    }
    if (page.locked) {
      notify("This page is managed for you, so nothing can be added here.");
      return;
    }
    rememberLibrary(libraryId);
    const index = section ? page.sections.findIndex((item) => item.id === section.id) + 1 : page.sections.length;
    const next = insertSection(site, path, index < 0 ? page.sections.length : index, created);
    commit(next, true, nextVisual ?? undefined);
    pinnedNode.current = node.id;
    setNodeIds(selectNodeId(node.id).nodeIds);
    setVisualNodeIds(nextVisual ? nodeIdsIn(nextVisual) : [...visualNodeIds, node.id]);
    setSelection({ ...emptySelection, sectionId: created.id, kind: created.type });
    const label = created.type === "video" ? "Video" : created.type === "divider" ? "Divider" : created.type === "spacer" ? "Spacer" : created.type === "freeform" ? created.name : created.type === "gallery" ? "Gallery" : created.type === "cta" ? "Call to action" : created.type === "testimonial" ? "Testimonial" : created.type === "faq" ? "FAQ" : created.type === "form" ? "Form" : created.editorName || "Item";
    notify(`${label} added.`);
  }

  function insertCreatedImage(node: NodeDocument, at?: Insert) {
    if (!at && section?.type === "freeform") {
      commit(addZoneItem(site, path, section.id, "image", false), true);
      notify("Image added to the zone.");
      return;
    }
    const afterId = nodeIds.find((id) => id.startsWith("node_") || id.startsWith("grp_")) ?? null;
    const src = typeof node.props.src === "string" ? node.props.src : "";
    const alt = typeof node.props.alt === "string" ? node.props.alt : "";
    const block: FlowBlock = { id: createId("blk"), kind: "image", hidden: false, ...(src ? { src } : {}), alt };
    imageBlocks.current.set(block.id, node.id);
    insertPreviewNode(node, block, "element:image", insertAfter(visualDocument, path, afterId, node), at);
  }

  function insertCreatedInput(node: NodeDocument) {
    if (!page) return;
    const formId = selection.sectionId;
    const parentId = formSections.current.get(formId);
    const current = page.sections.find((item) => item.id === formId);
    if (!parentId || !current || current.type !== "form") {
      notify("Add this inside a form.");
      return;
    }
    const kind = node.type === "checkbox" ? "checkbox" as const : node.type === "select" ? "select" as const : node.type === "textarea" ? "textarea" as const : "text" as const;
    const label = typeof node.props.label === "string" ? node.props.label : kind === "checkbox" ? "Option" : kind === "select" ? "Choose" : kind === "textarea" ? "Message" : "Label";
    const required = node.props.required === true;
    const options = kind === "select" ? (Array.isArray(node.props.options) ? node.props.options.filter((item): item is string => typeof item === "string") : ["First", "Second"]) : undefined;
    const field = { id: createId("fld"), label, kind, required, ...(options?.length ? { options } : {}), ...(kind === "checkbox" ? { checked: node.props.checked === true } : {}) };
    const fields = current.fields?.length
      ? current.fields
      : [
          { id: "name", label: current.nameLabel || "Name", kind: "text" as const, required: true },
          { id: "email", label: current.emailLabel || "Email", kind: "email" as const, required: true },
          { id: "message", label: current.messageLabel || "Message", kind: "textarea" as const, required: false },
        ];
    const created = { ...current, fields: [...fields, field] };
    const next = {
      ...site,
      pages: site.pages.map((item) => (item.route === path ? { ...item, sections: item.sections.map((section) => (section.id === formId ? created : section)) } : item)),
    };
    const nextVisual = insertNode(visualDocument, path, parentId, node);
    commit(next, true, nextVisual ?? undefined);
    pinnedNode.current = node.id;
    setNodeIds(selectNodeId(node.id).nodeIds);
    setVisualNodeIds(nextVisual ? nodeIdsIn(nextVisual) : [...visualNodeIds, node.id]);
    setSelection({ ...emptySelection, sectionId: formId, kind: "form" });
    notify(kind === "checkbox" ? "Checkbox added." : kind === "select" ? "Select added." : kind === "textarea" ? "Text area added." : "Input added.");
  }

  function insertCreatedForm(node: NodeDocument) {
    const text = (key: string, fallback: string) => (typeof node.props[key] === "string" ? node.props[key] : fallback);
    const afterId = nodeIds.find((id) => id.startsWith("node_") || id.startsWith("grp_")) ?? null;
    const created: Section = {
      id: createId("sec"),
      type: "form",
      hidden: false,
      nameLabel: text("nameLabel", "Name"),
      emailLabel: text("emailLabel", "Email"),
      messageLabel: text("messageLabel", "Message"),
      buttonLabel: text("buttonLabel", "Send"),
      recipient: "",
    };
    formSections.current.set(created.id, node.id);
    insertPreviewSection(node, created, "element:form", insertAfter(visualDocument, path, afterId, node));
  }

  function insertCreatedFaq(node: NodeDocument) {
    const items = Array.isArray(node.props.items) ? node.props.items.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const row = item as { q?: unknown; a?: unknown };
      return [{ q: typeof row.q === "string" ? row.q : "Question", a: typeof row.a === "string" ? row.a : "Answer" }];
    }) : [{ q: "Question", a: "Answer" }];
    const afterId = nodeIds.find((id) => id.startsWith("node_") || id.startsWith("grp_")) ?? null;
    const created: Section = { id: createId("sec"), type: "faq", hidden: false, heading: "", items };
    insertPreviewSection(node, created, "element:faq", insertAfter(visualDocument, path, afterId, node));
  }

  function insertCreatedTestimonial(node: NodeDocument) {
    const quote = typeof node.props.quote === "string" ? node.props.quote : "Quote";
    const name = typeof node.props.name === "string" ? node.props.name : "Name";
    const role = typeof node.props.role === "string" ? node.props.role : "Role";
    const afterId = nodeIds.find((id) => id.startsWith("node_") || id.startsWith("grp_")) ?? null;
    const created: Section = { id: createId("sec"), type: "testimonial", hidden: false, quote, name, role };
    insertPreviewSection(node, created, "element:testimonial", insertAfter(visualDocument, path, afterId, node));
  }

  function insertCreatedCta(node: NodeDocument) {
    const heading = node.children.find((child) => child.type === "heading");
    const paragraph = node.children.find((child) => child.type === "text");
    const button = node.children.find((child) => child.type === "button");
    const afterId = nodeIds.find((id) => id.startsWith("node_") || id.startsWith("grp_")) ?? null;
    const created: Section = {
      id: createId("sec"),
      type: "cta",
      hidden: false,
      heading: heading && typeof heading.props.text === "string" ? heading.props.text : "Heading",
      body: paragraph && typeof paragraph.props.text === "string" ? paragraph.props.text : "Paragraph",
      label: button && typeof button.props.label === "string" ? button.props.label : "Continue",
      href: "/",
    };
    insertPreviewSection(node, created, "element:cta", insertAfter(visualDocument, path, afterId, node));
  }

  function insertCreatedCard(node: NodeDocument, at?: Insert) {
    const afterId = nodeIds.find((id) => id.startsWith("node_") || id.startsWith("grp_")) ?? null;
    const title = node.children.find((child) => child.type === "heading");
    const body = node.children.find((child) => child.type === "text");
    const heading = title && typeof title.props.text === "string" ? title.props.text : "Card title";
    const paragraph = body && typeof body.props.text === "string" ? body.props.text : "Card text";
    const block: FlowBlock = { id: createId("blk"), kind: "card", hidden: false, text: { text: heading, marks: [] }, detail: { text: paragraph, marks: [] } };
    insertPreviewNode(node, block, "element:card", insertAfter(visualDocument, path, afterId, node), at);
  }

  function insertCreatedGroup(node: NodeDocument) {
    const afterId = nodeIds.find((id) => id.startsWith("node_") || id.startsWith("grp_")) ?? null;
    const created: Section = { id: createId("sec"), type: "flow", hidden: false, editorName: "Group", layout: "stack", blocks: [] };
    insertPreviewSection(node, created, "element:group", insertAfter(visualDocument, path, afterId, node));
  }

  function insertCreatedCanvas(node: NodeDocument) {
    const afterId = nodeIds.find((id) => id.startsWith("node_") || id.startsWith("grp_")) ?? null;
    const created: Section = { id: createId("sec"), type: "freeform", hidden: false, name: "Canvas", items: [] };
    insertPreviewSection(node, created, "element:canvas", insertAfter(visualDocument, path, afterId, node));
  }

  function insertCreatedGrid(node: NodeDocument) {
    const afterId = nodeIds.find((id) => id.startsWith("node_") || id.startsWith("grp_")) ?? null;
    const created: Section = { id: createId("sec"), type: "flow", hidden: false, editorName: "Grid", layout: "grid", blocks: [] };
    insertPreviewSection(node, created, "element:grid", insertAfter(visualDocument, path, afterId, node));
  }

  function insertCreatedStack(node: NodeDocument) {
    const afterId = nodeIds.find((id) => id.startsWith("node_") || id.startsWith("grp_")) ?? null;
    const created: Section = { id: createId("sec"), type: "flow", hidden: false, editorName: "Stack", layout: "stack", blocks: [] };
    insertPreviewSection(node, created, "element:stack", insertAfter(visualDocument, path, afterId, node));
  }

  function insertCreatedContainer(node: NodeDocument) {
    const afterId = nodeIds.find((id) => id.startsWith("node_") || id.startsWith("grp_")) ?? null;
    const created: Section = { id: createId("sec"), type: "flow", hidden: false, editorName: "Container", layout: "stack", blocks: [] };
    insertPreviewSection(node, created, "element:container", insertAfter(visualDocument, path, afterId, node));
  }

  function insertCreatedSpacer(node: NodeDocument) {
    const size = node.props.size === "s" || node.props.size === "l" ? node.props.size : "m";
    const afterId = nodeIds.find((id) => id.startsWith("node_") || id.startsWith("grp_")) ?? null;
    const created: Section = { id: createId("sec"), type: "spacer", hidden: false, size };
    insertPreviewSection(node, created, "element:spacer", insertAfter(visualDocument, path, afterId, node));
  }

  function insertCreatedDivider(node: NodeDocument) {
    const afterId = nodeIds.find((id) => id.startsWith("node_") || id.startsWith("grp_")) ?? null;
    const created: Section = { id: createId("sec"), type: "divider", hidden: false };
    insertPreviewSection(node, created, "element:divider", insertAfter(visualDocument, path, afterId, node));
  }

  function insertCreatedIcon(node: NodeDocument, at?: Insert) {
    const name = typeof node.props.name === "string" && node.props.name ? node.props.name : "arrow";
    const afterId = nodeIds.find((id) => id.startsWith("node_") || id.startsWith("grp_")) ?? null;
    const block: FlowBlock = { id: createId("blk"), kind: "paragraph", hidden: false, text: { text: name, marks: [] } };
    insertPreviewNode(node, block, "element:icon", insertAfter(visualDocument, path, afterId, node), at);
  }

  function insertCreatedGallery(node: NodeDocument) {
    const layout = node.props.layout === "stack" || node.props.layout === "slideshow" ? node.props.layout : "grid";
    const afterId = nodeIds.find((id) => id.startsWith("node_") || id.startsWith("grp_")) ?? null;
    const created: Section = { id: createId("sec"), type: "gallery", hidden: false, images: [], layoutName: layout };
    gallerySections.current.set(created.id, node.id);
    insertPreviewSection(node, created, "element:gallery", insertAfter(visualDocument, path, afterId, node));
  }

  function insertCreatedVideo(node: NodeDocument) {
    const url = typeof node.props.url === "string" ? node.props.url : "";
    if (!acceptVideoUrl(url)) return;
    const afterId = nodeIds.find((id) => id.startsWith("node_") || id.startsWith("grp_")) ?? null;
    const created: Section = { id: createId("sec"), type: "video", hidden: false, url };
    videoSections.current.set(created.id, node.id);
    insertPreviewSection(node, created, "element:video", insertAfter(visualDocument, path, afterId, node));
  }

  function insertCreatedCustom(definition: CustomDefinition, at?: Insert) {
    const node = createCustom(definition);
    const afterId = nodeIds.find((id) => id.startsWith("node_") || id.startsWith("grp_")) ?? null;
    const block: FlowBlock = { id: createId("blk"), kind: "paragraph", hidden: false, text: { text: definition.name, marks: [] } };
    insertPreviewNode(node, block, `element:${definition.id}`, insertAfter(visualDocument, path, afterId, node), at);
  }

  function insertEntry(entry: LibraryEntry, at?: Insert) {
    if (entry.id === "element:heading") {
      insertCreatedHeading(createHeading(), at);
      return;
    }
    if (entry.id === "element:paragraph") {
      insertCreatedParagraph(createParagraph(), at);
      return;
    }
    if (entry.id === "element:richtext") {
      insertCreatedRichText(createRichText(), at);
      return;
    }
    if (entry.id === "element:link") {
      const node = createLink();
      if (node) insertCreatedLink(node, at);
      return;
    }
    if (entry.id === "element:button") {
      insertCreatedButton(createButton(), at);
      return;
    }
    if (entry.id === "element:icon-button") {
      insertCreatedButton(createIconButton(), at);
      return;
    }
    if (entry.id === "element:image") {
      insertCreatedImage(createImage(), at);
      return;
    }
    if (entry.id === "element:gallery") {
      insertCreatedGallery(createGallery());
      return;
    }
    if (entry.id === "element:video") {
      const node = createVideo();
      if (node) insertCreatedVideo(node);
      return;
    }
    if (entry.id === "element:icon") {
      insertCreatedIcon(createIcon(), at);
      return;
    }
    if (entry.id === "element:divider") {
      insertCreatedDivider(createDivider());
      return;
    }
    if (entry.id === "element:spacer") {
      insertCreatedSpacer(createSpacer());
      return;
    }
    if (entry.id === "element:container") {
      insertCreatedContainer(createContainer());
      return;
    }
    if (entry.id === "element:stack") {
      insertCreatedStack(createStack());
      return;
    }
    if (entry.id === "element:grid") {
      insertCreatedGrid(createGrid());
      return;
    }
    if (entry.id === "element:canvas") {
      insertCreatedCanvas(createCanvas());
      return;
    }
    if (entry.id === "element:group") {
      insertCreatedGroup(createGroup());
      return;
    }
    if (entry.id === "element:card") {
      insertCreatedCard(createCard(), at);
      return;
    }
    if (entry.id === "element:cta") {
      insertCreatedCta(createCta());
      return;
    }
    if (entry.id === "element:testimonial") {
      insertCreatedTestimonial(createTestimonial());
      return;
    }
    if (entry.id === "element:faq") {
      insertCreatedFaq(createFaq());
      return;
    }
    if (entry.id === "element:form") {
      insertCreatedForm(createForm());
      return;
    }
    if (entry.id === "element:input") {
      insertCreatedInput(createInput());
      return;
    }
    if (entry.id === "element:textarea") {
      insertCreatedInput(createTextarea());
      return;
    }
    if (entry.id === "element:select") {
      insertCreatedInput(createSelect());
      return;
    }
    if (entry.id === "element:checkbox") {
      insertCreatedInput(createCheckbox());
      return;
    }
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
    setNodeIds(clearNodeSelection().nodeIds);
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
        setDragReason(null);
        break;
      }
      case "4eos-drag-reject": {
        const reason = dragRejectReason(text("reason"));
        if (reason) setDragReason(reason);
        break;
      }
      case "4eos-drag-start":
        dropIgnored.current = false;
        dragActive.current = true;
        break;
      case "4eos-drag-cancel":
        dragActive.current = false;
        setDragReason(null);
        break;
      case "4eos-overflow":
        setContentOverflow(overflowWarning({
          textWidth: Number(data.textWidth) || 0,
          textHeight: Number(data.textHeight) || 0,
          nodeWidth: Number(data.nodeWidth) || 0,
          nodeHeight: Number(data.nodeHeight) || 0,
          parentWidth: Number(data.parentWidth) || 0,
          parentHeight: Number(data.parentHeight) || 0,
        }));
        break;
      case "4eos-keyboard": {
        const decision = keyboardStep({
          key: text("key"),
          alt: data.alt !== false,
          shift: data.shift === true,
          index: Number(data.index),
          count: Number(data.count),
          neighbor: text("neighbor"),
          locked: data.locked === true,
          row: data.row === true,
        });
        if (!decision) break;
        setKeyboardStatus(decision.announcement);
        if (!decision.ok) break;
        const sectionId = text("sectionId");
        const itemId = text("itemId");
        const visual = keyboardMove(visualDocument, {
          nodeId: itemId,
          key: text("key"),
          alt: true,
          shift: data.shift === true,
          childType: "text",
          childParents: { allowedParents: ["section", "container", "stack", "grid", "group", "card"] },
        });
        const nextVisual = visual && visual.ok ? visual.document ?? undefined : undefined;
        if (data.shift === true) {
          const targetSectionId = text("targetSectionId");
          if (!targetSectionId) break;
          commit(moveBlockToSection(site, path, sectionId, targetSectionId, itemId, text("targetId"), false), true, nextVisual);
          break;
        }
        commit(moveFlowBlockById(site, path, sectionId, itemId, text("neighborId"), decision.delta > 0), true, nextVisual);
        break;
      }
      case "4eos-select-node": {
        const sections = (page?.sections ?? []).map((section) => ({
          id: section.id,
          blocks: section.type === "flow" ? section.blocks : [],
          items: section.type === "freeform" ? section.items : section.type === "preset" ? section.overlay ?? [] : [],
        }));
        const target = selectionTargetForNode(sections, data);
        if (target) setSelection(selectionFor(target.sectionId, target.itemId));
        else {
          const nodeId = nodeIdFromCanvasMessage(data);
          if (nodeId) setNodeIds(selectNodeId(nodeId).nodeIds);
        }
        break;
      }
      case "4eos-editing":
        setEditing(Boolean(data.active));
        break;
      case "4eos-text": {
        const marks = readMarks(data.marks);
        const itemId = text("itemId");
        const nodeId = richBlocks.current.get(itemId);
        const nextVisual = nodeId ? writeRichMarks(visualDocument, nodeId, text("value"), marks ?? []) : null;
        commitText(applyText(site, path, text("sectionId"), text("field") || "text", text("value"), itemId || undefined, marks), `${text("sectionId")}:${itemId}:${text("field")}`);
        if (nextVisual) setVisualDocument(nextVisual);
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
        if (dropIgnored.current) { dropIgnored.current = false; break; }
        dragActive.current = false;
        commit(moveSectionById(site, path, text("sectionId"), text("beforeId")), true);
        break;
      case "4eos-reparent": {
        if (dropIgnored.current) { dropIgnored.current = false; break; }
        dragActive.current = false;
        const fromSection = text("sectionId");
        const toSection = text("targetSectionId") || fromSection;
        if (fromSection === toSection) {
          const next = moveFlowBlockById(site, path, fromSection, text("itemId"), text("targetId"), Boolean(data.after));
          const nextVisual = flowReorder(visualDocument, text("itemId"), text("targetId"), Boolean(data.after));
          commit(next, true, nextVisual ?? undefined);
          break;
        }
        const next = moveBlockToSection(site, path, fromSection, toSection, text("itemId"), text("targetId"), Boolean(data.after));
        const drop = {
          nodeId: text("itemId"),
          parentId: text("targetSectionId"),
          targetId: text("targetId"),
          after: Boolean(data.after),
          draggedLocked: false,
          childType: "text",
          childParents: { allowedParents: ["section", "container", "stack", "grid", "group", "card"] },
          parentType: "section",
          parentChildren: { acceptsChildren: true },
        };
        const exited = groupExit(visualDocument, drop);
        if (exited && exited.ok === false) {
          setDragReason(exited.reason);
          break;
        }
        const entered = exited && exited.ok ? exited : groupEnter(visualDocument, drop);
        if (entered && entered.ok === false) {
          setDragReason(entered.reason);
          break;
        }
        const result = entered && entered.ok ? entered : reparent(visualDocument, drop);
        if (result && result.ok === false) {
          setDragReason(result.reason);
          break;
        }
        commit(next, true, result && result.ok ? result.document : undefined);
        break;
      }
      case "4eos-insert":
        if (!props.canEdit) return;
        setInsert({ beforeId: text("beforeId") });
        break;
      case "4eos-insert-type": {
        const entry = entryById(text("libraryType"));
        if (entry) insertEntry(entry, { beforeId: text("beforeId") });
        break;
      }
      case "4eos-library-drop": {
        const factoryId = text("libraryType") || libraryFactory.current;
        const raw = data.box;
        const record = raw && typeof raw === "object" ? raw as { x?: unknown; y?: unknown; w?: unknown; h?: unknown } : null;
        const fractions = record ? { x: Number(record.x), y: Number(record.y), w: Number(record.w), h: Number(record.h) } : null;
        const box = fractions && [fractions.x, fractions.y, fractions.w, fractions.h].every(Number.isFinite)
          ? { x: toPercent(fractions.x * 100, 100), y: toPercent(fractions.y * 100, 100), w: toPercent(fractions.w * 100, 100), h: toPercent(fractions.h * 100, 100) }
          : undefined;
        const result = libraryDrop(visualDocument, {
          factoryId,
          parentId: text("sectionId"),
          parentType: text("parentType") || "section",
          parentLocked: data.locked === true,
          box,
        });
        if (!result.ok) {
          setDragReason(result.reason);
          break;
        }
        if (data.canvas === true && factoryId === "element:button" && fractions) {
          const sectionId = text("sectionId");
          const added = addZoneItem(site, path, sectionId, "button", false);
          const created = pageByRoute(added, path)?.sections.find((item) => item.id === sectionId);
          const item = created && created.type === "freeform" ? created.items[created.items.length - 1] : null;
          if (!item) break;
          commit(placeItems(added, path, sectionId, "desktop", [{ id: item.id, placement: fractions }]), true, result.document ?? undefined);
          notify("Button added to the zone.");
        }
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
        if (dropIgnored.current) { dropIgnored.current = false; break; }
        dragActive.current = false;
        if (!Array.isArray(data.items)) return;
        const name = data.viewport === "mobile" || data.viewport === "tablet" ? data.viewport : "desktop";
        const items = (data.items as { id: string; placement: { x: number; y: number; w: number; h: number } }[]).filter((item) => item && item.placement);
        let nextVisual: unknown = visualDocument;
        for (const item of items) {
          const updated = placeOnCanvas(nextVisual, {
            nodeId: item.id,
            breakpoint: name,
            x: toPercent(item.placement.x * 100, 100),
            y: toPercent(item.placement.y * 100, 100),
            w: toPercent(item.placement.w * 100, 100),
            h: toPercent(item.placement.h * 100, 100),
          });
          if (updated) nextVisual = updated;
        }
        commit(placeItems(site, path, text("sectionId"), name, items, Boolean(data.overlay)), false, nextVisual !== visualDocument ? nextVisual : undefined);
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

  useCanvasMessages(onMessage, props.websiteId);

  useEffect(() => {
    const node = document.getElementById("site-preview") as HTMLIFrameElement | null;
    if (!node) return;
    const point = (event: DragEvent) => {
      const rect = node.getBoundingClientRect();
      return {
        x: (event.clientX - rect.left) / (scale || 1),
        y: (event.clientY - rect.top) / (scale || 1),
      };
    };
    const libraryDrag = (event: DragEvent) => {
      const types = [...(event.dataTransfer?.types ?? [])];
      return types.includes("application/x-4eos-library") || libraryFactory.current.startsWith("element:");
    };
    const over = (event: DragEvent) => {
      if (!libraryDrag(event)) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
      node.contentWindow?.postMessage({ type: "4eos-library-probe", ...point(event), commit: false }, "*");
    };
    const drop = (event: DragEvent) => {
      if (!libraryDrag(event)) return;
      event.preventDefault();
      const factoryId = event.dataTransfer?.getData("application/x-4eos-library") || libraryFactory.current;
      node.contentWindow?.postMessage({ type: "4eos-library-probe", ...point(event), commit: true, libraryType: factoryId }, "*");
    };
    node.addEventListener("dragover", over);
    node.addEventListener("drop", drop);
    return () => {
      node.removeEventListener("dragover", over);
      node.removeEventListener("drop", drop);
    };
  }, [scale, version]);

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
      } else if (event.key === "Escape") {
        const decision = cancelDrag({ dragging: dragActive.current, dialogOpen: Boolean(document.querySelector(".ed-dialog")), key: event.key });
        if (decision.cancel) {
          event.preventDefault();
          dropIgnored.current = true;
          dragActive.current = false;
          if (decision.clearStatus) setDragReason(null);
          toFrame({ type: "4eos-cancel-drag" });
          return;
        }
        if (!document.querySelector(".ed-dialog") && (selection.sectionId || selection.chrome)) clearSelection();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const mediaWithUse = media.map((item) => ({ ...item, usedBy: imageUsage(site, posts, item.filename) }));
  const api: EditorApi = {
    websiteId: props.websiteId,
    siteContext: activeSiteContext(siteState.site, props.websiteId),
    adapterId,
    adapter,
    site,
    path,
    page,
    canEdit: props.canEdit,
    viewport,
    selection,
    visualDocument,
    commit: (next, reload, nextVisual) => {
      const blockId = selection.itemId;
      const nodeId = blockId ? linkBlocks.current.get(blockId) : undefined;
      const buttonId = blockId ? buttonBlocks.current.get(blockId) : undefined;
      const href = blockId ? flowBlockHref(next, path, blockId) : "";
      const previous = blockId ? flowBlockHref(site, path, blockId) : "";
      const updated = nodeId && href !== previous ? writeLinkHref(visualDocument, nodeId, href) : buttonId && href !== previous ? writeButtonField(visualDocument, buttonId, "href", href) : null;
      commit(next, reload, nextVisual ?? updated ?? undefined);
    },
    commitText,
    notify,
    selectNode,
    openPicker: () => setPicker(true),
    openCrop: () => openCrop(),
    run: (action) => runAction(action, selection.sectionId, selection.itemId, selection.overlay, selection.itemIds),
    changeRoute: changeCurrentRoute,
    media: mediaWithUse,
  };

  const width = breakpointWidth(adapter, viewport);
  const devices = (["desktop", "tablet", "mobile"] as const).map((id) => ({ id, label: previewRadioLabel[id] }));
  const recommended = recommendedFor(page?.sections ?? []);
  const recommendedHere = recommendedFor(page?.sections ?? [], section?.type === "flow" && !selection.locked);
  const templates = site.sectionTemplates.map((item) => ({ id: item.id, name: item.name }));
  const canPlaceImage = Boolean(selection.sectionId && (selection.kind === "image" || imageSrc(selection.sectionId, selection.itemId)));
  const pageTitle = pageState?.title ?? page?.title ?? activePost?.title ?? (path === "/" ? "Home" : path);
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
    <div className="ed-root" data-adapter={adapterId ?? undefined} data-experience={experience} data-error={editorError?.code} data-nodes={nodeIds.join(" ")} data-visual-nodes={visualNodeIds.join(" ")}>
      <TopBar
        websiteName={props.websiteName}
        pageTitle={pageTitle}
        onPages={() => setRail("pages")}
        onNewPage={() => setAddingPage(true)}
        viewport={viewport}
        devices={devices}
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
        experience={experience}
        canAdminister={props.canAdminister}
        onExperience={(mode) => setExperience(persistExperience(window.localStorage, props.websiteId, mode, props.canAdminister))}
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
                <LibraryBrowser canEmbed={props.canEmbed} recent={recentLibrary} recommended={recommendedHere} templates={templates} adapter={adapter} onLibraryDrag={(id) => { libraryFactory.current = id; }} onLibraryDrop={(drop) => {
                  const node = document.getElementById("site-preview") as HTMLIFrameElement | null;
                  if (!node) return;
                  const rect = node.getBoundingClientRect();
                  const inside = drop.x >= rect.left && drop.x <= rect.right && drop.y >= rect.top && drop.y <= rect.bottom;
                  if (!inside) {
                    setDragReason("parent_rejected");
                    return;
                  }
                  node.contentWindow?.postMessage({
                    type: "4eos-library-probe",
                    x: (drop.x - rect.left) / (scale || 1),
                    y: (drop.y - rect.top) / (scale || 1),
                    commit: true,
                    libraryType: drop.factoryId,
                  }, "*");
                }} onChoose={(entry) => insertEntry(entry)} onElement={(node) => {
                  if (node.componentId === "generic.text") insertCreatedParagraph(node);
                  else if (node.componentId === "generic.richtext") insertCreatedRichText(node);
                  else if (node.componentId === "generic.link") insertCreatedLink(node);
                  else if (node.componentId === "generic.button" || node.componentId === "generic.icon-button") insertCreatedButton(node);
                  else if (node.componentId === "generic.image") insertCreatedImage(node);
                  else if (node.componentId === "generic.gallery") insertCreatedGallery(node);
                  else if (node.componentId === "generic.video") insertCreatedVideo(node);
                  else if (node.componentId === "generic.icon") insertCreatedIcon(node);
                  else if (node.componentId === "generic.divider") insertCreatedDivider(node);
                  else if (node.componentId === "generic.spacer") insertCreatedSpacer(node);
                  else if (node.componentId === "generic.container") insertCreatedContainer(node);
                  else if (node.componentId === "generic.stack") insertCreatedStack(node);
                  else if (node.componentId === "generic.grid") insertCreatedGrid(node);
                  else if (node.componentId === "generic.canvas") insertCreatedCanvas(node);
                  else if (node.componentId === "generic.group") insertCreatedGroup(node);
                  else if (node.componentId === "generic.card") insertCreatedCard(node);
                  else if (node.componentId === "generic.cta") insertCreatedCta(node);
                  else if (node.componentId === "generic.testimonial") insertCreatedTestimonial(node);
                  else if (node.componentId === "generic.faq") insertCreatedFaq(node);
                  else if (node.componentId === "generic.form") insertCreatedForm(node);
                  else if (node.componentId === "generic.input" || node.componentId === "generic.textarea" || node.componentId === "generic.select" || node.componentId === "generic.checkbox") insertCreatedInput(node);
                  else insertCreatedHeading(node);
                }} onCustom={(definition) => insertCreatedCustom(definition)} onTemplate={(id) => insertTemplate(id)} dense />
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
          <DragStatus reason={dragReason} />
          {keyboardStatus ? <p className="ed-keyboard-status" role="status" aria-live="polite">{keyboardStatus}</p> : null}
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
          overflow={contentOverflow}
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
            <button type="button" className="ed-icon is-small" aria-label="Dismiss" onClick={() => { setToasts((items) => items.filter((item) => item.id !== toast.id)); setEditorError(dismissEditorError(site).error); }}>
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
          adapter={adapter}
          onChoose={(entry) => {
            insertEntry(entry, insert);
            setInsert(null);
          }}
          onCustom={(definition) => {
            insertCreatedCustom(definition, insert);
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
