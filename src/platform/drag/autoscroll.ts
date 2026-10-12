export const PREVIEW_SCROLL_EDGE_PX = 24;

export type Scrollport = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function previewAutoScroll(
  pointer: { x: number; y: number },
  scrollport: Scrollport,
  dragging: boolean,
  maxStep = 18,
): { x: number; y: number } {
  if (!dragging) return { x: 0, y: 0 };
  if (pointer.x < scrollport.x || pointer.x > scrollport.x + scrollport.width) return { x: 0, y: 0 };
  if (pointer.y < scrollport.y || pointer.y > scrollport.y + scrollport.height) return { x: 0, y: 0 };
  return {
    x: edgeDelta(pointer.x, scrollport.x, scrollport.width, maxStep),
    y: edgeDelta(pointer.y, scrollport.y, scrollport.height, maxStep),
  };
}

function edgeDelta(pointer: number, origin: number, size: number, maxStep: number): number {
  if (pointer < origin || pointer > origin + size) return 0;
  const fromStart = pointer - origin;
  const fromEnd = origin + size - pointer;
  const towardStart = fromStart <= PREVIEW_SCROLL_EDGE_PX && (fromEnd > PREVIEW_SCROLL_EDGE_PX || fromStart <= fromEnd);
  const distance = towardStart ? fromStart : fromEnd;
  if (distance > PREVIEW_SCROLL_EDGE_PX) return 0;
  const magnitude = Math.max(1, Math.ceil(((PREVIEW_SCROLL_EDGE_PX - distance) / PREVIEW_SCROLL_EDGE_PX) * maxStep));
  return towardStart ? -magnitude : magnitude;
}
