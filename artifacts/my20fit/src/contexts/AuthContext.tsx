import { createContext, useContext } from "react";
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

const mockUser = {
  id: "mock-user-id",
  email: "zidni@20fit.id",
} as unknown as User;

const mockProfile: My20fitProfile = {
  id: "mock-profile-id",
  auth_user_id: "mock-user-id",
  email: "zidni@20fit.id",
  full_name: "ZIDNI",
  is_plus_member: true,
  onboarding_completed: true,
};

const mockPhotoProfile: PhotoUserMirror = {
  id: "mock-photo-id",
  name: "ZIDNI",
  email: "zidni@20fit.id",
};

const AuthContext = createContext<AuthContextValue>({
  user: mockUser,
  profile: mockProfile,
  photoProfile: mockPhotoProfile,
  isExistingPhotoUser: false,
  loading: false,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <AuthContext.Provider value={{
      user: mockUser,
      profile: mockProfile,
      photoProfile: mockPhotoProfile,
      isExistingPhotoUser: false,
      loading: false,
      signOut: async () => {},
      refreshProfile: async () => {},
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
