import { z } from "zod";

export const lockingSchema = z.object({
  locked: z.boolean(),
  lockId: z.string().regex(/^[a-z0-9.-]{1,64}$/).optional(),
});
