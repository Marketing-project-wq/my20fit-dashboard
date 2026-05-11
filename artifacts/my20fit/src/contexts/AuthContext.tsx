import { createContext, useContext, useEffect, useState } from "react";
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
  email_verified?: boolean;
  last_login?: string;
}

interface AuthContextValue {
  user: User | null;
  profile: My20fitProfile | null;
  photoProfile: PhotoUserMirror | null;
  isExistingPhotoUser: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  loadProfiles: (u: User) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  photoProfile: null,
  isExistingPhotoUser: false,
  loading: true,
  signOut: async () => {},
  loadProfiles: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<My20fitProfile | null>(null);
  const [photoProfile, setPhotoProfile] = useState<PhotoUserMirror | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) loadProfiles(session.user);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) await loadProfiles(session.user);
        else {
          setProfile(null);
          setPhotoProfile(null);
          setLoading(false);
        }
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  async function loadProfiles(authUser: User) {
    setLoading(true);
    try {
      const googleId =
        authUser.user_metadata?.sub ||
        authUser.user_metadata?.provider_id ||
        null;

      // 1. Find mirror row by email (primary) or google_id (secondary)
      let mirrorData: PhotoUserMirror | null = null;

      if (authUser.email) {
        const { data } = await supabase
          .from("photo_user_mirror")
          .select("*")
          .eq("email", authUser.email)
          .maybeSingle();
        mirrorData = data;
      }

      if (!mirrorData && googleId) {
        const { data } = await supabase
          .from("photo_user_mirror")
          .select("*")
          .eq("google_id", googleId)
          .maybeSingle();
        mirrorData = data;
      }

      if (mirrorData) {
        if (!mirrorData.auth_user_id) {
          await supabase
            .from("photo_user_mirror")
            .update({
              auth_user_id: authUser.id,
              last_login: new Date().toISOString(),
              email_verified: true,
            })
            .eq("id", mirrorData.id);
        } else {
          await supabase
            .from("photo_user_mirror")
            .update({ last_login: new Date().toISOString() })
            .eq("id", mirrorData.id);
        }
        setPhotoProfile({ ...mirrorData, auth_user_id: authUser.id });
      } else {
        // New user — insert into photo_user_mirror
        const newRow: PhotoUserMirror & { id: string } = {
          id: crypto.randomUUID(),
          email: authUser.email ?? undefined,
          name:
            authUser.user_metadata?.full_name ||
            authUser.user_metadata?.name ||
            authUser.email?.split("@")[0] ||
            "Member",
          google_id: googleId,
          auth_user_id: authUser.id,
          email_verified: true,
          auth_type: "google",
          last_login: new Date().toISOString(),
        };
        const { data: inserted } = await supabase
          .from("photo_user_mirror")
          .insert(newRow)
          .select()
          .single();
        mirrorData = inserted;
        setPhotoProfile(inserted);
      }

      // 2. Load or create my20fit_profile
      let { data: myProfile } = await supabase
        .from("my20fit_profile")
        .select("*")
        .eq("auth_user_id", authUser.id)
        .maybeSingle();

      if (!myProfile) {
        const displayName =
          mirrorData?.name ||
          authUser.user_metadata?.full_name ||
          authUser.user_metadata?.name ||
          authUser.email?.split("@")[0] ||
          "Member";

        const { data: created } = await supabase
          .from("my20fit_profile")
          .insert({
            auth_user_id: authUser.id,
            email: authUser.email,
            full_name: displayName,
            phone: mirrorData?.phone || null,
          })
          .select()
          .single();
        myProfile = created;
      }

      setProfile(myProfile);
    } catch {
      // silently handle — user can still access app
    } finally {
      setLoading(false);
    }
  }

  async function refreshProfile() {
    if (!user) return;
    const { data } = await supabase
      .from("my20fit_profile")
      .select("*")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    if (data) setProfile(data);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setPhotoProfile(null);
  }

  const isExistingPhotoUser = !!photoProfile?.google_id;

  return (
    <AuthContext.Provider
      value={{ user, profile, photoProfile, isExistingPhotoUser, loading, signOut, loadProfiles, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
