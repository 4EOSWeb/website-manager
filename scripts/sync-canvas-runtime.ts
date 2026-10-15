import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const source = path.join(root, "src", "platform", "canvas");
const websiteId = process.argv[2] ?? "web_quantum_age";
const workspace = path.join(root, ".workspaces", websiteId);
const target = path.join(workspace, "src", "platform", "canvas");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

if (!/^[a-z0-9_-]+$/i.test(websiteId) || !existsSync(workspace)) {
  console.error("No preview workspace. Open the editor once to create it.");
  process.exit(1);
}

let copied = 0;
for (const file of walk(source)) {
  const relative = path.relative(source, file);
  const destination = path.join(target, relative);
  mkdirSync(path.dirname(destination), { recursive: true });
  copyFileSync(file, destination);
  copied += 1;
}
console.log(`Copied ${copied} canvas runtime files.`);
