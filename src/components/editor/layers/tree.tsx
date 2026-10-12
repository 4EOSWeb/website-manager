import type { LayerNode } from "@/components/editor/layers/rows";
import { layerLabel } from "@/components/editor/layers/rows";

function Branch(props: { node: LayerNode; depth: number }) {
  const { node, depth } = props;
  const children = node.children ?? [];
  return (
    <li
      role="treeitem"
      aria-expanded={children.length > 0 ? true : undefined}
      data-node-id={node.id}
      data-provider-managed={node.source?.providerManaged ? "true" : undefined}
      data-locked={node.locked?.locked ? "true" : undefined}
    >
      <div className={depth > 0 ? "ed-tree-row is-child" : "ed-tree-row"}>
        <span className="ed-tree-main">
          <span className="truncate">{layerLabel(node)}</span>
        </span>
      </div>
      {children.length > 0 ? (
        <ul role="group">
          {children.map((child) => <Branch key={child.id} node={child} depth={depth + 1} />)}
        </ul>
      ) : null}
    </li>
  );
}

/** The active page as a tree. Locked and provider-managed nodes stay in the list. */
export function LayerTree(props: { root: LayerNode }) {
  return <Branch node={props.root} depth={0} />;
}
