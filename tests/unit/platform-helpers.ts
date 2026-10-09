import type { SiteContext } from "../../src/platform/context.ts";

export function fakeContext(websiteId: string): SiteContext {
  return {
    clientId: "client_example",
    websiteId,
    repository: "example/site",
    branch: "main",
    actorId: "user_example",
  };
}

export function fakeAdapter(id: string) {
  return { version: 1 as const, site: { id, name: id } };
}
