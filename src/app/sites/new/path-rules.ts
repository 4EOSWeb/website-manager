function insideRepository(value: string, emptyMessage: string): string {
  const trimmed = value.trim();
  if (!trimmed) return emptyMessage;
  if (trimmed.startsWith("/") || trimmed.startsWith("\\") || /^[a-zA-Z]:/.test(trimmed) || /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) {
    return "Use a path inside the repository.";
  }
  if (trimmed.split(/[\\/]/).includes("..")) return "Use a path inside the repository.";
  return "";
}

function relativeField(value: string, emptyMessage: string, key: "adapterPath" | "contentPath" | "mediaPath") {
  const problem = insideRepository(value, emptyMessage);
  if (problem) return { ok: false as const, problem };
  return { ok: true as const, onboarding: { [key]: value.trim() } };
}

/** The adapter file stays a relative path. The client does not import it. */
export function adapterPathOnboarding(value: string) {
  return relativeField(value, "Enter the adapter path.", "adapterPath");
}

/** The content directory stays on the onboarding draft. */
export function contentPathOnboarding(value: string) {
  return relativeField(value, "Enter the content path.", "contentPath");
}

/** The public media directory stays a relative path. Nothing is uploaded. */
export function mediaPathOnboarding(value: string) {
  return relativeField(value, "Enter the media path.", "mediaPath");
}
