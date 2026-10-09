import type { EditorSection } from "@/lib/editor-site";

export function hideClass(section: EditorSection) {
  const hide = section.hideOn ?? [];
  return [
    hide.includes("desktop") ? "lg:hidden" : "",
    hide.includes("tablet") ? "max-lg:hidden sm:max-md:hidden" : "",
    hide.includes("mobile") ? "sm:max-md:hidden max-sm:hidden" : "",
  ].join(" ");
}

export function styleFor(section: EditorSection): React.CSSProperties {
  const style = section.style;
  if (!style) return {};
  const pad = style.padding === "s" ? "2rem" : style.padding === "l" ? "6rem" : "4rem";
  const min = style.minHeight === "quarter" ? "25vh" : style.minHeight === "half" ? "50vh" : style.minHeight === "full" ? "100vh" : undefined;
  return {
    paddingTop: pad,
    paddingBottom: pad,
    minHeight: min,
    background: style.background === "ink" ? "#231a25" : style.background === "band" ? "#efebe4" : style.color,
    color: style.background === "ink" ? "#f7f5f0" : undefined,
  };
}
