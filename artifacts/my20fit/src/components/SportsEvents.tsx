export default function SportsEvents() {
  const events = [
    { name: "SportFest Vol.3 by 20FIT", date: "29-31 Mei 2026", location: "Menteng Prada", days: 18, flag: "🏟️", type: "FITNESS FESTIVAL", featured: true },
    { name: "HYROX Jakarta 2026", date: "6-7 Jun 2026", location: "NICE, PIK2", days: 26, flag: "🏃", type: "FUNCTIONAL RACING", featured: false },
  ];

  const miniEvents = [
    { name: "HYROX World C.", date: "12 Jun 2026", days: 32 },
    { name: "HYROX Singapore", date: "15 Agu 2026", days: 96 },
    { name: "Ironman 70.3 Bintan", date: "23 Agu 2026", days: 104 },
    { name: "Jakarta Marathon", date: "26 Okt 2026", days: 168 },
  ];

  return (
    <div className="mb-8" data-testid="section-events">
      <div className="section-header">
        <h2>UPCOMING SPORTS EVENTS</h2>
        <div className="section-header-line" />
      </div>

      <div className="flex flex-col gap-3 mb-3">
        {events.map((event) => (
          <div
            key={event.name}
            style={{
              background: "linear-gradient(135deg, #0A0908 0%, #1A1408 100%)",
              borderRadius: 20,
              padding: "20px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{
              position: "absolute", top: -20, right: -20,
              width: 120, height: 120,
              background: "radial-gradient(circle, rgba(212,168,0,.15), transparent 60%)",
              pointerEvents: "none",
            }} />

            {event.featured && (
              <div style={{
                position: "absolute", top: 0, right: 0,
                background: "#C41101", color: "#fff",
                fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900,
                fontSize: 9, letterSpacing: 2,
                padding: "4px 12px",
                borderBottomLeftRadius: 8,
              }}>FEATURED</div>
            )}

            <div style={{ position: "relative" }}>
              <div style={{
                fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900,
                fontSize: 9, letterSpacing: 2.5,
                color: "rgba(255,255,255,.35)",
                marginBottom: 4,
              }}>{event.flag} {event.type}</div>

              <div style={{
                fontFamily: "'Anton', sans-serif",
                fontSize: 22, color: "#fff",
                letterSpacing: 0.5, lineHeight: 1.1,
                marginBottom: 4,
              }}>{event.name}</div>

              <div style={{
                fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900,
                fontSize: 11, color: "rgba(255,255,255,.45)",
                marginBottom: 16,
              }}>{event.date} · {event.location}</div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 22, fontWeight: 700, color: "#fff",
                  }}>{event.days}</span>
                  <span style={{
                    fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900,
                    fontSize: 9, letterSpacing: 2,
                    color: "rgba(255,255,255,.35)",
                  }}>HARI LAGI</span>
                </div>

                <button style={{
                  background: "#C41101",
                  color: "#fff",
                  fontFamily: "'Anton', sans-serif",
                  fontSize: 13, letterSpacing: 1,
                  padding: "9px 18px",
                  borderRadius: 10,
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 4px 16px rgba(196,17,1,.3)",
                  transition: "all .2s ease",
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(196,17,1,.4)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(196,17,1,.3)"; }}
                >
                  DAFTAR →
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0" style={{ scrollbarWidth: "none" }}>
        {miniEvents.map(event => (
          <div
            key={event.name}
            className="snap-start"
            style={{
              background: "rgba(255,255,255,.05)",
              border: "0.5px solid rgba(255,255,255,.1)",
              borderRadius: 12,
              padding: "12px 14px",
              minWidth: 130,
              flexShrink: 0,
            }}
          >
            <div style={{
              fontFamily: "'Anton', sans-serif",
              fontSize: 14, color: "#fff",
              letterSpacing: 0.5,
              lineHeight: 1.2,
              marginBottom: 4,
            }}>{event.name}</div>
            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900,
              fontSize: 10, color: "rgba(255,255,255,.35)",
              marginBottom: 8,
            }}>{event.date}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: "#C41101" }}>{event.days}</span>
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 9, letterSpacing: 1, color: "rgba(255,255,255,.3)" }}>d</span>
            </div>
          </div>
        ))}
      </div>

      <style>{`.hide-scrollbar::-webkit-scrollbar{display:none}`}</style>
    </div>
  );
}
