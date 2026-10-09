import { z } from "zod";
import { adapterInvalid } from "../errors";
import { err, ok, type Result } from "../result";
import { articlesSchema, validateArticles } from "./articles";
import { breakpointsSchema } from "./breakpoints";
import { validateAdapterCapabilities, adapterCapabilitiesSchema } from "./capabilities";
import { commandsSchema } from "./commands";
import { componentsSchema } from "./components";
import { draftsSchema } from "./drafts";
import { validateFonts, fontsSchema } from "./fonts";
import { adapterLevelSchema } from "./level";
import { mediaSchema } from "./media";
import { siteMetadataSchema } from "./metadata";
import { validateNavigation, navigationSchema } from "./navigation";
import { pageCapabilitySchema, resolvePageCapabilities } from "./page-capabilities";
import { pageRulesSchema } from "./page-rules";
import { previewSchema } from "./preview";
import { publicationSchema, validatePublication } from "./publish";
import { routerSchema } from "./router";
import { staticRoutesSchema } from "./routes";
import { serialize as defaultSerialize, type SerializeHook } from "./serialize";
import { validateSharedLayout, sharedLayoutSchema } from "./shared-layout";
import { templatesSchema } from "./templates";
import { themeSchema } from "./theme";
import { defaultValidateDocumentHook, type ValidateDocumentHook } from "./validate-hook";
import { supportedAdapterVersions } from "./version";

export function composeAdapterSchema() {
  return z.object({
    version: z.literal(1),
    level: adapterLevelSchema,
    site: siteMetadataSchema,
    capabilities: adapterCapabilitiesSchema,
    router: routerSchema,
    commands: commandsSchema,
    routes: staticRoutesSchema,
    pageRules: pageRulesSchema,
    pageCapabilities: pageCapabilitySchema,
    navigation: navigationSchema,
    theme: themeSchema,
    fonts: fontsSchema,
    breakpoints: breakpointsSchema,
    components: componentsSchema,
    templates: templatesSchema,
    sharedLayout: sharedLayoutSchema,
    articles: articlesSchema,
    media: mediaSchema,
    drafts: draftsSchema,
    preview: previewSchema,
    publish: publicationSchema,
    validateDocument: z.custom<ValidateDocumentHook>((value) => typeof value === "function").optional(),
    serialize: z.custom<SerializeHook>((value) => typeof value === "function").optional(),
  }).strict();
}

export const adapterSchema = composeAdapterSchema();

export type AdapterContract = Omit<z.infer<typeof adapterSchema>, "validateDocument" | "serialize"> & {
  validateDocument: ValidateDocumentHook;
  serialize: SerializeHook;
};

export function parseAdapter(value: unknown): Result<AdapterContract> {
  if (value === null || typeof value !== "object") return err(adapterInvalid("The adapter must be an object.", "adapter"));
  const version = (value as { version?: unknown }).version;
  if (!(supportedAdapterVersions as readonly unknown[]).includes(version)) {
    return err(adapterInvalid("The adapter version is not supported.", "version"));
  }
  const parsed = adapterSchema.safeParse(value);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const path = issue?.path.length ? issue.path.join(".") : "adapter";
    return err(adapterInvalid(issue?.message ?? "The adapter is missing a required field.", path));
  }
  const capabilities = validateAdapterCapabilities(parsed.data.level, parsed.data.capabilities);
  if (!capabilities.ok) return capabilities;
  const articles = validateArticles(capabilities.value.supportsBlog, parsed.data.articles);
  if (!articles.ok) return articles;
  const navigation = validateNavigation(capabilities.value.supportsNavigationEditing, parsed.data.navigation);
  if (!navigation.ok) return navigation;
  const fonts = validateFonts(parsed.data.level, parsed.data.fonts);
  if (!fonts.ok) return fonts;
  const sharedLayout = validateSharedLayout(capabilities.value.supportsSharedLayouts, parsed.data.sharedLayout);
  if (!sharedLayout.ok) return sharedLayout;
  const publish = validatePublication(capabilities.value.supportsReviewPublishing, parsed.data.publish);
  if (!publish.ok) return publish;
  const pageCapabilities = resolvePageCapabilities(parsed.data.level, parsed.data.pageCapabilities);
  if (!pageCapabilities.ok) return pageCapabilities;
  return ok({
    ...parsed.data,
    validateDocument: parsed.data.validateDocument ?? defaultValidateDocumentHook,
    serialize: parsed.data.serialize ?? defaultSerialize,
  });
}

export { supportedAdapterVersions } from "./version";
