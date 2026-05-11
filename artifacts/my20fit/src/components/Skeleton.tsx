import type { CSSProperties } from "react";

interface SkeletonBlockProps {
  width?: string | number;
  height?: number;
  borderRadius?: number;
  style?: CSSProperties;
}

export function SkeletonBlock({
  width = "100%",
  height = 16,
  borderRadius = 8,
  style = {},
}: SkeletonBlockProps) {
  return (
    <div style={{
      width,
      height,
      borderRadius,
      background: "linear-gradient(90deg, var(--bg) 25%, var(--border-subtle, #E5E1D8) 50%, var(--bg) 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.5s infinite",
      ...style,
    }} />
  );
}

export function SkeletonCard({ rows = 3 }: { rows?: number }) {
  return (
    <div style={{
      background: "var(--card)", borderRadius: 14, padding: "18px 20px",
      boxShadow: "var(--shadow)", display: "flex", flexDirection: "column", gap: 10,
    }}>
      <SkeletonBlock height={12} width="40%" />
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonBlock key={i} height={14} width={i === rows - 1 ? "60%" : "100%"} />
      ))}
    </div>
  );
}

export function SkeletonMetric() {
  return (
    <div style={{
      background: "var(--card)", borderRadius: 14, padding: "16px",
      boxShadow: "var(--shadow)", display: "flex", flexDirection: "column", gap: 8,
    }}>
      <SkeletonBlock height={10} width="50%" />
      <SkeletonBlock height={32} width="70%" />
      <SkeletonBlock height={10} width="40%" />
    </div>
  );
}
