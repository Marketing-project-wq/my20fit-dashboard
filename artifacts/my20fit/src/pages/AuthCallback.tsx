import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleCallback() {
      const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr) {
        setError(sessionErr.message);
        setTimeout(() => setLocation("/login"), 3000);
        return;
      }
      if (session) {
        setLocation("/");
        return;
      }
      const code = new URLSearchParams(window.location.search).get("code");
      if (code) {
        const { error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeErr) {
          setError(exchangeErr.message);
          setTimeout(() => setLocation("/login"), 3000);
        } else {
          setLocation("/");
        }
      } else {
        setLocation("/login");
      }
    }
    handleCallback();
  }, [setLocation]);

  if (error) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", background: "#F4F2EE", fontFamily: "'Barlow Condensed', sans-serif" }}>
        <div style={{ color: "#C41101", fontSize: 16 }}>Login gagal: {error}</div>
        <div style={{ color: "#6E665C", fontSize: 13, marginTop: 8 }}>Mengalihkan ke halaman login…</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", background: "#F4F2EE", gap: 16 }}>
      <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid #C41101", borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, letterSpacing: "2px", color: "#0A0908" }}>
        MENGHUBUNGKAN AKUN…
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
