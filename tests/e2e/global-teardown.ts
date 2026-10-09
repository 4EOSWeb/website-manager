import fs from "node:fs";
import { SNAPSHOT, database } from "./global-setup";

export default async function globalTeardown() {
  if (!fs.existsSync(SNAPSHOT)) return;
  const saved = JSON.parse(fs.readFileSync(SNAPSHOT, "utf8")) as { drafts: { id: string; draft_data: unknown }[]; posts: string[] };
  const client = database();
  await client.connect();
  for (const row of saved.drafts) {
    await client.query("update workspace_drafts set draft_data = $1::jsonb where id = $2", [JSON.stringify(row.draft_data), row.id]);
  }
  const keep = saved.drafts.map((row) => row.id);
  await client.query("delete from workspace_drafts where website_id = 'web_quantum_age' and not (id = any($1::text[]))", [keep]);
  await client.query("delete from blog_posts where website_id = 'web_quantum_age' and not (id = any($1::text[]))", [saved.posts]);
  await client.end();
}
