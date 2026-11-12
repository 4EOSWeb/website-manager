import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import quantumAgeAdapter from "../../adapters/quantum-age/adapter.ts";
import harborAdapter from "../../fixtures/harbor/adapter.ts";
import { parseAdapter } from "../../src/platform/adapter/index.ts";
import {
  addEntryLabel,
  additionLine,
  collectionSaveError,
  editorCollections,
  entryBelongs,
  newEntryTitle,
} from "../../src/platform/content/collections.ts";

test("a site declares the collections it can add", () => {
  const quantum = editorCollections(quantumAgeAdapter);
  assert.deepEqual(
    quantum.map((item) => item.name),
    ["Insights", "Articles", "Forum"],
  );
  assert.equal(quantum[0]?.primary, true);
  assert.equal(addEntryLabel(quantum[0]!), "Add insight");
  assert.equal(newEntryTitle(quantum[1]!), "New article");
  assert.equal(addEntryLabel(quantum[2]!), "Add topic");
  assert.equal(additionLine(quantumAgeAdapter), "Insights, Articles, Forum, Forms");
  assert.equal(entryBelongs({ collection: undefined }, quantum[0]!), true);
  assert.equal(entryBelongs({ collection: undefined }, quantum[2]!), false);
  assert.equal(entryBelongs({ collection: "forum" }, quantum[2]!), true);
});

test("a site without articles or a forum adds pages only", () => {
  assert.deepEqual(editorCollections(harborAdapter), []);
  assert.equal(additionLine(harborAdapter), "Pages only");
  assert.equal(collectionSaveError([], {}), "This site does not have articles or a forum.");
});

test("an omitted collection list is derived from the article address", () => {
  const derived = editorCollections({
    articles: { enabled: true, routePattern: "/journal/:slug", body: "structured" },
  });
  assert.equal(derived.length, 1);
  assert.equal(derived[0]?.name, "Journal");
  assert.equal(derived[0]?.primary, true);
  assert.equal(addEntryLabel(derived[0]!), "Add journal");
});

test("a future site can add a forum without articles", () => {
  const forum = {
    ...harborAdapter,
    collections: [{ id: "forum", name: "Forum", kind: "forum" as const, routePattern: "/forum/:slug", body: "structured" as const }],
  };
  const parsed = parseAdapter(forum);
  assert.equal(parsed.ok, true);
  assert.deepEqual(editorCollections(forum).map((item) => item.name), ["Forum"]);
  const articles = {
    ...harborAdapter,
    collections: [{ id: "notes", name: "Notes", kind: "article" as const, routePattern: "/notes/:slug", body: "structured" as const }],
  };
  assert.equal(parseAdapter(articles).ok, false);
});

test("collection names stay in the site adapter", () => {
  for (const file of ["src/platform/adapter/collections.ts", "src/platform/content/collections.ts"]) {
    const source = readFileSync(new URL(`../../${file}`, import.meta.url), "utf8");
    assert.equal(/insights|quantum|plum|hero/i.test(source), false);
  }
});
