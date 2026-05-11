import { useEffect, useState } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/Dashboard";
import Progress from "@/pages/Progress";
import ComingSoon from "@/pages/ComingSoon";
import { AuthProvider } from "@/contexts/AuthContext";

function RedirectHome() {
  const [, setLocation] = useLocation();
  useEffect(() => { setLocation("/"); }, [setLocation]);
  return null;
}

const queryClient = new QueryClient();

function Router({ theme, toggleTheme }: { theme: string; toggleTheme: () => void }) {
  return (
    <Switch>
      <Route path="/" component={() => <Dashboard theme={theme} toggleTheme={toggleTheme} />} />
      <Route path="/progress" component={() => <Progress theme={theme} toggleTheme={toggleTheme} />} />
      <Route path="/events" component={() => <ComingSoon title="EVENTS" theme={theme} toggleTheme={toggleTheme} />} />
      <Route path="/moments" component={() => <ComingSoon title="MOMENTS" theme={theme} toggleTheme={toggleTheme} />} />
      <Route path="/profile" component={() => <ComingSoon title="PROFILE" theme={theme} toggleTheme={toggleTheme} />} />
      <Route component={RedirectHome} />
    </Switch>
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
