import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase-admin.js";
import { generateToken, expiryFromNow } from "../lib/tokens.js";
import { sendMail } from "../lib/mailtrap.js";
import { verificationEmailHtml, magicLinkEmailHtml } from "../lib/email-templates.js";

const router = Router();

// ── Rate limiting (in-memory, resets on restart) ──────────────────────────
const resendRateLimit = new Map<string, number>();
const magicLinkRateLimit = new Map<string, number>();

function withinRateLimit(map: Map<string, number>, key: string, seconds = 60): boolean {
  const last = map.get(key);
  const now = Date.now();
  if (last && now - last < seconds * 1000) return false;
  map.set(key, now);
  return true;
}

// ── Phone normalization ───────────────────────────────────────────────────
function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  // Remove leading 0 if present, then prepend +62
  const stripped = digits.startsWith("0") ? digits.slice(1) : digits;
  return "+62" + stripped;
}

// ── POST /api/auth/register ───────────────────────────────────────────────
router.post("/api/auth/register", async (req, res) => {
  const { fullName, email, phone, password } = req.body ?? {};

  // Validation
  if (!fullName?.trim()) {
    return res.status(400).json({ ok: false, code: "VALIDATION", message: "Full name is required" });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false, code: "VALIDATION", message: "Valid email is required" });
  }
  if (!password || password.length < 8) {
    return res.status(400).json({ ok: false, code: "VALIDATION", message: "Password must be at least 8 characters" });
  }
  if (!/(?=.*[a-zA-Z])(?=.*[0-9])/.test(password)) {
    return res.status(400).json({ ok: false, code: "VALIDATION", message: "Password must contain letters and numbers" });
  }

  const normalizedPhone = phone ? normalizePhone(phone) : "";

  req.log.info({ event: "register_attempt" });

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: false,
    user_metadata: { full_name: fullName.trim(), phone: normalizedPhone },
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("already registered") || msg.includes("already exists") || msg.includes("unique")) {
      return res.status(409).json({ ok: false, code: "EMAIL_TAKEN" });
    }
    req.log.error({ event: "register_error", err: error.message });
    return res.status(500).json({ ok: false, message: "Registration failed. Please try again." });
  }

  // Generate verification token (24h expiry)
  const token = generateToken();
  const expiresAt = expiryFromNow(24 * 60);

  await supabaseAdmin.from("email_verification_tokens").insert({
    auth_user_id: data.user.id,
    email,
    token,
    expires_at: expiresAt.toISOString(),
  });

  const appUrl = process.env.APP_URL ?? "";
  const verifyUrl = `${appUrl}/verify-email?token=${token}`;
  const { html, text, subject } = verificationEmailHtml({ fullName: fullName.trim(), verifyUrl });

  try {
    await sendMail({ to: email, subject, html, text });
  } catch (mailErr) {
    req.log.error({ event: "register_mail_error" });
  }

  req.log.info({ event: "register_success" });
  return res.json({ ok: true });
});

// ── POST /api/auth/resend-verification ────────────────────────────────────
router.post("/api/auth/resend-verification", async (req, res) => {
  const { email } = req.body ?? {};

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false, message: "Valid email is required" });
  }

  if (!withinRateLimit(resendRateLimit, email)) {
    return res.status(429).json({ ok: false, code: "RATE_LIMITED", message: "Please wait 60 seconds before requesting again" });
  }

  // Look up user in profile table
  const { data: profileRow } = await supabaseAdmin
    .from("my20fit_profile")
    .select("auth_user_id, email_verified_at")
    .eq("email", email)
    .maybeSingle();

  if (!profileRow || profileRow.email_verified_at) {
    return res.json({ ok: true }); // no information leak
  }

  // Invalidate all previous unconsumed tokens
  await supabaseAdmin
    .from("email_verification_tokens")
    .update({ consumed_at: new Date().toISOString() })
    .eq("auth_user_id", profileRow.auth_user_id)
    .is("consumed_at", null);

  // Generate fresh token
  const token = generateToken();
  const expiresAt = expiryFromNow(24 * 60);

  await supabaseAdmin.from("email_verification_tokens").insert({
    auth_user_id: profileRow.auth_user_id,
    email,
    token,
    expires_at: expiresAt.toISOString(),
  });

  const appUrl = process.env.APP_URL ?? "";
  const verifyUrl = `${appUrl}/verify-email?token=${token}`;
  const nameHint = email.split("@")[0];
  const { html, text, subject } = verificationEmailHtml({ fullName: nameHint, verifyUrl });

  try {
    await sendMail({ to: email, subject, html, text });
  } catch (mailErr) {
    req.log.error({ event: "resend_verification_mail_error" });
  }

  return res.json({ ok: true });
});

