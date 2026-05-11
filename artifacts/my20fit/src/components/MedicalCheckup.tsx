import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, RotateCcw, AlertCircle, AlertTriangle, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

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
  patient_name?: string | null;
}

interface UploadError {
  icon: string;
  title: string;
  message: string;
  hint: string | null;
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

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
const MAX_SIZE = 10 * 1024 * 1024;

function validateFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: "Format file tidak didukung. Gunakan JPG, PNG, atau PDF." };
  }
  if (file.size > MAX_SIZE) {
    return { valid: false, error: "Ukuran file terlalu besar. Maksimal 10MB." };
  }
  return { valid: true };
}

function nameSimilarity(name1: string | null | undefined, name2: string): number {
  if (!name1 || !name2) return 0;
  const n1 = name1.toLowerCase().trim();
  const n2 = name2.toLowerCase().trim();
  if (n1 === n2) return 1;
  if (n1.includes(n2) || n2.includes(n1)) return 0.8;
  const words1 = n1.split(" ");
  const words2 = n2.split(" ");
  const overlap = words1.filter((w) => words2.includes(w)).length;
  return overlap / Math.max(words1.length, words2.length);
}

export default function MedicalCheckup() {
  const { profile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<State>("empty");
  const [result, setResult] = useState<McuResult | null>(null);
  const [uploadError, setUploadError] = useState<UploadError | null>(null);
  const [fileValidationError, setFileValidationError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  // Confirmation modal state
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingResult, setPendingResult] = useState<McuResult | null>(null);
  const [detectedName, setDetectedName] = useState<string | null>(null);
  const [nameMismatch, setNameMismatch] = useState(false);
  const [checks, setChecks] = useState([false, false, false]);

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
    e.target.value = "";

    // Layer 1: client-side validation
    const validation = validateFile(file);
    if (!validation.valid) {
      setFileValidationError(validation.error ?? "File tidak valid.");
      return;
    }
    setFileValidationError(null);

    setState("uploading");
    setUploadError(null);
    setProgress(0);

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

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // Layer 5: structured error handling
        if (data.error === "not_mcu") {
          setUploadError({
            icon: "🚫",
            title: "Bukan Hasil MCU",
            message: data.message ?? "Dokumen ini bukan hasil MCU.",
            hint: "Upload dokumen hasil pemeriksaan kesehatan dari klinik atau rumah sakit, bukan foto biasa atau dokumen lain.",
          });
        } else if (data.error === "incomplete_mcu") {
          setUploadError({
            icon: "📋",
            title: "Dokumen MCU Tidak Lengkap",
            message: data.message ?? "Dokumen MCU tidak lengkap.",
            hint: "Pastikan dokumen memuat hasil pemeriksaan darah, tekanan darah, atau parameter kesehatan lainnya.",
          });
        } else {
          setUploadError({
            icon: "⚠️",
            title: "Gagal Menganalisis",
            message: data.error ?? "Terjadi kesalahan. Coba lagi atau gunakan file yang berbeda.",
            hint: null,
          });
        }
        setState("error");
        return;
      }

      // Layer 3: name matching
      const mcuResult = data as McuResult;
      const userName = profile?.full_name ?? "User";
      const sim = nameSimilarity(mcuResult.patient_name, userName);
      const mismatch = !!mcuResult.patient_name && sim < 0.5;

      setDetectedName(mcuResult.patient_name ?? null);
      setNameMismatch(mismatch);
      setPendingResult(mcuResult);
      setChecks([false, false, false]);
      setState("empty"); // stay neutral while modal is open
      setShowConfirmation(true);
    } catch (err) {
      clearInterval(interval);
      setUploadError({
        icon: "⚠️",
        title: "Gagal Menganalisis",
        message: err instanceof Error ? err.message : "Terjadi kesalahan. Coba lagi.",
        hint: null,
      });
      setState("error");
    }
  };

  const handleConfirmSave = () => {
    if (!pendingResult) return;
    localStorage.setItem("my20fit_mcu_result", JSON.stringify(pendingResult));
    window.dispatchEvent(new CustomEvent("mcu-analyzed", { detail: pendingResult }));
    setResult(pendingResult);
    setState("success");
    setShowConfirmation(false);
    setPendingResult(null);
  };

  const handleConfirmCancel = () => {
    setShowConfirmation(false);
    setPendingResult(null);
    setState("empty");
  };

  const handleClear = () => {
    localStorage.removeItem("my20fit_mcu_result");
    setResult(null);
    setState("empty");
    setProgress(0);
    setUploadError(null);
    setFileValidationError(null);
  };

  const allChecked = checks.every(Boolean);
  const userName = profile?.full_name ?? "User";

  return (
    <div className="mb-8" data-testid="section-mcu">
      <div className="section-header">
        <h2>MEDICAL CHECKUP</h2>
        {state === "success" && (
          <button
            onClick={handleClear}
            className="flex items-center gap-1 transition-opacity hover:opacity-70"
            style={{ fontFamily: "'Barlow Condensed', system-ui", fontSize: "12px", color: "var(--muted)" }}
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
        {state === "empty" && !uploadError && (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="app-card flex flex-col items-center text-center !p-8"
          >
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: "var(--card2)" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--red)" }}>
                <path d="M14 14l-4-4" /><path d="M19 9l-4-4" /><path d="M9 19l-4-4" /><path d="M10 10l4 4" />
                <rect width="20" height="20" x="2" y="2" rx="4" />
              </svg>
            </div>
            <h3 className="mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "20px", letterSpacing: "1px", color: "var(--text)" }}>
              No MCU on file yet
            </h3>
            <p className="mb-6 max-w-[280px]" style={{ fontFamily: "'Barlow Condensed', system-ui", fontSize: "14px", color: "var(--muted)", lineHeight: 1.5 }}>
              Upload your medical checkup results and 20FIT Sport Clinic will review them to give you a training &amp; nutrition program tailored to your body.
            </p>
            <div className="grid grid-cols-2 gap-3 w-full mb-6">
              {["Reviewed by doctor", "Personalized", "3-5 business days", "Private & secure"].map((f) => (
                <div key={f} className="rounded-lg p-3 text-center" style={{ backgroundColor: "var(--card2)", fontFamily: "'Bebas Neue', sans-serif", fontSize: "11px", letterSpacing: "1.5px", color: "var(--text-soft)" }}>
                  {f.toUpperCase()}
                </div>
              ))}
            </div>
            <div className="flex flex-col w-full gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full text-white py-3.5 rounded-lg transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
                style={{ backgroundColor: "var(--red)", fontFamily: "'Bebas Neue', sans-serif", fontSize: "14px", letterSpacing: "2px" }}
                data-testid="button-upload-mcu"
              >
                <Upload size={15} />
                UPLOAD MCU RESULTS
              </button>
              {fileValidationError && (
                <p style={{ fontFamily: "'Barlow Condensed', system-ui", fontSize: "13px", color: "#C41101", textAlign: "center" }}>
                  {fileValidationError}
                </p>
              )}
              <button
                className="w-full py-3 rounded-lg transition-colors hover:opacity-80"
                style={{ backgroundColor: "transparent", border: "1.5px solid var(--border-subtle)", color: "var(--text)", fontFamily: "'Bebas Neue', sans-serif", fontSize: "13px", letterSpacing: "2px" }}
                data-testid="button-book-mcu"
              >
                BOOK MCU FIRST
              </button>
            </div>
          </motion.div>
        )}

        {/* ── UPLOADING STATE ── */}
        {state === "uploading" && (
          <motion.div key="uploading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="app-card flex flex-col items-center text-center !p-10">
            <div className="mb-5">
              <motion.div
                className="w-14 h-14 rounded-full border-4 border-t-transparent mx-auto"
                style={{ borderColor: "var(--red)", borderTopColor: "transparent" }}
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            </div>
            <p className="mb-1" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "18px", letterSpacing: "2px", color: "var(--text)" }}>
              Menganalisis dokumen MCU kamu...
            </p>
            <p className="mb-6" style={{ fontFamily: "'Barlow Condensed', system-ui", fontSize: "13px", color: "var(--muted)" }}>
              AI sedang membaca hasil pemeriksaan
            </p>
            <div className="w-full rounded-full overflow-hidden" style={{ backgroundColor: "var(--card2)", height: "6px" }}>
              <motion.div className="h-full rounded-full" style={{ backgroundColor: "var(--red)" }} animate={{ width: `${progress}%` }} transition={{ ease: "easeOut" }} />
            </div>
            <p className="mt-2" style={{ fontFamily: "'Orbitron', monospace", fontSize: "11px", color: "var(--muted)" }}>
              {Math.round(progress)}%
            </p>
          </motion.div>
        )}

        {/* ── ERROR STATE ── */}
        {state === "error" && uploadError && (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="app-card !p-0 overflow-hidden">
            <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "14px", padding: "20px", textAlign: "center" }}>
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>{uploadError.icon}</div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "18px", color: "#991B1B", marginBottom: "6px" }}>
                {uploadError.title}
              </div>
              <div style={{ fontFamily: "'Barlow Condensed', system-ui", fontSize: "13px", color: "#7F1D1D", lineHeight: 1.5, marginBottom: uploadError.hint ? "10px" : "16px" }}>
                {uploadError.message}
              </div>
              {uploadError.hint && (
                <div style={{ fontFamily: "'Barlow Condensed', system-ui", fontSize: "12px", color: "#6E665C", background: "rgba(0,0,0,.04)", borderRadius: "8px", padding: "10px 12px", marginBottom: "16px", lineHeight: 1.4 }}>
                  {uploadError.hint}
                </div>
              )}
              <button
                onClick={() => { setUploadError(null); setState("empty"); fileInputRef.current?.click(); }}
                style={{ background: "#C41101", color: "#fff", border: "none", borderRadius: "10px", padding: "10px 24px", fontFamily: "'Bebas Neue', sans-serif", fontSize: "14px", letterSpacing: "1.5px", cursor: "pointer" }}
                data-testid="button-retry-mcu"
              >
                COBA LAGI
              </button>
            </div>
          </motion.div>
        )}

        {/* ── SUCCESS STATE ── */}
        {state === "success" && result && (
          <motion.div key="success" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="app-card !p-6 flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${gradeColor[result.grade]}20` }}>
                <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "32px", fontWeight: 700, color: gradeColor[result.grade] }}>
                  {result.grade}
                </span>
              </div>
              <div>
                <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "11px", letterSpacing: "3px", color: "var(--muted)" }}>YOUR HEALTH BASELINE</p>
                <p style={{ fontFamily: "'Barlow Condensed', system-ui", fontSize: "14px", color: "var(--text)", lineHeight: 1.5, marginTop: "2px" }}>{result.summary}</p>
              </div>
            </div>

            {result.metrics && result.metrics.length > 0 && (
              <div>
                <p className="mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "10px", letterSpacing: "3px", color: "var(--muted)" }}>HASIL PEMERIKSAAN</p>
                <div className="grid grid-cols-2 gap-2">
                  {result.metrics.map((m, i) => {
                    const badge = statusBadge[m.status] ?? statusBadge.ok;
                    return (
                      <div key={i} className="rounded-lg p-3" style={{ backgroundColor: "var(--card2)" }}>
                        <div className="flex items-center justify-between mb-1">
                          <span style={{ fontFamily: "'Barlow Condensed', system-ui", fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "1px" }}>{m.label}</span>
                          <span className="px-1.5 py-0.5 rounded" style={{ backgroundColor: badge.bg, color: badge.text, fontFamily: "'Bebas Neue', sans-serif", fontSize: "9px", letterSpacing: "1px" }}>{badge.label}</span>
                        </div>
                        <p style={{ fontFamily: "'Orbitron', monospace", fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>{m.value}</p>
                        {m.note && <p style={{ fontFamily: "'Barlow Condensed', system-ui", fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>{m.note}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {result.doctor_notes && (
              <div className="rounded-lg p-4" style={{ backgroundColor: "var(--card2)", borderLeft: "3px solid var(--red)" }}>
                <p className="mb-1" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "10px", letterSpacing: "3px", color: "var(--red)" }}>CATATAN DOKTER</p>
                <p style={{ fontFamily: "'Barlow Condensed', system-ui", fontSize: "13px", color: "var(--text-soft)", lineHeight: 1.5 }}>{result.doctor_notes}</p>
              </div>
            )}

            {result.recommendations && result.recommendations.length > 0 && (
              <div>
                <p className="mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "10px", letterSpacing: "3px", color: "var(--muted)" }}>REKOMENDASI</p>
                <div className="flex flex-col gap-1.5">
                  {result.recommendations.map((r, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: "var(--red)" }} />
                      <p style={{ fontFamily: "'Barlow Condensed', system-ui", fontSize: "13px", color: "var(--text-soft)", lineHeight: 1.4 }}>{r}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
              <p style={{ fontFamily: "'Barlow Condensed', system-ui", fontSize: "11px", color: "var(--muted)" }}>Reviewed by AI · {result.reviewed_at}</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 transition-opacity hover:opacity-70"
                style={{ fontFamily: "'Barlow Condensed', system-ui", fontSize: "12px", color: "var(--muted)" }}
                data-testid="button-reupload-mcu"
              >
                <Upload size={11} />
                Upload baru
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* ── CONFIRMATION MODAL ── */}
      <AnimatePresence>
        {showConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
            onClick={(e) => { if (e.target === e.currentTarget) handleConfirmCancel(); }}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              style={{ background: "#F4F2EE", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 480, padding: "24px 24px 40px", maxHeight: "90vh", overflowY: "auto" }}
            >
              {/* Drag handle */}
              <div style={{ width: 40, height: 4, background: "#D1C9BF", borderRadius: 2, margin: "0 auto 20px" }} />

              <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: "2px", color: "#0A0908", marginBottom: 16 }}>
                KONFIRMASI DOKUMEN MCU
              </h2>

              {/* Name mismatch warning */}
              {nameMismatch && detectedName && (
                <div style={{ background: "#FEF3C7", border: "1px solid #FCD34D", borderRadius: "12px", padding: "14px 16px", marginBottom: "16px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
                  <AlertTriangle size={18} color="#D97706" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "13px", letterSpacing: "1px", color: "#92400E", marginBottom: "4px" }}>NAMA TIDAK SESUAI</div>
                    <div style={{ fontFamily: "'Barlow Condensed', system-ui", fontSize: "13px", color: "#78350F", lineHeight: 1.4 }}>
                      Nama di dokumen: <strong>{detectedName}</strong><br />
                      Nama akun kamu: <strong>{userName}</strong><br />
                      Pastikan ini adalah hasil MCU milikmu sendiri.
                    </div>
                  </div>
                </div>
              )}

              {/* Detected info */}
              <div style={{ background: "#fff", borderRadius: 10, padding: "14px 16px", marginBottom: 20, display: "flex", flexDirection: "column", gap: 6 }}>
                {detectedName && (
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 11, letterSpacing: "1.5px", color: "#6E665C", minWidth: 130 }}>NAMA PASIEN</span>
                    <span style={{ fontFamily: "'Barlow Condensed', system-ui", fontSize: 13, color: "#0A0908" }}>{detectedName}</span>
                  </div>
                )}
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 11, letterSpacing: "1.5px", color: "#6E665C", minWidth: 130 }}>JENIS DOKUMEN</span>
                  <span style={{ fontFamily: "'Barlow Condensed', system-ui", fontSize: 13, color: "#0A0908" }}>Medical Checkup / Lab Result</span>
                </div>
                {pendingResult?.grade && (
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 11, letterSpacing: "1.5px", color: "#6E665C", minWidth: 130 }}>GRADE KESEHATAN</span>
                    <span style={{ fontFamily: "'Orbitron', monospace", fontSize: 13, fontWeight: 700, color: gradeColor[pendingResult.grade] }}>{pendingResult.grade}</span>
                  </div>
                )}
              </div>

              {/* 3 Checkboxes */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
                {[
                  "Dokumen ini adalah hasil MCU milik saya sendiri",
                  "Saya memahami analisis ini dilakukan AI, bukan pengganti diagnosis dokter",
                  "Saya bertanggung jawab atas keakuratan dokumen yang diupload",
                ].map((label, i) => (
                  <label key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" }}>
                    <div
                      onClick={() => setChecks((prev) => prev.map((v, idx) => (idx === i ? !v : v)))}
                      style={{
                        width: 20, height: 20, borderRadius: 4, flexShrink: 0, marginTop: 1,
                        border: checks[i] ? "none" : "2px solid #E5E1D8",
                        background: checks[i] ? "#C41101" : "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.15s", cursor: "pointer",
                      }}
                    >
                      {checks[i] && <Check size={12} color="#fff" strokeWidth={3} />}
                    </div>
                    <span
                      onClick={() => setChecks((prev) => prev.map((v, idx) => (idx === i ? !v : v)))}
                      style={{ fontFamily: "'Barlow Condensed', system-ui", fontSize: 13, color: "#0A0908", lineHeight: 1.5 }}
                    >
                      {label}
                    </span>
                  </label>
                ))}
              </div>

              {/* Save button */}
              <button
                onClick={handleConfirmSave}
                disabled={!allChecked}
                style={{
                  width: "100%", padding: "14px", borderRadius: 10, border: "none",
                  background: allChecked ? "#C41101" : "#D1C9BF",
                  color: allChecked ? "#fff" : "#9E9891",
                  fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, letterSpacing: "2.5px",
                  cursor: allChecked ? "pointer" : "not-allowed",
                  transition: "all 0.2s",
                }}
                data-testid="button-confirm-save-mcu"
              >
                SIMPAN HASIL MCU →
              </button>

              <button
                onClick={handleConfirmCancel}
                style={{ display: "block", width: "100%", marginTop: 12, background: "none", border: "none", cursor: "pointer", fontFamily: "'Barlow Condensed', system-ui", fontSize: 13, color: "#9E9891", textAlign: "center" }}
              >
                Batal
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
