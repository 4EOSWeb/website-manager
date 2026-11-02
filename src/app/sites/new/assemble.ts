import path from "node:path";
import type { RepositoryLookup } from "@/platform/onboarding/validate-connection";
import { validateConnection } from "@/platform/onboarding/validate-connection";
import { validateAdapterFile } from "@/platform/onboarding/validate-adapter";
import { discoverOnboardingComponents, discoverOnboardingRoutes, type ComponentAudience } from "@/platform/onboarding/discover";
import { validatePreview, type PreviewListener } from "@/platform/onboarding/validate-preview";
import { validateOnboardingSerialization } from "@/platform/onboarding/validate-serialize";
import { validateOnboardingBuild, type BuildRunner } from "@/platform/onboarding/validate-build";
import { compatibilityReport, type ReportSection } from "./report-model";
import { adapterPathOnboarding, contentPathOnboarding, mediaPathOnboarding, navigationSourceOnboarding, themeSourceOnboarding } from "./path-rules";
import { branchOnboarding, repositoryProblems } from "./repository-rules";

export type OnboardingDraft = {
  owner: string;
  repository: string;
  branch: string;
  adapterPath: string;
  contentPath: string;
  mediaPath: string;
  themeSource: string;
  navigationSource: string;
};

function fail(message: string) {
  return { ok: false as const, message };
}

function insideRoot(root: string, relativePath: string) {
  const base = path.resolve(root);
  const full = path.resolve(base, relativePath);
  if (full !== base && !full.startsWith(`${base}${path.sep}`)) return "";
  return full;
}

/** Runs the onboarding checks and returns plain section results. It does not create a website. */
export async function assembleReport(draft: OnboardingDraft, options: {
  root: string;
  lookup: RepositoryLookup;
  listen: PreviewListener;
  audience: ComponentAudience;
  runBuild?: BuildRunner;
  previewUrl?: string;
}): Promise<ReportSection[]> {
  const names = repositoryProblems(draft.owner, draft.repository);
  const branch = branchOnboarding(draft.branch);
  const adapterPath = adapterPathOnboarding(draft.adapterPath);
  const contentPath = contentPathOnboarding(draft.contentPath);
  const mediaPath = mediaPathOnboarding(draft.mediaPath);
  const theme = themeSourceOnboarding(draft.themeSource);
  const navigation = navigationSourceOnboarding(draft.navigationSource);
  const branchProblem = branch.ok ? "" : branch.problem;
  const contentProblem = contentPath.ok ? "" : contentPath.problem;
  const mediaProblem = mediaPath.ok ? "" : mediaPath.problem;
  const themeProblem = theme.ok ? "" : theme.problem;
  const navigationProblem = navigation.ok ? "" : navigation.problem;
  const fieldProblem = names.owner || names.repository || branchProblem || contentProblem || mediaProblem || themeProblem || navigationProblem;

  const connection = names.owner || names.repository || branchProblem
    ? fail(names.owner || names.repository || branchProblem)
    : await validateConnection({ owner: draft.owner, repository: draft.repository }, options.lookup).then((result) => (
      result.ok ? { ok: true as const, message: "Pass" } : fail(result.problem)
    )).catch(() => fail("That repository could not be checked."));

  if (!adapterPath.ok || fieldProblem) {
    return compatibilityReport({
      connection,
      adapter: fail(adapterPath.ok ? fieldProblem : adapterPath.problem),
      routes: fail("No routes were found. A level 2 site needs at least one route."),
      components: fail("The adapter is missing a required field."),
      preview: fail("The preview did not respond."),
      serialization: fail("The serialized draft could not be read."),
      build: fail("The production build failed."),
    });
  }

  const parsed = await validateAdapterFile(options.root, adapterPath.onboarding.adapterPath);
  if (!parsed.ok) {
    return compatibilityReport({
      connection,
      adapter: fail(parsed.errors[0]?.message ?? "The adapter is missing a required field."),
      routes: fail("No routes were found. A level 2 site needs at least one route."),
      components: fail("The adapter is missing a required field."),
      preview: fail("The preview did not respond."),
      serialization: fail("The serialized draft could not be read."),
      build: fail("The production build failed."),
    });
  }

  const routes = await discoverOnboardingRoutes(parsed.adapter);
  const components = discoverOnboardingComponents(parsed.adapter, options.audience);
  const preview = await validatePreview(options.previewUrl ?? "http://127.0.0.1:9/", options.listen);
  const serialized = validateOnboardingSerialization(parsed.adapter);
  const workspace = parsed.adapter.workspace?.root ? insideRoot(options.root, parsed.adapter.workspace.root) : "";
  const build = workspace
    ? await validateOnboardingBuild({ command: parsed.adapter.commands.build, cwd: workspace, run: options.runBuild })
    : { ok: false as const, problem: "The production build failed.", log: "" };

  return compatibilityReport({
    connection,
    adapter: { ok: true, message: "Pass" },
    routes: routes.ok ? { ok: true, message: "Pass" } : fail(routes.problem),
    components: components.ok ? { ok: true, message: "Pass" } : fail(components.problem),
    preview: preview.ok ? { ok: true, message: "Pass" } : fail(preview.problem),
    serialization: serialized.ok ? { ok: true, message: "Pass" } : fail(serialized.problem),
    build: build.ok ? { ok: true, message: "Pass" } : fail("problem" in build ? build.problem : "The production build failed."),
  });
}
