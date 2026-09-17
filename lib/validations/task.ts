import { z } from "zod";

export const TASK_STATUSES = [
  "TODO",
  "IN_PROGRESS",
  "IN_REVIEW",
  "DONE",
] as const;
export const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
export const TASK_TYPES = ["TASK", "STORY", "BUG", "FEATURE"] as const;
export const BUG_SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Task title is required").max(200),
  description: z.string().trim().max(5000).optional().or(z.literal("")),
  status: z.enum(TASK_STATUSES).default("TODO"),
  priority: z.enum(TASK_PRIORITIES).default("MEDIUM"),
  type: z.enum(TASK_TYPES).default("TASK"),
  severity: z.enum(BUG_SEVERITIES).optional().nullable(),
  storyPoints: z.number().int().min(0).max(100).optional().nullable(),
  estimatedHours: z.number().min(0).max(1000).optional().nullable(),
  projectId: z.string().min(1, "Project is required"),
  milestoneId: z.string().optional().or(z.literal("")),
  sprintId: z.string().optional().or(z.literal("")),
  assigneeId: z.string().optional().or(z.literal("")),
  startDate: z.string().optional().or(z.literal("")),
  dueDate: z.string().optional().or(z.literal("")),
  tagNames: z.array(z.string()).optional(),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  position: z.number().optional(),
});

export const updateTaskPositionSchema = z.object({
  status: z.enum(TASK_STATUSES),
  position: z.number(),
});

export const createCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Comment content cannot be empty")
    .max(2000),
});

export const createAttachmentSchema = z.object({
  fileName: z.string().trim().min(1, "File name is required").max(255),
  fileSize: z.number().positive(),
  fileType: z.string().trim().min(1),
  fileUrl: z.string().trim().url().or(z.string().min(1)),
});

export const createDependencySchema = z.object({
  dependsOnTaskId: z.string().min(1, "Prerequisite task is required"),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type UpdateTaskPositionInput = z.infer<typeof updateTaskPositionSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type CreateAttachmentInput = z.infer<typeof createAttachmentSchema>;
export type CreateDependencyInput = z.infer<typeof createDependencySchema>;
