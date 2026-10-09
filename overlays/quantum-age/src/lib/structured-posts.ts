import fs from "node:fs";
import path from "node:path";

export type StructuredBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "quote"; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "image"; src: string; alt: string }
  | { type: "link"; href: string; label: string };

export type StructuredPost = {
  title: string;
  slug: string;
  excerpt: string;
  authorDisplayName: string;
  seoTitle: string;
  metaDescription: string;
  blocks: StructuredBlock[];
  featuredImage: { src: string; alt: string } | null;
  publishAt?: string;
  updatedAt: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parsePost(value: unknown, slugFromFile: string): StructuredPost | null {
  if (!isRecord(value) || typeof value.title !== "string" || !Array.isArray(value.blocks)) return null;
  const slug = typeof value.slug === "string" ? value.slug : slugFromFile;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;
  const blocks: StructuredBlock[] = [];
  for (const block of value.blocks) {
    if (!isRecord(block) || typeof block.type !== "string") continue;
    if (block.type === "paragraph" && typeof block.text === "string") blocks.push({ type: "paragraph", text: block.text });
    if (block.type === "heading" && (block.level === 2 || block.level === 3) && typeof block.text === "string") {
      blocks.push({ type: "heading", level: block.level, text: block.text });
    }
    if (block.type === "quote" && typeof block.text === "string") blocks.push({ type: "quote", text: block.text });
    if (block.type === "list" && typeof block.ordered === "boolean" && Array.isArray(block.items)) {
      blocks.push({ type: "list", ordered: block.ordered, items: block.items.filter((item) => typeof item === "string") });
    }
    if (block.type === "table" && Array.isArray(block.headers) && Array.isArray(block.rows)) {
      blocks.push({
        type: "table",
        headers: block.headers.filter((item) => typeof item === "string"),
        rows: block.rows.filter(Array.isArray).map((row) => row.filter((cell) => typeof cell === "string")),
      });
    }
    if (block.type === "image" && typeof block.src === "string") {
      blocks.push({ type: "image", src: block.src, alt: typeof block.alt === "string" ? block.alt : "" });
    }
    if (block.type === "link" && typeof block.href === "string" && typeof block.label === "string") {
      blocks.push({ type: "link", href: block.href, label: block.label });
    }
  }
  if (blocks.length === 0) return null;
  const featured = isRecord(value.featuredImage) && typeof value.featuredImage.src === "string"
    ? { src: value.featuredImage.src, alt: typeof value.featuredImage.alt === "string" ? value.featuredImage.alt : "" }
    : null;
  return {
    title: value.title,
    slug,
    excerpt: typeof value.excerpt === "string" ? value.excerpt : "",
    authorDisplayName: typeof value.authorDisplayName === "string" ? value.authorDisplayName : "Quantum Age",
    seoTitle: typeof value.seoTitle === "string" ? value.seoTitle : value.title,
    metaDescription: typeof value.metaDescription === "string" ? value.metaDescription : "",
    blocks,
    featuredImage: featured,
    publishAt: typeof value.publishAt === "string" ? value.publishAt : "",
    updatedAt: "",
  };
}

export function readStructuredPosts(): StructuredPost[] {
  const dir = path.join(process.cwd(), "src/content/blog");
  if (!fs.existsSync(dir)) return [];
  const posts: StructuredPost[] = [];
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith(".json")) continue;
    try {
      const full = path.join(dir, file);
      const parsed = parsePost(JSON.parse(fs.readFileSync(full, "utf8")), file.replace(/\.json$/, ""));
      if (parsed) posts.push({ ...parsed, updatedAt: fs.statSync(full).mtime.toISOString() });
    } catch {
      continue;
    }
  }
  return posts.sort((a, b) => a.title.localeCompare(b.title));
}

export function readStructuredPost(slug: string): StructuredPost | undefined {
  return readStructuredPosts().find((post) => post.slug === slug);
}
