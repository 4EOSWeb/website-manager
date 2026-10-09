export const THEME_COLORS = ["#1c1915", "#5c3d6e", "#3f6b4a", "#8c4a2f", "#f7f4ef", "#ffffff"] as const;

export type RichMark = {
  start: number;
  end: number;
  kind: "bold" | "italic" | "underline" | "link" | "color";
  href?: string;
  color?: string;
};

export type RichText = { text: string; marks: RichMark[] };

export function plainText(value: RichText | string | undefined, fallback = ""): string {
  if (!value) return fallback;
  return typeof value === "string" ? value : value.text;
}

export function asRich(value: RichText | string | undefined, fallback = ""): RichText {
  if (!value) return { text: fallback, marks: [] };
  if (typeof value === "string") return { text: value, marks: [] };
  return { text: value.text, marks: sanitizeMarks(value.text, value.marks) };
}

export function sanitizeMarks(text: string, marks: RichMark[] | undefined): RichMark[] {
  if (!marks) return [];
  const allowed = new Set(["bold", "italic", "underline", "link", "color"]);
  return marks
    .filter((mark) => {
      if (!allowed.has(mark.kind)) return false;
      if (!Number.isInteger(mark.start) || !Number.isInteger(mark.end)) return false;
      if (mark.start < 0 || mark.end > text.length || mark.start >= mark.end) return false;
      if (mark.kind === "link") {
        const href = mark.href ?? "";
        if (!/^(\/|https:\/\/|mailto:|tel:)/.test(href)) return false;
      }
      if (mark.kind === "color" && mark.color && !THEME_COLORS.includes(mark.color.toLowerCase() as (typeof THEME_COLORS)[number])) return false;
      return true;
    })
    .slice(0, 40);
}
