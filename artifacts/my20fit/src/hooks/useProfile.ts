import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export function useProfile() {
  const { user, profile, refreshProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const updateProfile = useCallback(
    async (updates: Record<string, unknown>) => {
      if (!user) throw new Error("Not authenticated");
      setSaving(true);
      setSaveError(null);
      try {
        const { data, error } = await supabase
          .from("my20fit_profile")
          .update(updates)
          .eq("auth_user_id", user.id)
          .select("id");
        if (error) throw error;
        if (!data || data.length === 0) {
          throw new Error(
            "Update affected 0 rows — likely session/RLS issue. Try signing out and back in."
          );
        }
        await refreshProfile();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to save";
        // eslint-disable-next-line no-console
        console.error("[useProfile.updateProfile] failed:", err);
        setSaveError(msg);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [user, refreshProfile]
  );

  return { profile, saving, saveError, updateProfile };
}
