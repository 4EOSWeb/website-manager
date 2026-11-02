export type PackageManager = "npm" | "pnpm" | "yarn";

export type PackageManagerDetection =
  | { ok: true; packageManager: PackageManager }
  | { ok: false; problem: string };

const lockfiles: Record<string, PackageManager> = {
  "package-lock.json": "npm",
  "pnpm-lock.yaml": "pnpm",
  "yarn.lock": "yarn",
};

function lockfileName(file: string) {
  const normalized = file.replaceAll("\\", "/").replace(/^\.\//, "");
  const name = normalized.split("/").at(-1) ?? normalized;
  if (normalized !== name) return null;
  return name in lockfiles ? name : null;
}

/** Reads lockfile names from a file list. It does not install packages. */
export function detectPackageManager(files: readonly string[]): PackageManagerDetection {
  const found = new Set<PackageManager>();
  for (const file of files) {
    const name = lockfileName(file);
    if (name) found.add(lockfiles[name]);
  }
  if (found.size > 1) {
    return { ok: false, problem: "This repository has more than one package manager lockfile. Choose one." };
  }
  const packageManager = [...found][0];
  if (!packageManager) {
    return { ok: false, problem: "This repository has no package manager lockfile." };
  }
  return { ok: true, packageManager };
}
