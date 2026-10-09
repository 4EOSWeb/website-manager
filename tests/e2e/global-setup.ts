import fs from "node:fs";
import pg from "pg";

export const SNAPSHOT = "tests/e2e/.auth/drafts.json";

export function database() {
  return new pg.Client({ connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/website_manager" });
}

export default async function globalSetup() {
  const client = database();
  await client.connect();
  const drafts = await client.query("select id, draft_data from workspace_drafts where website_id = 'web_quantum_age'");
  const posts = await client.query("select id from blog_posts where website_id = 'web_quantum_age'");
  await client.end();
  fs.mkdirSync("tests/e2e/.auth", { recursive: true });
  fs.writeFileSync(SNAPSHOT, JSON.stringify({ drafts: drafts.rows, posts: posts.rows.map((row) => row.id) }));
}
