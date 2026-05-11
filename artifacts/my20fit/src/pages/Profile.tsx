import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import {
  User, Mail, Phone, Calendar, Ruler, Weight,
  Activity, Bell, Moon, Sun, Globe, Shield,
  HelpCircle, Star, ChevronRight, LogOut,
  Pencil, Trash2, Check, X,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import Header from "@/components/Header";

interface McuData {
  grade?: string;
  metrics?: Array<{ label?: string; value?: string | number }>;
  reviewed_at?: string;
}

interface ProgressEntry {
  date: string;
  weight?: number;
  bmi?: number;
}

interface ProfileData {
  mcu: McuData | null;
  latestEntry: ProgressEntry | null;
  gender: string | null;
  height: string | null;
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

const mockUser = {
  name: "ZIDNI",
  email: "zidni@20fit.id",
  phone: "+62 812-3456-7890",
  joinDate: "2026-01-15",
  isPlusMember: true,
  avatarInitials: "ZD",
};

function bmiLabel(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: "Underweight", color: "#2563EB" };
  if (bmi < 25) return { label: "Normal", color: "#16A34A" };
  if (bmi < 30) return { label: "Overweight", color: "#D97706" };
  return { label: "Obese", color: "#DC2626" };
}

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
        background: "#fff",
        transition: "left .2s",
        boxShadow: "0 1px 3px rgba(0,0,0,.2)",
      }} />
    </div>
  );
}

