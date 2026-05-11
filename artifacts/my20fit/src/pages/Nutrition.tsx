import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  RefreshCw, Droplets, AlertTriangle, Info,
  X, ChevronDown, UtensilsCrossed, Pill,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import Header from "@/components/Header";
import EmptyState from "@/components/EmptyState";
import { SkeletonCard } from "@/components/Skeleton";
import ErrorState from "@/components/ErrorState";
import { useToast } from "@/contexts/ToastContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NutritionSuggestion {
  name: string;
  portion: string;
  calories?: number;
  tags?: string[];
}

interface NutritionMeal {
  time: string;
  time_range: string;
  emoji: string;
  suggestions: NutritionSuggestion[];
  avoid?: string[];
  reason?: string;
}

interface NutritionRecommendation {
  date: string;
  overall_goal: string;
  calorie_estimate?: {
    target: number;
    breakdown?: { protein: string; carbs: string; fat: string };
    note?: string;
  };
  meals: NutritionMeal[];
  hydration?: {
    target_l: number;
    current_l: number;
    remaining_l: number;
    reminder: string;
  };
  supplements?: { name: string; dose: string; timing: string; reason: string }[];
  foods_to_avoid_today?: { food: string; reason: string }[];
  insight?: string;
}

// ─── Data Collection ──────────────────────────────────────────────────────────

