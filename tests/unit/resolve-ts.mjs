import fs from "node:fs";
import { register } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

// Lets the unit tests import app modules that use the "@/" alias and extensionless paths.
if (!process.env.__RESOLVE_TS_HOOK) {
  process.env.__RESOLVE_TS_HOOK = "1";
  register(import.meta.url);
}

const src = pathToFileURL(fileURLToPath(new URL("../../src/", import.meta.url)));

export async function resolve(specifier, context, next) {
  let target = specifier;
  if (specifier.startsWith("@/")) target = new URL(specifier.slice(2), src.href + "/").href;
  else if (!specifier.startsWith(".") || !context.parentURL?.endsWith(".ts")) return next(specifier, context);
  else target = new URL(specifier, context.parentURL).href;
  if (!/\.[cm]?[jt]s$/.test(target)) {
    for (const ext of [".ts", "/index.ts"]) {
      if (fs.existsSync(fileURLToPath(target + ext))) {
        target += ext;
        break;
      }
    }
  }
  return next(target, context);
}
