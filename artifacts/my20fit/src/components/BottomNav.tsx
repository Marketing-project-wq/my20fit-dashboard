import { Home, Target, Calendar, Camera, User } from "lucide-react";

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[var(--bg)]/90 backdrop-blur-md border-t border-[var(--border-subtle)] pb-safe z-50 md:hidden" data-testid="bottom-nav">
      <div className="flex justify-around items-center h-[60px] px-2">
        <button className="flex flex-col items-center justify-center w-[20%] text-[var(--red)] group" data-testid="nav-home">
          <Home size={22} strokeWidth={2.5} className="mb-1" />
          <span className="text-[10px] font-bold tracking-wide">Home</span>
        </button>
        <button className="flex flex-col items-center justify-center w-[20%] text-[var(--muted)] hover:text-[var(--text)] transition-colors group" data-testid="nav-progress">
          <Target size={22} strokeWidth={2} className="mb-1 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-bold tracking-wide">Progress</span>
        </button>
        <button className="flex flex-col items-center justify-center w-[20%] text-[var(--muted)] hover:text-[var(--text)] transition-colors group" data-testid="nav-events">
          <Calendar size={22} strokeWidth={2} className="mb-1 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-bold tracking-wide">Events</span>
        </button>
        <button className="flex flex-col items-center justify-center w-[20%] text-[var(--muted)] hover:text-[var(--text)] transition-colors group" data-testid="nav-moments">
          <Camera size={22} strokeWidth={2} className="mb-1 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-bold tracking-wide">Moments</span>
        </button>
        <button className="flex flex-col items-center justify-center w-[20%] text-[var(--muted)] hover:text-[var(--text)] transition-colors group" data-testid="nav-profile">
          <User size={22} strokeWidth={2} className="mb-1 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-bold tracking-wide">Profile</span>
        </button>
      </div>
    </nav>
  );
}
