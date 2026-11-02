import type { AdapterContract } from "../adapter";
import { workspacePath } from "../adapter/serialize";
import type { SiteContext } from "../context";
import { validateDocument } from "../document/document";
import { blankCanvasPage } from "../templates/blank-canvas";

/**
 * Round-trips a blank canvas through the adapter serializer.
 * Adapters do not define a separate JSON parse hook, so the document parser reads the JSON back.
 * A path containing `..` fails. Nothing is written to a site draft.
 */
export function validateOnboardingSerialization(adapter: Pick<AdapterContract, "serialize" | "site">, document: unknown = blankCanvasPage()) {
  const context: SiteContext = {
    clientId: adapter.site.id,
    websiteId: adapter.site.id,
    repository: `${adapter.site.repository.owner}/${adapter.site.repository.name}`,
    branch: adapter.site.defaultBranch,
    actorId: "onboarding",
  };
  const serialized = adapter.serialize(document, context);
  if (!serialized.ok) return { ok: false as const, problem: serialized.error.message };
  for (const file of serialized.value) {
    if (!workspacePath(file.path).ok || file.path.split(/[\\/]/).includes("..")) {
      return { ok: false as const, problem: "Use a path inside the workspace." };
    }
    if (!file.path.endsWith(".json")) continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(file.contents);
    } catch {
      return { ok: false as const, problem: "The serialized draft could not be read." };
    }
    const again = validateDocument(parsed);
    if (!again.ok) return { ok: false as const, problem: again.error.message };
  }
  return { ok: true as const };
}
