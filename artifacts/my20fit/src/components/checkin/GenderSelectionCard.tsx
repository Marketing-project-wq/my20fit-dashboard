import { useState } from "react";

interface Props {
  onConfirmed: (gender: "female" | "male") => void;
}

export default function GenderSelectionCard({ onConfirmed }: Props) {
  const [selected, setSelected] = useState<"female" | "male" | null>(null);

  const handleConfirm = () => {
    if (!selected) return;
    localStorage.setItem("my20fit_gender", selected);
    window.dispatchEvent(new CustomEvent("my20fit_gender_updated"));
    onConfirmed(selected);
  };

  return (
    <div className="mb-8" data-testid="section-quick-checkin">
      <div className="section-header">
        <h2>QUICK CHECK-IN</h2>
        <div className="section-header-line" />
      </div>

      <div
        style={{
          background: "linear-gradient(135deg, #0A0908 0%, #1a1410 100%)",
          borderRadius: 20,
          padding: "32px 24px",
          position: "relative",
          overflow: "hidden",
          textAlign: "center",
        }}
      >
        <div
          style={{
            position: "absolute", top: -40, right: -40,
            width: 180, height: 180,
            background: "radial-gradient(circle, rgba(196,17,1,0.2), transparent 60%)",
            pointerEvents: "none",
          }}
        />

        <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>

        <div
          style={{
            fontFamily: "'Anton', sans-serif",
            fontSize: 22, color: "#FFFFFF",
            letterSpacing: "0.5px", marginBottom: 8,
          }}
        >
          Personalisasi Widget
        </div>

        <div
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 400,
            fontSize: 14, color: "rgba(255,255,255,0.65)",
            lineHeight: 1.5, maxWidth: 420,
            margin: "0 auto 24px",
          }}
        >
          Pilih jenis kelamin untuk mengaktifkan widget Quick Check-in yang sesuai
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(130px, 1fr))",
            gap: 12, maxWidth: 420,
            margin: "0 auto 16px",
          }}
        >
          {(["female", "male"] as const).map((g) => {
            const isSelected = selected === g;
            return (
              <button
                key={g}
                type="button"
                onClick={() => setSelected(g)}
                aria-label={g === "female" ? "Pilih jenis kelamin Perempuan" : "Pilih jenis kelamin Laki-laki"}
                style={{
                  background: isSelected ? "rgba(196,17,1,0.15)" : "rgba(255,255,255,0.05)",
                  border: isSelected ? "2px solid #C0392B" : "2px solid rgba(255,255,255,0.1)",
                  borderRadius: 14, padding: "20px 16px",
                  cursor: "pointer", transition: "all 0.2s ease",
                  color: "#FFFFFF",
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 8 }}>{g === "female" ? "♀" : "♂"}</div>
                <div
                  style={{
                    fontFamily: "'Anton', sans-serif",
                    fontSize: 16, letterSpacing: "1px", marginBottom: 4,
                  }}
                >
                  {g === "female" ? "PEREMPUAN" : "LAKI-LAKI"}
                </div>
                <div
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 900, fontSize: 10,
                    color: "rgba(255,255,255,0.5)", letterSpacing: "1.5px",
                  }}
                >
                  {g === "female" ? "+ WIDGET SIKLUS" : "+ MUSCLE FATIGUE"}
                </div>
              </button>
            );
          })}
        </div>

        <div
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 400,
            fontSize: 12, color: "rgba(255,255,255,0.4)",
            marginBottom: 20,
          }}
        >
          ℹ️ Pilihan bisa diubah nanti di Profile
        </div>

        <button
          type="button"
          onClick={handleConfirm}
          disabled={!selected}
          style={{
            background: selected ? "#C0392B" : "rgba(255,255,255,0.1)",
            color: "#FFFFFF",
            fontFamily: "'Anton', sans-serif",
            fontSize: 14, letterSpacing: "1.5px",
            padding: "14px 32px", borderRadius: 10,
            border: "none",
            cursor: selected ? "pointer" : "not-allowed",
            transition: "all 0.2s",
            boxShadow: selected ? "0 4px 16px rgba(196,17,1,0.3)" : "none",
          }}
        >
          KONFIRMASI →
        </button>
      </div>
    </div>
  );
}
