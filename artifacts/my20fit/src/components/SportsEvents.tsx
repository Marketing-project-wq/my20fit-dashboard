export default function SportsEvents() {
  return (
    <div className="mb-8" data-testid="section-events">
      <div className="section-header">
        <h2>UPCOMING SPORTS EVENTS</h2>
      </div>

      <div className="flex flex-col gap-4 mb-4">
        {/* Featured 1 */}
        <div className="app-card !p-4 overflow-hidden relative">
          <div className="absolute top-0 right-0 bg-[var(--red)] text-white text-[10px] font-bold px-2 py-1 uppercase tracking-widest rounded-bl-lg z-10"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900 }}>
            Featured
          </div>
          <h3 className="leading-tight mb-1 pr-16"
            style={{ fontFamily: "'Anton', sans-serif", fontWeight: 400, fontSize: '18px', letterSpacing: '0.5px' }}>
            SportFest Vol.3 by 20FIT
          </h3>
          <p className="mb-3" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: '12px', color: 'var(--muted)' }}>
            29-31 May 2026 · Menteng Prada
          </p>

          <div className="flex justify-between items-end">
            <div className="flex items-center gap-1.5 bg-[var(--card2)] px-2.5 py-1.5 rounded">
              <span>⏰</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', fontWeight: 700 }}>31</span>
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: '11px' }}>days</span>
            </div>
            <button className="hover:underline flex items-center gap-1"
              style={{ fontFamily: "'Anton', sans-serif", fontWeight: 400, fontSize: '13px', letterSpacing: '1px', color: 'var(--red)' }}>
              REGISTER →
            </button>
          </div>
        </div>

        {/* Featured 2 */}
        <div className="app-card !p-4">
          <h3 className="leading-tight mb-1"
            style={{ fontFamily: "'Anton', sans-serif", fontWeight: 400, fontSize: '18px', letterSpacing: '0.5px' }}>
            HYROX Jakarta 2026
          </h3>
          <p className="mb-3" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: '12px', color: 'var(--muted)' }}>
            6-7 Jun 2026 · NICE, PIK2
          </p>

          <div className="flex justify-between items-end">
            <div className="flex items-center gap-1.5 bg-[var(--card2)] px-2.5 py-1.5 rounded">
              <span>⏰</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', fontWeight: 700 }}>51</span>
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: '11px' }}>days</span>
            </div>
            <button className="hover:underline flex items-center gap-1"
              style={{ fontFamily: "'Anton', sans-serif", fontWeight: 400, fontSize: '13px', letterSpacing: '1px', color: 'var(--red)' }}>
              REGISTER →
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Scroll */}
      <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
        {[
          { name: "HYROX World C.", date: "12 Jun 2026", days: 45 },
          { name: "HYROX Singapore", date: "15 Aug 2026", days: 109 },
          { name: "Ironman 70.3 Bintan", date: "23 Aug 2026", days: 117 },
          { name: "Jakarta Marathon", date: "26 Oct 2026", days: 181 },
        ].map(event => (
          <div key={event.name} className="app-card !p-3 min-w-[140px] shrink-0 snap-start">
            <p className="leading-tight mb-1 truncate"
              style={{ fontFamily: "'Anton', sans-serif", fontWeight: 400, fontSize: '14px', letterSpacing: '0.5px' }}>
              {event.name}
            </p>
            <p className="mb-2" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: '10px', color: 'var(--muted)' }}>
              {event.date}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <span style={{ fontSize: '10px' }}>⏰</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', fontWeight: 700, color: 'var(--red)' }}>{event.days}</span>
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: '10px', color: 'var(--red)' }}>d</span>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