export default function Profile({ theme, toggleTheme }: { theme: string; toggleTheme: () => void }) {
  const [, setLocation] = useLocation();
  const [data, setData] = useState<ProfileData>(getProfileData);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showToast, setShowToast] = useState(false);

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

  useEffect(() => {
    setSettingValues(prev => ({ ...prev, theme: theme === "dark" }));
  }, [theme]);

  const { mcu, latestEntry, gender, height } = data;

  const computedBmi = (() => {
    const w = editWeight ? parseFloat(editWeight) : latestEntry?.weight;
    const h = editHeight ? parseFloat(editHeight) : (height ? parseFloat(height) : null);
    if (w && h && h > 0) return (w / ((h / 100) ** 2));
    return null;
  })();

  const stats = [
    {
      label: "BERAT",
      value: latestEntry?.weight ||
        mcu?.metrics?.find(m => m.label?.toLowerCase().includes("berat"))?.value ||
        "—",
      unit: "kg",
      icon: <Weight size={14} />,
    },
    {
      label: "BMI",
      value: latestEntry?.bmi ||
        mcu?.metrics?.find(m => m.label?.toLowerCase().includes("bmi"))?.value ||
        "—",
      unit: "",
      icon: <Activity size={14} />,
    },
    {
      label: "TINGGI",
      value: localStorage.getItem("my20fit_height") || "—",
      unit: "cm",
      icon: <Ruler size={14} />,
    },
  ];

  const infoRows = [
    { icon: <User size={16} />, label: "Nama Lengkap", value: mockUser.name, field: "name" },
    { icon: <Mail size={16} />, label: "Email", value: mockUser.email, field: "email" },
    { icon: <Phone size={16} />, label: "Nomor HP", value: mockUser.phone, field: "phone" },
    {
      icon: <Calendar size={16} />, label: "Jenis Kelamin",
      value: gender === "male" ? "Laki-laki" : gender === "female" ? "Perempuan" : "Belum diisi",
      field: "gender",
    },
    {
      icon: <Ruler size={16} />, label: "Tinggi Badan",
      value: height ? height + " cm" : "Belum diisi",
      field: "height",
    },
  ];

  const settings = [
    {
      icon: <Bell size={16} />,
      label: "Notifikasi",
      sublabel: "Reminder checklist, event, MCU",
      type: "toggle" as const,
      key: "notifications",
    },
    {
      icon: theme === "dark" ? <Sun size={16} /> : <Moon size={16} />,
      label: "Dark Mode",
      sublabel: theme === "dark" ? "Aktif" : "Nonaktif",
      type: "toggle" as const,
      key: "theme",
    },
    {
      icon: <Globe size={16} />, label: "Bahasa", sublabel: "Indonesia",
      type: "chevron" as const, action: () => {},
    },
    {
      icon: <Shield size={16} />, label: "Privasi & Keamanan", sublabel: "Data, password, akun",
      type: "chevron" as const, action: () => setShowPrivacyModal(true),
    },
    {
      icon: <HelpCircle size={16} />, label: "Bantuan & FAQ", sublabel: "Panduan penggunaan app",
      type: "chevron" as const, action: () => {},
    },
    {
      icon: <Star size={16} />, label: "Rate App", sublabel: "Beri rating di App Store",
      type: "chevron" as const, action: () => {},
    },
  ];

  const handleSettingChange = useCallback((key: string, value: boolean) => {
    setSettingValues(prev => ({ ...prev, [key]: value }));
    if (key === "theme") {
      toggleTheme();
    }
    localStorage.setItem(`my20fit_setting_${key}`, JSON.stringify(value));
  }, [toggleTheme]);

  function handleSaveEdit() {
    if (editGender) localStorage.setItem("my20fit_gender", editGender);
    if (editHeight) localStorage.setItem("my20fit_height", editHeight);
    setData(getProfileData());
    setShowEditModal(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  }

  function exportMyData() {
    const exportData: Record<string, unknown> = {};
    const keys = Object.keys(localStorage).filter(k => k.startsWith("my20fit_"));
    keys.forEach(k => {
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

  const gradeColor = (g?: string) =>
    g === "A" ? "#16A34A" : g === "B" ? "#2563EB" : g === "C" ? "#D97706" : "#DC2626";

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "var(--bg)", border: "1.5px solid var(--border-subtle,#E5E1D8)",
    borderRadius: 10, padding: "11px 14px",
    fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 15,
    color: "var(--text)", outline: "none", boxSizing: "border-box",
  };

  const fieldLabel: React.CSSProperties = {
    fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900,
    fontSize: 11, letterSpacing: "1.5px", color: "var(--muted)",
    display: "block", marginBottom: 6,
  };

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg)" }}>
      <Sidebar theme={theme} toggleTheme={toggleTheme} />

      <main className="flex-1 w-full lg:pl-[220px]">
        <Header theme={theme} toggleTheme={toggleTheme} />

        <div style={{ maxWidth: 680, margin: "0 auto", padding: "20px 16px 100px" }}>

          {/* ── SECTION 1: PROFILE HERO ── */}
          <div style={{
            background: "linear-gradient(135deg, #0A0908 0%, #1A1A0F 100%)",
            borderRadius: 16, padding: "28px 20px 24px",
            marginBottom: 16, position: "relative", overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", inset: 0,
              backgroundImage: "radial-gradient(circle, rgba(255,255,255,.04) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }} />
            <button
              onClick={() => setShowEditModal(true)}
              style={{
                position: "absolute", top: 16, right: 16,
                background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.15)",
                borderRadius: 8, padding: "6px 12px",
                display: "flex", alignItems: "center", gap: 6,
                cursor: "pointer", zIndex: 1,
              }}
            >
              <Pencil size={12} color="rgba(255,255,255,.7)" />
              <span style={{ fontFamily: "'Anton', sans-serif", fontSize: 11, letterSpacing: 1, color: "rgba(255,255,255,.7)" }}>EDIT</span>
            </button>

            <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 80, height: 80, borderRadius: "50%", background: "#C41101",
                display: "flex", alignItems: "center", justifyContent: "center",
                border: "3px solid rgba(255,255,255,.15)",
                fontSize: 28, fontFamily: "'Anton', sans-serif", color: "#fff",
              }}>
                {mockUser.avatarInitials}
              </div>

              <div style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 26, color: "#fff", letterSpacing: 1 }}>
                  {mockUser.name}
                </div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 13, color: "rgba(255,255,255,.55)", marginTop: 2 }}>
                  {mockUser.email}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                {mockUser.isPlusMember && (
                  <span style={{
                    background: "linear-gradient(135deg, #D4A800, #FFD700)", color: "#0A0908",
                    fontFamily: "'Anton', sans-serif", fontSize: 10, letterSpacing: 1.5,
                    padding: "4px 12px", borderRadius: 99,
                  }}>⭐ PLUS MEMBER</span>
                )}
                <span style={{
                  background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.15)",
                  color: "rgba(255,255,255,.7)",
                  fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 10, letterSpacing: 1.5,
                  padding: "4px 12px", borderRadius: 99,
                }}>
                  Member sejak {new Date(mockUser.joinDate).toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
                </span>
              </div>
            </div>
          </div>

          {/* ── SECTION 2: HEALTH SNAPSHOT ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 16 }}>
            {stats.map(stat => (
              <div key={stat.label} style={{
                background: "var(--card)", borderRadius: 14, padding: "14px 12px",
                boxShadow: "var(--shadow)", textAlign: "center",
              }}>
                <div style={{ display: "flex", justifyContent: "center", color: "var(--muted)", marginBottom: 6 }}>
                  {stat.icon}
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700, color: "var(--text)", lineHeight: 1 }}>
                  {stat.value}
                  {stat.unit && (
                    <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 12, color: "var(--muted)", marginLeft: 2 }}>
                      {stat.unit}
                    </span>
                  )}
                </div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 10, letterSpacing: 1.5, color: "var(--muted)", marginTop: 4 }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* ── SECTION 3: PERSONAL INFO ── */}
          <div className="section-header" style={{ marginBottom: 8 }}>
            <h2>INFORMASI PERSONAL</h2>
          </div>
          <div style={{ background: "var(--card)", borderRadius: 14, padding: "0 20px", boxShadow: "var(--shadow)", marginBottom: 16 }}>
            {infoRows.map((row, i) => (
              <div
                key={row.field}
                onClick={() => setShowEditModal(true)}
                style={{
                  display: "flex", alignItems: "center", padding: "14px 0", cursor: "pointer",
                  borderBottom: i < infoRows.length - 1 ? "0.5px solid var(--border-subtle,#E5E1D8)" : "none",
                }}
              >
                <div style={{ color: "var(--muted)", marginRight: 12 }}>{row.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 11, letterSpacing: 1.5, color: "var(--muted)", marginBottom: 2 }}>
                    {row.label}
                  </div>
                  <div style={{
                    fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 15,
                    color: row.value === "Belum diisi" ? "var(--muted)" : "var(--text)",
                  }}>
                    {row.value}
                  </div>
                </div>
                <ChevronRight size={14} color="var(--muted)" />
              </div>
            ))}
          </div>

          {/* ── SECTION 4: MCU STATUS ── */}
          <div style={{ background: "var(--card)", borderRadius: 14, padding: "16px 20px", boxShadow: "var(--shadow)", marginBottom: 16 }}>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 11, letterSpacing: 1.5, color: "var(--muted)", marginBottom: 12 }}>
              STATUS MCU
            </div>
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
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 12, color: "var(--muted)" }}>
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
                  <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 15, color: "var(--text)", marginBottom: 2 }}>
                    Belum ada MCU
                  </div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 12, color: "var(--muted)" }}>
                    Upload untuk program personal
                  </div>
                </div>
                <button
                  onClick={() => setLocation("/")}
                  style={{
                    background: "#C41101", color: "#fff", border: "none", borderRadius: 10,
                    padding: "8px 16px", cursor: "pointer",
                    fontFamily: "'Anton', sans-serif", fontSize: 13, letterSpacing: 1, flexShrink: 0,
                  }}
                >UPLOAD</button>
              </div>
            )}
          </div>

          {/* ── SECTION 5: 20FIT PLUS ── */}
          {mockUser.isPlusMember ? (
            <div style={{ background: "linear-gradient(135deg, #1A1A0F, #0A0A05)", borderRadius: 14, padding: "20px", marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 10, letterSpacing: 2, color: "#D4A800", marginBottom: 4 }}>
                    ⭐ 20FIT PLUS AKTIF
                  </div>
                  <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 20, color: "#fff" }}>MEMBER AKTIF</div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 12, color: "rgba(255,255,255,.5)", marginTop: 4 }}>
                    Berlaku hingga: 31 Des 2026
                  </div>
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 24, fontWeight: 700, color: "#D4A800" }}>✓</div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 16 }}>
                {["10% Arena", "10% Clinic", "10% PT", "10% Shop"].map(b => (
                  <span key={b} style={{
                    background: "rgba(212,168,0,.15)", border: "1px solid rgba(212,168,0,.3)", color: "#D4A800",
                    fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 11,
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
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 13, color: "rgba(255,255,255,.55)", marginBottom: 16 }}>
                Hemat 10% di semua layanan 20FIT
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 700, color: "#D4A800" }}>
                  Rp 49.000
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 13, color: "rgba(255,255,255,.4)" }}>/bulan</span>
                </div>
                <button style={{
                  background: "linear-gradient(135deg, #D4A800, #FFD700)", color: "#0A0908",
                  border: "none", borderRadius: 10, padding: "10px 20px",
                  fontFamily: "'Anton', sans-serif", fontSize: 14, letterSpacing: 1, cursor: "pointer",
                }}>UPGRADE →</button>
              </div>
            </div>
          )}

          {/* ── SECTION 6: SETTINGS ── */}
          <div className="section-header" style={{ marginBottom: 8 }}>
            <h2>PENGATURAN</h2>
          </div>
          <div style={{ background: "var(--card)", borderRadius: 14, padding: "0 20px", boxShadow: "var(--shadow)", marginBottom: 16 }}>
            {settings.map((s, i) => (
              <div
                key={s.key || s.label}
                onClick={s.type === "chevron" ? s.action : undefined}
                style={{
                  display: "flex", alignItems: "center", padding: "14px 0", gap: 12,
                  borderBottom: i < settings.length - 1 ? "0.5px solid var(--border-subtle,#E5E1D8)" : "none",
                  cursor: s.type === "chevron" ? "pointer" : "default",
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10, background: "var(--bg)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--muted)", flexShrink: 0,
                }}>{s.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 15, color: "var(--text)" }}>{s.label}</div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 12, color: "var(--muted)" }}>{s.sublabel}</div>
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

          {/* ── SECTION 7: APP INFO ── */}
          <div style={{ textAlign: "center", padding: "20px 0 8px", marginBottom: 16 }}>
            <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 18, color: "var(--text)", marginBottom: 2 }}>
              my<span style={{ color: "#C41101" }}>20</span>FIT
            </div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 12, color: "var(--muted)" }}>
              Version 1.0.0 · Build 2026.05
            </div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
              © 2026 20FIT · PT Kredo Aum
            </div>
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
              width: "100%", padding: "14px", background: "transparent",
              border: "1.5px solid #EF4444", borderRadius: 12, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              marginBottom: 32, transition: "all .2s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,.08)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <LogOut size={16} color="#EF4444" />
            <span style={{ fontFamily: "'Anton', sans-serif", fontSize: 15, letterSpacing: 1.5, color: "#EF4444" }}>
              KELUAR DARI AKUN
            </span>
          </button>
        </div>
      </main>

      <BottomNav />

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
                  <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 13, color: "var(--muted)" }}>cm</span>
                </div>
              </div>
              <div>
                <label style={fieldLabel}>BERAT BADAN</label>
                <div style={{ position: "relative" }}>
                  <input type="number" value={editWeight} onChange={e => setEditWeight(e.target.value)} placeholder="70" style={{ ...inputStyle, paddingRight: 44 }} />
                  <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 13, color: "var(--muted)" }}>kg</span>
                </div>
                {computedBmi && (
                  <div style={{ marginTop: 8, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 13, color: bmiLabel(computedBmi).color }}>
                    BMI: {computedBmi.toFixed(1)} ({bmiLabel(computedBmi).label})
                  </div>
                )}
              </div>

              <button
                onClick={handleSaveEdit}
                style={{
                  width: "100%", padding: "14px", background: "#C41101", color: "#fff",
                  border: "none", borderRadius: 12, cursor: "pointer",
                  fontFamily: "'Anton', sans-serif", fontSize: 15, letterSpacing: 1,
                  marginTop: 4,
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
              {
                label: "Export Data Saya",
                sublabel: "Download semua data sebagai JSON",
                color: "var(--text)",
                action: exportMyData,
              },
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
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 12, color: "var(--muted)" }}>{item.sublabel}</div>
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

      {/* ── SUCCESS TOAST ── */}
      {showToast && (
        <div style={{
          position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)",
          background: "rgba(10,10,10,.88)", border: "1px solid rgba(255,255,255,.12)",
          backdropFilter: "blur(16px)", borderRadius: 99, padding: "10px 20px 10px 14px",
          display: "flex", alignItems: "center", gap: 8,
          zIndex: 300, whiteSpace: "nowrap",
          animation: "toastSlideUp .4s cubic-bezier(.34,1.56,.64,1) both",
        }}>
          <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#16A34A", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Check size={12} color="#fff" />
          </div>
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 13, color: "#fff" }}>
            Profil berhasil diperbarui
          </span>
        </div>
      )}

      <style>{`
        @keyframes toastSlideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(12px) scale(.95); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
