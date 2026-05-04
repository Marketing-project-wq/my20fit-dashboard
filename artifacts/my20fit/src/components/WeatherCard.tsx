export default function WeatherCard() {
  return (
    <div className="app-card mb-6 flex items-stretch gap-4" data-testid="card-weather">
      <div className="flex-1">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p
              className="uppercase mb-0.5"
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '11px',
                letterSpacing: '3px',
                color: 'var(--muted)',
              }}
            >
              JAKARTA
            </p>
            <p
              className="text-sm"
              style={{ color: 'var(--muted)', fontFamily: "'Barlow Condensed', system-ui" }}
            >
              Hazy
            </p>
          </div>
          <div
            className="leading-none font-extrabold"
            style={{ fontFamily: "'Orbitron', monospace", fontSize: '44px', fontWeight: 800, color: 'var(--text)' }}
          >
            31°
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 mt-3">
          {[
            ['FEELS LIKE', '34°'],
            ['HUMIDITY', '72%'],
            ['UV INDEX', '8'],
            ['WIND', '6 KM/H'],
          ].map(([label, val]) => (
            <div key={label} className="flex justify-between items-center">
              <span
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: '10px',
                  letterSpacing: '2px',
                  color: 'var(--muted)',
                }}
              >
                {label}
              </span>
              <span
                style={{
                  fontFamily: "'Orbitron', monospace",
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--text)',
                }}
              >
                {val}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div
        className="w-[88px] rounded-xl flex flex-col items-center justify-center p-3 text-center shrink-0"
        style={{ backgroundColor: '#0A0908' }}
      >
        <span
          className="block mb-1"
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '10px',
            letterSpacing: '3px',
            color: 'rgba(255,255,255,0.5)',
          }}
        >
          AQI
        </span>
        <span
          className="block font-bold leading-none"
          style={{ fontFamily: "'Orbitron', monospace", fontSize: '28px', fontWeight: 700, color: '#FFD700' }}
        >
          78
        </span>
        <span
          className="block mt-1.5"
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '10px',
            letterSpacing: '2px',
            color: '#FFD700',
          }}
        >
          MODERATE
        </span>
      </div>
    </div>
  );
}
