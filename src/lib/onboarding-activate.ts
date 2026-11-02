import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { activationDecision } from "@/platform/onboarding/activate";
import { blankCanvasPage } from "@/platform/templates/blank-canvas";

export async function activateWebsite(input: {
  actorId: string;
  websiteId: string;
  name: string;
  productionUrl: string;
  owner: string;
  repository: string;
  branch: string;
  sections: readonly { status: "pass" | "fail" }[];
  draftData: Prisma.InputJsonValue;
}) {
  const decision = activationDecision(input.sections);
  if (!decision.ok) return decision;
  const visualDocument = blankCanvasPage({ title: input.name, route: "/" }) as Prisma.InputJsonValue;
  await prisma.$transaction(async (tx) => {
    await tx.client.create({
      data: { id: `client_${input.websiteId}`, name: input.name },
    });
    await tx.website.create({
      data: {
        id: input.websiteId,
        clientId: `client_${input.websiteId}`,
        name: input.name,
        productionUrl: input.productionUrl,
        githubOwner: input.owner,
        githubRepository: input.repository,
        defaultBranch: input.branch || "main",
        editorStatus: "APPROVED",
        manifest: {},
      },
    });
    await tx.websiteMembership.create({
      data: {
        id: `member_${input.websiteId}`,
        userId: input.actorId,
        websiteId: input.websiteId,
        role: "CLIENT_ADMIN",
      },
    });
    await tx.workspaceDraft.create({
      data: {
        id: `draft_${input.websiteId}`,
        websiteId: input.websiteId,
        userId: input.actorId,
        draftData: input.draftData,
        visualDocument,
      },
    });
  });
  return { ok: true as const, websiteId: input.websiteId };
}
