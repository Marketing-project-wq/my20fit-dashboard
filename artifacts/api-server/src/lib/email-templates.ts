const brandRed = "#C41101";
const bg = "#F5F1E8";
const cardBg = "#FFFFFF";
const textPrimary = "#0A0908";
const textMuted = "#6E665C";
const borderSubtle = "#E5E1D8";

function baseTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>20fit.id</title>
</head>
<body style="margin:0;padding:0;background:${bg};font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${bg};min-height:100vh;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Logo -->
          <tr>
            <td style="padding-bottom:24px;text-align:center;">
              <img src="https://profile.20fit.id/logo-20fit.jpg" alt="20fit.id"
                   width="120" height="auto"
                   style="display:inline-block;max-width:120px;height:auto;border:0;outline:none;text-decoration:none;" />
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:${cardBg};border-radius:12px;padding:40px 32px;border:1px solid ${borderSubtle};">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:24px;text-align:center;">
              <p style="font-size:11px;color:${textMuted};margin:0;line-height:1.6;">
                Profile 20FIT &middot; Jakarta<br>
                <a href="https://20fit.id/legal" style="color:${textMuted};">Terms &amp; Privacy Policy</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function verificationEmailHtml(params: {
  fullName: string;
  verifyUrl: string;
}): { html: string; text: string; subject: string } {
  const { fullName, verifyUrl } = params;
  const subject = "Verify your email at 20fit.id";

  const content = `
    <h1 style="font-size:24px;font-weight:700;color:${textPrimary};margin:0 0 8px;">
      Verify your email address
    </h1>
    <p style="font-size:14px;color:${textMuted};line-height:1.6;margin:0 0 28px;">
      Hi <strong style="color:${textPrimary};">${fullName}</strong>, welcome to 20fit.id!<br>
      Click the button below to confirm your email address and activate your account.
      This link expires in <strong>24 hours</strong>.
    </p>

    <div style="text-align:center;margin:0 0 28px;">
      <a href="${verifyUrl}"
         style="display:inline-block;background:${brandRed};color:#ffffff;font-size:15px;font-weight:700;
                letter-spacing:0.5px;padding:14px 32px;border-radius:8px;text-decoration:none;">
        Verify my email →
      </a>
    </div>

    <p style="font-size:12px;color:${textMuted};line-height:1.5;margin:0 0 8px;">
      If the button doesn't work, copy and paste this link into your browser:
    </p>
    <p style="font-size:11px;color:${brandRed};word-break:break-all;margin:0;">
      <a href="${verifyUrl}" style="color:${brandRed};">${verifyUrl}</a>
    </p>

    <hr style="border:none;border-top:1px solid ${borderSubtle};margin:28px 0;">
    <p style="font-size:12px;color:${textMuted};margin:0;">
      If you didn't create an account at 20fit.id, you can safely ignore this email.
    </p>
  `;

  const text = `Verify your email at 20fit.id

Hi ${fullName},

Welcome to 20fit.id! Click the link below to verify your email address (valid for 24 hours):

${verifyUrl}

If you didn't create an account, ignore this email.

— Profile 20FIT · Jakarta`;

  return { html: baseTemplate(content), text, subject };
}

export function magicLinkEmailHtml(params: {
  email: string;
  loginUrl: string;
  ipAddress?: string;
  userAgent?: string;
}): { html: string; text: string; subject: string } {
  const { email, loginUrl, ipAddress, userAgent } = params;
  const subject = "Your 20fit.id login link — valid for 15 minutes";

  const fraudInfo = (ipAddress || userAgent)
    ? `<p style="font-size:12px;color:${textMuted};line-height:1.5;margin:0 0 4px;">
        <strong>Request details:</strong><br>
        ${ipAddress ? `IP: ${ipAddress}<br>` : ""}
        ${userAgent ? `Browser: ${userAgent.slice(0, 80)}` : ""}
       </p>`
    : "";

  const content = `
    <h1 style="font-size:24px;font-weight:700;color:${textPrimary};margin:0 0 8px;">
      Your login link
    </h1>
    <p style="font-size:14px;color:${textMuted};line-height:1.6;margin:0 0 8px;">
      Here's your one-click login link for <strong style="color:${textPrimary};">${email}</strong>.
      It's valid for <strong>15 minutes</strong> and can only be used once.
    </p>
    <p style="font-size:14px;color:${textMuted};line-height:1.6;margin:0 0 28px;">
      No password needed — just click below to sign in.
    </p>

    <div style="text-align:center;margin:0 0 28px;">
      <a href="${loginUrl}"
         style="display:inline-block;background:${brandRed};color:#ffffff;font-size:15px;font-weight:700;
                letter-spacing:0.5px;padding:14px 32px;border-radius:8px;text-decoration:none;">
        Sign me in →
      </a>
    </div>

    <hr style="border:none;border-top:1px solid ${borderSubtle};margin:28px 0 16px;">

    <div style="background:#FEF9EC;border-radius:8px;padding:16px;margin-bottom:16px;">
      <p style="font-size:13px;color:#92400E;font-weight:700;margin:0 0 6px;">
        🔐 Not you?
      </p>
      <p style="font-size:12px;color:#92400E;margin:0 0 8px;">
        If you didn't request this login link, you can safely ignore this email. Your account is secure.
      </p>
      ${fraudInfo}
    </div>

    <p style="font-size:12px;color:${textMuted};margin:0;">
      Can't click the button? Copy and paste this URL:<br>
      <a href="${loginUrl}" style="color:${brandRed};word-break:break-all;">${loginUrl}</a>
    </p>
  `;

  const text = `Your 20fit.id login link

Here's your one-click login link for ${email} (valid 15 minutes, single use):

${loginUrl}

${ipAddress ? `Request IP: ${ipAddress}` : ""}
${userAgent ? `Browser: ${userAgent.slice(0, 80)}` : ""}

Didn't request this? Ignore this email — your account is secure.

— Profile 20FIT · Jakarta`;

  return { html: baseTemplate(content), text, subject };
}
