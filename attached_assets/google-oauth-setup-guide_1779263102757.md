# my20FIT — Google OAuth Setup Guide
## Untuk domain `profile.20fit.id` + dev URL Replit

> **Status:** Replit udah selesai bangun semua flow. Sekarang lu tinggal setup external (Google Cloud, Supabase, Replit Secrets).
> Total waktu: ~15 menit kalau semua tab udah lu buka.

---

## VALUES YANG LU BUTUHKAN

Catat dulu nilai-nilai ini di notepad — bakal dipake berkali-kali:

```
Supabase project ref:   cpvzwqptzcxnwzfzgrmt
Supabase callback URL:  https://cpvzwqptzcxnwzfzgrmt.supabase.co/auth/v1/callback
Production domain:      https://profile.20fit.id
Dev URL (Replit):       https://efbf06f6-4570-42b1-880a-a32218428432-00-14ogrhicrsgfw.sisko.replit.dev
```

---

## STEP 1 — Google Cloud Console (5 menit)

### 1.1 Buka Google Cloud Console
Pergi ke: **https://console.cloud.google.com/**

Login pake akun Google yang lu pake buat manage `20fit.id` (kalau belum ada project, bikin project baru namanya `20fit-auth` atau apapun).

### 1.2 Enable OAuth consent screen (kalau belum)
- Sidebar kiri → **APIs & Services** → **OAuth consent screen**
- Pilih **External** → Create
- Isi:
  - App name: `my20FIT`
  - User support email: email lu
  - App logo: optional (boleh skip dulu)
  - **App domain → Application home page:** `https://20fit.id`
  - **App domain → Application privacy policy link:** `https://20fit.id/legal`
  - **App domain → Application terms of service link:** `https://20fit.id/legal`
  - **Authorized domains:** tambah `20fit.id` dan `supabase.co`
  - Developer contact: email lu
- Save & Continue
- **Scopes:** pilih `.../auth/userinfo.email`, `.../auth/userinfo.profile`, `openid` → Save
- **Test users:** tambah email lu sendiri sebagai test user → Save
- Publishing status: biarkan dulu di "Testing". Lu bisa pake login Google selama lu jadi test user. Nanti kalau mau public, klik "Publish App" (proses verifikasi Google ~1-3 hari biasanya cepet karena lu cuma minta basic scopes).

### 1.3 Bikin OAuth 2.0 Client ID
- Sidebar kiri → **APIs & Services** → **Credentials**
- Klik **+ CREATE CREDENTIALS** → **OAuth client ID**
- **Application type:** Web application
- **Name:** `my20FIT Profile App`

#### Authorized JavaScript origins (klik "+ ADD URI" untuk masing-masing)
Paste **persis** seperti ini, satu per satu:

```
https://profile.20fit.id
https://cpvzwqptzcxnwzfzgrmt.supabase.co
https://efbf06f6-4570-42b1-880a-a32218428432-00-14ogrhicrsgfw.sisko.replit.dev
```

#### Authorized redirect URIs (klik "+ ADD URI")
**HANYA SATU URI** di sini:

```
https://cpvzwqptzcxnwzfzgrmt.supabase.co/auth/v1/callback
```

> ⚠️ **JANGAN tambahin `https://profile.20fit.id/auth/callback` di sini.** URL itu bukan Google redirect — itu redirect dari **Supabase ke app lu**, yang nanti lu setup di Supabase Dashboard (step 2.2). Salah taro di sini gak bikin error tapi confusing pas debugging.

- Klik **CREATE**
- Popup muncul kasih lu **Client ID** dan **Client Secret** — **copy keduanya**, jangan ditutup dulu

---

## STEP 2 — Supabase Dashboard (3 menit)

Buka: **https://supabase.com/dashboard/project/cpvzwqptzcxnwzfzgrmt**

### 2.1 Paste Google credentials
- Sidebar kiri → **Authentication** → **Providers**
- Cari **Google**, klik buat expand
- Toggle **Enable Sign in with Google** → ON
- Paste:
  - **Client ID** (dari step 1.3)
  - **Client Secret** (dari step 1.3)
- Skip Authorized Client IDs (kosongkan, gak dipake)
- Klik **Save**

### 2.2 Set Site URL + Redirect URLs
- Sidebar kiri → **Authentication** → **URL Configuration**
- **Site URL:**
  ```
  https://profile.20fit.id
  ```
- **Redirect URLs (allowlist)** — tambahin SEMUA ini (klik "Add URL" satu per satu):
  ```
  https://profile.20fit.id/**
  https://profile.20fit.id/auth/callback
  https://profile.20fit.id/verify-email
  https://profile.20fit.id/magic-link/consume
  https://efbf06f6-4570-42b1-880a-a32218428432-00-14ogrhicrsgfw.sisko.replit.dev/**
  https://efbf06f6-4570-42b1-880a-a32218428432-00-14ogrhicrsgfw.sisko.replit.dev/auth/callback
  https://efbf06f6-4570-42b1-880a-a32218428432-00-14ogrhicrsgfw.sisko.replit.dev/verify-email
  https://efbf06f6-4570-42b1-880a-a32218428432-00-14ogrhicrsgfw.sisko.replit.dev/magic-link/consume
  ```
