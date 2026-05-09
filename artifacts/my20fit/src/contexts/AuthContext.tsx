import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

interface My20fitProfile {
  id: string;
  auth_user_id: string;
  full_name?: string;
  phone?: string;
  is_plus_member?: boolean;
}

interface PhotoUserMirror {
  id: string;
  auth_user_id: string;
  name?: string;
  email?: string;
  auth_type?: string;
}

interface AuthContextValue {
  user: User | null;
  profile: My20fitProfile | null;
  photoProfile: PhotoUserMirror | null;
  loading: boolean;
  signOut: () => Promise<void>;
  loadProfiles: (u: User) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  photoProfile: null,
  loading: true,
  signOut: async () => {},
  loadProfiles: async () => {},
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
    try {
      const { data: myProfile } = await supabase
        .from("my20fit_profile")
        .select("*")
        .eq("auth_user_id", authUser.id)
        .single();
      setProfile(myProfile);

      const { data: photoData } = await supabase
        .from("photo_user_mirror")
        .select("*")
        .eq("auth_user_id", authUser.id)
        .single();
      setPhotoProfile(photoData);
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setPhotoProfile(null);
  }

  return (
    <AuthContext.Provider value={{ user, profile, photoProfile, loading, signOut, loadProfiles }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
