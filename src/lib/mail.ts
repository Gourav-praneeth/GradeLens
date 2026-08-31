export function emailFrom(env: Record<string, string | undefined> = process.env): string | null {
  const value = env.EMAIL_FROM?.trim();
  return value || null;
}

export function emailEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return Boolean(env.RESEND_API_KEY?.trim() && emailFrom(env));
}

export async function sendMail(input: { to: string; subject: string; text: string; html: string }): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = emailFrom();
  if (!apiKey || !from) {
    throw new Error("Email is not configured on this server.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      text: input.text,
      html: input.html,
    }),
  });

  if (!response.ok) {
    throw new Error("Could not send email. Try again in a minute.");
  }
}
