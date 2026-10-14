import type { SiteDraft } from "@/lib/content-schema";

/** Shown while a picture has no description. Filling the alt text is what clears it. */
export function imageAltWarning(src: string, alt: string): string {
  return src.trim() && !alt.trim() ? "Describe the picture." : "";
}

/** Writes src on one flow image and leaves its alt, and every other section, unchanged. */
export function replaceImageSrc(site: SiteDraft, route: string, sectionId: string, blockId: string, src: string): SiteDraft {
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
            blocks: section.blocks.map((block) => (block.id === blockId ? { ...block, src } : block)),
          };
        }),
      };
    }),
  };
}
