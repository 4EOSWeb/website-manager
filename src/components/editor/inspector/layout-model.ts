import type { Section, SiteDraft } from "@/lib/content-schema";
import { switchLayout, type LayoutSettings } from "@/platform/document/layout";

export const layoutModes = ["Flow", "Stack", "Grid", "Canvas"] as const;

export type LayoutModeName = (typeof layoutModes)[number];

export type LayoutNode = {
  id: string;
  componentId: string;
  metadata: Record<string, unknown>;
  props: Record<string, unknown>;
  layout?: LayoutSettings;
  allowLayoutConversion?: boolean;
};

/** Conversion stays available unless a definition turns it off. */
export function layoutConversionAllowed(definition: { allowLayoutConversion?: boolean } | null | undefined): boolean {
  return definition?.allowLayoutConversion !== false;
}

export function componentDefinitions(adapter: unknown): { id?: string; allowLayoutConversion?: boolean }[] {
  if (!adapter || typeof adapter !== "object") return [];
  const components = (adapter as { components?: { components?: unknown } }).components?.components;
  if (!Array.isArray(components)) return [];
  return components.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as { id?: unknown; allowLayoutConversion?: unknown };
    return [{
      id: typeof row.id === "string" ? row.id : undefined,
      allowLayoutConversion: typeof row.allowLayoutConversion === "boolean" ? row.allowLayoutConversion : undefined,
    }];
  });
}

/** A registered flag wins. A generic container with no flag can convert. */
export function definitionAllowsLayout(
  definitions: readonly { id?: string; allowLayoutConversion?: boolean }[] | undefined,
  componentId: string,
  nodeFlag?: boolean,
): boolean {
  const found = definitions?.find((item) => item.id === componentId);
  if (found) return layoutConversionAllowed(found);
  return nodeFlag !== false;
}

export function layoutModeName(layout: { mode?: string; display?: string } | undefined): LayoutModeName | "" {
  if (!layout) return "";
  if (layout.mode === "flow") return "Flow";
  if (layout.mode === "canvas") return "Canvas";
  if (layout.mode === "layout" && layout.display === "flex") return "Stack";
  if (layout.mode === "layout" && layout.display === "grid") return "Grid";
  return "";
}

export function layoutPreset(mode: LayoutModeName): LayoutSettings {
  if (mode === "Flow") return { mode: "flow", direction: "vertical", gap: 16 };
  if (mode === "Stack") return { mode: "layout", display: "flex", direction: "column", gap: 16, align: "stretch", justify: "start", wrap: false };
  if (mode === "Grid") return { mode: "layout", display: "grid", columns: 2, gap: 16, align: "stretch" };
  return { mode: "canvas", snap: 4, showGrid: false };
}

export function layoutSettingKeys(mode: LayoutModeName): string[] {
  if (mode === "Stack") return ["direction", "gap", "align", "justify", "wrap"];
  if (mode === "Grid") return ["columns", "gap", "align"];
  if (mode === "Flow") return ["direction", "gap"];
  return ["snap", "showGrid"];
}

/** A different choice waits for confirm. The same choice does not. */
export function pendingLayoutMode(current: LayoutModeName, requested: string): LayoutModeName | null {
  if (!layoutModes.includes(requested as LayoutModeName) || requested === current) return null;
  return requested as LayoutModeName;
}

/** Confirm stores the current settings on `previous` and switches mode. */
export function confirmLayoutMode(node: LayoutNode, mode: LayoutModeName): LayoutNode {
  return switchLayout(node, layoutPreset(mode));
}

export function writeLayoutSetting<T extends { layout?: LayoutSettings }>(node: T, key: string, value: string | number | boolean): T {
  if (!node.layout) return node;
  return { ...node, layout: { ...node.layout, [key]: value } as LayoutSettings };
}

/** Restores the layout that was current before the last confirmed switch. */
export function restorePreviousLayout<T extends { layout?: LayoutSettings }>(node: T): T {
  const previous = node.layout && "previous" in node.layout ? node.layout.previous : undefined;
  if (!previous) return node;
  return { ...node, layout: previous };
}

function sectionNameOf(section: Section): string {
  if ("editorName" in section && section.editorName) return section.editorName;
  if ("name" in section && section.name) return section.name;
  return "Section";
}

export function sectionForLayoutMode(section: Section, mode: LayoutModeName): Section {
  if (section.type !== "flow" && section.type !== "freeform") return section;
  const chrome = {
    ...(section.anchor ? { anchor: section.anchor } : {}),
    ...(section.hideOn ? { hideOn: section.hideOn } : {}),
    ...(section.style ? { style: section.style } : {}),
  };
  if (mode === "Canvas") {
    if (section.type === "freeform") return section;
    return { id: section.id, type: "freeform", hidden: section.hidden, editorName: section.editorName, name: sectionNameOf(section), items: [], ...chrome };
  }
  const layout = mode === "Grid" ? "grid" : mode === "Flow" ? "fluid" : "stack";
  if (section.type === "flow") return { ...section, layout };
  return { id: section.id, type: "flow", hidden: section.hidden, editorName: section.name || layout, layout, blocks: [], ...chrome };
}

export function applySectionLayout(site: SiteDraft, route: string, sectionId: string, mode: LayoutModeName): SiteDraft {
  return {
    ...site,
    pages: site.pages.map((page) => {
      if (page.route !== route) return page;
      return { ...page, sections: page.sections.map((section) => (section.id === sectionId ? sectionForLayoutMode(section, mode) : section)) };
    }),
  };
}
