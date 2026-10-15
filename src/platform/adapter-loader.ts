import { adapterInvalid, adapterNotFound } from "./errors";
import { err, ok, type Result } from "./result";

export type AdapterLoader = () => Promise<unknown>;

export async function loadAdapter(id: string, loaders: Record<string, AdapterLoader>): Promise<Result<unknown>> {
  const load = loaders[id];
  if (!load) return err(adapterNotFound());
  const value = await load();
  if (value === null || typeof value !== "object") return err(adapterInvalid("The adapter did not return an object."));
  return ok(value);
}
