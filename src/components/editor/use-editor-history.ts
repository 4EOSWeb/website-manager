"use client";

import { useCallback, useState } from "react";
import { emptyHistory, redoStep, remember, undoStep, type History } from "@/lib/history";

export function useEditorHistory<T>() {
  const [history, setHistory] = useState<History<T>>(emptyHistory);
  const record = useCallback((current: T) => setHistory((value) => remember(value, current)), []);
  const undo = (current: T) => {
    const step = undoStep(history, current);
    if (step) setHistory(step.history);
    return step?.state ?? null;
  };
  const redo = (current: T) => {
    const step = redoStep(history, current);
    if (step) setHistory(step.history);
    return step?.state ?? null;
  };
  return { record, undo, redo, canUndo: history.past.length > 0, canRedo: history.future.length > 0 };
}
