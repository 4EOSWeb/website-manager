import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dropCompatibility } from "../../src/platform/drag/compatibility.ts";

const openParent = { acceptsChildren: true as const };
const stackParents = { allowedParents: ["section", "container", "stack", "grid", "group"] };

test("locks and parent rules decide a drop", () => {
  assert.equal(dropCompatibility({
    draggedLocked: true,
    childType: "heading",
    childParents: stackParents,
    parentType: "stack",
    parentChildren: openParent,
  }), "locked");
  assert.equal(dropCompatibility({
    draggedLocked: false,
    childType: "button",
    childParents: stackParents,
    parentType: "text",
    parentChildren: { acceptsChildren: false },
  }), "parent_rejected");
  assert.equal(dropCompatibility({
    draggedLocked: false,
    childType: "heading",
    childParents: stackParents,
    parentType: "stack",
    parentChildren: openParent,
  }), "ok");
  const source = readFileSync(new URL("../../src/platform/drag/compatibility.ts", import.meta.url), "utf8").toLowerCase();
  for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark"]) {
    assert.equal(source.includes(word), false, word);
  }
});
