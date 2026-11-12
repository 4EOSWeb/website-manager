export function developmentAccess(enabled: boolean) {
  if (!enabled) return null;
  return {
    title: "Development access",
    note: "These accounts are only on a local copy.",
  };
}
