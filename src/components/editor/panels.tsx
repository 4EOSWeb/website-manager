"use client";

import { useState } from "react";
import type { DragRejectReason } from "@/components/editor/drag-status";
import { ArrowDown, ArrowUp, Eye, EyeOff, FileText, Home, Lock, MoreHorizontal, PanelBottom, PanelTop, Plus, Search, Trash2, Upload } from "lucide-react";
import type { BlogDraft, SiteDraft } from "@/lib/content-schema";
import { moveFlowBlockById, moveSectionById, reorderPages, setBlockHidden, setEditorName, setSectionHidden } from "@/lib/editor-ops";
import type { EditorApi, MediaItem, Viewport } from "@/components/editor/types";
import { Empty, Field, Group, Segmented, TextInput } from "@/components/editor/ui";
import { sectionName } from "@/components/editor/inspector/section";
import { LayerRename } from "@/components/editor/layers/rename";
import { renameVisualNode } from "@/components/editor/layers/rename-name";
import { useLayerReorder } from "@/components/editor/layers/reorder";
import { reorderLayerSiblings, siblingBeforeId } from "@/components/editor/layers/reorder-drop";
import { LayerLockButton, LayerUnlockButton } from "@/components/editor/layers/lock";
import { lockFlowBlock, lockVisualNode } from "@/components/editor/layers/lock-node";
import { applyLayerUnlock, LAYER_UNLOCK_REASON, layerRole, layerUnlockAllowed } from "@/components/editor/layers/unlock-policy";
import { LayerVisibilityButton } from "@/components/editor/layers/visibility";
import { setLayerVisibility } from "@/components/editor/layers/visibility-node";
import { LayerReparentNote } from "@/components/editor/layers/reparent";
import { applyLayerReparent, decideLayerDrop } from "@/components/editor/layers/reparent-drop";
import { LayerTree, useLayerOpen } from "@/components/editor/layers/tree";
import { layerIdText, typeLabel, type LayerExperience } from "@/components/editor/layers/labels";
import { defaultOpenIds, legacyTarget, visualPageRoot } from "@/components/editor/layers/rows";

