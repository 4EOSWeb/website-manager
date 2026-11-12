import { createHash, randomBytes } from "node:crypto";
import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

type DraftDb = Pick<Prisma.TransactionClient, "workspaceDraft" | "draftBackup">;

function checksum(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

/** Copies one draft into `draft_backups`. The source row is not updated. */
export async function backupDraft(draftId: string, db: DraftDb | PrismaClient = prisma): Promise<string> {
  const draft = await db.workspaceDraft.findUnique({ where: { id: draftId } });
  if (!draft) throw new Error("That draft was not found.");
  const stamp = checksum(draft.draftData);
  const since = new Date(Date.now() - 60 * 60 * 1000);
  const recent = await db.draftBackup.findMany({
    where: { sourceDraftId: draftId, createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
  });
  const existing = recent.find((row) => checksum(row.payload) === stamp);
  if (existing) return existing.id;
  const id = `bak_${randomBytes(6).toString("hex")}`;
  await db.draftBackup.create({
    data: {
      id,
      websiteId: draft.websiteId,
      sourceDraftId: draft.id,
      versionLabel: typeof (draft.draftData as { version?: unknown }).version === "number"
        ? String((draft.draftData as { version: number }).version)
        : "unknown",
      payload: draft.draftData as Prisma.InputJsonValue,
    },
  });
  return id;
}
