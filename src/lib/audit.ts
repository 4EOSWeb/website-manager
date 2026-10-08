import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

type AuditInput = {
  websiteId?: string | null;
  userId?: string | null;
  action: string;
  target: string;
  metadata?: Record<string, unknown>;
};

export async function recordAudit(input: AuditInput) {
  await prisma.auditEvent.create({
    data: {
      websiteId: input.websiteId ?? null,
      userId: input.userId ?? null,
      action: input.action,
      target: input.target,
      metadata: (input.metadata as Prisma.InputJsonValue | undefined) ?? undefined,
    },
  });
}