export function PagesPanel(props: {
  site: SiteDraft;
  posts: BlogDraft[];
  path: string;
  canEdit: boolean;
  onOpen: (route: string) => void;
  onAddPage: () => void;
  onNewPost: () => void;
  onSettings: (route: string) => void;
  commit: (next: SiteDraft, reload: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const match = (text: string) => text.toLowerCase().includes(query.trim().toLowerCase());
  const pages = props.site.pages.filter((page) => match(`${page.title} ${page.route}`));
  const groups = [
    { title: "In the menu", items: pages.filter((page) => !page.archived && page.navVisible) },
    { title: "Not in the menu", items: pages.filter((page) => !page.archived && !page.navVisible) },
    { title: "Archived", items: pages.filter((page) => page.archived) },
  ];
  const posts = props.posts.filter((post) => match(post.title));
  return (
    <div className="ed-panel">
      <div className="ed-panel-head">
        <h2>Pages</h2>
        {props.canEdit ? (
          <button type="button" className="ed-button is-small" onClick={props.onAddPage}>
            <Plus size={14} aria-hidden="true" /> Add page
          </button>
        ) : null}
      </div>
      <label className="ed-search">
        <Search size={14} aria-hidden="true" />
        <input placeholder="Search pages" aria-label="Search pages" value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {groups.map((group) =>
        group.items.length ? (
          <Group key={group.title} title={group.title}>
            <ul className="ed-tree">
              {group.items.map((page) => {
                const index = props.site.pages.findIndex((item) => item.route === page.route);
                return (
                  <li key={page.route} className={props.path === page.route ? "is-active" : ""}>
                    <button type="button" className="ed-tree-main" aria-current={props.path === page.route ? "page" : undefined} onClick={() => props.onOpen(page.route)}>
                      {page.route === "/" ? <Home size={14} aria-hidden="true" /> : <FileText size={14} aria-hidden="true" />}
                      <span className="truncate">{page.navLabel || page.title}</span>
                      {page.parentRoute ? <span className="ed-tag">Sub-page</span> : null}
                      {page.locked ? <Lock size={12} aria-label="Managed for you" className="ed-muted-icon" /> : null}
                    </button>
                    <span className="ed-tree-actions">
                      {page.route !== "/" && props.canEdit ? (
                        <>
                          <button type="button" className="ed-icon is-small" aria-label={`Move ${page.title} up`} data-tip="Move up" disabled={index <= 1} onClick={() => props.commit(reorderPages(props.site, index, index - 1), true)}><ArrowUp size={13} aria-hidden="true" /></button>
                          <button type="button" className="ed-icon is-small" aria-label={`Move ${page.title} down`} data-tip="Move down" disabled={index >= props.site.pages.length - 1} onClick={() => props.commit(reorderPages(props.site, index, index + 2), true)}><ArrowDown size={13} aria-hidden="true" /></button>
                        </>
                      ) : null}
                      <button type="button" className="ed-icon is-small" aria-label={`${page.title} settings`} data-tip="Page settings" onClick={() => props.onSettings(page.route)}><MoreHorizontal size={14} aria-hidden="true" /></button>
                    </span>
                  </li>
                );
              })}
            </ul>
          </Group>
        ) : null,
      )}
      <Group title="Insights drafts" action={props.canEdit ? <button type="button" className="ed-icon is-small" aria-label="New Insights post" data-tip="New post" onClick={props.onNewPost}><Plus size={14} aria-hidden="true" /></button> : null}>
        {posts.length ? (
          <ul className="ed-tree">
            {posts.map((post) => (
              <li key={post.slug} className={props.path === `/insights/${post.slug}` ? "is-active" : ""}>
                <button type="button" className="ed-tree-main" onClick={() => props.onOpen(`/insights/${post.slug}`)}>
                  <FileText size={14} aria-hidden="true" />
                  <span className="truncate">{post.title}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="ed-hint ed-pad">No drafts yet. The 115 published articles are managed for you.</p>
        )}
      </Group>
      {pages.length === 0 && posts.length === 0 ? <Empty title="No pages match">Try part of the page name or its address.</Empty> : null}
    </div>
  );
}

export function LayersPanel(props: { api: EditorApi; experience: LayerExperience; chromeFocus: string; onSelect: (sectionId: string, itemId?: string) => void; onChrome: (part: "header" | "footer") => void }) {
  const { api } = props;
  const [renaming, setRenaming] = useState("");
  const sections = api.page?.sections ?? [];
  const visualRoot = visualPageRoot(api.visualDocument, api.path);
  const defaults = visualRoot
    ? defaultOpenIds(visualRoot)
    : sections.filter((section) => section.type === "flow" && section.blocks.length > 0).map((section) => section.id);
  const layers = useLayerOpen(api.websiteId, api.page?.id ?? api.path, defaults);
  const rename = (sectionId: string, value: string, blockId?: string) => {
    setRenaming("");
    api.commit(setEditorName(api.site, api.path, sectionId, value, blockId), false);
  };
  const pageId = api.page?.id ?? "";
  const [reject, setReject] = useState<DragRejectReason | null>(null);
  const setVisibility = (sectionId: string, blockId: string, hidden: boolean) => {
    const nextVisual = setLayerVisibility(api.visualDocument, blockId, hidden);
    api.commit(setBlockHidden(api.site, api.path, sectionId, blockId, hidden), true, nextVisual ?? undefined);
  };
  const lockBlock = (sectionId: string, blockId: string) => {
    const nextVisual = lockVisualNode(api.visualDocument, blockId);
    api.commit(lockFlowBlock(api.site, api.path, sectionId, blockId), false, nextVisual ?? undefined);
  };
  const layersDrag = useLayerReorder(api.canEdit, (drop) => {
    const decision = decideLayerDrop({
      pageId,
      sourceId: drop.id,
      sourceParentId: drop.parentId,
      targetId: drop.targetId,
      targetParentId: drop.targetParentId,
      targetSectionType: drop.targetSectionType,
      targetContainer: drop.targetContainer,
      after: drop.after,
    });
    if (decision.kind === "ignore") return;
    if (decision.kind === "reject") {
      setReject(decision.reason);
      return;
    }
    if (decision.kind === "reparent") {
      const applied = applyLayerReparent(api.site, api.path, api.visualDocument, decision);
      if ("reason" in applied) {
        setReject(applied.reason);
        return;
      }
      setReject(null);
      api.commit(applied.site, true, applied.visual ?? undefined);
      return;
    }
    setReject(null);
    const sectionIds = sections.map((section) => section.id);
    let nextSite = api.site;
    if (drop.parentId === pageId) {
      const beforeId = siblingBeforeId(sectionIds, drop.id, drop.targetId, drop.after);
      if (beforeId === null) return;
      nextSite = moveSectionById(api.site, api.path, drop.id, beforeId);
    } else if (sections.some((section) => section.id === drop.parentId && section.type === "flow")) {
      nextSite = moveFlowBlockById(api.site, api.path, drop.parentId, drop.id, drop.targetId, drop.after);
    }
    const nextVisual = reorderLayerSiblings(api.visualDocument, drop.id, drop.targetId, drop.after);
    const siteChanged = JSON.stringify(nextSite) !== JSON.stringify(api.site);
    if (!siteChanged && !nextVisual) return;
    api.commit(siteChanged ? nextSite : api.site, true, nextVisual ?? undefined);
  }, (reason) => setReject(reason));
  if (visualRoot) {
    return (
      <div className="ed-panel">
        <div className="ed-panel-head">
          <h2>Layers</h2>
        </div>
        <p className="ed-hint ed-pad">Click to select. Double-click a name to rename it. Drag a row to reorder it, or onto another section to move it.</p>
        <LayerReparentNote reason={reject} />
        <ul className="ed-tree is-layers" role="tree" aria-label="Page layers" data-layer-source="visual">
          <LayerTree
            root={visualRoot}
            experience={props.experience}
            open={layers.open}
            onToggle={layers.toggle}
            selection={{ sectionId: api.selection.sectionId, itemId: api.selection.itemId }}
            onSelect={(node) => {
              const target = legacyTarget(node.metadata?.legacyId);
              if (target) props.onSelect(target.sectionId, target.itemId);
            }}
            renamingId={renaming}
            onRenameStart={(node) => api.canEdit && setRenaming(node.id)}
            onRename={(node, name) => {
              setRenaming("");
              const next = renameVisualNode(api.visualDocument, node.id, name);
              if (next) api.commit(api.site, false, next);
            }}
            onRenameCancel={() => setRenaming("")}
            onLock={api.canEdit ? (node) => {
              const target = legacyTarget(node.metadata?.legacyId);
              const nextSite = target?.itemId ? lockFlowBlock(api.site, api.path, target.sectionId, target.itemId) : api.site;
              const nextVisual = lockVisualNode(api.visualDocument, node.id);
              if (nextVisual) api.commit(nextSite, false, nextVisual);
              else if (target?.itemId) api.commit(nextSite, false);
            } : undefined}
            onUnlock={api.canEdit ? (node) => {
              const target = legacyTarget(node.metadata?.legacyId);
              if (!target?.itemId) return;
              const applied = applyLayerUnlock(api.site, api.path, target.sectionId, target.itemId, node.type, layerRole(api.role), api.visualDocument);
              if (!applied.ok) return;
              api.commit(applied.site, false, applied.visual ?? undefined);
            } : undefined}
            unlockAllowed={(node) => layerUnlockAllowed(node.type, layerRole(api.role))}
            unlockReason={LAYER_UNLOCK_REASON}
            onPointerDown={layersDrag.onPointerDown}
            dropHint={layersDrag.drop}
          />
        </ul>
      </div>
    );
  }
  return (
    <div className="ed-panel">
      <div className="ed-panel-head">
        <h2>Layers</h2>
      </div>
      <p className="ed-hint ed-pad">Click to select. Double-click a name to rename it. Drag a row to reorder it, or onto another section to move it.</p>
      <LayerReparentNote reason={reject} />
      <ul className="ed-tree is-layers" role="tree" aria-label="Page layers" data-layer-source="version3">
        <li role="treeitem" aria-selected={props.chromeFocus === "header"} className={props.chromeFocus === "header" ? "is-active" : ""} data-layer-id="header" data-layer-parent="chrome" data-locked="true" data-layer-drop={layersDrag.drop?.id === "header" ? (layersDrag.drop.after ? "after" : "before") : undefined} onPointerDown={layersDrag.onPointerDown}>
          <button type="button" className="ed-tree-main" onClick={() => props.onChrome("header")}><PanelTop size={14} aria-hidden="true" /> Header <Lock size={12} aria-label="Locked" className="ed-muted-icon" /></button>
          {layerUnlockAllowed("header", layerRole(api.role)) ? null : <LayerUnlockButton allowed={false} reason={LAYER_UNLOCK_REASON} onUnlock={() => {}} />}
        </li>
        {sections.map((section) => {
          const activeSection = api.selection.sectionId === section.id && !api.selection.itemId;
          const locked = section.type === "preset" && section.providerLocked;
          return (
            <li key={section.id} role="treeitem" aria-selected={activeSection} aria-expanded={section.type === "flow" && section.blocks.length > 0 ? layers.open.has(section.id) : undefined} data-layer-id={section.id} data-layer-parent={pageId || undefined} data-layer-container="true" data-section-type={section.type} data-locked={locked ? "true" : undefined} data-layer-drop={layersDrag.drop?.id === section.id ? (layersDrag.drop.after ? "after" : "before") : undefined} onPointerDown={layersDrag.onPointerDown}>
              <div className={activeSection ? "ed-tree-row is-active" : "ed-tree-row"}>
                {renaming === section.id ? (
                  <LayerRename value={section.editorName || ""} label="Section name" onCommit={(value) => rename(section.id, value)} onCancel={() => setRenaming("")} />
                ) : (
                  <button type="button" className={`ed-tree-main ${section.hidden ? "is-hidden" : ""}`} onClick={() => props.onSelect(section.id)} onDoubleClick={() => api.canEdit && setRenaming(section.id)}>
                    <span className="ed-layer-dot" aria-hidden="true" />
                    <span className="truncate">{sectionName(section)}</span>
                    {locked ? <Lock size={12} aria-label="Managed for you" className="ed-muted-icon" /> : null}
                  </button>
                )}
                {!locked && api.canEdit ? (
                  <button type="button" className="ed-icon is-small" aria-label={section.hidden ? `Show ${sectionName(section)}` : `Hide ${sectionName(section)}`} data-tip={section.hidden ? "Show" : "Hide"} onClick={() => api.commit(setSectionHidden(api.site, api.path, section.id, !section.hidden), true)}>
                    {section.hidden ? <EyeOff size={13} aria-hidden="true" /> : <Eye size={13} aria-hidden="true" />}
                  </button>
                ) : null}
                {section.type === "flow" && section.blocks.length > 0 ? (
                  <button type="button" className="ed-icon is-small" aria-label={layers.open.has(section.id) ? "Collapse" : "Expand"} data-layer-toggle={section.id} onClick={() => layers.toggle(section.id)}>
                    {layers.open.has(section.id) ? "–" : "+"}
                  </button>
                ) : null}
              </div>
              {section.type === "flow" && section.blocks.length > 0 && layers.open.has(section.id) ? (
                <ul role="group">
                  {section.blocks.map((block) => {
                    const active = api.selection.itemId === block.id;
                    const label = block.editorName || (block.text && typeof block.text === "object" && block.text.text ? block.text.text.slice(0, 32) : block.kind);
                    const componentId = layerIdText(props.experience, { id: block.id });
                    return (
                      <li key={block.id} role="treeitem" aria-selected={active} data-layer-id={block.id} data-layer-parent={section.id} data-section-type={section.type} data-locked={block.locked ? "true" : undefined} data-hidden={block.hidden ? "true" : undefined} data-layer-drop={layersDrag.drop?.id === block.id ? (layersDrag.drop.after ? "after" : "before") : undefined} onPointerDown={layersDrag.onPointerDown}>
                        <div className={active ? "ed-tree-row is-child is-active" : "ed-tree-row is-child"}>
                          {renaming === block.id ? (
                            <LayerRename value={block.editorName || ""} label="Item name" onCommit={(value) => rename(section.id, value, block.id)} onCancel={() => setRenaming("")} />
                          ) : (
                            <>
                              <button type="button" className={`ed-tree-main ${block.hidden ? "is-hidden" : ""}`} onClick={() => props.onSelect(section.id, block.id)} onDoubleClick={() => api.canEdit && setRenaming(block.id)}>
                                <span className="ed-kind">{block.kind === "brand-mark" ? "Logo" : typeLabel(block.kind)}</span>
                                <span className="truncate">{label}</span>
                                {block.locked ? <Lock size={12} aria-label="Locked" className="ed-muted-icon" /> : null}
                              </button>
                              {componentId ? <span className="ed-layer-id">{componentId}</span> : null}
                            </>
                          )}
                          {block.locked ? (
                            <LayerUnlockButton
                              allowed={layerUnlockAllowed(block.kind, layerRole(api.role))}
                              reason={LAYER_UNLOCK_REASON}
                              onUnlock={() => {
                                const applied = applyLayerUnlock(api.site, api.path, section.id, block.id, block.kind, layerRole(api.role), api.visualDocument);
                                if (applied.ok) api.commit(applied.site, false, applied.visual ?? undefined);
                              }}
                            />
                          ) : api.canEdit ? <LayerLockButton label={`Lock ${label}`} onLock={() => lockBlock(section.id, block.id)} /> : null}
                          {!block.locked && api.canEdit ? <LayerVisibilityButton hidden={block.hidden} label={label} onChange={(hidden) => setVisibility(section.id, block.id, hidden)} /> : null}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </li>
          );
        })}
        <li role="treeitem" aria-selected={props.chromeFocus === "footer"} className={props.chromeFocus === "footer" ? "is-active" : ""} data-layer-id="footer" data-layer-parent="chrome" data-locked="true" data-layer-drop={layersDrag.drop?.id === "footer" ? (layersDrag.drop.after ? "after" : "before") : undefined} onPointerDown={layersDrag.onPointerDown}>
          <button type="button" className="ed-tree-main" onClick={() => props.onChrome("footer")}><PanelBottom size={14} aria-hidden="true" /> Footer <Lock size={12} aria-label="Locked" className="ed-muted-icon" /></button>
          {layerUnlockAllowed("footer", layerRole(api.role)) ? null : <LayerUnlockButton allowed={false} reason={LAYER_UNLOCK_REASON} onUnlock={() => {}} />}
        </li>
      </ul>
      {sections.length === 0 ? <Empty title="This page has no sections yet">Use Add to put your first section on the page.</Empty> : null}
    </div>
  );
}

export function DesignPanel(props: { site: SiteDraft; canEdit: boolean; commit: (next: SiteDraft, reload: boolean) => void; commitText: (next: SiteDraft, key: string, reload?: boolean) => void }) {
  const chrome = props.site.chrome;
  const disabled = !props.canEdit;
  const theme = (patch: Partial<typeof chrome.theme>) => props.commit({ ...props.site, chrome: { ...chrome, theme: { ...chrome.theme, ...patch } } }, true);
  const profile = (patch: Partial<typeof chrome.profile>, key: string) => props.commitText({ ...props.site, chrome: { ...chrome, profile: { ...chrome.profile, ...patch } } }, `profile:${key}`, true);
  return (
    <div className="ed-panel">
      <div className="ed-panel-head">
        <h2>Site styles</h2>
      </div>
      <p className="ed-hint ed-pad">These apply to every page.</p>
      <Group title="Colors">
        <div className="ed-color-grid">
          {(["ink", "plum", "green", "paper"] as const).map((token) => (
            <label key={token} className="ed-color-field">
              <input className="ed-color" type="color" value={chrome.theme[token]} disabled={disabled} onChange={(event) => theme({ [token]: event.target.value })} />
              <span>{token === "ink" ? "Text" : token === "plum" ? "Accent" : token === "green" ? "Highlight" : "Background"}</span>
            </label>
          ))}
        </div>
      </Group>
      <Group title="Type and buttons">
        <Field label="Headings">
          <Segmented label="Heading font" value={chrome.theme.font} disabled={disabled} options={[{ value: "serif", label: "Serif" }, { value: "sans", label: "Sans serif" }]} onChange={(value) => theme({ font: value })} />
        </Field>
        <Field label="Buttons">
          <Segmented label="Button look" value={chrome.theme.button} disabled={disabled} options={[{ value: "filled", label: "Filled" }, { value: "outline", label: "Outline" }]} onChange={(value) => theme({ button: value })} />
        </Field>
        <Field label="Spacing">
          <Segmented label="Spacing" value={chrome.theme.spacing} disabled={disabled} options={[{ value: "compact", label: "Compact" }, { value: "comfortable", label: "Normal" }, { value: "roomy", label: "Roomy" }]} onChange={(value) => theme({ spacing: value })} />
        </Field>
      </Group>
      <Group title="Business details" defaultOpen={false}>
        <Field label="Business name"><TextInput value={chrome.profile.name} disabled={disabled} onChange={(value) => profile({ name: value }, "name")} /></Field>
        <Field label="Phone"><TextInput value={chrome.profile.phone} disabled={disabled} onChange={(value) => profile({ phone: value }, "phone")} /></Field>
        <Field label="Email"><TextInput value={chrome.profile.email} disabled={disabled} onChange={(value) => profile({ email: value }, "email")} /></Field>
        <Field label="Address"><TextInput value={chrome.profile.address} disabled={disabled} onChange={(value) => profile({ address: value }, "address")} /></Field>
      </Group>
      <Group title="Analytics" defaultOpen={false}>
        <Field label="Analytics id" hint="Saved with the review. This editor does not add it to the live site.">
          <TextInput value={chrome.analyticsId} disabled={disabled} maxLength={40} onChange={(value) => props.commitText({ ...props.site, chrome: { ...chrome, analyticsId: value.replace(/[^A-Za-z0-9-]/g, "") } }, "analytics")} />
        </Field>
      </Group>
    </div>
  );
}

export function MediaPanel(props: {
  websiteId: string;
  media: MediaItem[];
  recent: string[];
  canEdit: boolean;
  progress: number | null;
  canPlace: boolean;
  onUpload: (file: File) => void;
  onUse: (item: MediaItem) => void;
  onDelete: (item: MediaItem) => void;
}) {
  const [query, setQuery] = useState("");
  const [dragging, setDragging] = useState(false);
  const items = props.media.filter((item) => `${item.alt} ${item.filename}`.toLowerCase().includes(query.toLowerCase()));
  const recentUsed = props.recent.map((filename) => props.media.find((item) => item.filename === filename)).filter((item): item is MediaItem => Boolean(item)).slice(0, 4);
  function tile(item: MediaItem) {
    return (
      <li key={item.filename} className="ed-media-tile">
        <button type="button" className="ed-media-thumb" disabled={!props.canPlace} onClick={() => props.onUse(item)} aria-label={props.canPlace ? `Use ${item.alt || item.filename}` : item.alt || item.filename}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/api/sites/${props.websiteId}/media?name=${encodeURIComponent(item.filename)}`} alt="" loading="lazy" />
        </button>
        <span className="ed-media-meta">
          <span className="truncate">{item.alt || item.filename}</span>
          <span className="ed-hint">{item.width && item.height ? `${item.width}×${item.height}` : "Image"}{item.bytes ? ` · ${Math.ceil(item.bytes / 1024)} KB` : ""}{item.usedBy?.length ? ` · Used on ${item.usedBy.length}` : ""}</span>
        </span>
        {props.canEdit ? (
          <button type="button" className="ed-icon is-small" aria-label={`Delete ${item.alt || item.filename}`} data-tip={item.usedBy?.length ? "In use" : "Delete"} disabled={Boolean(item.usedBy?.length)} onClick={() => props.onDelete(item)}>
            <Trash2 size={13} aria-hidden="true" />
          </button>
        ) : null}
      </li>
    );
  }
  return (
    <div className="ed-panel">
      <div className="ed-panel-head">
        <h2>Media</h2>
      </div>
      {props.canEdit ? (
        <label
          className={dragging ? "ed-drop is-over" : "ed-drop"}
          onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            const file = event.dataTransfer.files?.[0];
            if (file) props.onUpload(file);
          }}
        >
          <Upload size={16} aria-hidden="true" />
          <span>{props.progress !== null ? `Uploading ${props.progress}%` : "Drop an image here or choose a file"}</span>
          <span className="ed-hint">PNG, JPEG, WebP, or SVG</span>
          <input className="sr-only" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={(event) => { const file = event.target.files?.[0]; if (file) props.onUpload(file); event.target.value = ""; }} />
        </label>
      ) : null}
      {props.progress !== null ? <progress className="ed-progress" max={100} value={props.progress} aria-label="Upload progress" /> : null}
      <label className="ed-search">
        <Search size={14} aria-hidden="true" />
        <input placeholder="Search images" aria-label="Search images" value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!props.canPlace && props.media.length ? <p className="ed-hint ed-pad">Select an image on the page, then click a picture here to swap it in.</p> : null}
      {recentUsed.length && !query ? (
        <Group title="Recently used">
          <ul className="ed-media-list">{recentUsed.map(tile)}</ul>
        </Group>
      ) : null}
      <Group title={`All images (${items.length})`}>
        {items.length ? <ul className="ed-media-list">{items.map(tile)}</ul> : <Empty title={props.media.length ? "No images match" : "No images yet"}>{props.media.length ? "Try another word." : "Upload a picture to use it anywhere on the site."}</Empty>}
      </Group>
    </div>
  );
}

export const VIEWPORT_LABEL: Record<Viewport, string> = { desktop: "Desktop", tablet: "Tablet", mobile: "Phone" };
