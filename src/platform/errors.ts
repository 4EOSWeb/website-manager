export const platformErrorCodes = [
  "adapter_not_found",
  "adapter_invalid",
  "capability_missing",
  "document_invalid",
  "node_not_found",
  "parent_rejected",
  "locked",
  "migration_failed",
] as const;

export type PlatformErrorCode = (typeof platformErrorCodes)[number];

export type PlatformError = {
  code: PlatformErrorCode;
  message: string;
};

const defaultMessages: Record<PlatformErrorCode, string> = {
  adapter_not_found: "No adapter is registered for this site.",
  adapter_invalid: "The adapter is missing a required field.",
  capability_missing: "This site does not include that feature.",
  document_invalid: "The page document is not valid.",
  node_not_found: "That item is not on the page.",
  parent_rejected: "That item cannot be placed there.",
  locked: "This item is locked.",
  migration_failed: "The document could not be converted.",
};

export function platformError(code: PlatformErrorCode, message = defaultMessages[code]): PlatformError {
  return { code, message };
}

export function adapterNotFound(message?: string): PlatformError {
  return platformError("adapter_not_found", message);
}

export function adapterInvalid(message?: string): PlatformError {
  return platformError("adapter_invalid", message);
}

export function capabilityMissing(message?: string): PlatformError {
  return platformError("capability_missing", message);
}

export function documentInvalid(message?: string): PlatformError {
  return platformError("document_invalid", message);
}

export function nodeNotFound(message?: string): PlatformError {
  return platformError("node_not_found", message);
}

export function parentRejected(message?: string): PlatformError {
  return platformError("parent_rejected", message);
}

export function lockedError(message?: string): PlatformError {
  return platformError("locked", message);
}

export function migrationFailed(message?: string): PlatformError {
  return platformError("migration_failed", message);
}
