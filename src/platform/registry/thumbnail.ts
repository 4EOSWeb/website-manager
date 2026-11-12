import { adapterInvalid, siteMismatch } from "../errors";
import { err, ok, type Result } from "../result";
import type { SiteContext } from "../context";
import type { ComponentDefinition } from "./types";

const placeholders = new Set(["generic:text", "generic:button", "generic:image", "generic:layout"]);

function otherWebsiteId(thumbnail: string, websiteId: string): boolean {
  return thumbnail.split(/[\\/]/).some((part) => part.startsWith("web_") && part !== websiteId);
}

/**
 * Resolves a thumbnail to a path under this website’s media, or a generic placeholder.
 * Absolute URLs and other website ids are rejected.
 */
export function thumbnailSrc(
  definition: Pick<ComponentDefinition, "thumbnail" | "category">,
  context: Pick<SiteContext, "websiteId">,
): Result<string> {
  const thumbnail = definition.thumbnail;
  if (thumbnail.includes("://") || thumbnail.startsWith("//")) {
    return err(adapterInvalid("Use a site media path or a generic placeholder.", "components"));
  }
  if (otherWebsiteId(thumbnail, context.websiteId)) return err(siteMismatch());
  if (thumbnail.startsWith("generic:")) {
    if (!placeholders.has(thumbnail)) return err(adapterInvalid("Use a known placeholder.", "components"));
    return ok(thumbnail);
  }
  if (thumbnail === "none") {
    const fallback = `generic:${definition.category}`;
    return ok(placeholders.has(fallback) ? fallback : "generic:layout");
  }
  const relative = thumbnail.replace(/^(\.\/|\/)+/, "");
  const prefix = `sites/${context.websiteId}/media/`;
  if (relative.startsWith(prefix)) return ok(relative);
  return ok(`${prefix}${relative}`);
}
