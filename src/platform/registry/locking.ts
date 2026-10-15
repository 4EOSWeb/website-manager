export type UnlockRole = "administrator" | "editor";

export type ComponentLockPolicy = {
  defaultLocked: boolean;
  unlockRoles: readonly UnlockRole[];
};

/** A role can unlock a component only when that role is listed. */
export function canUnlock(policy: Pick<ComponentLockPolicy, "unlockRoles">, role: string): boolean {
  return (policy.unlockRoles as readonly string[]).includes(role);
}

/** Default locks apply when a new instance is created. */
export function lockForNewInstance(policy: Pick<ComponentLockPolicy, "defaultLocked">): { locked: boolean } {
  return { locked: policy.defaultLocked };
}

/** Existing documents, including version 3 drafts, are returned unchanged. */
export function preserveExistingDocument<T>(document: T): T {
  return document;
}
