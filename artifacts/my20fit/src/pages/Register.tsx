import { useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import TabSwitcher from "@/components/auth/TabSwitcher";
import StepIndicator from "@/components/auth/StepIndicator";
import PasswordStrength, { getStrength } from "@/components/auth/PasswordStrength";
import PhoneInput from "@/components/auth/PhoneInput";
import GoogleButton from "@/components/auth/GoogleButton";

const inputStyle: React.CSSProperties = {
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
  transition: "border-color 0.2s, box-shadow 0.2s",
};

const labelStyle: React.CSSProperties = {
  fontFamily: "'Barlow Condensed', sans-serif",
  fontWeight: 900,
  fontSize: 11,
  letterSpacing: "1.5px",
  color: "#6E665C",
  display: "block",
  marginBottom: 6,
};

function focusInput(e: React.FocusEvent<HTMLInputElement>) {
  e.target.style.borderColor = "#C41101";
  e.target.style.boxShadow = "0 0 0 4px rgba(196,17,1,0.08)";
}
function blurInput(e: React.FocusEvent<HTMLInputElement>) {
  e.target.style.borderColor = "#E5E1D8";
  e.target.style.boxShadow = "none";
}

export default function Register() {
  const [, setLocation] = useLocation();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;

  const { level: pwStrength } = getStrength(password);
  const isFormValid =
    fullName.trim().length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    password.length >= 8 &&
    pwStrength >= 1;

  async function handleGoogleSignup() {
    setGoogleLoading(true);
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${appUrl}/auth/callback`,
        queryParams: { access_type: "offline", prompt: "select_account" },
      },
    });
    if (err) { setError(err.message); setGoogleLoading(false); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isFormValid) return;
    setLoading(true);
    setError(null);
    setEmailError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: fullName.trim(), email, phone, password }),
      });
      const data = await res.json();

      if (!data.ok) {
        if (data.code === "EMAIL_TAKEN") {
          setEmailError("This email is already registered.");
          return;
        }
        setError(data.message || "Registration failed. Please try again.");
        return;
      }

      setLocation(`/verify-pending?email=${encodeURIComponent(email)}`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <p
        style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 900,
          fontSize: 10,
          letterSpacing: "2px",
          color: "#6E665C",
          margin: "0 0 4px",
        }}
      >
        CREATE YOUR ACCOUNT
      </p>
      <h1
        style={{
          fontFamily: "'Anton', sans-serif",
          fontSize: "clamp(24px, 6vw, 32px)",
          color: "#0A0908",
          margin: "0 0 20px",
          letterSpacing: "0.5px",
        }}
      >
        Join my20FIT.
      </h1>

      <TabSwitcher active="register" />
      <StepIndicator current={1} steps={["Your Details", "Face Registration"]} />

      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            borderRadius: 10,
            padding: "12px 14px",
            marginBottom: 16,
          }}
        >
          <AlertCircle size={16} style={{ color: "#C41101", flexShrink: 0, marginTop: 1 }} />
          <p
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 13,
              color: "#7F1D1D",
              margin: 0,
            }}
          >
            {error}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Full Name */}
        <div>
          <label style={labelStyle}>
            FULL NAME <span style={{ color: "#C41101" }}>*</span>
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your full name"
            required
            autoComplete="name"
            style={inputStyle}
            onFocus={focusInput}
            onBlur={blurInput}
          />
        </div>

        {/* Email */}
        <div>
          <label style={labelStyle}>
            EMAIL <span style={{ color: "#C41101" }}>*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setEmailError(null); }}
            placeholder="you@example.com"
            required
            autoComplete="email"
            inputMode="email"
            style={{
              ...inputStyle,
              borderColor: emailError ? "#C41101" : "#E5E1D8",
            }}
            onFocus={focusInput}
            onBlur={blurInput}
          />
          {emailError && (
            <p
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 12,
                color: "#C41101",
                margin: "4px 0 0",
              }}
            >
              {emailError}{" "}
              <button
                type="button"
                onClick={() => setLocation(`/login?email=${encodeURIComponent(email)}`)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#C41101",
                  cursor: "pointer",
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 12,
                  fontWeight: 900,
                  textDecoration: "underline",
                  padding: 0,
                }}
              >
                Sign In
              </button>
            </p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label style={labelStyle}>PHONE / WHATSAPP</label>
          <PhoneInput value={phone} onChange={setPhone} disabled={loading} />
        </div>

        {/* Password */}
        <div>
          <label style={labelStyle}>
            PASSWORD <span style={{ color: "#C41101" }}>*</span>
          </label>
          <div style={{ position: "relative" }}>
            <input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
              autoComplete="new-password"
              style={{ ...inputStyle, paddingRight: 44 }}
              onFocus={focusInput}
              onBlur={blurInput}
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#6E665C",
                padding: 0,
              }}
              tabIndex={-1}
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <PasswordStrength password={password} />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!isFormValid || loading}
          style={{
            width: "100%",
            height: 48,
            background: isFormValid && !loading ? "#0A0908" : "#E5E1D8",
            color: isFormValid && !loading ? "#FFFFFF" : "#9C948A",
            border: "none",
            borderRadius: 12,
            fontFamily: "'Anton', sans-serif",
            fontSize: 15,
            letterSpacing: "1px",
            cursor: isFormValid && !loading ? "pointer" : "not-allowed",
            transition: "all 0.2s",
            marginTop: 4,
          }}
        >
          {loading ? "Creating account…" : "Continue →"}
        </button>
      </form>

      {/* Divider */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          margin: "20px 0",
        }}
      >
        <div style={{ flex: 1, height: 1, background: "#E5E1D8" }} />
        <span
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 12,
            color: "#9C948A",
          }}
        >
          or
        </span>
        <div style={{ flex: 1, height: 1, background: "#E5E1D8" }} />
      </div>

      <GoogleButton
        text="Sign up with Google"
        onClick={handleGoogleSignup}
        loading={googleLoading}
        disabled={loading}
      />

      <div style={{ textAlign: "center", marginTop: 20 }}>
        <button
          type="button"
          onClick={() => setLocation("/login")}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 13,
            color: "#6E665C",
          }}
        >
          ← Back to Sign In
        </button>
      </div>
    </AuthShell>
  );
}
