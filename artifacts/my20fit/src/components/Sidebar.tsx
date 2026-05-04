import { Home, Target, Calendar, Camera, User, Sun, Moon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Sidebar({ theme, toggleTheme }: { theme: string; toggleTheme: () => void }) {
  return (
    <aside className="fixed top-0 left-0 bottom-0 w-[240px] bg-[var(--card)] border-r border-[var(--border-subtle)] hidden lg:flex flex-col z-50 p-6 shadow-sm" data-testid="sidebar">
      <div className="mb-10">
        <h1 className="font-display text-3xl tracking-wide">
          my<span style={{ color: 'var(--red)' }}>20</span>fit
        </h1>
      </div>

      <nav className="flex-1 flex flex-col gap-2">
        <button className="flex items-center gap-3 bg-[var(--red)]/10 text-[var(--red)] px-4 py-3 rounded-lg font-bold transition-colors w-full text-left" data-testid="sidebar-home">
          <Home size={20} strokeWidth={2.5} />
          <span>Home</span>
        </button>
        <button className="flex items-center gap-3 text-[var(--text-soft)] hover:bg-[var(--card2)] px-4 py-3 rounded-lg font-bold transition-colors w-full text-left" data-testid="sidebar-progress">
          <Target size={20} strokeWidth={2.5} />
          <span>Progress</span>
        </button>
        <button className="flex items-center gap-3 text-[var(--text-soft)] hover:bg-[var(--card2)] px-4 py-3 rounded-lg font-bold transition-colors w-full text-left" data-testid="sidebar-events">
          <Calendar size={20} strokeWidth={2.5} />
          <span>Events</span>
        </button>
        <button className="flex items-center gap-3 text-[var(--text-soft)] hover:bg-[var(--card2)] px-4 py-3 rounded-lg font-bold transition-colors w-full text-left" data-testid="sidebar-moments">
          <Camera size={20} strokeWidth={2.5} />
          <span>Moments</span>
        </button>
        <button className="flex items-center gap-3 text-[var(--text-soft)] hover:bg-[var(--card2)] px-4 py-3 rounded-lg font-bold transition-colors w-full text-left" data-testid="sidebar-profile">
          <User size={20} strokeWidth={2.5} />
          <span>Profile</span>
        </button>
      </nav>

      <div className="mt-auto pt-6 border-t border-[var(--border-subtle)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-[var(--border-subtle)]">
              <AvatarFallback className="bg-[var(--red)] text-white font-bold">ZD</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-bold text-sm">Zidni</span>
              <span className="text-[10px] text-[var(--muted)] font-bold uppercase tracking-wider">⭐ Plus Member</span>
            </div>
          </div>
        </div>
        <button 
          onClick={toggleTheme}
          className="flex items-center justify-center gap-2 w-full bg-[var(--card2)] hover:bg-[var(--border-subtle)] text-[var(--text)] py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-colors"
          data-testid="sidebar-theme-toggle"
        >
          {theme === 'light' ? (
            <><Moon size={14} /> <span>Dark Mode</span></>
          ) : (
            <><Sun size={14} /> <span>Light Mode</span></>
          )}
        </button>
      </div>
    </aside>
  );
}
