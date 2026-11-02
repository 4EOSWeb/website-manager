import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import type { ValidateDocumentHook } from "../adapter/validate-hook";
import type { SiteContext } from "../context";
import { validateDocument } from "../document/document";
import { backupDraft } from "./backup";
import { draftChecksum } from "./checksum";
import { assembleDraft, type AssembleAdapter } from "./assemble";

type DraftDb = Pick<Prisma.TransactionClient, "workspaceDraft" | "draftBackup">;

export type DryRunDraft = {
  id: string;
  ok: boolean;
  checksum: string;
};

export type DryRunFile = {
  websiteId: string;
  drafts: DryRunDraft[];
};

export type ExecuteDraftResult = {
  id: string;
  status: "stored" | "unchanged" | "refused";
  backupId?: string;
  reason?: string;
};

export type ExecuteResult = {
  ok: boolean;
  refused: boolean;
  drafts: ExecuteDraftResult[];
};

function refusal(rows: { id: string }[], reason: string): ExecuteResult {
  return { ok: false, refused: true, drafts: rows.map((row) => ({ id: row.id, status: "refused", reason })) };
}

/**
 * Stores a visual document beside each draft whose dry-run checksum still matches.
 * `draft_data` is not replaced. A failed row is left unchanged.
 */
export async function executeMigration(input: {
  websiteId: string;
  dryRun: DryRunFile;
  rows: { id: string; draftData: unknown }[];
  adapter: AssembleAdapter;
  hook: ValidateDocumentHook;
  context: SiteContext;
  db?: DraftDb | PrismaClient;
}): Promise<ExecuteResult> {
  const db = input.db ?? (await import("@/lib/prisma")).prisma;
  if (input.dryRun.websiteId !== input.websiteId) return refusal(input.rows, "The dry-run is for a different site.");
  const byId = new Map(input.dryRun.drafts.map((draft) => [draft.id, draft]));
  if (input.rows.length === 0 || input.rows.some((row) => !byId.has(row.id)) || byId.size !== input.rows.length) {
    return refusal(input.rows, "The dry-run does not list these drafts.");
  }
  if (input.rows.some((row) => byId.get(row.id)?.checksum !== draftChecksum(row.draftData))) {
    return refusal(input.rows, "The draft changed after the dry-run.");
  }
  const drafts: ExecuteDraftResult[] = [];
  for (const row of input.rows) {
    const prior = byId.get(row.id)!;
    if (!prior.ok) {
      drafts.push({ id: row.id, status: "unchanged", reason: "The dry-run did not succeed." });
      continue;
    }
    const report = assembleDraft(row.draftData, input.adapter, input.hook, input.context);
    const parsed = report.ok ? validateDocument(report.document) : null;
    if (!report.ok || !parsed?.ok) {
      drafts.push({ id: row.id, status: "unchanged", reason: "The document could not be converted." });
      continue;
    }
    const backupId = await backupDraft(row.id, db);
    await db.workspaceDraft.update({
      where: { id: row.id },
      data: { visualDocument: report.document as Prisma.InputJsonValue },
    });
    drafts.push({ id: row.id, status: "stored", backupId });
  }
  return { ok: drafts.every((draft) => draft.status === "stored"), refused: false, drafts };
}
