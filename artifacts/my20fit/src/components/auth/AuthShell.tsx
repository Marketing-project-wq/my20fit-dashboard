import { useLocation } from "wouter";

interface AuthShellProps {
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: number;
}

export default function AuthShell({ children, footer, maxWidth = 480 }: AuthShellProps) {
  const [, setLocation] = useLocation();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at 20% 10%, rgba(196,17,1,0.06) 0%, transparent 40%), #F5F1E8",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth,
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <button
            onClick={() => setLocation("/")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              display: "inline-block",
            }}
            aria-label="Go to homepage"
          >
            <img
              src="/logo-20fit.jpg"
              alt="20fit.id"
              style={{
                height: 56,
                width: "auto",
                display: "block",
                margin: "0 auto",
              }}
            />
          </button>
        </div>

        {/* Card */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 16,
            padding: "clamp(28px, 5vw, 40px) clamp(20px, 5vw, 32px)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.05)",
            border: "1px solid #E5E1D8",
          }}
        >
          {children}
        </div>

        {/* Footer */}
        <div style={{ marginTop: 20, textAlign: "center" }}>
          {footer ?? (
            <p
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 12,
                color: "#6E665C",
                lineHeight: 1.6,
              }}
            >
              By continuing, you agree to the{" "}
              <a
                href="https://20fit.id/legal"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#C41101", textDecoration: "underline" }}
              >
                Terms &amp; Conditions and Privacy Policy
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
