import { createClient } from "@supabase/supabase-js";
import { logger } from "./logger";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  logger.warn(
    "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set — auth routes will return errors until these are configured"
  );
}

export const supabaseAdmin = createClient(
  url ?? "https://placeholder.supabase.co",
  key ?? "placeholder-service-role-key",
  { auth: { autoRefreshToken: false, persistSession: false } }
);
