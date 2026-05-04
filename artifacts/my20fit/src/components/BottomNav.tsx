import { Home, Target, Calendar, Camera, User } from "lucide-react";

const tabs = [
  { icon: Home, label: "HOME", key: "home", active: true },
  { icon: Target, label: "PROGRESS", key: "progress" },
  { icon: Calendar, label: "EVENTS", key: "events" },
  { icon: Camera, label: "MOMENTS", key: "moments" },
  { icon: User, label: "PROFILE", key: "profile" },
];

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      style={{ backgroundColor: '#0A0A0A' }}
      data-testid="bottom-nav"
    >
      <div className="flex justify-around items-center h-[58px] px-1">
        {tabs.map(({ icon: Icon, label, key, active }) => (
          <button
            key={key}
            className="flex flex-col items-center justify-center w-[20%] gap-0.5 transition-opacity"
            style={{ color: active ? '#C41101' : 'rgba(255,255,255,0.45)' }}
            data-testid={`nav-${key}`}
          >
            <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
            <span
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '9px',
                letterSpacing: '1.5px',
              }}
            >
              {label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
