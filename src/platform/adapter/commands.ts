import { z } from "zod";

const command = z.string().max(200).refine((value) => !/[\r\n]/.test(value), "Use a single-line command.");

export const commandsSchema = z.object({
  packageManager: z.enum(["npm", "pnpm", "yarn"]),
  install: command,
  dev: command,
  build: command,
  preview: command,
}).strict();

export type AdapterCommands = z.infer<typeof commandsSchema>;
