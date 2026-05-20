import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import AuthShell from "@/components/auth/AuthShell";

type State = "loading" | "success" | "error";

export default function MagicLinkConsume() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const token = params.get("token") ?? "";
  const [state, setState] = useState<State>("loading");

  useEffect(() => {
    if (!token) { setState("error"); return; }

    fetch(`/api/auth/magic-link/verify?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then(async (data) => {
        if (!data.ok) { setState("error"); return; }

        if (data.access_token && data.refresh_token) {
          // Direct session injection
          const { error: sessErr } = await supabase.auth.setSession({
            access_token: data.access_token,
            refresh_token: data.refresh_token,
          });
          if (sessErr) { setState("error"); return; }
          setState("success");
          setTimeout(() => setLocation("/"), 1200);
        } else if (data.action_link) {
          // Fallback: redirect to Supabase action link
          window.location.href = data.action_link;
        } else {
          setState("error");
        }
      })
      .catch(() => setState("error"));
  }, [token, setLocation]);

  return (
    <AuthShell>
      {state === "loading" && (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Loader2
            size={40}
            style={{ color: "#C41101", animation: "spin 1s linear infinite", margin: "0 auto 16px" }}
          />
          <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontStyle: "italic", fontSize: 15, color: "#6E665C" }}>
            Signing you in…
          </p>
        </div>
      )}

      {state === "success" && (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <CheckCircle size={56} style={{ color: "#22C55E", margin: "0 auto 16px" }} />
          <h1 style={{ fontFamily: "'Anton', sans-serif", fontSize: 24, color: "#0A0908", margin: "0 0 8px" }}>
            Signed in!
          </h1>
          <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontStyle: "italic", fontSize: 14, color: "#6E665C" }}>
            Redirecting to dashboard…
          </p>
        </div>
      )}

      {state === "error" && (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <XCircle size={56} style={{ color: "#C41101", margin: "0 auto 16px" }} />
          <h1 style={{ fontFamily: "'Anton', sans-serif", fontSize: 24, color: "#0A0908", margin: "0 0 10px" }}>
            Link invalid
          </h1>
          <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontStyle: "italic", fontSize: 14, color: "#6E665C", margin: "0 0 24px" }}>
            This link has expired or already been used. Request a new one.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              onClick={() => setLocation("/magic-link")}
              style={{
                width: "100%", height: 48, background: "#C41101", color: "#FFFFFF",
                border: "none", borderRadius: 12, fontFamily: "'Anton', sans-serif",
                fontSize: 14, letterSpacing: "1px", cursor: "pointer",
              }}
            >
              Request a new magic link →
            </button>
            <button
              onClick={() => setLocation("/login")}
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, color: "#6E665C",
              }}
            >
              ← Back to sign in
            </button>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AuthShell>
  );
}
