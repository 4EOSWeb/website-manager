import { z } from "zod";
import { stylesSchema } from "./styles";

const breakpointOverride = z.object({
  styles: stylesSchema.optional(),
}).strict();

export const responsiveSchema = z.object({
  tablet: breakpointOverride.optional(),
  mobile: breakpointOverride.optional(),
}).strict();
