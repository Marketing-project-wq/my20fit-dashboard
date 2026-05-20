-- ─────────────────────────────────────────────────────────────
-- Fix: Drop the on_auth_user_created trigger and its function
--
-- The trigger was causing every auth.users INSERT to fail with
-- "Database error creating new user" because the trigger body
-- threw an unhandled exception that rolled back the transaction.
-- Even after adding EXCEPTION handling in migration 02, the
-- trigger continues to fail, so we remove it entirely.
--
-- Profile row creation is now handled explicitly by the API
-- route (/auth/register) and AuthCallback.tsx (Google OAuth),
-- both of which use the service role client to upsert into
-- my20fit_profile immediately after session creation.
--
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ─────────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_auth_user() CASCADE;
