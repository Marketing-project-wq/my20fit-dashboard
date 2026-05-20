-- ─────────────────────────────────────────────────────────────
-- Fix: Drop legacy trigger from old project that caused all
-- new user registrations to fail with "Database error creating
-- new user"
--
-- Root cause: a second trigger "trg_my20fit_on_auth_user_created"
-- existed on auth.users from a previous project version. It called
-- handle_new_user_my20fit() which referenced a column "name" that
-- no longer exists, throwing an unhandled exception that rolled
-- back every auth.users INSERT.
--
-- Our trigger "on_auth_user_created" → handle_new_auth_user()
-- is KEPT — it auto-creates my20fit_profile rows and has a
-- proper EXCEPTION handler added in migration 02.
--
-- This migration was applied manually via Supabase SQL Editor
-- on 2026-05-20.
-- ─────────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS trg_my20fit_on_auth_user_created ON auth.users;
