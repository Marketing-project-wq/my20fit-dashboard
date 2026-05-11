import { useAuth } from "@/contexts/AuthContext";

export default function Greeting() {
  const { user, profile, photoProfile } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "GOOD MORNING";
    if (hour < 18) return "GOOD AFTERNOON";
    return "GOOD EVENING";
  };

  const displayName = profile?.full_name
    || photoProfile?.name
    || user?.email?.split("@")[0]?.toUpperCase()
    || "MEMBER";

  return (
    <div className="mb-2" data-testid="section-greeting">
      <p
        style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 900,
          fontSize: '11px',
          letterSpacing: '2px',
          color: 'var(--muted)',
          opacity: 0.7,
          marginBottom: '2px',
        }}
      >
        {getGreeting()}, {displayName} 👋
      </p>
      <h1
        style={{
          fontFamily: "'Anton', sans-serif",
          fontWeight: 400,
          fontSize: '44px',
          letterSpacing: '-0.5px',
          color: 'var(--text)',
          lineHeight: 1,
          marginBottom: '6px',
        }}
      >
        {displayName}
      </h1>
      <p
        style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 900,
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
