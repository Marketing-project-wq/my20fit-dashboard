import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

function getMotivationalText(done: number, total: number): string {
  if (done === 0) return "Mulai hari ini dengan satu langkah kecil.";
  if (done <= 2) return "Sudah ada yang selesai — lanjutkan!";
  if (done < total) return "Hampir selesai — jangan berhenti sekarang.";
  return "Semua selesai hari ini. Luar biasa! 🎉";
}

export default function Greeting() {
  const { user, profile, photoProfile } = useAuth();
  const [checklistDone, setChecklistDone] = useState(0);
  const [checklistTotal, setChecklistTotal] = useState(5);
  const [mcuGrade, setMcuGrade] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedStates = localStorage.getItem("my20fit_checklist_states");
      if (savedStates) {
        const states: boolean[] = JSON.parse(savedStates);
        setChecklistDone(states.filter(Boolean).length);
        setChecklistTotal(Math.max(states.length, 5));
      }
    } catch { /* ignore */ }

    try {
      const mcuRaw = localStorage.getItem("my20fit_mcu_result");
      if (mcuRaw) {
        const mcu = JSON.parse(mcuRaw);
        setMcuGrade(mcu.grade ?? null);
      }
    } catch { /* ignore */ }
  }, []);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "GOOD MORNING";
    if (h < 18) return "GOOD AFTERNOON";
    return "GOOD EVENING";
  };

  const now = new Date();
  const dayName = now.toLocaleDateString("id-ID", { weekday: "long" });
  const date = now.toLocaleDateString("id-ID", { day: "numeric", month: "long" });

  const displayName = profile?.full_name
    || photoProfile?.name
    || user?.email?.split("@")[0]?.toUpperCase()
    || "MEMBER";

  const greeting = getGreeting();
  const motivationalText = getMotivationalText(checklistDone, checklistTotal);
  const streak = 0;

  const chips = [
    { label: streak > 0 ? `🔥 ${streak} HARI STREAK` : "MULAI STREAK", red: streak > 0 },
    { label: `GRADE ${mcuGrade || "—"}` },
    { label: `${checklistDone}/${checklistTotal} HARI INI` },
  ];

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #0A0908 0%, #1C1810 60%, #241A0A 100%)",
        borderRadius: 22,
        padding: "22px 20px",
        position: "relative",
        overflow: "hidden",
        marginBottom: 8,
      }}
      data-testid="section-greeting"
    >
      <div style={{
        position: "absolute", top: -50, right: -40,
        width: 160, height: 160,
        background: "radial-gradient(circle, rgba(196,17,1,.3) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: -30, left: -20,
        width: 120, height: 120,
        background: "radial-gradient(circle, rgba(212,168,0,.1) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{
        fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900,
        fontSize: 9, letterSpacing: 3,
        color: "rgba(255,255,255,.3)", marginBottom: 2,
        position: "relative", textTransform: "uppercase",
      }}>
        {greeting} · {dayName} {date}
      </div>

      <div style={{
        fontFamily: "'Anton', sans-serif",
        fontSize: 48, color: "#fff",
        lineHeight: .9, letterSpacing: -1,
        position: "relative",
      }}>
        {displayName}
      </div>

      <div style={{
        fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900,
        fontSize: 11,
        color: "rgba(255,255,255,.35)",
        marginTop: 8, lineHeight: 1.4,
        position: "relative",
      }}>
        {motivationalText}
      </div>

      <div style={{
        display: "flex", gap: 6, marginTop: 14,
        position: "relative", flexWrap: "wrap",
      }}>
        {chips.map((chip, i) => (
          <div key={i} style={{
            background: chip.red ? "rgba(196,17,1,.15)" : "rgba(255,255,255,.06)",
            border: `0.5px solid ${chip.red ? "rgba(196,17,1,.35)" : "rgba(255,255,255,.1)"}`,
            borderRadius: 99,
            padding: "5px 12px",
            fontSize: 9, letterSpacing: 1.5,
            color: chip.red ? "rgba(255,100,100,.8)" : "rgba(255,255,255,.4)",
            fontFamily: "Inter, sans-serif",
            fontWeight: 900,
          }}>{chip.label}</div>
        ))}
      </div>
    </div>
  );
}
