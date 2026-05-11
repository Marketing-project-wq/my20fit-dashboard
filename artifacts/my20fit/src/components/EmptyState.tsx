import type { ReactNode } from "react";

interface ActionSpec {
  label: string;
  onClick: () => void;
}

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  primaryAction?: ActionSpec;
  secondaryAction?: ActionSpec;
  compact?: boolean;
}

export default function EmptyState({
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  compact = false,
}: EmptyStateProps) {
  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: compact ? "24px 16px" : "48px 24px",
      textAlign: "center", gap: 12,
    }}>
      <div style={{
        width: compact ? 48 : 64, height: compact ? 48 : 64,
        borderRadius: "50%", background: "var(--bg)",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 4,
      }}>
        <div style={{ opacity: 0.35, color: "var(--muted)" }}>{icon}</div>
      </div>

      <div style={{
        fontFamily: "'Anton', sans-serif",
        fontSize: compact ? 16 : 20,
        color: "var(--text)", letterSpacing: 0.5, lineHeight: 1.2,
      }}>{title}</div>

      {description && (
        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900,
          fontSize: 13, color: "var(--muted)", maxWidth: 280, lineHeight: 1.5,
        }}>{description}</div>
      )}

      {(primaryAction || secondaryAction) && (
        <div style={{
          display: "flex", flexDirection: "column", gap: 8,
          marginTop: 8, width: "100%", maxWidth: 280,
        }}>
          {primaryAction && (
            <button
              onClick={primaryAction.onClick}
              style={{
                background: "#C41101", color: "#fff", border: "none",
                borderRadius: 12, padding: "12px 24px",
                fontFamily: "'Anton', sans-serif", fontSize: 14, letterSpacing: 1.5,
                cursor: "pointer", width: "100%", transition: "all .2s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = ".85"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
            >{primaryAction.label}</button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              style={{
                background: "transparent", color: "var(--muted)",
                border: "1.5px solid var(--border-subtle, #E5E1D8)",
                borderRadius: 12, padding: "12px 24px",
                fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900,
                fontSize: 14, cursor: "pointer", width: "100%", transition: "all .2s",
              }}
            >{secondaryAction.label}</button>
          )}
        </div>
      )}
    </div>
  );
}
