import { useState, useEffect, useCallback } from "react";
import { Heart, Smile, Moon, Droplets } from "lucide-react";
import BottomSheet from "./BottomSheet";
import { useToast } from "@/contexts/ToastContext";

// ---- Types ----
interface CycleData { lastPeriod: string; cycleLength: number; }
interface WellnessData { mood: number; energy: number; stress: number; soreness: string; }
interface SleepData { bed: string; wake: string; }
interface WaterLog { time: string; cups: number; ml: number; }

// ---- Helpers ----
const todayKey = () => new Date().toISOString().split("T")[0];

function computeCycleInfo(lastPeriod: string, cycleLength: number) {
  const last = new Date(lastPeriod);
  const today = new Date();
  const daysSince = Math.floor((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
  const cycleDay = (daysSince % cycleLength) + 1;

  let phase: string, phaseColor: string;
  if (cycleDay <= 5) { phase = "Menstruasi"; phaseColor = "#EF4444"; }
  else if (cycleDay <= 13) { phase = "Folikular"; phaseColor = "#3B82F6"; }
  else if (cycleDay <= 16) { phase = "Ovulasi"; phaseColor = "#22C55E"; }
  else { phase = "Luteal"; phaseColor = "#A855F7"; }

  const completeCycles = Math.floor(daysSince / cycleLength);
  const currentStart = new Date(last);
  currentStart.setDate(currentStart.getDate() + completeCycles * cycleLength);

  const ovulation = new Date(currentStart);
  ovulation.setDate(ovulation.getDate() + cycleLength - 14);
  if (ovulation < today) ovulation.setDate(ovulation.getDate() + cycleLength);

  const nextPeriod = new Date(currentStart);
  nextPeriod.setDate(nextPeriod.getDate() + cycleLength);
  if (nextPeriod < today) nextPeriod.setDate(nextPeriod.getDate() + cycleLength);

  const fmt = (d: Date) => d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  return { cycleDay, phase, phaseColor, nextPeriod: fmt(nextPeriod), ovulation: fmt(ovulation) };
}

function computeSleep(bed: string, wake: string) {
  const [bH, bM] = bed.split(":").map(Number);
  const [wH, wM] = wake.split(":").map(Number);
  let mins = (wH * 60 + wM) - (bH * 60 + bM);
  if (mins < 0) mins += 24 * 60;
  const hours = Math.floor(mins / 60);
  const minutes = mins % 60;
  let quality: string, color: string, tip: string;
  if (mins < 300) {
    quality = "Kurang Sekali"; color = "#EF4444";
    tip = "Tidur sangat kurang. Otot tidak bisa recover dengan baik.";
  } else if (mins < 360) {
    quality = "Kurang"; color = "#F97316";
    tip = "Tidur kurang menghambat pemulihan. Coba tidur lebih awal.";
  } else if (mins < 420) {
    quality = "Cukup"; color = "#EAB308";
    tip = "Hampir cukup. Tambah 30-60 menit untuk hasil optimal.";
  } else if (mins <= 540) {
    quality = "Ideal"; color = "#22C55E";
    tip = "Bagus! Tidur kamu optimal untuk pemulihan otot.";
  } else {
    quality = "Terlalu Banyak"; color = "#3B82F6";
    tip = "Tidur terlalu lama bisa membuat badan terasa lemas.";
  }
  return { hours, minutes, quality, color, tip };
}

function getLast7Days() {
  const dayLabels = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split("T")[0];
    let hours = 0;
    try {
      const saved = localStorage.getItem(`my20fit_sleep_${dateStr}`);
      if (saved) {
        const data: SleepData = JSON.parse(saved);
        if (data.bed && data.wake) {
          const s = computeSleep(data.bed, data.wake);
          hours = s.hours + s.minutes / 60;
        }
      }
    } catch { /* ignore */ }
    return { label: dayLabels[d.getDay()], hours, isToday: i === 6 };
  });
}

