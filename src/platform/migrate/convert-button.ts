import { createHash } from "node:crypto";

const hideOnValues = ["desktop", "tablet", "mobile"] as const;

export type ButtonMigrationAdapter = {
  migrateButton: (block: Record<string, unknown>) => { componentId: string } | null;
};

export type ConvertedButton = {
  id: string;
  type: "button";
  componentId: string;
  props: {
    label: string;
    href: string;
    target?: unknown;
    variant?: unknown;
    size?: unknown;
    icon?: unknown;
    width?: unknown;
    align?: unknown;
  };
  styles: Record<string, never>;
  responsive: Record<string, never>;
  children: [];
  visibility: { hidden: boolean; hideOn: string[] };
  locked: { locked: boolean };
  metadata: { legacyId?: unknown };
  source: { origin: "migration"; providerManaged: false };
};

function labelOf(block: Record<string, unknown>) {
  if (typeof block.label === "string") return block.label;
  if (typeof block.text === "string") return block.text;
  if (block.text && typeof block.text === "object" && "text" in block.text && typeof block.text.text === "string") return block.text.text;
  return "";
}

/** Maps a version 3 button. The adapter chooses the component id. */
export function convertButton(block: Record<string, unknown>, adapter: ButtonMigrationAdapter): ConvertedButton | null {
  if (block.kind !== "button") return null;
  const mapped = adapter.migrateButton(block);
  const hideOn = Array.isArray(block.hideOn) ? block.hideOn.filter((value): value is string => typeof value === "string" && hideOnValues.includes(value as (typeof hideOnValues)[number])) : [];
  const props: ConvertedButton["props"] = {
    label: labelOf(block),
    href: typeof block.href === "string" ? block.href : "",
  };
  for (const key of ["target", "variant", "size", "icon", "width", "align"] as const) {
    if (block[key] !== undefined) props[key] = block[key];
  }
  const id = typeof block.id === "string" ? block.id : JSON.stringify(block);
  return {
    id: `node_${createHash("sha256").update(id).digest("hex").slice(0, 12)}`,
    type: "button",
    componentId: mapped?.componentId ?? "generic.button",
    props,
    styles: {},
    responsive: {},
    children: [],
    visibility: { hidden: block.hidden === true, hideOn },
    locked: { locked: block.locked === true },
    metadata: { legacyId: block.id },
    source: { origin: "migration", providerManaged: false },
  };
}
