interface OnboardingStepGoalsProps {
  activityLevel: string;
  gymExperience: string;
  dailySchedule: string;
  onActivityChange: (v: string) => void;
  onExperienceChange: (v: string) => void;
  onScheduleChange: (v: string) => void;
}

const labelStyle: React.CSSProperties = {
  fontFamily: "'Barlow Condensed', sans-serif",
  fontWeight: 900,
  fontSize: 11,
  letterSpacing: "1.5px",
  color: "#6E665C",
  display: "block",
  marginBottom: 8,
};

function RadioGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; title: string; sub?: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 14px",
              background: value === opt.value ? "rgba(196,17,1,0.05)" : "#FFFFFF",
              border: value === opt.value ? "1.5px solid #C41101" : "1.5px solid #E5E1D8",
              borderRadius: 10,
              cursor: "pointer",
              transition: "all 0.15s",
              textAlign: "left",
            }}
          >
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                border: `2px solid ${value === opt.value ? "#C41101" : "#D1C9BF"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {value === opt.value && (
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#C41101",
                  }}
                />
              )}
            </div>
            <div>
              <div
                style={{
                  fontFamily: "'Anton', sans-serif",
                  fontWeight: 400,
                  fontSize: 13,
                  letterSpacing: "0.3px",
                  color: value === opt.value ? "#C41101" : "#0A0908",
                }}
              >
                {opt.title}
              </div>
              {opt.sub && (
                <div
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 400,
                    fontStyle: "italic",
                    fontSize: 12,
                    color: "#6E665C",
                    marginTop: 1,
                  }}
                >
                  {opt.sub}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function OnboardingStepGoals({
  activityLevel,
  gymExperience,
  dailySchedule,
  onActivityChange,
  onExperienceChange,
  onScheduleChange,
}: OnboardingStepGoalsProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <RadioGroup
        label="ACTIVITY LEVEL"
        value={activityLevel}
        onChange={onActivityChange}
        options={[
          { value: "sedentary", title: "Sedentary", sub: "Little to no exercise" },
          { value: "light", title: "Light", sub: "1–2 workouts/week" },
          { value: "moderate", title: "Moderate", sub: "3–5 workouts/week" },
          { value: "active", title: "Active", sub: "6–7 workouts/week" },
          { value: "very_active", title: "Very Active", sub: "Twice a day or physical job" },
        ]}
      />
      <RadioGroup
        label="GYM EXPERIENCE"
        value={gymExperience}
        onChange={onExperienceChange}
        options={[
          { value: "beginner", title: "Beginner", sub: "< 1 year" },
          { value: "intermediate", title: "Intermediate", sub: "1–3 years" },
          { value: "advanced", title: "Advanced", sub: "3+ years" },
        ]}
      />
      <RadioGroup
        label="PREFERRED TRAINING TIME"
        value={dailySchedule}
        onChange={onScheduleChange}
        options={[
          { value: "morning", title: "Morning", sub: "Before 10 AM" },
          { value: "afternoon", title: "Afternoon", sub: "10 AM – 3 PM" },
          { value: "evening", title: "Evening", sub: "3 PM – 10 PM" },
          { value: "flexible", title: "Flexible", sub: "Whenever I can" },
        ]}
      />
    </div>
  );
}
