import { quantumAgeCommands } from "./commands";
import { quantumAgeMetadata } from "./metadata";
import { quantumAgeNavigation } from "./navigation";
import { quantumAgePageRules } from "./page-rules";
import { quantumAgeRoutes } from "./routes";
import { quantumAgeTheme } from "./theme";

/** Partial adapter. It is not served to the editor until step 6.25. */
const adapter = {
  site: quantumAgeMetadata,
  commands: quantumAgeCommands,
  routes: quantumAgeRoutes,
  pageRules: quantumAgePageRules,
  navigation: quantumAgeNavigation,
  theme: quantumAgeTheme,
};

export default adapter;
