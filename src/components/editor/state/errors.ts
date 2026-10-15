import { formatAdapterError } from "@/platform/adapter/errors";
import type { PlatformError } from "@/platform/errors";

export type EditorError = { code: string; message: string };

/** Keeps the first line. Stack frames are not shown to the editor. */
export function presentErrorMessage(message: string): string {
  const line = message.split("\n")[0] ?? "";
  const cleaned = line.replace(/\s+at\s+.+$/, "").trim();
  return cleaned || "Your last change was not saved.";
}

export function editorErrorFromAdapter(error: PlatformError): EditorError {
  const report = formatAdapterError(error);
  return { code: report.code, message: presentErrorMessage(report.message) };
}

export function editorErrorFromSave(body: { code?: string; message?: string } | null): EditorError {
  return {
    code: body?.code || "save_failed",
    message: presentErrorMessage(body?.message || "Your last change was not saved. Check your connection and press Retry."),
  };
}

/** Clears the notice and returns the same document. */
export function dismissEditorError<T>(document: T): { error: null; document: T } {
  return { error: null, document };
}
