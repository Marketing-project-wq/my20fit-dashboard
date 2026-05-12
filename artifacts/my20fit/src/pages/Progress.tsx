import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line,
  ComposedChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
} from "recharts";
import { format, subMonths, subYears, parseISO, isAfter } from "date-fns";
import {
  Plus, Activity, CheckCircle, AlertCircle,
  Dumbbell, Bike, Waves, PersonStanding, Zap, Wind,
  HeartPulse, TrendingUp, TrendingDown, Moon, Droplets, Ruler,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import Header from "@/components/Header";
import TrendBadge from "@/components/TrendBadge";
import EmptyState from "@/components/EmptyState";
import { useToast } from "@/contexts/ToastContext";
import {
  getSleepHistory, getWaterHistory, getWellnessHistory,
  calculateTrend, getMultiPointTrend,
} from "@/utils/checkinData";
import type { SleepEntry, WaterEntry, WellnessEntry } from "@/utils/checkinData";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProgressEntry {
  date: string;
  weight?: number;
  bmi?: number;
  bodyFat?: number;
  restingHr?: number;
  waist?: number;
  bloodPressureSys?: number;
  bloodPressureDia?: number;
  note?: string;
}

interface Workout {
  date: string;
  type: string;
  duration: number;
  note?: string;
}

interface McuResult {
  grade?: string;
  bmi?: number;
  bodyFat?: number;
  restingHr?: number;
  summary?: string;
  recommendations?: string[];
  date?: string;
}

type DateRange = "1M" | "3M" | "6M" | "1Y" | "ALL";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function gradeColor(g?: string) {
  if (g === "A") return "#16A34A";
  if (g === "B") return "#2563EB";
  if (g === "C") return "#D97706";
  return "#DC2626";
}

function bmiStatus(v?: number): { label: string; color: string } {
  if (!v) return { label: "—", color: "var(--muted)" };
  if (v < 18.5) return { label: "Underweight", color: "#2563EB" };
  if (v < 25) return { label: "Normal", color: "#16A34A" };
  if (v < 30) return { label: "Overweight", color: "#D97706" };
  return { label: "Obese", color: "#DC2626" };
}

function bfStatus(v?: number): { label: string; color: string } {
  if (!v) return { label: "—", color: "var(--muted)" };
  if (v < 6) return { label: "Essential", color: "#2563EB" };
  if (v < 14) return { label: "Athletic", color: "#16A34A" };
  if (v < 18) return { label: "Fitness", color: "#22C55E" };
  if (v < 25) return { label: "Average", color: "#D97706" };
  return { label: "Obese", color: "#DC2626" };
}

function hrStatus(v?: number): { label: string; color: string } {
  if (!v) return { label: "—", color: "var(--muted)" };
  if (v < 55) return { label: "Athlete", color: "#16A34A" };
  if (v < 61) return { label: "Excellent", color: "#22C55E" };
  if (v < 70) return { label: "Good", color: "#2563EB" };
  if (v < 80) return { label: "Above Avg", color: "#D97706" };
  return { label: "High", color: "#DC2626" };
}

function bpStatus(sys?: number, dia?: number): { label: string; color: string } {
  if (!sys || !dia) return { label: "—", color: "var(--muted)" };
  if (sys < 120 && dia < 80) return { label: "Normal", color: "#16A34A" };
  if (sys < 130 && dia < 80) return { label: "Elevated", color: "#D97706" };
  return { label: "High", color: "#DC2626" };
}

function waistStatus(v?: number): { label: string; color: string } {
  if (!v) return { label: "—", color: "var(--muted)" };
  if (v < 80) return { label: "Low Risk", color: "#16A34A" };
  if (v < 94) return { label: "Mod Risk", color: "#D97706" };
  return { label: "High Risk", color: "#DC2626" };
}

function sleepQuality(h: number): { label: string; color: string } {
  if (h < 6) return { label: "Kurang Sekali", color: "#EF4444" };
  if (h < 7) return { label: "Kurang", color: "#F97316" };
  if (h <= 9) return { label: "Ideal", color: "#22C55E" };
  return { label: "Terlalu Banyak", color: "#3B82F6" };
}

function waterStatus(pct: number): { label: string; color: string } {
  if (pct < 50) return { label: "Kurang", color: "#EF4444" };
  if (pct < 80) return { label: "Cukup", color: "#EAB308" };
  if (pct < 100) return { label: "Baik", color: "#22C55E" };
  return { label: "Optimal", color: "#06B6D4" };
}

function energyStatus(v: number): { label: string; color: string } {
  if (v <= 3) return { label: "Rendah", color: "#EF4444" };
  if (v <= 6) return { label: "Normal", color: "#EAB308" };
  if (v <= 8) return { label: "Baik", color: "#22C55E" };
  return { label: "Tinggi", color: "#06B6D4" };
}

function workoutIcon(type: string) {
  const t = type.toLowerCase();
  if (t === "cardio") return { icon: HeartPulse, color: "#C41101" };
  if (t === "strength") return { icon: Dumbbell, color: "#2563EB" };
  if (t === "hiit") return { icon: Zap, color: "#F97316" };
  if (t === "yoga") return { icon: Wind, color: "#A855F7" };
  if (t === "cycling") return { icon: Bike, color: "#06B6D4" };
  if (t === "swimming") return { icon: Waves, color: "#0EA5E9" };
  if (t === "running") return { icon: PersonStanding, color: "#22C55E" };
  return { icon: Activity, color: "#6E665C" };
}

function filterByRange(entries: ProgressEntry[], range: DateRange): ProgressEntry[] {
  if (range === "ALL") return entries;
  const now = new Date();
  const cutoff =
    range === "1M" ? subMonths(now, 1) :
    range === "3M" ? subMonths(now, 3) :
    range === "6M" ? subMonths(now, 6) :
    subYears(now, 1);
  return entries.filter(e => isAfter(parseISO(e.date), cutoff));
}

function fmtDate(d: string) {
  try { return format(parseISO(d), "d MMM"); } catch { return d; }
}

function avg(arr: number[]): number {
  if (!arr.length) return 0;
  return parseFloat((arr.reduce((s, v) => s + v, 0) / arr.length).toFixed(1));
}

// ─── Custom Tooltips ──────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name?: string; color?: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0A0908", borderRadius: 8, padding: "8px 12px", border: "1px solid #333" }}>
      <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: p.color || "#fff" }}>
          {p.value}{p.name ? ` ${p.name}` : ""}
        </p>
      ))}
    </div>
  );
};

const SleepTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  const hours = payload[0]?.value ?? 0;
  const q = sleepQuality(hours);
  return (
    <div style={{ background: "#0A0908", borderRadius: 8, padding: "10px 14px", border: "1px solid #333" }}>
      <p style={{ fontFamily: "'Barlow Condensed'", fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>{label}</p>
      <p style={{ fontFamily: "'JetBrains Mono'", fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{hours}j</p>
      <span style={{ background: q.color + "25", color: q.color, fontFamily: "'Barlow Condensed'", fontSize: 11, letterSpacing: 1, padding: "2px 8px", borderRadius: 99 }}>{q.label}</span>
    </div>
  );
};

const WaterTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; dataKey?: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  const liters = payload.find(p => p.dataKey === "liters")?.value ?? 0;
  const pct = payload.find(p => p.dataKey === "pct")?.value ?? 0;
  return (
    <div style={{ background: "#0A0908", borderRadius: 8, padding: "10px 14px", border: "1px solid #333" }}>
      <p style={{ fontFamily: "'Barlow Condensed'", fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>{label}</p>
      <p style={{ fontFamily: "'JetBrains Mono'", fontSize: 18, fontWeight: 700, color: "#06B6D4", marginBottom: 4 }}>{liters}L</p>
      <p style={{ fontFamily: "'Barlow Condensed'", fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{pct}% dari target</p>
    </div>
  );
};

// ─── Chart Card ───────────────────────────────────────────────────────────────

function ChartCard({ title, data, dataKey, unit, color = "#C41101", refLines, secondKey, secondColor, secondName, trendKey }:
  { title: string; data: ProgressEntry[]; dataKey: keyof ProgressEntry; unit?: string; color?: string; refLines?: { y: number; label: string }[]; secondKey?: keyof ProgressEntry; secondColor?: string; secondName?: string; trendKey?: string }
) {
  const filtered = data.filter(e => e[dataKey] != null);
  const latest = filtered[filtered.length - 1];
  const latestVal = latest ? latest[dataKey] : undefined;

  return (
    <div className="app-card" style={{ marginBottom: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, letterSpacing: "2.5px", color: "var(--muted)" }}>{title}</p>
        {latestVal != null && (
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 700, color: "var(--text)" }}>
            {String(latestVal)}{unit}
          </span>
        )}
      </div>
      {filtered.length < 2 ? (
        <div style={{ height: 100, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <TrendingUp size={24} style={{ color: "var(--border-subtle)" }} />
          <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, color: "var(--muted)", textAlign: "center" }}>
            Tambah data untuk melihat tren
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={130}>
          <AreaChart data={filtered} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad-${trendKey ?? dataKey as string}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.15} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
              {secondKey && secondColor && (
                <linearGradient id={`grad2-${dataKey as string}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={secondColor} stopOpacity={0.1} />
                  <stop offset="95%" stopColor={secondColor} stopOpacity={0} />
                </linearGradient>
              )}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
            <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 9, fill: "var(--muted)" }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 9, fill: "var(--muted)" }} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
            <Tooltip content={<CustomTooltip />} />
            {refLines?.map(r => (
              <ReferenceLine key={r.y} y={r.y} stroke="rgba(100,100,100,0.4)" strokeDasharray="4 4"
                label={{ value: r.label, position: "insideTopRight", style: { fontFamily: "'Barlow Condensed'", fontSize: 9, fill: "var(--muted)" } }}
              />
            ))}
            <Area type="monotone" dataKey={dataKey as string} stroke={color} strokeWidth={2}
              fill={`url(#grad-${trendKey ?? dataKey as string})`} dot={{ r: 3, fill: color, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: color }} name={unit}
            />
            {secondKey && secondColor && (
              <Area type="monotone" dataKey={secondKey as string} stroke={secondColor} strokeWidth={2}
                fill={`url(#grad2-${dataKey as string})`} dot={{ r: 3, fill: secondColor, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: secondColor }} name={secondName}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ─── Metric Card ──────────────────────────────────────────────────────────────

function MetricCard({ label, value, unit, status, change, changeUnit, trend, positiveIsGood = true, accent }:
  {
    label: string; value?: number | string; unit?: string;
    status?: { label: string; color: string }; change?: number; changeUnit?: string;
    trend?: import("@/utils/checkinData").TrendResult | null; positiveIsGood?: boolean;
    accent?: string;
  }
) {
  return (
    <div style={{
      background: "linear-gradient(180deg, #FFFFFF 0%, #FBFBFB 100%)",
      borderRadius: 14, padding: "14px 16px", minWidth: 130,
      border: "1px solid rgba(0,0,0,0.04)", boxShadow: "0 4px 16px rgba(0,0,0,0.05)", flexShrink: 0,
      borderTop: `3px solid ${accent ?? "var(--red)"}`,
    }}>
      <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 9, letterSpacing: "2px", color: "var(--muted)", marginBottom: 6 }}>{label}</p>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 3, marginBottom: 4 }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 26, fontWeight: 900, lineHeight: 1, color: "var(--text)" }}>
          {value ?? "—"}
        </span>
        {unit && <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, color: "var(--muted)", marginBottom: 2 }}>{unit}</span>}
      </div>
      {change != null && (
        <div style={{ display: "flex", alignItems: "center", gap: 3, marginBottom: 4 }}>
          {change > 0
            ? <TrendingUp size={12} style={{ color: "#C41101" }} />
            : <TrendingDown size={12} style={{ color: "#16A34A" }} />}
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: change > 0 ? "#C41101" : "#16A34A" }}>
            {change > 0 ? "+" : ""}{change.toFixed(1)}{changeUnit && <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900 }}>{changeUnit}</span>}
          </span>
        </div>
      )}
      {status && (
        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, fontWeight: 600, color: status.color,
          backgroundColor: status.color + "18", borderRadius: 4, padding: "2px 6px" }}>
          {status.label}
        </span>
      )}
      {trend && (
        <div style={{ marginTop: 6 }}>
          <TrendBadge trend={trend} positiveIsGood={positiveIsGood} />
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Progress({ theme, toggleTheme }: { theme: string; toggleTheme: () => void }) {
  const [, setLocation] = useLocation();
  const [dateRange, setDateRange] = useState<DateRange>("3M");
  const [entries, setEntries] = useState<ProgressEntry[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [mcuResult, setMcuResult] = useState<McuResult | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalTab, setModalTab] = useState<"kesehatan" | "latihan">("kesehatan");
  const [height, setHeight] = useState<number | undefined>(undefined);
  const [showHeightEdit, setShowHeightEdit] = useState(false);

  // Checkin data
  const [sleepData, setSleepData] = useState<SleepEntry[]>([]);
  const [waterData, setWaterData] = useState<WaterEntry[]>([]);
  const [wellnessData, setWellnessData] = useState<WellnessEntry[]>([]);

  // Form state — health
  const [fDate, setFDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [fWeight, setFWeight] = useState("");
  const [fBmi, setFBmi] = useState("");
  const [fBodyFat, setFBodyFat] = useState("");
  const [fRestingHr, setFRestingHr] = useState("");
  const [fWaist, setFWaist] = useState("");
  const [fBpSys, setFBpSys] = useState("");
  const [fBpDia, setFBpDia] = useState("");
  const [fNote, setFNote] = useState("");
  const [fHeightInput, setFHeightInput] = useState("");

  // Form state — workout
  const [wDate, setWDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [wType, setWType] = useState("Running");
  const [wDuration, setWDuration] = useState("");
  const [wNote, setWNote] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem("my20fit_mcu_result");
    if (raw) setMcuResult(JSON.parse(raw));

    const h = localStorage.getItem("my20fit_height");
    if (h) setHeight(Number(h));

    let storedEntries: ProgressEntry[] = [];
    const rawEntries = localStorage.getItem("my20fit_progress_entries");
    if (rawEntries) {
      storedEntries = JSON.parse(rawEntries);
    } else if (raw) {
      const mcu: McuResult = JSON.parse(raw);
      const seed: ProgressEntry = {
        date: format(new Date(), "yyyy-MM-dd"),
        bmi: mcu.bmi,
        bodyFat: mcu.bodyFat,
        restingHr: mcu.restingHr,
      };
      storedEntries = [seed];
      localStorage.setItem("my20fit_progress_entries", JSON.stringify(storedEntries));
    }
    setEntries(storedEntries.sort((a, b) => a.date.localeCompare(b.date)));

    const rawWorkouts = localStorage.getItem("my20fit_workouts");
    if (rawWorkouts) {
      setWorkouts(JSON.parse(rawWorkouts).sort((a: Workout, b: Workout) => b.date.localeCompare(a.date)));
    }

    // Load checkin data
    setSleepData(getSleepHistory(30));
    setWaterData(getWaterHistory(30));
    setWellnessData(getWellnessHistory(30));
  }, []);

  // Auto-calc BMI
  useEffect(() => {
    const w = parseFloat(fWeight);
    const h = height ?? (fHeightInput ? parseFloat(fHeightInput) : undefined);
    if (w > 0 && h && h > 0) {
      const calc = w / Math.pow(h / 100, 2);
      setFBmi(calc.toFixed(1));
    }
  }, [fWeight, fHeightInput, height]);

  const filteredEntries = useMemo(() => filterByRange(entries, dateRange), [entries, dateRange]);
  const latest = entries[entries.length - 1];
  const prev = entries[entries.length - 2];

  // Trend calculations
  const weightTrend = useMemo(() => calculateTrend(entries, "weight"), [entries]);
  const bmiTrend = useMemo(() => calculateTrend(entries, "bmi"), [entries]);
  const bfTrend = useMemo(() => calculateTrend(entries, "bodyFat"), [entries]);
  const hrTrend = useMemo(() => calculateTrend(entries, "restingHr"), [entries]);
  const waistTrend = useMemo(() => calculateTrend(entries, "waist"), [entries]);
  const sleepTrend = useMemo(() => getMultiPointTrend(sleepData, "hours", 7), [sleepData]);
  const waterTrend = useMemo(() => getMultiPointTrend(waterData, "pct", 7), [waterData]);
  const energyTrend = useMemo(() => getMultiPointTrend(wellnessData.filter(d => d.energy != null) as WellnessEntry[], "energy", 7), [wellnessData]);

  // Averages for summary
  const last7Sleep = sleepData.slice(-7);
  const last7Water = waterData.slice(-7);
  const last7Wellness = wellnessData.slice(-7);
  const avgSleep = avg(last7Sleep.map(d => d.hours));
  const avgWaterPct = avg(last7Water.map(d => d.pct));
  const avgEnergy = avg(last7Wellness.filter(d => d.energy != null).map(d => d.energy as number));

  // Wellness chart data (energy + mood scaled to 0-10)
  const wellnessChartData = useMemo(() =>
    wellnessData
      .filter(d => d.energy != null || d.mood != null)
      .map(d => ({
        date: d.date,
        energy: d.energy,
        mood: d.mood != null ? parseFloat((d.mood * 2).toFixed(1)) : null,
      })),
    [wellnessData]
  );

  const { showToast } = useToast();

  function saveHealthEntry() {
    if (!fDate) return;
    const newH = fHeightInput ? parseFloat(fHeightInput) : undefined;
    if (newH) {
      localStorage.setItem("my20fit_height", String(newH));
      setHeight(newH);
    }
    const entry: ProgressEntry = {
      date: fDate,
      weight: fWeight ? parseFloat(fWeight) : undefined,
      bmi: fBmi ? parseFloat(fBmi) : undefined,
      bodyFat: fBodyFat ? parseFloat(fBodyFat) : undefined,
      restingHr: fRestingHr ? parseFloat(fRestingHr) : undefined,
      waist: fWaist ? parseFloat(fWaist) : undefined,
      bloodPressureSys: fBpSys ? parseFloat(fBpSys) : undefined,
      bloodPressureDia: fBpDia ? parseFloat(fBpDia) : undefined,
      note: fNote || undefined,
    };
    const updated = [...entries, entry].sort((a, b) => a.date.localeCompare(b.date));
    localStorage.setItem("my20fit_progress_entries", JSON.stringify(updated));
    setEntries(updated);
    setShowModal(false);
    setFWeight(""); setFBmi(""); setFBodyFat(""); setFRestingHr("");
    setFWaist(""); setFBpSys(""); setFBpDia(""); setFNote(""); setFHeightInput("");
    showToast("Data kesehatan berhasil ditambahkan ✓");
  }

  function saveWorkout() {
    if (!wDate || !wType || !wDuration) return;
    const newWorkout: Workout = { date: wDate, type: wType, duration: parseFloat(wDuration), note: wNote || undefined };
    const updated = [...workouts, newWorkout].sort((a, b) => b.date.localeCompare(a.date));
    localStorage.setItem("my20fit_workouts", JSON.stringify(updated));
    setWorkouts(updated);
    setShowModal(false);
    setWDuration(""); setWNote(""); setWType("Running");
  }

  // Group workouts by ISO week
  const workoutGroups = useMemo(() => {
    const groups: { label: string; items: Workout[] }[] = [];
    const seen = new Set<string>();
    for (const w of workouts) {
      try {
        const d = parseISO(w.date);
        const weekKey = format(d, "yyyy-'W'ww");
        if (!seen.has(weekKey)) {
          seen.add(weekKey);
          const group = workouts.filter(ww => {
            try { return format(parseISO(ww.date), "yyyy-'W'ww") === weekKey; } catch { return false; }
          });
          const totalMin = group.reduce((s, ww) => s + ww.duration, 0);
          groups.push({ label: `${format(d, "d MMM")} · ${group.length} sesi · ${totalMin} menit`, items: group });
        }
      } catch { /* skip */ }
    }
    return groups;
  }, [workouts]);

  const hasAnyData = entries.length > 0 || mcuResult != null
    || sleepData.length > 0 || waterData.length > 0 || wellnessData.length > 0;

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "var(--card2)", border: "1px solid var(--border-subtle)",
    borderRadius: 8, padding: "9px 12px", fontFamily: "'Barlow Condensed', sans-serif",
    fontSize: 14, color: "var(--text)", outline: "none",
  };
  const labelStyle: React.CSSProperties = {
    fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, letterSpacing: "2px",
    color: "var(--muted)", marginBottom: 4, display: "block",
  };

  const workoutTypes = ["Cardio", "Strength", "HIIT", "Yoga", "Cycling", "Swimming", "Running", "Other"];

  const hasTrendData = last7Sleep.length >= 3 || last7Water.length >= 3 || last7Wellness.length >= 3;

  return (
    <div
      className="min-h-screen w-full flex"
      style={{ background: `radial-gradient(circle at 20% 10%, rgba(196,17,1,0.08) 0%, transparent 40%), var(--bg)`, color: "var(--text)" }}
    >
      <div className="top-fade-overlay" />
      <Sidebar theme={theme} toggleTheme={toggleTheme} />

      <main className="flex-1 w-full lg:pl-[220px]">
        <div className="max-w-[720px] mx-auto w-full px-4 md:px-6 lg:px-8 pb-28 pt-2 lg:pt-8 min-h-screen flex flex-col">
          <Header theme={theme} toggleTheme={toggleTheme} />

          {/* Page title + range selector */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
            <div>
              <h1 style={{ fontFamily: "'Anton', sans-serif", fontWeight: 400, fontSize: 30, letterSpacing: "1px", color: "var(--text)", lineHeight: 1 }}>PROGRESS</h1>
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, color: "var(--muted)", marginTop: 2 }}>Pantau perkembangan kesehatanmu</p>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {(["1M", "3M", "6M", "1Y", "ALL"] as DateRange[]).map(r => (
                <button
                  key={r}
                  onClick={() => setDateRange(r)}
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 12, letterSpacing: "1px",
                    padding: "4px 10px", borderRadius: 6, cursor: "pointer", transition: "all 0.2s",
                    backgroundColor: dateRange === r ? "#C41101" : "transparent",
                    color: dateRange === r ? "#fff" : "var(--muted)",
                    border: dateRange === r ? "1px solid #C41101" : "1px solid var(--border-subtle)",
                  }}
                >{r}</button>
              ))}
            </div>
          </div>

          {/* Empty state */}
          {!hasAnyData ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <EmptyState
                icon={<TrendingUp size={28} />}
                title="BELUM ADA DATA PROGRESS"
                description="Upload MCU atau tambah data manual untuk mulai tracking kesehatanmu."
                primaryAction={{ label: "TAMBAH DATA →", onClick: () => setShowModal(true) }}
                secondaryAction={{ label: "Upload MCU", onClick: () => setLocation("/") }}
              />
            </div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">

              {/* Section 1: Health Grade */}
              <div className="app-card">
                {mcuResult?.grade ? (
                  <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
                    <div style={{ textAlign: "center", flexShrink: 0 }}>
                      <div style={{
                        width: 80, height: 80, borderRadius: "50%",
                        backgroundColor: gradeColor(mcuResult.grade),
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: `0 8px 24px ${gradeColor(mcuResult.grade)}40`,
                      }}>
                        <span style={{ fontFamily: "'Anton', sans-serif", fontWeight: 400, fontSize: 44, color: "#fff", lineHeight: 1 }}>{mcuResult.grade}</span>
                      </div>
                      <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, letterSpacing: "2px", color: "var(--muted)", marginTop: 6 }}>HEALTH GRADE</p>
                      <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                        {mcuResult.date ? format(parseISO(mcuResult.date), "d MMM yyyy") : "Terbaru"}
                      </p>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, color: "var(--text-soft)", lineHeight: 1.6, fontStyle: "italic" }}>
                        {mcuResult.summary ?? "Hasil pemeriksaan telah dianalisis."}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--card2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Activity size={24} style={{ color: "var(--muted)" }} />
                    </div>
                    <div>
                      <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, color: "var(--text)" }}>Upload MCU untuk melihat health grade kamu</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Trend Summary Banner */}
              {hasTrendData && (
                <div style={{ background: "var(--card)", borderRadius: 14, padding: "16px 20px", boxShadow: "var(--shadow, 0 2px 8px rgba(0,0,0,0.06))" }}>
                  <div style={{ fontFamily: "'Barlow Condensed'", fontWeight: 900, fontSize: 11, letterSpacing: 1.5, color: "var(--muted)", marginBottom: 12 }}>
                    RINGKASAN TREN · 7 HARI TERAKHIR
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {[
                      avgSleep > 0 && { label: "TIDUR", value: `${avgSleep}j`, icon: <Moon size={14} />, color: "#A855F7", trend: sleepTrend, positiveIsGood: true },
                      avgWaterPct > 0 && { label: "HIDRASI", value: `${avgWaterPct}%`, icon: <Droplets size={14} />, color: "#06B6D4", trend: waterTrend, positiveIsGood: true },
                      avgEnergy > 0 && { label: "ENERGI", value: `${avgEnergy}/10`, icon: <Zap size={14} />, color: "#22C55E", trend: energyTrend, positiveIsGood: true },
                      latest?.weight != null && { label: "BERAT", value: `${latest.weight}kg`, icon: <Activity size={14} />, color: "#C41101", trend: weightTrend, positiveIsGood: false },
                    ].filter(Boolean).map((item) => {
                      if (!item) return null;
                      return (
                        <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--bg)", borderRadius: 10, padding: "8px 12px", flex: "1 0 140px" }}>
                          <div style={{ color: item.color }}>{item.icon}</div>
                          <div>
                            <div style={{ fontFamily: "'Barlow Condensed'", fontWeight: 900, fontSize: 10, letterSpacing: 1.5, color: "var(--muted)" }}>{item.label}</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{item.value}</span>
                              <TrendBadge trend={item.trend} positiveIsGood={item.positiveIsGood} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Section 2: Summary metric cards */}
              {(latest || sleepData.length > 0 || waterData.length > 0 || wellnessData.length > 0) && (
                <div>
                  <div className="section-header" style={{ marginBottom: 10 }}>
                    <h2>METRIK TERKINI</h2>
                    <div className="section-header-line" />
                  </div>
                  <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" }}>
                    {latest?.weight != null && (
                      <MetricCard label="BERAT BADAN" value={latest.weight} unit="kg" accent="#C41101"
                        change={prev?.weight != null ? latest.weight - prev.weight : undefined} changeUnit=" kg"
                        trend={weightTrend} positiveIsGood={false} />
                    )}
                    {latest?.bmi != null && (
                      <MetricCard label="BMI" value={latest.bmi?.toFixed(1)} status={bmiStatus(latest.bmi)} accent="#3B82F6"
                        change={prev?.bmi != null && latest.bmi != null ? latest.bmi - prev.bmi : undefined} changeUnit=""
                        trend={bmiTrend} positiveIsGood={false} />
                    )}
                    {latest?.bodyFat != null && (
                      <MetricCard label="BODY FAT" value={latest.bodyFat} unit="%" status={bfStatus(latest.bodyFat)} accent="#F97316"
                        trend={bfTrend} positiveIsGood={false} />
                    )}
                    {latest?.restingHr != null && (
                      <MetricCard label="RESTING HR" value={latest.restingHr} unit="bpm" status={hrStatus(latest.restingHr)} accent="#EF4444"
                        trend={hrTrend} positiveIsGood={false} />
                    )}
                    {latest?.waist != null && (
                      <MetricCard label="PINGGANG" value={latest.waist} unit="cm" status={waistStatus(latest.waist)} accent="#A855F7"
                        trend={waistTrend} positiveIsGood={false} />
                    )}
                    {latest?.bloodPressureSys != null && (
                      <MetricCard label="BLOOD PRESSURE" value={`${latest.bloodPressureSys}/${latest.bloodPressureDia}`}
                        status={bpStatus(latest.bloodPressureSys, latest.bloodPressureDia)} accent="#06B6D4" />
                    )}
                    {/* Checkin-based metric cards */}
                    {avgSleep > 0 && (
                      <MetricCard label="RATA-RATA TIDUR" value={avgSleep} unit="j" accent="#A855F7"
                        status={sleepQuality(avgSleep)} trend={sleepTrend} positiveIsGood={true} />
                    )}
                    {avgWaterPct > 0 && (
                      <MetricCard label="HIDRASI HARIAN" value={`${avgWaterPct}%`} accent="#06B6D4"
                        status={waterStatus(avgWaterPct)} trend={waterTrend} positiveIsGood={true} />
                    )}
                    {avgEnergy > 0 && (
                      <MetricCard label="LEVEL ENERGI" value={avgEnergy} unit="/10" accent="#22C55E"
                        status={energyStatus(avgEnergy)} trend={energyTrend} positiveIsGood={true} />
                    )}
                  </div>
                </div>
              )}

              {/* Section 3: Health Charts */}
              {(entries.length > 0) && (
                <div>
                  <div className="section-header" style={{ marginBottom: 12 }}>
                    <h2>TREN KESEHATAN</h2>
                    <div className="section-header-line" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ChartCard title="BERAT BADAN" data={filteredEntries} dataKey="weight" unit=" kg" trendKey="weight" />
                    <ChartCard title="BMI" data={filteredEntries} dataKey="bmi"
                      refLines={[{ y: 18.5, label: "18.5" }, { y: 25, label: "25" }, { y: 30, label: "30" }]} trendKey="bmi" />
                    <ChartCard title="BODY FAT %" data={filteredEntries} dataKey="bodyFat" unit="%" trendKey="bodyFat" />
                    <ChartCard title="RESTING HEART RATE" data={filteredEntries} dataKey="restingHr" unit=" bpm" trendKey="restingHr" />
                    <ChartCard title="BLOOD PRESSURE" data={filteredEntries} dataKey="bloodPressureSys" unit=" mmHg"
                      secondKey="bloodPressureDia" secondColor="#3B82F6" secondName="dia mmHg"
                      refLines={[{ y: 120, label: "120" }, { y: 80, label: "80" }]} trendKey="bp" />
                    <ChartCard title="LINGKAR PINGGANG" data={filteredEntries} dataKey="waist" unit=" cm" trendKey="waist" />
                  </div>
                </div>
              )}

              {/* Section 4: Sleep Chart */}
              <div>
                <div className="section-header" style={{ marginBottom: 12 }}>
                  <h2>KUALITAS TIDUR</h2>
                  <div className="section-header-line" />
                </div>
                <div className="app-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <p style={{ fontFamily: "'Barlow Condensed'", fontWeight: 900, fontSize: 11, letterSpacing: 1.5, color: "var(--muted)" }}>KUALITAS TIDUR</p>
                    {sleepData.length > 0 && (
                      <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 14, fontWeight: 700, color: "var(--text)" }}>
                        {sleepData[sleepData.length - 1].hours}j
                      </span>
                    )}
                  </div>
                  {sleepData.length < 1 ? (
                    <div style={{ textAlign: "center", padding: "32px 20px" }}>
                      <Moon size={32} style={{ color: "var(--muted)", opacity: 0.4, margin: "0 auto 8px", display: "block" }} />
                      <div style={{ fontFamily: "'Anton'", fontWeight: 400, fontSize: 15, color: "var(--muted)" }}>BELUM ADA DATA TIDUR</div>
                      <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                        Catat jam tidur kamu di Quick Check-in setiap hari
                      </div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={160}>
                      <ComposedChart data={sleepData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                        <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontFamily: "'Barlow Condensed'", fontSize: 9, fill: "var(--muted)" }} tickLine={false} axisLine={false} />
                        <YAxis domain={[0, 12]} tick={{ fontFamily: "'Barlow Condensed'", fontSize: 9, fill: "var(--muted)" }} tickLine={false} axisLine={false} />
                        <Tooltip content={<SleepTooltip />} />
                        <ReferenceLine y={7} stroke="#22C55E" strokeDasharray="4 4"
                          label={{ value: "Ideal", fill: "#22C55E", fontSize: 9, fontFamily: "'Barlow Condensed'" }} />
                        <ReferenceLine y={9} stroke="#3B82F6" strokeDasharray="4 4"
                          label={{ value: "Max", fill: "#3B82F6", fontSize: 9, fontFamily: "'Barlow Condensed'" }} />
                        <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                          {sleepData.map((entry, i) => (
                            <Cell key={i} fill={
                              entry.hours < 6 ? "#EF4444" :
                              entry.hours < 7 ? "#EAB308" :
                              entry.hours <= 9 ? "#22C55E" : "#3B82F6"
                            } />
                          ))}
                        </Bar>
                      </ComposedChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Section 5: Water Chart */}
              <div>
                <div className="section-header" style={{ marginBottom: 12 }}>
                  <h2>ASUPAN AIR HARIAN</h2>
                  <div className="section-header-line" />
                </div>
                <div className="app-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <p style={{ fontFamily: "'Barlow Condensed'", fontWeight: 900, fontSize: 11, letterSpacing: 1.5, color: "var(--muted)" }}>ASUPAN AIR HARIAN</p>
                    {waterData.length > 0 && (
                      <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 14, fontWeight: 700, color: "#06B6D4" }}>
                        {waterData[waterData.length - 1].liters}L
                      </span>
                    )}
                  </div>
                  {waterData.length < 1 ? (
                    <div style={{ textAlign: "center", padding: "32px 20px" }}>
                      <Droplets size={32} style={{ color: "var(--muted)", opacity: 0.4, margin: "0 auto 8px", display: "block" }} />
                      <div style={{ fontFamily: "'Anton'", fontWeight: 400, fontSize: 15, color: "var(--muted)" }}>BELUM ADA DATA AIR</div>
                      <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                        Catat asupan air di Quick Check-in setiap hari
                      </div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={140}>
                      <AreaChart data={waterData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                        <defs>
                          <linearGradient id="grad-water" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                        <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontFamily: "'Barlow Condensed'", fontSize: 9, fill: "var(--muted)" }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontFamily: "'Barlow Condensed'", fontSize: 9, fill: "var(--muted)" }} tickLine={false} axisLine={false} domain={[0, "auto"]} />
                        <Tooltip content={<WaterTooltip />} />
                        {waterData.length > 0 && (
                          <ReferenceLine y={waterData[waterData.length - 1].target} stroke="#06B6D4" strokeDasharray="4 4"
                            label={{ value: "Target", fill: "#06B6D4", fontSize: 9, fontFamily: "'Barlow Condensed'" }} />
                        )}
                        <Area type="monotone" dataKey="liters" stroke="#06B6D4" strokeWidth={2}
                          fill="url(#grad-water)" dot={{ r: 3, fill: "#06B6D4", strokeWidth: 0 }}
                          activeDot={{ r: 5, fill: "#06B6D4" }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Section 6: Energy & Mood Chart */}
              {wellnessChartData.length > 0 && (
                <div>
                  <div className="section-header" style={{ marginBottom: 12 }}>
                    <h2>ENERGI &amp; MOOD</h2>
                    <div className="section-header-line" />
                  </div>
                  <div className="app-card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <p style={{ fontFamily: "'Barlow Condensed'", fontWeight: 900, fontSize: 11, letterSpacing: 1.5, color: "var(--muted)" }}>ENERGI & MOOD</p>
                      <div style={{ display: "flex", gap: 12 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: "'Barlow Condensed'", fontSize: 11, color: "#22C55E" }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22C55E", display: "inline-block" }} />Energi
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: "'Barlow Condensed'", fontSize: 11, color: "#F97316" }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#F97316", display: "inline-block" }} />Mood ×2
                        </span>
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={130}>
                      <LineChart data={wellnessChartData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                        <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontFamily: "'Barlow Condensed'", fontSize: 9, fill: "var(--muted)" }} tickLine={false} axisLine={false} />
                        <YAxis domain={[0, 10]} tick={{ fontFamily: "'Barlow Condensed'", fontSize: 9, fill: "var(--muted)" }} tickLine={false} axisLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line type="monotone" dataKey="energy" stroke="#22C55E" strokeWidth={2} dot={{ r: 3, fill: "#22C55E", strokeWidth: 0 }} activeDot={{ r: 5 }} connectNulls name="/10" />
                        <Line type="monotone" dataKey="mood" stroke="#F97316" strokeWidth={2} dot={{ r: 3, fill: "#F97316", strokeWidth: 0 }} activeDot={{ r: 5 }} connectNulls name="/10" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Section 7: Workout history */}
              <div>
                <div className="section-header" style={{ marginBottom: 12 }}>
                  <h2>RIWAYAT LATIHAN</h2>
                  <div className="section-header-line" />
                </div>
                {workoutGroups.length === 0 ? (
                  <div className="app-card" style={{ textAlign: "center", padding: "28px 20px" }}>
                    <Dumbbell size={28} style={{ color: "var(--border-subtle)", margin: "0 auto 8px" }} />
                    <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, color: "var(--muted)" }}>
                      Belum ada riwayat latihan. Mulai catat aktivitasmu!
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {workoutGroups.map((group, gi) => (
                      <div key={gi}>
                        <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 11, letterSpacing: "1.5px", color: "var(--muted)", marginBottom: 8 }}>
                          {group.label.toUpperCase()}
                        </p>
                        {group.items.map((w, wi) => {
                          const { icon: WIcon, color: wColor } = workoutIcon(w.type);
                          return (
                            <div key={wi} className="app-card" style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8, padding: "12px 16px" }}>
                              <div style={{ width: 40, height: 40, borderRadius: "50%", backgroundColor: wColor + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <WIcon size={18} style={{ color: wColor }} />
                              </div>
                              <div style={{ flex: 1 }}>
                                <p style={{ fontFamily: "'Anton', sans-serif", fontWeight: 400, fontSize: 14, letterSpacing: "1px", color: "var(--text)" }}>{w.type.toUpperCase()}</p>
                                <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, color: "var(--muted)" }}>
                                  {fmtDate(w.date)}{w.note ? ` · ${w.note}` : ""}
                                </p>
                              </div>
                              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 700, color: "var(--text)" }}>
                                {w.duration}<span style={{ fontSize: 10, color: "var(--muted)", fontFamily: "'Barlow Condensed', sans-serif" }}> min</span>
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 8: MCU Recommendations */}
              {mcuResult?.recommendations && mcuResult.recommendations.length > 0 && (
                <div>
                  <div className="section-header" style={{ marginBottom: 12 }}>
                    <h2>REKOMENDASI MCU</h2>
                    <div className="section-header-line" />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {mcuResult.recommendations.map((rec, i) => {
                      const isPositive = !rec.toLowerCase().includes("hindari") && !rec.toLowerCase().includes("kurangi") && !rec.toLowerCase().includes("waspadai");
                      return (
                        <div key={i} className="app-card" style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 16px" }}>
                          {isPositive
                            ? <CheckCircle size={16} style={{ color: "#16A34A", flexShrink: 0, marginTop: 2 }} />
                            : <AlertCircle size={16} style={{ color: "#D97706", flexShrink: 0, marginTop: 2 }} />}
                          <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, color: "var(--text)", lineHeight: 1.5 }}>{rec}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </main>

      {/* FAB */}
      <button
        onClick={() => setShowModal(true)}
        style={{
          position: "fixed", bottom: 80, right: 20,
          width: 56, height: 56, borderRadius: "50%",
          backgroundColor: "#C41101", color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 8px 24px rgba(196,17,1,0.4)",
          zIndex: 50, cursor: "pointer",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
        }}
        className="lg:bottom-6 lg:right-8"
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1.08)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
        data-testid="fab-add"
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>

      {/* Modal */}
      {showModal && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 60, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end" }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            style={{
              width: "100%", maxWidth: 640, margin: "0 auto",
              background: "var(--card)", borderRadius: "20px 20px 0 0",
              padding: 24, maxHeight: "85vh", overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, letterSpacing: "2px", color: "var(--text)" }}>TAMBAH DATA KESEHATAN</h2>
              <button onClick={() => setShowModal(false)} style={{ color: "var(--muted)", fontSize: 22, background: "none", cursor: "pointer", lineHeight: 1 }}>×</button>
            </div>

            <div style={{ display: "flex", gap: 0, marginBottom: 20, borderRadius: 8, overflow: "hidden", border: "1px solid var(--border-subtle)" }}>
              {(["kesehatan", "latihan"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setModalTab(tab)}
                  style={{
                    flex: 1, padding: "10px", fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: 13, letterSpacing: "2px", cursor: "pointer", transition: "all 0.2s",
                    backgroundColor: modalTab === tab ? "#C41101" : "transparent",
                    color: modalTab === tab ? "#fff" : "var(--muted)",
                    border: "none",
                  }}
                >
                  {tab === "kesehatan" ? "KESEHATAN" : "LATIHAN"}
                </button>
              ))}
            </div>

            {modalTab === "kesehatan" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <span style={labelStyle}>TANGGAL</span>
                  <input type="date" value={fDate} onChange={e => setFDate(e.target.value)} style={inputStyle} />
                </div>
                {(!height || showHeightEdit) && (
                  <div>
                    <span style={labelStyle}>TINGGI BADAN (cm) {!height && <span style={{ color: "#C41101" }}>*</span>}</span>
                    <input type="number" value={fHeightInput} onChange={e => setFHeightInput(e.target.value)} placeholder="170" style={inputStyle} />
                    <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, color: "var(--muted)", marginTop: 3 }}>Digunakan untuk hitung BMI otomatis</p>
                  </div>
                )}
                {height && !showHeightEdit && (
                  <button onClick={() => setShowHeightEdit(true)}
                    style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, color: "#C41101", background: "none", cursor: "pointer", textAlign: "left", textDecoration: "underline" }}>
                    Edit tinggi badan ({height} cm)
                  </button>
                )}
                <div>
                  <span style={labelStyle}>BERAT BADAN (kg)</span>
                  <input type="number" value={fWeight} onChange={e => setFWeight(e.target.value)} placeholder="70.0" step="0.1" style={inputStyle} />
                  {fBmi && fWeight && (
                    <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, color: "#2563EB", marginTop: 3 }}>
                      BMI: {fBmi} ({bmiStatus(parseFloat(fBmi)).label})
                    </p>
                  )}
                </div>
                <div>
                  <span style={labelStyle}>BMI</span>
                  <input type="number" value={fBmi} onChange={e => setFBmi(e.target.value)} placeholder="22.5" step="0.1" style={inputStyle} />
                </div>
                <div>
                  <span style={labelStyle}>BODY FAT (%)</span>
                  <input type="number" value={fBodyFat} onChange={e => setFBodyFat(e.target.value)} placeholder="18.0" step="0.1" style={inputStyle} />
                </div>
                <div>
                  <span style={labelStyle}>RESTING HR (bpm)</span>
                  <input type="number" value={fRestingHr} onChange={e => setFRestingHr(e.target.value)} placeholder="62" style={inputStyle} />
                </div>
                <div>
                  <span style={labelStyle}>LINGKAR PINGGANG (cm)</span>
                  <input type="number" value={fWaist} onChange={e => setFWaist(e.target.value)} placeholder="80" style={inputStyle} />
                </div>
                <div>
                  <span style={labelStyle}>TEKANAN DARAH (mmHg)</span>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input type="number" value={fBpSys} onChange={e => setFBpSys(e.target.value)} placeholder="120" style={{ ...inputStyle, flex: 1 }} />
                    <span style={{ color: "var(--muted)", fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18 }}>/</span>
                    <input type="number" value={fBpDia} onChange={e => setFBpDia(e.target.value)} placeholder="80" style={{ ...inputStyle, flex: 1 }} />
                  </div>
                </div>
                <div>
                  <span style={labelStyle}>CATATAN</span>
                  <textarea value={fNote} onChange={e => setFNote(e.target.value)}
                    placeholder="Kondisi hari ini, perubahan diet, dll" rows={3} style={{ ...inputStyle, resize: "vertical" }} />
                </div>
                <button onClick={saveHealthEntry} style={{ width: "100%", padding: "14px", borderRadius: 8, cursor: "pointer", backgroundColor: "#C41101", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", fontSize: 15, letterSpacing: "2.5px", marginTop: 4 }}>
                  SIMPAN DATA
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <span style={labelStyle}>TANGGAL</span>
                  <input type="date" value={wDate} onChange={e => setWDate(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <span style={labelStyle}>JENIS LATIHAN</span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {workoutTypes.map(t => (
                      <button key={t} onClick={() => setWType(t)} style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 12, letterSpacing: "1px", padding: "5px 12px", borderRadius: 6, cursor: "pointer", transition: "all 0.15s", backgroundColor: wType === t ? "#C41101" : "transparent", color: wType === t ? "#fff" : "var(--muted)", border: wType === t ? "1px solid #C41101" : "1px solid var(--border-subtle)" }}>
                        {t.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <span style={labelStyle}>DURASI (menit)</span>
                  <input type="number" value={wDuration} onChange={e => setWDuration(e.target.value)} placeholder="45" style={inputStyle} />
                </div>
                <div>
                  <span style={labelStyle}>CATATAN</span>
                  <textarea value={wNote} onChange={e => setWNote(e.target.value)} placeholder="Intensitas, lokasi, dll" rows={3} style={{ ...inputStyle, resize: "vertical" }} />
                </div>
                <button onClick={saveWorkout} style={{ width: "100%", padding: "14px", borderRadius: 8, cursor: "pointer", backgroundColor: "#C41101", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", fontSize: 15, letterSpacing: "2.5px", marginTop: 4 }}>
                  SIMPAN LATIHAN
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
