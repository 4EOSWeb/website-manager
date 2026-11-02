import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import pg from "pg";
import { compareMigration, legacyLocks, type CompareKind } from "../src/platform/migrate/compare.ts";

if (!process.env.DATABASE_URL) {
  try {
    const text = readFileSync(new URL("../.env", import.meta.url), "utf8");
    for (const line of text.split("\n")) {
      const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
      if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/website_manager";
  }
}

const websiteId = "web_quantum_age";
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
const rows = await client.query<{ id: string; draft_data: unknown; visual_document: unknown }>(
  "SELECT id, draft_data, visual_document FROM workspace_drafts WHERE website_id = $1 ORDER BY id",
  [websiteId],
);
await client.end();

const kinds: CompareKind[] = ["route", "title", "seo", "media", "lock", "text"];
const lines = ["# Migrated draft comparison", "", "Paths are listed without the source text.", ""];
let failed = false;
for (const row of rows.rows) {
  const report = compareMigration(row.draft_data, row.visual_document, legacyLocks(row.draft_data));
  if (!report.ok) failed = true;
  lines.push(`## ${row.id}`, "", `Result: ${report.ok ? "matched" : "missing fields"}.`, "");
  for (const kind of kinds) {
    const items = report.missing.filter((item) => item.kind === kind);
    lines.push(`- ${kind}: ${items.length} missing`);
  }
  lines.push("");
  if (report.missing.length) {
    lines.push("Missing paths:", "");
    for (const item of report.missing) lines.push(`- ${item.kind} \`${item.path}\``);
    lines.push("");
  }
}
const body = `${lines.join("\n")}\n`;
for (const row of rows.rows) {
  const data = row.draft_data;
  if (!data || typeof data !== "object") continue;
  const record = data as Record<string, unknown>;
  for (const key of ["tagline", "positioning"] as const) {
    const value = record[key];
    if (typeof value === "string" && value.length > 12 && body.includes(value)) {
      console.error("Comparison report contains source copy. It was not written.");
      process.exit(1);
    }
  }
}
mkdirSync(new URL("../docs/migration/", import.meta.url), { recursive: true });
writeFileSync(new URL("../docs/migration/comparison.md", import.meta.url), body);
console.log(body);
if (failed) process.exit(1);
