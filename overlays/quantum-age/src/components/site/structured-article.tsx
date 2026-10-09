import type { StructuredPost } from "@/lib/structured-posts";

/** Renders a structured Insights draft as text, never as HTML. */
export function StructuredArticle({ post }: { post: StructuredPost }) {
  return (
    <div id="article-body" className="prose-article">
      {post.blocks.map((block, index) => {
        if (block.type === "heading" && block.level === 2) {
          return <h2 key={index} data-blog-block={index} data-field="text">{block.text}</h2>;
        }
        if (block.type === "heading") return <h3 key={index} data-blog-block={index} data-field="text">{block.text}</h3>;
        if (block.type === "quote") return <blockquote key={index} data-blog-block={index} data-field="text">{block.text}</blockquote>;
        if (block.type === "list") {
          const List = block.ordered ? "ol" : "ul";
          return (
            <List key={index}>
              {block.items.map((item, itemIndex) => (
                <li key={`${item}-${itemIndex}`} data-blog-block={index} data-field={`item.${itemIndex}`}>{item}</li>
              ))}
            </List>
          );
        }
        if (block.type === "table") {
          return (
            <table key={index}>
              <thead>
                <tr>
                  {block.headers.map((header, headerIndex) => (
                    <th key={headerIndex} data-blog-block={index} data-field={`header.${headerIndex}`}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} data-blog-block={index} data-field={`cell.${rowIndex}.${cellIndex}`}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          );
        }
        if (block.type === "image") {
          return block.src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={index} src={block.src} alt={block.alt} data-image="true" data-blog-block={index} />
          ) : (
            <p key={index}>Add your first image</p>
          );
        }
        if (block.type === "link") {
          return (
            <p key={index}>
              <a href={block.href} data-blog-block={index} data-field="label">{block.label}</a>
            </p>
          );
        }
        return <p key={index} data-blog-block={index} data-field="text">{block.text}</p>;
      })}
    </div>
  );
}
