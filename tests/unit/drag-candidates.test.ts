import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { candidateParents, type CandidateBox } from "../../src/platform/drag/candidates.ts";

const outer: CandidateBox = { id: "node_a10000000001", type: "section", depth: 1, x: 0, y: 0, width: 400, height: 400 };
const inner: CandidateBox = { id: "node_a10000000002", type: "stack", depth: 2, x: 40, y: 40, width: 200, height: 200 };
const dragged: CandidateBox = { id: "node_a10000000003", type: "container", depth: 3, x: 50, y: 50, width: 80, height: 40 };
const heading: CandidateBox = { id: "node_a10000000004", type: "heading", depth: 3, x: 60, y: 60, width: 100, height: 24 };

test("the deepest container is first and the dragged node is excluded", () => {
  const boxes = [heading, outer, dragged, inner];
  assert.deepEqual(candidateParents(boxes, dragged.id, 70, 70), [inner.id, outer.id]);
  assert.deepEqual(candidateParents(boxes, dragged.id, 10, 10), [outer.id]);
  assert.deepEqual(candidateParents(boxes, "node_bbbbbbbbbbbb", 70, 70), [dragged.id, inner.id, outer.id]);
  const missed = candidateParents(boxes, dragged.id, 900, 900);
  assert.deepEqual(missed, []);
  assert.deepEqual(boxes.map((box) => box.id), [heading.id, outer.id, dragged.id, inner.id]);
  const source = readFileSync(new URL("../../src/platform/drag/candidates.ts", import.meta.url), "utf8").toLowerCase();
  for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark"]) {
    assert.equal(source.includes(word), false, word);
  }
});
