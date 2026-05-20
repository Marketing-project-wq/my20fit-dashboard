interface PasswordStrengthProps {
  password: string;
}

function getStrength(pw: string): { level: 0 | 1 | 2 | 3; label: string; color: string } {
  if (!pw || pw.length < 8) return { level: 0, label: "", color: "#E5E1D8" };
  const hasLetter = /[a-zA-Z]/.test(pw);
  const hasNumber = /[0-9]/.test(pw);
  const hasSymbol = /[^a-zA-Z0-9]/.test(pw);
  const isLong = pw.length >= 12;

  if (isLong && hasLetter && hasNumber && hasSymbol) {
    return { level: 3, label: "Strong", color: "#22C55E" };
  }
  if (pw.length >= 8 && hasLetter && (hasNumber || hasSymbol)) {
    return { level: 2, label: "Medium", color: "#D97706" };
  }
  return { level: 1, label: "Weak", color: "#C41101" };
}

export default function PasswordStrength({ password }: PasswordStrengthProps) {
  const { level, label, color } = getStrength(password);
  if (!password) return null;

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
        {[1, 2, 3].map((seg) => (
          <div
            key={seg}
            style={{
              flex: 1,
              height: 3,
              borderRadius: 99,
              background: level >= seg ? color : "#E5E1D8",
              transition: "background 0.2s",
            }}
          />
        ))}
      </div>
      {label && (
        <span
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: "1px",
            color,
          }}
        >
          {label.toUpperCase()}
        </span>
      )}
    </div>
  );
}

export { getStrength };
