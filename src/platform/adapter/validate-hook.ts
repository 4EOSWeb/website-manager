import type { SiteContext } from "../context";
import { documentInvalid } from "../errors";
import { err, ok, type Result } from "../result";

export type DocumentWarning = {
  path: string;
  message: string;
};

export type DocumentHookReport = {
  warnings: DocumentWarning[];
};

export type ValidateDocumentHook = (
  document: unknown,
  context: SiteContext,
) => Result<DocumentHookReport>;

/** Adapters replace this when they need extra document checks. */
export function defaultValidateDocumentHook(
  _document: unknown,
  _context: SiteContext,
): Result<DocumentHookReport> {
  return ok({ warnings: [] });
}

export function documentHookError(message?: string): Result<DocumentHookReport> {
  return err(documentInvalid(message));
}
