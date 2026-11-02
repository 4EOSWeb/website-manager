const mediaPath = /^\/media\/[a-z0-9][a-z0-9._-]*\.(?:png|jpe?g|webp|svg)$/i;

export type SeoNote = { key: string; reason: string };

export type ConvertedSeo = {
  seoTitle: string;
  metaDescription: string;
  shareImage: string;
  notes: SeoNote[];
};

function copyString(value: unknown, valid: (text: string) => boolean, key: string, notes: SeoNote[]) {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value !== "string" || !valid(value)) {
    notes.push({ key, reason: "The value could not be copied." });
    return "";
  }
  return value;
}

/** Copies SEO fields. Missing fields become empty strings. Invalid values are noted and not invented. */
export function convertSeo(page: { title?: unknown; seoTitle?: unknown; metaDescription?: unknown; shareImage?: unknown }): ConvertedSeo {
  const notes: SeoNote[] = [];
  return {
    seoTitle: copyString(page.seoTitle, (text) => text.length <= 70, "seoTitle", notes),
    metaDescription: copyString(page.metaDescription, (text) => text.length <= 160, "metaDescription", notes),
    shareImage: copyString(page.shareImage, (text) => mediaPath.test(text), "shareImage", notes),
    notes,
  };
}
