import { Moon, Sun } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Header({ theme, toggleTheme }: { theme: string; toggleTheme: () => void }) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <header className="sticky top-0 z-50 bg-[var(--bg)]/80 backdrop-blur-md pb-4 pt-4 mb-4 lg:hidden" data-testid="header">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl tracking-wide">
            my<span style={{ color: 'var(--red)' }}>20</span>fit
          </h1>
          <p className="text-sm font-medium text-[var(--text-soft)]">
            {getGreeting()}, <span className="font-bold text-[var(--text)]">ZIDNI 👋</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-[var(--card2)] transition-colors"
            data-testid="button-theme-toggle"
          >
            {theme === 'light' ? (
              <Moon size={20} className="text-[var(--text)]" />
            ) : (
              <Sun size={20} className="text-[var(--text)]" />
            )}
          </button>
          <Avatar className="h-10 w-10 border-2 border-[var(--bg)]">
            <AvatarFallback className="bg-[var(--red)] text-white font-bold">ZD</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
