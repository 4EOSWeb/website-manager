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

const args = process.argv.slice(2);
const websiteAt = args.indexOf("--website");
const websiteId = websiteAt === -1 ? "" : args[websiteAt + 1];
if (!websiteId || websiteId.startsWith("-")) {
  console.error("Pass --website.");
  process.exit(1);
}

const latest = args.includes("--latest");
const backupId = args.find((arg, index) => !arg.startsWith("-") && args[index - 1] !== "--website");
if (!latest && !backupId) {
  console.error("Pass a backup id, or pass --latest.");
  process.exit(1);
}

const { prisma } = await import("../src/lib/prisma.ts");
const { restoreDraftBackup, restoreLatestBackups } = await import("../src/platform/migrate/restore.ts");

try {
  if (latest) {
    const drafts = await restoreLatestBackups(websiteId, prisma);
    console.log(drafts.length ? `Restored ${drafts.join(", ")}.` : "No backups for that site.");
  } else {
    const draftId = await restoreDraftBackup(backupId!, websiteId, prisma);
    console.log(`Restored ${draftId} from ${backupId}.`);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : "The backup could not be restored.");
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
