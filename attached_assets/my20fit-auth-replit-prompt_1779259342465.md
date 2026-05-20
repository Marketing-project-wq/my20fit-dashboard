# my20FIT — Auth Flow Implementation
## Login, Register, Email Verification, Onboarding

> **Replit Agent: read this entire document before writing any code.**
> If anything is unclear, **stop and ask** — do not invent behavior, do not guess library APIs, do not skip steps.
> At the end of this document there is a verification checklist. The task is **not complete** until every box is checked.

---

## 0. CONTEXT — what you're working with

This is an existing **pnpm workspace monorepo** for my20FIT (a member portal for the 20FIT fitness ecosystem in Jakarta). Stack already in place:

- **Frontend:** `artifacts/my20fit` — React 19 + Vite + Wouter routing + Tailwind v4 + Radix UI + Framer Motion + Lucide icons + Sonner toasts.
- **Backend:** `artifacts/api-server` — Express 5 + pino-http logging + Anthropic SDK integration.
- **Supabase JS client:** already installed (`@supabase/supabase-js@^2.105.3`) and configured at `artifacts/my20fit/src/lib/supabase.ts`.
- **AuthContext:** currently **mocked** in `artifacts/my20fit/src/contexts/AuthContext.tsx`. Your job replaces the mock with a real Supabase-backed implementation **while preserving the exact same public API surface** so consuming components (Sidebar, Profile, MedicalCheckup, etc.) keep working unchanged.
- **Legacy `src/pages/Login.tsx`:** exists but will be **REPLACED**. Do not preserve its layout.

**Production domain:** `https://profile.20fit.id`
**Email sender:** `Profile 20FIT <profile@20fit.id>` via **Mailtrap Send API (direct backend call)**
**Legal page:** `https://20fit.id/legal`
**Supabase project ref:** `cpvzwqptzcxnwzfzgrmt` (verify in `.env`)

---

## 1. SCOPE — what to build

### What's IN scope

1. **Register page** — email + password + WhatsApp + full name, OR Sign up with Google.
2. **Login page** — three methods stacked: Email & Password / Google OAuth / Magic Link.
3. **Email verification** — confirmation email sent via **Mailtrap Send API** (direct HTTP from our Express backend) from `profile@20fit.id`. Custom token, custom landing page.
4. **Magic Link flow** — login link sent via Mailtrap, single-use, 15-minute expiry.
5. **Onboarding modal** — appears after first successful verified login, multi-step, **skippable**. Re-surfaces in Profile page if skipped or incomplete.
6. **AuthContext rewrite** — replace mock with real Supabase session + profile sync. **Public API stays identical**.
7. **Protected routes** — wrap Dashboard, Nutrition, Progress, Profile, Moments with auth gate that redirects unauthenticated users to `/login`.

### What's OUT of scope (DO NOT TOUCH)

- Dashboard, Nutrition, Progress, Profile page **content layouts** (only adjust their data sources to read from Supabase profile where the mock used to feed dummy data).
- MedicalCheckup / MCU upload logic.
- WeatherCard, QuickCheckin, MuscleFatigueWidget, PlusCard, TodaysChecklist.
- Existing `lib/db`, `lib/api-spec`, `lib/api-zod` packages — leave them alone.
- Existing `/api/analyze-mcu` and `/api/nutrition-recommendation` endpoints.
- Face Registration (mentioned in screenshot 1 as Step 2) — show it as an inactive step indicator only. NOT IMPLEMENTED in this task.

---

## 2. ANTI-HALLUCINATION RULES — read these carefully

These rules exist because previous AI iterations have made these exact mistakes. **Each one is non-negotiable.**

1. **Do not invent Supabase API methods.** Only use methods that exist in `@supabase/supabase-js` v2.x: `signUp`, `signInWithPassword`, `signInWithOAuth`, `getSession`, `onAuthStateChange`, `signOut`, `updateUser`, `from('table').select/insert/update/upsert`, `admin.createUser` (server-side only with service role). **Do NOT use `signInWithOtp` or Supabase's built-in magic link** — we are building our own magic link via Mailtrap. Do NOT use Supabase's built-in email confirmation — we are sending our own via Mailtrap.

2. **Email verification is NOT done by Supabase here.** In Supabase Dashboard, the user will set **"Confirm email" = OFF**. We mark users as verified by writing `email_verified_at` to our own `my20fit_profile` table after they click the Mailtrap link. This is by design — the user wants full control via Mailtrap API.

3. **Mailtrap is called via HTTPS from our Express backend, NOT from the frontend.** The Mailtrap API token is a backend secret. Never expose it via `VITE_*` env vars. Never call Mailtrap from the React app.

4. **Do not add npm packages outside the explicit allowlist in section 4.** No axios, no `mailtrap` npm package (we use `fetch`), no `nodemailer`, no `jsonwebtoken` (use crypto for tokens), no `bcrypt` (Supabase handles password hashing), no `react-router-dom`, no `next-auth`, no `firebase`.

5. **Do not change Wouter base path or Vite config.** Routing already works.

6. **Do not run any SQL migration from code.** All DB schema changes go into `db-migrations/01_auth_profile_schema.sql`. User runs it manually in Supabase SQL Editor. If you write code that calls `pnpm --filter @workspace/db run push`, you are wrong — that targets the unrelated starter schema in `lib/db`.

7. **Do not configure Google Cloud Console from code.** The user does this manually. Your job: call `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: '...' } })`. Document the manual steps in your final response (section 5.3 below).

8. **Never log secrets.** No full emails, no tokens, no passwords, no session JWTs in logs. Use event names: `req.log.info({ event: 'register_attempt' })` not `req.log.info({ email, password })`.

