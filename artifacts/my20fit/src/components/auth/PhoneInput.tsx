interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function PhoneInput({ value, onChange, disabled }: PhoneInputProps) {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      {/* +62 prefix with flag */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "#F5F1E8",
          border: "1px solid #E5E1D8",
          borderRadius: 12,
          padding: "12px 14px",
          flexShrink: 0,
          fontFamily: "Inter, sans-serif",
          fontSize: 15,
          color: "#0A0908",
          letterSpacing: "0.5px",
        }}
      >
        <span style={{ fontSize: 16 }}>🇮🇩</span>
        <span>+62</span>
      </div>
      <input
        type="tel"
        inputMode="tel"
        value={value}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^0-9\-]/g, "");
          onChange(raw);
        }}
        placeholder="812 3456 7890"
        disabled={disabled}
        autoComplete="tel"
        style={{
          flex: 1,
          height: 48,
          background: "#FFFFFF",
          border: "1px solid #E5E1D8",
          borderRadius: 12,
          padding: "12px 14px",
          fontFamily: "Inter, sans-serif",
          fontSize: 15,
          color: "#0A0908",
          outline: "none",
          transition: "border-color 0.2s, box-shadow 0.2s",
          boxSizing: "border-box" as const,
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
  );
}