// ---- SliderField ----
function SliderField({ label, value, onChange, color, getLabel }: {
  label: string; value: number; onChange: (v: number) => void;
  color: string; getLabel: (v: number) => string;
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <label style={{ fontFamily: "'Barlow Condensed'", fontSize: 11, letterSpacing: 2, color: "var(--muted)" }}>{label}</label>
        <span style={{ fontFamily: "'Barlow Condensed'", fontSize: 13, fontWeight: 600, color }}>{getLabel(value)}</span>
      </div>
      <input type="range" min={1} max={10} value={value} onChange={e => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: color }} />
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'Barlow Condensed'", fontSize: 10, color: "var(--muted)", marginTop: 4 }}>
        <span>1</span><span>10</span>
      </div>
    </div>
  );
}

// ---- Tile base style ----
function tileStyle(hover: boolean): React.CSSProperties {
  return {
    background: "var(--card)",
    borderRadius: 14,
    padding: 16,
    cursor: "pointer",
    boxShadow: hover ? "0 6px 20px rgba(0,0,0,0.12)" : "var(--shadow, 0 2px 8px rgba(0,0,0,0.06))",
    transition: "all .2s",
    position: "relative",
    overflow: "hidden",
    transform: hover ? "translateY(-2px)" : "none",
  };
}

const MOODS = [
  { emoji: "😞", label: "Buruk", value: 1 },
  { emoji: "😕", label: "Kurang", value: 2 },
  { emoji: "😐", label: "Biasa", value: 3 },
  { emoji: "🙂", label: "Baik", value: 4 },
  { emoji: "😄", label: "Luar Biasa", value: 5 },
];

