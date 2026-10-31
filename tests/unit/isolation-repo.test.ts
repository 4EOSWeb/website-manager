import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";
import harborAdapter from "../../fixtures/harbor/adapter.ts";
import quantumAgeAdapter from "../../adapters/quantum-age/adapter.ts";
import { clientEditorPayload } from "../../src/lib/editor-payload.ts";

const quantumInstallationId = 915500;

function filesIn(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const file = path.join(dir, name);
    if (statSync(file).isDirectory()) return filesIn(file);
    return [file];
  });
}

test("the editor payload keeps repository secrets off the client", () => {
  const harbor = clientEditorPayload({
    canAdminister: true,
    website: {
      id: "web_harbor",
      clientId: "client_quantum_age",
      githubOwner: "harbor",
      githubRepository: "harbor-site",
      defaultBranch: "main",
      githubInstallationId: quantumInstallationId,
    } as { id: string; clientId: string; githubOwner: string; githubRepository: string; defaultBranch: string },
    userId: "user_admin",
    adapter: harborAdapter as unknown as Record<string, unknown>,
  });
  const json = JSON.stringify(harbor);
  assert.equal(harbor.siteContext.repository, "harbor/harbor-site");
  assert.equal(json.includes(String(quantumInstallationId)), false);
  assert.equal(json.includes("githubInstallationId"), false);
  assert.equal(json.includes("4EOSWeb/quantum-age"), false);
  assert.equal(/private key|githubToken|BEGIN PRIVATE KEY/i.test(json), false);

  const editor = clientEditorPayload({
    canAdminister: false,
    website: {
      id: "web_harbor",
      clientId: "client_quantum_age",
      githubOwner: "harbor",
      githubRepository: "harbor-site",
      defaultBranch: "main",
    },
    userId: "user_editor",
    adapter: harborAdapter as unknown as Record<string, unknown>,
  });
  assert.equal(editor.siteContext.repository, "");
  const site = editor.adapter?.site as { repository?: { owner?: string; name?: string } } | undefined;
  assert.equal(site?.repository?.owner, "");
  assert.equal(site?.repository?.name, "");

  const quantum = clientEditorPayload({
    canAdminister: true,
    website: {
      id: "web_quantum_age",
      clientId: "client_quantum_age",
      githubOwner: "4EOSWeb",
      githubRepository: "quantum-age",
      defaultBranch: "main",
    },
    userId: "user_admin",
    adapter: quantumAgeAdapter as unknown as Record<string, unknown>,
  });
  assert.equal(quantum.siteContext.repository, "4EOSWeb/quantum-age");
  assert.equal(JSON.stringify(quantum).includes("harbor-site"), false);

  const componentHits = filesIn("src/components").filter((file) => readFileSync(file, "utf8").includes("githubInstallationId"));
  assert.deepEqual(componentHits, []);
  const page = readFileSync("src/app/sites/[websiteId]/editor/page.tsx", "utf8");
  assert.equal(page.includes("githubInstallationId"), false);
  assert.equal(readFileSync("src/lib/publish.ts", "utf8").includes("githubInstallationId"), true);
});
