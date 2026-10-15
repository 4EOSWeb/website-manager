export type ArticleTextNode =
  | { type: "heading"; level: number; text: string }
  | { type: "paragraph"; text: string };

export type ArticleConversion =
  | { ok: true; backupId: string; nodes: ArticleTextNode[]; metadata: { unmappedHtml: string } }
  | { ok: false; reason: string };

type ElementChunk = { tag: string; html: string; inner: string };

const VOID_TAGS = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);

function visibleText(value: string): string {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** Reads elements that are not nested inside another element. */
export function topLevelElements(html: string): ElementChunk[] {
  const items: ElementChunk[] = [];
  let index = 0;
  while (index < html.length) {
    const start = html.indexOf("<", index);
    if (start < 0) break;
    const open = /^<([a-zA-Z][\w:-]*)([^>]*)>/ .exec(html.slice(start));
    if (!open) {
      index = start + 1;
      continue;
    }
    const tag = open[1].toLowerCase();
    const selfClosing = /\/\s*$/.test(open[2] ?? "") || VOID_TAGS.has(tag);
    if (selfClosing) {
      items.push({ tag, html: open[0], inner: "" });
      index = start + open[0].length;
      continue;
    }
    const lower = html.toLowerCase();
    const openToken = `<${tag}`;
    const closeToken = `</${tag}>`;
    let depth = 1;
    let cursor = start + open[0].length;
    let end = -1;
    while (cursor < html.length && depth > 0) {
      const nextOpen = lower.indexOf(openToken, cursor);
      const nextClose = lower.indexOf(closeToken, cursor);
      if (nextClose < 0) break;
      const openIsTag = nextOpen >= 0 && /[\s>/]/.test(html[nextOpen + openToken.length] ?? "");
      if (openIsTag && nextOpen < nextClose) {
        depth += 1;
        cursor = nextOpen + openToken.length;
        continue;
      }
      depth -= 1;
      if (depth === 0) end = nextClose + closeToken.length;
      cursor = nextClose + closeToken.length;
    }
    if (end < 0) break;
    items.push({ tag, html: html.slice(start, end), inner: html.slice(start + open[0].length, end - closeToken.length) });
    index = end;
  }
  return items;
}

/** Turns preserved HTML into headings and paragraphs. Other markup is kept and reported. */
export function convertPreservedHtml(html: string, backupId: string): ArticleConversion {
  if (!backupId.trim()) return { ok: false, reason: "Save a backup before converting this article." };
  const nodes: ArticleTextNode[] = [];
  const skipped: string[] = [];
  for (const element of topLevelElements(html)) {
    if (element.tag === "script" || element.tag === "style") continue;
    if (/^h[1-6]$/.test(element.tag)) {
      const text = visibleText(element.inner);
      if (text) nodes.push({ type: "heading", level: Number(element.tag.slice(1)), text });
      continue;
    }
    if (element.tag === "p") {
      const text = visibleText(element.inner);
      if (text) nodes.push({ type: "paragraph", text });
      continue;
    }
    skipped.push(element.html);
  }
  return { ok: true, backupId, nodes, metadata: { unmappedHtml: skipped.join("\n") } };
}

export function articleConvertVisible(experience: string, canAdminister: boolean): boolean {
  return experience === "administrator" && canAdminister;
}
