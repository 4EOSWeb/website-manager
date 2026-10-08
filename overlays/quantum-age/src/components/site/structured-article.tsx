import type { StructuredPost } from "@/lib/structured-posts";

/** Renders a structured Insights draft as text, never as HTML. */
export function StructuredArticle({ post }: { post: StructuredPost }) {
  return (
    <div id="article-body" className="prose-article">
      {post.blocks.map((block, index) => {
        if (block.type === "heading" && block.level === 2) return <h2 key={index}>{block.text}</h2>;
        if (block.type === "heading") return <h3 key={index}>{block.text}</h3>;
        if (block.type === "quote") return <blockquote key={index}>{block.text}</blockquote>;
        if (block.type === "list") {
          const List = block.ordered ? "ol" : "ul";
          return (
            <List key={index}>
              {block.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </List>
          );
        }
        return <p key={index}>{block.text}</p>;
      })}
    </div>
  );
}
