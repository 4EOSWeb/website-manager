"use server";

import { requirePageActor } from "@/lib/authorize";
import { prisma } from "@/lib/prisma";
import { canConnectWebsite } from "@/lib/roles";
import { siteIdPattern } from "./site-id";

export async function websiteIdExists(id: string): Promise<boolean> {
  const actor = await requirePageActor();
  const memberships = await prisma.websiteMembership.findMany({
    where: { userId: actor.user.id },
    select: { role: true },
  });
  if (!canConnectWebsite(actor.platformRole, memberships.map((membership) => membership.role))) return false;
  if (!siteIdPattern.test(id)) return false;
  const existing = await prisma.website.findUnique({ where: { id }, select: { id: true } });
  return Boolean(existing);
}
