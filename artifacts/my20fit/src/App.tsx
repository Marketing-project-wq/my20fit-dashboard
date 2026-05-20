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
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import VerifyEmail from "@/pages/VerifyEmail";
import VerifyEmailPending from "@/pages/VerifyEmailPending";
import MagicLink from "@/pages/MagicLink";
import MagicLinkSent from "@/pages/MagicLinkSent";
import MagicLinkConsume from "@/pages/MagicLinkConsume";
import AuthCallback from "@/pages/AuthCallback";
import ResetPassword from "@/pages/ResetPassword";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import OnboardingModal from "@/components/onboarding/OnboardingModal";
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
  const { user, profile } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!user || !profile || profile.onboarding_completed || profile.onboarding_skipped_at) {
      setShowOnboarding(false);
      return;
    }
    const t = setTimeout(() => setShowOnboarding(true), 800);
    return () => clearTimeout(t);
  }, [user, profile?.onboarding_completed, profile?.onboarding_skipped_at]);

  return (
    <PageWrapper>
      <Switch>
        {/* ── Public auth routes ── */}
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/verify-email" component={VerifyEmail} />
        <Route path="/verify-email-pending" component={VerifyEmailPending} />
        <Route path="/magic-link" component={MagicLink} />
        <Route path="/magic-link/sent" component={MagicLinkSent} />
        <Route path="/magic-link/consume" component={MagicLinkConsume} />
        <Route path="/auth/callback" component={AuthCallback} />
        <Route path="/reset-password" component={ResetPassword} />

        {/* ── Protected app routes ── */}
        <Route path="/" component={() =>
          <ProtectedRoute>
            <Dashboard theme={theme} toggleTheme={toggleTheme} />
          </ProtectedRoute>
        } />
        <Route path="/progress" component={() =>
          <ProtectedRoute>
            <Progress theme={theme} toggleTheme={toggleTheme} />
          </ProtectedRoute>
        } />
        <Route path="/nutrition" component={() =>
          <ProtectedRoute>
            <Nutrition theme={theme} toggleTheme={toggleTheme} />
          </ProtectedRoute>
        } />
        <Route path="/moments" component={() =>
          <ProtectedRoute>
            <ComingSoon title="MOMENTS" theme={theme} toggleTheme={toggleTheme} />
          </ProtectedRoute>
        } />
        <Route path="/profile" component={() =>
          <ProtectedRoute>
            <Profile theme={theme} toggleTheme={toggleTheme} />
          </ProtectedRoute>
        } />

        <Route component={RedirectHome} />
      </Switch>

      {/* Auto-trigger onboarding modal after first verified login */}
      <OnboardingModal
        open={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />
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
