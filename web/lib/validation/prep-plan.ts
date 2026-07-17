import { z } from "zod";

export const prepPlanItemCategorySchema = z.enum([
  "cv",
  "application",
  "interview",
  "skills",
  "other",
]);

export const prepPlanItemStatusSchema = z.enum(["todo", "done", "skipped"]);

export const prepPlanItemSchema = z.object({
  category: prepPlanItemCategorySchema,
  title: z.string(),
  description: z.string().optional(),
  reason: z.string(),
  priority: z.number(),
  href: z
    .string()
    .regex(
      /^\/[a-zA-Z0-9/_-]*(?:\?[a-zA-Z0-9=_&%-]*)?$/,
      "href must be a relative app path (optional query)"
    )
    .optional(),
});

export const prepPlanGenerationSchema = z.object({
  summary: z.string(),
  items: z.array(prepPlanItemSchema).min(1),
});

export type PrepPlanItemCategory = z.infer<typeof prepPlanItemCategorySchema>;
export type PrepPlanItemStatus = z.infer<typeof prepPlanItemStatusSchema>;
export type PrepPlanItem = z.infer<typeof prepPlanItemSchema>;
export type PrepPlanGeneration = z.infer<typeof prepPlanGenerationSchema>;

export function parsePrepPlanGeneration(data: unknown): PrepPlanGeneration {
  return prepPlanGenerationSchema.parse(data);
}

export function parsePrepPlanItemStatus(status: unknown): PrepPlanItemStatus {
  return prepPlanItemStatusSchema.parse(status);
}
