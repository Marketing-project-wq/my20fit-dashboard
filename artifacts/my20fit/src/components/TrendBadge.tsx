import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { TrendResult } from "@/utils/checkinData";

interface TrendBadgeProps {
  trend: TrendResult | null | undefined;
  positiveIsGood?: boolean;
}

export default function TrendBadge({ trend, positiveIsGood = true }: TrendBadgeProps) {
  if (!trend || trend.direction === "same" || trend.direction === "stable") {
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 3,
        fontFamily: "'Barlow Condensed'",
        fontSize: 12, color: "var(--muted)",
      }}>
        <Minus size={12} /> Stabil
      </span>
    );
  }

  const isGood = positiveIsGood
    ? trend.direction === "up"
    : trend.direction === "down";

  const color = isGood ? "#22C55E" : "#EF4444";
  const Icon = trend.direction === "up" ? TrendingUp : TrendingDown;

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      background: color + "15",
      color,
      padding: "3px 8px", borderRadius: 99,
      fontFamily: "'Barlow Condensed'",
      fontSize: 12, fontWeight: 600,
    }}>
      <Icon size={12} />
      {trend.direction === "up" ? "+" : "-"}{trend.diff}
      <span style={{ opacity: 0.7 }}>({trend.pct}%)</span>
    </span>
  );
}
