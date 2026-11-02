// Inlined into the preview script with Function.prototype.toString. Keep it self-contained.

export type Placement = { top: number; left: number; side: "above" | "below" | "inside" };

/**
 * Place a floating bar next to a target. Coordinates are viewport pixels. `topInset` keeps the bar
 * clear of a sticky site header; `gap` is the space between the bar and the target outline.
 */
export function placeToolbar(
  target: { top: number; left: number; width: number; height: number },
  bar: { width: number; height: number },
  viewport: { width: number; height: number },
  topInset: number,
  gap: number,
): Placement {
  const margin = 8;
  const minTop = Math.max(margin, topInset + margin);
  let side: Placement["side"] = "above";
  let top = target.top - bar.height - gap;
  if (top < minTop) {
    const below = target.top + target.height + gap;
    if (below + bar.height <= viewport.height - margin) {
      side = "below";
      top = below;
    } else {
      side = "inside";
      top = Math.max(minTop, Math.min(target.top + gap, viewport.height - bar.height - margin));
    }
  }
  const maxLeft = Math.max(margin, viewport.width - bar.width - margin);
  const left = Math.max(margin, Math.min(target.left, maxLeft));
  return { top: Math.round(top), left: Math.round(left), side };
}
