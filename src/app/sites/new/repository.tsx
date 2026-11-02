"use client";

import { ProductField } from "@/components/product/field";

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
      <ProductField
        id="repository-owner"
        label="Repository owner"
        value={props.owner}
        error={props.ownerError || undefined}
        autoCapitalize="none"
        spellCheck={false}
        onChange={(event) => props.onOwner(event.target.value)}
      />
      <ProductField
        id="repository-name"
        label="Repository name"
        value={props.repository}
        error={props.repositoryError || undefined}
        autoCapitalize="none"
        spellCheck={false}
        onChange={(event) => props.onRepository(event.target.value)}
      />
      <ProductField
        id="default-branch"
        label="Default branch"
        value={props.branch}
        error={props.branchError || undefined}
        autoCapitalize="none"
        spellCheck={false}
        onChange={(event) => props.onBranch(event.target.value)}
      />
    </>
  );
}
