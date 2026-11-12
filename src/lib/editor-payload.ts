import type { SiteContext } from "@/platform/context";

const secretKey = /installation|token|privateKey|secret|credential/i;

function withoutSecrets(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(withoutSecrets);
  if (!value || typeof value !== "object") return value;
  const next: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (secretKey.test(key)) continue;
    next[key] = withoutSecrets(item);
  }
  return next;
}

function blankRepository(adapter: Record<string, unknown>) {
  const site = adapter.site;
  if (!site || typeof site !== "object") return adapter;
  const record = site as Record<string, unknown>;
  if (!record.repository || typeof record.repository !== "object") return adapter;
  return { ...adapter, site: { ...record, repository: { owner: "", name: "" } } };
}

/** Owner and repository name stay on the server unless the actor is an administrator. Tokens and installation ids are never included. */
export function clientEditorPayload(options: {
  canAdminister: boolean;
  website: { id: string; clientId: string; githubOwner: string; githubRepository: string; defaultBranch: string };
  userId: string;
  adapter: Record<string, unknown> | null;
}): { siteContext: SiteContext; adapter: Record<string, unknown> | null } {
  const repository = options.canAdminister ? `${options.website.githubOwner}/${options.website.githubRepository}` : "";
  const cleaned = options.adapter ? (withoutSecrets(options.adapter) as Record<string, unknown>) : null;
  return {
    siteContext: {
      clientId: options.website.clientId,
      websiteId: options.website.id,
      repository,
      branch: options.website.defaultBranch,
      actorId: options.userId,
    },
    adapter: cleaned && options.canAdminister ? cleaned : cleaned ? blankRepository(cleaned) : null,
  };
}
