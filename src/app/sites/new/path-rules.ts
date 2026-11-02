function insideRepository(value: string, emptyMessage: string): string {
  const trimmed = value.trim();
  if (!trimmed) return emptyMessage;
  if (trimmed.startsWith("/") || trimmed.startsWith("\\") || /^[a-zA-Z]:/.test(trimmed) || /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) {
    return "Use a path inside the repository.";
  }
  if (trimmed.split(/[\\/]/).includes("..")) return "Use a path inside the repository.";
  return "";
}

/** The adapter file stays a relative path. The client does not import it. */
export function adapterPathOnboarding(value: string) {
  const problem = insideRepository(value, "Enter the adapter path.");
  if (problem) return { ok: false as const, problem };
  return { ok: true as const, onboarding: { adapterPath: value.trim() } };
}
