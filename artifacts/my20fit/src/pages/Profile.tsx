import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/contexts/ToastContext";
import {
  User, Mail, Phone, Ruler,
  ChevronRight, Bell, Moon, Sun,
  Globe, Shield, HelpCircle, Star,
  LogOut, Pencil, Trash2, X, Camera,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import Header from "@/components/Header";

// ── Types ──────────────────────────────────────────────────────────────────

interface McuData {
  grade?: string;
  metrics?: Array<{ label?: string; value?: string | number }>;
  reviewed_at?: string;
}

interface ProgressEntry {
  date: string;
  weight?: number;
  bmi?: number;
  restingHr?: number;
}

interface WorkoutEntry {
  date: string;
  duration?: number;
}

interface ProfileData {
  mcu: McuData | null;
  latestEntry: ProgressEntry | null;
  gender: string | null;
  height: string | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

function formatJoinDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", { month: "short", year: "numeric" });
}

function getBMIStatus(bmi?: number | null): string | null {
  if (!bmi) return null;
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

function getHRStatus(hr?: number | null): string | null {
  if (!hr) return null;
  if (hr < 60) return "Athlete";
  if (hr < 70) return "Excellent";
  if (hr < 80) return "Baik";
  if (hr < 90) return "Average";
  return "Tinggi";
}

function formatRelativeDate(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (diff === 0) return "hari ini";
  if (diff === 1) return "kemarin";
  return `${diff} hari lalu`;
}

function bmiLabel(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: "Underweight", color: "#2563EB" };
  if (bmi < 25) return { label: "Normal", color: "#16A34A" };
  if (bmi < 30) return { label: "Overweight", color: "#D97706" };
  return { label: "Obese", color: "#DC2626" };
}

function computeStreaks(): { current: number; best: number } {
  const today = new Date();
  let current = 0;
  let best = 0;
  let streak = 0;
  let hitGap = false;

  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    const hasActivity =
      !!localStorage.getItem(`my20fit_wellness_${key}`) ||
      !!localStorage.getItem(`my20fit_sleep_${key}`) ||
      !!localStorage.getItem(`my20fit_water_${key}`);

    if (hasActivity) {
      streak++;
      if (streak > best) best = streak;
      if (!hitGap) current = streak;
    } else {
      if (i > 0) {
        hitGap = true;
        streak = 0;
      }
    }
  }
  return { current, best };
}

function getProfileData(): ProfileData {
  const mcuRaw = localStorage.getItem("my20fit_mcu_result");
  const mcu: McuData | null = mcuRaw ? JSON.parse(mcuRaw) : null;

  const entriesRaw = localStorage.getItem("my20fit_progress_entries");
  const entries: ProgressEntry[] = entriesRaw ? JSON.parse(entriesRaw) : [];
  const latestEntry =
    entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0] || null;

  const gender = localStorage.getItem("my20fit_gender");
  const height = localStorage.getItem("my20fit_height");

  return { mcu, latestEntry, gender, height };
}

// ── Mock data ──────────────────────────────────────────────────────────────

const mockUser = {
  name: "ZIDNI",
  email: "zidni@20fit.id",
  phone: "+62 812-3456-7890",
  joinDate: "2026-01-15",
  isPlusMember: true,
};

