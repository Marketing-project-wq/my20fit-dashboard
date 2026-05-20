import { useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "#fff", border: "1px solid #E5E1D8",
    borderRadius: 10, padding: "12px 14px", fontFamily: "'Barlow Condensed', sans-serif",
    fontSize: 15, color: "#0A0908", outline: "none", transition: "border-color 0.2s, box-shadow 0.2s",
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError("Password tidak sama."); return; }
    if (password.length < 8) { setError("Password minimal 8 karakter."); return; }
    setLoading(true); setError(null);
    try {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) { setError(err.message); return; }
      setSuccess(true);
      setTimeout(() => setLocation("/login"), 2500);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F4F2EE", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <img
          src="/logo-20fit.jpg"
          alt="20fit.id"
          style={{ height: 48, width: "auto", display: "block", marginBottom: 4 }}
        />
        <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, color: "#6E665C", marginBottom: 28 }}>
          Buat password baru untuk akunmu.
        </p>

        {success ? (
          <div style={{ background: "#DCFCE7", border: "1px solid #86EFAC", borderRadius: 10, padding: "16px 20px", display: "flex", gap: 10, alignItems: "center" }}>
            <CheckCircle size={18} style={{ color: "#16A34A", flexShrink: 0 }} />
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, color: "#166534" }}>
              Password berhasil diubah. Mengalihkan ke halaman masuk…
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {error && (
              <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "12px 16px", display: "flex", gap: 10, alignItems: "center" }}>
                <AlertCircle size={16} style={{ color: "#C41101", flexShrink: 0 }} />
                <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, color: "#7F1D1D" }}>{error}</p>
              </div>
            )}
            <div style={{ position: "relative" }}>
              <label style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, letterSpacing: "2px", color: "#6E665C", display: "block", marginBottom: 4 }}>PASSWORD BARU</label>
              <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 karakter" required style={{ ...inputStyle, paddingRight: 44 }} />
              <button type="button" onClick={() => setShowPw(s => !s)} style={{ position: "absolute", right: 12, bottom: 12, background: "none", color: "#6E665C", cursor: "pointer" }}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div>
              <label style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, letterSpacing: "2px", color: "#6E665C", display: "block", marginBottom: 4 }}>KONFIRMASI PASSWORD</label>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Ulangi password" required style={inputStyle} />
            </div>
            <button type="submit" disabled={loading} style={{
              background: "#C41101", color: "#fff", border: "none", borderRadius: 10, padding: "14px",
              fontFamily: "'Barlow Condensed', sans-serif", fontSize: 15, letterSpacing: "2.5px", cursor: "pointer",
              transition: "transform 0.2s, box-shadow 0.2s", marginTop: 4,
              opacity: loading ? 0.7 : 1,
            }}>
              {loading ? "MENYIMPAN…" : "SIMPAN PASSWORD →"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
