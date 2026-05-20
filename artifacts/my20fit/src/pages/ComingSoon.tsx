import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import Header from "@/components/Header";
import { Construction } from "lucide-react";

export default function ComingSoon({
  title,
  theme,
  toggleTheme,
}: {
  title: string;
  theme: string;
  toggleTheme: () => void;
}) {
  return (
    <div
      className="min-h-screen w-full flex"
      style={{
        background: `radial-gradient(circle at 20% 10%, rgba(196,17,1,0.08) 0%, transparent 40%), var(--bg)`,
        color: 'var(--text)',
      }}
    >
      <Sidebar theme={theme} toggleTheme={toggleTheme} />
      <main className="flex-1 w-full lg:pl-[220px]">
        <div className="max-w-[720px] mx-auto w-full px-4 md:px-6 lg:px-8 pb-24 pt-2 lg:pt-8 min-h-screen flex flex-col">
          <Header theme={theme} toggleTheme={toggleTheme} />
          <div className="flex-1 flex flex-col items-center justify-center gap-4 pb-16">
            <div
              className="rounded-full flex items-center justify-center"
              style={{ width: 72, height: 72, backgroundColor: 'var(--card2)', border: '1px solid var(--border-subtle)' }}
            >
              <Construction size={32} style={{ color: 'var(--muted)' }} />
            </div>
            <h1 style={{ fontFamily: "Inter, sans-serif", fontSize: '32px', letterSpacing: '3px', color: 'var(--text)' }}>
              {title}
            </h1>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: '14px', color: 'var(--muted)', textAlign: 'center' }}>
              Halaman ini sedang dalam pengembangan.<br />Segera hadir!
            </p>
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
