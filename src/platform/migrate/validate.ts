import type { ValidateDocumentHook, DocumentWarning } from "../adapter/validate-hook";
import type { SiteContext } from "../context";
import { validateDocument, type VisualDocument } from "../document/document";
import { migrationFailed } from "../errors";
import { err, ok, type Result } from "../result";

export type MigratedValidation = {
  document: VisualDocument;
  warnings: DocumentWarning[];
};

/** Validates a converted document, then the adapter hook. Warnings stay on the report. */
export function validateMigrated(
  document: unknown,
  hook: ValidateDocumentHook,
  context: SiteContext,
): Result<MigratedValidation> {
  const parsed = validateDocument(document);
  if (!parsed.ok) return err(migrationFailed(parsed.error.message));
  const hooked = hook(parsed.value, context);
  if (!hooked.ok) return err(migrationFailed(hooked.error.message));
  return ok({ document: parsed.value, warnings: hooked.value.warnings });
}
