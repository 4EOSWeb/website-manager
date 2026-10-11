/** Temporary import of the version 3 schema. Remove this import in step 19.25. */
import { siteDraftSchema, type SiteDraft } from "@/lib/content-schema";

export type Version3Issue = {
  path: string;
  message: string;
};

export type ParseVersion3Result =
  | { ok: true; value: SiteDraft }
  | { ok: false; issues: Version3Issue[] };

/** Parses a version 3 draft. A failure returns the schema issues and does not convert the value. */
export function parseVersion3(value: unknown): ParseVersion3Result {
  const parsed = siteDraftSchema.safeParse(value);
  if (!parsed.success) {
    return {
      ok: false,
      issues: parsed.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    };
  }
  return { ok: true, value: parsed.data };
}
