import type { PlatformError } from "./errors";

export type Ok<T> = { ok: true; value: T };

export type Err = { ok: false; error: PlatformError };

export type Result<T> = Ok<T> | Err;

export function ok<T>(value: T): Ok<T> {
  return { ok: true, value };
}

export function err(error: PlatformError): Err {
  return { ok: false, error };
}
