import { siteDraftSchema, zodFieldErrors, type SiteDraft } from "@/lib/content-schema";
import { formatAdapterError } from "@/platform/adapter/errors";
import { validateDocument } from "@/platform/document/document";
import { siteMismatch } from "@/platform/errors";

export type DraftPutBody =
  | { ok: true; site: SiteDraft; visualDocument?: unknown }
  | { ok: false; status: 400; message: string };

function mismatch(): DraftPutBody {
  return { ok: false, status: 400, message: formatAdapterError(siteMismatch()).message };
}

/** Reads a version 3 draft and an optional visual document. A version 3 body omits the visual document so a save cannot clear it. */
export function readDraftPut(routeWebsiteId: string, payload: unknown): DraftPutBody {
  if (!payload || typeof payload !== "object") return { ok: false, status: 400, message: "The draft could not be read." };
  const record = payload as Record<string, unknown>;
  const wrapped = "draft" in record || "websiteId" in record || "visualDocument" in record;
  if (wrapped && record.websiteId !== routeWebsiteId) return mismatch();
  const parsed = siteDraftSchema.safeParse(wrapped ? record.draft : payload);
  if (!parsed.success) return { ok: false, status: 400, message: zodFieldErrors(parsed.error) };
  if (!wrapped || !("visualDocument" in record) || record.visualDocument == null) return { ok: true, site: parsed.data };
  const visual = validateDocument(record.visualDocument);
  if (!visual.ok) return { ok: false, status: 400, message: formatAdapterError(visual.error).message };
  return { ok: true, site: parsed.data, visualDocument: visual.value };
}
