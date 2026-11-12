/** Visual document version 1. No site names and no parser. */

export const DOCUMENT_VERSION = 1 as const;

export type NodeType =
  | "container"
  | "text"
  | "image"
  | "button"
  | "link"
  | "list"
  | "divider"
  | "spacer"
  | "form"
  | "embed"
  | "custom"
  | "slot";

export type LayoutMode = "flow" | "layout" | "canvas";

export type FlowKind = "block" | "inline";

export type LayoutKind = "stack" | "grid";

export type Direction = "row" | "column";

export type Align = "start" | "center" | "end" | "stretch";

export type Justify = "start" | "center" | "end" | "between";

export type Wrap = "nowrap" | "wrap";

export type LengthUnit = "px" | "%" | "fr";

export type Anchor = "start" | "center" | "end";

export type ReflowStrategy = "scale" | "reflow" | "custom";

export type BreakpointId = "desktop" | "tablet" | "mobile" | (string & {});

export type Breakpoint = {
  id: BreakpointId;
  minWidth: number;
  label?: string;
  columns?: number;
  margin?: number;
  gap?: number;
};

export type Box = {
  x: number;
  y: number;
  w: number;
  h: number;
  unit: "%";
  anchorX: Anchor;
  anchorY: Anchor;
  z: number;
  rotation?: number;
};

export type Length = {
  value: number;
  unit: LengthUnit;
};

export type Spacing = {
  top?: Length;
  right?: Length;
  bottom?: Length;
  left?: Length;
};

export type NodeStyle = {
  display?: "block" | "flex" | "grid" | "none";
  width?: Length | "auto" | "fill";
  height?: Length | "auto";
  minWidth?: Length;
  maxWidth?: Length;
  margin?: Spacing;
  padding?: Spacing;
  gap?: Length;
  background?: string;
  color?: string;
  fontFamily?: string;
  fontSize?: Length;
  fontWeight?: number;
  lineHeight?: number;
  letterSpacing?: Length;
  textAlign?: "left" | "center" | "right";
  border?: { width: Length; style: "solid" | "dashed" | "none"; color: string };
  radius?: Length;
  shadow?: string;
  opacity?: number;
  overflow?: "visible" | "hidden";
};

export type ResponsiveOverride = {
  hidden?: boolean;
  order?: number;
  style?: Partial<NodeStyle>;
  box?: Partial<Box>;
  layout?: Partial<ContainerLayout>;
};

export type ContainerLayout =
  | {
      mode: "flow";
      flow: FlowKind;
      gap?: Length;
      align?: Align;
    }
  | {
      mode: "layout";
      kind: LayoutKind;
      direction?: Direction;
      columns?: number;
      rows?: "auto";
      gap?: Length;
      align?: Align;
      justify?: Justify;
      wrap?: Wrap;
    }
  | {
      mode: "canvas";
      strategy: ReflowStrategy;
      snap?: number;
    };

export type TextMark = {
  start: number;
  end: number;
  kind: "bold" | "italic" | "underline" | "link" | "color";
  href?: string;
  color?: string;
};

export type RichText = {
  text: string;
  marks: TextMark[];
};

export type Node = {
  id: string;
  type: NodeType;
  name?: string;
  role?: "section" | "header" | "footer" | "navigation" | "article" | "aside";
  locked?: boolean;
  lockId?: string;
  hidden?: boolean;
  componentId?: string;
  props?: Record<string, unknown>;
  text?: RichText;
  href?: string;
  src?: string;
  alt?: string;
  layout?: ContainerLayout;
  style?: NodeStyle;
  box?: Box;
  children?: string[];
  responsive?: Partial<Record<BreakpointId, ResponsiveOverride>>;
  metadata?: Record<string, unknown>;
};

export type PageDocumentV1 = {
  version: typeof DOCUMENT_VERSION;
  id: string;
  route: string;
  name: string;
  title?: string;
  description?: string;
  nodes: Record<string, Node>;
  rootId: string;
  breakpoints?: Breakpoint[];
};

export type VisualDocumentV1 = {
  version: typeof DOCUMENT_VERSION;
  pages: PageDocumentV1[];
};
