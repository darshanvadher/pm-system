import { describe, expect, it } from "vitest";
import {
  createClientUpdateSchema,
  clientFeedbackSchema,
} from "../validations/client-update";
import { createNotificationSchema } from "../validations/notification";
import { sendEmail } from "../email/mailer";

describe("Stage E Client & Communication Validations", () => {
  it("validates client update creation schema", () => {
    const valid = createClientUpdateSchema.safeParse({
      projectId: "proj-123",
      title: "Sprint 2 Deliverable Summary",
      summary: "Completed Gantt Timeline and Agile Sprints",
      content: "All Sprint 2 user stories have been implemented and validated.",
      status: "PUBLISHED",
    });
    expect(valid.success).toBe(true);

    const invalid = createClientUpdateSchema.safeParse({
      projectId: "",
      title: "",
      content: "",
    });
    expect(invalid.success).toBe(false);
  });

  it("validates client feedback schema", () => {
    const approveValid = clientFeedbackSchema.safeParse({
      action: "APPROVE",
      clientFeedback: "Approved for production release.",
    });
    expect(approveValid.success).toBe(true);

    const rejectValid = clientFeedbackSchema.safeParse({
      action: "REJECT",
      clientFeedback: "Please update dark mode contrast.",
    });
    expect(rejectValid.success).toBe(true);

    const invalidAction = clientFeedbackSchema.safeParse({
      action: "INVALID" as unknown as "APPROVE",
    });
    expect(invalidAction.success).toBe(false);
  });

  it("validates notification creation schema", () => {
    const valid = createNotificationSchema.safeParse({
      userId: "user-dev-1",
      title: "Task Assigned",
      message: "You were assigned to NEXUS-5",
      type: "TASK_ASSIGNED",
      link: "/projects/123",
    });
    expect(valid.success).toBe(true);
  });

  it("executes email mailer fallback simulator cleanly", async () => {
    const result = await sendEmail({
      to: "client@pm-system.test",
      subject: "Test Notification",
      text: "This is a test notification email dispatch.",
    });
    expect(result).toBe(true);
  });
});
