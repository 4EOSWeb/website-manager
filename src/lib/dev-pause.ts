/** Development-only pause so a loading skeleton can be photographed. Production ignores it. */
export async function devPause(flag: string | undefined) {
  if (process.env.NODE_ENV === "production" || flag !== "1") return;
  await new Promise((resolve) => setTimeout(resolve, 2000));
}
