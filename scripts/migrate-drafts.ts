import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import pg from "pg";
import { breakpointWidth, migrateButton, migrateSection, migrateText } from "../adapters/quantum-age/migrate-map.ts";
import { validateDocumentHook } from "../adapters/quantum-age/validate.ts";
import type { SiteContext } from "../src/platform/context.ts";
import { assembleDraft, type AssembleReport } from "../src/platform/migrate/assemble.ts";
import { draftChecksum } from "../src/platform/migrate/checksum.ts";

const websiteId = "web_quantum_age";
const backup = process.argv.includes("--backup");
const execute = process.argv.includes("--execute");

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

function refuseCopy(body: string) {
  for (const row of rows.rows) {
    const data = row.draft_data;
    if (!data || typeof data !== "object") continue;
    const record = data as Record<string, unknown>;
    for (const key of ["tagline", "positioning"] as const) {
      const value = record[key];
      if (typeof value === "string" && value.length > 12 && body.includes(value)) return true;
    }
  }
  return false;
}

if (execute) {
  const dryRun = JSON.parse(readFileSync(new URL("../docs/migration/dry-run.json", import.meta.url), "utf8"));
  const { executeMigration } = await import("../src/platform/migrate/execute.ts");
  const result = await executeMigration({
    websiteId,
    dryRun,
    rows: rows.rows.map((row) => ({ id: row.id, draftData: row.draft_data })),
    adapter,
    hook: validateDocumentHook,
    context,
  });
  await client.end();
  const body = JSON.stringify({ websiteId, ok: result.ok, refused: result.refused, drafts: result.drafts }, null, 2);
  if (refuseCopy(body)) {
    console.error("Execute report contains source copy. It was not written.");
    process.exit(1);
  }
  mkdirSync(new URL("../docs/migration/", import.meta.url), { recursive: true });
  writeFileSync(new URL("../docs/migration/execute.json", import.meta.url), `${body}\n`);
  for (const draft of result.drafts) console.log(`${draft.id} status=${draft.status}`);
  if (!result.ok) process.exit(1);
  process.exit(0);
}

const drafts = rows.rows.map((row) => {
  const report = assembleDraft(row.draft_data, adapter, validateDocumentHook, context);
  return { id: row.id, checksum: draftChecksum(row.draft_data), ...publishable(report) };
});

if (backup) {
  const { backupDraft } = await import("../src/platform/migrate/backup.ts");
  for (const row of rows.rows) await backupDraft(row.id);
}

await client.end();

const body = JSON.stringify({ websiteId, drafts }, null, 2);
if (refuseCopy(body)) {
  console.error("Dry-run report contains source copy. It was not written.");
  process.exit(1);
}

mkdirSync(new URL("../docs/migration/", import.meta.url), { recursive: true });
writeFileSync(new URL("../docs/migration/dry-run.json", import.meta.url), `${body}\n`);

for (const draft of drafts) console.log(`${draft.id} ok=${draft.ok} shape=${draft.shape} routes=${draft.routes.length}`);
if (drafts.some((draft) => !draft.ok)) process.exit(1);
