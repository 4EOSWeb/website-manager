import { documentInvalid } from "../errors";
import { err, ok, type Result } from "../result";
import type { ComponentDefinition } from "./types";

export function validateProps(
  definition: Pick<ComponentDefinition, "propsSchema" | "propsSchemaId">,
  props: unknown,
): Result<unknown> {
  if (!definition.propsSchema) return ok(props);
  const parsed = definition.propsSchema.safeParse(props);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const unrecognized = issue && "keys" in issue && Array.isArray(issue.keys) ? String(issue.keys[0] ?? "") : "";
    const name = issue?.path.length ? String(issue.path[0]) : unrecognized || definition.propsSchemaId;
    const error = documentInvalid(issue?.message ?? "That value is not valid.");
    return err({ ...error, path: name });
  }
  return ok(parsed.data);
}
