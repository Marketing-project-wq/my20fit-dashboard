import { useEffect, useState } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Progress from "@/pages/Progress";
import ComingSoon from "@/pages/ComingSoon";
import Login from "@/pages/Login";
import ResetPassword from "@/pages/ResetPassword";
import WelcomeOverlay from "@/components/WelcomeOverlay";
import { useAuth } from "@/contexts/AuthContext";

const queryClient = new QueryClient();

function LoadingScreen() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "var(--bg)" }}>
      <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid #C41101", borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (!loading && !user) setLocation("/login");
  }, [user, loading, setLocation]);

  useEffect(() => {
    if (!user || !profile) return;
    // Check if welcome overlay should be shown (first login)
    const localKey = `my20fit_onboarded_${user.id}`;
    const alreadyOnboarded =
      profile.onboarding_completed === true ||
      localStorage.getItem(localKey) === "1";
    setShowWelcome(!alreadyOnboarded);
  }, [user, profile]);

  if (loading) return <LoadingScreen />;
  if (!user) return null;

  return (
    <>
      {showWelcome && (
        <WelcomeOverlay onDismiss={() => setShowWelcome(false)} />
      )}
      {children}
    </>
  );
}

function Router({ theme, toggleTheme }: { theme: string; toggleTheme: () => void }) {
  return (
    <Switch>
      <Route path="/login" component={() => <Login />} />
      <Route path="/reset-password" component={() => <ResetPassword />} />
      <Route path="/" component={() => <ProtectedRoute><Dashboard theme={theme} toggleTheme={toggleTheme} /></ProtectedRoute>} />
      <Route path="/progress" component={() => <ProtectedRoute><Progress theme={theme} toggleTheme={toggleTheme} /></ProtectedRoute>} />
      <Route path="/events" component={() => <ProtectedRoute><ComingSoon title="EVENTS" theme={theme} toggleTheme={toggleTheme} /></ProtectedRoute>} />
      <Route path="/moments" component={() => <ProtectedRoute><ComingSoon title="MOMENTS" theme={theme} toggleTheme={toggleTheme} /></ProtectedRoute>} />
      <Route path="/profile" component={() => <ProtectedRoute><ComingSoon title="PROFILE" theme={theme} toggleTheme={toggleTheme} /></ProtectedRoute>} />
      <Route component={NotFound} />
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
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router theme={theme} toggleTheme={toggleTheme} />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
