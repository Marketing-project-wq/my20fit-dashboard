import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

// ── Types ─────────────────────────────────────────────────────────────────

export interface My20fitProfile {
  id: string;
  auth_user_id: string;
  email?: string;
  full_name?: string;
  phone?: string;
  is_plus_member?: boolean;
  email_verified_at?: string | null;
  onboarding_completed?: boolean;
  onboarding_skipped_at?: string | null;
  age?: number | null;
  gender?: string | null;
  gender_selected_at?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  activity_level?: string | null;
  gym_experience?: string | null;
  daily_schedule?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface PhotoUserMirror {
  id: string;
  auth_user_id?: string | null;
  name?: string;
  email?: string;
  google_id?: string | null;
  phone?: string | null;
  auth_type?: string;
}

interface AuthContextValue {
  user: User | null;
  profile: My20fitProfile | null;
  photoProfile: PhotoUserMirror | null;
  isExistingPhotoUser: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// ── Context ───────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  photoProfile: null,
  isExistingPhotoUser: false,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

// ── Provider ──────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<My20fitProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (u: User) => {
    try {
      const { data } = await supabase
        .from("my20fit_profile")
        .select("*")
        .eq("auth_user_id", u.id)
        .maybeSingle();

      if (data) {
        // Auto-mark Google users as verified on first login
        if (!data.email_verified_at) {
          const provider = u.app_metadata?.provider;
          if (provider === "google") {
            await supabase
              .from("my20fit_profile")
              .update({ email_verified_at: new Date().toISOString() })
              .eq("auth_user_id", u.id);
            data.email_verified_at = new Date().toISOString();
          }
        }
        setProfile(data as My20fitProfile);
      } else {
        // Profile row doesn't exist yet — use fallback from user metadata
        setProfile({
          id: "",
          auth_user_id: u.id,
          email: u.email,
          full_name: u.user_metadata?.full_name ?? u.email?.split("@")[0] ?? "",
          is_plus_member: false,
          onboarding_completed: false,
        });
      }
    } catch {
      // Graceful fallback — don't crash the app if profile fetch fails
      setProfile({
        id: "",
        auth_user_id: u.id,
        email: u.email,
        full_name: u.user_metadata?.full_name ?? "",
        is_plus_member: false,
        onboarding_completed: false,
      });
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user);
  }, [user, fetchProfile]);

  useEffect(() => {
    let mounted = true;

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        fetchProfile(u).finally(() => {
          if (mounted) setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    // Real-time auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        await fetchProfile(u);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        photoProfile: null,
        isExistingPhotoUser: false,
        loading,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