- Klik **Save**

> Note: Supabase mendukung wildcard `**` di redirect URLs (beda dari Google Cloud yang strict). Wildcard `/**` cover semua sub-path, jadi sebenernya cukup 2 entry dengan `/**`. Tapi gue list satu-satu juga buat safety kalau ada migration policy Supabase di masa depan.

### 2.3 Pastikan "Confirm email" OFF
- Masih di **Authentication** → **Providers** → **Email**
- **Confirm email:** harus **OFF** (kita pake Mailtrap sendiri, bukan Supabase email)
- Save

### 2.4 Copy Service Role Key
- Sidebar kiri → **Project Settings** → **API**
- Section **Project API keys**, scroll ke **service_role** (warna merah, ada warning "secret")
- Klik **Reveal** → copy
- Simpan dulu, dipake di Step 4

---

## STEP 3 — Mailtrap (5 menit, kalau belum)

### 3.1 Verify domain
- Login ke **https://mailtrap.io/**
- **Sending Domains** → klik **Add Domain** → masukin `20fit.id`
- Mailtrap kasih DNS records (SPF, DKIM, DMARC) — tambahin ke DNS provider domain `20fit.id` lu (Cloudflare/Niagahoster/whoever)
- Tunggu DNS propagate (~5-30 menit), klik **Verify** di Mailtrap

### 3.2 Bikin sender identity
- Di sending domain `20fit.id`, klik **Add Sender**
- Email: `profile@20fit.id`
- Name: `Profile 20FIT`
- Save

### 3.3 API Token (lu udah punya `API_Tokens_Mailtrap`)
Lu udah set ini di Replit Secret. Skip kalau udah ada. Kalau belum:
- **Settings** → **API Tokens** → klik **+ Add Token**
- Permissions: **Send Email** only
- Save → copy token

---

## STEP 4 — Replit Secrets (2 menit)

Buka Replit project lu, klik ikon padlock **Secrets** di sidebar.

Yang udah ada (dari screenshot lu): jangan disentuh.
```
✓ SESSION_SECRET
✓ AI_INTEGRATIONS_ANTHROPIC_BASE_URL
✓ AI_INTEGRATIONS_ANTHROPIC_API_KEY
✓ VITE_WEATHER_API_KEY
✓ VITE_SUPABASE_ANON_KEY
✓ VITE_SUPABASE_URL
✓ API_Tokens_Mailtrap
```

**Tambah 6 secret baru ini** (klik "+ New Secret" untuk tiap baris):

| Key | Value |
|---|---|
| `SUPABASE_URL` | `https://cpvzwqptzcxnwzfzgrmt.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | (paste dari Step 2.4) |
| `MAILTRAP_API_URL` | `https://send.api.mailtrap.io/api/send` |
| `MAILTRAP_SENDER_EMAIL` | `profile@20fit.id` |
| `MAILTRAP_SENDER_NAME` | `Profile 20FIT` |
| `APP_URL` | `https://efbf06f6-4570-42b1-880a-a32218428432-00-14ogrhicrsgfw.sisko.replit.dev` |
| `VITE_APP_URL` | `https://efbf06f6-4570-42b1-880a-a32218428432-00-14ogrhicrsgfw.sisko.replit.dev` |

> ⚠️ Untuk **production**, nanti lu update `APP_URL` dan `VITE_APP_URL` jadi `https://profile.20fit.id` saat deploy.

---

## STEP 5 — Run SQL Migration di Supabase (1 menit)

- Buka **Supabase Dashboard** → sidebar **SQL Editor** → klik **+ New query**
- Buka file `db-migrations/01_auth_profile_schema.sql` di Replit
- Copy seluruh isi file → paste ke SQL Editor Supabase
- Klik **Run** (atau Cmd/Ctrl + Enter)
- Pastikan output: `Success. No rows returned.` (atau similar success message)
- Verifikasi: sidebar **Table Editor** → harus ada 3 tabel baru:
  - `my20fit_profile`
  - `email_verification_tokens`
  - `magic_link_tokens`

---

## STEP 6 — Restart Replit & Test (2 menit)

### 6.1 Restart API server
Di Replit, klik tombol **Restart** di workflow API server. Pastikan log nggak ada error:
```
✓ API server listening on port ...
```

### 6.2 Test Google Sign In
1. Buka `https://efbf06f6-4570-42b1-880a-a32218428432-00-14ogrhicrsgfw.sisko.replit.dev/login`
2. Klik **Sign in with Google**
3. Pilih akun Google lu
4. Harus redirect balik ke dashboard `/`
5. Cek di Supabase **Authentication → Users** — user lu muncul dengan provider `google`

