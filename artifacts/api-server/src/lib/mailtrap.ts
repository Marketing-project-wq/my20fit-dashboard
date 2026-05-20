interface MailtrapSendParams {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendMail({ to, subject, html, text }: MailtrapSendParams) {
  const token = process.env.API_Tokens_Mailtrap;
  const url = process.env.MAILTRAP_API_URL;
  const from = process.env.MAILTRAP_SENDER_EMAIL;
  const fromName = process.env.MAILTRAP_SENDER_NAME;

  if (!token || !url || !from || !fromName) {
    throw new Error(
      "Mailtrap env vars missing. Required: API_Tokens_Mailtrap, MAILTRAP_API_URL, MAILTRAP_SENDER_EMAIL, MAILTRAP_SENDER_NAME"
    );
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      from: { email: from, name: fromName },
      to: [{ email: to }],
      subject,
      html,
      text,
      category: subject.toLowerCase().includes("magic") ? "magic_link" : "verification",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Mailtrap send failed: ${res.status} ${body}`);
  }
  return res.json();
}
