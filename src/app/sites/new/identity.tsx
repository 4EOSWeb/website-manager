"use client";

import { useState } from "react";
import { websiteIdExists } from "./actions";
import { RepositoryFields, branchOnboarding, repositoryProblems } from "./repository";
import { siteIdPattern, siteIdProblem } from "./site-id";

export { siteIdProblem };

export function SiteIdentity() {
  const [name, setName] = useState("");
  const [id, setId] = useState("");
  const [problem, setProblem] = useState("");
  const [owner, setOwner] = useState("");
  const [repository, setRepository] = useState("");
  const [branch, setBranch] = useState("main");
  const [repoErrors, setRepoErrors] = useState({ owner: "", repository: "", branch: "" });

  async function check(value: string) {
    const exists = siteIdPattern.test(value) ? await websiteIdExists(value) : false;
    setProblem(siteIdProblem(value, exists));
  }

  return (
    <form
      className="mt-10 flex flex-col gap-5 border border-[var(--line)] bg-white p-6"
      aria-label="Connect a website"
      onSubmit={(event) => {
        event.preventDefault();
        const names = repositoryProblems(owner, repository);
        const nextBranch = branchOnboarding(branch);
        setRepoErrors({ ...names, branch: nextBranch.ok ? "" : nextBranch.problem });
      }}
    >
      <label className="block text-sm text-[var(--ink)]">
        Site name
        <input className="mt-2 w-full border border-[var(--line)] px-3 py-2" value={name} onChange={(event) => setName(event.target.value)} />
      </label>
      <label className="block text-sm text-[var(--ink)]">
        Site id
        <input
          className="mt-2 w-full border border-[var(--line)] px-3 py-2"
          value={id}
          autoCapitalize="none"
          spellCheck={false}
          onChange={(event) => {
            setId(event.target.value);
            setProblem("");
          }}
          onBlur={(event) => void check(event.target.value)}
        />
      </label>
      {problem ? <p className="text-sm text-[var(--accent)]" role="alert">{problem}</p> : null}
      <RepositoryFields
        owner={owner}
        repository={repository}
        branch={branch}
        ownerError={repoErrors.owner}
        repositoryError={repoErrors.repository}
        branchError={repoErrors.branch}
        onOwner={setOwner}
        onRepository={setRepository}
        onBranch={setBranch}
      />
      <button className="border border-[var(--ink)] px-4 py-3 text-left" type="submit">Continue</button>
    </form>
  );
}
