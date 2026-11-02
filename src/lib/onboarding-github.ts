import { githubApp } from "@/lib/github";
import type { RepositoryLookup } from "@/platform/onboarding/validate-connection";

/** Reads one repository with the server GitHub App. It does not create or write a repository. */
export const lookupRepositoryAccess: RepositoryLookup = async ({ owner, repository }) => {
  const app = githubApp();
  if (!app) return { found: false, problem: "The GitHub connection is not configured yet." };
  try {
    await app.octokit.request("GET /repos/{owner}/{repo}", { owner, repo: repository });
    return { found: true };
  } catch (error) {
    const status = error && typeof error === "object" && "status" in error ? Number(error.status) : 0;
    if (status === 404) return { found: false, problem: "That repository was not found." };
    return { found: false, problem: "That repository could not be checked." };
  }
};
