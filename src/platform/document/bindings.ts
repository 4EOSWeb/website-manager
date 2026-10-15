import { z } from "zod";

const bindingKey = z.string().regex(/^[a-z][a-z0-9.]{0,80}$/);

export const bindingsSchema = z.record(
  z.string().regex(/^[a-z][a-z0-9]{0,40}$/),
  z.object({ key: bindingKey }).strict(),
);
