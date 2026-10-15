import { createHash } from "node:crypto";

export type TextMigrationAdapter = {
  migrateText: (block: Record<string, unknown>) => { type: "heading" | "text" | "richtext"; role?: string } | null;
};

export type ConvertedText = {
  id: string;
  type: "heading" | "text" | "richtext";
  componentId: string;
  props: { text: string; marks: unknown[]; role?: string; textStyle?: unknown };
  styles: Record<string, never>;
  responsive: Record<string, never>;
  children: [];
  visibility: { hidden: boolean; hideOn: [] };
  locked: { locked: boolean };
  metadata: { legacyId?: unknown };
  source: { origin: "migration"; providerManaged: false };
};

function readRich(value: unknown): { text: string; marks: unknown[] } {
  if (typeof value === "string") return { text: value, marks: [] };
  if (value && typeof value === "object" && "text" in value) {
    const rich = value as { text?: unknown; marks?: unknown };
    return {
      text: typeof rich.text === "string" ? rich.text : "",
      marks: Array.isArray(rich.marks) ? rich.marks : [],
    };
  }
  return { text: "", marks: [] };
}

/** Maps a version 3 text block using the adapter's kind map. */
export function convertText(block: Record<string, unknown>, adapter: TextMigrationAdapter): ConvertedText | null {
  const mapped = adapter.migrateText(block);
  if (!mapped) return null;
  const rich = readRich(block.text);
  const props: ConvertedText["props"] = { text: rich.text, marks: rich.marks };
  if (mapped.role) props.role = mapped.role;
  if (block.textStyle) props.textStyle = block.textStyle;
  const id = typeof block.id === "string" ? block.id : JSON.stringify(block);
  return {
    id: `node_${createHash("sha256").update(id).digest("hex").slice(0, 12)}`,
    type: mapped.type,
    componentId: mapped.type,
    props,
    styles: {},
    responsive: {},
    children: [],
    visibility: { hidden: block.hidden === true, hideOn: [] },
    locked: { locked: block.locked === true },
    metadata: { legacyId: block.id },
    source: { origin: "migration", providerManaged: false },
  };
}
