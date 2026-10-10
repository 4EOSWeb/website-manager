import type { ZodType } from "zod";

/**
 * A component definition. The site bundle resolves `renderer.exportName`.
 * This module does not import React or a site package.
 * `thumbnail` is a relative asset id or "none", never a URL.
 */

export type RegistryThumbnail = "none" | string;

export type RegistryRenderer = {
  exportName: string;
};

export type RegistryLock = {
  locked: boolean;
  lockId?: string;
};

export type ComponentDefinition = {
  id: string;
  name: string;
  category: string;
  thumbnail: RegistryThumbnail;
  defaultProps: Record<string, unknown>;
  propsSchemaId: string;
  propsSchema?: ZodType;
  inspector: string;
  acceptsChildren: boolean;
  allowedParents: readonly string[];
  capabilities: Readonly<Record<string, boolean>>;
  locking: RegistryLock;
  renderer: RegistryRenderer;
};
