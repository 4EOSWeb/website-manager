import { quantumAgeCommands } from "./commands";
import { quantumAgeMetadata } from "./metadata";

/** Partial adapter. It is not served to the editor until step 6.25. */
const adapter = {
  site: quantumAgeMetadata,
  commands: quantumAgeCommands,
};

export default adapter;
