import { useEffect } from "react";
import { X } from "lucide-react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.5)",
          zIndex: 200,
          animation: "bseFadeIn .2s ease",
        }}
      />
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "var(--card)",
        borderRadius: "20px 20px 0 0",
        padding: "0 20px 40px",
        zIndex: 201,
        maxHeight: "85vh",
        overflowY: "auto",
        animation: "bseSlideUp .3s cubic-bezier(.22,1,.36,1)",
      }}>
        <div style={{
          width: 40, height: 4,
          background: "var(--border-subtle, #E5E1D8)",
          borderRadius: 99, margin: "12px auto 20px",
        }} />
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: 20,
        }}>
          <div style={{
            fontFamily: "'Bebas Neue'",
            fontSize: 22, letterSpacing: 1,
            color: "var(--text)",
          }}>{title}</div>
          <button onClick={onClose} style={{
            background: "none", border: "none",
            cursor: "pointer", color: "var(--muted)",
            padding: 4, display: "flex", alignItems: "center",
          }}>
            <X size={20} />
          </button>
        </div>
        {children}
      </div>

      <style>{`
        @keyframes bseFadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes bseSlideUp {
          from { transform: translateY(100%) }
          to   { transform: translateY(0) }
        }
      `}</style>
    </>
  );
}
