export type History<T> = { past: T[]; future: T[] };

export const HISTORY_LIMIT = 60;

export function emptyHistory<T>(): History<T> {
  return { past: [], future: [] };
}

/** Records the state before a change. Any redo steps are dropped. */
export function remember<T>(history: History<T>, current: T, limit = HISTORY_LIMIT): History<T> {
  return { past: [...history.past.slice(-(limit - 1)), current], future: [] };
}

/** Returns the state to restore and the new history, or null when there is nothing to undo. */
export function undoStep<T>(history: History<T>, current: T): { state: T; history: History<T> } | null {
  const state = history.past[history.past.length - 1];
  if (state === undefined) return null;
  return { state, history: { past: history.past.slice(0, -1), future: [current, ...history.future] } };
}

export function redoStep<T>(history: History<T>, current: T): { state: T; history: History<T> } | null {
  const state = history.future[0];
  if (state === undefined) return null;
  return { state, history: { past: [...history.past, current], future: history.future.slice(1) } };
}
