// Inlined into the preview script with Function.prototype.toString. Keep every function self-contained.

export type MarkKind = "bold" | "italic" | "underline" | "link" | "color";
export type Mark = { start: number; end: number; kind: MarkKind; href?: string; color?: string };

/**
 * Turn a mark on or off across [start, end). When every character in the range already carries the
 * mark (with the same href or colour), it is removed; otherwise it is applied. Pass `force` to skip
 * the toggle and always apply (`true`) or remove (`false`).
 */
export function toggleMark(marks: Mark[], length: number, start: number, end: number, kind: MarkKind, value: string, force?: boolean): Mark[] {
  const from = Math.max(0, Math.min(start, end));
  const to = Math.min(length, Math.max(start, end));
  if (to <= from) return marks.slice();
  const slots: (string | null)[] = new Array(length).fill(null);
  const others: Mark[] = [];
  for (const mark of marks) {
    if (mark.kind !== kind) {
      others.push(mark);
      continue;
    }
    const tag = kind === "link" ? mark.href ?? "" : kind === "color" ? mark.color ?? "" : "on";
    for (let index = Math.max(0, mark.start); index < Math.min(length, mark.end); index += 1) slots[index] = tag;
  }
  const wanted = kind === "link" || kind === "color" ? value : "on";
  let covered = true;
  for (let index = from; index < to; index += 1) {
    if (slots[index] !== wanted) {
      covered = false;
      break;
    }
  }
  const apply = force === undefined ? !covered : force;
  for (let index = from; index < to; index += 1) slots[index] = apply ? wanted : null;
  const runs: Mark[] = [];
  let runStart = -1;
  for (let index = 0; index <= length; index += 1) {
    const current = index < length ? slots[index] : null;
    const previous = index > 0 ? slots[index - 1] : null;
    if (runStart >= 0 && current !== previous) {
      const run: Mark = { start: runStart, end: index, kind };
      if (kind === "link") run.href = previous ?? "";
      if (kind === "color") run.color = previous ?? "";
      runs.push(run);
      runStart = -1;
    }
    if (current !== null && runStart < 0) runStart = index;
  }
  return others.concat(runs).sort((a, b) => a.start - b.start || a.kind.localeCompare(b.kind));
}

/** Remove every mark inside [start, end). With an empty range, remove every mark. */
export function clearMarks(marks: Mark[], length: number, start: number, end: number): Mark[] {
  if (end <= start) return [];
  const kinds: MarkKind[] = ["bold", "italic", "underline", "link", "color"];
  let next = marks.slice();
  for (const kind of kinds) {
    const from = Math.max(0, start);
    const to = Math.min(length, end);
    const slots: (string | null)[] = new Array(length).fill(null);
    const others: Mark[] = [];
    for (const mark of next) {
      if (mark.kind !== kind) {
        others.push(mark);
        continue;
      }
      const tag = kind === "link" ? mark.href ?? "" : kind === "color" ? mark.color ?? "" : "on";
      for (let index = Math.max(0, mark.start); index < Math.min(length, mark.end); index += 1) slots[index] = tag;
    }
    for (let index = from; index < to; index += 1) slots[index] = null;
    const runs: Mark[] = [];
    let runStart = -1;
    for (let index = 0; index <= length; index += 1) {
      const current = index < length ? slots[index] : null;
      const previous = index > 0 ? slots[index - 1] : null;
      if (runStart >= 0 && current !== previous) {
        const run: Mark = { start: runStart, end: index, kind };
        if (kind === "link") run.href = previous ?? "";
        if (kind === "color") run.color = previous ?? "";
        runs.push(run);
        runStart = -1;
      }
      if (current !== null && runStart < 0) runStart = index;
    }
    next = others.concat(runs);
  }
  return next.sort((a, b) => a.start - b.start || a.kind.localeCompare(b.kind));
}

/** Whether every character in [start, end) carries the mark. A collapsed range checks the character before it. */
export function hasMark(marks: Mark[], start: number, end: number, kind: MarkKind): boolean {
  const from = end > start ? start : Math.max(0, start - 1);
  const to = end > start ? end : from + 1;
  for (let index = from; index < to; index += 1) {
    if (!marks.some((mark) => mark.kind === kind && mark.start <= index && mark.end > index)) return false;
  }
  return true;
}

/** Render text and marks as the same nested HTML the website renderer produces. */
export function marksToHtml(text: string, marks: Mark[]): string {
  const escape = (value: string) =>
    value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const points = [0, text.length];
  for (const mark of marks) points.push(mark.start, mark.end);
  const cuts = points.filter((point, index) => point >= 0 && point <= text.length && points.indexOf(point) === index).sort((a, b) => a - b);
  let html = "";
  for (let index = 0; index < cuts.length - 1; index += 1) {
    const start = cuts[index];
    const end = cuts[index + 1];
    const active = marks.filter((mark) => mark.start <= start && mark.end >= end);
    let node = escape(text.slice(start, end));
    if (active.some((mark) => mark.kind === "italic")) node = "<em>" + node + "</em>";
    if (active.some((mark) => mark.kind === "bold")) node = "<strong>" + node + "</strong>";
    if (active.some((mark) => mark.kind === "underline")) node = "<u>" + node + "</u>";
    const color = active.find((mark) => mark.kind === "color");
    if (color && color.color) node = '<span style="color:' + escape(color.color) + '" data-color="' + escape(color.color) + '">' + node + "</span>";
    const link = active.find((mark) => mark.kind === "link");
    if (link && link.href) node = '<a href="' + escape(link.href) + '">' + node + "</a>";
    html += node;
  }
  return html;
}

export function validLink(href: string): boolean {
  return /^(\/[^\s]*|https:\/\/[^\s.]+\.[^\s]+|mailto:[^\s@]+@[^\s@]+|tel:\+?[\d\s()-]{5,})$/.test(href.trim());
}
