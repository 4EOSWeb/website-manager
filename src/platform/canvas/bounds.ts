export type ParentBounds = { width: number; height: number };

type PaddingStyle = {
  paddingTop: string;
  paddingRight: string;
  paddingBottom: string;
  paddingLeft: string;
};

type Measurable = {
  clientWidth: number;
  clientHeight: number;
  ownerDocument?: {
    defaultView?: {
      getComputedStyle?: (element: Measurable) => PaddingStyle;
    } | null;
  } | null;
};

function pixels(value: string | undefined): number {
  const parsed = Number.parseFloat(value ?? "");
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Content box of a canvas parent. Padding is removed. The viewport is not an input. */
export function parentBounds(element: Measurable): ParentBounds {
  const style = element.ownerDocument?.defaultView?.getComputedStyle?.(element);
  const width = element.clientWidth - pixels(style?.paddingLeft) - pixels(style?.paddingRight);
  const height = element.clientHeight - pixels(style?.paddingTop) - pixels(style?.paddingBottom);
  return { width: Math.max(0, width), height: Math.max(0, height) };
}
