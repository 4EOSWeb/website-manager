import { linkProblem } from "@/lib/links";
import type { PlatformError } from "@/platform/errors";
import type { Result } from "@/platform/result";

export type FieldIssue = {
  message: string;
  severity: "warning" | "fatal";
  path?: string;
};

/** Link problems stay warnings. The typed address is not cleared. */
export function linkIssue(href: string): FieldIssue | null {
  const message = linkProblem(href);
  if (!message) return null;
  return { message, severity: "warning", path: "href" };
}

export function issueSeverity(error: Pick<PlatformError, "fatal">): FieldIssue["severity"] {
  return error.fatal === true ? "fatal" : "warning";
}

/** Prop schema failures keep the typed value. Fatal is opt-in. */
export function issuesFromProps(result: Result<unknown>): FieldIssue[] {
  if (result.ok) return [];
  return [{ message: result.error.message, severity: issueSeverity(result.error), path: result.error.path }];
}

/** Warnings still save. Only an adapter-fatal issue blocks the write. */
export function blocksSave(issues: readonly Pick<FieldIssue, "severity">[]): boolean {
  return issues.some((issue) => issue.severity === "fatal");
}
