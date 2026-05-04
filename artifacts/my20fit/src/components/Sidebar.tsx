import { Home, Target, Calendar, Camera, User, Sun, Moon } from "lucide-react";

const navItems = [
  { icon: Home, label: "HOME", key: "home", active: true },
  { icon: Target, label: "PROGRESS", key: "progress" },
  { icon: Calendar, label: "EVENTS", key: "events" },
  { icon: Camera, label: "MOMENTS", key: "moments" },
  { icon: User, label: "PROFILE", key: "profile" },
];

export default function Sidebar({ theme, toggleTheme }: { theme: string; toggleTheme: () => void }) {
  return (
    <aside
      className="fixed top-0 left-0 bottom-0 w-[220px] hidden lg:flex flex-col z-50"
      style={{ backgroundColor: '#0A0A0A' }}
      data-testid="sidebar"
    >
      <div className="px-6 pt-8 pb-6">
        <h1
          className="text-3xl tracking-wide text-white"
          style={{ fontFamily: "'Bebas Neue', sans-serif" }}
        >
          my<span style={{ color: '#C41101' }}>20</span>FIT
        </h1>
      </div>

      <nav className="flex-1 flex flex-col mt-2">
        {navItems.map(({ icon: Icon, label, key, active }) => (
          <button
            key={key}
            className="flex items-center gap-3 px-6 py-3.5 w-full text-left transition-colors"
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              letterSpacing: '2px',
              fontSize: '14px',
              backgroundColor: active ? '#C41101' : 'transparent',
              color: active ? '#FFFFFF' : 'rgba(255,255,255,0.6)',
              borderRadius: active ? '0 8px 8px 0' : '0',
              marginRight: active ? '12px' : '0',
            }}
            data-testid={`sidebar-${key}`}
          >
            <Icon size={18} strokeWidth={active ? 2.5 : 2} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto px-6 pb-6 flex flex-col gap-3">
        <div className="flex items-center gap-3 pt-4 border-t border-white/10">
          <div
            className="h-9 w-9 rounded-full flex items-center justify-center shrink-0 text-white text-sm font-bold"
            style={{ backgroundColor: '#C41101', fontFamily: "'Bebas Neue', sans-serif" }}
          >
            ZD
          </div>
          <div className="flex flex-col">
            <span className="text-white text-sm" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '1px' }}>ZIDNI</span>
            <span className="text-[10px]" style={{ color: '#D4A800', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '1.5px' }}>⭐ PLUS MEMBER</span>
          </div>
        </div>

        <button
          onClick={toggleTheme}
          className="flex items-center justify-center gap-2 w-full py-2.5 transition-colors"
          style={{
            backgroundColor: '#1A1A1A',
            color: 'rgba(255,255,255,0.7)',
            fontFamily: "'Bebas Neue', sans-serif",
            letterSpacing: '2px',
            fontSize: '12px',
            borderRadius: '6px',
          }}
          data-testid="sidebar-theme-toggle"
        >
          {theme === 'light' ? <><Moon size={13} /> <span>DARK MODE</span></> : <><Sun size={13} /> <span>LIGHT MODE</span></>}
        </button>
      </div>
    </aside>
  );
}
