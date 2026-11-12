"use server";

import { requirePageActor } from "@/lib/authorize";
import { lookupRepositoryAccess } from "@/lib/onboarding-github";
import { prisma } from "@/lib/prisma";
import { canConnectWebsite } from "@/lib/roles";
import { previewDidNotRespond } from "@/platform/onboarding/validate-preview";
import { assembleReport, type OnboardingDraft } from "./assemble";
import { compatibilityReport } from "./report-model";

async function unreachablePreview() {
  return false;
}

export async function reviewSite(draft: OnboardingDraft) {
  const actor = await requirePageActor();
  const memberships = await prisma.websiteMembership.findMany({
    where: { userId: actor.user.id },
    select: { role: true },
  });
  if (!canConnectWebsite(actor.platformRole, memberships.map((membership) => membership.role))) {
    return compatibilityReport({
      connection: { ok: false, message: "You cannot connect a website." },
      adapter: { ok: false, message: "You cannot connect a website." },
      routes: { ok: false, message: "You cannot connect a website." },
      components: { ok: false, message: "You cannot connect a website." },
      preview: { ok: false, message: previewDidNotRespond },
      serialization: { ok: false, message: "You cannot connect a website." },
      build: { ok: false, message: "You cannot connect a website." },
    });
  }
  return assembleReport(draft, {
    root: process.cwd(),
    lookup: lookupRepositoryAccess,
    listen: unreachablePreview,
    audience: actor.platformRole === "SUPER_ADMIN" ? "super-admin" : "client-admin",
  });
}
