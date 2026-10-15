export type ExperienceMode = "basic" | "advanced" | "administrator";

type ExperienceStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

export function experienceKey(websiteId: string): string {
  return `4eos.experience.${websiteId}`;
}

/** Administrator is stored only for a super administrator or a client administrator. */
export function canUseAdministrator(platformRole: string | null, membershipRole: string | null): boolean {
  return platformRole === "SUPER_ADMIN" || membershipRole === "CLIENT_ADMIN";
}

function allowed(raw: string | null, allowAdministrator: boolean): ExperienceMode {
  if (raw === "advanced") return "advanced";
  if (raw === "administrator" && allowAdministrator) return "administrator";
  return "basic";
}

export function readExperience(storage: ExperienceStorage, websiteId: string, allowAdministrator: boolean): ExperienceMode {
  return allowed(storage.getItem(experienceKey(websiteId)), allowAdministrator);
}

export function persistExperience(storage: ExperienceStorage, websiteId: string, mode: ExperienceMode, allowAdministrator: boolean): ExperienceMode {
  if (mode === "administrator" && !allowAdministrator) {
    return readExperience(storage, websiteId, false);
  }
  const next = allowed(mode, allowAdministrator);
  storage.setItem(experienceKey(websiteId), next);
  return next;
}
