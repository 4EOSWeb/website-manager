import { AuthzError, authzResponse, requireActor } from "@/lib/authorize";
import { recordAudit } from "@/lib/audit";
import { devAuthEnabled } from "@/lib/dev-auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const actor = await requireActor();
    const session = await prisma.editorSession.findUnique({ where: { id: actor.sessionId } });
    if (!devAuthEnabled() || session?.userAgent !== "dev-login") {
      throw new AuthzError(403, "Confirm your identity with Microsoft before continuing.");
    }
    await prisma.editorSession.update({
      where: { id: actor.sessionId },
      data: { stepUpAt: new Date() },
    });
    await recordAudit({
      userId: actor.user.id,
      action: "auth.step_up",
      target: actor.user.email,
      metadata: { mode: "development" },
    });
    return Response.json({ message: "Identity confirmed for the next 10 minutes." });
  } catch (error) {
    return authzResponse(error);
  }
}
