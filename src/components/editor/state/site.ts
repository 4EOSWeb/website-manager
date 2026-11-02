import type { SiteContext } from "@/platform/context";

export type EditorSiteState = {
  site: SiteContext;
  pageId: string | null;
  selection: string[];
};

export function createSiteState(site: SiteContext, pageId: string | null = null, selection: string[] = []): EditorSiteState {
  return { site, pageId, selection };
}

/** A different website id drops the previous page, selection, and site identity. */
export function resetForSite(state: EditorSiteState, nextId: string): EditorSiteState {
  if (state.site.websiteId === nextId) return state;
  return {
    site: {
      clientId: "",
      websiteId: nextId,
      repository: "",
      branch: "",
      actorId: state.site.actorId,
    },
    pageId: null,
    selection: [],
  };
}

/** The open route wins. A stored context for a different website cannot be used. */
export function activeSiteContext(stored: SiteContext, routeWebsiteId: string): SiteContext {
  if (stored.websiteId === routeWebsiteId) return stored;
  return { clientId: "", websiteId: routeWebsiteId, repository: "", branch: "", actorId: stored.actorId };
}

export function draftForSite<T extends { websiteId: string }>(routeWebsiteId: string, row: T | null): T | null {
  if (!row || row.websiteId !== routeWebsiteId) return null;
  return row;
}
