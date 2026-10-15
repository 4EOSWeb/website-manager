import { siteMismatch } from "./errors";
import { err, ok, type Result } from "./result";

export type SiteContext = {
  clientId: string;
  websiteId: string;
  repository: string;
  branch: string;
  actorId: string;
};

export function assertSameSite(left: SiteContext, right: SiteContext): Result<true> {
  if (left.websiteId !== right.websiteId) return err(siteMismatch());
  return ok(true);
}
