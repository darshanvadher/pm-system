import { z } from "zod";

// Contact fields are deliberately plain strings, not strictly validated as
// email/phone formats — this is a free-text business record, not a login
// credential, so over-validating it just annoys whoever's typing in a
// client's WhatsApp number or a shared inbox address.
export const createClientSchema = z.object({
  name: z.string().trim().min(1, "Client name is required").max(200),
  contactEmail: z.string().trim().max(200).optional().or(z.literal("")),
  contactPhone: z.string().trim().max(50).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const updateClientSchema = z.object({
  name: z.string().trim().min(1, "Client name is required").max(200).optional(),
  contactEmail: z.string().trim().max(200).optional().or(z.literal("")),
  contactPhone: z.string().trim().max(50).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  isActive: z.boolean().optional(),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
