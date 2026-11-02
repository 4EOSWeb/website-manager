import { createHash } from "node:crypto";

export type ConvertedImage = {
  id: string;
  type: "image";
  componentId: "image";
  props: { src?: string; alt: string; fit?: unknown; focal?: unknown; caption?: string };
  styles: Record<string, never>;
  responsive: Record<string, never>;
  children: [];
  visibility: { hidden: boolean; hideOn: [] };
  locked: { locked: boolean };
  metadata: { legacyId?: unknown; unmapped?: { src: string; reason: string } };
  source: { origin: "migration"; providerManaged: boolean };
};

function otherWebsite(src: string, websiteId: string) {
  return src.split(/[\\/]/).some((part) => part.startsWith("web_") && part !== websiteId);
}

/** Maps a version 3 image. A path for another website is reported and left out of props. */
export function convertImage(block: Record<string, unknown>, websiteId: string): ConvertedImage {
  const src = typeof block.src === "string" ? block.src : "";
  const foreign = src !== "" && otherWebsite(src, websiteId);
  const props: ConvertedImage["props"] = { alt: typeof block.alt === "string" ? block.alt : "" };
  if (!foreign && src) props.src = src;
  if (block.fit !== undefined) props.fit = block.fit;
  if (block.focal !== undefined) props.focal = block.focal;
  if (typeof block.caption === "string") props.caption = block.caption;
  const id = typeof block.id === "string" ? block.id : src || "image";
  return {
    id: `node_${createHash("sha256").update(id).digest("hex").slice(0, 12)}`,
    type: "image",
    componentId: "image",
    props,
    styles: {},
    responsive: {},
    children: [],
    visibility: { hidden: block.hidden === true, hideOn: [] },
    locked: { locked: block.locked === true },
    metadata: foreign
      ? { legacyId: block.id, unmapped: { src, reason: "site_mismatch" } }
      : { legacyId: block.id },
    source: { origin: "migration", providerManaged: foreign },
  };
}
