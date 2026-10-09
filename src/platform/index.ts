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
  siteMismatch,
  parentRejected,
  platformError,
  platformErrorCodes,
  type PlatformError,
  type PlatformErrorCode,
} from "./errors";

export { err, ok, type Err, type Ok, type Result } from "./result";

export { createPlatformId, isPlatformId, type PlatformIdPrefix } from "./ids";

export { assertSameSite, type SiteContext } from "./context";

export { loadAdapter, type AdapterLoader } from "./adapter-loader";

export { validateAdapterIdentity, type AdapterIdentity } from "./adapter-validate";

export { discoverAdapters } from "./discover-adapters";

export { capabilityNames, hasCapability, type CapabilityFlags, type CapabilityName } from "./capabilities";

export {
  DOCUMENT_VERSION,
  assertUniqueIds,
  canvasBoxSchema,
  defaultCanvasStrategy,
  inheritedBreakpoints,
  layoutSchema,
  migrateDocument,
  migrations,
  nodeSchema,
  nodeTypes,
  pageSchema,
  resolveBreakpoint,
  resolveMissingBreakpoint,
  resolveReflow,
  resolveScale,
  switchLayout,
  validateDocument,
  visualDocumentSchema,
  type LayoutSettings,
  type MigrationStep,
  type NodeDocument,
  type NodeType,
  type PageDocumentV1,
  type ResponsiveStrategy,
  type VisualDocument,
  type VisualPage,
} from "./document";
