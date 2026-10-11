/**
 * Document checks for this site. The draft save route does not call this yet.
 * A level 2 visual document needs a root on every page. No section kind is required.
 */
import type { ValidateDocumentHook } from "../../src/platform/adapter/validate-hook.ts";
import { ok } from "../../src/platform/result.ts";
import { quantumAgeMetadata } from "./metadata";

function claimsThisSite(document: unknown, websiteId: string) {
  if (websiteId === quantumAgeMetadata.id) return true;
  if (!document || typeof document !== "object") return false;
  const record = document as { websiteId?: unknown; siteId?: unknown };
  return record.websiteId === quantumAgeMetadata.id || record.siteId === quantumAgeMetadata.id;
}

export const validateDocumentHook: ValidateDocumentHook = (document, context) => {
  if (!claimsThisSite(document, context.websiteId)) return ok({ warnings: [] });
  const warnings: { path: string; message: string }[] = [];
  const record = document && typeof document === "object" ? (document as { version?: unknown; pages?: unknown }) : null;
  if (record?.version === 1) {
    const pages = Array.isArray(record.pages) ? record.pages : [];
    if (pages.length === 0) warnings.push({ path: "pages", message: "This document needs a root." });
    pages.forEach((page, index) => {
      const root = page && typeof page === "object" ? (page as { root?: unknown }).root : undefined;
      if (root == null) warnings.push({ path: `pages.${index}.root`, message: "This page needs a root." });
    });
  }
  return ok({ warnings });
};
