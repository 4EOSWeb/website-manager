export type RouterKind = "app" | "pages";

export type RouterDetection =
  | { ok: true; kind: RouterKind }
  | { ok: false; problem: string };

function hasDirectory(files: readonly string[], directory: string) {
  const prefix = `${directory}/`;
  return files.some((file) => {
    const normalized = file.replaceAll("\\", "/").replace(/^\.\//, "");
    return normalized === directory || normalized.startsWith(prefix);
  });
}

/** Reads a file list. It does not write or scan a checkout. */
export function detectRouter(files: readonly string[]): RouterDetection {
  const app = hasDirectory(files, "src/app");
  const pages = hasDirectory(files, "src/pages");
  if (app && pages) {
    return {
      ok: false,
      problem: "This repository has both src/app and src/pages. Choose which router to use.",
    };
  }
  if (app) return { ok: true, kind: "app" };
  if (pages) return { ok: true, kind: "pages" };
  return { ok: false, problem: "This repository has neither src/app nor src/pages." };
}
