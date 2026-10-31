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
