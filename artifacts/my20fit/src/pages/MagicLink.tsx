import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { Wand2, AlertCircle } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";

export default function MagicLink() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unverified, setUnverified] = useState(false);
  const [resendDone, setResendDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setUnverified(false);

    try {
      const res = await fetch("/api/auth/magic-link/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!data.ok) {
        if (data.code === "EMAIL_NOT_VERIFIED") {
          setUnverified(true);
          return;
        }
        if (data.code === "RATE_LIMITED") {
          setError("Please wait 60 seconds before requesting another link.");
          return;
        }
        setError(data.message || "Something went wrong. Please try again.");
        return;
      }

      setLocation(`/magic-link/sent?email=${encodeURIComponent(email)}`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResendVerification() {
    await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setResendDone(true);
  }

  return (
    <AuthShell>
      <div
        style={{
          width: 48,
          height: 48,
          background: "rgba(196,17,1,0.08)",
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
        }}
      >
        <Wand2 size={24} style={{ color: "#C41101" }} />
      </div>

      <h1
        style={{
          fontFamily: "'Anton', sans-serif",
          fontSize: "clamp(22px, 5vw, 28px)",
          color: "#0A0908",
          margin: "0 0 8px",
        }}
      >
        Sign in without a password
      </h1>
      <p
        style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 400,
          fontStyle: "italic",
          fontSize: 14,
          color: "#6E665C",
          margin: "0 0 24px",
          lineHeight: 1.5,
        }}
      >
        Enter your email and we'll send a one-click login link valid for 15 minutes.
      </p>

      {error && (
        <div
          style={{
            display: "flex",
            gap: 10,
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            borderRadius: 10,
            padding: "12px 14px",
            marginBottom: 16,
          }}
        >
          <AlertCircle size={16} style={{ color: "#C41101", flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, color: "#7F1D1D", margin: 0 }}>
            {error}
          </p>
        </div>
      )}

      {unverified && (
        <div
          style={{
            background: "#FEF3C7",
            border: "1px solid #FCD34D",
            borderRadius: 10,
            padding: "12px 14px",
            marginBottom: 16,
          }}
        >
          <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, color: "#92400E", margin: "0 0 8px" }}>
            Your email isn't verified yet. Verify it first to use magic link login.
          </p>
          {!resendDone ? (
            <button
              onClick={handleResendVerification}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 900,
                fontSize: 13,
                color: "#92400E",
                textDecoration: "underline",
                padding: 0,
              }}
            >
              Resend verification email →
            </button>
          ) : (
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, color: "#166534", margin: 0 }}>
              Verification email sent ✓
            </p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 900,
              fontSize: 11,
              letterSpacing: "1.5px",
              color: "#6E665C",
              display: "block",
              marginBottom: 6,
            }}
          >
            EMAIL
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            inputMode="email"
            autoComplete="email"
            style={{
              width: "100%",
              height: 48,
              background: "#FFFFFF",
              border: "1px solid #E5E1D8",
              borderRadius: 12,
              padding: "12px 14px",
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 15,
              color: "#0A0908",
              outline: "none",
              boxSizing: "border-box",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#C41101";
              e.target.style.boxShadow = "0 0 0 4px rgba(196,17,1,0.08)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#E5E1D8";
              e.target.style.boxShadow = "none";
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !email}
          style={{
            width: "100%",
            height: 48,
            background: email && !loading ? "#C41101" : "#E5E1D8",
            color: email && !loading ? "#FFFFFF" : "#9C948A",
            border: "none",
            borderRadius: 12,
            fontFamily: "'Anton', sans-serif",
            fontSize: 15,
            letterSpacing: "1px",
            cursor: email && !loading ? "pointer" : "not-allowed",
            transition: "all 0.2s",
          }}
        >
          {loading ? "Sending link…" : "Send magic link →"}
        </button>
      </form>

      <div style={{ textAlign: "center", marginTop: 20 }}>
        <button
          type="button"
          onClick={() => setLocation(`/login${email ? `?email=${encodeURIComponent(email)}` : ""}`)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 13,
            color: "#6E665C",
          }}
        >
          ← Back to sign in
        </button>
      </div>
    </AuthShell>
  );
}