9. **Email validation: use regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`**. Do not import an email validation library.

10. **Phone format: store as E.164.** User enters `812-3456-7890`, you normalize to `+62812345678900` (strip non-digits, prepend `+62`). Do NOT store the raw input with hyphens.

11. **If a step in this document conflicts with existing code, stop and ask.** Do not silently refactor unrelated files. The blast radius of this task is contained.

12. **No `console.log` in production code.** Use `pino` on backend, `sonner` toast for frontend user feedback. Debug logs must be removed before marking the task complete.

13. **Tokens must be cryptographically random.** Use `crypto.randomBytes(32).toString('hex')` for verification and magic link tokens. Do NOT use `Math.random()`, do NOT use timestamp-based tokens, do NOT use sequential IDs.

14. **Magic link tokens are SINGLE-USE.** When verified successfully, mark as consumed in DB. A second click on the same link must fail with a clear error.

15. **All token lookups must be constant-time.** Compare tokens by querying the database for `token = $1 AND expires_at > now() AND consumed_at IS NULL` in a single SQL query. Do not fetch then compare in JS.

---

## 3. DELIVERABLES — files to create or modify

### NEW files (frontend)

| Path | Purpose |
|---|---|
| `artifacts/my20fit/src/pages/Register.tsx` | Registration page matching screenshot 1 |
| `artifacts/my20fit/src/pages/VerifyEmail.tsx` | Landing page after email link click (`/verify?token=...`) |
| `artifacts/my20fit/src/pages/VerifyEmailPending.tsx` | Post-registration "check your inbox" page |
| `artifacts/my20fit/src/pages/MagicLink.tsx` | Magic link request page (separate from login) |
| `artifacts/my20fit/src/pages/MagicLinkSent.tsx` | "Magic link sent" confirmation page |
| `artifacts/my20fit/src/pages/MagicLinkConsume.tsx` | Landing page after magic link click (`/auth/magic?token=...`) |
| `artifacts/my20fit/src/components/auth/AuthShell.tsx` | Shared layout wrapper for all auth pages |
| `artifacts/my20fit/src/components/auth/TabSwitcher.tsx` | "Join Free / Already have an account" pill toggle |
| `artifacts/my20fit/src/components/auth/StepIndicator.tsx` | "1 Your Details — 2 Face Registration" indicator (step 2 inactive) |
| `artifacts/my20fit/src/components/auth/PasswordStrength.tsx` | 3-segment strength meter (weak/medium/strong) |
| `artifacts/my20fit/src/components/auth/PhoneInput.tsx` | `+62` prefix + Indonesia flag + number input |
| `artifacts/my20fit/src/components/auth/GoogleButton.tsx` | White button with Google "G" icon |
| `artifacts/my20fit/src/components/auth/ProtectedRoute.tsx` | Auth gate wrapper |
| `artifacts/my20fit/src/components/onboarding/OnboardingModal.tsx` | Skippable multi-step modal |
| `artifacts/my20fit/src/components/onboarding/OnboardingStepBasic.tsx` | Step 1: usia + jenis kelamin |
| `artifacts/my20fit/src/components/onboarding/OnboardingStepPhysical.tsx` | Step 2: tinggi + berat |
| `artifacts/my20fit/src/components/onboarding/OnboardingStepGoals.tsx` | Step 3: aktivitas + pengalaman + jadwal |
| `artifacts/my20fit/src/hooks/useProfile.ts` | Reads/writes `my20fit_profile` table |

### MODIFIED files (frontend)

| Path | Change |
|---|---|
| `artifacts/my20fit/src/contexts/AuthContext.tsx` | Replace mock entirely. Keep exact same exported interface |
| `artifacts/my20fit/src/pages/Login.tsx` | Replace existing layout. New design per screenshot 2 + Magic Link button |
| `artifacts/my20fit/src/pages/AuthCallback.tsx` | Handle Google OAuth callback only (verification is on `/verify` and `/auth/magic`) |
| `artifacts/my20fit/src/pages/ResetPassword.tsx` | Wrap in new `AuthShell`, otherwise minimal touch |
| `artifacts/my20fit/src/App.tsx` | Add new routes + wrap protected pages with `<ProtectedRoute>` |
| `artifacts/my20fit/src/pages/Profile.tsx` | Add "Lengkapi data" CTA card when `onboarding_completed = false`. Triggers `OnboardingModal`. Do NOT redesign anything else |

### NEW files (backend)

| Path | Purpose |
|---|---|
| `artifacts/api-server/src/routes/auth.ts` | Register, verify, magic link endpoints |
| `artifacts/api-server/src/lib/mailtrap.ts` | Thin wrapper around Mailtrap Send API |
| `artifacts/api-server/src/lib/email-templates.ts` | HTML email templates (verification, magic link) |
| `artifacts/api-server/src/lib/supabase-admin.ts` | Server-side Supabase client using service role key |
| `artifacts/api-server/src/lib/tokens.ts` | Token generation + verification helpers |

### MODIFIED files (backend)

| Path | Change |
|---|---|
| `artifacts/api-server/src/routes/index.ts` | Register new `auth` router |

### NEW migration file (manual run by user)

| Path | Purpose |
|---|---|
| `db-migrations/01_auth_profile_schema.sql` | Full SQL schema for `my20fit_profile` + token tables. User runs in Supabase SQL Editor |

---

## 4. ALLOWED DEPENDENCIES

### Frontend (already installed — verify, don't reinstall)
- `@supabase/supabase-js@^2.105.3`
- `react@19.1.0`, `react-dom@19.1.0`, `wouter@^3.3.5`
- `framer-motion`, `lucide-react`, `tailwindcss@catalog:`, `sonner`

### Backend (already installed — verify)
- `express@5.x`, `cors`, `pino-http`, `multer`, `@anthropic-ai/sdk`

### NEW dependencies to add (backend only)
- `@supabase/supabase-js@^2.105.3` (add to `artifacts/api-server/package.json` — needed for service role admin client)
- Nothing else. Use native `fetch` for Mailtrap, native `crypto` for tokens.

**Forbidden:** axios, jsonwebtoken, bcrypt, nodemailer, mailtrap (npm), formik, yup, zod-resolvers, react-router, next-auth, firebase.

---

## 5. EXTERNAL CONFIGURATION — user does these manually

**List these clearly in your final response so the user knows what to set up outside the code.**

### 5.1 Mailtrap setup (user has Mailtrap account)

1. In Mailtrap dashboard, add and verify the sending domain `20fit.id` (DNS records: SPF, DKIM, DMARC).
2. Create a sender identity: `profile@20fit.id` with display name `Profile 20FIT`.
3. Generate an API token under **Sending Domains → API Tokens**. Scope: **Send Email** only.

**The user has ALREADY created the Mailtrap secret in Replit with this name:**

```
API_Tokens_Mailtrap = <token value, already set>
```

**DO NOT rename it. DO NOT instruct the user to create a new one.** Read it on the backend as `process.env.API_Tokens_Mailtrap` (exact casing, including the underscore between `API` and `Tokens` and between `Tokens` and `Mailtrap`).

The remaining Mailtrap-related env vars the Agent must add to Replit Secrets (if not present yet):
- `MAILTRAP_SENDER_EMAIL=profile@20fit.id`
- `MAILTRAP_SENDER_NAME=Profile 20FIT`
- `MAILTRAP_API_URL=https://send.api.mailtrap.io/api/send` (production) — or sandbox URL for dev testing

