import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { CheckCircle, XCircle, Loader2, Mail } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";

type State = "loading" | "success" | "error";

export default function VerifyEmail() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const token = params.get("token") ?? "";
  const [state, setState] = useState<State>("loading");
  const [email, setEmail] = useState("");
  const [resendEmail, setResendEmail] = useState("");
  const [resendSent, setResendSent] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    if (!token) { setState("error"); return; }

    fetch(`/api/auth/verify?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setEmail(data.email ?? "");
          setState("success");
        } else {
          setState("error");
        }
      })
      .catch(() => setState("error"));
  }, [token]);

  async function handleResend() {
    if (!resendEmail) return;
    setResendLoading(true);
    try {
      await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resendEmail }),
      });
      setResendSent(true);
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <AuthShell>
      {state === "loading" && (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Loader2
            size={40}
            style={{ color: "#C41101", animation: "spin 1s linear infinite", margin: "0 auto 16px" }}
          />
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 400,
              fontSize: 15,
              color: "#6E665C",
            }}
          >
            Verifying your email…
          </p>
        </div>
      )}

      {state === "success" && (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <CheckCircle size={56} style={{ color: "#22C55E", margin: "0 auto 16px" }} />
          <h1
            style={{
              fontFamily: "'Anton', sans-serif",
              fontSize: 26,
              color: "#0A0908",
              margin: "0 0 10px",
            }}
          >
            Email verified ✓
          </h1>
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 400,
              fontSize: 15,
              color: "#6E665C",
              margin: "0 0 28px",
            }}
          >
            Your account is active. You can now sign in.
          </p>
          <button
            onClick={() =>
              setLocation(`/login${email ? `?email=${encodeURIComponent(email)}` : ""}`)
            }
            style={{
              width: "100%",
              height: 48,
              background: "#C41101",
              color: "#FFFFFF",
              border: "none",
              borderRadius: 12,
              fontFamily: "'Anton', sans-serif",
              fontSize: 15,
              letterSpacing: "1px",
              cursor: "pointer",
            }}
          >
            Continue to Sign In →
          </button>
        </div>
      )}

      {state === "error" && (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <XCircle size={56} style={{ color: "#C41101", margin: "0 auto 16px" }} />
          <h1
            style={{
              fontFamily: "'Anton', sans-serif",
              fontSize: 26,
              color: "#0A0908",
              margin: "0 0 10px",
            }}
          >
            Link invalid
          </h1>
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 400,
              fontSize: 15,
              color: "#6E665C",
              margin: "0 0 24px",
            }}
          >
            This verification link has expired or already been used.
          </p>

          {!resendSent ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input
                type="email"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                placeholder="Enter your email to resend"
                inputMode="email"
                style={{
                  width: "100%",
                  height: 48,
                  border: "1px solid #E5E1D8",
                  borderRadius: 12,
                  padding: "12px 14px",
                  fontFamily: "Inter, sans-serif",
                  fontSize: 15,
                  color: "#0A0908",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <button
                onClick={handleResend}
                disabled={!resendEmail || resendLoading}
                style={{
                  width: "100%",
                  height: 48,
                  background: resendEmail ? "#C41101" : "#E5E1D8",
                  color: resendEmail ? "#FFFFFF" : "#9C948A",
                  border: "none",
                  borderRadius: 12,
                  fontFamily: "'Anton', sans-serif",
                  fontSize: 14,
                  letterSpacing: "1px",
                  cursor: resendEmail ? "pointer" : "not-allowed",
                }}
              >
                {resendLoading ? "Sending…" : "Resend verification →"}
              </button>
            </div>
          ) : (
            <div
              style={{
                background: "#DCFCE7",
                border: "1px solid #86EFAC",
                borderRadius: 10,
                padding: "14px 16px",
                display: "flex",
                gap: 10,
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Mail size={16} style={{ color: "#16A34A", flexShrink: 0 }} />
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#166534", margin: 0 }}>
                New verification link sent — check your inbox.
              </p>
            </div>
          )}

          <button
            onClick={() => setLocation("/login")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "Inter, sans-serif",
              fontSize: 13,
              color: "#6E665C",
              marginTop: 12,
            }}
          >
            ← Back to Sign In
          </button>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AuthShell>
  );
}
