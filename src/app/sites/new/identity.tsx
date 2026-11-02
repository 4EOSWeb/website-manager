"use client";

import { useState } from "react";
import { websiteIdExists } from "./actions";
import { PathFields, adapterPathOnboarding, contentPathOnboarding, mediaPathOnboarding } from "./paths";
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
  const [adapterPath, setAdapterPath] = useState("");
  const [adapterError, setAdapterError] = useState("");
  const [contentPath, setContentPath] = useState("");
  const [contentError, setContentError] = useState("");
  const [mediaPath, setMediaPath] = useState("");
  const [mediaError, setMediaError] = useState("");

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
        const nextAdapter = adapterPathOnboarding(adapterPath);
        const nextContent = contentPathOnboarding(contentPath);
        const nextMedia = mediaPathOnboarding(mediaPath);
        setRepoErrors({ ...names, branch: nextBranch.ok ? "" : nextBranch.problem });
        setAdapterError(nextAdapter.ok ? "" : nextAdapter.problem);
        setContentError(nextContent.ok ? "" : nextContent.problem);
        setMediaError(nextMedia.ok ? "" : nextMedia.problem);
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
      <PathFields
        adapterPath={adapterPath}
        adapterError={adapterError}
        onAdapterPath={setAdapterPath}
        contentPath={contentPath}
        contentError={contentError}
        onContentPath={setContentPath}
        mediaPath={mediaPath}
        mediaError={mediaError}
        onMediaPath={setMediaPath}
      />
      <button className="border border-[var(--ink)] px-4 py-3 text-left" type="submit">Continue</button>
    </form>
  );
}