### 5.2 Supabase Dashboard settings

1. **Authentication → Providers**
   - Email: **Enabled**. **"Confirm email" → OFF.** (We do verification ourselves.)
   - Google: **Enabled** after section 5.3 below.
   - Disable all others.
2. **Authentication → URL Configuration**
   - Site URL: `https://profile.20fit.id`
   - Redirect URLs allowlist:
     - `https://profile.20fit.id/auth/callback`
     - `https://profile.20fit.id/verify`
     - `https://profile.20fit.id/auth/magic`
     - Your `*.replit.dev` dev URL with all three paths above
3. **Project Settings → API**
   - Copy the **service_role** key into Replit Secret `SUPABASE_SERVICE_ROLE_KEY` (backend only — NEVER expose to frontend).

### 5.3 Google Cloud Console — user configures, but Agent MUST provide exact values

**IMPORTANT — Agent workflow for this section:**

The user is configuring Google Cloud Console themselves (not via Replit's built-in OAuth helper). The Agent must:

1. **First, detect the current Replit dev URL** (the `*.replit.dev` subdomain assigned to this project — visible in the workspace URL or available via `process.env.REPLIT_DEV_DOMAIN` / `REPL_SLUG` + `REPL_OWNER`).

2. **Then output to the user, EXPLICITLY in the final response, the EXACT values to paste into Google Cloud Console.** Format like this:

   ```
   ════════════════════════════════════════════════════════════
   📋 PASTE THESE INTO GOOGLE CLOUD CONSOLE
   ════════════════════════════════════════════════════════════

   Create OAuth 2.0 Client ID → Application type: Web application

   ▸ Authorized JavaScript origins:
       https://profile.20fit.id
       https://cpvzwqptzcxnwzfzgrmt.supabase.co
       https://<DETECTED-REPLIT-DEV-URL>

   ▸ Authorized redirect URIs:
       https://cpvzwqptzcxnwzfzgrmt.supabase.co/auth/v1/callback

   After creating the client, you will receive a Client ID and Client Secret.
   Paste both into:
       Supabase Dashboard → Authentication → Providers → Google → Enable
   ════════════════════════════════════════════════════════════
   ```

   Replace `<DETECTED-REPLIT-DEV-URL>` with the actual URL.

3. **After outputting these values, STOP and wait for the user to confirm that:**
   - Google Cloud OAuth client has been created
   - Client ID + Client Secret are pasted into Supabase
   - Google provider is enabled in Supabase

   Do NOT proceed to test the Google sign-in flow until the user explicitly confirms these steps are done. If the user runs the app before confirming, the Google button will fail — that's expected, and the Agent must NOT try to "fix" it by adding more code.

4. **Why Authorized redirect URI is only Supabase's callback URL** (not our app's):
   - Google → Supabase callback handles the OAuth code exchange.
   - Supabase then redirects to our app's `redirectTo` URL (which IS configured in section 5.2, NOT in Google Cloud).
   - The Agent must NOT add `https://profile.20fit.id/auth/callback` to Google's redirect URIs. That URL is Supabase's redirect, not Google's. Adding it will not break anything but is wrong and confuses future debugging.

### 5.4 Required Replit Secrets summary

**Already set by user (do NOT touch — these exist):**
```
SESSION_SECRET                            (existing)
AI_INTEGRATIONS_ANTHROPIC_BASE_URL        (existing)
AI_INTEGRATIONS_ANTHROPIC_API_KEY         (existing)
VITE_WEATHER_API_KEY                      (existing)
VITE_SUPABASE_ANON_KEY                    (existing)
VITE_SUPABASE_URL                         (existing)
API_Tokens_Mailtrap                       (existing — Mailtrap send token, use process.env.API_Tokens_Mailtrap)
```

**Agent must add these new secrets (instruct user explicitly which to add):**

```
# Frontend (VITE_ prefix exposes to browser)
VITE_APP_URL=https://profile.20fit.id     # used to build callback URLs

# Backend ONLY (no VITE_ prefix)
SUPABASE_URL=https://cpvzwqptzcxnwzfzgrmt.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service role key from Supabase Dashboard>
MAILTRAP_API_URL=https://send.api.mailtrap.io/api/send
MAILTRAP_SENDER_EMAIL=profile@20fit.id
MAILTRAP_SENDER_NAME=Profile 20FIT
APP_URL=https://profile.20fit.id          # used in email link generation
```

**Naming convention note for Agent:** Replit Secrets are case-sensitive and accept any naming style. We are intentionally keeping `API_Tokens_Mailtrap` in its existing form (mixed case + underscores) because the user has already set it. Read it via `process.env.API_Tokens_Mailtrap` — do NOT try to read it as `process.env.MAILTRAP_API_TOKEN` or any other variant.

---

## 6. DATABASE SCHEMA — `db-migrations/01_auth_profile_schema.sql`

Create this file. User runs it manually. Do NOT execute from code.

