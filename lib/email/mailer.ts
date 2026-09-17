import nodemailer from "nodemailer";

interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail({
  to,
  subject,
  text,
  html,
}: SendEmailOptions): Promise<boolean> {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT
    ? parseInt(process.env.SMTP_PORT, 10)
    : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });

      await transporter.sendMail({
        from: process.env.SMTP_FROM || '"PM System" <no-reply@pm-system.test>',
        to,
        subject,
        text,
        html: html || text,
      });

      console.log(
        `[Email Dispatched via SMTP] To: ${to} | Subject: ${subject}`,
      );
      return true;
    } catch (err) {
      console.error("Failed to send email via SMTP:", err);
      return false;
    }
  }

  // Fallback simulator for development environment
  console.log(`[Email Simulator] To: ${to} | Subject: ${subject}`);
  console.log(`[Email Body] ${text}`);
  return true;
}
