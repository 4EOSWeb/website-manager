import { z } from "zod";

export const pageRulesSchema = z.object({
  canCreate: z.boolean(),
  canDelete: z.boolean(),
  reservedRoutes: z.array(z.string()),
  slugPattern: z.string().min(1),
}).strict();

export type PageRules = z.infer<typeof pageRulesSchema>;