```sql
-- ─────────────────────────────────────────────────────────────
-- my20fit_profile — extends auth.users with app-specific data
-- ─────────────────────────────────────────────────────────────
create table if not exists public.my20fit_profile (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  phone text,                          -- E.164 format, e.g. +6281234567890
  email_verified_at timestamptz,       -- WE manage this, not Supabase
  is_plus_member boolean default false,

  -- Onboarding fields (all nullable — populated progressively)
  age int check (age >= 13 and age <= 120),
  gender text check (gender in ('male', 'female')),
  gender_selected_at timestamptz,
  height_cm numeric(5,2) check (height_cm > 0 and height_cm < 300),
  weight_kg numeric(5,2) check (weight_kg > 0 and weight_kg < 500),
  activity_level text check (activity_level in (
    'sedentary', 'light', 'moderate', 'active', 'very_active'
  )),
  gym_experience text check (gym_experience in (
    'beginner', 'intermediate', 'advanced'
  )),
  daily_schedule text check (daily_schedule in (
    'morning', 'afternoon', 'evening', 'flexible'
  )),

  onboarding_completed boolean default false,
  onboarding_skipped_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.my20fit_profile enable row level security;

create policy "users read own profile" on public.my20fit_profile
  for select using (auth.uid() = auth_user_id);
create policy "users update own profile" on public.my20fit_profile
  for update using (auth.uid() = auth_user_id);
create policy "users insert own profile" on public.my20fit_profile
  for insert with check (auth.uid() = auth_user_id);

-- ─────────────────────────────────────────────────────────────
-- email_verification_tokens — for /verify flow
-- ─────────────────────────────────────────────────────────────
create table if not exists public.email_verification_tokens (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  token text not null unique,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz default now()
);
create index if not exists evt_token_idx on public.email_verification_tokens(token);
create index if not exists evt_user_idx on public.email_verification_tokens(auth_user_id);

-- ─────────────────────────────────────────────────────────────
-- magic_link_tokens — for passwordless login
-- ─────────────────────────────────────────────────────────────
create table if not exists public.magic_link_tokens (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  token text not null unique,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  ip_address text,
  user_agent text,
  created_at timestamptz default now()
);
create index if not exists mlt_token_idx on public.magic_link_tokens(token);
create index if not exists mlt_email_idx on public.magic_link_tokens(email);

-- Token tables: no RLS needed because they're only accessed via service role
-- from the backend. Frontend never queries these directly.
alter table public.email_verification_tokens enable row level security;
alter table public.magic_link_tokens enable row level security;
-- Deny-all policies (only service role bypasses)
create policy "deny all" on public.email_verification_tokens for all using (false);
create policy "deny all" on public.magic_link_tokens for all using (false);

-- ─────────────────────────────────────────────────────────────
-- Auto-create profile row when a new auth user signs up
-- ─────────────────────────────────────────────────────────────
create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.my20fit_profile (auth_user_id, email, full_name, phone)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', '')
  )
  on conflict (auth_user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists my20fit_profile_set_updated_at on public.my20fit_profile;
create trigger my20fit_profile_set_updated_at
  before update on public.my20fit_profile
  for each row execute function public.set_updated_at();

create index if not exists my20fit_profile_auth_user_id_idx
  on public.my20fit_profile(auth_user_id);
```

---

## 7. BACKEND IMPLEMENTATION

### 7.1 `artifacts/api-server/src/lib/supabase-admin.ts`

```typescript
import { createClient } from "@supabase/supabase-js";

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
}

// Server-side client with service role — bypasses RLS.
// NEVER expose this client or its key to the frontend.
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);
```

### 7.2 `artifacts/api-server/src/lib/tokens.ts`

```typescript
import { randomBytes } from "crypto";

export function generateToken(): string {
  return randomBytes(32).toString("hex"); // 64-char hex
}

export function expiryFromNow(minutes: number): Date {
  return new Date(Date.now() + minutes * 60 * 1000);
}
```

### 7.3 `artifacts/api-server/src/lib/mailtrap.ts`

```typescript
interface MailtrapSendParams {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendMail({ to, subject, html, text }: MailtrapSendParams) {
  // IMPORTANT: secret name is API_Tokens_Mailtrap (mixed case, set by user).
  // Do not normalize or rename — read with the exact casing.
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
```

### 7.4 `artifacts/api-server/src/lib/email-templates.ts`

Build two HTML templates: verification email and magic link email. **Both must include a plain-text fallback.** Branding constraints:

- Background: `#F5F1E8` (cream)
- Card: `#FFFFFF`, rounded 12px
- Heading: Anton-equivalent system font fallback (web fonts unreliable in email — use `'Helvetica Neue', Arial, sans-serif` and accept the trade-off)
- Primary button: filled `#C41101`, white text, padded 14px 32px, rounded 8px
- Logo: text-only `my20FIT` in heading (red `20`)
- Footer: small muted text with `Profile 20FIT · Jakarta` and unsubscribe placeholder (not wired, but link to `https://20fit.id/legal`)

Template function signatures:

```typescript
export function verificationEmailHtml(params: {
  fullName: string;
  verifyUrl: string;   // already includes ?token=...
}): { html: string; text: string; subject: string };

export function magicLinkEmailHtml(params: {
  email: string;
  loginUrl: string;
  ipAddress?: string;
  userAgent?: string;
}): { html: string; text: string; subject: string };
```

Subject lines (Bahasa Indonesia, professional, short):
- Verification: `Konfirmasi email kamu di my20FIT`
- Magic Link: `Link login my20FIT — berlaku 15 menit`

Magic link email must include the requester's IP + browser as a fraud signal, with copy: *"Bukan kamu yang request? Abaikan email ini."*

### 7.5 `artifacts/api-server/src/routes/auth.ts`

Endpoints to implement (all under `/api`):

```
POST  /api/auth/register
POST  /api/auth/resend-verification
GET   /api/auth/verify?token=...           (returns JSON; frontend renders)
POST  /api/auth/magic-link/request
GET   /api/auth/magic-link/verify?token=... (returns JSON; frontend renders)
```

Detailed behavior:

#### `POST /api/auth/register`
Body: `{ fullName, email, phone, password }`

1. Validate all fields (email regex, phone starts with `+62`, password ≥ 8 chars with at least 1 letter + 1 number, fullName not empty).
2. Normalize phone to E.164.
3. Call `supabaseAdmin.auth.admin.createUser({ email, password, email_confirm: false, user_metadata: { full_name, phone } })`.
4. If error includes "already registered" → return `{ ok: false, code: "EMAIL_TAKEN" }` with status 409.
5. On success, generate verification token, insert into `email_verification_tokens` (expires in 24h), call `sendMail` with verification template. `verifyUrl = ${APP_URL}/verify?token=${token}`.
6. Return `{ ok: true }` with status 200.

