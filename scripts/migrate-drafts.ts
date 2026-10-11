import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import pg from "pg";
import { breakpointWidth, migrateButton, migrateSection, migrateText } from "../adapters/quantum-age/migrate-map.ts";
import { validateDocumentHook } from "../adapters/quantum-age/validate.ts";
import type { SiteContext } from "../src/platform/context.ts";
import { assembleDraft, type AssembleReport } from "../src/platform/migrate/assemble.ts";

const websiteId = "web_quantum_age";
const backup = process.argv.includes("--backup");

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

const context: SiteContext = {
  clientId: "dry-run",
  websiteId,
  repository: "site",
  branch: "main",
  actorId: "dry-run",
};

const adapter = { migrateText, migrateButton, migrateSection, breakpointWidth };

function publishable(report: AssembleReport) {
  const { document, ...rest } = report;
  void document;
  return rest;
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
const rows = await client.query<{ id: string; draft_data: unknown }>(
  "SELECT id, draft_data FROM workspace_drafts WHERE website_id = $1 ORDER BY id",
  [websiteId],
);

const drafts = rows.rows.map((row) => {
  const report = assembleDraft(row.draft_data, adapter, validateDocumentHook, context);
  return { id: row.id, ...publishable(report) };
});

if (backup) {
  const { backupDraft } = await import("../src/platform/migrate/backup.ts");
  for (const row of rows.rows) await backupDraft(row.id);
}

await client.end();

const body = JSON.stringify({ websiteId, drafts }, null, 2);
for (const row of rows.rows) {
  const data = row.draft_data;
  if (!data || typeof data !== "object") continue;
  const record = data as Record<string, unknown>;
  for (const key of ["tagline", "positioning"] as const) {
    const value = record[key];
    if (typeof value === "string" && value.length > 12 && body.includes(value)) {
      console.error("Dry-run report contains source copy. It was not written.");
      process.exit(1);
    }
  }
}

mkdirSync(new URL("../docs/migration/", import.meta.url), { recursive: true });
writeFileSync(new URL("../docs/migration/dry-run.json", import.meta.url), `${body}\n`);

for (const draft of drafts) console.log(`${draft.id} ok=${draft.ok} shape=${draft.shape} routes=${draft.routes.length}`);
if (drafts.some((draft) => !draft.ok)) process.exit(1);