// ── Sub-components ─────────────────────────────────────────────────────────

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!value)}
      style={{
        width: 44, height: 24, borderRadius: 99,
        background: value ? "#C41101" : "var(--border-subtle,#E5E1D8)",
        position: "relative", cursor: "pointer",
        transition: "background .2s", flexShrink: 0,
      }}
    >
      <div style={{
        position: "absolute",
        top: 3, left: value ? 23 : 3,
        width: 18, height: 18, borderRadius: "50%",
        background: "#fff", transition: "left .2s",
        boxShadow: "0 1px 3px rgba(0,0,0,.2)",
      }} />
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="section-header" style={{ marginBottom: 8 }}>
      <h2>{title}</h2>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function Profile({ theme, toggleTheme }: { theme: string; toggleTheme: () => void }) {
  const [, setLocation] = useLocation();
  const [data, setData] = useState<ProfileData>(getProfileData);
  const { showToast } = useToast();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("my20fit_avatar");
    if (saved) setAvatarSrc(saved);
  }, []);

  const [editName, setEditName] = useState(mockUser.name);
  const [editPhone, setEditPhone] = useState(mockUser.phone);
  const [editGender, setEditGender] = useState(data.gender || "");
  const [editHeight, setEditHeight] = useState(data.height || "");
  const [editWeight, setEditWeight] = useState(
    data.latestEntry?.weight ? String(data.latestEntry.weight) : ""
  );

  const [settingValues, setSettingValues] = useState<Record<string, boolean>>(() => ({
    notifications: JSON.parse(localStorage.getItem("my20fit_setting_notifications") || "true"),
    theme: theme === "dark",
  }));

  const { mcu, latestEntry, gender, height } = data;

  // ── Derived values ──────────────────────────────────────────────────────
  const displayName = editName || mockUser.name;
  const userEmail = mockUser.email;
  const joinDate = formatJoinDate(mockUser.joinDate);
  const isPlusMember = mockUser.isPlusMember;

  const mcuGrade = mcu?.grade || "—";
  const latestWeight = latestEntry?.weight
    ?? (mcu?.metrics?.find(m => m.label?.toLowerCase().includes("berat"))?.value as number | undefined)
    ?? null;
  const latestBMI = latestEntry?.bmi
    ?? (mcu?.metrics?.find(m => m.label?.toLowerCase().includes("bmi"))?.value as number | undefined)
    ?? null;
  const latestHR = latestEntry?.restingHr ?? null;

  const workoutsRaw = localStorage.getItem("my20fit_workouts");
  const workouts: WorkoutEntry[] = workoutsRaw ? JSON.parse(workoutsRaw) : [];
  const totalWorkouts = workouts.length;
  const totalMinutes = workouts.reduce((s, w) => s + (w.duration || 0), 0);
  const activeWeeks = new Set(workouts.map(w => {
    const d = new Date(w.date);
    return `${d.getFullYear()}-W${Math.ceil(d.getDate() / 7)}`;
  })).size;
  const consistencyPct = activeWeeks > 0 ? Math.round((activeWeeks / 12) * 100) : 0;

  const { current: currentStreak, best: bestStreak } = computeStreaks();

  const computedBmi = (() => {
    const w = editWeight ? parseFloat(editWeight) : latestEntry?.weight;
    const h = editHeight ? parseFloat(editHeight) : (height ? parseFloat(height) : null);
    if (w && h && h > 0) return w / ((h / 100) ** 2);
    return null;
  })();

  const gradeColor = (g?: string) =>
    g === "A" ? "#16A34A" : g === "B" ? "#2563EB" : g === "C" ? "#D97706" : "#DC2626";

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleSettingChange = useCallback((key: string, value: boolean) => {
    setSettingValues(prev => ({ ...prev, [key]: value }));
    if (key === "theme") toggleTheme();
    localStorage.setItem(`my20fit_setting_${key}`, JSON.stringify(value));
  }, [toggleTheme]);

  function handleSaveEdit() {
    if (editGender) localStorage.setItem("my20fit_gender", editGender);
    if (editHeight) localStorage.setItem("my20fit_height", editHeight);
    setData(getProfileData());
    setShowEditModal(false);
    showToast("Profil berhasil diperbarui ✓");
  }

  function exportMyData() {
    const exportData: Record<string, unknown> = {};
    Object.keys(localStorage).filter(k => k.startsWith("my20fit_")).forEach(k => {
      try { exportData[k] = JSON.parse(localStorage.getItem(k)!); }
      catch { exportData[k] = localStorage.getItem(k); }
    });
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `my20fit-data-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      showToast("Format tidak didukung. Gunakan JPG, PNG, atau WEBP.", "error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("Ukuran foto maksimal 5MB.", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setAvatarSrc(base64);
      localStorage.setItem("my20fit_avatar", base64);
      window.dispatchEvent(new Event("my20fit_avatar_updated"));
      showToast("Foto profil berhasil diperbarui ✓");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function handleAvatarClick() {
    avatarInputRef.current?.click();
  }

  function handleRemoveAvatar() {
    setAvatarSrc(null);
    localStorage.removeItem("my20fit_avatar");
    window.dispatchEvent(new Event("my20fit_avatar_updated"));
    showToast("Foto profil dihapus");
  }

  const settings = [
    { icon: <Bell size={16} />, label: "Notifikasi", sublabel: "Reminder checklist, event, MCU", type: "toggle" as const, key: "notifications" },
    { icon: theme === "dark" ? <Sun size={16} /> : <Moon size={16} />, label: "Dark Mode", sublabel: theme === "dark" ? "Aktif" : "Nonaktif", type: "toggle" as const, key: "theme" },
    { icon: <Globe size={16} />, label: "Bahasa", sublabel: "Indonesia", type: "chevron" as const, action: () => {} },
    { icon: <Shield size={16} />, label: "Privasi & Keamanan", sublabel: "Data, password, akun", type: "chevron" as const, action: () => setShowPrivacyModal(true) },
    { icon: <HelpCircle size={16} />, label: "Bantuan & FAQ", sublabel: "Panduan penggunaan app", type: "chevron" as const, action: () => {} },
    { icon: <Star size={16} />, label: "Rate App", sublabel: "Beri rating di App Store", type: "chevron" as const, action: () => {} },
  ];

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "var(--bg)", border: "1.5px solid var(--border-subtle,#E5E1D8)",
    borderRadius: 10, padding: "11px 14px",
    fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 400, fontSize: 15,
    color: "var(--text)", outline: "none", boxSizing: "border-box",
  };

  const fieldLabel: React.CSSProperties = {
    fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900,
    fontSize: 11, letterSpacing: "1.5px", color: "var(--muted)",
    display: "block", marginBottom: 6,
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg)" }}>
      <Sidebar theme={theme} toggleTheme={toggleTheme} />

      <main className="flex-1 w-full lg:pl-[220px]">
        <Header theme={theme} toggleTheme={toggleTheme} />

        <div style={{ maxWidth: 680, margin: "0 auto", padding: "20px 16px 100px" }}>

          {/* ── SECTION 1: HERO CARD ── */}
          <div style={{
            background: "linear-gradient(145deg, #0A0908 0%, #1C1710 55%, #221A08 100%)",
            borderRadius: 22, overflow: "hidden", position: "relative",
            padding: "24px 20px 20px", marginBottom: 16,
          }}>
            <div style={{ position: "absolute", top: -50, right: -30, width: 180, height: 180, background: "radial-gradient(circle, rgba(196,17,1,.25) 0%, transparent 65%)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: -40, left: -20, width: 150, height: 150, background: "radial-gradient(circle, rgba(212,168,0,.1) 0%, transparent 65%)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(255,255,255,.008) 3px,rgba(255,255,255,.008) 4px)", pointerEvents: "none" }} />

            <div style={{ position: "relative", zIndex: 1 }}>
              {/* Top row: avatar + badge */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ position: "relative" }}>
                  <div
                    onClick={handleAvatarClick}
                    style={{
                      width: 72, height: 72, borderRadius: "50%",
                      background: avatarSrc ? "transparent" : "linear-gradient(135deg, #C41101, #8B0000)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: "'Anton', sans-serif", fontSize: 26, color: "#fff",
                      border: "2px solid rgba(255,255,255,.12)", cursor: "pointer",
                      overflow: "hidden", position: "relative",
                    }}
                  >
                    {avatarSrc ? (
                      <img src={avatarSrc} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                    ) : (
                      getInitials(displayName)
                    )}
                    <div
                      style={{
                        position: "absolute", inset: 0,
                        background: "rgba(0,0,0,.4)", borderRadius: "50%",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        opacity: 0, transition: "opacity .2s",
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "0"; }}
                    >
                      <Camera size={20} color="#fff" />
                    </div>
                  </div>
                  <div
                    onClick={handleAvatarClick}
                    style={{
                      position: "absolute", bottom: 0, right: 0,
                      width: 24, height: 24, borderRadius: "50%",
                      background: "#1A1710", border: "1.5px solid rgba(255,255,255,.2)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", zIndex: 1,
                    }}
                  >
                    <Camera size={11} color="rgba(255,255,255,.7)" />
                  </div>
                </div>

                {isPlusMember ? (
                  <div style={{
                    background: "linear-gradient(135deg, rgba(212,168,0,.2), rgba(212,168,0,.1))",
                    border: "0.5px solid rgba(212,168,0,.35)",
                    borderRadius: 99, padding: "5px 12px",
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 900, fontSize: 8, letterSpacing: "1.5px", color: "#D4A800",
                  }}>⭐ PLUS MEMBER</div>
                ) : (
                  <div style={{
                    background: "rgba(255,255,255,.06)",
                    border: "0.5px solid rgba(255,255,255,.1)",
                    borderRadius: 99, padding: "5px 12px",
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 900, fontSize: 8, letterSpacing: "1.5px", color: "rgba(255,255,255,.35)",
                  }}>FREE MEMBER</div>
                )}
              </div>

              {/* Name */}
              <div style={{
                fontFamily: "'Anton', sans-serif",
                fontSize: 36, color: "#fff",
                lineHeight: .95, letterSpacing: -0.5, marginBottom: 3,
              }}>{displayName.toUpperCase()}</div>

              {/* Email + join date */}
              <div style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 400, fontStyle: "italic",
                fontSize: 12, color: "rgba(255,255,255,.4)", marginBottom: 16,
              }}>
                {userEmail} · Member sejak {joinDate}
              </div>

              {/* Stats row */}
              <div style={{
                display: "grid", gridTemplateColumns: "repeat(3,1fr)",
                borderTop: "0.5px solid rgba(255,255,255,.08)",
                paddingTop: 14, gap: 0,
              }}>
                {[
                  { value: String(totalWorkouts || 0), label: "SESI" },
                  { value: String(currentStreak || 0), label: "STREAK" },
                  { value: mcuGrade, label: "GRADE" },
                ].map((s, i) => (
                  <div key={i} style={{
                    textAlign: "center",
                    borderRight: i < 2 ? "0.5px solid rgba(255,255,255,.08)" : "none",
                    padding: "0 4px",
                  }}>
                    <div style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 18, fontWeight: 700, color: "#fff", lineHeight: 1,
                    }}>{s.value}</div>
                    <div style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 900, fontSize: 7,
                      letterSpacing: "2px", color: "rgba(255,255,255,.25)", marginTop: 3,
                    }}>{s.label}</div>
                  </div>
                ))}
              </div>

              <div style={{
                height: "0.5px",
                background: "linear-gradient(90deg, rgba(196,17,1,.5), rgba(212,168,0,.2), transparent)",
                marginTop: 14,
              }} />
            </div>
          </div>

          {/* ── SECTION 2: PERSONAL INFO ── */}
          <SectionHeader title="INFORMASI PERSONAL" />
          <div style={{ background: "var(--card)", borderRadius: 14, overflow: "hidden", boxShadow: "var(--shadow)", marginBottom: 16 }}>
            {[
              { icon: <User size={16} />, label: "NAMA LENGKAP", value: displayName, mono: false },
              { icon: <Mail size={16} />, label: "EMAIL", value: userEmail, mono: false },
              { icon: <Phone size={16} />, label: "NOMOR HP", value: editPhone || mockUser.phone, mono: true },
              {
                icon: <User size={16} />,
                label: "JENIS KELAMIN",
                value: gender === "male" ? "Laki-laki" : gender === "female" ? "Perempuan" : "Belum diisi",
                mono: false,
              },
              { icon: <Ruler size={16} />, label: "TINGGI BADAN", value: height || "—", unit: "cm", mono: true },
            ].map((row, i) => (
              <div
                key={i}
                onClick={() => setShowEditModal(true)}
                style={{
                  display: "flex", alignItems: "center",
                  padding: "13px 16px", gap: 12,
                  borderBottom: i < 4 ? "0.5px solid var(--border-subtle,#E5E1D8)" : "none",
                  cursor: "pointer",
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: "var(--bg)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--muted)", flexShrink: 0,
                }}>{row.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 900, fontSize: 10,
                    letterSpacing: "1.5px", color: "var(--muted)",
                  }}>{row.label}</div>
                  <div style={{
                    fontFamily: row.mono ? "'JetBrains Mono', monospace" : "'Barlow Condensed', sans-serif",
                    fontWeight: 400, fontSize: row.mono ? 13 : 14,
                    color: row.value === "Belum diisi" || row.value === "—" ? "var(--muted)" : "var(--text)",
                    marginTop: 1,
                  }}>
                    {row.value}
                    {"unit" in row && row.unit && row.value !== "—" && (
                      <span style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontWeight: 400, fontStyle: "italic",
                        fontSize: 11, color: "var(--muted)", marginLeft: 3,
                      }}>{row.unit}</span>
                    )}
                  </div>
                </div>
                <ChevronRight size={14} color="var(--muted)" />
              </div>
            ))}
          </div>

          {/* ── SECTION 3: HEALTH SNAPSHOT ── */}
          <SectionHeader title="KESEHATAN" />
          <div style={{ background: "var(--card)", borderRadius: 16, padding: 16, boxShadow: "var(--shadow)", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 900, fontSize: 9,
                letterSpacing: "2px", color: "var(--muted)",
              }}>SNAPSHOT TERKINI</div>
              <div style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 400, fontStyle: "italic",
                fontSize: 10, color: "var(--muted)",
              }}>
                {latestEntry ? `Update ${formatRelativeDate(latestEntry.date)}` : "Belum ada data"}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
              {[
                { label: "BERAT", value: latestWeight, unit: "kg", color: "#C41101", status: null as string | null },
                { label: "BMI", value: latestBMI, unit: "", color: "#3B82F6", status: getBMIStatus(latestBMI) },
                { label: "RESTING HR", value: latestHR, unit: "bpm", color: "#EF4444", status: getHRStatus(latestHR) },
              ].map((m, i) => (
                <div key={i} style={{
                  background: "var(--bg)",
                  borderRadius: 10, padding: "10px 8px",
                  textAlign: "center", position: "relative", overflow: "hidden",
                }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2.5, background: m.color }} />
                  <div style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 18, fontWeight: 700,
                    color: "var(--text)", lineHeight: 1, marginTop: 4,
                  }}>
                    {m.value ? String(typeof m.value === "number" ? (Number.isInteger(m.value) ? m.value : m.value.toFixed(1)) : m.value) : "—"}
                    {m.unit && m.value && (
                      <span style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontWeight: 400, fontStyle: "italic",
                        fontSize: 9, color: "var(--muted)", marginLeft: 2,
                      }}>{m.unit}</span>
                    )}
                  </div>
                  <div style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 900, fontSize: 7,
                    letterSpacing: "1.5px", color: "var(--muted)", marginTop: 3,
                  }}>{m.label}</div>
                  {m.status && (
                    <div style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 400, fontStyle: "italic",
                      fontSize: 8, marginTop: 2,
                      color: m.status === "Normal" || m.status === "Baik" || m.status === "Excellent" || m.status === "Athlete"
                        ? "#22C55E" : "#EAB308",
                    }}>{m.status}</div>
                  )}
                </div>
              ))}
            </div>

            {mcu && (
              <div style={{
                marginTop: 10, background: "var(--bg)",
                borderRadius: 10, padding: "10px 12px",
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <div style={{ fontSize: 18 }}>🩺</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 13, color: "var(--text)" }}>
                    HEALTH GRADE {mcu.grade}
                  </div>
                  <div style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 400, fontStyle: "italic",
                    fontSize: 10, color: "var(--muted)", marginTop: 1,
                  }}>Dianalisis dari MCU · {mcu.reviewed_at || "baru-baru ini"}</div>
                </div>
                <button
                  onClick={() => setLocation("/")}
                  style={{
                    background: "none", border: "none",
                    fontFamily: "'Anton', sans-serif",
                    fontSize: 11, color: "#C41101",
                    cursor: "pointer", letterSpacing: "0.5px",
                  }}
                >LIHAT →</button>
              </div>
            )}
          </div>

          {/* ── SECTION 4: MCU STATUS ── */}
          <SectionHeader title="STATUS MCU" />
          <div style={{ background: "var(--card)", borderRadius: 14, padding: "16px 20px", boxShadow: "var(--shadow)", marginBottom: 16 }}>
            {mcu ? (
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: "50%",
                  background: gradeColor(mcu.grade),
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <span style={{ fontFamily: "'Anton', sans-serif", fontSize: 22, color: "#fff" }}>{mcu.grade}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 16, color: "var(--text)", marginBottom: 2 }}>
                    Grade {mcu.grade} · Health Baseline
                  </div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 400, fontStyle: "italic", fontSize: 12, color: "var(--muted)" }}>
                    Dianalisis {mcu.reviewed_at || "baru-baru ini"}
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (confirm("Hapus data MCU dan upload yang baru?")) {
                      localStorage.removeItem("my20fit_mcu_result");
                      setData(getProfileData());
                    }
                  }}
                  style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer" }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 18, color: "var(--text)", marginBottom: 2 }}>
                    Belum ada MCU
                  </div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 400, fontStyle: "italic", fontSize: 12, color: "var(--muted)" }}>
                    Upload untuk program personal
                  </div>
                </div>
                <button
                  onClick={() => setLocation("/")}
                  style={{
                    background: "#C41101", color: "#fff", border: "none", borderRadius: 10,
                    padding: "8px 16px", cursor: "pointer",
                    fontFamily: "'Anton', sans-serif", fontSize: 14, letterSpacing: 1, flexShrink: 0,
                  }}
                >UPLOAD</button>
              </div>
            )}
          </div>

          {/* ── SECTION 5: ACTIVITY STATS ── */}
          <SectionHeader title="AKTIVITAS" />
          <div style={{ background: "var(--card)", borderRadius: 16, padding: 16, boxShadow: "var(--shadow)", marginBottom: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6, marginBottom: 8 }}>
              {[
                { value: totalWorkouts, label: "SESI" },
                { value: totalMinutes > 999 ? `${(totalMinutes / 1000).toFixed(1)}k` : totalMinutes, label: "MENIT" },
                { value: activeWeeks, label: "MINGGU" },
                { value: `${consistencyPct}%`, label: "KONSISTEN" },
              ].map((s, i) => (
                <div key={i} style={{ background: "var(--bg)", borderRadius: 10, padding: "10px 6px", textAlign: "center" }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 700, color: "var(--text)" }}>
                    {s.value || "0"}
                  </div>
                  <div style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 900, fontSize: 7,
                    letterSpacing: "1px", color: "var(--muted)", marginTop: 2,
                  }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={{
              background: "linear-gradient(135deg, rgba(196,17,1,.06), rgba(196,17,1,.03))",
              border: "0.5px solid rgba(196,17,1,.12)",
              borderRadius: 12, padding: "12px 14px",
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <div style={{ fontSize: 20 }}>🔥</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700, color: "#C41101", lineHeight: 1 }}>
                  {currentStreak}
                </div>
                <div style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 900, fontSize: 9,
                  letterSpacing: "1.5px", color: "rgba(196,17,1,.6)",
                }}>HARI STREAK</div>
                <div style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 400, fontStyle: "italic",
                  fontSize: 10, color: "var(--muted)", marginTop: 2,
                }}>Terbaik: {bestStreak} hari berturut-turut</div>
              </div>
            </div>
          </div>

          {/* ── SECTION 6: 20FIT PLUS ── */}
          <SectionHeader title="20FIT PLUS" />
          {isPlusMember ? (
            <div style={{ background: "linear-gradient(135deg, #1A1A0F, #0A0A05)", borderRadius: 14, padding: "20px", marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 10, letterSpacing: 2, color: "#D4A800", marginBottom: 4 }}>
                    ⭐ 20FIT PLUS AKTIF
                  </div>
                  <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 24, color: "#fff" }}>MEMBER AKTIF</div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 400, fontStyle: "italic", fontSize: 12, color: "rgba(255,255,255,.35)", marginTop: 4 }}>
                    Berlaku hingga 31 Des 2026
                  </div>
                </div>
                <button style={{
                  background: "linear-gradient(135deg, #D4A800, #FFD700)", color: "#0A0908",
                  border: "none", borderRadius: 10, padding: "10px 16px",
                  fontFamily: "'Anton', sans-serif", fontSize: 13, letterSpacing: 1, cursor: "pointer", flexShrink: 0,
                }}>PERPANJANG →</button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 16 }}>
                {["10% Arena", "10% Clinic", "10% PT", "10% Shop"].map(b => (
                  <span key={b} style={{
                    background: "rgba(212,168,0,.15)", border: "1px solid rgba(212,168,0,.3)", color: "#D4A800",
                    fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 9,
                    letterSpacing: 1, padding: "4px 10px", borderRadius: 99,
                  }}>{b}</span>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ background: "linear-gradient(135deg, #1A1A0F, #0A0A05)", borderRadius: 14, padding: "20px", marginBottom: 16 }}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 10, letterSpacing: 2, color: "rgba(255,255,255,.4)", marginBottom: 6 }}>
                ⭐ 20FIT PLUS
              </div>
              <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 22, color: "#fff", marginBottom: 4 }}>UPGRADE SEKARANG</div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 400, fontStyle: "italic", fontSize: 13, color: "rgba(255,255,255,.55)", marginBottom: 16 }}>
                Hemat 10% di semua layanan 20FIT
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 400, color: "#D4A800" }}>
                  Rp 49.000
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 400, fontSize: 13, color: "rgba(255,255,255,.4)" }}>/bulan</span>
                </div>
                <button style={{
                  background: "linear-gradient(135deg, #D4A800, #FFD700)", color: "#0A0908",
                  border: "none", borderRadius: 10, padding: "10px 20px",
                  fontFamily: "'Anton', sans-serif", fontSize: 14, letterSpacing: 1, cursor: "pointer",
                }}>UPGRADE →</button>
              </div>
            </div>
          )}

          {/* ── SECTION 7: SETTINGS ── */}
          <SectionHeader title="PENGATURAN" />
          <div style={{ background: "var(--card)", borderRadius: 14, padding: "0 16px", boxShadow: "var(--shadow)", marginBottom: 16 }}>
            {settings.map((s, i) => (
              <div
                key={s.key || s.label}
                onClick={s.type === "chevron" ? (s as { action?: () => void }).action : undefined}
                style={{
                  display: "flex", alignItems: "center", padding: "13px 0", gap: 12,
                  borderBottom: i < settings.length - 1 ? "0.5px solid var(--border-subtle,#E5E1D8)" : "none",
                  cursor: s.type === "chevron" ? "pointer" : "default",
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: "var(--bg)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--muted)", flexShrink: 0,
                }}>{s.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 400, fontSize: 15, color: "var(--text)" }}>{s.label}</div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 400, fontStyle: "italic", fontSize: 12, color: "var(--muted)" }}>{s.sublabel}</div>
                </div>
                {s.type === "toggle" ? (
                  <Toggle
                    value={settingValues[s.key!] ?? false}
                    onChange={(val) => handleSettingChange(s.key!, val)}
                  />
                ) : (
                  <ChevronRight size={14} color="var(--muted)" />
                )}
              </div>
            ))}
          </div>

          {/* ── SECTION 8: LOGOUT ── */}
          <button
            onClick={() => {
              if (confirm("Yakin ingin keluar?")) {
                localStorage.removeItem("my20fit-supabase-auth");
                setLocation("/login");
              }
            }}
            style={{
              width: "100%", padding: 14,
              background: "transparent",
              border: "1.5px solid rgba(239,68,68,.3)",
              borderRadius: 14, cursor: "pointer",
              display: "flex", alignItems: "center",
              justifyContent: "center", gap: 8,
              transition: "all .2s", marginBottom: 12,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "rgba(239,68,68,.06)";
              e.currentTarget.style.borderColor = "rgba(239,68,68,.5)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor = "rgba(239,68,68,.3)";
            }}
          >
            <LogOut size={16} color="#EF4444" />
            <span style={{ fontFamily: "'Anton', sans-serif", fontSize: 14, letterSpacing: "1.5px", color: "#EF4444" }}>
              KELUAR DARI AKUN
            </span>
          </button>

          {/* ── SECTION 9: APP INFO ── */}
          <div style={{ textAlign: "center", padding: "12px 0 8px" }}>
            <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 14, color: "var(--muted)" }}>my20FIT</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 400, fontSize: 10, color: "#C8BFB0", marginTop: 2 }}>
              v1.0.0 · © 2026 20FIT
            </div>
          </div>

        </div>
      </main>

      <BottomNav />

      {/* Hidden file input for avatar upload */}
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleAvatarChange}
        style={{ display: "none" }}
      />

      {/* ── EDIT PROFILE MODAL ── */}
      {showEditModal && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 200, display: "flex", alignItems: "flex-end" }}
          onClick={e => { if (e.target === e.currentTarget) setShowEditModal(false); }}
        >
          <div style={{
            width: "100%", maxWidth: 520, margin: "0 auto",
            background: "var(--card)", borderRadius: "20px 20px 0 0",
            padding: "24px 20px 36px", maxHeight: "85vh", overflowY: "auto",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <span style={{ fontFamily: "'Anton', sans-serif", fontSize: 20, color: "var(--text)", letterSpacing: 0.5 }}>EDIT PROFIL</span>
              <button onClick={() => setShowEditModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={fieldLabel}>NAMA LENGKAP</label>
                <input value={editName} onChange={e => setEditName(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={fieldLabel}>NOMOR HP</label>
                <input type="tel" value={editPhone} onChange={e => setEditPhone(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={fieldLabel}>JENIS KELAMIN</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {[{ val: "male", label: "Laki-laki" }, { val: "female", label: "Perempuan" }].map(opt => (
                    <button
                      key={opt.val}
                      onClick={() => setEditGender(opt.val)}
                      style={{
                        flex: 1, padding: "10px 0", borderRadius: 10, cursor: "pointer",
                        fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 14,
                        border: editGender === opt.val ? "2px solid #C41101" : "1.5px solid var(--border-subtle,#E5E1D8)",
                        background: editGender === opt.val ? "rgba(196,17,1,.08)" : "var(--bg)",
                        color: editGender === opt.val ? "#C41101" : "var(--muted)",
                        transition: "all .15s",
                      }}
                    >{opt.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={fieldLabel}>TINGGI BADAN</label>
                <div style={{ position: "relative" }}>
                  <input type="number" value={editHeight} onChange={e => setEditHeight(e.target.value)} placeholder="170" style={{ ...inputStyle, paddingRight: 44 }} />
                  <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 400, fontStyle: "italic", fontSize: 13, color: "var(--muted)" }}>cm</span>
                </div>
              </div>
              <div>
                <label style={fieldLabel}>BERAT BADAN</label>
                <div style={{ position: "relative" }}>
                  <input type="number" value={editWeight} onChange={e => setEditWeight(e.target.value)} placeholder="70" style={{ ...inputStyle, paddingRight: 44 }} />
                  <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 400, fontStyle: "italic", fontSize: 13, color: "var(--muted)" }}>kg</span>
                </div>
                {computedBmi && (
                  <div style={{ marginTop: 8, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 400, fontStyle: "italic", fontSize: 13, color: bmiLabel(computedBmi).color }}>
                    BMI: {computedBmi.toFixed(1)} ({bmiLabel(computedBmi).label})
                  </div>
                )}
              </div>
              {avatarSrc && (
                <button
                  onClick={handleRemoveAvatar}
                  style={{
                    background: "none", border: "none",
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 400, fontStyle: "italic",
                    fontSize: 12, color: "#EF4444",
                    cursor: "pointer", textDecoration: "underline",
                    padding: 0,
                  }}
                >Hapus foto profil</button>
              )}
              <button
                onClick={handleSaveEdit}
                style={{
                  width: "100%", padding: "14px", background: "#C41101", color: "#fff",
                  border: "none", borderRadius: 12, cursor: "pointer",
                  fontFamily: "'Anton', sans-serif", fontSize: 15, letterSpacing: 1, marginTop: 4,
                }}
              >SIMPAN PERUBAHAN</button>
            </div>
          </div>
        </div>
      )}

      {/* ── PRIVACY MODAL ── */}
      {showPrivacyModal && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 200, display: "flex", alignItems: "flex-end" }}
          onClick={e => { if (e.target === e.currentTarget) setShowPrivacyModal(false); }}
        >
          <div style={{
            width: "100%", maxWidth: 520, margin: "0 auto",
            background: "var(--card)", borderRadius: "20px 20px 0 0",
            padding: "24px 20px 36px", maxHeight: "85vh", overflowY: "auto",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <span style={{ fontFamily: "'Anton', sans-serif", fontSize: 20, color: "var(--text)", letterSpacing: 0.5 }}>PRIVASI & KEAMANAN</span>
              <button onClick={() => setShowPrivacyModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}>
                <X size={20} />
              </button>
            </div>

            {[
              {
                label: "Reset Data Kesehatan",
                sublabel: "Hapus semua data progress & wellness",
                color: "#EF4444",
                action: () => {
                  if (confirm("Yakin hapus semua data kesehatan? Tindakan ini tidak bisa dibatalkan.")) {
                    ["my20fit_progress_entries", "my20fit_mcu_result", "my20fit_wellness_", "my20fit_sleep_", "my20fit_water_"].forEach(k => {
                      Object.keys(localStorage).filter(key => key.startsWith(k)).forEach(key => localStorage.removeItem(key));
                    });
                    setData(getProfileData());
                    setShowPrivacyModal(false);
                  }
                },
              },
              {
                label: "Hapus Riwayat Checklist",
                sublabel: "Reset semua progress checklist harian",
                color: "#EF4444",
                action: () => {
                  if (confirm("Hapus riwayat checklist?")) {
                    localStorage.removeItem("my20fit_checklist_states");
                    localStorage.removeItem("my20fit_checklist_date");
                    setShowPrivacyModal(false);
                  }
                },
              },
              {
                label: "Hapus Data Nutrisi",
                sublabel: "Hapus semua cache rekomendasi nutrisi",
                color: "#EF4444",
                action: () => {
                  if (confirm("Hapus data nutrisi?")) {
                    Object.keys(localStorage).filter(k => k.startsWith("my20fit_food_")).forEach(k => localStorage.removeItem(k));
                    setShowPrivacyModal(false);
                  }
                },
              },
              { label: "Export Data Saya", sublabel: "Download semua data sebagai JSON", color: "var(--text)", action: exportMyData },
            ].map((item, i, arr) => (
              <div
                key={item.label}
                onClick={item.action}
                style={{
                  display: "flex", alignItems: "center", padding: "16px 0", cursor: "pointer",
                  borderBottom: i < arr.length - 1 ? "0.5px solid var(--border-subtle,#E5E1D8)" : "none",
                  gap: 12,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 15, color: item.color }}>{item.label}</div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 400, fontStyle: "italic", fontSize: 12, color: "var(--muted)" }}>{item.sublabel}</div>
                </div>
                <ChevronRight size={14} color="var(--muted)" />
              </div>
            ))}

            <button
              onClick={() => {
                if (confirm("Yakin ingin menghapus akun?")) {
                  if (confirm("Semua data akan hilang permanen. Lanjutkan?")) {
                    Object.keys(localStorage).filter(k => k.startsWith("my20fit_")).forEach(k => localStorage.removeItem(k));
                    setLocation("/login");
                  }
                }
              }}
              style={{
                width: "100%", padding: "14px", background: "rgba(239,68,68,.08)",
                border: "1.5px solid #EF4444", borderRadius: 12, cursor: "pointer",
                fontFamily: "'Anton', sans-serif", fontSize: 15, letterSpacing: 1,
                color: "#EF4444", marginTop: 20,
              }}
            >HAPUS AKUN</button>
          </div>
        </div>
      )}

    </div>
  );
}