// ── GET /api/auth/verify?token=... ────────────────────────────────────────
router.get("/api/auth/verify", async (req, res) => {
  const { token } = req.query;

  if (!token || typeof token !== "string") {
    return res.status(400).json({ ok: false, code: "INVALID_OR_EXPIRED" });
  }

  // Constant-time DB lookup: token + not expired + not consumed
  const { data: tokenRow } = await supabaseAdmin
    .from("email_verification_tokens")
    .select("id, auth_user_id, email")
    .eq("token", token)
    .gt("expires_at", new Date().toISOString())
    .is("consumed_at", null)
    .maybeSingle();

  if (!tokenRow) {
    return res.status(400).json({ ok: false, code: "INVALID_OR_EXPIRED" });
  }

  // Mark email verified in profile
  await supabaseAdmin
    .from("my20fit_profile")
    .update({ email_verified_at: new Date().toISOString() })
    .eq("auth_user_id", tokenRow.auth_user_id);

  // Consume the token
  await supabaseAdmin
    .from("email_verification_tokens")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", tokenRow.id);

  req.log.info({ event: "email_verified" });
  return res.json({ ok: true, email: tokenRow.email });
});

// ── POST /api/auth/magic-link/request ────────────────────────────────────
router.post("/api/auth/magic-link/request", async (req, res) => {
  const { email } = req.body ?? {};

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false, message: "Valid email is required" });
  }

  if (!withinRateLimit(magicLinkRateLimit, email)) {
    return res.status(429).json({ ok: false, code: "RATE_LIMITED", message: "Please wait 60 seconds before requesting again" });
  }

  // Look up user in profile table
  const { data: profileRow } = await supabaseAdmin
    .from("my20fit_profile")
    .select("auth_user_id, email_verified_at")
    .eq("email", email)
    .maybeSingle();

  if (!profileRow) {
    return res.json({ ok: true }); // no information leak
  }

  if (!profileRow.email_verified_at) {
    return res.status(403).json({ ok: false, code: "EMAIL_NOT_VERIFIED" });
  }

  // Generate magic link token (15-minute expiry)
  const token = generateToken();
  const expiresAt = expiryFromNow(15);

  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() ||
    req.socket.remoteAddress ||
    "";
  const userAgent = req.headers["user-agent"] || "";

  await supabaseAdmin.from("magic_link_tokens").insert({
    email,
    token,
    expires_at: expiresAt.toISOString(),
    ip_address: ip,
    user_agent: userAgent,
  });

  const appUrl = process.env.APP_URL ?? "";
  const loginUrl = `${appUrl}/magic-link/consume?token=${token}`;
  const { html, text, subject } = magicLinkEmailHtml({ email, loginUrl, ipAddress: ip, userAgent });

  try {
    await sendMail({ to: email, subject, html, text });
  } catch (mailErr) {
    req.log.error({ event: "magic_link_mail_error" });
    return res.status(500).json({ ok: false, message: "Failed to send email. Please try again." });
  }

  req.log.info({ event: "magic_link_sent" });
  return res.json({ ok: true });
});

// ── GET /api/auth/magic-link/verify?token=... ─────────────────────────────
router.get("/api/auth/magic-link/verify", async (req, res) => {
  const { token } = req.query;

  if (!token || typeof token !== "string") {
    return res.status(400).json({ ok: false, code: "INVALID_OR_EXPIRED" });
  }

  // Constant-time DB lookup
  const { data: tokenRow } = await supabaseAdmin
    .from("magic_link_tokens")
    .select("id, email")
    .eq("token", token)
    .gt("expires_at", new Date().toISOString())
    .is("consumed_at", null)
    .maybeSingle();

  if (!tokenRow) {
    return res.status(400).json({ ok: false, code: "INVALID_OR_EXPIRED" });
  }

  // Consume the token immediately (single-use guarantee)
  await supabaseAdmin
    .from("magic_link_tokens")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", tokenRow.id);

  // Generate a Supabase session link
  const appUrl = process.env.APP_URL ?? "";
  const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: "magiclink",
    email: tokenRow.email,
    options: { redirectTo: `${appUrl}/auth/callback` },
  });

  if (linkError || !linkData?.properties?.action_link) {
    req.log.error({ event: "magic_link_generate_error", err: linkError?.message });
    return res.status(500).json({ ok: false, code: "SESSION_ERROR" });
  }

  // Follow the action_link server-side without redirect to get tokens from Location header
  try {
    const verifyRes = await fetch(linkData.properties.action_link, {
      method: "GET",
      redirect: "manual",
      headers: { "User-Agent": "my20fit-server/1.0" },
    });

    const location = verifyRes.headers.get("location");
    if (location) {
      const hashIdx = location.indexOf("#");
      if (hashIdx !== -1) {
        const hashParams = new URLSearchParams(location.slice(hashIdx + 1));
        const access_token = hashParams.get("access_token");
        const refresh_token = hashParams.get("refresh_token");
        if (access_token && refresh_token) {
          req.log.info({ event: "magic_link_verified" });
          return res.json({ ok: true, access_token, refresh_token, email: tokenRow.email });
        }
      }
    }
    // Fallback: return action_link so frontend can follow it
    return res.json({ ok: true, action_link: linkData.properties.action_link, email: tokenRow.email });
  } catch (fetchErr) {
    req.log.error({ event: "magic_link_session_fetch_error" });
    return res.json({ ok: true, action_link: linkData.properties.action_link, email: tokenRow.email });
  }
});

export default router;
