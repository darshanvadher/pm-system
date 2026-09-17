import { z } from "zod";

export const CLIENT_UPDATE_STATUSES = [
  "DRAFT",
  "PUBLISHED",
  "APPROVED",
  "REJECTED",
] as const;

export const createClientUpdateSchema = z.object({
  projectId: z.string().min(1, "Project is required"),
  title: z.string().trim().min(1, "Title is required").max(200),
  summary: z.string().trim().max(500).optional().or(z.literal("")),
  content: z.string().trim().min(1, "Content is required").max(10000),
  status: z.enum(CLIENT_UPDATE_STATUSES).default("DRAFT"),
});

export const updateClientUpdateSchema = createClientUpdateSchema.partial();

export const clientFeedbackSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  clientFeedback: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type CreateClientUpdateInput = z.infer<typeof createClientUpdateSchema>;
export type UpdateClientUpdateInput = z.infer<typeof updateClientUpdateSchema>;
export type ClientFeedbackInput = z.infer<typeof clientFeedbackSchema>;
