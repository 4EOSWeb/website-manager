import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import { migrateButton } from "../../adapters/quantum-age/migrate-map.ts";
import { convertButton } from "../../src/platform/migrate/convert-button.ts";

test("button label and href are copied, and the component id comes from the adapter", () => {
  const button = convertButton({
    id: "blk_btn",
    kind: "button",
    label: "Start",
    href: "/contact",
    target: "same",
    variant: "filled",
    size: "m",
    icon: "arrow",
    width: "m",
    align: "start",
    hideOn: ["mobile"],
    heroImage: { src: "/media/hero.png", alt: "Hero" },
    tagline: "Do not copy",
  }, { migrateButton });
  assert.ok(button);
  assert.equal(button.props.label, "Start");
  assert.equal(button.props.href, "/contact");
  assert.equal(button.props.target, "same");
  assert.equal(button.componentId, "quantum-age.button");
  assert.deepEqual(button.visibility.hideOn, ["mobile"]);
  assert.equal(JSON.stringify(button.props).includes("heroImage"), false);
  assert.equal(JSON.stringify(button.props).includes("Do not copy"), false);

  const generic = convertButton({ id: "blk_g", kind: "button", text: { text: "Go" }, href: "/go" }, { migrateButton: () => null });
  assert.equal(generic?.componentId, "generic.button");
  assert.equal(generic?.props.label, "Go");
  assert.equal(fs.readFileSync("src/platform/migrate/convert-button.ts", "utf8").includes("quantum-age.button"), false);
  assert.match(fs.readFileSync("adapters/quantum-age/migrate-map.ts", "utf8"), /quantum-age\.button/);
});
