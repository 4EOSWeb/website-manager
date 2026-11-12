import type { AdapterContract } from "../adapter";
import { discoverStaticRoutes, type DiscoveredRoute } from "../adapter/routes";
import type { SiteContext } from "../context";
import { registryFromAdapter } from "../registry/discover";

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

export type ComponentAudience = "client-admin" | "super-admin";

export type OnboardingComponent = { name: string; id?: string };

/** Display names for client admins. Super admins may also see ids. Server paths are omitted. */
export function discoverOnboardingComponents(
  adapter: Pick<AdapterContract, "components">,
  audience: ComponentAudience,
): { ok: true; components: OnboardingComponent[] } | { ok: false; problem: string } {
  const registry = registryFromAdapter(adapter);
  if (!registry.ok) return { ok: false, problem: registry.error.message };
  return {
    ok: true,
    components: registry.value.list().map((definition) => (
      audience === "super-admin" ? { name: definition.name, id: definition.id } : { name: definition.name }
    )),
  };
}
