import { z } from "zod";
import { flexLayoutSchema } from "./layout-flex";
import { flowLayoutSchema } from "./layout-flow";
import { gridLayoutSchema } from "./layout-grid";

export const layoutSchema = z.union([flowLayoutSchema, flexLayoutSchema, gridLayoutSchema]);
