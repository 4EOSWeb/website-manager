import { z } from "zod";

/**
 * The hub previews a site inside an iframe and talks to it with postMessage.
 * The hub must not render site components.
 */
export const previewSchema = z.object({
  transport: z.literal("iframe-postmessage"),
  protocol: z.literal(1),
  readyEvent: z.literal("4eos-ready"),
}).strict();

export type PreviewBehavior = z.infer<typeof previewSchema>;
