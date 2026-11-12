/**
 * Git media for this site. Upload checks in `src/lib/media.ts` stay as they are.
 * Those checks should read this adapter in step 16.4.
 */

export const quantumAgeMedia = {
  storage: "git" as const,
  publicDir: "public/media",
  accept: [".png", ".jpg", ".jpeg", ".webp", ".svg"] as const,
};
