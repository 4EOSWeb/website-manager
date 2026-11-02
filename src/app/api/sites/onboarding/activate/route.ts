import { authzResponse, requireActor } from "@/lib/authorize";
import { activateWebsite } from "@/lib/onboarding-activate";
import { lookupRepositoryAccess } from "@/lib/onboarding-github";
import { prisma } from "@/lib/prisma";
import { canConnectWebsite } from "@/lib/roles";
import { siteDraftFromAdapter } from "@/lib/adapter-draft";
import { editorAdapterView } from "@/platform/editor-adapter";
import { activationDecision } from "@/platform/onboarding/activate";
import { validateAdapterFile } from "@/platform/onboarding/validate-adapter";
import { assembleReport } from "@/app/sites/new/assemble";
import { siteIdPattern } from "@/app/sites/new/site-id";

export async function POST(request: Request) {
  try {
    const actor = await requireActor();
    const memberships = await prisma.websiteMembership.findMany({
      where: { userId: actor.user.id },
      select: { role: true },
    });
    if (!canConnectWebsite(actor.platformRole, memberships.map((membership) => membership.role))) {
      return Response.json({ message: "You cannot connect a website." }, { status: 403 });
    }
    const body = await request.json().catch(() => null);
    const websiteId = body && typeof body.id === "string" ? body.id.trim() : "";
    const name = body && typeof body.name === "string" ? body.name.trim() : "";
    const draft = {
      owner: typeof body?.owner === "string" ? body.owner : "",
      repository: typeof body?.repository === "string" ? body.repository : "",
      branch: typeof body?.branch === "string" ? body.branch : "",
      adapterPath: typeof body?.adapterPath === "string" ? body.adapterPath : "",
      contentPath: typeof body?.contentPath === "string" ? body.contentPath : "",
      mediaPath: typeof body?.mediaPath === "string" ? body.mediaPath : "",
      themeSource: typeof body?.themeSource === "string" ? body.themeSource : "",
      navigationSource: typeof body?.navigationSource === "string" ? body.navigationSource : "",
    };
    if (!siteIdPattern.test(websiteId) || !name) {
      return Response.json({ message: "Fix the failed checks before connecting this website." }, { status: 400 });
    }
    const existing = await prisma.website.findUnique({ where: { id: websiteId }, select: { id: true } });
    if (existing) return Response.json({ message: "That id is already used." }, { status: 400 });
    const sections = await assembleReport(draft, {
      root: process.cwd(),
      lookup: lookupRepositoryAccess,
      listen: async () => false,
      audience: actor.platformRole === "SUPER_ADMIN" ? "super-admin" : "client-admin",
    });
    const decision = activationDecision(sections);
    if (!decision.ok) return Response.json({ message: decision.message }, { status: decision.status });
    const parsed = await validateAdapterFile(process.cwd(), draft.adapterPath);
    if (!parsed.ok) return Response.json({ message: "Fix the failed checks before connecting this website." }, { status: 400 });
    const view = editorAdapterView(parsed.adapter);
    if (!view) return Response.json({ message: "Fix the failed checks before connecting this website." }, { status: 400 });
    const created = await activateWebsite({
      actorId: actor.user.id,
      websiteId,
      name,
      productionUrl: parsed.adapter.site.productionUrl,
      owner: draft.owner.trim(),
      repository: draft.repository.trim(),
      branch: draft.branch.trim() || "main",
      sections,
      draftData: siteDraftFromAdapter(view, name),
    });
    if (!created.ok) return Response.json({ message: created.message }, { status: created.status });
    return Response.json({ websiteId: created.websiteId });
  } catch (error) {
    return authzResponse(error);
  }
}
