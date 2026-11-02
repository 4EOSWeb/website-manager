import type { SiteDraft } from "@/lib/content-schema";
import { canUnlock, type ComponentLockPolicy } from "@/platform/registry/locking";
import { unlockFlowBlock, unlockVisualNode } from "@/components/editor/layers/lock-node";

export const LAYER_UNLOCK_REASON = "Only an administrator can unlock this.";

/** A paragraph locked from the row can be unlocked by an editor or an administrator. */
export const genericParagraphLock: ComponentLockPolicy = {
  defaultLocked: false,
  unlockRoles: ["administrator", "editor"],
};

/** The registry role named by an account label such as "4EOS administrator" or "Editor". */
export function layerRole(label: string): string {
  const value = label.trim().toLowerCase();
  if (value.includes("administrator")) return "administrator";
  if (value === "editor" || value.endsWith(" editor")) return "editor";
  return value;
}

/** Logo, header, and footer follow the administrator-only policy. Other rows use the paragraph policy. */
export function policyForLayer(kind: string): ComponentLockPolicy {
  if (kind === "brand-mark" || kind === "logo" || kind === "header" || kind === "footer") {
    return { defaultLocked: true, unlockRoles: ["administrator"] };
  }
  return genericParagraphLock;
}

export function layerUnlockAllowed(kind: string, role: string): boolean {
  return canUnlock(policyForLayer(kind), role);
}

/**
 * Clears a lock when the role is listed for that component.
 * A refused role leaves the document unchanged.
 */
export function applyLayerUnlock(
  site: SiteDraft,
  route: string,
  sectionId: string,
  blockId: string,
  kind: string,
  role: string,
  document: unknown,
): { ok: true; site: SiteDraft; visual: unknown | null } | { ok: false; reason: string } {
  if (!canUnlock(policyForLayer(kind), role)) return { ok: false, reason: LAYER_UNLOCK_REASON };
  return { ok: true, site: unlockFlowBlock(site, route, sectionId, blockId), visual: unlockVisualNode(document, blockId) };
}
