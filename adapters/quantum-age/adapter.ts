import { quantumAgeArticles } from "./articles";
import { quantumAgeBreakpoints } from "./breakpoints";
import { quantumAgeCommands } from "./commands";
import { quantumAgeButton } from "./components/button";
import { quantumAgeCard } from "./components/card";
import { quantumAgeFooter } from "./components/footer";
import { quantumAgeForm } from "./components/form";
import { quantumAgeHeader } from "./components/header";
import { quantumAgeHero } from "./components/hero";
import { quantumAgeInsightsSummary } from "./components/insights";
import { quantumAgeLogo } from "./components/logo";
import { quantumAgeFonts } from "./fonts";
import { quantumAgeMedia } from "./media";
import { quantumAgeMetadata } from "./metadata";
import { quantumAgeNavigation } from "./navigation";
import { quantumAgePageCapabilities } from "./page-capabilities";
import { quantumAgePageRules } from "./page-rules";
import { publishAllowlist } from "./publish-allowlist";
import { quantumAgeRoutes } from "./routes";
import { serializeQuantumAge } from "./serialize";
import { quantumAgeTemplates } from "./templates";
import { quantumAgeTheme } from "./theme";
import { validateDocumentHook } from "./validate";

/**
 * Level 2 adapter for this site. The editor still reads version 3 drafts.
 * Free canvas stays available because the editor can still place a freeform section.
 */
const adapter = {
  version: 1 as const,
  level: 2 as const,
  site: quantumAgeMetadata,
  capabilities: {
    supportsPageCreation: true,
    supportsBlog: true,
    supportsNavigationEditing: true,
    supportsFreeCanvas: true,
    supportsStructuredSections: true,
    supportsThemeEditing: true,
    supportsCustomComponents: true,
    supportsForms: true,
    supportsSharedLayouts: true,
    supportsReviewPublishing: true,
  },
  router: { kind: "app" as const, root: "src/app" },
  commands: quantumAgeCommands,
  routes: quantumAgeRoutes,
  pageRules: quantumAgePageRules,
  pageCapabilities: quantumAgePageCapabilities,
  navigation: quantumAgeNavigation,
  theme: quantumAgeTheme,
  fonts: quantumAgeFonts,
  breakpoints: quantumAgeBreakpoints,
  components: {
    components: [
      quantumAgeHeader,
      quantumAgeFooter,
      quantumAgeHero,
      quantumAgeButton,
      quantumAgeCard,
      quantumAgeForm,
      quantumAgeInsightsSummary,
      quantumAgeLogo,
    ],
  },
  templates: quantumAgeTemplates,
  sharedLayout: { header: "optional" as const, footer: "optional" as const },
  articles: quantumAgeArticles,
  media: quantumAgeMedia,
  drafts: {
    scope: ["client", "website", "branch", "page", "user"] as const,
    format: "visual-document-v1" as const,
  },
  preview: { transport: "iframe-postmessage" as const, protocol: 1 as const, readyEvent: "4eos-ready" as const },
  publish: { mode: "review-branch" as const, allowlist: publishAllowlist },
  validateDocument: validateDocumentHook,
  serialize: serializeQuantumAge,
};

export default adapter;
