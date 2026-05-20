import { useState } from "react";
import BottomSheet from "../BottomSheet";
import {
  FatigueValues,
  MUSCLE_AREAS,
  FATIGUE_PRESETS,
  getFatigueColor,
  getFatigueLabel,
  computeOverallFatigue,
} from "../../utils/fatigueHelpers";

interface Props {
  initialData: (FatigueValues & { notes?: string }) | null;
  onClose: () => void;
  onSaved: (data: FatigueValues & { notes?: string }) => void;
}

export default function MuscleFatigueBottomSheet({ initialData, onClose, onSaved }: Props) {
  const [values, setValues] = useState<FatigueValues>({
    legs: initialData?.legs ?? 0,
    back: initialData?.back ?? 0,
    arms: initialData?.arms ?? 0,
    core: initialData?.core ?? 0,
  });
  const [notes, setNotes] = useState(initialData?.notes ?? "");

  const overall = computeOverallFatigue(values);

  const handleSlider = (id: keyof FatigueValues, val: string) => {
    setValues((prev) => ({ ...prev, [id]: parseInt(val, 10) }));
  };

  const handleSave = () => {
    onSaved({ ...values, notes: notes || undefined });
  };

  return (
    <BottomSheet isOpen onClose={onClose} title="Muscle Fatigue Hari Ini">
      <div style={{ padding: "0 0 20px" }}>

        {/* Overall display */}
        <div
          style={{
            textAlign: "center", padding: 16,
            background: "linear-gradient(135deg, #1a0a14 0%, #2d0a0a 100%)",
            borderRadius: 12, marginBottom: 20,
          }}
        >
          <div
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 900, fontSize: 10,
              letterSpacing: "2px", color: "rgba(255,255,255,0.5)",
              marginBottom: 4,
            }}
          >
            FATIGUE OVERALL
          </div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 400, fontSize: 48,
              color: getFatigueColor(overall),
            }}
          >
            {overall}%
          </div>
          <div
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 400, fontStyle: "italic",
              fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 4,
            }}
          >
            {getFatigueLabel(overall)}
          </div>
        </div>

        {/* Quick presets */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 900, fontSize: 11,
              letterSpacing: "2px", color: "var(--muted)",
              marginBottom: 12,
            }}
          >
            QUICK PRESET
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 8,
            }}
          >
            {FATIGUE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setValues(preset.values)}
                style={{
                  background: "var(--bg, #f5f5f0)",
                  border: "1px solid var(--border-subtle, rgba(0,0,0,0.08))",
                  borderRadius: 10, padding: "10px 6px",
                  fontSize: 11, cursor: "pointer",
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 400, fontStyle: "italic",
                  textAlign: "center", transition: "all 0.15s",
                  color: "var(--text)",
                }}
              >
                <div style={{ fontSize: 18, marginBottom: 4 }}>{preset.emoji}</div>
                <div style={{ lineHeight: 1.2 }}>{preset.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Per-area sliders */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 900, fontSize: 11,
              letterSpacing: "2px", color: "var(--muted)",
              marginBottom: 16,
            }}
          >
            DETAIL PER AREA
          </div>

          {MUSCLE_AREAS.map((area) => {
            const value = values[area.id];
            return (
              <div key={area.id} style={{ marginBottom: 20 }}>
                <div
                  style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "center", marginBottom: 8,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 16 }}>{area.emoji}</span>
                    <span
                      style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontWeight: 900, fontSize: 13,
                        letterSpacing: "1px", color: "var(--text)",
                      }}
                    >
                      {area.label}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 14, fontWeight: 700,
                        color: getFatigueColor(value),
                      }}
                    >
                      {value}%
                    </span>
                    <span
                      style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontWeight: 900, fontSize: 10,
                        letterSpacing: "1px", color: getFatigueColor(value),
                      }}
                    >
                      {getFatigueLabel(value)}
                    </span>
                  </div>
                </div>
                <input
                  type="range" min="0" max="100" step="5"
                  value={value}
                  onChange={(e) => handleSlider(area.id, e.target.value)}
                  style={{ width: "100%", accentColor: getFatigueColor(value) }}
                  aria-label={`Level fatigue ${area.label}`}
                />
              </div>
            );
          })}
        </div>

        {/* Notes */}
        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 900, fontSize: 11,
              letterSpacing: "2px", color: "var(--muted)",
              display: "block", marginBottom: 8,
            }}
          >
            CATATAN (OPSIONAL)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Misal: kemarin habis leg day, hari ini full DOMS"
            maxLength={200}
            style={{
              width: "100%", minHeight: 60,
              padding: "10px 12px",
              border: "1.5px solid var(--border-subtle, #E5E1D8)",
              borderRadius: 8,
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 400, fontStyle: "italic",
              fontSize: 13, resize: "vertical",
              background: "var(--card)", color: "var(--text)",
              boxSizing: "border-box",
            }}
          />
        </div>

        <button
          type="button"
          onClick={handleSave}
          style={{
            width: "100%",
            background: "#C0392B", color: "#FFFFFF",
            fontFamily: "'Anton', sans-serif",
            fontSize: 15, letterSpacing: "1.5px",
            padding: 14, borderRadius: 12,
            border: "none", cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          SIMPAN
        </button>
      </div>
    </BottomSheet>
  );
}
