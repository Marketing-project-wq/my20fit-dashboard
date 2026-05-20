interface OnboardingStepPhysicalProps {
  height: string;
  weight: string;
  onHeightChange: (v: string) => void;
  onWeightChange: (v: string) => void;
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

export default function OnboardingStepPhysical({
  height,
  weight,
  onHeightChange,
  onWeightChange,
}: OnboardingStepPhysicalProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <p
        style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 400,
          fontStyle: "italic",
          fontSize: 14,
          color: "#6E665C",
          margin: 0,
          lineHeight: 1.5,
        }}
      >
        Used to calculate your accurate calorie and hydration targets.
      </p>

      {/* Height */}
      <div>
        <label style={labelStyle}>HEIGHT (CM)</label>
        <div style={{ position: "relative" }}>
          <input
            type="number"
            inputMode="numeric"
            min={100}
            max={250}
            value={height}
            onChange={(e) => onHeightChange(e.target.value)}
            placeholder="e.g. 175"
            style={{ ...inputStyle, paddingRight: 48 }}
            onFocus={focusInput}
            onBlur={blurInput}
          />
          <span
            style={{
              position: "absolute",
              right: 14,
              top: "50%",
              transform: "translateY(-50%)",
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 13,
              color: "#9C948A",
            }}
          >
            cm
          </span>
        </div>
      </div>

      {/* Weight */}
      <div>
        <label style={labelStyle}>BODY WEIGHT (KG)</label>
        <div style={{ position: "relative" }}>
          <input
            type="number"
            inputMode="numeric"
            min={30}
            max={300}
            value={weight}
            onChange={(e) => onWeightChange(e.target.value)}
            placeholder="e.g. 72"
            style={{ ...inputStyle, paddingRight: 48 }}
            onFocus={focusInput}
            onBlur={blurInput}
          />
          <span
            style={{
              position: "absolute",
              right: 14,
              top: "50%",
              transform: "translateY(-50%)",
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 13,
              color: "#9C948A",
            }}
          >
            kg
          </span>
        </div>
      </div>

      {/* BMI preview */}
      {height && weight && Number(height) > 0 && Number(weight) > 0 && (
        <div
          style={{
            background: "#F5F1E8",
            borderRadius: 10,
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 900,
              fontSize: 11,
              letterSpacing: "1.5px",
              color: "#6E665C",
            }}
          >
            ESTIMATED BMI
          </span>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 16,
              fontWeight: 700,
              color: "#0A0908",
            }}
          >
            {(Number(weight) / Math.pow(Number(height) / 100, 2)).toFixed(1)}
          </span>
        </div>
      )}
    </div>
  );
}