### 6.3 Test register email + Mailtrap
1. Buka `/register`
2. Daftar pake email lain (bukan yang udah lu pake di Google)
3. Harus redirect ke `/verify-email-pending`
4. Cek inbox — email dari `profile@20fit.id` harus masuk
5. Klik link → harus redirect ke success page → klik "Lanjut ke Login"
6. Login pake email + password yang baru dibuat
7. Onboarding modal harus muncul

### 6.4 Test Magic Link
1. Di login page, klik **Send me a magic link instead**
2. Masukin email yang udah verified
3. Cek inbox → email magic link masuk
4. Klik link → otomatis logged in & redirect ke dashboard

---

## KALAU ERROR — TROUBLESHOOTING

### Error: `redirect_uri_mismatch` saat klik Google Sign In
Penyebab paling umum: Supabase callback URL belum di-add di Google Cloud Authorized redirect URIs, ATAU lu salah taro URL frontend (`/auth/callback`) di sana.

Fix:
- Google Cloud Console → Credentials → klik OAuth client lu
- **Authorized redirect URIs harus PERSIS** `https://cpvzwqptzcxnwzfzgrmt.supabase.co/auth/v1/callback` (cuma 1 URI)
- Jangan tambahin trailing slash, jangan tambahin `https://profile.20fit.id/auth/callback`

### Error: setelah login Google, balik ke `/login` lagi
Penyebab: Site URL atau Redirect URLs di Supabase Dashboard belum di-set.

Fix:
- Supabase → Authentication → URL Configuration
- **Site URL** harus `https://profile.20fit.id`
- **Redirect URLs** harus include dev URL Replit lu dengan `/**`

### Error: Email verification gak nyampe
Penyebab: Mailtrap domain belum verified, atau secret `API_Tokens_Mailtrap` salah.

Fix:
- Mailtrap dashboard → Sending Domains → status `20fit.id` harus `Verified` (hijau)
- Replit Secrets → `API_Tokens_Mailtrap` harus exact casing (cek di kode backend baca `process.env.API_Tokens_Mailtrap`)
- Cek log API server di Replit waktu kirim email — pasti ada error spesifik

### Error: `SUPABASE_SERVICE_ROLE_KEY is not defined` di backend log
Penyebab: secret belum di-set atau typo.

Fix:
- Replit Secrets → cek `SUPABASE_SERVICE_ROLE_KEY` ada dan punya nilai
- Restart API server workflow

### Error: User berhasil daftar tapi data gak masuk `my20fit_profile`
Penyebab: SQL migration belum dijalanin atau trigger gagal.

Fix:
- Supabase SQL Editor → run query: `select * from my20fit_profile limit 5;`
- Kalau error "relation does not exist" → migration belum jalan, balik ke Step 5
- Kalau tabel ada tapi user baru gak masuk → trigger `on_auth_user_created` gagal, jalanin ulang seluruh migration SQL

---

## KETIKA SIAP PRODUCTION DEPLOY KE profile.20fit.id

1. Setup DNS `profile.20fit.id` → pointing ke Replit deployment (atau hosting lu)
2. Update Replit Secrets:
   - `APP_URL=https://profile.20fit.id`
   - `VITE_APP_URL=https://profile.20fit.id`
3. **Google Cloud Console**: udah include `https://profile.20fit.id` di Authorized JavaScript origins dari Step 1.3. Cek lagi kalau ragu.
4. **Supabase**: udah include `https://profile.20fit.id/**` di Redirect URLs dari Step 2.2. Cek lagi.
5. **OAuth consent screen**: kalau masih "Testing", klik **PUBLISH APP** untuk bisa diakses public. Google bakal review (~1-3 hari). Selama review, app tetep jalan untuk test users.
6. Redeploy Replit, test ulang dari production URL.

---

## SUMMARY — yang harus lu lakuin sekarang

Urutan eksekusi:

1. ☐ Buka Google Cloud Console → setup OAuth consent screen + bikin OAuth Client ID (Step 1)
2. ☐ Copy Client ID + Secret → paste ke Supabase Google provider (Step 2.1)
3. ☐ Set Site URL + Redirect URLs di Supabase (Step 2.2)
4. ☐ Pastikan Supabase "Confirm email" OFF (Step 2.3)
5. ☐ Copy Service Role Key dari Supabase (Step 2.4)
6. ☐ Verify Mailtrap domain `20fit.id` (Step 3)
7. ☐ Tambah 7 secret baru di Replit (Step 4)
8. ☐ Run SQL migration di Supabase SQL Editor (Step 5)
9. ☐ Restart API server di Replit (Step 6.1)
10. ☐ Test 3 flow: Google sign in / email register / magic link (Step 6.2-6.4)

Setelah semua centang, app lu udah fully functional di dev URL Replit, siap dipindah ke `profile.20fit.id`.
