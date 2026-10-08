import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { recordAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { redact } from "@/lib/redact";
import { IDLE_TIMEOUT_MS, STEP_UP_WINDOW_MS, can, needsStepUp, permissionsFor, type Action } from "@/lib/roles";
import type { MembershipRole, PlatformRole, User, Website } from "@/generated/prisma/client";

export class AuthzError extends Error {
  constructor(
    public status: 401 | 403 | 404,
    message: string,
  ) {
    super(message);
  }
}

export type Actor = {
  user: User;
  sessionId: string;
  platformRole: PlatformRole | null;
  membershipRole: MembershipRole | null;
  website: Website | null;
};

export async function requireActor(): Promise<Actor> {
  const session = await auth();
  if (!session?.user?.id || !session.sessionId) {
    throw new AuthzError(401, "Please sign in again.");
  }
  const [user, editorSession] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id } }),
    prisma.editorSession.findUnique({ where: { id: session.sessionId } }),
  ]);
  if (!user || user.status !== "ACTIVE" || !editorSession || editorSession.revokedAt || editorSession.userId !== user.id) {
    throw new AuthzError(401, "Please sign in again.");
  }
  if (Date.now() - editorSession.lastActivityAt.getTime() > IDLE_TIMEOUT_MS) {
    await prisma.editorSession.update({
      where: { id: editorSession.id },
      data: { revokedAt: new Date() },
    });
    await recordAudit({
      userId: user.id,
      action: "auth.idle_timeout",
      target: user.email,
    });
    throw new AuthzError(401, "You were signed out after a period of inactivity.");
  }
  await prisma.editorSession.update({
    where: { id: editorSession.id },
    data: { lastActivityAt: new Date() },
  });
  return {
    user,
    sessionId: editorSession.id,
    platformRole: user.platformRole,
    membershipRole: null,
    website: null,
  };
}

export async function authorize(websiteId: string, action: Action): Promise<Actor & { website: Website }> {
  const actor = await requireActor();
  const website = await prisma.website.findUnique({ where: { id: websiteId } });
  if (!website || website.editorStatus === "DISABLED") {
    await recordAudit({
      userId: actor.user.id,
      action: "authz.denied",
      target: websiteId,
      metadata: { reason: "missing", requested: action },
    });
    throw new AuthzError(404, "That website is not available.");
  }
  const membership = await prisma.websiteMembership.findUnique({
    where: { userId_websiteId: { userId: actor.user.id, websiteId } },
  });
  const platformRole = actor.user.platformRole;
  const allowedByPlatform = platformRole === "SUPER_ADMIN";
  if (!membership && !allowedByPlatform) {
    await recordAudit({
      userId: actor.user.id,
      websiteId: website.id,
      action: "authz.denied",
      target: websiteId,
      metadata: { reason: "no-membership", requested: action },
    });
    throw new AuthzError(404, "That website is not available.");
  }
  if (website.editorStatus !== "APPROVED" && platformRole !== "SUPER_ADMIN") {
    await recordAudit({
      userId: actor.user.id,
      websiteId: website.id,
      action: "authz.denied",
      target: websiteId,
      metadata: { reason: "not-approved", requested: action },
    });
    throw new AuthzError(404, "That website is not available.");
  }
  const actions = permissionsFor(platformRole, membership?.role ?? null);
  if (!can(actions, action)) {
    await recordAudit({
      userId: actor.user.id,
      websiteId: website.id,
      action: "authz.denied",
      target: websiteId,
      metadata: { reason: "role", requested: action, role: membership?.role ?? platformRole },
    });
    throw new AuthzError(404, "That website is not available.");
  }
  if (needsStepUp(action)) {
    const session = await prisma.editorSession.findUnique({ where: { id: actor.sessionId } });
    const fresh = session?.stepUpAt && Date.now() - session.stepUpAt.getTime() < STEP_UP_WINDOW_MS;
    if (!fresh) {
      throw new AuthzError(403, "Please confirm your identity before doing that.");
    }
  }
  return { ...actor, membershipRole: membership?.role ?? null, website };
}

export async function requirePageActor() {
  try {
    return await requireActor();
  } catch (error) {
    if (error instanceof AuthzError && error.status === 401) redirect("/signin");
    throw error;
  }
}

export function authzResponse(error: unknown) {
  if (error instanceof AuthzError) {
    return Response.json({ message: error.message }, { status: error.status });
  }
  console.error(redact(error instanceof Error ? error.message : "Unknown error"));
  return Response.json({ message: "Something went wrong. Please try again." }, { status: 500 });
}
