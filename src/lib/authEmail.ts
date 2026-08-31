import { issueAuthToken, RESET_TTL_MS, VERIFY_TTL_MS } from "./authTokens";
import { sendMail } from "./mail";

function wrap(body: string): string {
  return `<p style="font-family:system-ui,sans-serif;font-size:16px;line-height:1.5;color:#15202b">${body}</p>`;
}

export async function sendVerificationEmail(user: { id: string; email: string; name: string }, origin: string) {
  const token = await issueAuthToken(user.id, "verify", VERIFY_TTL_MS);
  const url = `${origin}/verify-email?token=${token}`;
  await sendMail({
    to: user.email,
    subject: "Verify your GradeLens email",
    text: `Hi ${user.name},\n\nConfirm this email for GradeLens:\n${url}\n\nThis link expires in 48 hours.`,
    html: wrap(
      `Hi ${escapeHtml(user.name)},<br/><br/>Confirm this email for GradeLens:<br/><a href="${url}">${url}</a><br/><br/>This link expires in 48 hours.`,
    ),
  });
}

export async function sendPasswordResetEmail(user: { id: string; email: string; name: string }, origin: string) {
  const token = await issueAuthToken(user.id, "reset", RESET_TTL_MS);
  const url = `${origin}/reset-password?token=${token}`;
  await sendMail({
    to: user.email,
    subject: "Reset your GradeLens password",
    text: `Hi ${user.name},\n\nReset your GradeLens password:\n${url}\n\nThis link expires in 1 hour. If you did not ask for this, you can ignore the email.`,
    html: wrap(
      `Hi ${escapeHtml(user.name)},<br/><br/>Reset your GradeLens password:<br/><a href="${url}">${url}</a><br/><br/>This link expires in 1 hour. If you did not ask for this, you can ignore the email.`,
    ),
  });
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
