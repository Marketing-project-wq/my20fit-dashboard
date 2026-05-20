-- ─────────────────────────────────────────────────────────────
-- Fix: wrap handle_new_auth_user in EXCEPTION handler
--
-- Without this, ANY failure inside the trigger (constraint
-- violation, transient error, etc.) rolls back the entire
-- auth.users INSERT, causing Supabase to return
-- "Database error creating new user" to the caller.
--
-- With EXCEPTION WHEN OTHERS THEN we log the error but still
-- return NEW so the auth.users row is always committed.
-- ─────────────────────────────────────────────────────────────

create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.my20fit_profile (auth_user_id, email, full_name, phone)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', '')
  )
  on conflict (auth_user_id) do nothing;
  return new;
exception when others then
  -- Never block auth.users insert — profile row will be created
  -- explicitly by the API route as a belt-and-suspenders fallback.
  raise warning 'handle_new_auth_user failed for %: %', new.id, sqlerrm;
  return new;
end;
$$;
