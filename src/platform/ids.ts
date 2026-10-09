const prefixes = ["page", "node", "grp"] as const;

export type PlatformIdPrefix = (typeof prefixes)[number];

const pattern = /^(page|node|grp)_[0-9a-f]{12}$/;

export function createPlatformId(prefix: PlatformIdPrefix): string {
  if (!prefixes.includes(prefix)) throw new Error("Unknown id prefix.");
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(6));
  const hex = Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
  return `${prefix}_${hex}`;
}

export function isPlatformId(value: string): boolean {
  return pattern.test(value);
}
