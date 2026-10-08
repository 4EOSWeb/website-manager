import { prisma } from "@/lib/prisma";
import { landingPath } from "@/lib/roles";
import type { User } from "@/generated/prisma/client";

export { landingPath };

export async function websitesFor(user: User) {
  if (user.platformRole === "SUPER_ADMIN") {
    return prisma.website.findMany({
      where: { editorStatus: "APPROVED" },
      orderBy: { name: "asc" },
    });
  }
  const memberships = await prisma.websiteMembership.findMany({
    where: { userId: user.id, website: { editorStatus: "APPROVED" } },
    include: { website: true },
    orderBy: { website: { name: "asc" } },
  });
  return memberships.map((membership) => membership.website);
}
