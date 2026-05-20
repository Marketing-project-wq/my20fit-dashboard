import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { Check, AlertCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

const CONFIGS: Record<ToastType, { icon: ReactNode; iconBg: string; borderColor: string }> = {
  success: { icon: <Check size={12} color="#fff" />, iconBg: "#16A34A", borderColor: "rgba(22,163,74,.2)" },
  error:   { icon: <AlertCircle size={12} color="#fff" />, iconBg: "#EF4444", borderColor: "rgba(239,68,68,.2)" },
  info:    { icon: <Info size={12} color="#fff" />, iconBg: "#3B82F6", borderColor: "rgba(59,130,246,.2)" },
};

function ToastItem({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const cfg = CONFIGS[item.type];

  useEffect(() => {
    const t = setTimeout(onDismiss, 2500);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div style={{
      position: "fixed", bottom: 80, left: "50%",
      transform: "translateX(-50%)",
      display: "inline-flex", alignItems: "center", gap: 10,
      background: "rgba(10,10,10,.92)",
      border: `1px solid ${cfg.borderColor}`,
      backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
      borderRadius: 99, padding: "10px 16px 10px 10px",
      zIndex: 500, whiteSpace: "nowrap",
      boxShadow: "0 8px 32px rgba(0,0,0,.3)",
      animation: "toastSlideUp .4s cubic-bezier(.34,1.56,.64,1) both",
    }}>
      <div style={{
        width: 22, height: 22, borderRadius: "50%",
        background: cfg.iconBg,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>{cfg.icon}</div>
      <span style={{
        fontFamily: "Inter, sans-serif",
        fontWeight: 900, fontSize: 13, color: "#fff",
      }}>{item.message}</span>
      <button
        onClick={onDismiss}
        style={{
          background: "none", border: "none",
          color: "rgba(255,255,255,.4)",
          cursor: "pointer", padding: "0 0 0 4px",
          display: "flex", alignItems: "center",
        }}
      ><X size={12} /></button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev.slice(-2), { id, message, type }]);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.map(toast => (
        <ToastItem key={toast.id} item={toast} onDismiss={() => dismissToast(toast.id)} />
      ))}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
