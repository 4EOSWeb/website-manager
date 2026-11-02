import type { AdapterContract } from "../adapter";
import { discoverStaticRoutes, type DiscoveredRoute } from "../adapter/routes";
import type { SiteContext } from "../context";

export type OnboardingRoutes =
  | { ok: true; routes: DiscoveredRoute[]; warning?: string }
  | { ok: false; problem: string };

/**
 * Lists routes from a parsed adapter.
 * An empty list fails level 2 and warns for level 1.
 * This does not write Page rows.
 */
export async function discoverOnboardingRoutes(adapter: Pick<AdapterContract, "level" | "routes" | "site">): Promise<OnboardingRoutes> {
  if (adapter.routes.length === 0) {
    if (adapter.level === 1) {
      return { ok: true, routes: [], warning: "No routes were found. A level 1 site can continue with that warning." };
    }
    return { ok: false, problem: "No routes were found. A level 2 site needs at least one route." };
  }
  const context: SiteContext = {
    clientId: adapter.site.id,
    websiteId: adapter.site.id,
    repository: `${adapter.site.repository.owner}/${adapter.site.repository.name}`,
    branch: adapter.site.defaultBranch,
    actorId: "onboarding",
  };
  const discovered = await discoverStaticRoutes(adapter.routes)(context);
  if (!discovered.ok) return { ok: false, problem: discovered.error.message };
  return { ok: true, routes: discovered.value };
}
