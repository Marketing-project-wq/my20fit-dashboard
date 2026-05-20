-- ─────────────────────────────────────────────────────────────
-- my20fit_profile — extends auth.users with app-specific data
-- ─────────────────────────────────────────────────────────────
create table if not exists public.my20fit_profile (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  phone text,                          -- E.164 format, e.g. +6281234567890
  email_verified_at timestamptz,       -- managed by our backend, not Supabase
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

-- Token tables: only accessed via service role from backend
alter table public.email_verification_tokens enable row level security;
alter table public.magic_link_tokens enable row level security;
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
