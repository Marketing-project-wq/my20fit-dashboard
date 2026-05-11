import { createContext, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

interface My20fitProfile {
  id: string;
  auth_user_id: string;
  email?: string;
  full_name?: string;
  phone?: string;
  is_plus_member?: boolean;
  onboarding_completed?: boolean;
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

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  photoProfile: null,
  isExistingPhotoUser: false,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<My20fitProfile | null>(null);
  const [photoProfile, setPhotoProfile] = useState<PhotoUserMirror | null>(null);
  const [loading, setLoading] = useState(true);
  const loadingRef = useRef(false);

  useEffect(() => {
    // onAuthStateChange fires INITIAL_SESSION immediately — no need for getSession()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const authUser = session?.user ?? null;
        setUser(authUser);

        if (authUser) {
          // Guard against concurrent calls (race condition between INITIAL_SESSION + SIGNED_IN)
          if (loadingRef.current) return;
          loadingRef.current = true;
          setLoading(true);
          try {
            await loadProfiles(authUser);
          } finally {
            loadingRef.current = false;
            setLoading(false);
          }
        } else {
          setProfile(null);
          setPhotoProfile(null);
          setLoading(false);
          loadingRef.current = false;
        }
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  async function loadProfiles(authUser: User) {
    // 1. Try to find a matching row in photo_user_mirror (read-only, best-effort)
    let mirrorData: PhotoUserMirror | null = null;
    if (authUser.email) {
      try {
        const { data } = await supabase
          .from("photo_user_mirror")
          .select("*")
          .eq("email", authUser.email)
          .maybeSingle();
        mirrorData = data;
        if (mirrorData) setPhotoProfile(mirrorData);
      } catch {
        // photo_user_mirror is optional — don't block auth
      }
    }

    // 2. Load my20fit_profile
    try {
      const { data: existing } = await supabase
        .from("my20fit_profile")
        .select("*")
        .eq("auth_user_id", authUser.id)
        .maybeSingle();

      if (existing) {
        setProfile(existing);
        return;
      }

      // Profile doesn't exist yet — create it
      const displayName =
        authUser.user_metadata?.full_name ||
        authUser.user_metadata?.name ||
        mirrorData?.name ||
        authUser.email?.split("@")[0] ||
        "Member";

      const { data: created, error: insertErr } = await supabase
        .from("my20fit_profile")
        .insert({
          auth_user_id: authUser.id,
          email: authUser.email,
          full_name: displayName,
          phone: mirrorData?.phone ?? null,
        })
        .select()
        .single();

      if (!insertErr && created) {
        setProfile(created);
      }
    } catch {
      // my20fit_profile is optional for app access — dashboard still works
    }
  }

  async function refreshProfile() {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("my20fit_profile")
        .select("*")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      if (data) setProfile(data);
    } catch {
      // best-effort
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setPhotoProfile(null);
    loadingRef.current = false;
  }

  const isExistingPhotoUser = !!photoProfile?.google_id;

  return (
    <AuthContext.Provider value={{ user, profile, photoProfile, isExistingPhotoUser, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
