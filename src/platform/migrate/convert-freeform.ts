type CanvasBox = { x: number; y: number; w: number; h: number };

export type FreeformAdapter = {
  breakpointWidth: (id: "desktop" | "tablet" | "mobile") => number;
};

export type FreeformWarning = { id: string; message: string };

type Placement = { x?: unknown; y?: unknown; w?: unknown; h?: unknown };

export type ConvertedFreeformItem = {
  id: string;
  type: string;
  componentId: string;
  props: Record<string, unknown>;
  styles: Record<string, never>;
  responsive: {
    strategy: "custom" | "reflow";
    tablet?: { box: CanvasBox };
    mobile?: { box: CanvasBox };
  };
  children: ConvertedFreeformItem[];
  visibility: { hidden: boolean; hideOn: [] };
  locked: { locked: boolean };
  metadata: { legacyId?: unknown; unmapped?: unknown };
  box?: CanvasBox;
  source: { origin: "migration"; providerManaged: boolean };
};

/**
 * Placement formula. The result is a parent-relative percentage from 0 to 100.
 * If every value is already between 0 and 1, it is a share and is multiplied by 100.
 * If every value is already between 0 and 100, it is kept.
 * If a value is pixels, it is divided by the adapter breakpoint width, multiplied by 100, and clamped to 0–100.
 */
export function placementToPercent(placement: Placement, width: number): CanvasBox | null {
  const raw = [placement.x, placement.y, placement.w, placement.h];
  if (raw.some((value) => typeof value !== "number" || !Number.isFinite(value))) return null;
  const numbers = raw as number[];
  const max = Math.max(...numbers);
  const convert = (value: number) => {
    const percent = max <= 1 ? value * 100 : max <= 100 ? value : (value / width) * 100;
    return Math.min(100, Math.max(0, percent));
  };
  return {
    x: convert(numbers[0]!),
    y: convert(numbers[1]!),
    w: convert(numbers[2]!),
    h: convert(numbers[3]!),
  };
}

const nodeTypes: Record<string, string> = {
  text: "text",
  heading: "heading",
  image: "image",
  button: "button",
};

function itemNode(item: Record<string, unknown>, adapter: FreeformAdapter, warnings: FreeformWarning[]): ConvertedFreeformItem {
  const id = typeof item.id === "string" ? item.id : "item";
  const desktop = placementToPercent((item.desktop ?? {}) as Placement, adapter.breakpointWidth("desktop"));
  const tablet = item.tablet ? placementToPercent(item.tablet as Placement, adapter.breakpointWidth("tablet")) : undefined;
  const mobile = item.mobile ? placementToPercent(item.mobile as Placement, adapter.breakpointWidth("mobile")) : undefined;
  const failed = !desktop || (item.tablet && !tablet) || (item.mobile && !mobile);
  if (failed) warnings.push({ id, message: "This item could not be placed." });
  const kind = typeof item.kind === "string" ? item.kind : "custom";
  const smaller = Boolean(item.tablet || item.mobile);
  return {
    id,
    type: nodeTypes[kind] ?? "custom",
    componentId: nodeTypes[kind] ?? "custom",
    props: {},
    styles: {},
    responsive: {
      strategy: smaller ? "custom" : "reflow",
      ...(tablet ? { tablet: { box: tablet } } : {}),
      ...(mobile ? { mobile: { box: mobile } } : {}),
    },
    children: [],
    visibility: { hidden: item.hidden === true, hideOn: [] },
    locked: { locked: item.locked === true },
    metadata: failed ? { legacyId: item.id, unmapped: structuredClone(item) } : { legacyId: item.id },
    ...(desktop ? { box: desktop } : {}),
    source: { origin: "migration", providerManaged: Boolean(failed) },
  };
}

/** Maps freeform items to canvas children. Failed items stay in the list. */
export function convertFreeform(section: { items?: Record<string, unknown>[] }, adapter: FreeformAdapter): { children: ConvertedFreeformItem[]; warnings: FreeformWarning[] } {
  const warnings: FreeformWarning[] = [];
  const items = section.items ?? [];
  const groups = new Map<string, ConvertedFreeformItem>();
  const children: ConvertedFreeformItem[] = [];
  for (const item of items) {
    const node = itemNode(item, adapter, warnings);
    const groupId = typeof item.groupId === "string" ? item.groupId : "";
    if (!groupId) {
      children.push(node);
      continue;
    }
    let group = groups.get(groupId);
    if (!group) {
      group = {
        id: groupId,
        type: "group",
        componentId: "group",
        props: {},
        styles: {},
        responsive: { strategy: "reflow" },
        children: [],
        visibility: { hidden: false, hideOn: [] },
        locked: { locked: false },
        metadata: {},
        source: { origin: "migration", providerManaged: false },
      };
      groups.set(groupId, group);
      children.push(group);
    }
    group.children.push(node);
    if (node.responsive.strategy === "custom") group.responsive.strategy = "custom";
  }
  return { children, warnings };
}
