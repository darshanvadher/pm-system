import { z } from "zod";

export const createTimeLogSchema = z.object({
  taskId: z.string().min(1, "Task is required"),
  hours: z
    .number()
    .positive("Hours logged must be greater than 0")
    .max(24, "Cannot log more than 24 hours in a single entry"),
  date: z.string().optional().or(z.literal("")),
  description: z
    .string()
    .trim()
    .max(1000, "Description cannot exceed 1000 characters")
    .optional()
    .or(z.literal("")),
});

export const updateTimeLogSchema = createTimeLogSchema.partial();

export type CreateTimeLogInput = z.infer<typeof createTimeLogSchema>;
export type UpdateTimeLogInput = z.infer<typeof updateTimeLogSchema>;
