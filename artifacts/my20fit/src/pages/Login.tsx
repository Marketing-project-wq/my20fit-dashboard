import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff, AlertCircle, CheckCircle, Dumbbell, Brain, CalendarDays, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Tab = "login" | "register";
type FormState = "normal" | "forgot";

const inputBase: React.CSSProperties = {
  width: "100%",
  background: "#FFFFFF",
  border: "1px solid #E5E1D8",
  borderRadius: 10,
  padding: "12px 14px",
  fontFamily: "'Barlow Condensed', sans-serif",
  fontSize: 15,
  color: "#0A0908",
  outline: "none",
  transition: "border-color 0.2s, box-shadow 0.2s",
  boxSizing: "border-box" as const,
};

const labelStyle: React.CSSProperties = {
  fontFamily: "'Bebas Neue', sans-serif",
  fontSize: 10,
  letterSpacing: "2px",
  color: "#6E665C",
  display: "block",
  marginBottom: 5,
};

const features = [
  { icon: Brain, text: "AI Health Analysis dari MCU" },
  { icon: Activity, text: "Daily Wellness Checklist" },
  { icon: CalendarDays, text: "Sport Events & Schedule" },
  { icon: Dumbbell, text: "Progress Tracking & Charts" },
];

export default function Login() {
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState<Tab>("login");
  const [formState, setFormState] = useState<FormState>("normal");

  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPw, setShowLoginPw] = useState(false);

  // Register fields
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [showRegPw, setShowRegPw] = useState(false);

  // Forgot password
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Shared
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Auto-dismiss error after 5s
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(t);
  }, [error]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
      if (err) {
        if (err.message.includes("Invalid login credentials")) {
          const { data: mirror } = await supabase
            .from("photo_user_mirror").select("email, name, auth_type").eq("email", loginEmail).single();
          if (mirror) {
            setError("Email ini terdaftar di 20FIT. Gunakan password yang sama atau reset password.");
          } else {
            setError("Email atau password salah.");
          }
        } else {
          setError(err.message);
        }
        return;
      }
      setLocation("/");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (regPassword !== regConfirm) { setError("Password tidak sama."); return; }
    if (regPassword.length < 8) { setError("Password minimal 8 karakter."); return; }
    setLoading(true); setError(null);
    try {
      const { data: existing } = await supabase
        .from("photo_user_mirror").select("email, name, auth_user_id").eq("email", regEmail).single();
      if (existing?.auth_user_id) {
        setError("Email ini sudah terdaftar. Silakan masuk.");
        setTab("login");
        return;
      }
      const { data, error: err } = await supabase.auth.signUp({
        email: regEmail, password: regPassword,
        options: { data: { full_name: regName, phone: regPhone } },
      });
      if (err) { setError(err.message); return; }
      if (data.user) {
        await supabase.from("my20fit_profile").update({ phone: regPhone, full_name: regName }).eq("auth_user_id", data.user.id);
      }
      if (!data.session) {
        setSuccessMsg("Cek email kamu untuk verifikasi akun, lalu masuk.");
        setTab("login");
      } else {
        setLocation("/");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setError(null);
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/" },
    });
    if (err) setError(err.message);
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: window.location.origin + "/reset-password",
      });
      if (err) { setError(err.message); return; }
      setForgotSuccess(true);
    } finally {
      setLoading(false);
    }
  }

  const btnStyle: React.CSSProperties = {
    width: "100%", padding: "13px", borderRadius: 10, cursor: "pointer",
    fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, letterSpacing: "2.5px",
    border: "none", transition: "transform 0.2s ease, box-shadow 0.2s ease",
    opacity: loading ? 0.7 : 1,
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: "'Barlow Condensed', sans-serif" }}>

      {/* ── LEFT HERO PANEL ── */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex"
        style={{
          width: "54%", background: "#0A0A0A", flexDirection: "column",
          position: "sticky", top: 0, height: "100vh",
          backgroundImage: "radial-gradient(circle at 30% 70%, rgba(196,17,1,0.08) 0%, transparent 50%), radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "auto, 24px 24px",
        }}
      >
        {/* Red top stripe */}
        <div style={{ height: 3, background: "linear-gradient(90deg, #C41101, #FF4444, #C41101)", backgroundSize: "200% 100%", animation: "stripeShimmer 3s linear infinite" }} />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "48px 56px" }}>
          {/* Logo */}
          <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
            <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, color: "#fff", letterSpacing: "4px", marginBottom: 40 }}>
              my<span style={{ color: "#C41101" }}>20</span>FIT
            </h1>
          </motion.div>

          {/* Wordmark */}
          <div style={{ marginBottom: 48 }}>
            {[
              { text: "ELEVATE.", style: { color: "#fff", backgroundImage: "linear-gradient(90deg, #fff 0%, #C41101 40%, #fff 60%, #fff 100%)", backgroundSize: "200% auto", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", animation: "shimmer 5s linear infinite" } as React.CSSProperties },
              { text: "EVERY.", style: { color: "rgba(255,255,255,0.28)" } as React.CSSProperties },
              { text: "METRIC.", style: { color: "#C41101" } as React.CSSProperties },
            ].map(({ text, style }, i) => (
              <motion.div
                key={text}
                initial={{ x: -40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 + i * 0.12, type: "spring", stiffness: 200 }}
                style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 72, lineHeight: 0.9, ...style }}
              >
                {text}
              </motion.div>
            ))}
          </div>

          {/* Chips */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 48 }}>
            {["AI Health Analysis", "Daily Checklist", "Sport Events"].map(chip => (
              <span key={chip} style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 11, letterSpacing: "1.5px", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, padding: "4px 12px" }}>
                {chip}
              </span>
            ))}
          </motion.div>

          {/* Feature list */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.85 }} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {features.map(({ icon: Icon, text }) => (
              <div key={text} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(196,17,1,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={15} style={{ color: "#C41101" }} />
                </div>
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, color: "rgba(255,255,255,0.65)" }}>{text}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* ── RIGHT FORM PANEL ── */}
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.55, delay: 0.15 }}
        style={{ flex: 1, background: "#F4F2EE", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px", overflowY: "auto", minHeight: "100vh" }}
      >
        <div style={{ width: "100%", maxWidth: 400 }}>

          {/* Mobile logo */}
          <div className="lg:hidden" style={{ marginBottom: 28, textAlign: "center" }}>
            <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: "#0A0908", letterSpacing: "3px" }}>
              my<span style={{ color: "#C41101" }}>20</span>FIT
            </h1>
          </div>

          <AnimatePresence mode="wait">

            {/* ── FORGOT PASSWORD ── */}
            {formState === "forgot" && (
              <motion.div key="forgot" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
                <button onClick={() => { setFormState("normal"); setForgotSuccess(false); setError(null); }} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: "#6E665C", fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, marginBottom: 20 }}>
                  ← Kembali ke Masuk
                </button>
                <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: "2px", color: "#0A0908", marginBottom: 6 }}>LUPA PASSWORD</h2>
                <p style={{ fontSize: 13, color: "#6E665C", marginBottom: 24 }}>Kami akan kirimkan link reset ke email kamu.</p>
                {forgotSuccess ? (
                  <div style={{ background: "#DCFCE7", border: "1px solid #86EFAC", borderRadius: 10, padding: "16px", display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <CheckCircle size={18} style={{ color: "#16A34A", flexShrink: 0, marginTop: 1 }} />
                    <p style={{ fontSize: 13, color: "#166534" }}>Email reset telah dikirim ke <strong>{forgotEmail}</strong>. Cek inbox kamu.</p>
                  </div>
                ) : (
                  <form onSubmit={handleForgotPassword} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {error && <ErrorAlert msg={error} />}
                    <div>
                      <label style={labelStyle}>EMAIL</label>
                      <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="kamu@email.com" required style={inputBase} />
                    </div>
                    <button type="submit" disabled={loading} style={{ ...btnStyle, background: "#C41101", color: "#fff" }}>
                      {loading ? "MENGIRIM…" : "KIRIM RESET PASSWORD →"}
                    </button>
                  </form>
                )}
              </motion.div>
            )}

            {/* ── LOGIN / REGISTER ── */}
            {formState === "normal" && (
              <motion.div key="normal" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
                <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, letterSpacing: "2px", color: "#0A0908", marginBottom: 20 }}>
                  {tab === "login" ? "SELAMAT DATANG" : "BUAT AKUN"}
                </h2>

                {/* Tab switcher */}
                <div style={{ display: "flex", gap: 0, marginBottom: 24, borderRadius: 10, overflow: "hidden", border: "1px solid #E5E1D8", background: "#fff" }}>
                  {(["login", "register"] as Tab[]).map(t => (
                    <button key={t} onClick={() => { setTab(t); setError(null); setSuccessMsg(null); }}
                      style={{ flex: 1, padding: "11px", fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, letterSpacing: "2px", cursor: "pointer", transition: "all 0.2s", border: "none",
                        backgroundColor: tab === t ? "#C41101" : "transparent", color: tab === t ? "#fff" : "#6E665C" }}>
                      {t === "login" ? "MASUK" : "DAFTAR"}
                    </button>
                  ))}
                </div>

                {error && <ErrorAlert msg={error} />}
                {successMsg && (
                  <div style={{ background: "#DCFCE7", border: "1px solid #86EFAC", borderRadius: 10, padding: "12px 16px", display: "flex", gap: 10, alignItems: "center", marginBottom: 14 }}>
                    <CheckCircle size={16} style={{ color: "#16A34A", flexShrink: 0 }} />
                    <p style={{ fontSize: 13, color: "#166534" }}>{successMsg}</p>
                  </div>
                )}

                <AnimatePresence mode="wait">
                  {tab === "login" ? (
                    <motion.form key="login-form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
                      onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      <div>
                        <label style={labelStyle}>EMAIL</label>
                        <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="kamu@email.com" required style={inputBase} />
                      </div>
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                          <label style={{ ...labelStyle, marginBottom: 0 }}>PASSWORD</label>
                          <button type="button" onClick={() => { setFormState("forgot"); setForgotEmail(loginEmail); setError(null); }}
                            style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, color: "#C41101" }}>
                            Lupa password?
                          </button>
                        </div>
                        <div style={{ position: "relative" }}>
                          <input type={showLoginPw ? "text" : "password"} value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="Password" required style={{ ...inputBase, paddingRight: 44 }} />
                          <button type="button" onClick={() => setShowLoginPw(s => !s)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#6E665C" }}>
                            {showLoginPw ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                      <button type="submit" disabled={loading}
                        style={{ ...btnStyle, background: "#C41101", color: "#fff", marginTop: 4 }}
                        onMouseEnter={e => { if (!loading) { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 20px rgba(196,17,1,0.35)"; } }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}>
                        {loading ? "MEMPROSES…" : "MASUK →"}
                      </button>
                      <Divider />
                      <GoogleBtn onClick={handleGoogleLogin} label="Masuk dengan Google" />
                      <p style={{ textAlign: "center", fontSize: 13, color: "#6E665C", marginTop: 4 }}>
                        Belum punya akun?{" "}
                        <button type="button" onClick={() => setTab("register")} style={{ background: "none", border: "none", cursor: "pointer", color: "#C41101", fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: 600 }}>
                          Daftar gratis
                        </button>
                      </p>
                    </motion.form>
                  ) : (
                    <motion.form key="reg-form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
                      onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      <div>
                        <label style={labelStyle}>NAMA LENGKAP</label>
                        <input type="text" value={regName} onChange={e => setRegName(e.target.value)} placeholder="Nama lengkap" required style={inputBase} />
                      </div>
                      <div>
                        <label style={labelStyle}>EMAIL</label>
                        <input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="kamu@email.com" required style={inputBase} />
                      </div>
                      <div>
                        <label style={labelStyle}>NOMOR HP</label>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, color: "#0A0908", background: "#fff", border: "1px solid #E5E1D8", borderRadius: 10, padding: "12px 12px", flexShrink: 0 }}>+62</span>
                          <input type="tel" value={regPhone} onChange={e => setRegPhone(e.target.value)} placeholder="812xxxxxxxx" style={{ ...inputBase, flex: 1 }} />
                        </div>
                      </div>
                      <div>
                        <label style={labelStyle}>PASSWORD</label>
                        <div style={{ position: "relative" }}>
                          <input type={showRegPw ? "text" : "password"} value={regPassword} onChange={e => setRegPassword(e.target.value)} placeholder="Min. 8 karakter" required style={{ ...inputBase, paddingRight: 44 }} />
                          <button type="button" onClick={() => setShowRegPw(s => !s)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#6E665C" }}>
                            {showRegPw ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label style={labelStyle}>KONFIRMASI PASSWORD</label>
                        <input type="password" value={regConfirm} onChange={e => setRegConfirm(e.target.value)} placeholder="Ulangi password" required style={inputBase} />
                      </div>
                      <button type="submit" disabled={loading}
                        style={{ ...btnStyle, background: "#C41101", color: "#fff", marginTop: 4 }}
                        onMouseEnter={e => { if (!loading) { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 20px rgba(196,17,1,0.35)"; } }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}>
                        {loading ? "MEMPROSES…" : "DAFTAR GRATIS →"}
                      </button>
                      <Divider />
                      <GoogleBtn onClick={handleGoogleLogin} label="Daftar dengan Google" />
                      <p style={{ textAlign: "center", fontSize: 13, color: "#6E665C", marginTop: 4 }}>
                        Sudah punya akun?{" "}
                        <button type="button" onClick={() => setTab("login")} style={{ background: "none", border: "none", cursor: "pointer", color: "#C41101", fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: 600 }}>
                          Masuk
                        </button>
                      </p>
                    </motion.form>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes stripeShimmer {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function ErrorAlert({ msg }: { msg: string }) {
  return (
    <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "11px 14px", display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 14 }}>
      <AlertCircle size={16} style={{ color: "#C41101", flexShrink: 0, marginTop: 1 }} />
      <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, color: "#7F1D1D", lineHeight: 1.4 }}>{msg}</p>
    </div>
  );
}

function Divider() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "2px 0" }}>
      <div style={{ flex: 1, height: 1, background: "#E5E1D8" }} />
      <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, color: "#6E665C" }}>atau</span>
      <div style={{ flex: 1, height: 1, background: "#E5E1D8" }} />
    </div>
  );
}

function GoogleBtn({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick}
      style={{ width: "100%", padding: "12px", borderRadius: 10, cursor: "pointer", fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, letterSpacing: "0.5px", border: "1px solid #E5E1D8", background: "#fff", color: "#0A0908", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, transition: "box-shadow 0.2s, transform 0.2s" }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}>
      <GoogleIcon />
      {label}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
      <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z"/>
    </svg>
  );
}
