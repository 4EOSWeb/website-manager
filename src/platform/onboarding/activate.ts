export function activationDecision(sections: readonly { status: "pass" | "fail" }[]) {
  if (sections.length === 0 || sections.some((section) => section.status !== "pass")) {
    return { ok: false as const, status: 400 as const, message: "Fix the failed checks before connecting this website." };
  }
  return { ok: true as const };
}
