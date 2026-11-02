import { prisma } from "@/lib/prisma";

const pageIdPattern = /^[A-Za-z0-9_-]+$/;

export async function pagesForSite(websiteId: string) {
  return prisma.page.findMany({
    where: { websiteId },
    orderBy: { route: "asc" },
    select: { id: true, route: true, title: true },
  });
}

export async function pageForSite(websiteId: string, id: string) {
  if (!id || !pageIdPattern.test(id)) return null;
  return prisma.page.findFirst({
    where: { id, websiteId },
    select: { id: true, route: true, title: true },
  });
}

function pageIdsIn(payload: unknown) {
  if (!payload || typeof payload !== "object") return [];
  const record = payload as Record<string, unknown>;
  const ids: string[] = [];
  if (typeof record.pageId === "string") ids.push(record.pageId);
  const drafts = [record.draft, record.visualDocument, "draft" in record ? undefined : record];
  for (const draft of drafts) {
    if (!draft || typeof draft !== "object" || !Array.isArray((draft as { pages?: unknown }).pages)) continue;
    for (const page of (draft as { pages: unknown[] }).pages) {
      if (page && typeof page === "object" && typeof (page as { id?: unknown }).id === "string") ids.push((page as { id: string }).id);
    }
  }
  return [...new Set(ids)].filter((id) => pageIdPattern.test(id));
}

/** 404 when a draft write names a page that belongs to another site. Null means the ids are safe to save. */
export async function foreignDraftPageStatus(websiteId: string, payload: unknown): Promise<404 | null> {
  const ids = pageIdsIn(payload);
  if (ids.length === 0) return null;
  const foreign = await prisma.page.findFirst({
    where: { id: { in: ids }, NOT: { websiteId } },
    select: { id: true },
  });
  return foreign ? 404 : null;
}
