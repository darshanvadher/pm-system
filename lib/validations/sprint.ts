import { z } from "zod";

export const SPRINT_STATUSES = ["PLANNED", "ACTIVE", "COMPLETED"] as const;

export const createSprintSchema = z.object({
  projectId: z.string().min(1, "Project is required"),
  name: z.string().trim().min(1, "Sprint name is required").max(100),
  goal: z.string().trim().max(1000).optional().or(z.literal("")),
  startDate: z.string().optional().or(z.literal("")),
  endDate: z.string().optional().or(z.literal("")),
  status: z.enum(SPRINT_STATUSES).default("PLANNED"),
});

export const updateSprintSchema = createSprintSchema.partial();

export const assignTaskSprintSchema = z.object({
  sprintId: z.string().nullable().optional(),
  storyPoints: z.number().int().min(0).max(100).nullable().optional(),
});

export type CreateSprintInput = z.infer<typeof createSprintSchema>;
export type UpdateSprintInput = z.infer<typeof updateSprintSchema>;
export type AssignTaskSprintInput = z.infer<typeof assignTaskSprintSchema>;
