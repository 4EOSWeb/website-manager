import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const overlay = path.join(root, "overlays", "quantum-age");
const target = path.join(root, ".workspaces", process.argv[2] ?? "web_quantum_age");
const draftContent = (relative: string) =>
  relative === "src/content/pages/home.json" ||
  relative === "src/content/editor/site.json" ||
  relative.startsWith("src/content/blog/") ||
  relative.startsWith("public/media/");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

if (!existsSync(target)) {
  console.error(`No preview workspace at ${target}. Open the editor once to create it.`);
  process.exit(1);
}
let copied = 0;
for (const file of walk(overlay)) {
  const relative = path.relative(overlay, file).split(path.sep).join("/");
  const destination = path.join(target, relative);
  if (draftContent(relative) && existsSync(destination)) continue;
  mkdirSync(path.dirname(destination), { recursive: true });
  copyFileSync(file, destination);
  copied += 1;
}
console.log(`Copied ${copied} overlay files into ${path.relative(root, target)}`);
