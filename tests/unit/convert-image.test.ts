import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import { convertImage } from "../../src/platform/migrate/convert-image.ts";

test("image paths are copied, and another website id is left unmapped", () => {
  const image = convertImage({
    id: "blk_img",
    kind: "image",
    src: "/media/photo.png",
    alt: "Photo",
    fit: "fill",
    focal: "top",
    caption: "Caption",
  }, "web_example");
  assert.equal(image.props.src, "/media/photo.png");
  assert.equal(image.props.alt, "Photo");
  assert.equal(image.props.fit, "fill");
  assert.equal(image.props.focal, "top");
  assert.equal(image.props.caption, "Caption");
  assert.equal(image.metadata.unmapped, undefined);

  const foreign = convertImage({ id: "blk_other", src: "/media/web_other/photo.png", alt: "Other" }, "web_example");
  assert.equal(foreign.props.src, undefined);
  assert.equal(JSON.stringify(foreign.props).includes("web_other"), false);
  assert.equal(foreign.metadata.unmapped?.src, "/media/web_other/photo.png");
  assert.equal(fs.readFileSync("src/platform/migrate/convert-image.ts", "utf8").includes("rename"), false);
});
