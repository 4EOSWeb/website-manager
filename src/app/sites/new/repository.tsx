"use client";

export { branchOnboarding, repositoryProblems } from "./repository-rules";

export function RepositoryFields(props: {
  owner: string;
  repository: string;
  branch: string;
  ownerError: string;
  repositoryError: string;
  branchError: string;
  onOwner: (value: string) => void;
  onRepository: (value: string) => void;
  onBranch: (value: string) => void;
}) {
  return (
    <>
      <label className="block text-sm text-[var(--ink)]">
        Owner
        <input className="mt-2 w-full border border-[var(--line)] px-3 py-2" value={props.owner} autoCapitalize="none" spellCheck={false} onChange={(event) => props.onOwner(event.target.value)} />
      </label>
      {props.ownerError ? <p className="text-sm text-[var(--accent)]" role="alert">{props.ownerError}</p> : null}
      <label className="block text-sm text-[var(--ink)]">
        Repository name
        <input className="mt-2 w-full border border-[var(--line)] px-3 py-2" value={props.repository} autoCapitalize="none" spellCheck={false} onChange={(event) => props.onRepository(event.target.value)} />
      </label>
      {props.repositoryError ? <p className="text-sm text-[var(--accent)]" role="alert">{props.repositoryError}</p> : null}
      <label className="block text-sm text-[var(--ink)]">
        Default branch
        <input className="mt-2 w-full border border-[var(--line)] px-3 py-2" value={props.branch} autoCapitalize="none" spellCheck={false} onChange={(event) => props.onBranch(event.target.value)} />
      </label>
      {props.branchError ? <p className="text-sm text-[var(--accent)]" role="alert">{props.branchError}</p> : null}
    </>
  );
}
