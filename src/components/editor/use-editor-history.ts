"use client";

import { useCallback, useRef, useState } from "react";
import { canRedoScoped, emptyHistory, redoScoped, trailDrop, trailText, undoScoped, type History, type ScopedSnapshot } from "@/lib/history";

export function useEditorHistory<T>(websiteId = "") {
  const [history, setHistory] = useState<History<ScopedSnapshot<T>>>(emptyHistory);
  const textKey = useRef("");
  const record = useCallback((current: T, visualDocument?: unknown) => {
    const previousKey = textKey.current;
    textKey.current = "";
    setHistory((value) => trailDrop({ history: value, textKey: previousKey }, websiteId, current, visualDocument).history);
  }, [websiteId]);
  const recordText = useCallback((current: T, key: string, visualDocument?: unknown) => {
    const previousKey = textKey.current;
    textKey.current = key;
    setHistory((value) => trailText({ history: value, textKey: previousKey }, websiteId, current, key, visualDocument).history);
  }, [websiteId]);
  const breakCoalesce = useCallback(() => {
    textKey.current = "";
  }, []);
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
    recordText,
    breakCoalesce,
    undo,
    redo,
    canUndo: previous !== undefined && previous.websiteId === websiteId,
    canRedo: canRedoScoped(history, websiteId),
  };
}
