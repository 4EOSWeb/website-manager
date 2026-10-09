import { z } from "zod";

/** Step 5 replaces this slot with the full registry definition. */
export const componentSlotSchema = z.object({
  id: z.string().regex(/^[a-z0-9.-]+$/),
}).strict();

export const componentsSchema = z.object({
  components: z.array(componentSlotSchema),
}).strict();

export type AdapterComponents = z.infer<typeof componentsSchema>;
