export const previewReadyEvent = "4eos-ready";
export const previewTimeoutMs = 20_000;
export const previewDidNotRespond = "The preview did not respond.";

export type PreviewListener = (input: { url: string; readyEvent: string; timeoutMs: number }) => Promise<boolean>;

/** Waits for the preview ready message. It does not import site components or activate a site. */
export async function validatePreview(url: string, listen: PreviewListener) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<boolean>((resolve) => {
    timer = setTimeout(() => resolve(false), previewTimeoutMs);
  });
  try {
    const ready = await Promise.race([
      listen({ url, readyEvent: previewReadyEvent, timeoutMs: previewTimeoutMs }),
      timeout,
    ]);
    if (ready !== true) return { ok: false as const, problem: previewDidNotRespond };
    return { ok: true as const };
  } catch {
    return { ok: false as const, problem: previewDidNotRespond };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export function previewHomeUrl(origin: string) {
  return new URL("/", origin).href;
}
