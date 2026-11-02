export type OverflowMeasure = {
  textWidth: number;
  textHeight: number;
  nodeWidth: number;
  nodeHeight: number;
  parentWidth: number;
  parentHeight: number;
};

/** Warns when text extends past the node or its parent. The text is left as written. */
export function overflowWarning(measure: OverflowMeasure): string | null {
  const pastNode = measure.textWidth > measure.nodeWidth + 1 || measure.textHeight > measure.nodeHeight + 1;
  const pastParent = measure.textWidth > measure.parentWidth + 1 || measure.textHeight > measure.parentHeight + 1;
  if (pastNode || pastParent) return "This item extends outside its section.";
  return null;
}
