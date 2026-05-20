export interface FatigueValues {
  legs: number;
  back: number;
  arms: number;
  core: number;
}

export function computeOverallFatigue({ legs, back, arms, core }: FatigueValues): number {
  return Math.round((legs + back + arms + core) / 4);
}

export function getFatigueLabel(value: number): string {
  if (value >= 70) return "Lelah";
  if (value >= 40) return "Sedang";
  return "Fresh";
}

export function getFatigueColor(value: number): string {
  if (value >= 70) return "#ff4444";
  if (value >= 40) return "#ffaa44";
  return "#44ff88";
}

export interface FatiguePreset {
  id: string;
  label: string;
  emoji: string;
  values: FatigueValues;
}

export const FATIGUE_PRESETS: FatiguePreset[] = [
  { id: "fresh",     label: "Fresh seharian",   emoji: "😎", values: { legs: 10, back: 10, arms: 10, core: 10 } },
  { id: "leg_day",   label: "Habis leg day",    emoji: "🦵", values: { legs: 85, back: 30, arms: 20, core: 50 } },
  { id: "pull_day",  label: "Habis pull day",   emoji: "💪", values: { legs: 20, back: 85, arms: 75, core: 30 } },
  { id: "push_day",  label: "Habis push day",   emoji: "🏋️", values: { legs: 20, back: 35, arms: 80, core: 50 } },
  { id: "full_body", label: "Habis full body",  emoji: "🔥", values: { legs: 70, back: 70, arms: 65, core: 70 } },
  { id: "rest_day",  label: "Rest day",         emoji: "🧘", values: { legs: 25, back: 20, arms: 20, core: 15 } },
];

export interface MuscleArea {
  id: keyof FatigueValues;
  label: string;
  emoji: string;
}

export const MUSCLE_AREAS: MuscleArea[] = [
  { id: "legs", label: "KAKI",     emoji: "🦵" },
  { id: "back", label: "PUNGGUNG", emoji: "💪" },
  { id: "arms", label: "LENGAN",   emoji: "🏋️" },
  { id: "core", label: "CORE",     emoji: "🔥" },
];
