import { useState } from "react";
import MuscleFatigueBottomSheet from "./MuscleFatigueBottomSheet";
import {
  FatigueValues,
  computeOverallFatigue,
  getFatigueColor,
  getFatigueLabel,
  MUSCLE_AREAS,
} from "../../utils/fatigueHelpers";

const todayKey = () => new Date().toISOString().split("T")[0];

type StoredData = FatigueValues & { notes?: string };

function loadToday(): StoredData | null {
  try {
    const s = localStorage.getItem(`my20fit_fatigue_${todayKey()}`);
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

export default function MuscleFatigueWidget() {
  const [todayData, setTodayData] = useState<StoredData | null>(loadToday);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [hover, setHover] = useState(false);

  const handleSaved = (data: StoredData) => {
    localStorage.setItem(`my20fit_fatigue_${todayKey()}`, JSON.stringify(data));
    setTodayData(data);
    setSheetOpen(false);
  };

  const hasData = todayData !== null;
  const overall = hasData ? computeOverallFatigue(todayData!) : 0;
  const dotColor = getFatigueColor(overall);

  return (
    <>
      <div
        onClick={() => setSheetOpen(true)}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        role="button"
        aria-label="Buka input Muscle Fatigue"
        data-testid="checkin-muscle-fatigue"
        style={{
          background: "linear-gradient(135deg, #1a0a14, #2d0a0a)",
          borderRadius: 14, padding: 16,
          position: "relative", overflow: "hidden",
          cursor: "pointer",
          boxShadow: hover ? "0 6px 20px rgba(0,0,0,0.18)" : "0 2px 8px rgba(0,0,0,0.1)",
          transition: "all .2s",
          transform: hover ? "translateY(-2px)" : "none",
        }}
      >
        {/* Glow */}
        <div
          style={{
            position: "absolute", top: -20, right: -20,
            width: 80, height: 80, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,68,68,.25), transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Status dot */}
        <div
          style={{
            position: "absolute", bottom: 10, right: 10,
            width: 5, height: 5, borderRadius: "50%",
            background: hasData ? dotColor : "#ff4444",
            boxShadow: `0 0 8px ${hasData ? dotColor : "#ff4444"}80`,
          }}
        />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
          <span style={{ fontSize: 18 }}>🏋️</span>
          <span
            style={{
              fontFamily: "'Anton', sans-serif",
              fontWeight: 400, fontSize: 13,
              letterSpacing: 0.5, color: "#fff",
            }}
          >
            MUSCLE FATIGUE
          </span>
        </div>

        {!hasData ? (
          <div
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 400, fontStyle: "italic",
              fontSize: 12, color: "rgba(255,255,255,0.5)",
            }}
          >
            Belum diisi hari ini
          </div>
        ) : (
          <>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 18, fontWeight: 400,
                color: "#fff", lineHeight: 1,
              }}
            >
              {overall}
              <span
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 400, fontStyle: "italic",
                  fontSize: 12, color: "rgba(255,255,255,0.5)", marginLeft: 2,
                }}
              >
                %
              </span>
            </div>
            <div
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 400, fontStyle: "italic",
                fontSize: 11, color: "rgba(255,255,255,0.55)",
                marginBottom: 8, marginTop: 2,
              }}
            >
              {getFatigueLabel(overall)} · keseluruhan
            </div>

            {/* Mini bars */}
            <div style={{ display: "flex", gap: 3 }}>
              {MUSCLE_AREAS.map((area) => {
                const val = todayData![area.id];
                return (
                  <div
                    key={area.id}
                    style={{
                      flex: 1, height: 24,
                      background: "rgba(255,255,255,0.08)",
                      borderRadius: 3, position: "relative", overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute", bottom: 0, left: 0, right: 0,
                        height: `${val}%`,
                        background: getFatigueColor(val),
                        transition: "height 0.3s",
                      }}
                    />
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 3, marginTop: 3 }}>
              {MUSCLE_AREAS.map((area) => (
                <div
                  key={area.id}
                  style={{
                    flex: 1, textAlign: "center",
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 900, fontSize: 8,
                    color: "rgba(255,255,255,0.4)", letterSpacing: "0.5px",
                  }}
                >
                  {area.label}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {sheetOpen && (
        <MuscleFatigueBottomSheet
          initialData={todayData}
          onClose={() => setSheetOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
