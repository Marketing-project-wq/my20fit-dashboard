import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { supabase } from "@/lib/supabase";
import {
  Eye, EyeOff, AlertCircle, CheckCircle,
  Heart, TrendingUp, Calendar, Shield, Wand2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import GoogleButton from "@/components/auth/GoogleButton";

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
  { icon: Heart, text: "Personalized Program" },
  { icon: TrendingUp, text: "Real-time Progress Tracking" },
  { icon: Calendar, text: "Event & HYROX Registration" },
  { icon: Shield, text: "Your Data, Your Privacy" },
];

function ErrorAlert({ msg }: { msg: string }) {
  return (
    <div style={{
      background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10,
      padding: "12px 16px", display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 14,
    }}>
      <AlertCircle size={16} style={{ color: "#C41101", flexShrink: 0, marginTop: 2 }} />
      <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, color: "#7F1D1D", margin: 0 }}>
        {msg}
      </p>
    </div>
  );
}

export default function Login() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);

  const [formState, setFormState] = useState<FormState>("normal");

  const [loginEmail, setLoginEmail] = useState(() => params.get("email") ?? "");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPw, setShowLoginPw] = useState(false);

  const [forgotEmail, setForgotEmail] = useState(() => params.get("email") ?? "");
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 6000);
    return () => clearTimeout(t);
  }, [error]);

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    setError(null);
    try {
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${appUrl}/auth/callback`,
          skipBrowserRedirect: false,
          queryParams: { access_type: "offline", prompt: "select_account" },
        },
      });
      if (err) { setError(err.message); setGoogleLoading(false); }
    } catch {
      setError("Google sign-in failed. Please try again.");
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
        const msg = err.message.toLowerCase();
        if (msg.includes("email not confirmed")) {
          setError("Email not verified. Check your inbox and click the confirmation link.");
        } else if (msg.includes("invalid login") || msg.includes("invalid credentials")) {
          setError("Incorrect email or password.");
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

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${appUrl}/reset-password`,
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
                  ← Back to Sign In
                </button>
                <h2 style={{ fontFamily: "'Anton', sans-serif", fontWeight: 400, fontSize: 22, letterSpacing: "0.5px", color: "#0A0908", marginBottom: 6 }}>FORGOT PASSWORD</h2>
                <p style={{ fontSize: 13, color: "#6E665C", marginBottom: 24 }}>We'll send a reset link to your email.</p>
                {forgotSuccess ? (
                  <div style={{ background: "#DCFCE7", border: "1px solid #86EFAC", borderRadius: 10, padding: "16px", display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <CheckCircle size={18} style={{ color: "#16A34A", flexShrink: 0, marginTop: 1 }} />
                    <p style={{ fontSize: 13, color: "#166534" }}>Reset link sent to <strong>{forgotEmail}</strong>. Check your inbox.</p>
                  </div>
                ) : (
                  <form onSubmit={handleForgotPassword} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {error && <ErrorAlert msg={error} />}
                    <div>
                      <label style={labelStyle}>EMAIL</label>
                      <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="you@example.com" required style={inputBase} />
                    </div>
                    <button type="submit" disabled={loading} style={redBtn}>
                      {loading ? "SENDING…" : "SEND RESET LINK →"}
                    </button>
                  </form>
                )}
              </motion.div>
            )}

            {/* SIGN IN */}
            {formState === "normal" && (
              <motion.div key="normal" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
                <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 10, letterSpacing: "1.5px", color: "#6E665C", marginBottom: 4 }}>WELCOME BACK</p>
                <h2 style={{ fontFamily: "'Anton', sans-serif", fontWeight: 400, fontSize: 26, letterSpacing: "0.5px", color: "#0A0908", marginBottom: 20 }}>
                  Sign in to my20FIT.
                </h2>

                {/* Tab switcher */}
                <div style={{ display: "flex", marginBottom: 24, borderRadius: 10, overflow: "hidden", border: "1px solid #E5E1D8", background: "#fff" }}>
                  <button
                    style={{ flex: 1, padding: "11px", fontFamily: "'Anton', sans-serif", fontWeight: 400, fontSize: 13, letterSpacing: "1px", cursor: "pointer", border: "none", backgroundColor: "#0A0908", color: "#fff" }}>
                    SIGN IN
                  </button>
                  <button
                    onClick={() => setLocation("/register")}
                    style={{ flex: 1, padding: "11px", fontFamily: "'Anton', sans-serif", fontWeight: 400, fontSize: 13, letterSpacing: "1px", cursor: "pointer", border: "none", backgroundColor: "transparent", color: "#6E665C" }}>
                    JOIN FREE
                  </button>
                </div>

                {error && <ErrorAlert msg={error} />}
                {successMsg && (
                  <div style={{ background: "#DCFCE7", border: "1px solid #86EFAC", borderRadius: 10, padding: "12px 16px", display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 14 }}>
                    <CheckCircle size={16} style={{ color: "#16A34A", flexShrink: 0, marginTop: 2 }} />
                    <p style={{ fontSize: 13, color: "#166534", lineHeight: 1.5 }}>{successMsg}</p>
                  </div>
                )}

                {/* Google — PRIMARY */}
                <GoogleButton onClick={handleGoogleLogin} text="Sign in with Google" loading={googleLoading} disabled={loading} />

                <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0" }}>
                  <div style={{ flex: 1, height: 1, background: "#E5E1D8" }} />
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, color: "#9C948A" }}>or</span>
                  <div style={{ flex: 1, height: 1, background: "#E5E1D8" }} />
                </div>

                <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <label style={labelStyle}>EMAIL</label>
                    <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="you@example.com" required style={inputBase} />
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                      <label style={{ ...labelStyle, marginBottom: 0 }}>PASSWORD</label>
                      <button type="button" onClick={() => { setFormState("forgot"); setForgotEmail(loginEmail); setError(null); }}
                        style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, color: "#C41101" }}>
                        Forgot password?
                      </button>
                    </div>
                    <div style={{ position: "relative" }}>
                      <input type={showLoginPw ? "text" : "password"} value={loginPassword} onChange={e => setLoginPassword(e.target.value)}
                        placeholder="Your password" required style={{ ...inputBase, paddingRight: 44 }} />
                      <button type="button" onClick={() => setShowLoginPw(s => !s)}
                        style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#6E665C" }}>
                        {showLoginPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <button type="submit" disabled={loading} style={{ ...redBtn, marginTop: 4 }}
                    onMouseEnter={e => { if (!loading) { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 20px rgba(196,17,1,0.35)"; } }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}>
                    {loading ? "SIGNING IN…" : "SIGN IN →"}
                  </button>
                </form>

                {/* Magic Link — secondary action */}
                <button
                  type="button"
                  onClick={() => setLocation(`/magic-link${loginEmail ? `?email=${encodeURIComponent(loginEmail)}` : ""}`)}
                  disabled={loading}
                  style={{
                    width: "100%", marginTop: 10, height: 44,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    background: "transparent", border: "1px solid #E5E1D8", borderRadius: 10,
                    fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900,
                    fontSize: 13, letterSpacing: "0.5px", color: "#6E665C",
                    cursor: "pointer", transition: "border-color 0.2s, color 0.2s",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#C41101"; (e.currentTarget as HTMLElement).style.color = "#C41101"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#E5E1D8"; (e.currentTarget as HTMLElement).style.color = "#6E665C"; }}
                >
                  <Wand2 size={14} />
                  Send me a magic link instead
                </button>

                <p style={{ textAlign: "center", fontSize: 13, color: "#6E665C", marginTop: 16 }}>
                  Don't have an account?{" "}
                  <button type="button" onClick={() => setLocation("/register")}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#C41101", fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: 600 }}>
                    Join free
                  </button>
                </p>
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
