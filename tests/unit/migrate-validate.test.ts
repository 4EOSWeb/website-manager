import assert from "node:assert/strict";
import { test } from "node:test";
import { migrateText } from "../../adapters/quantum-age/migrate-map.ts";
import { validateDocumentHook } from "../../adapters/quantum-age/validate.ts";
import { convertPages } from "../../src/platform/migrate/convert-page.ts";
import { convertSection } from "../../src/platform/migrate/convert-section.ts";
import { convertText } from "../../src/platform/migrate/convert-text.ts";
import { validateMigrated } from "../../src/platform/migrate/validate.ts";
import type { SiteContext } from "../../src/platform/context.ts";

const context: SiteContext = {
  clientId: "client_example",
  websiteId: "web_example",
  repository: "example",
  branch: "main",
  actorId: "user_example",
};

const draft = {
  pages: [
    {
      id: "page_0123456789ab",
      route: "/stacked",
      title: "Stacked",
      seoTitle: "Stacked",
      metaDescription: "A page",
      sections: [
        {
          id: "sec",
          type: "flow",
          hidden: false,
          blocks: [
            { id: "h", kind: "heading", hidden: false, text: { text: "Heading", marks: [] } },
            { id: "p", kind: "paragraph", hidden: false, text: { text: "Paragraph", marks: [] } },
          ],
        },
      ],
    },
  ],
};

test("a stacked version 3 conversion validates and a broken node fails", () => {
  const page = convertPages(draft).pages[0]!;
  const section = draft.pages[0]!.sections[0]!;
  const container = convertSection(section, { migrateSection: () => null });
  const children = section.blocks.map((block) => convertText(block, { migrateText })).filter((node) => node);
  const document = {
    version: 1 as const,
    pages: [{ ...page, root: { ...container, children } }],
  };
  const validated = validateMigrated(document, validateDocumentHook, context);
  assert.equal(validated.ok, true);
  if (!validated.ok) return;
  assert.equal(validated.value.document.pages[0]?.root.children.length, 2);
  assert.deepEqual(validated.value.warnings, []);

  const warned = validateMigrated(document, () => ({ ok: true, value: { warnings: [{ path: "pages.0", message: "Check this page." }] } }), context);
  assert.equal(warned.ok, true);
  if (warned.ok) assert.equal(warned.value.warnings.length, 1);

  const broken = validateMigrated({ version: 1, pages: [{ id: "page_0123456789ab", route: "/", title: "Broken", metadata: {}, root: { id: "missing" } }] }, validateDocumentHook, context);
  assert.equal(broken.ok, false);
  if (!broken.ok) assert.equal(broken.error.code, "migration_failed");
});
