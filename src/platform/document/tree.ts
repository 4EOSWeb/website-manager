import { documentInvalid } from "../errors";
import { err, ok, type Result } from "../result";
import type { NodeDocument } from "./node";

export function assertUniqueIds(root: NodeDocument): Result<true> {
  const seen = new Set<string>();
  const walk = (node: NodeDocument): boolean => {
    if (seen.has(node.id)) return false;
    seen.add(node.id);
    return node.children.every(walk);
  };
  if (!walk(root)) return err(documentInvalid("Each item needs its own id."));
  return ok(true);
}