// ---- Main Component ----
export default function QuickCheckin() {
  const { showToast } = useToast();

  // Modal visibility
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [showCycleModal, setShowCycleModal] = useState(false);
  const [showWellnessModal, setShowWellnessModal] = useState(false);
  const [showSleepModal, setShowSleepModal] = useState(false);
  const [showWaterModal, setShowWaterModal] = useState(false);
  const [showMaleTip, setShowMaleTip] = useState(false);

  // Tile hover states
  const [hoverCycle, setHoverCycle] = useState(false);
  const [hoverWellness, setHoverWellness] = useState(false);
  const [hoverSleep, setHoverSleep] = useState(false);
  const [hoverWater, setHoverWater] = useState(false);

  // --- Tile 1: Cycle ---
  const [gender, setGender] = useState<string | null>(() => localStorage.getItem("my20fit_gender"));
  const [selectedGender, setSelectedGender] = useState("");
  const [cycleData, setCycleData] = useState<CycleData | null>(() => {
    try {
      const s = localStorage.getItem("my20fit_cycle");
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });
  const [lastPeriod, setLastPeriod] = useState(cycleData?.lastPeriod ?? "");
  const [cycleLength, setCycleLength] = useState(cycleData?.cycleLength ?? 28);

  // --- Tile 2: Wellness ---
  const [wellnessData, setWellnessData] = useState<WellnessData | null>(() => {
    try {
      const s = localStorage.getItem(`my20fit_wellness_${todayKey()}`);
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });
  const [mood, setMood] = useState(wellnessData?.mood ?? 3);
  const [energy, setEnergy] = useState(wellnessData?.energy ?? 5);
  const [stress, setStress] = useState(wellnessData?.stress ?? 5);
  const [soreness, setSoreness] = useState(wellnessData?.soreness ?? "Tidak Ada");

  // --- Tile 3: Sleep ---
  const [sleepData, setSleepData] = useState<SleepData | null>(() => {
    try {
      const s = localStorage.getItem(`my20fit_sleep_${todayKey()}`);
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });
  const [bedTime, setBedTime] = useState(sleepData?.bed ?? "23:00");
  const [wakeTime, setWakeTime] = useState(sleepData?.wake ?? "06:00");

  // --- Tile 4: Water ---
  const [intakeLogs, setIntakeLogs] = useState<WaterLog[]>(() => {
    try {
      const s = localStorage.getItem(`my20fit_water_${todayKey()}`);
      return s ? (JSON.parse(s).logs ?? []) : [];
    } catch { return []; }
  });
  const [weight, setWeight] = useState<number>(() => {
    try {
      const s = localStorage.getItem(`my20fit_water_${todayKey()}`);
      return s ? (JSON.parse(s).weight ?? 65) : 65;
    } catch { return 65; }
  });

  // ESC key handler
  const closeAll = useCallback(() => {
    setShowGenderModal(false);
    setShowCycleModal(false);
    setShowWellnessModal(false);
    setShowSleepModal(false);
    setShowWaterModal(false);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") closeAll(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [closeAll]);

  // ---- Tile 1 handlers ----
  const handleCycleTileClick = () => {
    if (!gender) { setSelectedGender(""); setShowGenderModal(true); return; }
    if (gender === "male") {
      setShowMaleTip(true);
      setTimeout(() => setShowMaleTip(false), 2500);
      return;
    }
    setLastPeriod(cycleData?.lastPeriod ?? "");
    setCycleLength(cycleData?.cycleLength ?? 28);
    setShowCycleModal(true);
  };

  const saveCycle = () => {
    if (!lastPeriod) return;
    const data: CycleData = { lastPeriod, cycleLength };
    localStorage.setItem("my20fit_cycle", JSON.stringify(data));
    setCycleData(data);
    setShowCycleModal(false);
    showToast("Siklus menstruasi diperbarui ✓");
  };

  // ---- Tile 2 handlers ----
  const openWellness = () => {
    setMood(wellnessData?.mood ?? 3);
    setEnergy(wellnessData?.energy ?? 5);
    setStress(wellnessData?.stress ?? 5);
    setSoreness(wellnessData?.soreness ?? "Tidak Ada");
    setShowWellnessModal(true);
  };

  const saveWellness = () => {
    const data: WellnessData = { mood, energy, stress, soreness };
    localStorage.setItem(`my20fit_wellness_${todayKey()}`, JSON.stringify(data));
    setWellnessData(data);
    setShowWellnessModal(false);
    showToast("Wellness check-in tersimpan ✓");
  };

  // ---- Tile 3 handlers ----
  const openSleep = () => {
    setBedTime(sleepData?.bed ?? "23:00");
    setWakeTime(sleepData?.wake ?? "06:00");
    setShowSleepModal(true);
  };

  const saveSleep = () => {
    const data: SleepData = { bed: bedTime, wake: wakeTime };
    localStorage.setItem(`my20fit_sleep_${todayKey()}`, JSON.stringify(data));
    setSleepData(data);
    setShowSleepModal(false);
    showToast("Data tidur tersimpan ✓");
  };

  // ---- Tile 4 handlers ----
  const saveLogs = (logs: WaterLog[], w: number) => {
    localStorage.setItem(`my20fit_water_${todayKey()}`, JSON.stringify({ logs, weight: w }));
  };

  const addIntake = (cups: number, ml: number) => {
    const time = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    const newLog: WaterLog = { time, cups, ml };
    setIntakeLogs(prev => {
      const updated = [...prev, newLog];
      saveLogs(updated, weight);
      return updated;
    });
    showToast(`+${ml}ml tercatat`, "info");
  };

  const resetWater = () => {
    setIntakeLogs([]);
    saveLogs([], weight);
  };

  // ---- Derived values ----
  const cycleInfo = cycleData ? computeCycleInfo(cycleData.lastPeriod, cycleData.cycleLength) : null;
  const sleepInfo = sleepData ? computeSleep(sleepData.bed, sleepData.wake) : null;
  const currentSleepInfo = computeSleep(bedTime, wakeTime);
  const totalCups = intakeLogs.reduce((s, l) => s + l.cups, 0);
  const targetCups = Math.round(weight * 0.033 / 0.25);
  const waterPct = Math.min(100, (totalCups / targetCups) * 100);
  const stressColor = stress <= 3 ? "#22C55E" : stress <= 6 ? "#EAB308" : "#EF4444";

  const energyLabel = (v: number) => v <= 3 ? "Sangat Rendah" : v <= 5 ? "Rendah" : v <= 7 ? "Normal" : v <= 9 ? "Tinggi" : "Maksimal";
  const stressLabel = (v: number) => v <= 3 ? "Santai" : v <= 5 ? "Sedikit Stres" : v <= 7 ? "Cukup Stres" : "Sangat Stres";

  const weekSleep = getLast7Days();
  const maxSleepH = Math.max(...weekSleep.map(d => d.hours), 8);

  return (
    <div className="mb-8" data-testid="section-quick-checkin">
      <div className="section-header">
        <h2>QUICK CHECK-IN</h2>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>

        {/* ---- TILE 1: Menstrual Cycle ---- */}
        <div
          onClick={handleCycleTileClick}
          style={tileStyle(hoverCycle)}
          onMouseEnter={() => setHoverCycle(true)}
          onMouseLeave={() => setHoverCycle(false)}
          data-testid="checkin-menstrual"
        >
          <div style={{ position: "absolute", top: 12, right: 12, width: 8, height: 8, borderRadius: "50%", background: "#EC4899" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <Heart size={18} style={{ color: "#EC4899" }} />
            <span style={{ fontFamily: "'Anton'", fontWeight: 400, fontSize: 13, letterSpacing: 0.5, color: "var(--text)" }}>SIKLUS</span>
          </div>
          {gender === "male" ? (
            <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 12, color: "var(--muted)", opacity: 0.5 }}>
              Tidak tersedia
            </div>
          ) : cycleInfo ? (
            <>
              <span style={{
                display: "inline-block", background: cycleInfo.phaseColor + "22",
                color: cycleInfo.phaseColor, fontFamily: "'Barlow Condensed'",
                fontSize: 11, letterSpacing: 1, padding: "2px 8px", borderRadius: 99,
              }}>{cycleInfo.phase}</span>
              <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 18, fontWeight: 700, color: "var(--text)", marginTop: 4 }}>
                {cycleInfo.cycleDay}<span style={{ fontFamily: "'Barlow Condensed'", fontSize: 12, color: "var(--muted)", marginLeft: 3 }}>hari</span>
              </div>
            </>
          ) : (
            <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 12, color: "var(--muted)" }}>
              {!gender ? "Atur jenis kelamin" : "Belum diisi"}
            </div>
          )}
          {showMaleTip && (
            <div style={{
              position: "absolute", bottom: "100%", left: 0, right: 0,
              background: "rgba(0,0,0,0.85)", color: "#fff", borderRadius: 8,
              padding: "8px 12px", fontFamily: "'Barlow Condensed'", fontSize: 12,
              zIndex: 10, marginBottom: 4, textAlign: "center",
            }}>Fitur ini untuk pengguna perempuan</div>
          )}
        </div>

        {/* ---- TILE 2: Daily Wellness ---- */}
        <div
          onClick={openWellness}
          style={tileStyle(hoverWellness)}
          onMouseEnter={() => setHoverWellness(true)}
          onMouseLeave={() => setHoverWellness(false)}
          data-testid="checkin-wellness"
        >
          <div style={{ position: "absolute", top: 12, right: 12, width: 8, height: 8, borderRadius: "50%", background: "#22C55E" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <Smile size={18} style={{ color: "#22C55E" }} />
            <span style={{ fontFamily: "'Anton'", fontWeight: 400, fontSize: 13, letterSpacing: 0.5, color: "var(--text)" }}>WELLNESS</span>
          </div>
          {wellnessData ? (
            <>
              <div style={{ fontSize: 22 }}>{MOODS[wellnessData.mood - 1]?.emoji}</div>
              <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 12, color: "#22C55E", marginTop: 2 }}>
                Energi: {energyLabel(wellnessData.energy)}
              </div>
            </>
          ) : (
            <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 12, color: "var(--muted)" }}>Belum diisi</div>
          )}
        </div>

        {/* ---- TILE 3: Sleep Quality ---- */}
        <div
          onClick={openSleep}
          style={tileStyle(hoverSleep)}
          onMouseEnter={() => setHoverSleep(true)}
          onMouseLeave={() => setHoverSleep(false)}
          data-testid="checkin-sleep"
        >
          <div style={{ position: "absolute", top: 12, right: 12, width: 8, height: 8, borderRadius: "50%", background: "#A855F7" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <Moon size={18} style={{ color: "#A855F7" }} />
            <span style={{ fontFamily: "'Anton'", fontWeight: 400, fontSize: 13, letterSpacing: 0.5, color: "var(--text)" }}>TIDUR</span>
          </div>
          {sleepInfo ? (
            <>
              <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 18, fontWeight: 700, color: "var(--text)" }}>
                {sleepInfo.hours}j{sleepInfo.minutes > 0 ? ` ${sleepInfo.minutes}m` : ""}
              </div>
              <span style={{
                display: "inline-block", background: sleepInfo.color + "22",
                color: sleepInfo.color, fontFamily: "'Barlow Condensed'",
                fontSize: 10, letterSpacing: 1, padding: "2px 7px", borderRadius: 99, marginTop: 2,
              }}>{sleepInfo.quality}</span>
            </>
          ) : (
            <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 12, color: "var(--muted)" }}>Belum diisi</div>
          )}
        </div>

        {/* ---- TILE 4: Water Intake ---- */}
        <div
          onClick={() => setShowWaterModal(true)}
          style={tileStyle(hoverWater)}
          onMouseEnter={() => setHoverWater(true)}
          onMouseLeave={() => setHoverWater(false)}
          data-testid="checkin-water"
        >
          <div style={{ position: "absolute", top: 12, right: 12, width: 8, height: 8, borderRadius: "50%", background: "#06B6D4" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <Droplets size={18} style={{ color: "#06B6D4" }} />
            <span style={{ fontFamily: "'Anton'", fontWeight: 400, fontSize: 13, letterSpacing: 0.5, color: "var(--text)" }}>AIR</span>
          </div>
          <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 18, fontWeight: 700, color: "var(--text)" }}>
            {totalCups}<span style={{ fontFamily: "'Barlow Condensed'", fontSize: 12, color: "var(--muted)", margin: "0 2px" }}>/</span>{targetCups}
          </div>
          <div style={{ height: 4, background: "var(--bg, #f5f5f5)", borderRadius: 99, marginTop: 6, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${waterPct}%`, background: "#06B6D4", borderRadius: 99, transition: "width .4s ease" }} />
          </div>
          <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 10, color: "var(--muted)", marginTop: 3 }}>gelas hari ini</div>
        </div>
      </div>

      {/* ========== MODAL: GENDER ========== */}
      <BottomSheet isOpen={showGenderModal} onClose={() => setShowGenderModal(false)} title="Pilih Jenis Kelamin">
        <p style={{ fontFamily: "'Barlow Condensed'", fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>
          Untuk menampilkan fitur yang relevan
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, margin: "8px 0 20px" }}>
          {(["male", "female"] as const).map(g => (
            <div
              key={g}
              onClick={() => setSelectedGender(g)}
              style={{
                border: `2px solid ${selectedGender === g ? "#C41101" : "var(--border-subtle, #E5E1D8)"}`,
                background: selectedGender === g ? "rgba(196,17,1,.05)" : "var(--card)",
                borderRadius: 12, padding: "20px 16px",
                textAlign: "center", cursor: "pointer", transition: "all .2s",
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>{g === "male" ? "♂️" : "♀️"}</div>
              <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 16, letterSpacing: 1, color: selectedGender === g ? "#C41101" : "var(--text)" }}>
                {g === "male" ? "LAKI-LAKI" : "PEREMPUAN"}
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() => {
            if (!selectedGender) return;
            localStorage.setItem("my20fit_gender", selectedGender);
            setGender(selectedGender);
            setShowGenderModal(false);
            if (selectedGender === "female") { setLastPeriod(""); setCycleLength(28); setShowCycleModal(true); }
          }}
          disabled={!selectedGender}
          style={{
            width: "100%", padding: 14,
            background: selectedGender ? "#C41101" : "#ccc",
            color: "#fff", border: "none",
            borderRadius: 12, cursor: selectedGender ? "pointer" : "not-allowed",
            fontFamily: "'Anton'", fontWeight: 400, fontSize: 15, letterSpacing: 1,
          }}
        >SIMPAN</button>
      </BottomSheet>

      {/* ========== MODAL: CYCLE ========== */}
      <BottomSheet isOpen={showCycleModal} onClose={() => setShowCycleModal(false)} title="Siklus Menstruasi">
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontFamily: "'Barlow Condensed'", fontWeight: 900, fontSize: 11, letterSpacing: 1.5, color: "var(--muted)", display: "block", marginBottom: 8 }}>
            HARI PERTAMA HAID TERAKHIR
          </label>
          <input
            type="date" value={lastPeriod}
            onChange={e => setLastPeriod(e.target.value)}
            max={todayKey()}
            style={{
              width: "100%", padding: "12px 14px",
              border: "1.5px solid var(--border-subtle, #E5E1D8)",
              borderRadius: 10, fontSize: 16,
              fontFamily: "'Barlow Condensed'",
              background: "var(--card)", color: "var(--text)",
              boxSizing: "border-box",
            }}
          />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontFamily: "'Barlow Condensed'", fontWeight: 900, fontSize: 11, letterSpacing: 1.5, color: "var(--muted)", display: "block", marginBottom: 8 }}>
            PANJANG SIKLUS RATA-RATA
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 16, justifyContent: "center" }}>
            <button onClick={() => setCycleLength(l => Math.max(21, l - 1))} style={{ width: 40, height: 40, borderRadius: "50%", border: "1.5px solid var(--border-subtle, #E5E1D8)", background: "var(--card)", fontSize: 20, cursor: "pointer", color: "var(--text)", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
            <div style={{ textAlign: "center" }}>
              <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 28, fontWeight: 700, color: "var(--text)" }}>{cycleLength}</span>
              <span style={{ fontFamily: "'Barlow Condensed'", fontSize: 13, color: "var(--muted)", marginLeft: 6 }}>hari</span>
            </div>
            <button onClick={() => setCycleLength(l => Math.min(35, l + 1))} style={{ width: 40, height: 40, borderRadius: "50%", border: "1.5px solid var(--border-subtle, #E5E1D8)", background: "var(--card)", fontSize: 20, cursor: "pointer", color: "var(--text)", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
          </div>
        </div>
        {lastPeriod && (() => {
          const info = computeCycleInfo(lastPeriod, cycleLength);
          return (
            <div style={{ background: "var(--bg, #f9f9f9)", borderRadius: 12, padding: 16, marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ background: info.phaseColor + "22", color: info.phaseColor, fontFamily: "'Barlow Condensed'", fontSize: 11, letterSpacing: 1, padding: "3px 10px", borderRadius: 99 }}>{info.phase}</span>
                <span style={{ fontFamily: "'Barlow Condensed'", fontSize: 13, color: "var(--text)" }}>Hari ke-{info.cycleDay} dalam siklus</span>
              </div>
              <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 13, color: "var(--muted)" }}>Perkiraan ovulasi: <strong style={{ color: "var(--text)" }}>{info.ovulation}</strong></div>
              <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 13, color: "var(--muted)", marginTop: 4 }}>Haid berikutnya: <strong style={{ color: "var(--text)" }}>{info.nextPeriod}</strong></div>
            </div>
          );
        })()}
        <button
          onClick={saveCycle} disabled={!lastPeriod}
          style={{ width: "100%", padding: 14, background: lastPeriod ? "#C41101" : "#ccc", color: "#fff", border: "none", borderRadius: 12, cursor: lastPeriod ? "pointer" : "not-allowed", fontFamily: "'Anton'", fontWeight: 400, fontSize: 15, letterSpacing: 1 }}
        >SIMPAN</button>
      </BottomSheet>

      {/* ========== MODAL: WELLNESS ========== */}
      <BottomSheet isOpen={showWellnessModal} onClose={() => setShowWellnessModal(false)} title="Daily Wellness Check-in">
        <p style={{ fontFamily: "'Barlow Condensed'", fontSize: 13, color: "var(--muted)", marginBottom: 20 }}>Bagaimana kondisi kamu hari ini?</p>

        <div style={{ marginBottom: 24 }}>
          <label style={{ fontFamily: "'Barlow Condensed'", fontWeight: 900, fontSize: 11, letterSpacing: 1.5, color: "var(--muted)", display: "block", marginBottom: 12 }}>SUASANA HATI</label>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            {MOODS.map(m => (
              <div key={m.value} onClick={() => setMood(m.value)} style={{ textAlign: "center", cursor: "pointer" }}>
                <div style={{ fontSize: mood === m.value ? 36 : 28, transition: "all .2s", filter: mood === m.value ? "none" : "grayscale(0.5) opacity(0.6)" }}>{m.emoji}</div>
                <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 10, color: mood === m.value ? "#22C55E" : "var(--muted)", marginTop: 4 }}>{m.label}</div>
                {mood === m.value && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E", margin: "4px auto 0" }} />}
              </div>
            ))}
          </div>
        </div>

        <SliderField label="TINGKAT ENERGI" value={energy} onChange={setEnergy} color="#22C55E" getLabel={energyLabel} />
        <SliderField label="TINGKAT STRES" value={stress} onChange={setStress} color={stressColor} getLabel={stressLabel} />

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontFamily: "'Barlow Condensed'", fontWeight: 900, fontSize: 11, letterSpacing: 1.5, color: "var(--muted)", display: "block", marginBottom: 10 }}>NYERI OTOT</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {["Tidak Ada", "Ringan", "Sedang", "Berat", "Sangat Berat"].map(s => (
              <button key={s} onClick={() => setSoreness(s)} style={{ padding: "8px 14px", borderRadius: 99, border: `1.5px solid ${soreness === s ? "#22C55E" : "var(--border-subtle, #E5E1D8)"}`, background: soreness === s ? "#22C55E" : "transparent", color: soreness === s ? "#fff" : "var(--text)", fontFamily: "'Barlow Condensed'", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all .2s" }}>{s}</button>
            ))}
          </div>
        </div>

        <button onClick={saveWellness} style={{ width: "100%", padding: 14, background: "#22C55E", color: "#fff", border: "none", borderRadius: 12, cursor: "pointer", fontFamily: "'Anton'", fontWeight: 400, fontSize: 15, letterSpacing: 1 }}>SIMPAN</button>
      </BottomSheet>

      {/* ========== MODAL: SLEEP ========== */}
      <BottomSheet isOpen={showSleepModal} onClose={() => setShowSleepModal(false)} title="Kualitas Tidur">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
          {[
            { label: "JAM TIDUR", value: bedTime, set: setBedTime },
            { label: "JAM BANGUN", value: wakeTime, set: setWakeTime },
          ].map(f => (
            <div key={f.label}>
              <label style={{ fontFamily: "'Barlow Condensed'", fontSize: 10, letterSpacing: 2, color: "var(--muted)", display: "block", marginBottom: 6 }}>{f.label}</label>
              <input
                type="time" value={f.value} onChange={e => f.set(e.target.value)}
                style={{ width: "100%", padding: 12, border: "1.5px solid var(--border-subtle, #E5E1D8)", borderRadius: 10, fontSize: 16, fontFamily: "'Barlow Condensed'", background: "var(--card)", color: "var(--text)", boxSizing: "border-box" }}
              />
            </div>
          ))}
        </div>

        <div style={{ background: "var(--bg, #f9f9f9)", borderRadius: 12, padding: 16, textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 36, fontWeight: 900, color: "var(--text)" }}>
            {currentSleepInfo.hours}<span style={{ fontSize: 18 }}>j</span>
            {currentSleepInfo.minutes > 0 && <>{currentSleepInfo.minutes}<span style={{ fontSize: 18 }}>m</span></>}
          </div>
          <span style={{ display: "inline-block", background: currentSleepInfo.color + "20", color: currentSleepInfo.color, fontFamily: "'Barlow Condensed'", fontWeight: 900, fontSize: 12, letterSpacing: 1.5, padding: "4px 12px", borderRadius: 99, marginTop: 8 }}>{currentSleepInfo.quality}</span>
          <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 12, color: "var(--muted)", marginTop: 8, lineHeight: 1.4 }}>{currentSleepInfo.tip}</div>
        </div>

        {/* Weekly chart */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontFamily: "'Barlow Condensed'", fontWeight: 900, fontSize: 11, letterSpacing: 1.5, color: "var(--muted)", display: "block", marginBottom: 10 }}>7 HARI TERAKHIR</label>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 60 }}>
            {weekSleep.map((d, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ width: "100%", height: `${d.hours > 0 ? Math.max(4, (d.hours / maxSleepH) * 44) : 4}px`, background: d.isToday ? "#C41101" : d.hours > 0 ? "#A855F7" : "var(--border-subtle, #E5E1D8)", borderRadius: "3px 3px 0 0", transition: "height .3s" }} />
                <span style={{ fontFamily: "'Barlow Condensed'", fontSize: 9, color: d.isToday ? "#C41101" : "var(--muted)" }}>{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        <button onClick={saveSleep} style={{ width: "100%", padding: 14, background: "#A855F7", color: "#fff", border: "none", borderRadius: 12, cursor: "pointer", fontFamily: "'Anton'", fontWeight: 400, fontSize: 15, letterSpacing: 1 }}>SIMPAN</button>
      </BottomSheet>

      {/* ========== MODAL: WATER ========== */}
      <BottomSheet isOpen={showWaterModal} onClose={() => setShowWaterModal(false)} title="Kebutuhan Air Harian">
        <div style={{ background: "var(--bg, #f9f9f9)", borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontFamily: "'Barlow Condensed'", fontWeight: 900, fontSize: 11, letterSpacing: 1.5, color: "var(--muted)" }}>BERAT BADAN</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="number" value={weight} min={30} max={200}
                onChange={e => setWeight(Number(e.target.value))}
                style={{ width: 60, padding: "6px 8px", textAlign: "center", border: "1.5px solid var(--border-subtle, #E5E1D8)", borderRadius: 8, fontSize: 16, fontFamily: "'JetBrains Mono'", fontWeight: 700, background: "var(--card)", color: "var(--text)" }}
              />
              <span style={{ fontFamily: "'Barlow Condensed'", fontSize: 13, color: "var(--muted)" }}>kg</span>
            </div>
          </div>
          <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 13, color: "var(--text)" }}>
            Kebutuhan harian: <strong style={{ color: "#06B6D4" }}>{(weight * 0.033).toFixed(1)}L</strong> ({Math.round(weight * 0.033 / 0.25)} gelas @250ml)
          </div>
        </div>

        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 40, fontWeight: 900, color: "var(--text)" }}>
            {totalCups}<span style={{ fontSize: 18, color: "var(--muted)", margin: "0 4px" }}>/</span>{targetCups}
          </div>
          <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 13, color: "var(--muted)" }}>gelas hari ini</div>
          <div style={{ height: 8, background: "var(--bg, #f5f5f5)", borderRadius: 99, margin: "12px 0", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${waterPct}%`, background: "#06B6D4", borderRadius: 99, transition: "width .4s ease" }} />
          </div>
          <div style={{ fontFamily: "'Barlow Condensed'", fontWeight: 900, fontSize: 13, letterSpacing: 1, color: waterPct >= 100 ? "#22C55E" : "#06B6D4" }}>
            {waterPct >= 100 ? "✓ TARGET TERCAPAI!" : `${Math.round(waterPct)}% dari target`}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {[
            { label: "+1 Gelas", cups: 1, ml: 250 },
            { label: "+2 Gelas", cups: 2, ml: 500 },
            { label: "+Botol", cups: 2.4, ml: 600 },
          ].map(btn => (
            <button
              key={btn.label}
              onClick={() => addIntake(btn.cups, btn.ml)}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#06B6D4"; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "#06B6D4"; }}
              style={{ flex: 1, padding: "10px 8px", border: "1.5px solid #06B6D4", borderRadius: 10, background: "transparent", color: "#06B6D4", fontFamily: "'Anton'", fontWeight: 400, fontSize: 13, letterSpacing: 0.5, cursor: "pointer", transition: "all .2s" }}
            >
              {btn.label}
              <div style={{ fontSize: 10, fontFamily: "'Barlow Condensed'", opacity: .7, marginTop: 2 }}>{btn.ml}ml</div>
            </button>
          ))}
        </div>

        {intakeLogs.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontFamily: "'Barlow Condensed'", fontWeight: 900, fontSize: 11, letterSpacing: 1.5, color: "var(--muted)", display: "block", marginBottom: 8 }}>LOG HARI INI</label>
            {intakeLogs.map((log, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "0.5px solid var(--border-subtle, #E5E1D8)", fontFamily: "'Barlow Condensed'", fontSize: 13 }}>
                <span style={{ color: "var(--muted)" }}>{log.time}</span>
                <span style={{ color: "var(--text)" }}>{log.cups} gelas ({log.ml}ml)</span>
              </div>
            ))}
            <button onClick={resetWater} style={{ background: "none", border: "none", color: "#C41101", cursor: "pointer", fontFamily: "'Barlow Condensed'", fontSize: 13, marginTop: 8 }}>Reset hari ini</button>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
