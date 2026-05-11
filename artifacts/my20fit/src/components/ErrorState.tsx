import { WifiOff, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  compact?: boolean;
}

export default function ErrorState({
  message = "Terjadi kesalahan",
  onRetry,
  compact = false,
}: ErrorStateProps) {
  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", gap: 10,
      padding: compact ? "16px" : "32px 20px",
      background: "var(--card)", borderRadius: 14,
      border: "1px solid rgba(239,68,68,.2)", textAlign: "center",
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: "50%",
        background: "rgba(239,68,68,.1)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <WifiOff size={18} color="#EF4444" />
      </div>

      <div>
        <div style={{
          fontFamily: "'Anton', sans-serif",
          fontSize: 14, color: "var(--text)", marginBottom: 4,
        }}>GAGAL MEMUAT</div>
        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900,
          fontSize: 12, color: "var(--muted)", lineHeight: 1.4,
        }}>{message}</div>
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "transparent",
            border: "1.5px solid var(--border-subtle, #E5E1D8)",
            borderRadius: 10, padding: "8px 16px",
            fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900,
            fontSize: 13, color: "var(--text)", cursor: "pointer", transition: "all .2s",
          }}
        >
          <RefreshCw size={12} />
          COBA LAGI
        </button>
      )}
    </div>
  );
}
