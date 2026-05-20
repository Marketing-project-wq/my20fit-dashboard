interface StepIndicatorProps {
  current: number;
  steps: string[];
}

export default function StepIndicator({ current, steps }: StepIndicatorProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 0,
        marginBottom: 24,
      }}
    >
      {steps.map((label, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === current;
        const isDone = stepNum < current;
        const isInactive = stepNum > current;

        return (
          <div
            key={label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flex: i < steps.length - 1 ? 1 : undefined,
            }}
          >
            {/* Step circle */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 700,
                  background: isActive ? "#C41101" : isDone ? "#22C55E" : "#E5E1D8",
                  color: isActive || isDone ? "#fff" : "#9C948A",
                  transition: "all 0.2s",
                }}
              >
                {isDone ? "✓" : stepNum}
              </div>
              <span
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: isActive ? 900 : 400,
                  fontSize: 11,
                  letterSpacing: isActive ? "0.5px" : "0.3px",
                  color: isActive ? "#0A0908" : isInactive ? "#9C948A" : "#22C55E",
                  cursor: isInactive ? "default" : undefined,
                }}
              >
                {label}
              </span>
            </div>

            {/* Connector */}
            {i < steps.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: isDone ? "#22C55E" : "#E5E1D8",
                  marginLeft: 8,
                  marginRight: 8,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
