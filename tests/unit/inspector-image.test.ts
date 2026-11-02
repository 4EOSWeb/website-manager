import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import type { SiteDraft } from "../../src/lib/content-schema.ts";
import { imageAltWarning, replaceImageSrc } from "../../src/components/editor/inspector/image-model.ts";

test("replace writes src on the selected image only, and an empty alt keeps the warning", () => {
  const image = { id: "blk_new", kind: "image" as const, hidden: false, src: "", alt: "" };
  const other = { id: "blk_old", kind: "image" as const, hidden: false, src: "/media/kept.png", alt: "Kept" };
  const site = {
    pages: [{
      route: "/",
      sections: [
        { id: "sec_flow", type: "flow" as const, hidden: false, blocks: [image, other] },
        { id: "sec_preset", type: "preset" as const, hidden: false, heroImage: { src: "/media/banner.png", alt: "Banner" } },
      ],
    }],
  } as unknown as SiteDraft;
  const next = replaceImageSrc(site, "/", "sec_flow", "blk_new", "/media/photo.png");
  const flow = next.pages[0]?.sections[0];
  assert.equal(flow?.type, "flow");
  if (flow?.type !== "flow") return;
  assert.equal(flow.blocks[0]?.src, "/media/photo.png");
  assert.equal(flow.blocks[0]?.alt, "");
  assert.equal(flow.blocks[1]?.src, "/media/kept.png");
  assert.equal(flow.blocks[1]?.alt, "Kept");
  const preset = next.pages[0]?.sections[1];
  assert.equal(preset?.type, "preset");
  if (preset?.type !== "preset") return;
  assert.equal(preset.heroImage?.src, "/media/banner.png");
  assert.equal(preset.heroImage?.alt, "Banner");
  assert.equal(image.src, "");
  assert.equal(imageAltWarning("/media/photo.png", ""), "Describe the picture.");
  assert.equal(imageAltWarning("/media/photo.png", "A team photo"), "");
  assert.equal(imageAltWarning("", ""), "");
  const fields = readFileSync("src/components/editor/inspector/image-fields.tsx", "utf8");
  const model = readFileSync("src/components/editor/inspector/image-model.ts", "utf8");
  assert.equal(fields.includes("Choose image"), true);
  assert.equal(fields.includes("Crop"), true);
  assert.equal(fields.includes("imageAltWarning"), true);
  assert.equal(fields.includes('role="alert"'), true);
  assert.equal(model.includes("Describe the picture."), true);
  assert.equal(fields.includes("Image fit"), true);
  const lowered = `${fields}\n${model}`.toLowerCase();
  assert.equal(lowered.includes("quantum"), false);
  assert.equal(lowered.includes("plum"), false);
  assert.equal(lowered.includes("hero"), false);
  const blocks = readFileSync("src/components/editor/inspector/blocks.tsx", "utf8");
  assert.equal(blocks.includes("openCrop"), true);
  const shell = readFileSync("src/components/editor-shell.tsx", "utf8");
  assert.equal(shell.includes("replaceImageSrc"), true);
});
