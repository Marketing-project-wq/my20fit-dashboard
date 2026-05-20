interface OnboardingStepBasicProps {
  age: string;
  gender: string;
  onAgeChange: (v: string) => void;
  onGenderChange: (v: string) => void;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 48,
  background: "#FFFFFF",
  border: "1px solid #E5E1D8",
  borderRadius: 12,
  padding: "12px 14px",
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 16,
  color: "#0A0908",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.2s, box-shadow 0.2s",
};

const labelStyle: React.CSSProperties = {
  fontFamily: "Inter, sans-serif",
  fontWeight: 900,
  fontSize: 11,
  letterSpacing: "1.5px",
  color: "#6E665C",
  display: "block",
  marginBottom: 6,
};

export default function OnboardingStepBasic({
  age,
  gender,
  onAgeChange,
  onGenderChange,
}: OnboardingStepBasicProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Age */}
      <div>
        <label style={labelStyle}>AGE</label>
        <input
          type="number"
          inputMode="numeric"
          min={13}
          max={120}
          value={age}
          onChange={(e) => onAgeChange(e.target.value)}
          placeholder="e.g. 28"
          style={inputStyle}
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

      {/* Gender */}
      <div>
        <label style={labelStyle}>GENDER</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {(["male", "female"] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => onGenderChange(g)}
              style={{
                height: 56,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                background: gender === g ? "rgba(196,17,1,0.06)" : "#FFFFFF",
                border: gender === g ? "2px solid #C41101" : "1.5px solid #E5E1D8",
                borderRadius: 12,
                cursor: "pointer",
                transition: "all 0.15s",
                fontFamily: "'Anton', sans-serif",
                fontSize: 15,
                letterSpacing: "0.5px",
                color: gender === g ? "#C41101" : "#0A0908",
              }}
            >
              <span style={{ fontSize: 20 }}>{g === "male" ? "♂" : "♀"}</span>
              {g === "male" ? "Male" : "Female"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
