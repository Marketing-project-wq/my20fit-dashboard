import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff, AlertCircle, CheckCircle, Heart, TrendingUp, Calendar, Shield } from "lucide-react";
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
  fontFamily: "'Barlow Condensed', sans-serif",
  fontSize: 10,
  letterSpacing: "2px",
  color: "#6E665C",
  display: "block",
  marginBottom: 5,
};

const features = [
  { icon: Heart, text: "Program Khusus Untukmu" },
  { icon: TrendingUp, text: "Pantau Progress Real-time" },
  { icon: Calendar, text: "Event & HYROX Registration" },
  { icon: Shield, text: "Data Kamu, Milik Kamu" },
];

export default function Login() {
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState<Tab>("login");
  const [formState, setFormState] = useState<FormState>("normal");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPw, setShowLoginPw] = useState(false);

  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [showRegPw, setShowRegPw] = useState(false);

  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(t);
  }, [error]);

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    setError(null);
    try {
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: "https://my-20fit.replit.app/auth/callback",
          skipBrowserRedirect: false,
          queryParams: { access_type: "offline", prompt: "select_account" },
        },
      });
      if (err) { setError(err.message); setGoogleLoading(false); }
    } catch {
      setError("Gagal login dengan Google. Coba lagi.");
      setGoogleLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const { error: err } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });
      if (err) {
        if (err.message.toLowerCase().includes("email not confirmed")) {
          setError("Email belum diverifikasi. Cek inbox kamu dan klik link konfirmasi.");
        } else if (err.message.toLowerCase().includes("invalid login")) {
          setError("Email atau password salah.");
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
      const { data, error: err } = await supabase.auth.signUp({
        email: regEmail,
        password: regPassword,
        options: {
          data: { full_name: regName, phone: regPhone },
          emailRedirectTo: window.location.origin + import.meta.env.BASE_URL,
        },
      });
      if (err) { setError(err.message); return; }
      if (data.user && !data.session) {
        setSuccessMsg("Link verifikasi telah dikirim ke " + regEmail + ". Cek inbox kamu lalu masuk.");
        setTab("login");
        setLoginEmail(regEmail);
      } else if (data.session) {
        setLocation("/");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: window.location.origin + import.meta.env.BASE_URL + "reset-password",
      });
      if (err) { setError(err.message); return; }
      setForgotSuccess(true);
    } finally {
      setLoading(false);
    }
  }

  const redBtn: React.CSSProperties = {
    width: "100%", padding: "13px", borderRadius: 10, cursor: "pointer",
    fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, letterSpacing: "2.5px",
    border: "none", background: "#C41101", color: "#fff",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    opacity: loading ? 0.7 : 1,
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: "'Barlow Condensed', sans-serif" }}>

      {/* ── LEFT PANEL ── */}
      <motion.div
        initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}
        className="hidden lg:flex"
        style={{
          width: "54%", background: "#0A0A0A", flexDirection: "column",
          position: "sticky", top: 0, height: "100vh",
          backgroundImage: "radial-gradient(circle at 20% 80%, rgba(196,17,1,0.12) 0%, transparent 45%), radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "auto, 24px 24px",
        }}
      >
        <div style={{ height: 3, background: "linear-gradient(90deg, #C41101, #FF4444, #C41101)", backgroundSize: "200% 100%", animation: "stripeShimmer 3s linear infinite" }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "48px 56px" }}>
          <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} style={{ marginBottom: 40 }}>
            <h1 style={{ fontFamily: "'Anton', sans-serif", fontWeight: 400, fontSize: 34, color: "#fff", letterSpacing: "1.5px", margin: 0 }}>
              my<span style={{ color: "#C41101" }}>20</span>FIT
            </h1>
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 10, letterSpacing: "1.5px", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, padding: "2px 10px", display: "inline-block", marginTop: 6 }}>
              MEMBER APP
            </span>
          </motion.div>
          <div style={{ marginBottom: 48 }}>
            {[
              { text: "ELEVATE.", style: { color: "#fff", backgroundImage: "linear-gradient(90deg, #fff 0%, #C41101 40%, #fff 60%, #fff 100%)", backgroundSize: "200% auto", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", animation: "shimmer 5s linear infinite" } as React.CSSProperties },
              { text: "EVERY.", style: { color: "rgba(255,255,255,0.28)" } as React.CSSProperties },
              { text: "METRIC.", style: { color: "#C41101" } as React.CSSProperties },
            ].map(({ text, style }, i) => (
              <motion.div key={text} initial={{ x: -40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 + i * 0.12, type: "spring", stiffness: 200 }}
                style={{ fontFamily: "'Anton', sans-serif", fontWeight: 400, fontSize: 66, lineHeight: 0.9, ...style }}>
                {text}
              </motion.div>
            ))}
          </div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 48 }}>
            {["AI Health Analysis", "Daily Checklist", "Sport Events"].map(chip => (
              <span key={chip} style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 11, letterSpacing: "1px", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, padding: "4px 12px" }}>{chip}</span>
            ))}
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.85 }} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {features.map(({ icon: Icon, text }) => (
              <div key={text} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(196,17,1,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={15} style={{ color: "#C41101" }} />
                </div>
                <span style={{ fontFamily: "'Anton', sans-serif", fontWeight: 400, fontSize: 14, color: "rgba(255,255,255,0.65)" }}>{text}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* ── RIGHT FORM PANEL ── */}
      <motion.div
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.55, delay: 0.15 }}
        style={{ flex: 1, background: "#F4F2EE", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px", overflowY: "auto", minHeight: "100vh" }}
      >
        <div style={{ width: "100%", maxWidth: 400 }}>
          <div className="lg:hidden" style={{ marginBottom: 28, textAlign: "center" }}>
            <h1 style={{ fontFamily: "'Anton', sans-serif", fontWeight: 400, fontSize: 30, color: "#0A0908", letterSpacing: "1px" }}>
              my<span style={{ color: "#C41101" }}>20</span>FIT
            </h1>
          </div>

          <AnimatePresence mode="wait">

            {/* FORGOT PASSWORD */}
            {formState === "forgot" && (
              <motion.div key="forgot" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
                <button onClick={() => { setFormState("normal"); setForgotSuccess(false); setError(null); }}
                  style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: "#6E665C", fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, marginBottom: 20 }}>
                  ← Kembali ke Masuk
                </button>
                <h2 style={{ fontFamily: "'Anton', sans-serif", fontWeight: 400, fontSize: 22, letterSpacing: "0.5px", color: "#0A0908", marginBottom: 6 }}>LUPA PASSWORD</h2>
                <p style={{ fontSize: 13, color: "#6E665C", marginBottom: 24 }}>Kami akan kirimkan link reset ke email kamu.</p>
                {forgotSuccess ? (
                  <div style={{ background: "#DCFCE7", border: "1px solid #86EFAC", borderRadius: 10, padding: "16px", display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <CheckCircle size={18} style={{ color: "#16A34A", flexShrink: 0, marginTop: 1 }} />
                    <p style={{ fontSize: 13, color: "#166534" }}>Link reset telah dikirim ke <strong>{forgotEmail}</strong>. Cek inbox kamu.</p>
                  </div>
                ) : (
                  <form onSubmit={handleForgotPassword} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {error && <ErrorAlert msg={error} />}
                    <div>
                      <label style={labelStyle}>EMAIL</label>
                      <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="kamu@email.com" required style={inputBase} />
                    </div>
                    <button type="submit" disabled={loading} style={redBtn}>
                      {loading ? "MENGIRIM…" : "KIRIM LINK RESET →"}
                    </button>
                  </form>
                )}
              </motion.div>
            )}

            {/* LOGIN / REGISTER */}
            {formState === "normal" && (
              <motion.div key="normal" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
                <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 10, letterSpacing: "1.5px", color: "#6E665C", marginBottom: 4 }}>SELAMAT DATANG</p>
                <h2 style={{ fontFamily: "'Anton', sans-serif", fontWeight: 400, fontSize: 26, letterSpacing: "0.5px", color: "#0A0908", marginBottom: 20 }}>
                  Masuk ke my20fit.
                </h2>

                {/* Tab switcher */}
                <div style={{ display: "flex", marginBottom: 24, borderRadius: 10, overflow: "hidden", border: "1px solid #E5E1D8", background: "#fff" }}>
                  {(["login", "register"] as Tab[]).map(t => (
                    <button key={t} onClick={() => { setTab(t); setError(null); setSuccessMsg(null); }}
                      style={{ flex: 1, padding: "11px", fontFamily: "'Anton', sans-serif", fontWeight: 400, fontSize: 13, letterSpacing: "1px", cursor: "pointer", transition: "all 0.2s", border: "none",
                        backgroundColor: tab === t ? "#0A0908" : "transparent", color: tab === t ? "#fff" : "#6E665C" }}>
                      {t === "login" ? "MASUK" : "DAFTAR"}
                    </button>
                  ))}
                </div>

                {error && <ErrorAlert msg={error} />}
                {successMsg && (
                  <div style={{ background: "#DCFCE7", border: "1px solid #86EFAC", borderRadius: 10, padding: "12px 16px", display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 14 }}>
                    <CheckCircle size={16} style={{ color: "#16A34A", flexShrink: 0, marginTop: 2 }} />
                    <p style={{ fontSize: 13, color: "#166534", lineHeight: 1.5 }}>{successMsg}</p>
                  </div>
                )}

                <AnimatePresence mode="wait">
                  {tab === "login" ? (
                    <motion.div key="login-form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                      {/* Google — PRIMARY */}
                      <GoogleBtn onClick={handleGoogleLogin} label="Masuk dengan Google" loading={googleLoading} />
                      <OAuthDivider label="atau masuk dengan email" />
                      <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
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
                            <input type={showLoginPw ? "text" : "password"} value={loginPassword} onChange={e => setLoginPassword(e.target.value)}
                              placeholder="Password" required style={{ ...inputBase, paddingRight: 44 }} />
                            <button type="button" onClick={() => setShowLoginPw(s => !s)}
                              style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#6E665C" }}>
                              {showLoginPw ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </div>
                        <button type="submit" disabled={loading} style={{ ...redBtn, marginTop: 4 }}
                          onMouseEnter={e => { if (!loading) { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 20px rgba(196,17,1,0.35)"; } }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}>
                          {loading ? "MEMPROSES…" : "MASUK →"}
                        </button>
                        <p style={{ textAlign: "center", fontSize: 13, color: "#6E665C", marginTop: 4 }}>
                          Belum punya akun?{" "}
                          <button type="button" onClick={() => { setTab("register"); setError(null); setSuccessMsg(null); }}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "#C41101", fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: 600 }}>
                            Daftar gratis
                          </button>
                        </p>
                      </form>
                    </motion.div>
                  ) : (
                    <motion.div key="reg-form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                      {/* Google — PRIMARY */}
                      <GoogleBtn onClick={handleGoogleLogin} label="Daftar dengan Google" loading={googleLoading} />
                      <OAuthDivider label="atau daftar dengan email" />
                      <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
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
                          <div style={{ display: "flex", gap: 8 }}>
                            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, color: "#0A0908", background: "#fff", border: "1px solid #E5E1D8", borderRadius: 10, padding: "12px 12px", flexShrink: 0 }}>+62</span>
                            <input type="tel" value={regPhone} onChange={e => setRegPhone(e.target.value)} placeholder="812xxxxxxxx" style={{ ...inputBase, flex: 1 }} />
                          </div>
                        </div>
                        <div>
                          <label style={labelStyle}>PASSWORD</label>
                          <div style={{ position: "relative" }}>
                            <input type={showRegPw ? "text" : "password"} value={regPassword} onChange={e => setRegPassword(e.target.value)}
                              placeholder="Min. 8 karakter" required style={{ ...inputBase, paddingRight: 44 }} />
                            <button type="button" onClick={() => setShowRegPw(s => !s)}
                              style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#6E665C" }}>
                              {showRegPw ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label style={labelStyle}>KONFIRMASI PASSWORD</label>
                          <input type="password" value={regConfirm} onChange={e => setRegConfirm(e.target.value)} placeholder="Ulangi password" required style={inputBase} />
                        </div>
                        <button type="submit" disabled={loading} style={{ ...redBtn, marginTop: 4 }}
                          onMouseEnter={e => { if (!loading) { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 20px rgba(196,17,1,0.35)"; } }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}>
                          {loading ? "MEMPROSES…" : "DAFTAR GRATIS →"}
                        </button>
                        <p style={{ textAlign: "center", fontSize: 13, color: "#6E665C", marginTop: 4 }}>
                          Sudah punya akun?{" "}
                          <button type="button" onClick={() => { setTab("login"); setError(null); setSuccessMsg(null); }}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "#C41101", fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: 600 }}>
                            Masuk
                          </button>
                        </p>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <style>{`
        @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes stripeShimmer { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function GoogleBtn({ onClick, label, loading }: { onClick: () => void; label: string; loading?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      style={{
        width: "100%", height: 48, display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
        background: "#fff", border: "1.5px solid #E5E1D8", borderRadius: 12, cursor: loading ? "default" : "pointer",
        fontFamily: "'Anton', sans-serif", fontWeight: 400, fontSize: 15, color: "#0A0908",
        marginBottom: 0, boxShadow: "0 1px 3px rgba(0,0,0,.08)", transition: "all .2s",
        opacity: loading ? 0.75 : 1,
      }}
      onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 12px rgba(0,0,0,.12)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 3px rgba(0,0,0,.08)"; }}
    >
      {loading ? (
        <>
          <div style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid #D1C9BF", borderTopColor: "#C41101", animation: "spin 0.7s linear infinite", flexShrink: 0 }} />
          Menghubungkan…
        </>
      ) : (
        <>
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {label}
        </>
      )}
    </button>
  );
}

function OAuthDivider({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "14px 0" }}>
      <div style={{ flex: 1, height: 1, background: "#E5E1D8" }} />
      <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, color: "#6E665C", whiteSpace: "nowrap" }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: "#E5E1D8" }} />
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
