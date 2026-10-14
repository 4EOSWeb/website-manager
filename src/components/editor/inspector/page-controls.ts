import { defaultPageCapabilities, resolvePageCapabilities, type PageCapabilities } from "@/platform/adapter/page-capabilities";
import type { AdapterLevel } from "@/platform/adapter/level";

function levelOf(adapter: unknown): AdapterLevel {
  if (adapter && typeof adapter === "object" && (adapter as { level?: unknown }).level === 1) return 1;
  return 2;
}

/** Adapter flags, with a locked page treated as provider-managed. Routes are not listed here. */
export function pageCapabilityFlags(adapter: unknown, page: { locked?: boolean }): PageCapabilities {
  const record = adapter && typeof adapter === "object" ? (adapter as { pageCapabilities?: unknown }) : {};
  const resolved = resolvePageCapabilities(levelOf(adapter), record.pageCapabilities ?? {});
  const flags = resolved.ok ? resolved.value : defaultPageCapabilities(levelOf(adapter));
  if (page.locked !== true) return flags;
  return { ...flags, providerManaged: true, editBody: false, lockLayout: true, lockContent: true };
}

export function showMetadata(flags: PageCapabilities): boolean {
  return flags.editMetadata;
}

export function showBody(flags: PageCapabilities): boolean {
  return flags.editBody && !flags.providerManaged;
}

export function showHeaderToggle(flags: PageCapabilities): boolean {
  return flags.editHeader === true;
}
