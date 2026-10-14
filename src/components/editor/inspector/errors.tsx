"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import type { FieldIssue } from "@/components/editor/inspector/errors-model";

const ReportContext = createContext<(id: string, issues: readonly FieldIssue[]) => void>(() => {});

/** Lets a field tell the editor which issues are currently marked. */
export function FieldIssueProvider(props: { onReport: (id: string, issues: readonly FieldIssue[]) => void; children: ReactNode }) {
  return <ReportContext.Provider value={props.onReport}>{props.children}</ReportContext.Provider>;
}

export function useFieldIssues(id: string, issues: readonly FieldIssue[]) {
  const report = useContext(ReportContext);
  const serialized = JSON.stringify(issues);
  useEffect(() => {
    report(id, JSON.parse(serialized) as FieldIssue[]);
    return () => report(id, []);
  }, [id, serialized, report]);
}

/** The message sits under the field. Severity defaults to a warning. */
export function FieldError(props: { issue: FieldIssue | null }) {
  if (!props.issue) return null;
  return (
    <p className="ed-error" role="alert" data-field-error={props.issue.severity}>
      {props.issue.message}
    </p>
  );
}
