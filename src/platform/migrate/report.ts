import { assertLocksPreserved, type LockOutput, type LockSource } from "./locks";
import { assertMediaPreserved } from "./media-refs";
import { assertRoutesPreserved } from "./routes";

export type UnmappedField = {
  path: string;
  key: string;
  reason: string;
};

/** Lists keys that were stored only under `metadata.unmapped`. */
export function unmappedReport(value: unknown, path = ""): UnmappedField[] {
  if (!value || typeof value !== "object") return [];
  const report: UnmappedField[] = [];
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const here = path ? `${path}.${key}` : key;
    if (key === "metadata" && child && typeof child === "object" && "unmapped" in child) {
      const unmapped = (child as { unmapped?: unknown }).unmapped;
      if (unmapped && typeof unmapped === "object") {
        for (const field of Object.keys(unmapped as Record<string, unknown>)) {
          report.push({ path: here, key: field, reason: "The field was not copied." });
        }
      }
    }
    if (key !== "unmapped") report.push(...unmappedReport(child, here));
  }
  return report;
}

/** An empty unmapped report succeeds only when media, routes, and locks also passed. */
export function conversionSucceeded(input: {
  output: unknown;
  beforeMedia: unknown;
  afterMedia: unknown;
  beforeRoutes: string[];
  afterRoutes: string[];
  beforeLocks: LockSource[];
  afterLocks: LockOutput[];
}) {
  const report = unmappedReport(input.output);
  const media = assertMediaPreserved(input.beforeMedia, input.afterMedia);
  const routes = assertRoutesPreserved(input.beforeRoutes, input.afterRoutes);
  const locks = assertLocksPreserved(input.beforeLocks, input.afterLocks);
  return { report, ok: report.length === 0 && media.ok && routes.ok && locks.ok };
}
