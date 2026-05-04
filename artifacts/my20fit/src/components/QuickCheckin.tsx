export default function QuickCheckin() {
  return (
    <div className="mb-8" data-testid="section-quick-checkin">
      <div className="section-header">
        <h2>QUICK CHECK-IN</h2>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="app-card !p-4 cursor-pointer" data-testid="checkin-menstrual">
          <p className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-1">Menstrual Cycle</p>
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm">Not set</span>
            <div className="w-2 h-2 rounded-full bg-[var(--pink)]"></div>
          </div>
        </div>
        <div className="app-card !p-4 cursor-pointer" data-testid="checkin-wellness">
          <p className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-1">Daily Wellness</p>
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm">Not logged</span>
            <div className="w-2 h-2 rounded-full bg-[var(--green)]"></div>
          </div>
        </div>
        <div className="app-card !p-4 cursor-pointer" data-testid="checkin-sleep">
          <p className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-1">Sleep Quality</p>
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm">Not logged</span>
            <div className="w-2 h-2 rounded-full bg-[var(--purple)]"></div>
          </div>
        </div>
        <div className="app-card !p-4 cursor-pointer" data-testid="checkin-water">
          <p className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-1">Water Intake</p>
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm">0 / 2.5L</span>
            <div className="w-2 h-2 rounded-full bg-[var(--cyan)]"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
