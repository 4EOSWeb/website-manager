import { z } from "zod";
import { canvasBoxSchema } from "./canvas-box";
import { stylesSchema } from "./styles";

const breakpointOverride = z.object({
  styles: stylesSchema.optional(),
  box: canvasBoxSchema.optional(),
}).strict();

export const responsiveSchema = z.object({
  tablet: breakpointOverride.optional(),
  mobile: breakpointOverride.optional(),
}).strict();