function collectUserData() {
  const today = new Date().toISOString().split("T")[0];

  const mcuRaw = localStorage.getItem("my20fit_mcu_result");
  const mcuData = mcuRaw ? JSON.parse(mcuRaw) : null;

  const wellnessRaw = localStorage.getItem(`my20fit_wellness_${today}`);
  const wellnessData = wellnessRaw ? JSON.parse(wellnessRaw) : null;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yKey = yesterday.toISOString().split("T")[0];
  const sleepRaw =
    localStorage.getItem(`my20fit_sleep_${yKey}`) ||
    localStorage.getItem(`my20fit_sleep_${today}`);
  let sleepData = sleepRaw ? JSON.parse(sleepRaw) : null;
  if (sleepData?.bed && sleepData?.wake) {
    const [bH, bM] = sleepData.bed.split(":").map(Number);
    const [wH, wM] = sleepData.wake.split(":").map(Number);
    let mins = (wH * 60 + wM) - (bH * 60 + bM);
    if (mins < 0) mins += 24 * 60;
    const hours = parseFloat((mins / 60).toFixed(1));
    const quality = hours < 6 ? "Kurang Sekali" : hours < 7 ? "Kurang" : hours <= 9 ? "Ideal" : "Terlalu Banyak";
    sleepData = { ...sleepData, hours, quality };
  }

  const waterRaw = localStorage.getItem(`my20fit_water_${today}`);
  let waterData = null;
  if (waterRaw) {
    const w = JSON.parse(waterRaw);
    const totalMl = (w.logs || []).reduce((s: number, l: { ml: number }) => s + l.ml, 0);
    const totalL = parseFloat((totalMl / 1000).toFixed(2));
    const target = w.weight ? parseFloat((w.weight * 0.033).toFixed(1)) : 2.5;
    waterData = { ...w, totalL, target };
  }

  const workoutsRaw = localStorage.getItem("my20fit_workouts");
  const allWorkouts = workoutsRaw ? JSON.parse(workoutsRaw) : [];
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const workoutData = allWorkouts.filter((w: { date: string }) => new Date(w.date) >= weekAgo);

  return { mcuData, wellnessData, sleepData, waterData, workoutData };
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Nutrition({ theme, toggleTheme }: { theme: string; toggleTheme: () => void }) {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<NutritionRecommendation | null>(null);
  const [cachedTimestamp, setCachedTimestamp] = useState<number | null>(null);
  const [expandedMeal, setExpandedMeal] = useState<number | null>(null);

  const userData = collectUserData();
  const hasAnyData = !!(userData.mcuData || userData.wellnessData || userData.sleepData || userData.waterData);

  const { showToast } = useToast();

  const generateRecommendation = useCallback(async (forceRefresh = false) => {
    const today = new Date().toISOString().split("T")[0];
    const cacheKey = `my20fit_food_${today}`;

    if (!forceRefresh) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < 3 * 60 * 60 * 1000) {
            setRecommendation(data);
            setCachedTimestamp(timestamp);
            return;
          }
        } catch { /* ignore bad cache */ }
      }
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/nutrition-recommendation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(collectUserData()),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);

      const now = Date.now();
      localStorage.setItem(cacheKey, JSON.stringify({ data: result.data, timestamp: now }));
      setRecommendation(result.data);
      setCachedTimestamp(now);
      showToast("Rekomendasi nutrisi diperbarui ✓");
    } catch {
      setError("Gagal memuat rekomendasi. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    generateRecommendation(false);
  }, [generateRecommendation]);

  const currentHour = new Date().getHours();
  const currentMealIndex =
    currentHour < 10 ? 0 :
    currentHour < 14 ? 1 :
    currentHour < 17 ? 2 : 3;

  return (
    <div
      className="min-h-screen w-full flex"
      style={{ background: `radial-gradient(circle at 20% 10%, rgba(196,17,1,0.06) 0%, transparent 40%), var(--bg)`, color: "var(--text)" }}
    >
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin-anim { animation: spin 0.7s linear infinite; }
        .spin-slow { animation: spin 1s linear infinite; }
      `}</style>

      <div className="top-fade-overlay" />
      <Sidebar theme={theme} toggleTheme={toggleTheme} />

      <main className="flex-1 w-full lg:pl-[220px]">
        <div className="max-w-[720px] mx-auto w-full px-4 md:px-6 lg:px-8 pb-28 pt-2 lg:pt-8 min-h-screen">
          <Header theme={theme} toggleTheme={toggleTheme} />

          {/* Page Header */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
              <div>
                <div style={{ fontFamily: "'Anton'", fontWeight: 400, fontSize: 30, letterSpacing: 0.5, color: "var(--text)" }}>
                  NUTRISI HARIAN
                </div>
                <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 14, color: "var(--muted)" }}>
                  {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}
                </div>
              </div>

              <button
                onClick={() => generateRecommendation(true)}
                disabled={loading}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "8px 14px", background: "transparent",
                  border: "1.5px solid var(--border-subtle, #E5E1D8)",
                  borderRadius: 10, cursor: loading ? "not-allowed" : "pointer",
                  fontFamily: "'Barlow Condensed'", fontSize: 12, letterSpacing: 1.5,
                  color: "var(--muted)", transition: "all .2s",
                }}
              >
                <RefreshCw size={14} className={loading ? "spin-slow" : ""} />
                {loading ? "GENERATING..." : "REFRESH"}
              </button>
            </div>

            {!userData.mcuData && (
              <div style={{
                background: "#FEF3C7", border: "1px solid #FCD34D",
                borderRadius: 12, padding: "12px 16px",
                display: "flex", gap: 10, alignItems: "flex-start", marginTop: 12,
              }}>
                <AlertTriangle size={16} color="#D97706" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 12, letterSpacing: 1.5, color: "#92400E", marginBottom: 2 }}>
                    REKOMENDASI UMUM
                  </div>
                  <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 12, color: "#78350F", lineHeight: 1.4 }}>
                    Upload hasil MCU untuk rekomendasi yang lebih personal berdasarkan kondisi kesehatanmu.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Empty state — no data at all */}
          {!hasAnyData && !loading && !recommendation && !error && (
            <EmptyState
              icon={<UtensilsCrossed size={28} />}
              title="BELUM ADA DATA"
              description="Lengkapi data kesehatanmu untuk mendapatkan rekomendasi nutrisi yang personal."
              primaryAction={{ label: "UPLOAD MCU DULU →", onClick: () => setLocation("/") }}
              secondaryAction={{ label: "Generate dengan data umum", onClick: () => generateRecommendation(true) }}
            />
          )}

          {/* Loading state */}
          {loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <SkeletonCard rows={2} />
              {[1,2,3,4].map(i => <SkeletonCard key={i} rows={3} />)}
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <ErrorState
              message={error}
              onRetry={() => generateRecommendation(true)}
            />
          )}

          {/* Recommendation content */}
          {recommendation && !loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">

              {/* Last updated */}
              {cachedTimestamp && (
                <div style={{ fontFamily: "'Barlow Condensed'", fontWeight: 900, fontSize: 11, color: "var(--muted)", textAlign: "right" }}>
                  Diperbarui: {new Date(cachedTimestamp).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} · Cache berlaku 3 jam
                </div>
              )}

              {/* Section 1: Goal + Calories */}
              <div style={{ background: "linear-gradient(135deg, #0A0908 0%, #1A1A0F 100%)", borderRadius: 16, padding: 20 }}>
                <div style={{ fontFamily: "'Barlow Condensed'", fontWeight: 900, fontSize: 11, letterSpacing: 1.5, color: "rgba(255,255,255,.45)", marginBottom: 6 }}>
                  GOAL NUTRISI HARI INI
                </div>
                <div style={{ fontFamily: "'Barlow Condensed'", fontWeight: 900, fontSize: 15, fontStyle: "italic", color: "#fff", marginBottom: 20, lineHeight: 1.4 }}>
                  {recommendation.overall_goal}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
                  {[
                    { label: "KALORI", value: recommendation.calorie_estimate?.target, unit: "kcal", color: "#FFD700" },
                    { label: "PROTEIN", value: recommendation.calorie_estimate?.breakdown?.protein, unit: "", color: "#C41101" },
                    { label: "KARBO", value: recommendation.calorie_estimate?.breakdown?.carbs, unit: "", color: "#3B82F6" },
                    { label: "LEMAK", value: recommendation.calorie_estimate?.breakdown?.fat, unit: "", color: "#22C55E" },
                  ].map(item => (
                    <div key={item.label} style={{ textAlign: "center" }}>
                      <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 16, fontWeight: 700, color: item.color, lineHeight: 1 }}>
                        {item.value ?? "—"}
                      </div>
                      <div style={{ fontFamily: "'Barlow Condensed'", fontWeight: 900, fontSize: 9, letterSpacing: 1.5, color: "rgba(255,255,255,.4)", marginTop: 3 }}>
                        {item.label}
                      </div>
                    </div>
                  ))}
                </div>

                {recommendation.insight && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,.1)", fontFamily: "'Barlow Condensed'", fontSize: 12, color: "rgba(255,255,255,.55)", lineHeight: 1.5, fontStyle: "italic" }}>
                    💡 {recommendation.insight}
                  </div>
                )}
              </div>

              {/* Section 2: Hydration */}
              {recommendation.hydration && (
                <div style={{ background: "var(--card)", borderRadius: 14, padding: "16px 20px", boxShadow: "var(--shadow, 0 2px 8px rgba(0,0,0,0.06))" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "'Barlow Condensed'", fontWeight: 900, fontSize: 11, letterSpacing: 1.5, color: "var(--muted)" }}>
                      <Droplets size={14} color="#06B6D4" />
                      HIDRASI HARI INI
                    </div>
                    <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 16, fontWeight: 700, color: "#06B6D4" }}>
                      {recommendation.hydration.current_l}L / {recommendation.hydration.target_l}L
                    </span>
                  </div>

                  <div style={{ height: 8, background: "var(--bg)", borderRadius: 99, overflow: "hidden", marginBottom: 8 }}>
                    <div style={{
                      height: "100%",
                      width: `${Math.min(100, (recommendation.hydration.current_l / recommendation.hydration.target_l) * 100)}%`,
                      background: "#06B6D4", borderRadius: 99, transition: "width .6s ease",
                    }} />
                  </div>

                  <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 12, color: "var(--muted)", lineHeight: 1.4 }}>
                    {recommendation.hydration.reminder}
                  </div>
                </div>
              )}

              {/* Section 3: Meal cards */}
              <div>
                <p className="section-header">REKOMENDASI MAKAN</p>
                {recommendation.meals.map((meal, index) => {
                  const isCurrent = index === currentMealIndex;
                  const isExpanded = expandedMeal === index;
                  return (
                    <div
                      key={meal.time}
                      style={{
                        background: "var(--card)",
                        borderRadius: 14,
                        border: isCurrent ? "2px solid #C41101" : "1px solid transparent",
                        boxShadow: isCurrent ? "0 0 0 4px rgba(196,17,1,.06)" : "var(--shadow, 0 2px 8px rgba(0,0,0,0.05))",
                        marginBottom: 12, overflow: "hidden", transition: "all .2s",
                      }}
                    >
                      {/* Meal header */}
                      <div
                        style={{ padding: "14px 16px 12px", borderBottom: "0.5px solid var(--border-subtle, #E5E1D8)", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                        onClick={() => setExpandedMeal(isExpanded ? null : index)}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 24 }}>{meal.emoji}</span>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontFamily: "'Anton'", fontWeight: 400, fontSize: 16, letterSpacing: 0.5, color: "var(--text)" }}>{meal.time}</span>
                              {isCurrent && (
                                <span style={{ background: "#C41101", color: "#fff", fontFamily: "'Barlow Condensed'", fontSize: 9, letterSpacing: 1.5, padding: "2px 8px", borderRadius: 99 }}>
                                  SEKARANG
                                </span>
                              )}
                            </div>
                            <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 11, color: "var(--muted)" }}>{meal.time_range}</div>
                          </div>
                        </div>
                        <ChevronDown size={16} color="var(--muted)" style={{ transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
                      </div>

                      {/* Suggestions — always visible */}
                      <div style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {meal.suggestions.map((s, i) => (
                            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                              <div>
                                <span style={{ fontFamily: "'Anton'", fontWeight: 400, fontSize: 14, color: "var(--text)" }}>{s.name}</span>
                                <span style={{ fontFamily: "'Barlow Condensed'", fontSize: 12, color: "var(--muted)", marginLeft: 6 }}>{s.portion}</span>
                                {s.tags?.map(tag => (
                                  <span key={tag} style={{ display: "inline-block", background: "rgba(196,17,1,.08)", color: "#C41101", fontFamily: "'Barlow Condensed'", fontSize: 9, letterSpacing: 1, padding: "2px 6px", borderRadius: 4, marginLeft: 6 }}>
                                    {tag}
                                  </span>
                                ))}
                              </div>
                              {s.calories != null && (
                                <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 12, fontWeight: 700, color: "var(--muted)", flexShrink: 0 }}>
                                  {s.calories}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Expandable: avoid + reason */}
                      {isExpanded && (
                        <div style={{ padding: "0 16px 14px", borderTop: "0.5px solid var(--border-subtle, #E5E1D8)" }}>
                          {meal.avoid && meal.avoid.length > 0 && (
                            <div style={{ marginTop: 12 }}>
                              <div style={{ fontFamily: "'Barlow Condensed'", fontWeight: 900, fontSize: 10, letterSpacing: 1.5, color: "#EF4444", marginBottom: 6 }}>HINDARI</div>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                {meal.avoid.map((a, i) => (
                                  <span key={i} style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(239,68,68,.08)", color: "#EF4444", fontFamily: "'Barlow Condensed'", fontSize: 12, padding: "4px 10px", borderRadius: 99 }}>
                                    <X size={10} />{a}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {meal.reason && (
                            <div style={{ marginTop: 10, background: "var(--bg)", borderRadius: 8, padding: "10px 12px", display: "flex", gap: 8 }}>
                              <Info size={14} color="var(--muted)" style={{ flexShrink: 0, marginTop: 2 }} />
                              <span style={{ fontFamily: "'Barlow Condensed'", fontSize: 12, color: "var(--muted)", lineHeight: 1.4 }}>{meal.reason}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Section 4: Foods to avoid today */}
              {recommendation.foods_to_avoid_today && recommendation.foods_to_avoid_today.length > 0 && (
                <div style={{ background: "var(--card)", borderRadius: 14, padding: "16px 20px", boxShadow: "var(--shadow, 0 2px 8px rgba(0,0,0,0.05))" }}>
                  <div style={{ fontFamily: "'Barlow Condensed'", fontWeight: 900, fontSize: 11, letterSpacing: 1.5, color: "#EF4444", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                    <AlertTriangle size={12} />
                    HINDARI HARI INI
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {recommendation.foods_to_avoid_today.map((item, i) => (
                      <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(239,68,68,.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <X size={14} color="#EF4444" />
                        </div>
                        <div>
                          <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{item.food}</div>
                          <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{item.reason}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section 5: Supplements */}
              {recommendation.supplements && recommendation.supplements.length > 0 && (
                <div style={{ background: "var(--card)", borderRadius: 14, padding: "16px 20px", boxShadow: "var(--shadow, 0 2px 8px rgba(0,0,0,0.05))" }}>
                  <div style={{ fontFamily: "'Barlow Condensed'", fontWeight: 900, fontSize: 11, letterSpacing: 1.5, color: "var(--muted)", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                    <Pill size={12} />
                    SUPLEMEN REKOMENDASI
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {recommendation.supplements.map((s, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                        <div>
                          <div style={{ fontFamily: "'Anton'", fontWeight: 400, fontSize: 14, color: "var(--text)" }}>{s.name}</div>
                          <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 12, color: "var(--muted)" }}>{s.reason}</div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ fontFamily: "'JetBrains Mono'", fontWeight: 700, fontSize: 12, color: "#C41101" }}>{s.dose}</div>
                          <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 11, color: "var(--muted)" }}>{s.timing}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 12, fontFamily: "'Barlow Condensed'", fontSize: 11, color: "var(--muted)", fontStyle: "italic" }}>
                    * Konsultasikan dengan dokter sebelum mengonsumsi suplemen
                  </div>
                </div>
              )}

              {/* Section 6: Disclaimer */}
              <div style={{ padding: "12px 16px", background: "var(--bg)", borderRadius: 10, marginBottom: 8 }}>
                <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 11, color: "var(--muted)", lineHeight: 1.5, textAlign: "center" }}>
                  🤖 Rekomendasi ini dibuat oleh AI berdasarkan data kesehatanmu.
                  Bukan pengganti saran dokter atau ahli gizi.
                  Selalu konsultasikan perubahan diet signifikan dengan tenaga medis.
                </div>
              </div>

            </motion.div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
