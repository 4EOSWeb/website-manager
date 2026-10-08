import { readFileSync } from "node:fs";
import pg from "pg";

const manifest = readFileSync(new URL("../overlays/quantum-age/4eos.editor.config.json", import.meta.url), "utf8");
const client = new pg.Client({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/website_manager",
});
await client.connect();

await client.query(`
  INSERT INTO clients (id, name) VALUES ('client_quantum_age', 'Quantum Age Collaborative')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
`);
await client.query(`
  INSERT INTO users (id, display_name, email, status, platform_role)
  VALUES ('user_admin', '4EOS Administrator', 'admin@4eos.test', 'ACTIVE', 'SUPER_ADMIN')
  ON CONFLICT (email) DO UPDATE SET display_name = EXCLUDED.display_name, platform_role = EXCLUDED.platform_role, status = 'ACTIVE'
`);
await client.query(`
  INSERT INTO users (id, display_name, email, status)
  VALUES ('user_editor', 'Client Editor', 'editor@4eos.test', 'ACTIVE')
  ON CONFLICT (email) DO UPDATE SET display_name = EXCLUDED.display_name, status = 'ACTIVE'
`);
await client.query(
  `
  INSERT INTO websites (
    id, client_id, name, production_url, github_owner, github_repository, default_branch, editor_status, manifest
  ) VALUES (
    'web_quantum_age', 'client_quantum_age', 'Quantum Age', 'https://testsite.4eos.com',
    '4EOSWeb', 'quantum-age', 'main', 'APPROVED', $1::jsonb
  )
  ON CONFLICT (id) DO UPDATE SET manifest = EXCLUDED.manifest, editor_status = 'APPROVED'
`,
  [manifest],
);
await client.query(`
  INSERT INTO website_memberships (id, user_id, website_id, role)
  VALUES ('member_editor', 'user_editor', 'web_quantum_age', 'CLIENT_EDITOR')
  ON CONFLICT (user_id, website_id) DO UPDATE SET role = EXCLUDED.role
`);
await client.query(`
  INSERT INTO pages (id, website_id, route, title, editable_manifest, updated_at)
  VALUES (
    'page_home', 'web_quantum_age', '/', 'Home',
    '{"fields":["tagline","positioning","primaryButton","heroImage"]}'::jsonb,
    NOW()
  )
  ON CONFLICT (website_id, route) DO UPDATE SET title = EXCLUDED.title
`);

await client.end();
console.log("Seeded the Quantum Age website and two development accounts.");
