import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, RotateCcw, AlertCircle } from "lucide-react";

interface McuMetric {
  label: string;
  value: string;
  status: "ok" | "high" | "low" | "warning";
  note: string;
}

interface McuResult {
  summary: string;
  grade: "A" | "B" | "C" | "D";
  metrics: McuMetric[];
  recommendations: string[];
  checklist: unknown[];
  doctor_notes: string;
  reviewed_at: string;
}

type State = "empty" | "uploading" | "success" | "error";

const gradeColor: Record<string, string> = {
  A: "#22C55E",
  B: "#3B82F6",
  C: "#F97316",
  D: "#C41101",
};

const statusBadge: Record<string, { bg: string; text: string; label: string }> = {
  ok: { bg: "rgba(34,197,94,0.12)", text: "#22C55E", label: "OK" },
  high: { bg: "rgba(249,115,22,0.12)", text: "#F97316", label: "HIGH" },
  low: { bg: "rgba(59,130,246,0.12)", text: "#3B82F6", label: "LOW" },
  warning: { bg: "rgba(196,17,1,0.12)", text: "#C41101", label: "!" },
};

export default function MedicalCheckup() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<State>("empty");
  const [result, setResult] = useState<McuResult | null>(null);
  const [error, setError] = useState<string>("");
  const [progress, setProgress] = useState(0);

  // Load saved MCU result from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("my20fit_mcu_result");
      if (saved) {
        setResult(JSON.parse(saved));
        setState("success");
      }
    } catch {
      // ignore
    }
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so same file can be re-selected
    e.target.value = "";

    setState("uploading");
    setProgress(0);

    // Animate progress bar
    const interval = setInterval(() => {
      setProgress((p) => Math.min(p + Math.random() * 15, 88));
    }, 400);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/analyze-mcu", {
        method: "POST",
        body: formData,
      });

      clearInterval(interval);
      setProgress(100);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server error (${res.status})`);
      }

      const data: McuResult = await res.json();

      // Save to localStorage
      localStorage.setItem("my20fit_mcu_result", JSON.stringify(data));

      // Dispatch event for other components
      window.dispatchEvent(new CustomEvent("mcu-analyzed", { detail: data }));

      setResult(data);
      setState("success");
    } catch (err) {
      clearInterval(interval);
      setError(err instanceof Error ? err.message : "Upload failed");
      setState("error");
    }
  };

  const handleClear = () => {
    localStorage.removeItem("my20fit_mcu_result");
    setResult(null);
    setState("empty");
    setProgress(0);
    setError("");
  };

  return (
    <div className="mb-8" data-testid="section-mcu">
      <div className="section-header">
        <h2>MEDICAL CHECKUP</h2>
        {state === "success" && (
          <button
            onClick={handleClear}
            className="flex items-center gap-1 transition-opacity hover:opacity-70"
            style={{
              fontFamily: "'Barlow Condensed', system-ui",
              fontSize: "12px",
              color: "var(--muted)",
            }}
            data-testid="button-upload-new-mcu"
          >
            <RotateCcw size={11} />
            Upload baru
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.pdf"
        className="hidden"
        onChange={handleFileSelect}
        data-testid="input-mcu-file"
      />

      <AnimatePresence mode="wait">

        {/* ── EMPTY STATE ── */}
        {state === "empty" && (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="app-card flex flex-col items-center text-center !p-8"
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: "var(--card2)" }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--red)" }}>
                <path d="M14 14l-4-4" /><path d="M19 9l-4-4" /><path d="M9 19l-4-4" /><path d="M10 10l4 4" />
                <rect width="20" height="20" x="2" y="2" rx="4" />
              </svg>
            </div>

            <h3
              className="mb-2"
              style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "20px", letterSpacing: "1px", color: "var(--text)" }}
            >
              No MCU on file yet
            </h3>
            <p
              className="mb-6 max-w-[280px]"
              style={{ fontFamily: "'Barlow Condensed', system-ui", fontSize: "14px", color: "var(--muted)", lineHeight: 1.5 }}
            >
              Upload your medical checkup results and 20FIT Sport Clinic will review them to give you a training &amp; nutrition program tailored to your body.
            </p>

            <div className="grid grid-cols-2 gap-3 w-full mb-6">
              {["Reviewed by doctor", "Personalized", "3-5 business days", "Private & secure"].map((f) => (
                <div
                  key={f}
                  className="rounded-lg p-3 text-center"
                  style={{
                    backgroundColor: "var(--card2)",
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: "11px",
                    letterSpacing: "1.5px",
                    color: "var(--text-soft)",
                  }}
                >
                  {f.toUpperCase()}
                </div>
              ))}
            </div>

            <div className="flex flex-col w-full gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full text-white py-3.5 rounded-lg transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
                style={{
                  backgroundColor: "var(--red)",
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: "14px",
                  letterSpacing: "2px",
                }}
                data-testid="button-upload-mcu"
              >
                <Upload size={15} />
                UPLOAD MCU RESULTS
              </button>
              <button
                className="w-full py-3 rounded-lg transition-colors hover:opacity-80"
                style={{
                  backgroundColor: "transparent",
                  border: "1.5px solid var(--border-subtle)",
                  color: "var(--text)",
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: "13px",
                  letterSpacing: "2px",
                }}
                data-testid="button-book-mcu"
              >
                BOOK MCU FIRST
              </button>
            </div>
          </motion.div>
        )}

        {/* ── UPLOADING STATE ── */}
        {state === "uploading" && (
          <motion.div
            key="uploading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="app-card flex flex-col items-center text-center !p-10"
          >
            <div className="mb-5">
              <motion.div
                className="w-14 h-14 rounded-full border-4 border-t-transparent mx-auto"
                style={{ borderColor: "var(--red)", borderTopColor: "transparent" }}
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            </div>

            <p
              className="mb-1"
              style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "18px", letterSpacing: "2px", color: "var(--text)" }}
            >
              Menganalisis dokumen MCU kamu...
            </p>
            <p
              className="mb-6"
              style={{ fontFamily: "'Barlow Condensed', system-ui", fontSize: "13px", color: "var(--muted)" }}
            >
              AI sedang membaca hasil pemeriksaan
            </p>

            <div className="w-full rounded-full overflow-hidden" style={{ backgroundColor: "var(--card2)", height: "6px" }}>
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: "var(--red)" }}
                animate={{ width: `${progress}%` }}
                transition={{ ease: "easeOut" }}
              />
            </div>
            <p
              className="mt-2"
              style={{ fontFamily: "'Orbitron', monospace", fontSize: "11px", color: "var(--muted)" }}
            >
              {Math.round(progress)}%
            </p>
          </motion.div>
        )}

        {/* ── SUCCESS STATE ── */}
        {state === "success" && result && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="app-card !p-6 flex flex-col gap-5"
          >
            {/* Grade + headline */}
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${gradeColor[result.grade]}20` }}
              >
                <span
                  style={{
                    fontFamily: "'Orbitron', monospace",
                    fontSize: "32px",
                    fontWeight: 700,
                    color: gradeColor[result.grade],
                  }}
                >
                  {result.grade}
                </span>
              </div>
              <div>
                <p
                  style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "11px", letterSpacing: "3px", color: "var(--muted)" }}
                >
                  YOUR HEALTH BASELINE
                </p>
                <p
                  style={{ fontFamily: "'Barlow Condensed', system-ui", fontSize: "14px", color: "var(--text)", lineHeight: 1.5, marginTop: "2px" }}
                >
                  {result.summary}
                </p>
              </div>
            </div>

            {/* Metrics grid */}
            {result.metrics && result.metrics.length > 0 && (
              <div>
                <p
                  className="mb-2"
                  style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "10px", letterSpacing: "3px", color: "var(--muted)" }}
                >
                  HASIL PEMERIKSAAN
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {result.metrics.map((m, i) => {
                    const badge = statusBadge[m.status] ?? statusBadge.ok;
                    return (
                      <div
                        key={i}
                        className="rounded-lg p-3"
                        style={{ backgroundColor: "var(--card2)" }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span
                            style={{ fontFamily: "'Barlow Condensed', system-ui", fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "1px" }}
                          >
                            {m.label}
                          </span>
                          <span
                            className="px-1.5 py-0.5 rounded"
                            style={{
                              backgroundColor: badge.bg,
                              color: badge.text,
                              fontFamily: "'Bebas Neue', sans-serif",
                              fontSize: "9px",
                              letterSpacing: "1px",
                            }}
                          >
                            {badge.label}
                          </span>
                        </div>
                        <p
                          style={{ fontFamily: "'Orbitron', monospace", fontSize: "14px", fontWeight: 600, color: "var(--text)" }}
                        >
                          {m.value}
                        </p>
                        {m.note && (
                          <p style={{ fontFamily: "'Barlow Condensed', system-ui", fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>
                            {m.note}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Doctor notes */}
            {result.doctor_notes && (
              <div
                className="rounded-lg p-4"
                style={{ backgroundColor: "var(--card2)", borderLeft: "3px solid var(--red)" }}
              >
                <p
                  className="mb-1"
                  style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "10px", letterSpacing: "3px", color: "var(--red)" }}
                >
                  CATATAN DOKTER
                </p>
                <p style={{ fontFamily: "'Barlow Condensed', system-ui", fontSize: "13px", color: "var(--text-soft)", lineHeight: 1.5 }}>
                  {result.doctor_notes}
                </p>
              </div>
            )}

            {/* Recommendations */}
            {result.recommendations && result.recommendations.length > 0 && (
              <div>
                <p
                  className="mb-2"
                  style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "10px", letterSpacing: "3px", color: "var(--muted)" }}
                >
                  REKOMENDASI
                </p>
                <div className="flex flex-col gap-1.5">
                  {result.recommendations.map((r, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div
                        className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                        style={{ backgroundColor: "var(--red)" }}
                      />
                      <p style={{ fontFamily: "'Barlow Condensed', system-ui", fontSize: "13px", color: "var(--text-soft)", lineHeight: 1.4 }}>
                        {r}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
              <p style={{ fontFamily: "'Barlow Condensed', system-ui", fontSize: "11px", color: "var(--muted)" }}>
                Reviewed by AI · {result.reviewed_at}
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 transition-opacity hover:opacity-70"
                style={{
                  fontFamily: "'Barlow Condensed', system-ui",
                  fontSize: "12px",
                  color: "var(--muted)",
                }}
                data-testid="button-reupload-mcu"
              >
                <Upload size={11} />
                Upload baru
              </button>
            </div>
          </motion.div>
        )}

        {/* ── ERROR STATE ── */}
        {state === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="app-card flex flex-col items-center text-center !p-8"
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: "rgba(196,17,1,0.1)" }}
            >
              <AlertCircle size={28} style={{ color: "var(--red)" }} />
            </div>
            <p
              className="mb-1"
              style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "16px", letterSpacing: "1px", color: "var(--text)" }}
            >
              Analisis gagal
            </p>
            <p
              className="mb-6"
              style={{ fontFamily: "'Barlow Condensed', system-ui", fontSize: "13px", color: "var(--muted)" }}
            >
              {error}
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-3 rounded-lg text-white transition-all hover:opacity-90"
                style={{
                  backgroundColor: "var(--red)",
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: "13px",
                  letterSpacing: "2px",
                }}
                data-testid="button-retry-mcu"
              >
                COBA LAGI
              </button>
              <button
                onClick={() => setState("empty")}
                className="flex-1 py-3 rounded-lg transition-colors hover:opacity-80"
                style={{
                  backgroundColor: "var(--card2)",
                  color: "var(--text)",
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: "13px",
                  letterSpacing: "2px",
                }}
                data-testid="button-cancel-mcu"
              >
                BATAL
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
