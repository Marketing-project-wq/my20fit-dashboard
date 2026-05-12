import { useEffect, useState } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/Dashboard";
import Progress from "@/pages/Progress";
import Nutrition from "@/pages/Nutrition";
import Profile from "@/pages/Profile";
import ComingSoon from "@/pages/ComingSoon";
import { AuthProvider } from "@/contexts/AuthContext";
import { useScrollRestore } from "@/hooks/useScrollRestore";

function RedirectHome() {
  const [, setLocation] = useLocation();
  useEffect(() => { setLocation("/"); }, [setLocation]);
  return null;
}

function PageWrapper({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, [location]);

  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "none" : "translateY(6px)",
      transition: "opacity .25s ease, transform .25s ease",
    }}>
      {children}
    </div>
  );
}

const queryClient = new QueryClient();

function Router({ theme, toggleTheme }: { theme: string; toggleTheme: () => void }) {
  useScrollRestore();
  return (
    <PageWrapper>
      <Switch>
        <Route path="/" component={() => <Dashboard theme={theme} toggleTheme={toggleTheme} />} />
        <Route path="/progress" component={() => <Progress theme={theme} toggleTheme={toggleTheme} />} />
        <Route path="/nutrition" component={() => <Nutrition theme={theme} toggleTheme={toggleTheme} />} />
        <Route path="/events" component={() => <ComingSoon title="EVENTS" theme={theme} toggleTheme={toggleTheme} />} />
        <Route path="/moments" component={() => <ComingSoon title="MOMENTS" theme={theme} toggleTheme={toggleTheme} />} />
        <Route path="/profile" component={() => <Profile theme={theme} toggleTheme={toggleTheme} />} />
        <Route component={RedirectHome} />
      </Switch>
    </PageWrapper>
  );
}

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem("my20fit_theme") || "light");

  useEffect(() => {
    localStorage.setItem("my20fit_theme", theme);
    if (theme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === "light" ? "dark" : "light");

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router theme={theme} toggleTheme={toggleTheme} />
          </WouterRouter>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
