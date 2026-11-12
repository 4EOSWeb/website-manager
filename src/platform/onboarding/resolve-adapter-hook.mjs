import fs from "node:fs";
import { register } from "node:module";
import { fileURLToPath } from "node:url";

if (!process.env.__ADAPTER_RESOLVE_HOOK) {
  process.env.__ADAPTER_RESOLVE_HOOK = "1";
  register(import.meta.url);
}

export async function resolve(specifier, context, next) {
  if (!specifier.startsWith(".")) return next(specifier, context);
  let target = new URL(specifier, context.parentURL).href;
  if (!/\.[cm]?[jt]sx?$/.test(target)) {
    for (const ext of [".ts", ".tsx", ".js", "/index.ts"]) {
      if (fs.existsSync(fileURLToPath(target + ext))) {
        target += ext;
        break;
      }
    }
  }
  return next(target, context);
}
