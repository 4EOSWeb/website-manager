import type { SiteDraft } from "@/lib/content-schema";

export const visibilityDevices = ["desktop", "tablet", "mobile"] as const;

export type VisibilityDevice = (typeof visibilityDevices)[number];

export type VisibilityState = {
  hidden: boolean;
  hideOn: VisibilityDevice[];
};

/**
 * One device changes hideOn only.
 * Choosing every device sets hidden and clears hideOn.
 * A hidden node is treated as hidden on every device, so clearing one device leaves the other two.
 */
export function writeHideOn(current: VisibilityState, device: VisibilityDevice, hidden: boolean): VisibilityState {
  const next = new Set(current.hidden ? visibilityDevices : current.hideOn);
  if (hidden) next.add(device);
  else next.delete(device);
  if (next.size === visibilityDevices.length) return { hidden: true, hideOn: [] };
  return { hidden: false, hideOn: visibilityDevices.filter((item) => next.has(item)) };
}

export function hiddenDevices(visibility: VisibilityState): VisibilityDevice[] {
  if (visibility.hidden) return [...visibilityDevices];
  return visibility.hideOn;
}

export function applyBlockVisibility(site: SiteDraft, route: string, sectionId: string, blockId: string, visibility: VisibilityState): SiteDraft {
  return {
    ...site,
    pages: site.pages.map((page) => {
      if (page.route !== route) return page;
      return {
        ...page,
        sections: page.sections.map((section) => {
          if (section.id !== sectionId || section.type !== "flow") return section;
          return {
            ...section,
            blocks: section.blocks.map((block) => (block.id === blockId ? { ...block, hidden: visibility.hidden, hideOn: visibility.hideOn } : block)),
          };
        }),
      };
    }),
  };
}
