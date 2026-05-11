import { Moon, Sun } from "lucide-react";

export default function Header({ theme, toggleTheme }: { theme: string; toggleTheme: () => void }) {
  return (
    <header
      className="sticky top-0 z-50 backdrop-blur-md pb-4 pt-4 mb-2 lg:hidden flex items-center justify-between"
      style={{ backgroundColor: 'var(--bg)' }}
      data-testid="header"
    >
      <h1
        className="text-2xl"
        style={{ fontFamily: "'Anton', sans-serif", fontWeight: 400, letterSpacing: '1px', color: 'var(--text)' }}
      >
        my<span style={{ color: '#C41101' }}>20</span>FIT
      </h1>

      <button
        onClick={toggleTheme}
        className="p-2 rounded-full transition-colors"
        style={{ backgroundColor: 'var(--card2)' }}
        data-testid="button-theme-toggle"
      >
        {theme === 'light'
          ? <Moon size={18} style={{ color: 'var(--text)' }} />
          : <Sun size={18} style={{ color: 'var(--text)' }} />
        }
      </button>
    </header>
  );
}
