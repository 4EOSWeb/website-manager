export const siteIdPattern = /^[a-z][a-z0-9_]{2,40}$/;

export function siteIdProblem(id: string, taken: boolean): string {
  if (!siteIdPattern.test(id)) return "Use a lowercase id that starts with a letter.";
  if (taken) return "That id is already used.";
  return "";
}
