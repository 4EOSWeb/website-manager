import type { BlogDraft, PageDocument, SiteDraft } from "@/lib/content-schema";

export type MediaItem = {
  src: string;
  alt: string;
  filename: string;
  bytes?: number;
  width?: number | null;
  height?: number | null;
  usedBy?: string[];
};

export type Publication = { status: string; summary: string; reviewUrl: string | null };

export type Selection = {
  sectionId: string;
  itemId: string;
  itemIds: string[];
  overlay: boolean;
  locked: boolean;
  chrome: "" | "header" | "footer";
  navRoute: string;
  kind: string;
};

export type Snapshot = { site: SiteDraft; posts: BlogDraft[] };

export type Viewport = "desktop" | "tablet" | "mobile";

export type SaveState = "saved" | "saving" | "pending" | "error";

export type RailPanel = "add" | "pages" | "layers" | "design" | "media";

export const emptySelection: Selection = { sectionId: "", itemId: "", itemIds: [], overlay: false, locked: false, chrome: "", navRoute: "", kind: "" };

export const VIEWPORTS: { id: Viewport; label: string; width: number }[] = [
  { id: "desktop", label: "Desktop", width: 1280 },
  { id: "tablet", label: "Tablet", width: 768 },
  { id: "mobile", label: "Phone", width: 390 },
];

export type EditorApi = {
  websiteId: string;
  site: SiteDraft;
  path: string;
  page?: PageDocument;
  canEdit: boolean;
  viewport: Viewport;
  selection: Selection;
  commit: (next: SiteDraft, reload: boolean) => void;
  commitText: (next: SiteDraft, key: string, reload?: boolean) => void;
  notify: (message: string, tone?: "info" | "error") => void;
  selectNode: (sectionId: string, itemId?: string) => void;
  openPicker: () => void;
  openCrop: () => void;
};
