import { defaultPageCapabilities, resolvePageCapabilities, type PageCapabilities } from "@/platform/adapter/page-capabilities";
import type { AdapterLevel } from "@/platform/adapter/level";

function levelOf(adapter: unknown): AdapterLevel {
  if (adapter && typeof adapter === "object" && (adapter as { level?: unknown }).level === 1) return 1;
  return 2;
}

/** Adapter flags, with a locked page treated as provider-managed. Routes are not listed here. */
export function pageCapabilityFlags(adapter: unknown, page: { locked?: boolean; editHeader?: boolean; editBody?: boolean; editSidebar?: boolean; editCta?: boolean }): PageCapabilities {
  const record = adapter && typeof adapter === "object" ? (adapter as { pageCapabilities?: unknown }) : {};
  const resolved = resolvePageCapabilities(levelOf(adapter), record.pageCapabilities ?? {});
  const flags = resolved.ok ? resolved.value : defaultPageCapabilities(levelOf(adapter));
  const withHeader = page.editHeader === true ? { ...flags, editHeader: true } : page.editHeader === false ? { ...flags, editHeader: false } : flags;
  const withBody = page.editBody === true ? { ...withHeader, editBody: true } : page.editBody === false ? { ...withHeader, editBody: false } : withHeader;
  const withSidebar = page.editSidebar === true ? { ...withBody, editSidebar: true } : page.editSidebar === false ? { ...withBody, editSidebar: false } : withBody;
  const withPage = page.editCta === true ? { ...withSidebar, editCta: true } : page.editCta === false ? { ...withSidebar, editCta: false } : withSidebar;
  if (page.locked !== true) return withPage;
  return { ...withPage, providerManaged: true, editBody: false, lockLayout: true, lockContent: true };
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

/** The menu toggle is shown only when the adapter allows navigation editing. */
export function navigationEditingEnabled(adapter: unknown): boolean {
  const capabilities = adapter && typeof adapter === "object" ? (adapter as { capabilities?: { supportsNavigationEditing?: unknown } }).capabilities : undefined;
  return capabilities?.supportsNavigationEditing === true;
}
