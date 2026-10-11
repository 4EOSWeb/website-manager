import { readFileSync } from "node:fs";

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

const backupId = process.argv[2];
if (!backupId || backupId.startsWith("-")) {
  console.error("Pass a backup id.");
  process.exit(1);
}

const { prisma } = await import("../src/lib/prisma.ts");
const { restoreDraftBackup } = await import("../src/platform/migrate/restore.ts");
const draftId = await restoreDraftBackup(backupId, prisma);
console.log(`Restored ${draftId} from ${backupId}.`);
await prisma.$disconnect();
