export default function Greeting() {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "GOOD MORNING";
    if (hour < 18) return "GOOD AFTERNOON";
    return "GOOD EVENING";
  };

  return (
    <div className="mb-6" data-testid="section-greeting">
      <p
        style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: '11px',
          letterSpacing: '2px',
          color: 'var(--muted)',
          marginBottom: '4px',
        }}
      >
        {getGreeting()}, ZIDNI 👋
      </p>
      <h2
        style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: '28px',
          letterSpacing: '2px',
          color: 'var(--text)',
          lineHeight: 1.1,
          marginBottom: '6px',
        }}
      >
        WELCOME TO 20FIT
      </h2>
      <p
        style={{
          fontFamily: "'Barlow Condensed', system-ui",
          fontSize: '13px',
          color: 'var(--muted)',
          lineHeight: 1.5,
        }}
      >
        Your personalized training &amp; wellness dashboard. Stay consistent, stay strong.
      </p>
    </div>
  );
}
