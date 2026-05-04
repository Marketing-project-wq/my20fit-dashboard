export default function MyMoments() {
  return (
    <div className="mb-8" data-testid="section-moments">
      <div className="section-header">
        <h2>MY MOMENTS</h2>
      </div>
      <div className="app-card text-center !p-8">
        <div className="mx-auto w-20 h-20 rounded-full border-2 border-dashed border-[var(--blue)] flex items-center justify-center mb-5">
          <span className="text-3xl text-[var(--blue)]">😊</span>
        </div>
        <h3 className="text-xl font-bold mb-4">Scan your face once, photos auto-tagged forever</h3>
        
        <div className="flex flex-col gap-3 text-sm text-left mb-6 mx-auto max-w-[280px] font-medium text-[var(--muted)]">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded bg-[var(--card2)] flex items-center justify-center text-[10px] font-bold">1</div>
            <p>Snap a quick selfie</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded bg-[var(--card2)] flex items-center justify-center text-[10px] font-bold">2</div>
            <p>Workout at any 20FIT studio</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded bg-[var(--card2)] flex items-center justify-center text-[10px] font-bold">3</div>
            <p>Get your class photos instantly</p>
          </div>
        </div>

        <button className="w-full bg-[var(--blue)] text-white font-bold py-3.5 rounded-lg hover:-translate-y-0.5 hover:shadow-md transition-all uppercase tracking-wide text-sm mb-4" data-testid="button-scan-face">
          SCAN MY FACE NOW
        </button>
        <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider font-bold">Your photo is stored securely and never shared.</p>
      </div>
    </div>
  );
}
