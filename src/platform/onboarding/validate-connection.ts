export type RepositoryLookup = (input: { owner: string; repository: string }) => Promise<{ found: boolean; problem?: string }>;

export type ConnectionResult = { ok: true; found: true } | { ok: false; problem: string };

function plainProblem(problem: string | undefined, fallback: string) {
  const text = problem?.trim() || fallback;
  if (/token|ghp_|github_pat_|private key|BEGIN /i.test(text) || text.includes("\n")) return fallback;
  return text;
}

/** Checks repository access through a supplied client. The result never includes a token. */
export async function validateConnection(
  input: { owner: string; repository: string },
  lookup: RepositoryLookup,
): Promise<ConnectionResult> {
  const owner = input.owner.trim();
  const repository = input.repository.trim();
  if (!owner || !repository) return { ok: false, problem: "Enter the repository owner and name." };
  try {
    const result = await lookup({ owner, repository });
    if (!result?.found) return { ok: false, problem: plainProblem(result?.problem, "That repository was not found.") };
    return { ok: true, found: true };
  } catch {
    return { ok: false, problem: "That repository could not be checked." };
  }
}

export function connectionResponse(allowed: boolean, result: ConnectionResult) {
  if (!allowed) return { status: 403 as const, body: { message: "You cannot connect a website." } };
  return { status: 200 as const, body: result };
}
