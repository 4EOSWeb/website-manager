export type SessionStorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export type EditorStore = {
  websiteId: string;
  label: string;
};

const stores = new Map<string, EditorStore>();

export function sessionKey(websiteId: string, name: string): string {
  return `4eos.${websiteId}.${name}`;
}

export function mountEditorStore(websiteId: string): EditorStore {
  const existing = stores.get(websiteId);
  if (existing) return existing;
  const created = { websiteId, label: "" };
  stores.set(websiteId, created);
  return created;
}

export function setNodeLabel(websiteId: string, label: string, storage?: SessionStorageLike): EditorStore {
  const store = mountEditorStore(websiteId);
  store.label = label;
  storage?.setItem(sessionKey(websiteId, "label"), label);
  return store;
}

export function unmountEditorStore(websiteId: string, storage?: SessionStorageLike): void {
  stores.delete(websiteId);
  storage?.removeItem(sessionKey(websiteId, "label"));
}
