import { z } from "zod";

export const PROJECT_STATUSES = [
  "PLANNING",
  "ACTIVE",
  "ON_HOLD",
  "COMPLETED",
  "ARCHIVED",
] as const;
export const PROJECT_MEMBER_ROLES = ["MANAGER", "MEMBER", "VIEWER"] as const;
export const MILESTONE_STATUSES = ["OPEN", "COMPLETED"] as const;

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, "Project name is required").max(100),
  code: z
    .string()
    .trim()
    .min(2, "Code must be at least 2 characters")
    .max(10, "Code cannot exceed 10 characters")
    .regex(
      /^[A-Z0-9_-]+$/i,
      "Code can only contain letters, numbers, hyphens, and underscores",
    )
    .transform((val) => val.toUpperCase()),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  status: z.enum(PROJECT_STATUSES).default("PLANNING"),
  startDate: z.string().optional().or(z.literal("")),
  endDate: z.string().optional().or(z.literal("")),
  clientId: z.string().optional().or(z.literal("")),
});

export const updateProjectSchema = createProjectSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const addProjectMemberSchema = z.object({
  userId: z.string().min(1, "User is required"),
  role: z.enum(PROJECT_MEMBER_ROLES).default("MEMBER"),
});

export const createMilestoneSchema = z.object({
  title: z.string().trim().min(1, "Milestone title is required").max(150),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  dueDate: z.string().optional().or(z.literal("")),
  status: z.enum(MILESTONE_STATUSES).default("OPEN"),
});

export const updateMilestoneSchema = createMilestoneSchema.partial();

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type AddProjectMemberInput = z.infer<typeof addProjectMemberSchema>;
export type CreateMilestoneInput = z.infer<typeof createMilestoneSchema>;
