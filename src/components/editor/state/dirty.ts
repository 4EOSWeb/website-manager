export type DirtyDocument = {
  version3: unknown | null;
  visualDocument: unknown | null;
};

export type DirtyState = {
  websiteId: string;
  dirty: boolean;
  document: DirtyDocument | null;
};

export function emptyDirty(websiteId: string): DirtyState {
  return { websiteId, dirty: false, document: null };
}

export function markChanged(state: DirtyState, change: { version3?: unknown; visualDocument?: unknown }): DirtyState {
  return {
    websiteId: state.websiteId,
    dirty: true,
    document: {
      version3: change.version3 === undefined ? (state.document?.version3 ?? null) : change.version3,
      visualDocument: change.visualDocument === undefined ? (state.document?.visualDocument ?? null) : change.visualDocument,
    },
  };
}

export function markSaved(state: DirtyState): DirtyState {
  if (!state.dirty) return state;
  return { ...state, dirty: false };
}

export function shouldWarnBeforeUnload(state: DirtyState): boolean {
  return state.dirty;
}

/** Clears the previous site without copying its document onto the next one. */
export function switchWebsite(state: DirtyState, nextWebsiteId: string): { warn: boolean; state: DirtyState; savedToNext: null } {
  if (state.websiteId === nextWebsiteId) return { warn: false, state, savedToNext: null };
  return { warn: state.dirty, state: emptyDirty(nextWebsiteId), savedToNext: null };
}
