import { Home, UtensilsCrossed, Calendar, Camera, User } from "lucide-react";
import { Link, useLocation } from "wouter";

const tabs = [
  { icon: Home, label: "HOME", key: "home", href: "/" },
  { icon: UtensilsCrossed, label: "NUTRITION", key: "nutrition", href: "/nutrition" },
  { icon: Calendar, label: "EVENTS", key: "events", href: "/events" },
  { icon: Camera, label: "MOMENTS", key: "moments", href: "/moments" },
  { icon: User, label: "PROFILE", key: "profile", href: "/profile" },
];

export default function BottomNav() {
  const [location] = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      style={{ backgroundColor: '#0A0A0A' }}
      data-testid="bottom-nav"
    >
      <div className="flex justify-around items-center h-[58px] px-1">
        {tabs.map(({ icon: Icon, label, key, href }) => {
          const active = location === href || (href === "/" && location === "");
          return (
            <Link key={key} href={href}>
              <button
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
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
