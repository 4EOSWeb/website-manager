import { quantumAgeBreakpoints } from "./breakpoints";
import { quantumAgeCommands } from "./commands";
import { quantumAgeFooter } from "./components/footer";
import { quantumAgeHeader } from "./components/header";
import { quantumAgeHero } from "./components/hero";
import { quantumAgeFonts } from "./fonts";
import { quantumAgeMetadata } from "./metadata";
import { quantumAgeNavigation } from "./navigation";
import { quantumAgePageRules } from "./page-rules";
import { quantumAgeRoutes } from "./routes";
import { quantumAgeTemplates } from "./templates";
import { quantumAgeTheme } from "./theme";

/** Partial adapter. It is not served to the editor until step 6.25. */
const adapter = {
  site: quantumAgeMetadata,
  commands: quantumAgeCommands,
  routes: quantumAgeRoutes,
  pageRules: quantumAgePageRules,
  navigation: quantumAgeNavigation,
  theme: quantumAgeTheme,
  fonts: quantumAgeFonts,
  breakpoints: quantumAgeBreakpoints,
  templates: quantumAgeTemplates,
  components: { components: [quantumAgeHeader, quantumAgeFooter, quantumAgeHero] },
};

export default adapter;
