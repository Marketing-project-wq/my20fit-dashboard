# 20fit.id Member Dashboard — Claude Code Context

> This file is the single source of truth for Claude Code to understand and continue work on this project.
> Live URL: **https://profile.20fit.id**

---

## 1. What This Project Is

**my20fit** is a private member dashboard for 20FIT Sport Clinic Indonesia. It runs at `profile.20fit.id` and gives gym members:

- Personalized fitness dashboard (weather, wellness check-in, MCU results, today's checklist)
- Full auth flow: email/password, Google OAuth, magic link, email verification
- Progress tracking with charts
- AI-generated nutrition recommendations (Claude claude-opus-4-5 via Anthropic)
- AI Medical Checkup (MCU) analysis — uploads lab results, Claude reads and grades them
- Onboarding flow (collects age, gender, height, weight, activity level, goals)
- Profile management with avatar upload

**Target users:** Indonesian athletes / gym members. UI language is **English**. Some button/copy text is **Bahasa Indonesia** (deliberate, per client).

---

## 2. Repository Structure

```
/
├── artifacts/
│   ├── my20fit/          ← React + Vite frontend (the main app)
│   └── api-server/       ← Express 5 backend (Node.js)
├── lib/
│   ├── api-client-react/ ← Orval-generated React Query hooks (codegen)
│   ├── api-spec/         ← OpenAPI YAML + Orval config
│   ├── api-zod/          ← Orval-generated Zod schemas
│   └── db/               ← Drizzle ORM schema (internal workspace DB, NOT Supabase)
├── scripts/              ← Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── CLAUDE.md             ← (this file)
```

> **Note:** The `lib/db` Drizzle schema is for an internal workspace DB (conversations/messages). The app's primary database is **Supabase** (Postgres), accessed directly via the Supabase JS client and supabase-admin SDK.

---

## 3. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TypeScript 5.9, Tailwind CSS v4, wouter (router) |
| State | TanStack React Query (staleTime 60s, no refetch on focus) |
| UI components | Radix UI primitives + custom components (shadcn-style) |
| Animations | Framer Motion |
| Charts | Recharts |
| Backend | Express 5, TypeScript, pnpm, esbuild |
| Database | Supabase (Postgres) — accessed via `@supabase/supabase-js` |
| Auth | Supabase Auth (email/password + Google OAuth) + custom email verification + magic link |
| Email | Mailtrap transactional API |
| AI | Anthropic Claude claude-opus-4-5 (MCU analysis + nutrition recommendations) |
| Monorepo | pnpm workspaces |
| Package manager | pnpm |

---

## 4. Environment Variables

### Frontend (`artifacts/my20fit`) — Vite env vars (prefix `VITE_`)

| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `VITE_WEATHER_API_KEY` | WeatherAPI.com key (used in WeatherCard component) |

### Backend (`artifacts/api-server`) — Node.js env vars

| Variable | Purpose |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (admin operations) |
| `API_Tokens_Mailtrap` | Mailtrap API token |
| `MAILTRAP_API_URL` | Mailtrap send endpoint (e.g. `https://send.api.mailtrap.io/api/send`) |
| `MAILTRAP_SENDER_EMAIL` | From address (e.g. `noreply@20fit.id`) |
| `MAILTRAP_SENDER_NAME` | From name (e.g. `20fit.id`) |
| `APP_URL` | Public app URL — **must be `https://profile.20fit.id` in production** |
| `PORT` | Dev server port (injected by Replit workflow) |
| `BASE_PATH` | Vite base path (injected by Replit workflow) |

> **Critical:** `APP_URL` is used to build verification links and magic links. Wrong value = broken email flows.

---

## 5. How to Run

```bash
# Install all dependencies
pnpm install

# Run frontend dev server (needs PORT + BASE_PATH env vars)
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/my20fit run dev

# Run API server
pnpm --filter @workspace/api-server run dev

# Typecheck everything
pnpm run typecheck

# Build frontend for production
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/my20fit run build

# Regenerate API hooks from OpenAPI spec (after changing lib/api-spec/openapi.yaml)
pnpm --filter @workspace/api-spec run codegen
```

---

## 6. Supabase Database Schema

All tables live in the `public` schema on Supabase. Accessed via `supabase-js` client.

### `my20fit_profile`
Main user profile table. One row per `auth.users` user.

```sql
id                    uuid PRIMARY KEY DEFAULT gen_random_uuid()
auth_user_id          uuid UNIQUE NOT NULL REFERENCES auth.users(id)
email                 text
full_name             text
phone                 text          -- stored as +62XXXXXXXXX
is_plus_member        boolean DEFAULT false
email_verified_at     timestamptz   -- null = not verified
onboarding_completed  boolean DEFAULT false
onboarding_skipped_at timestamptz   -- null = not skipped
age                   int
gender                text          -- 'male' | 'female' | 'other'
gender_selected_at    timestamptz
height_cm             numeric
weight_kg             numeric
activity_level        text          -- 'sedentary'|'light'|'moderate'|'active'|'very_active'
gym_experience        text          -- 'beginner'|'intermediate'|'advanced'
daily_schedule        text          -- 'morning'|'afternoon'|'evening'|'flexible'
created_at            timestamptz DEFAULT now()
updated_at            timestamptz DEFAULT now()
```

### `email_verification_tokens`
Custom email verification (Supabase's built-in verification is bypassed).

```sql
id             uuid PRIMARY KEY DEFAULT gen_random_uuid()
auth_user_id   uuid REFERENCES auth.users(id)
email          text NOT NULL
token          text NOT NULL UNIQUE  -- 32-byte hex random
expires_at     timestamptz NOT NULL  -- 24 hours from creation
consumed_at    timestamptz           -- null = still valid
created_at     timestamptz DEFAULT now()
```

### `magic_link_tokens`
Custom magic link tokens (Supabase magic link is used server-side to generate a real session).

```sql
id           uuid PRIMARY KEY DEFAULT gen_random_uuid()
email        text NOT NULL
token        text NOT NULL UNIQUE  -- 32-byte hex random
expires_at   timestamptz NOT NULL  -- 15 minutes from creation
consumed_at  timestamptz           -- null = still valid, consumed on first use
ip_address   text
user_agent   text
created_at   timestamptz DEFAULT now()
```

### RLS Policies
- `my20fit_profile`: users can read/update their own row (`auth.uid() = auth_user_id`)
- `email_verification_tokens` / `magic_link_tokens`: no direct client access — all operations go via the API server using the service role key

---

## 7. Authentication Flow

### Registration
1. User fills Register form → POST `/api/auth/register`
2. API creates `auth.users` entry (email_confirm: false) + upserts `my20fit_profile` row
3. API generates a 64-char hex token in `email_verification_tokens`, sends Mailtrap email
4. User lands on `/verify-email-pending`

### Email Verification
1. User clicks link → `/verify-email?token=<hex>`
2. Frontend calls GET `/api/auth/verify?token=<hex>`
3. API validates token (not expired, not consumed), marks `email_verified_at`, consumes token
4. Frontend then calls `supabase.auth.signInWithPassword()` to start a real session

### Google OAuth
1. Frontend calls `supabase.auth.signInWithOAuth({ provider: "google" })`
2. Supabase handles redirect → `/auth/callback`
3. `AuthCallback.tsx` calls `supabase.auth.exchangeCodeForSession()`
4. `AuthContext` auto-marks Google users as `email_verified_at` on first login

### Magic Link
1. User enters email on `/magic-link` → POST `/api/auth/magic-link/request`
2. API creates token in `magic_link_tokens`, sends Mailtrap email
3. User clicks link → `/magic-link/consume?token=<hex>`
4. Frontend calls GET `/api/auth/magic-link/verify?token=<hex>`
5. API consumes token, generates real Supabase session link server-side, returns `access_token` + `refresh_token`
6. Frontend calls `supabase.auth.setSession({ access_token, refresh_token })`

### Session Management (`AuthContext.tsx`)
- `supabase.auth.getSession()` on mount to restore persisted session
- `supabase.auth.onAuthStateChange()` for real-time auth events
- `my20fit_profile` row fetched on every session start
- Background prefetch of protected page JS chunks via `requestIdleCallback` once authenticated
- `localStorage` key: `my20fit-supabase-auth` (Supabase session), `my20fit_theme`, `my20fit_avatar`

---

## 8. API Routes

All routes prefixed with `/api` (mounted in `app.ts`).

### Auth (`/api/auth/*`)

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Create user + send verification email |
| POST | `/api/auth/resend-verification` | Resend verification email (rate-limited 60s) |
| GET | `/api/auth/verify?token=` | Consume email verification token |
| POST | `/api/auth/magic-link/request` | Send magic link email (rate-limited 60s) |
| GET | `/api/auth/magic-link/verify?token=` | Verify magic link, return session tokens |

### MCU Analysis (`/api/analyze-mcu`)

| Method | Path | Description |
|---|---|---|
| POST | `/api/analyze-mcu` | Upload MCU doc (JPEG/PNG/PDF), Claude validates + analyzes |

**Response shape:**
```typescript
{
  grade: "A" | "B" | "C" | "D",
  summary: string,          // 2 sentences, Bahasa Indonesia
  metrics: Array<{ label: string, value: string, status: "ok"|"high"|"low"|"warning", note: string }>,
  recommendations: string[],
  checklist: Array<{ icon: string, title: string, reason: string, priority: "high"|"med"|"low", duration: null, location: "gym"|"home"|"clinic"|null }>,
  doctor_notes: string,
  reviewed_at: string,      // date string
  patient_name: string | null
}
```

### Nutrition (`/api/nutrition-recommendation`)

| Method | Path | Description |
|---|---|---|
| POST | `/api/nutrition-recommendation` | AI nutrition plan from MCU + wellness data |

**Request body:**
```typescript
{
  mcuData?: { grade, summary, metrics, doctor_notes },
  wellnessData?: { mood: 1-5, energy: 1-10, stress: 1-10, soreness: string },
  sleepData?: { bed: string, wake: string, hours: number, quality: string },
  waterData?: { logs: { ml: number }[], totalL: number, target: number },
  workoutData?: Array<{ type: string, duration: number, date: string }>
}
```

---

## 9. Frontend Architecture

### Router (`src/App.tsx`)
- Uses `wouter` for routing (lightweight alternative to React Router)
- **All pages are lazy-loaded** via `React.lazy` + `<Suspense>` — critical for perf
- `<Suspense fallback={<RouteFallback />}>` wraps all routes
- `OnboardingModal` has its own nested `<Suspense fallback={null}>` to avoid full-app spinner
- `queryClient` configured: `staleTime: 60_000`, `refetchOnWindowFocus: false`, `retry: 1`

### Pages
| Route | Component | Notes |
|---|---|---|
| `/` | `Dashboard.tsx` | Protected. Sidebar + all widgets |
| `/progress` | `Progress.tsx` | Protected. Charts, workout log |
| `/nutrition` | `Nutrition.tsx` | Protected. AI nutrition plan |
| `/profile` | `Profile.tsx` | Protected. Avatar, personal info, settings |
| `/moments` | `ComingSoon.tsx` | Protected. Placeholder |
| `/login` | `Login.tsx` | Desktop: split-panel with hero. Mobile: card |
| `/register` | `Register.tsx` | 2-step: Data Diri → Face Registration |
| `/verify-email` | `VerifyEmail.tsx` | Token consumed here |
| `/verify-email-pending` | `VerifyEmailPending.tsx` | After registration |
| `/magic-link` | `MagicLink.tsx` | Enter email for magic link |
| `/magic-link/sent` | `MagicLinkSent.tsx` | Confirmation screen |
| `/magic-link/consume` | `MagicLinkConsume.tsx` | Consumes token, sets session |
| `/auth/callback` | `AuthCallback.tsx` | Google OAuth return URL |
| `/reset-password` | `ResetPassword.tsx` | Supabase password reset |

### Key Hooks & Contexts
- `AuthContext` — global user + profile state, signOut, refreshProfile
- `useProfile` — thin wrapper for updating `my20fit_profile` via Supabase client
- `useScrollRestore` — restores scroll position on navigation

### Layout Pattern
- **Desktop (≥1024px):** Fixed sidebar (`Sidebar.tsx`, 220px wide, dark bg) + scrollable main content
- **Mobile (<1024px):** Sticky top header (`Header.tsx`) + fixed bottom nav (`BottomNav.tsx`)
- Protected page wrapper: `max-w-[720px] mx-auto` content column

---

## 10. Design System

### Brand Colors
```
Brand Red:       #C41101   (primary CTA, active nav, brand accent)
Brand Gold:      #D4A800   (Plus member indicator)
Background:      #EDE8DF   (light) / #0A0908 (dark) — warm off-white / near-black
Card:            #FFFFFF   (light) / #131310 (dark)
Card2:           #F0EDE5   (light) / #1A1A1A (dark) — secondary card bg
Text:            #0A0908   (light) / #F0EDE6 (dark)
Muted text:      #9E8E7A   (light) / #6E665C (dark)
Border:          #DDD5C8 / rgba(255,255,255,0.06)
```

### CSS Variables (defined in `src/index.css`)
```css
--red, --green, --blue, --gold, --orange, --purple, --cyan, --pink
--bg, --bg-secondary, --card, --card-dark, --card2
--text, --text-soft, --muted, --muted-light
--border, --border-subtle, --border-warm
--shadow, --shadow-sm, --shadow-md, --shadow-lg
--radius: 14px
```

### Typography System
```
Font: Anton           → Display/Hero headings (big uppercase impact text)
Font: Barlow Condensed 900 → Uppercase tracking labels only (section headers, tags, badges)
Font: Inter 400-600   → Body text, descriptions, form labels, paragraphs (DEFAULT)
Font: JetBrains Mono  → Numbers, data values, code

body { font-family: 'Inter', sans-serif; font-weight: 400; }
h1-h6 { font-family: 'Anton', sans-serif; font-weight: 400; }
.section-header h2 { font-family: 'Barlow Condensed'; font-weight: 900; font-size: 9px; letter-spacing: 3px; }
```

Google Fonts import (in `src/index.css` line 1):
```
Anton | Barlow Condensed (ital,wght: 0,400; 0,900; 1,400; 1,900) | Inter (wght: 400;500;600;700) | JetBrains Mono (wght: 400;700)
```

### Dark Mode
- Toggled by adding `.dark` class to `<html>`
- Persisted in `localStorage` key `my20fit_theme`
- CSS vars redefined under `.dark {}` in `index.css`
- Tailwind dark variant: `@custom-variant dark (&:is(.dark *))`

### Logo
- File: `artifacts/my20fit/public/logo-20fit.jpg` → served at `/logo-20fit.jpg`
- Used in: Sidebar (40px h, white bg, rounded), Header mobile (36px h), all auth pages (48-56px h)
- Email templates: `https://profile.20fit.id/logo-20fit.jpg` (full URL required for email clients)
- **Never use the text "my20FIT"** in the UI — always use the `<img>` logo

### Card / Section Pattern
```jsx
// Section header
<div className="section-header">
  <h2>SECTION LABEL</h2>  {/* Barlow Condensed 900, 9px, 3px tracking */}
  <div className="section-header-line" />
</div>

// Card
<div className="app-card">...</div>  {/* 18px radius, shadow, hover lift */}
```

---

## 11. Vite Build Config (`vite.config.ts`)

Key settings:
- `base`: set from `BASE_PATH` env var (required)
- `manualChunks`: splits `recharts/d3`, `framer-motion`, `@supabase`, `embla-carousel` into separate chunks
  - **Do NOT split React into its own chunk** — causes circular chunk graph
- `cssCodeSplit: true`, `sourcemap: false`, `minify: "esbuild"`, `target: "es2020"`
- `server.allowedHosts: true` — required because dev server runs behind Replit proxy

---

## 12. Important Quirks & Known Issues

### Auth / Registration
- **Custom email verification** — Supabase's built-in email verification is disabled. We generate our own tokens in `email_verification_tokens` and use Mailtrap to send them.
- **Google users** are auto-marked as `email_verified_at` in `AuthContext.fetchProfile()` on first login.
- **Phone normalization** in the backend (`normalizePhone()`): strips non-digits, removes leading `0`, prepends `+62`. Result always starts with `+62`. Stored as `+62XXXXXXXXX` in `my20fit_profile.phone`.
- **Profile upsert**: Registration does both `supabaseAdmin.auth.admin.createUser()` AND an explicit `upsert` into `my20fit_profile` (belt-and-suspenders because the DB trigger can fail silently).

### Frontend Performance
- All 15 pages are lazy-loaded — initial JS for `/login` is ~104KB gzip (React + radix + wouter only).
- Protected-route chunks are prefetched via `requestIdleCallback` as soon as `AuthContext` detects a session — so navigation after login is near-instant.
- `PageWrapper` opacity-fade animation was **removed** (it added 280ms per navigation). No transitions between pages now.

### MCU Analysis
- Two-step Claude calls: Step 1 = validation (is this actually an MCU doc?), Step 2 = full analysis.
- Uses `claude-opus-4-5`. Accepts JPG, PNG, PDF. Max file size 10MB.
- Results stored in `localStorage` (`my20fit_mcu_result`) — NOT in the database.
- Emits a `CustomEvent("mcu-analyzed")` that `TodaysChecklist` listens to for populating tasks.

### Onboarding
- Triggered 800ms after first login if `profile.onboarding_completed` is false and `profile.onboarding_skipped_at` is null.
- 3 steps: Basic → Physical → Goals.
- Saving calls `supabase.from("my20fit_profile").update(...)` — if 0 rows affected, surfaces an error banner ("Update affected 0 rows — likely session/RLS issue").
- After completion, sets `onboarding_completed: true` via `updateProfile()`.

### localStorage Keys
| Key | Contents |
|---|---|
| `my20fit-supabase-auth` | Supabase session (managed by supabase-js) |
| `my20fit_theme` | `"light"` or `"dark"` |
| `my20fit_avatar` | Base64 avatar image |
| `my20fit_mcu_result` | Last MCU analysis JSON |
| `my20fit_checklist_*` | Today's checklist state (keyed by date) |
| `my20fit_checkin_*` | Wellness check-in data |
| `my20fit_sleep` | Sleep log data |
| `my20fit_water` | Water intake data |
| `my20fit_workout` | Workout log data |

### Package Names (internal — do not rename)
- `@workspace/my20fit` (package.json name)
- `@workspace/api-server`
- TypeScript type: `My20fitProfile`
- DB table: `my20fit_profile`
- These are internal identifiers only — user-facing text uses "20fit.id"

---

## 13. Email Templates (`artifacts/api-server/src/lib/email-templates.ts`)

Two templates:
1. `verificationEmailHtml({ fullName, verifyUrl })` — email verification
2. `magicLinkEmailHtml({ email, loginUrl, ipAddress?, userAgent? })` — magic link

Both use a shared `baseTemplate()` with:
- Logo: `<img src="https://profile.20fit.id/logo-20fit.jpg">`
- Font stack: `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif`
- Background: `#F5F1E8` (warm off-white matching app)
- Card background: `#FFFFFF`, border: `#E5E1D8`
- CTA button: `#C41101` (brand red)

---

## 14. Component Map

```
Dashboard
├── Sidebar (desktop nav, dark bg)
├── Header (mobile top bar)
├── BottomNav (mobile bottom nav)
├── Greeting (user name + time greeting)
├── WeatherCard (WeatherAPI.com, real-time)
├── MedicalCheckup (MCU upload + analysis display)
├── TodaysChecklist (from MCU analysis or defaults)
├── QuickCheckin (wellness: mood, energy, stress, muscle soreness, sleep, water, workout)
├── MyMoments (photo placeholder — "coming soon" per section)
└── PlusCard (upgrade to Plus membership CTA)

Auth pages all use AuthShell (centered card layout, logo on top)
Onboarding: OnboardingModal → OnboardingStepBasic / Physical / Goals
```

---

## 15. Supabase Client Setup

### Frontend (`src/lib/supabase.ts`)
```typescript
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    storage: localStorage,
    storageKey: "my20fit-supabase-auth",
    flowType: "pkce",
    detectSessionInUrl: true,
  },
});
```

### Backend (`src/lib/supabase-admin.ts`)
```typescript
import { createClient } from "@supabase/supabase-js";

export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});
```

---

## 16. Deployment

- **Production URL:** `https://profile.20fit.id`
- **`APP_URL` secret** must be set to `https://profile.20fit.id` for email links to work
- Frontend is a static SPA — needs a fallback to `index.html` for all routes (Vite handles this in `historyApiFallback: true`)
- API server runs at `/api/*`

---

*Last updated: June 2026 | Project: my20fit dashboard | Client: 20FIT Sport Clinic Indonesia*
