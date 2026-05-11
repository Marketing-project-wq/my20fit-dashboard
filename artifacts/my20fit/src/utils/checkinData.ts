export interface SleepEntry {
  date: string;
  hours: number;
  bed: string;
  wake: string;
}

export interface WaterEntry {
  date: string;
  liters: number;
  cups: number;
  target: number;
  pct: number;
}

export interface WellnessEntry {
  date: string;
  mood: number | null;
  energy: number | null;
  stress: number | null;
  soreness: string | null;
}

export interface TrendResult {
  direction: "up" | "down" | "stable" | "same";
  diff: string;
  pct: number;
  slope?: string;
  latest?: number;
  previous?: number;
}

function computeSleepHours(bed: string, wake: string): number {
  const [bH, bM] = bed.split(":").map(Number);
  const [wH, wM] = wake.split(":").map(Number);
  let mins = (wH * 60 + wM) - (bH * 60 + bM);
  if (mins < 0) mins += 24 * 60;
  return parseFloat((mins / 60).toFixed(1));
}

export function getSleepHistory(days = 30): SleepEntry[] {
  const result: SleepEntry[] = [];
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    const saved = localStorage.getItem(`my20fit_sleep_${dateStr}`);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.bed && data.wake) {
          result.push({
            date: dateStr,
            hours: computeSleepHours(data.bed, data.wake),
            bed: data.bed,
            wake: data.wake,
          });
        }
      } catch { /* ignore */ }
    }
  }
  return result.reverse();
}

export function getWaterHistory(days = 30): WaterEntry[] {
  const result: WaterEntry[] = [];
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    const saved = localStorage.getItem(`my20fit_water_${dateStr}`);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        const totalMl = (data.logs || []).reduce((sum: number, l: { ml: number }) => sum + l.ml, 0);
        const totalL = parseFloat((totalMl / 1000).toFixed(2));
        const target = data.weight ? parseFloat((data.weight * 0.033).toFixed(1)) : 2.5;
        result.push({
          date: dateStr,
          liters: totalL,
          cups: (data.logs || []).reduce((sum: number, l: { cups: number }) => sum + l.cups, 0),
          target,
          pct: Math.round((totalL / target) * 100),
        });
      } catch { /* ignore */ }
    }
  }
  return result.reverse();
}

export function getWellnessHistory(days = 30): WellnessEntry[] {
  const result: WellnessEntry[] = [];
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    const saved = localStorage.getItem(`my20fit_wellness_${dateStr}`);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        result.push({
          date: dateStr,
          mood: data.mood ?? null,
          energy: data.energy ?? null,
          stress: data.stress ?? null,
          soreness: data.soreness ?? null,
        });
      } catch { /* ignore */ }
    }
  }
  return result.reverse();
}

export function calculateTrend<T extends { date: string }>(
  dataArray: T[],
  valueKey: keyof T,
): TrendResult | null {
  if (!dataArray || dataArray.length < 2) return null;
  const sorted = [...dataArray].sort((a, b) => a.date.localeCompare(b.date));
  const latest = Number(sorted[sorted.length - 1][valueKey]);
  const previous = Number(sorted[sorted.length - 2][valueKey]);
  if (!latest || !previous || isNaN(latest) || isNaN(previous)) return null;
  const diff = latest - previous;
  const pct = Math.abs(Math.round((diff / previous) * 100));
  return {
    direction: diff > 0 ? "up" : diff < 0 ? "down" : "same",
    diff: Math.abs(diff).toFixed(1),
    pct,
    latest,
    previous,
  };
}

export function getMultiPointTrend<T extends { date: string }>(
  dataArray: T[],
  valueKey: keyof T,
  points = 7,
): TrendResult | null {
  if (!dataArray || dataArray.length < 2) return null;
  const sorted = [...dataArray]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-points);
  if (sorted.length < 2) return null;
  const first = Number(sorted[0][valueKey]);
  const last = Number(sorted[sorted.length - 1][valueKey]);
  if (isNaN(first) || isNaN(last) || first === 0) return null;
  const diff = last - first;
  const pct = Math.abs(Math.round((diff / first) * 100));
  const n = sorted.length;
  const xMean = (n - 1) / 2;
  const yMean = sorted.reduce((s, d) => s + Number(d[valueKey]), 0) / n;
  const slopeNumer = sorted.reduce((s, d, i) => s + (i - xMean) * (Number(d[valueKey]) - yMean), 0);
  const slopeDenom = sorted.reduce((s, _d, i) => s + Math.pow(i - xMean, 2), 0);
  const slope = slopeDenom !== 0 ? slopeNumer / slopeDenom : 0;
  return {
    direction: slope > 0.05 ? "up" : slope < -0.05 ? "down" : "stable",
    diff: Math.abs(diff).toFixed(1),
    pct,
    slope: slope.toFixed(3),
  };
}
