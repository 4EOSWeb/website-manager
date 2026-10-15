export type CandidateBox = {
  id: string;
  type: string;
  depth: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

const containerTypes = new Set(["page", "section", "container", "stack", "grid", "group", "card", "form"]);

function contains(box: CandidateBox, x: number, y: number) {
  return x >= box.x && y >= box.y && x < box.x + box.width && y < box.y + box.height;
}

/**
 * Containers under a pointer, deepest first.
 * The dragged node is never a candidate for itself.
 */
export function candidateParents(boxes: readonly CandidateBox[], draggedId: string, x: number, y: number): string[] {
  return boxes
    .filter((box) => box.id !== draggedId && containerTypes.has(box.type) && contains(box, x, y))
    .slice()
    .sort((left, right) => right.depth - left.depth)
    .map((box) => box.id);
}
