import { test } from "node:test";
import assert from "node:assert/strict";
import { clearMarks, hasMark, marksToHtml, toggleMark, validLink } from "../../overlays/quantum-age/src/components/site/canvas/marks.ts";

test("bold applies to the selected words only", () => {
  assert.deepEqual(toggleMark([], 11, 0, 5, "bold", ""), [{ start: 0, end: 5, kind: "bold" }]);
});

test("bold toggles off when the whole range is already bold", () => {
  const marks = toggleMark([], 11, 0, 5, "bold", "");
  assert.deepEqual(toggleMark(marks, 11, 0, 5, "bold", ""), []);
});

test("toggling part of a bold run splits it", () => {
  const marks = [{ start: 0, end: 11, kind: "bold" as const }];
  assert.deepEqual(toggleMark(marks, 11, 3, 5, "bold", ""), [
    { start: 0, end: 3, kind: "bold" },
    { start: 5, end: 11, kind: "bold" },
  ]);
});

test("a partly bold range becomes fully bold and merges", () => {
  const marks = [{ start: 0, end: 3, kind: "bold" as const }];
  assert.deepEqual(toggleMark(marks, 11, 2, 6, "bold", ""), [{ start: 0, end: 6, kind: "bold" }]);
});

test("other kinds are left alone", () => {
  const marks = [{ start: 0, end: 4, kind: "italic" as const }];
  const next = toggleMark(marks, 10, 0, 4, "underline", "");
  assert.equal(next.length, 2);
  assert.ok(next.some((mark) => mark.kind === "italic"));
});

test("links replace an existing link with a different address", () => {
  const marks = [{ start: 0, end: 4, kind: "link" as const, href: "/a" }];
  assert.deepEqual(toggleMark(marks, 10, 0, 4, "link", "/b", true), [{ start: 0, end: 4, kind: "link", href: "/b" }]);
  assert.deepEqual(toggleMark(marks, 10, 0, 4, "link", "", false), []);
});

test("an empty range changes nothing", () => {
  const marks = [{ start: 0, end: 4, kind: "bold" as const }];
  assert.deepEqual(toggleMark(marks, 10, 2, 2, "bold", ""), marks);
});

test("clear removes marks in the range, or everything when the range is empty", () => {
  const marks = [
    { start: 0, end: 10, kind: "bold" as const },
    { start: 2, end: 6, kind: "color" as const, color: "#5c3d6e" },
  ];
  assert.deepEqual(clearMarks(marks, 10, 0, 5), [
    { start: 5, end: 10, kind: "bold" },
    { start: 5, end: 6, kind: "color", color: "#5c3d6e" },
  ]);
  assert.deepEqual(clearMarks(marks, 10, 3, 3), []);
});

test("hasMark checks full coverage", () => {
  const marks = [{ start: 0, end: 4, kind: "bold" as const }];
  assert.equal(hasMark(marks, 0, 4, "bold"), true);
  assert.equal(hasMark(marks, 0, 5, "bold"), false);
  assert.equal(hasMark(marks, 2, 2, "bold"), true);
});

test("html nesting matches the website renderer and escapes text", () => {
  const html = marksToHtml("a <b> c", [
    { start: 0, end: 1, kind: "bold" },
    { start: 0, end: 1, kind: "italic" },
    { start: 6, end: 7, kind: "link", href: "/contact" },
  ]);
  assert.equal(html, '<strong><em>a</em></strong> &lt;b&gt; <a href="/contact">c</a>');
});

test("links must be site paths, https, email, or phone", () => {
  assert.ok(validLink("/contact"));
  assert.ok(validLink("https://example.com/page"));
  assert.ok(validLink("mailto:hello@example.com"));
  assert.ok(validLink("tel:+1 555 123 4567"));
  assert.ok(!validLink("javascript:alert(1)"));
  assert.ok(!validLink("http://example.com"));
  assert.ok(!validLink("contact"));
});
