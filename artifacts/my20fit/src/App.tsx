import { useEffect, useState, lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useScrollRestore } from "@/hooks/useScrollRestore";

// ── Lazy routes ─────────────────────────────────────────────────────────────
// Each page is fetched on first visit. Initial JS bundle drops dramatically
// because heavy pages (Dashboard/Progress/Nutrition/Profile, ~150KB combined)
// are no longer required for /login, /register, /verify-email, etc.
const Dashboard            = lazy(() => import("@/pages/Dashboard"));
const Progress             = lazy(() => import("@/pages/Progress"));
const Nutrition            = lazy(() => import("@/pages/Nutrition"));
const Profile              = lazy(() => import("@/pages/Profile"));
const ComingSoon           = lazy(() => import("@/pages/ComingSoon"));
const Login                = lazy(() => import("@/pages/Login"));
const Register             = lazy(() => import("@/pages/Register"));
const VerifyEmail          = lazy(() => import("@/pages/VerifyEmail"));
const VerifyEmailPending   = lazy(() => import("@/pages/VerifyEmailPending"));
const MagicLink            = lazy(() => import("@/pages/MagicLink"));
const MagicLinkSent        = lazy(() => import("@/pages/MagicLinkSent"));
const MagicLinkConsume     = lazy(() => import("@/pages/MagicLinkConsume"));
const AuthCallback         = lazy(() => import("@/pages/AuthCallback"));
const ResetPassword        = lazy(() => import("@/pages/ResetPassword"));
const OnboardingModal      = lazy(() => import("@/components/onboarding/OnboardingModal"));

function RedirectHome() {
  const [, setLocation] = useLocation();
  useEffect(() => { setLocation("/"); }, [setLocation]);
  return null;
}

function RouteFallback() {
  // Minimal, no-flash placeholder while a lazy chunk loads. Matches the app
  // background so users don't see a white flash between navigations.
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F4F2EE",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          border: "3px solid rgba(196,17,1,0.18)",
          borderTopColor: "#C41101",
          borderRadius: "50%",
          animation: "appspin 0.7s linear infinite",
        }}
      />
      <style>{`@keyframes appspin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,        // 1 min — avoid refetching on every nav
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

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
    <Suspense fallback={<RouteFallback />}>
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

      {/* Auto-trigger onboarding modal after first verified login.
          Nested Suspense with null fallback prevents the whole app from
          showing the route-level spinner while this modal chunk loads. */}
      {showOnboarding && (
        <Suspense fallback={null}>
          <OnboardingModal
            open={showOnboarding}
            onClose={() => setShowOnboarding(false)}
          />
        </Suspense>
      )}
    </Suspense>
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
