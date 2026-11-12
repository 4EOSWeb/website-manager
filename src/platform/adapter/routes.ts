import { z } from "zod";
import type { SiteContext } from "../context";
import { adapterInvalid } from "../errors";
import { err, ok, type Result } from "../result";

const sitePath = z.string().refine((value) => value.startsWith("/") && !value.includes("://") && !value.startsWith("//"), "Use a site path.");

export const discoveredRouteSchema = z.object({
  path: sitePath,
  title: z.string().min(1),
}).strict();

export const staticRoutesSchema = z.array(discoveredRouteSchema);

export type DiscoveredRoute = z.infer<typeof discoveredRouteSchema>;

export type DiscoverRoutes = (context: SiteContext) => Promise<Result<DiscoveredRoute[]>>;

/** A JSON adapter can supply static routes. The default discovery returns that list. */
export function discoverStaticRoutes(routes: unknown): DiscoverRoutes {
  return async (context) => {
    if (!context.websiteId) return err(adapterInvalid("The site record is required.", "routes"));
    const parsed = staticRoutesSchema.safeParse(routes);
    if (!parsed.success) return err(adapterInvalid("Use a site path.", "routes"));
    return ok(parsed.data);
  };
}