#### `POST /api/auth/resend-verification`
Body: `{ email }`. Rate-limit: 1 request per 60 seconds per email (track in-memory Map with TTL; if Map gets too big, that's fine — fresh state on server restart is acceptable for v1).

1. Look up user via `supabaseAdmin.auth.admin.listUsers` filtered by email. If not found OR already verified (`email_verified_at != null` in profile), return `{ ok: true }` anyway (don't leak existence).
2. Invalidate all previous unconsumed tokens for that user (`update ... set consumed_at = now() where auth_user_id = $1 and consumed_at is null`).
3. Generate fresh token, insert, send email.
4. Return `{ ok: true }`.

#### `GET /api/auth/verify?token=...`
1. Find token row where `token = $1 AND expires_at > now() AND consumed_at IS NULL`.
2. If not found → return `{ ok: false, code: "INVALID_OR_EXPIRED" }` status 400.
3. Update profile: `update my20fit_profile set email_verified_at = now() where auth_user_id = $1`.
4. Mark token consumed.
5. Use `supabaseAdmin.auth.admin.generateLink({ type: 'magiclink', email })` to create a one-time auth link, OR — simpler — return `{ ok: true, email }` and have the frontend show "Email verified! Click to log in" → redirect to `/login`. **Use the simpler path** to keep blast radius small.

#### `POST /api/auth/magic-link/request`
Body: `{ email }`. Rate-limit: 1 per 60s per email.

1. Look up user. If not found → still return `{ ok: true }` (no leak).
2. If user found but profile `email_verified_at IS NULL` → return `{ ok: false, code: "EMAIL_NOT_VERIFIED" }` status 403. UI prompts to verify first.
3. Generate token, insert into `magic_link_tokens` with 15-minute expiry, store IP + user-agent.
4. Send magic link email. `loginUrl = ${APP_URL}/auth/magic?token=${token}`.
5. Return `{ ok: true }`.

#### `GET /api/auth/magic-link/verify?token=...`
1. Find token row where `token = $1 AND expires_at > now() AND consumed_at IS NULL`.
2. If not found → `{ ok: false, code: "INVALID_OR_EXPIRED" }` status 400.
3. Mark consumed.
4. Generate a Supabase session via `supabaseAdmin.auth.admin.generateLink({ type: 'magiclink', email })` — extract the `action_link`, parse out the `hash_params` (`access_token`, `refresh_token`), and return them as JSON: `{ ok: true, access_token, refresh_token, email }`.
5. Frontend calls `supabase.auth.setSession({ access_token, refresh_token })` to log the user in.

**Note for Agent:** If `admin.generateLink` parsing turns out to be fragile (Supabase has changed this API surface before), the alternative is to set a flag in the profile row and instruct the user to re-enter their password. Don't do that — it defeats the purpose of magic link. Try `generateLink` first; if it fails in your testing, **stop and ask** for guidance.

### 7.6 Register `auth.ts` router in `artifacts/api-server/src/routes/index.ts`

```typescript
import authRouter from "./auth";
// ...
router.use(authRouter);
```

---

## 8. FRONTEND IMPLEMENTATION

### 8.1 `AuthContext.tsx` rewrite

Preserve this exact exported interface:

```typescript
interface AuthContextValue {
  user: User | null;
  profile: My20fitProfile | null;
  photoProfile: PhotoUserMirror | null;     // keep null for now, photo.20fit.id integration is separate task
  isExistingPhotoUser: boolean;             // keep false for now
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}
```

Implementation:

1. On mount, call `supabase.auth.getSession()` to hydrate initial state.
2. Subscribe to `supabase.auth.onAuthStateChange((event, session) => ...)`.
3. Whenever session is present, fetch the matching row from `my20fit_profile` (via Supabase client with RLS — user's own row).
4. `signOut` calls `supabase.auth.signOut()` then `window.location.href = "/login"`.
5. `refreshProfile` re-fetches the profile row.
6. `loading: true` until both session and profile fetch resolve. **All consuming components must continue to work** — Sidebar reads `profile.full_name` etc., so if profile is null (user not in `my20fit_profile` table for some reason), fall back to `user.email` gracefully.

### 8.2 `ProtectedRoute.tsx`

```typescript
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  useEffect(() => {
    if (!loading && !user) setLocation("/login");
  }, [loading, user, setLocation]);
  if (loading) return <FullPageSpinner />;
  if (!user) return null;
  return <>{children}</>;
}
```

Wrap Dashboard, Nutrition, Progress, Profile, Moments routes in `App.tsx`.

### 8.3 Routes in `App.tsx`

```
/                  → ProtectedRoute → Dashboard
/nutrition         → ProtectedRoute → Nutrition
/progress          → ProtectedRoute → Progress
/moments           → ProtectedRoute → ComingSoon
/profile           → ProtectedRoute → Profile

/login             → Login              (public)
/register          → Register           (public)
/verify            → VerifyEmail        (public; reads ?token=)
/verify-pending    → VerifyEmailPending (public; reads ?email= from query)
/magic-link        → MagicLink          (public)
/magic-link-sent   → MagicLinkSent      (public; reads ?email=)
/auth/magic        → MagicLinkConsume   (public; reads ?token=)
/auth/callback     → AuthCallback       (public; Google OAuth landing)
/reset-password    → ResetPassword      (existing, wrap in AuthShell)
```

### 8.4 AuthShell component

- Outer: full-viewport, background `radial-gradient(circle at 20% 10%, rgba(196,17,1,0.06) 0%, transparent 40%), #F5F1E8`.
- Centered card: `max-width: 480px`, `width: calc(100% - 32px)` on mobile, `padding: 40px 32px` desktop, `28px 20px` mobile, `border-radius: 16px`, `background: #FFFFFF`, `box-shadow: 0 4px 24px rgba(0,0,0,0.04)`.
- Logo at top of card, clickable → `/`.
- Children render below logo.
- Footer outside card: `By registering, you agree to the [Terms & Conditions and Privacy Policy](https://20fit.id/legal)` — link opens in new tab.

### 8.5 Register.tsx — matches screenshot 1

Structure:

1. `<AuthShell>`
2. `<TabSwitcher active="register" />` — clicking "Already have an account" navigates to `/login`.
3. `<StepIndicator current={1} steps={["Your Details", "Face Registration"]} />` — step 2 visually inactive (gray dot + gray text). No click handler on step 2.
4. Form fields, vertical stack, 16px gap:
   - **Full name** — text input, `required`, asterisk on label.
   - **Email** — email input, `required`. On blur, debounced check: if matches existing user (via either `/api/auth/check-email` if implemented OR catch the duplicate error on submit), show inline red text under input: `Email already registered. Sign in? [Sign In]` — Sign In is a link to `/login?email=<value>`.
   - **Phone / WhatsApp** — `<PhoneInput>` component with `+62` prefix.
   - **Password** — password input with eye toggle, `<PasswordStrength>` meter below shows 3 segments (weak/medium/strong) based on:
     - weak: < 8 chars
     - medium: 8+ chars and (letter + number) OR (letter + symbol)
     - strong: 12+ chars and letter + number + symbol
   - Submit button: `Continue →`. Disabled when form invalid OR loading. Style: pill, gray when disabled, black when enabled, white text.
5. Divider with "or" text in the middle.
6. `<GoogleButton text="Sign up with Google" onClick={handleGoogleSignup} />` — calls `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: ${APP_URL}/auth/callback } })`.
7. `← Back` link (gray, centered) → goes to `/login` if user came from login, otherwise `/`.
8. Footer (outside the form, inside AuthShell): Terms link.

On submit:
- POST to `/api/auth/register` with the form data.
- On success: redirect to `/verify-pending?email=<email>`.
- On 409 EMAIL_TAKEN: show inline error on email field.
- On other error: sonner toast "Registrasi gagal. Coba lagi sebentar."

### 8.6 Login.tsx — matches screenshot 2 + Magic Link addition

Structure:

1. `<AuthShell>`
2. Heading area above tab switcher:
   - Eyebrow: `SELAMAT DATANG KEMBALI` (uppercase, letter-spaced, muted color)
   - Title: `Masuk ke akunmu.` (Anton font, 32px desktop / 26px mobile, dark text)
3. `<TabSwitcher active="login" />` — clicking "Join Free" navigates to `/register`.
4. Form:
   - **Email** input. Optionally pre-filled from `?email=` query param (for the "already registered" cross-link from Register).
   - **Password** input with eye toggle.
   - Right-aligned link `Lupa Password?` → `/reset-password`.
   - Primary button: filled `#C41101`, white text, full-width, `Sign In` → calls `supabase.auth.signInWithPassword({ email, password })`.
5. Divider "or"
6. `<GoogleButton text="Sign in with Google" onClick={handleGoogleLogin} />`
7. **NEW: Magic Link button** — second white-bordered button, full-width, below Google:
   - Text: `Send me a magic link instead`
   - Icon: `<Wand2 />` from lucide-react, left-aligned
   - Style: same width as Google button, white background, border `1.5px solid #E5E1D8`, text color `#0A0908`, rounded 12px, padded 14px
   - On click: navigate to `/magic-link?email=<currentEmailValue>`
8. `← Back` link → `/`.
9. Footer below card: `Belum punya akun? Join Free →` (link to `/register`).

Error handling for password login:
- `Invalid login credentials` → red banner above form: "Email atau password salah."
- `Email not confirmed` (won't happen since we disabled Supabase confirm) → ignore.
- If our profile lookup shows `email_verified_at IS NULL` → after successful password login, immediately sign out and show banner: "Email kamu belum terverifikasi. Cek inbox atau request ulang." with a "Kirim ulang verifikasi" link that hits `/api/auth/resend-verification`.

### 8.7 VerifyEmail.tsx (`/verify`)

1. Read `?token=` from URL.
2. On mount, call `GET /api/auth/verify?token=...`.
3. Three states: loading, success, error.
   - Loading: centered spinner + "Memverifikasi email..."
   - Success: green check icon, heading "Email terverifikasi ✓", text "Sekarang kamu bisa masuk ke akunmu.", button "Lanjut ke Login" → `/login?email=${email}`.
   - Error (`INVALID_OR_EXPIRED`): red icon, heading "Link tidak valid", text "Link verifikasi sudah kedaluwarsa atau sudah digunakan.", two buttons: "Kirim ulang verifikasi" (prompts for email if not in URL) and "Kembali ke Login".

### 8.8 VerifyEmailPending.tsx (`/verify-pending`)

1. Read `?email=` from URL.
2. Render: large mail icon, heading "Cek inbox kamu", text "Kami sudah kirim link verifikasi ke `<email>`. Klik link di email untuk aktifkan akun.", muted hint "Tidak terima email? Cek folder spam, atau kirim ulang.", button "Kirim ulang" (calls `/api/auth/resend-verification`, with 60s countdown after click).
3. Link below: `Salah email? Daftar ulang →` → `/register`.

### 8.9 MagicLink.tsx (`/magic-link`)

1. `<AuthShell>`
2. Heading: "Login tanpa password"
3. Body: "Masukin email kamu, kami kirim link login yang berlaku 15 menit."
4. Email input (pre-filled from `?email=`).
5. Submit button: `Kirim Magic Link →`
6. On submit: POST `/api/auth/magic-link/request`. On success → `/magic-link-sent?email=<email>`. On 403 EMAIL_NOT_VERIFIED → show inline message with link to resend verification.
7. Link below: `Kembali ke login →` → `/login`.

### 8.10 MagicLinkSent.tsx (`/magic-link-sent`)

Similar to VerifyEmailPending but copy is "Magic link sudah dikirim ke `<email>`. Klik link di inbox untuk masuk. Link berlaku 15 menit."

### 8.11 MagicLinkConsume.tsx (`/auth/magic`)

1. Read `?token=`.
2. On mount, call `GET /api/auth/magic-link/verify?token=...`.
3. On success: response includes `access_token` and `refresh_token`. Call `supabase.auth.setSession({ access_token, refresh_token })`, then `setLocation("/")`.
4. On error: render error state with "Link tidak valid atau sudah kedaluwarsa" + buttons to request new link or go to login.

### 8.12 AuthCallback.tsx (`/auth/callback`)

Handles Google OAuth return. Existing file — update to:
1. `supabase.auth.getSession()` on mount.
2. If session present → check if `my20fit_profile.email_verified_at` is null (Google sign-ins are auto-verified — set `email_verified_at = now()` server-side via a one-time RPC OR by upserting from frontend on first login with provider = 'google'). **Simpler:** if `app_metadata.provider === 'google'` and `email_verified_at IS NULL`, write `email_verified_at = now()` to profile.
3. Redirect to `/`.

### 8.13 OnboardingModal

Triggers:
- After successful login if `profile.onboarding_completed === false` AND `profile.onboarding_skipped_at` is NULL.
- From Profile page "Lengkapi data" card if user clicks it.

Behavior:
- Multi-step (3 steps), with progress dots at top.
- "Skip untuk sekarang" link at bottom-right of every step → sets `onboarding_skipped_at = now()`, closes modal. Modal does NOT re-appear automatically until user opens it from Profile.
- "Lanjut" button advances. Final step button is "Selesai".
- On final submit: update profile with all fields, set `onboarding_completed = true`. Toast: "Data tersimpan ✓".

Step 1 — **Data Dasar**
- Usia (number input, min 13, max 120)
- Jenis Kelamin (segmented control: Laki-laki / Perempuan)

Step 2 — **Data Fisik**
- Subtitle: "Untuk hitung kebutuhan kalori & hidrasi yang akurat"
- Tinggi (cm) — number input
- Berat Badan (kg) — number input

Step 3 — **Target & Gaya Hidup**
- Tingkat Aktivitas (radio list):
  - Sedentary — Hampir tidak olahraga
  - Light — Olahraga ringan 1-2x/minggu
  - Moderate — Olahraga 3-5x/minggu
  - Active — Olahraga 6-7x/minggu
  - Very Active — 2x/hari atau pekerjaan fisik
- Pengalaman Gym (radio list):
  - Pemula — < 1 tahun
  - Menengah — 1-3 tahun
  - Lanjutan — 3+ tahun
- Jadwal Harian (radio list):
  - Pagi (sebelum jam 10)
  - Siang (10-15)
  - Sore/Malam (15-22)
  - Fleksibel

Visual: same design tokens as auth pages. Each step is a card inside a dialog (use Radix Dialog primitive already installed). Mobile: full-screen modal. Desktop: centered, max-width 540px.

### 8.14 Profile page integration

In `src/pages/Profile.tsx`, do the **minimal** change:
- Read `profile.onboarding_completed`.
- If false, show a new card near the top (under the existing identity card, before personal info) with:
  - Yellow/gold accent (matches Plus theme colors already used)
  - Heading: "Lengkapi data kamu"
  - Body: "Untuk unlock rekomendasi nutrisi personal & training plan yang sesuai."
  - Button: "Lengkapi Sekarang →" → opens OnboardingModal.
- Existing personal info form fields should now read from / write to Supabase profile (not localStorage). Use `useProfile` hook for this.

**Do NOT redesign the rest of Profile.tsx.** This is the only addition.

### 8.15 Reading profile data in other pages

The Nutrition page currently reads from localStorage for MCU/wellness/sleep/water. Keep that — these are check-in data, not auth profile data. But for user identity (`gender`, `age`, `height_cm`, `weight_kg`), Nutrition's `collectUserData()` function should now also pull from the Supabase profile via `useAuth().profile`. Add these fields to the data payload sent to `/api/nutrition-recommendation`. The backend nutrition prompt already accepts arbitrary context — just include them.

**Do NOT refactor any other Nutrition logic. Just expand the data collection.**

---

## 9. STYLE GUIDE — exact values

```
Brand red             #C41101
Brand red hover       #A50E01
Background canvas     #F5F1E8 (existing var --bg)
Card surface          #FFFFFF
Text primary          #0A0908
Text muted            #6E665C
Border subtle         #E5E1D8
Border focus          #C41101
Success green         #22C55E
Error red             #C41101
Warning amber         #D97706

Input height          48px
Input padding         12px 14px
Input border-radius   12px
Input border          1px solid #E5E1D8
Input focus border    1.5px solid #C41101
Input focus shadow    0 0 0 4px rgba(196,17,1,0.08)

Button height         48px
Button border-radius  12px
Primary button        bg #C41101, color #FFF
Secondary button      bg #FFF, color #0A0908, border 1.5px solid #E5E1D8
Disabled button       bg #E5E1D8, color #9C948A, cursor not-allowed

Font headings         'Anton', sans-serif
Font body             'Barlow Condensed', sans-serif (existing)
Font mono             'JetBrains Mono', monospace (existing)

Container max-width   480px (auth) / 540px (onboarding modal)
Container padding     40px 32px desktop / 28px 20px mobile

Spacing scale         4, 8, 12, 16, 20, 24, 32, 40, 56
```

Responsive breakpoints:
- Mobile-first. Card-form centered, full width minus 32px until viewport ≥ 520px, then fixed 480px wide.
- Below 360px: shrink padding to 20px 16px.
- Above 1280px: no max-width on the AuthShell background, but card stays at 480px.

---

## 10. TESTING — manual verification scenarios

Before marking the task done, walk through each of these manually and confirm all pass. The Replit Agent must list which ones it tested in its final response.

### A. Register flow (email/password)
1. Go to `/register`. UI matches screenshot 1 (plus the "Already have an account" tab).
2. Submit with valid data. Should redirect to `/verify-pending?email=<email>`.
3. Check Mailtrap dashboard — verification email arrived from `profile@20fit.id` with correct branding.
4. Click the link in the email — should land on `/verify?token=...`, show success state, then offer "Lanjut ke Login".
5. Try logging in with the password set — should succeed.
6. After login, Onboarding modal appears (because `onboarding_completed = false`).
7. Click "Skip" — modal closes, user lands on Dashboard. Profile page shows "Lengkapi data" card.

### B. Register flow (Google)
1. Click "Sign up with Google" on `/register`. Redirected to Google.
2. After consent, redirected to `/auth/callback` then `/`.
3. Dashboard loads. AuthContext has `user` + `profile`. `email_verified_at` is set automatically.
4. Onboarding modal appears.

### C. Login (password)
1. Go to `/login`. UI matches screenshot 2 (plus Magic Link button below Google).
2. Wrong password → red banner "Email atau password salah."
3. Correct password but unverified email → sign out + banner "Email belum terverifikasi" + "Kirim ulang" link.
4. Correct password + verified → land on `/`.

### D. Login (Magic Link)
1. From `/login`, click "Send me a magic link instead". Lands on `/magic-link?email=...`.
2. Submit. Lands on `/magic-link-sent?email=...`.
3. Check Mailtrap — magic link email arrived with IP + UA in the body.
4. Click the link. Lands on `/auth/magic?token=...`, brief spinner, then redirected to `/`. User is logged in.
5. Click the same link again — should fail with "Link tidak valid atau sudah kedaluwarsa".

### E. Login (Google)
1. Same as B, but accessed from `/login` Google button.

### F. Onboarding
1. After login with `onboarding_completed = false`, modal opens.
2. Fill all 3 steps. Submit. Profile row updates correctly. Toast appears.
3. Reload page. Modal does NOT reappear. Profile page no longer shows "Lengkapi data" card.

### G. Skip onboarding
1. New user. Modal opens. Click Skip on step 1.
2. Modal closes. Dashboard loads.
3. Reload. Modal does NOT reappear (skipped_at is set).
4. Profile page shows "Lengkapi data" card.
5. Click "Lengkapi Sekarang →". Modal opens at step 1.
6. Complete. `onboarding_completed = true`. Profile card disappears.

### H. Protected routes
1. Sign out. Try to visit `/`, `/nutrition`, `/progress`, `/profile`, `/moments`.
2. Each redirects to `/login`.

### I. Mobile responsive
1. iPhone SE width (375px). Register form is full-width minus 32px. All inputs touchable, no overflow.
2. iPad Mini width (768px). Card is centered, 480px wide. No layout breakage.
3. Desktop 1440px. Same as iPad.

### J. Edge cases
1. Click verification link twice — second click shows expired/invalid state.
2. Wait 24h, click verification link — shows expired state.
3. Wait 15min after magic link email, click link — shows expired state.
4. Request magic link for non-existent email — generic success response (no info leak).
5. Try registering with an email already in use — inline error on field.
6. Submit Register form with invalid email — inline validation message.
7. Submit Register with weak password — submit button stays disabled, strength meter shows red.

---

## 11. FINAL CHECKLIST — Replit Agent must complete every item

When you finish, do not say "done" until you have:

### Code
- [ ] All 18 new frontend files created with full implementations (no TODO placeholders).
- [ ] All 6 modified frontend files updated, no consuming components broken.
- [ ] All 4 new backend files created with full implementations.
- [ ] `auth.ts` router registered in `routes/index.ts`.
- [ ] No new npm packages installed beyond what section 4 permits.
- [ ] No `console.log` left in committed code.
- [ ] No secrets logged. Grep confirmed.
- [ ] All 5 backend endpoints respond correctly to manual `curl` (tested locally).
- [ ] AuthContext exports the exact same interface as before. Sidebar, Profile, MedicalCheckup still render without TypeScript errors.

### Database
- [ ] `db-migrations/01_auth_profile_schema.sql` created. User instructed to run it manually.
- [ ] User has confirmed the migration ran successfully (Agent: ask user to confirm before testing the flow end-to-end).

### Env / Secrets
- [ ] All required Replit Secrets listed in final response.
- [ ] User has confirmed Mailtrap domain `20fit.id` is verified.
- [ ] User has confirmed Google Cloud OAuth client is set up and credentials are in Supabase.
- [ ] User has confirmed Supabase "Confirm email" is set to OFF.

### Mailtrap
- [ ] `sendMail` tested: at least one real email delivered to a test inbox.
- [ ] Verification email rendered correctly in Gmail, Outlook web, and iOS Mail (screenshot in final response if possible).
- [ ] Magic link email rendered correctly.
- [ ] Both emails arrive from `profile@20fit.id` with sender name "Profile 20FIT".

### Flows manually tested
- [ ] Test scenario A (register + verify + login + onboard) — passed
- [ ] Test scenario B (Google register) — passed
- [ ] Test scenario C (password login + unverified handling) — passed
- [ ] Test scenario D (magic link, including replay attack) — passed
- [ ] Test scenario E (Google login) — passed
- [ ] Test scenario F (onboarding complete) — passed
- [ ] Test scenario G (skip + resurface from Profile) — passed
- [ ] Test scenario H (protected routes) — passed
- [ ] Test scenario I (responsive on 3 widths) — passed
- [ ] Test scenario J (all 7 edge cases) — passed

### Security
- [ ] Service role key is only used server-side. Grep frontend code for `SERVICE_ROLE` — must return zero matches.
- [ ] Mailtrap token is only used server-side. Grep frontend code for `API_Tokens_Mailtrap` and `MAILTRAP` — must return zero matches.
- [ ] Tokens are cryptographically random (`crypto.randomBytes(32).toString('hex')`).
- [ ] Tokens are single-use (`consumed_at` is set on first verification).
- [ ] Token tables have RLS enabled with deny-all policies (only service role accesses them).
- [ ] Rate limiting in place for `resend-verification` and `magic-link/request` (60s per email).
- [ ] No phone or email is logged in plain text on backend.

### UX
- [ ] All copy is in Bahasa Indonesia where user-facing (Jaksel-light tone, not formal).
- [ ] Loading states use the existing skeleton/spinner components.
- [ ] All errors surface clearly with sonner toast or inline messages.
- [ ] All forms support Enter key to submit.
- [ ] All inputs have correct `autocomplete` attributes (`email`, `tel`, `new-password`, `current-password`, `name`).
- [ ] Mobile inputs trigger correct on-screen keyboard (`inputMode="email"`, `inputMode="tel"`, `inputMode="numeric"` for age/height/weight).
- [ ] Terms link in footer (`https://20fit.id/legal`) opens in new tab with `rel="noopener noreferrer"`.

### Final response from Agent must include
- [ ] List of all created/modified files (just paths).
- [ ] All Replit Secrets the user needs to set (from section 5.4) — split clearly into "already set, don't touch" vs "new, please add". Confirm `API_Tokens_Mailtrap` is read with exact casing in backend code.
- [ ] All Supabase Dashboard settings the user needs to configure (section 5.2).
- [ ] **The exact Google Cloud Console block** from section 5.3, with the actual detected Replit dev URL filled in. This must be visually distinct (boxed/highlighted) so the user can copy-paste without hunting.
- [ ] All Mailtrap settings (section 5.1).
- [ ] Reminder to run `db-migrations/01_auth_profile_schema.sql` manually.
- [ ] Screenshots or copy of the two email templates rendered.
- [ ] List of which test scenarios were verified end-to-end vs. partially verified vs. not verified.
- [ ] Explicit prompt to user: *"Please confirm (1) the SQL migration ran, (2) the Google OAuth client is created with the redirect URI above, (3) Client ID + Secret are in Supabase, (4) the new Replit Secrets in section 5.4 are added, before I run end-to-end tests."*

---

## 12. IF YOU GET STUCK

If at any point you are uncertain about:
- Supabase admin API behavior (especially `generateLink` for the magic link session bridge)
- Mailtrap API response format
- An existing component you'd need to modify outside the scope listed above
- A design decision not covered in this document

**STOP. Ask the user. Do not guess.**

The goal of this task is a working, secure, well-tested auth flow that ships to `https://profile.20fit.id`. A working partial implementation that you flag clearly is more valuable than a "complete" implementation that silently breaks something.
