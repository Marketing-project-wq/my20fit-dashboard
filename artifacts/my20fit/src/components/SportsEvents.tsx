export default function SportsEvents() {
  return (
    <div className="mb-8" data-testid="section-events">
      <div className="section-header">
        <h2>UPCOMING SPORTS EVENTS</h2>
      </div>

      <div className="flex flex-col gap-4 mb-4">
        {/* Featured 1 */}
        <div className="app-card !p-4 overflow-hidden relative">
          <div className="absolute top-0 right-0 bg-[var(--red)] text-white text-[10px] font-bold px-2 py-1 uppercase tracking-widest rounded-bl-lg z-10">
            Featured
          </div>
          <h3 className="font-bold text-lg leading-tight mb-1 pr-16">SportFest Vol.3 by 20FIT</h3>
          <p className="text-xs text-[var(--muted)] font-medium mb-3">29-31 May 2026 · Menteng Prada</p>
          
          <div className="flex justify-between items-end">
            <div className="flex items-center gap-1.5 bg-[var(--card2)] px-2.5 py-1.5 rounded text-xs font-bold">
              <span>⏰</span> 31 days
            </div>
            <button className="text-[var(--red)] font-bold text-xs uppercase tracking-wider hover:underline flex items-center gap-1">
              REGISTER <span>→</span>
            </button>
          </div>
        </div>

        {/* Featured 2 */}
        <div className="app-card !p-4">
          <h3 className="font-bold text-lg leading-tight mb-1">HYROX Jakarta 2026</h3>
          <p className="text-xs text-[var(--muted)] font-medium mb-3">6-7 Jun 2026 · NICE, PIK2</p>
          
          <div className="flex justify-between items-end">
            <div className="flex items-center gap-1.5 bg-[var(--card2)] px-2.5 py-1.5 rounded text-xs font-bold">
              <span>⏰</span> 51 days
            </div>
            <button className="text-[var(--red)] font-bold text-xs uppercase tracking-wider hover:underline flex items-center gap-1">
              REGISTER <span>→</span>
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Scroll */}
      <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
        <div className="app-card !p-3 min-w-[140px] shrink-0 snap-start">
          <p className="font-bold text-sm leading-tight mb-1 truncate">HYROX World C.</p>
          <p className="text-[10px] text-[var(--muted)] font-medium mb-2">12 Jun 2026</p>
          <div className="text-[10px] font-bold text-[var(--red)]">⏰ 45d</div>
        </div>
        <div className="app-card !p-3 min-w-[140px] shrink-0 snap-start">
          <p className="font-bold text-sm leading-tight mb-1 truncate">HYROX Singapore</p>
          <p className="text-[10px] text-[var(--muted)] font-medium mb-2">15 Aug 2026</p>
          <div className="text-[10px] font-bold text-[var(--red)]">⏰ 109d</div>
        </div>
        <div className="app-card !p-3 min-w-[140px] shrink-0 snap-start">
          <p className="font-bold text-sm leading-tight mb-1 truncate">Ironman 70.3 Bintan</p>
          <p className="text-[10px] text-[var(--muted)] font-medium mb-2">23 Aug 2026</p>
          <div className="text-[10px] font-bold text-[var(--red)]">⏰ 117d</div>
        </div>
        <div className="app-card !p-3 min-w-[140px] shrink-0 snap-start">
          <p className="font-bold text-sm leading-tight mb-1 truncate">Jakarta Marathon</p>
          <p className="text-[10px] text-[var(--muted)] font-medium mb-2">26 Oct 2026</p>
          <div className="text-[10px] font-bold text-[var(--red)]">⏰ 181d</div>
        </div>
      </div>
      
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
