export default function MedicalCheckup() {
  return (
    <div className="mb-8" data-testid="section-mcu">
      <div className="section-header">
        <h2>MEDICAL CHECKUP</h2>
      </div>
      
      <div className="app-card flex flex-col items-center text-center !p-8">
        <div className="w-16 h-16 rounded-full bg-[var(--card2)] flex items-center justify-center mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round" className="text-[var(--red)]">
            <path d="M14 14l-4-4" />
            <path d="M19 9l-4-4" />
            <path d="M9 19l-4-4" />
            <path d="M10 10l4 4" />
            <rect width="20" height="20" x="2" y="2" rx="4" />
          </svg>
        </div>
        
        <h3 className="text-xl font-bold mb-2">No MCU on file yet</h3>
        <p className="text-sm text-[var(--muted)] mb-6 max-w-[280px]">
          Upload your medical checkup results and 20FIT Sport Clinic will review them to give you a training & nutrition program tailored to your body.
        </p>
        
        <div className="grid grid-cols-2 gap-3 w-full mb-6">
          <div className="bg-[var(--card2)] rounded-lg p-3 text-xs font-semibold">Reviewed by doctor</div>
          <div className="bg-[var(--card2)] rounded-lg p-3 text-xs font-semibold">Personalized</div>
          <div className="bg-[var(--card2)] rounded-lg p-3 text-xs font-semibold">3-5 business days</div>
          <div className="bg-[var(--card2)] rounded-lg p-3 text-xs font-semibold">Private & secure</div>
        </div>
        
        <div className="flex flex-col w-full gap-3">
          <button className="w-full bg-[var(--red)] text-white font-bold py-3.5 rounded-lg hover:-translate-y-0.5 hover:shadow-md transition-all uppercase tracking-wide text-sm" data-testid="button-upload-mcu">
            UPLOAD MCU RESULTS
          </button>
          <button className="w-full bg-transparent border-2 border-[var(--border-subtle)] text-[var(--text)] font-bold py-3 rounded-lg hover:bg-[var(--card2)] transition-colors uppercase tracking-wide text-sm" data-testid="button-book-mcu">
            BOOK MCU FIRST
          </button>
        </div>
      </div>
    </div>
  );
}
