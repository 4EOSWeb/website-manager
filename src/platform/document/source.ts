import { z } from "zod";

export const sourceSchema = z.object({
  origin: z.enum(["editor", "provider", "migration"]),
  providerManaged: z.boolean(),
  externalRef: z.string().max(200).optional(),
});
