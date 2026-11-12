import assert from "node:assert/strict";
import test from "node:test";
import { publishFailure, publishOutcome } from "../../src/lib/publish-copy.ts";

test("local and review outcomes use different sentences", () => {
  assert.equal(publishOutcome("SAVED_LOCALLY", null), "Saved for review on this copy. A pull request was not opened.");
  assert.equal(publishOutcome("AWAITING_REVIEW", null), "Sent for review.");
  assert.equal(publishOutcome("AWAITING_REVIEW", "https://example.test/pull/1"), "Sent for review. https://example.test/pull/1");
  assert.equal(publishOutcome("SAVED_LOCALLY", null)?.includes("already changed"), false);
  assert.equal(publishOutcome("LIVE"), null);
});

test("unsafe publish failures use the generic sentence", () => {
  assert.equal(publishFailure("The review could not be opened."), "The review could not be opened.");
  assert.equal(publishFailure("Error: stack\n    at publish"), "The review could not be sent.");
  assert.equal(publishFailure(undefined), "The review could not be sent.");
});
