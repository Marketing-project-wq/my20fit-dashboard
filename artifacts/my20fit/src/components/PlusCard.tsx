import { Check } from "lucide-react";

export default function PlusCard() {
  return (
    <div className="mb-20 lg:mb-8" data-testid="section-upsell">
      <div
        className="rounded-2xl p-6 relative overflow-hidden text-white"
        style={{ background: 'linear-gradient(135deg, #1A1A0F, #0A0A05)' }}
      >
        <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full blur-2xl" style={{ backgroundColor: 'rgba(212,168,0,0.12)' }} />

        <div
          className="inline-flex items-center gap-1.5 px-2.5 py-1 mb-4"
          style={{
            backgroundColor: '#1F1F0A',
            borderRadius: '4px',
            fontFamily: "Inter, sans-serif",
            fontWeight: 900,
            fontSize: '10px',
            letterSpacing: '1.5px',
            color: '#D4A800',
          }}
        >
          ⭐ 20FIT PLUS
        </div>

        <h3
          className="mb-1 leading-none"
          style={{ fontFamily: "'Anton', sans-serif", fontWeight: 400, fontSize: '30px', letterSpacing: '1px' }}
        >
          START SMART. SAVE 10%.
        </h3>
        <p
          className="mb-5"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: '13px', color: 'rgba(255,255,255,0.55)' }}
        >
          New here? Plus pays for itself after 2 sessions.
        </p>

        <div className="grid grid-cols-2 gap-2 mb-5">
          {['10% Arena', '10% Clinic', '10% PT', '10% Shop'].map((item) => (
            <div
              key={item}
              className="py-2.5 text-center"
              style={{
                backgroundColor: '#1A1A0A',
                borderRadius: '6px',
                fontFamily: "Inter, sans-serif",
                fontWeight: 900,
                fontSize: '13px',
                letterSpacing: '1px',
                color: '#D4A800',
              }}
            >
              {item.toUpperCase()}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 mb-5">
          {[
            'Priority class booking',
            'Free body composition scans',
            '1 guest pass per month',
            'Exclusive merch access',
          ].map((feat) => (
            <div key={feat} className="flex items-center gap-2">
              <Check size={13} strokeWidth={3} style={{ color: '#D4A800', flexShrink: 0 }} />
              <span
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 900,
                  fontSize: '14px',
                  color: 'rgba(255,255,255,0.8)',
                }}
              >
                {feat}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div>
            <p
              className="mb-0.5"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: '10px', letterSpacing: '1.5px', color: 'rgba(255,255,255,0.4)' }}
            >
              PRICE
            </p>
            <p
              style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '18px', fontWeight: 400 }}
            >
              Rp 49.000<span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', fontFamily: "Inter, sans-serif" }}>/mo</span>
            </p>
          </div>
          <button
            className="py-2.5 px-5 transition-opacity hover:opacity-90"
            style={{
              background: 'linear-gradient(135deg, #D4A800, #FFD700)',
              color: '#0A0908',
              borderRadius: '10px',
              fontFamily: "'Anton', sans-serif",
              fontWeight: 400,
              fontSize: '13px',
              letterSpacing: '1px',
              boxShadow: '0 4px 20px rgba(212,168,0,.35)',
              transition: 'all .2s ease',
            }}
            data-testid="button-upgrade-plus"
          >
            UPGRADE →
          </button>
        </div>
      </div>
    </div>
  );
}
