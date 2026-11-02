import { authzResponse, requireActor } from "@/lib/authorize";
import { lookupRepositoryAccess } from "@/lib/onboarding-github";
import { prisma } from "@/lib/prisma";
import { canConnectWebsite } from "@/lib/roles";
import { connectionResponse, validateConnection } from "@/platform/onboarding/validate-connection";

export async function POST(request: Request) {
  try {
    const actor = await requireActor();
    const memberships = await prisma.websiteMembership.findMany({
      where: { userId: actor.user.id },
      select: { role: true },
    });
    const allowed = canConnectWebsite(actor.platformRole, memberships.map((membership) => membership.role));
    const body = await request.json().catch(() => null);
    const owner = body && typeof body === "object" && "owner" in body && typeof body.owner === "string" ? body.owner : "";
    const repository = body && typeof body === "object" && "repository" in body && typeof body.repository === "string" ? body.repository : "";
    const result = allowed
      ? await validateConnection({ owner, repository }, lookupRepositoryAccess)
      : { ok: false as const, problem: "You cannot connect a website." };
    const response = connectionResponse(allowed, result);
    return Response.json(response.body, { status: response.status });
  } catch (error) {
    return authzResponse(error);
  }
}
