export function repositoryProblems(owner: string, repository: string) {
  return {
    owner: owner.trim() ? "" : "Enter the repository owner.",
    repository: repository.trim() ? "" : "Enter the repository name.",
  };
}

/** An empty branch is stored as main. A space is rejected. The value stays on the onboarding draft. */
export function branchProblem(branch: string): string {
  if (/\s/.test(branch)) return "The branch name cannot contain spaces.";
  return "";
}

export function branchOnboarding(branch: string) {
  const problem = branchProblem(branch);
  if (problem) return { ok: false as const, problem };
  return { ok: true as const, onboarding: { defaultBranch: branch.trim() || "main" } };
}
