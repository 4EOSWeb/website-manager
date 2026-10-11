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

export type ScopedSnapshot<T> = {
  websiteId: string;
  value: T;
  visualDocument: unknown | null;
};

function scopedEntry<T>(websiteId: string, value: T, visualDocument?: unknown): ScopedSnapshot<T> {
  return { websiteId, value, visualDocument: visualDocument === undefined ? null : visualDocument };
}

/** Version 3 history stays a value snapshot. A visual edit also stores that document. */
export function rememberScoped<T>(history: History<ScopedSnapshot<T>>, websiteId: string, current: T, visualDocument?: unknown): History<ScopedSnapshot<T>> {
  return remember(history, scopedEntry(websiteId, current, visualDocument));
}

/** Restores the previous snapshot for this website. Another website's entry is left in place. */
export function undoScoped<T>(
  history: History<ScopedSnapshot<T>>,
  websiteId: string,
  current: T,
  visualDocument?: unknown,
): { value: T; visualDocument: unknown | null; history: History<ScopedSnapshot<T>> } | null {
  const top = history.past[history.past.length - 1];
  if (!top || top.websiteId !== websiteId) return null;
  const step = undoStep(history, scopedEntry(websiteId, current, visualDocument));
  if (!step) return null;
  return { value: step.state.value, visualDocument: step.state.visualDocument, history: step.history };
}

/** Redo is available only when the next snapshot belongs to this website. */
export function canRedoScoped<T>(history: History<ScopedSnapshot<T>>, websiteId: string): boolean {
  const next = history.future[0];
  return next !== undefined && next.websiteId === websiteId;
}

export function redoScoped<T>(
  history: History<ScopedSnapshot<T>>,
  websiteId: string,
  current: T,
  visualDocument?: unknown,
): { value: T; visualDocument: unknown | null; history: History<ScopedSnapshot<T>> } | null {
  if (!canRedoScoped(history, websiteId)) return null;
  const step = redoStep(history, scopedEntry(websiteId, current, visualDocument));
  if (!step) return null;
  return { value: step.state.value, visualDocument: step.state.visualDocument, history: step.history };
}
