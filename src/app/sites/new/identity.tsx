"use client";

import { useState } from "react";
import { ProductButton } from "@/components/product/button";
import { ProductField } from "@/components/product/field";
import { websiteIdExists } from "./actions";
import { PathFields, adapterPathOnboarding, contentPathOnboarding, mediaPathOnboarding, navigationSourceOnboarding, themeSourceOnboarding } from "./paths";
import { CompatibilityReport } from "./report";
import type { ReportSection } from "./report-model";
import { reviewSite } from "./review";
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
  const [themeSource, setThemeSource] = useState("adapter");
  const [themeError, setThemeError] = useState("");
  const [navigationSource, setNavigationSource] = useState("document");
  const [navigationError, setNavigationError] = useState("");
  const [connectionError, setConnectionError] = useState("");
  const [report, setReport] = useState<ReportSection[] | null>(null);

  async function checkConnection(nextOwner: string, nextRepository: string) {
    setConnectionError("");
    setReport(null);
    try {
      const sections = await reviewSite({
        owner: nextOwner,
        repository: nextRepository,
        branch,
        adapterPath,
        contentPath,
        mediaPath,
        themeSource,
        navigationSource,
      });
      setReport(sections);
      const connection = sections.find((section) => section.id === "connection");
      if (connection && connection.status === "fail") setConnectionError(connection.message);
    } catch {
      setConnectionError("That repository could not be checked.");
    }
  }

  async function check(value: string) {
    const exists = siteIdPattern.test(value) ? await websiteIdExists(value) : false;
    setProblem(siteIdProblem(value, exists));
  }

  const steps = [
    { id: "site-name", label: "Name" },
    { id: "repository", label: "Repository" },
    { id: "files", label: "Files" },
    { id: "report", label: "Report" },
  ];
  return (
    <form
      className="product-connect"
      aria-label="Connect a website"
      onSubmit={(event) => {
        event.preventDefault();
        const names = repositoryProblems(owner, repository);
        const nextBranch = branchOnboarding(branch);
        const nextAdapter = adapterPathOnboarding(adapterPath);
        const nextContent = contentPathOnboarding(contentPath);
        const nextMedia = mediaPathOnboarding(mediaPath);
        const nextTheme = themeSourceOnboarding(themeSource);
        const nextNavigation = navigationSourceOnboarding(navigationSource);
        setRepoErrors({ ...names, branch: nextBranch.ok ? "" : nextBranch.problem });
        setAdapterError(nextAdapter.ok ? "" : nextAdapter.problem);
        setContentError(nextContent.ok ? "" : nextContent.problem);
        setMediaError(nextMedia.ok ? "" : nextMedia.problem);
        setThemeError(nextTheme.ok ? "" : nextTheme.problem);
        setNavigationError(nextNavigation.ok ? "" : nextNavigation.problem);
        const ready = !names.owner && !names.repository && nextBranch.ok && nextAdapter.ok && nextContent.ok && nextMedia.ok && nextTheme.ok && nextNavigation.ok;
        if (!ready) {
          setConnectionError("");
          return;
        }
        void checkConnection(owner.trim(), repository.trim());
      }}
    >
      <ol className="product-steps" aria-label="Steps">
        {steps.map((step, index) => (
          <li key={step.id} aria-current={(!report && step.id === "site-name") || (report && step.id === "report") ? "step" : undefined}>
            <a href={`#${step.id}`}>
              {index + 1} {step.label}
            </a>
          </li>
        ))}
      </ol>
      <fieldset id="site-name" className="product-fieldset">
        <legend>Name</legend>
        <ProductField id="site-name-field" label="Site name" value={name} onChange={(event) => setName(event.target.value)} />
        <ProductField
          id="site-id"
          label="Site id"
          value={id}
          error={problem || undefined}
          autoCapitalize="none"
          spellCheck={false}
          onChange={(event) => {
            setId(event.target.value);
            setProblem("");
          }}
          onBlur={(event) => void check(event.target.value)}
        />
      </fieldset>
      <fieldset id="repository" className="product-fieldset">
        <legend>Repository</legend>
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
      </fieldset>
      <fieldset id="files" className="product-fieldset">
        <legend>Files</legend>
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
        themeSource={themeSource}
        themeError={themeError}
        onThemeSource={setThemeSource}
        navigationSource={navigationSource}
        navigationError={navigationError}
        onNavigationSource={setNavigationSource}
        />
      </fieldset>
      {connectionError ? (
        <p className="product-error" role="alert">
          {connectionError}
        </p>
      ) : null}
      <ProductButton type="submit">Continue</ProductButton>
      <fieldset id="report" className="product-fieldset">
        <legend>Report</legend>
        {report ? <CompatibilityReport sections={report} /> : <p className="product-quiet">No report yet.</p>}
        {report?.some((section) => section.status === "fail") ? <p>Nothing was connected.</p> : null}
      </fieldset>
      <ProductButton type="button" variant="quiet" disabled={!report || report.some((section) => section.status === "fail")}>
        Activate
      </ProductButton>
    </form>
  );
}
