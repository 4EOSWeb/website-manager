/** Public platform entry. Later modules join here. */

export const platformVersion = 1;

export {
  adapterInvalid,
  adapterNotFound,
  capabilityMissing,
  documentInvalid,
  lockedError,
  migrationFailed,
  nodeNotFound,
  parentRejected,
  platformError,
  platformErrorCodes,
  type PlatformError,
  type PlatformErrorCode,
} from "./errors";
