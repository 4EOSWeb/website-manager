import { createHash } from "node:crypto";

export type SectionMigrationAdapter = {
  migrateSection: (section: Record<string, unknown>) => { componentId: string } | null;
};

export type ConvertedSection = {
  id: string;
  type: "section" | "custom";
  componentId: string;
  props: Record<string, never>;
  styles: Record<string, never>;
  responsive: Record<string, never>;
  children: [];
  visibility: { hidden: boolean; hideOn: [] };
  locked: { locked: boolean };
  metadata: { legacyId?: unknown; unmapped?: unknown };
  layout?: { mode: "flow"; direction: "vertical"; gap: number } | { mode: "canvas"; snap: number; showGrid: boolean };
  source: { origin: "migration"; providerManaged: boolean };
};

function nodeId(value: string) {
  return `node_${createHash("sha256").update(value).digest("hex").slice(0, 12)}`;
}

function shell(section: Record<string, unknown>, overrides: Partial<ConvertedSection>): ConvertedSection {
  return {
    id: nodeId(typeof section.id === "string" ? section.id : JSON.stringify(section)),
    type: "section",
    componentId: "section",
    props: {},
    styles: {},
    responsive: {},
    children: [],
    visibility: { hidden: section.hidden === true, hideOn: [] },
    locked: { locked: section.locked === true || section.providerLocked === true },
    metadata: { legacyId: section.id },
    source: { origin: "migration", providerManaged: section.providerLocked === true },
    ...overrides,
  };
}

/** Maps one version 3 section to a container. The site adapter supplies preset component ids. */
export function convertSection(section: Record<string, unknown>, adapter: SectionMigrationAdapter): ConvertedSection {
  if (section.type === "flow") {
    return shell(section, { layout: { mode: "flow", direction: "vertical", gap: 16 } });
  }
  if (section.type === "freeform") {
    return shell(section, { layout: { mode: "canvas", snap: 8, showGrid: false } });
  }
  if (section.type === "preset") {
    const mapped = adapter.migrateSection(section);
    if (mapped) {
      return shell(section, { type: "custom", componentId: mapped.componentId });
    }
  }
  return shell(section, {
    type: "custom",
    componentId: "custom",
    metadata: { legacyId: section.id, unmapped: structuredClone(section) },
    source: { origin: "migration", providerManaged: true },
  });
}
