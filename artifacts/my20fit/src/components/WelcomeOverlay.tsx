import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Circle, ArrowRight, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface WelcomeOverlayProps {
  onDismiss: () => void;
}

const checklist = [
  { id: "account", label: "Akun berhasil dibuat", done: true },
  { id: "mcu", label: "Upload MCU untuk program personal", done: false },
  { id: "checkin", label: "Set up Quick Check-in (wellness, tidur, air)", done: false },
  { id: "moments", label: "Scan wajah untuk My Moments", done: false },
];

export default function WelcomeOverlay({ onDismiss }: WelcomeOverlayProps) {
  const { user, profile, photoProfile, isExistingPhotoUser, refreshProfile } = useAuth();
  const [dismissing, setDismissing] = useState(false);

  const firstName = (
    profile?.full_name ||
    photoProfile?.name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Member"
  ).split(" ")[0];

  const avatarUrl: string | null = user?.user_metadata?.avatar_url ?? null;

  async function handleStart() {
    setDismissing(true);
    try {
      if (user) {
        await supabase
          .from("my20fit_profile")
          .update({ onboarding_completed: true })
          .eq("auth_user_id", user.id);
        await refreshProfile();
      }
    } catch {
      // best-effort
    }
    // Also mark in localStorage so overlay never re-shows if column missing
    if (user) localStorage.setItem(`my20fit_onboarded_${user.id}`, "1");
    onDismiss();
  }

  return (
    <AnimatePresence>
      {!dismissing && (
        <motion.div
          key="welcome-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.82)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "24px",
          }}
        >
          <motion.div
            initial={{ scale: 0.92, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
            style={{
              background: "#fff", borderRadius: 20, maxWidth: 400, width: "100%",
              padding: "32px 28px", position: "relative", boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
            }}
          >
            {/* Close */}
            <button
              onClick={handleStart}
              style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", cursor: "pointer", color: "#6E665C", padding: 4 }}
            >
              <X size={18} />
            </button>

            {/* Avatar */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 20 }}>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={firstName}
                  style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", border: "3px solid #C41101", marginBottom: 14 }}
                />
              ) : (
                <div style={{
                  width: 72, height: 72, borderRadius: "50%", background: "#C41101",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "Inter, sans-serif", fontSize: 30, color: "#fff",
                  marginBottom: 14,
                }}>
                  {firstName.slice(0, 2).toUpperCase()}
                </div>
              )}

              <h2 style={{ fontFamily: "Inter, sans-serif", fontSize: 28, letterSpacing: "2px", color: "#0A0908", margin: 0 }}>
                Halo, {firstName}! 👋
              </h2>

              {isExistingPhotoUser ? (
                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <span style={{
                    background: "#DCFCE7", color: "#16A34A", border: "1px solid #86EFAC",
                    borderRadius: 20, padding: "4px 14px",
                    fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, letterSpacing: "1.5px",
                  }}>
                    ✓ AKUN 20FIT TERHUBUNG
                  </span>
                  <p style={{ textAlign: "center", fontSize: 13, color: "#6E665C", margin: 0, lineHeight: 1.5 }}>
                    Akun 20FIT Photo kamu berhasil terhubung ke my20fit.
                  </p>
                </div>
              ) : (
                <p style={{ textAlign: "center", fontSize: 13, color: "#6E665C", margin: "8px 0 0", lineHeight: 1.5 }}>
                  Selamat datang di my20fit!
                </p>
              )}
            </div>

            {/* Checklist */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
              {checklist.map(item => (
                <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {item.done ? (
                    <CheckCircle size={18} style={{ color: "#16A34A", flexShrink: 0 }} />
                  ) : (
                    <Circle size={18} style={{ color: "#D1C9BF", flexShrink: 0 }} />
                  )}
                  <span style={{
                    fontFamily: "Inter, sans-serif", fontSize: 14,
                    color: item.done ? "#0A0908" : "#6E665C",
                    flex: 1,
                  }}>
                    {item.label}
                  </span>
                  {!item.done && (
                    <ArrowRight size={14} style={{ color: "#C41101", flexShrink: 0 }} />
                  )}
                </div>
              ))}
            </div>

            {/* CTA */}
            <button
              onClick={handleStart}
              style={{
                width: "100%", padding: "14px", background: "#C41101", color: "#fff",
                border: "none", borderRadius: 10, cursor: "pointer",
                fontFamily: "Inter, sans-serif", fontSize: 15, letterSpacing: "2.5px",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 20px rgba(196,17,1,0.35)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLElement).style.boxShadow = "none";
              }}
            >
              MULAI DASHBOARD →
            </button>

            <p style={{ textAlign: "center", fontSize: 11, color: "#B0A89E", marginTop: 12, marginBottom: 0 }}>
              Kamu bisa kembali ke panduan ini di halaman Profile
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
