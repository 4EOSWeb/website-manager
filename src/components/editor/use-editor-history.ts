"use client";

import { useCallback, useState } from "react";
import { canRedoScoped, emptyHistory, redoScoped, rememberScoped, undoScoped, type History, type ScopedSnapshot } from "@/lib/history";

export function useEditorHistory<T>(websiteId = "") {
  const [history, setHistory] = useState<History<ScopedSnapshot<T>>>(emptyHistory);
  const record = useCallback((current: T, visualDocument?: unknown) => {
    setHistory((value) => rememberScoped(value, websiteId, current, visualDocument));
  }, [websiteId]);
  const undo = (current: T, visualDocument?: unknown) => {
    const step = undoScoped(history, websiteId, current, visualDocument);
    if (!step) return null;
    setHistory(step.history);
    return { value: step.value, visualDocument: step.visualDocument };
  };
  const redo = (current: T, visualDocument?: unknown) => {
    const step = redoScoped(history, websiteId, current, visualDocument);
    if (!step) return null;
    setHistory(step.history);
    return { value: step.value, visualDocument: step.visualDocument };
  };
  const previous = history.past[history.past.length - 1];
  return {
    record,
    undo,
    redo,
    canUndo: previous !== undefined && previous.websiteId === websiteId,
    canRedo: canRedoScoped(history, websiteId),
  };
}
