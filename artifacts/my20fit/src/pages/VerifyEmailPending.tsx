import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { Mail, RefreshCw } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";

export default function VerifyEmailPending() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const email = params.get("email") ?? "";

  const [countdown, setCountdown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendDone, setResendDone] = useState(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  async function handleResend() {
    setResendLoading(true);
    try {
      await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setResendDone(true);
      setCountdown(60);
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <AuthShell>
      <div style={{ textAlign: "center", padding: "20px 0" }}>
        {/* Icon */}
        <div
          style={{
            width: 72,
            height: 72,
            background: "rgba(196,17,1,0.08)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}
        >
          <Mail size={32} style={{ color: "#C41101" }} />
        </div>

        <h1
          style={{
            fontFamily: "'Anton', sans-serif",
            fontSize: 26,
            color: "#0A0908",
            margin: "0 0 12px",
          }}
        >
          Check your inbox
        </h1>
        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 400,
            fontSize: 15,
            color: "#6E665C",
            margin: "0 0 6px",
            lineHeight: 1.6,
          }}
        >
          We sent a verification link to
        </p>
        <p
          style={{
            fontFamily: "'Anton', sans-serif",
            fontSize: 16,
            color: "#0A0908",
            margin: "0 0 24px",
            wordBreak: "break-all",
          }}
        >
          {email || "your email"}
        </p>
        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 400,
            fontSize: 13,
            color: "#9C948A",
            margin: "0 0 24px",
            lineHeight: 1.5,
          }}
        >
          Click the link in the email to activate your account.
          <br />
          Didn't receive it? Check your spam folder.
        </p>

        {resendDone && (
          <div
            style={{
              background: "#DCFCE7",
              border: "1px solid #86EFAC",
              borderRadius: 10,
              padding: "12px 16px",
              marginBottom: 16,
            }}
          >
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 13,
                color: "#166534",
                margin: 0,
              }}
            >
              Verification link resent ✓
            </p>
          </div>
        )}

        <button
          onClick={handleResend}
          disabled={resendLoading || countdown > 0}
          style={{
            width: "100%",
            height: 48,
            background: countdown > 0 ? "#F5F1E8" : "#FFFFFF",
            border: `1.5px solid ${countdown > 0 ? "#E5E1D8" : "#0A0908"}`,
            borderRadius: 12,
            fontFamily: "Inter, sans-serif",
            fontWeight: 900,
            fontSize: 14,
            letterSpacing: "1px",
            color: countdown > 0 ? "#9C948A" : "#0A0908",
            cursor: countdown > 0 || resendLoading ? "default" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            transition: "all 0.2s",
          }}
        >
          <RefreshCw size={15} />
          {resendLoading
            ? "Sending…"
            : countdown > 0
            ? `Resend again in ${countdown}s`
            : "Resend verification email"}
        </button>

        <button
          onClick={() => setLocation("/register")}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "Inter, sans-serif",
            fontSize: 13,
            color: "#6E665C",
            marginTop: 16,
          }}
        >
          Wrong email? Register again →
        </button>
      </div>
    </AuthShell>
  );
}
