/** Why a layout change is refused, or an empty string when it is allowed. */
export function layoutChangeRefused(flags: { lockLayout?: boolean }, sameParent: boolean): string {
  if (flags.lockLayout === true && !sameParent) return "This page keeps its layout.";
  return "";
}
