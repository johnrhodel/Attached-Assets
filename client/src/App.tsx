import { useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nProvider } from "@/lib/i18n/context";
import NotFound from "@/pages/not-found";

import Home from "@/pages/Home";
import Claim from "@/pages/Claim";
import AccessCode from "@/pages/AccessCode";
import Embed from "@/pages/Embed";
import Gallery from "@/pages/Gallery";
import MyNfts from "@/pages/MyNfts";
import Register from "@/pages/Register";

import AdminLogin from "@/pages/admin/Login";
import Dashboard from "@/pages/admin/Dashboard";
import Projects from "@/pages/admin/Projects";
import Drops from "@/pages/admin/Drops";
import Activity from "@/pages/admin/Activity";
import Settings from "@/pages/admin/Settings";
import Notifications from "@/pages/admin/Notifications";

import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";

function ProtectedRoute({ component: Component, requiredRole }: { component: React.ComponentType; requiredRole?: string }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const shouldRedirect = user && requiredRole && user.role !== requiredRole;
  const redirectTarget = user?.role === "admin" ? "/admin/dashboard" : "/organizer/dashboard";

  useEffect(() => {
    if (shouldRedirect) {
      setLocation(redirectTarget);
    }
  }, [shouldRedirect, redirectTarget, setLocation]);

  if (isLoading) {
    return <div className="h-screen w-full flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  }

  if (!user) {
    return <AdminLogin />;
  }

  if (shouldRedirect) {
    return null;
  }

  return <Component />;
}

function OrganizerDashboardPlaceholder() {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold" data-testid="text-organizer-title">Organizer Dashboard</h1>
        <p className="text-muted-foreground" data-testid="text-organizer-coming-soon">Coming soon! Your organizer dashboard is being built.</p>
        <p className="text-sm text-muted-foreground" data-testid="text-organizer-email">Logged in as: {user?.email}</p>
        <button onClick={() => logout()} className="text-primary underline" data-testid="button-organizer-logout">Logout</button>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/claim/:locationId" component={Claim} />
      <Route path="/access" component={AccessCode} />
      <Route path="/gallery/:locationId" component={Gallery} />
      <Route path="/my-nfts" component={MyNfts} />
      <Route path="/embed/:locationId" component={Embed} />
      <Route path="/register" component={Register} />
      
      <Route path="/admin/login" component={AdminLogin} />
      
      <Route path="/admin/dashboard">
        {() => <ProtectedRoute component={Dashboard} requiredRole="admin" />}
      </Route>
      <Route path="/admin/projects">
        {() => <ProtectedRoute component={Projects} requiredRole="admin" />}
      </Route>
      <Route path="/admin/drops">
        {() => <ProtectedRoute component={Drops} requiredRole="admin" />}
      </Route>
      <Route path="/admin/activity">
        {() => <ProtectedRoute component={Activity} requiredRole="admin" />}
      </Route>
      <Route path="/admin/settings">
        {() => <ProtectedRoute component={Settings} requiredRole="admin" />}
      </Route>
      <Route path="/admin/notifications">
        {() => <ProtectedRoute component={Notifications} requiredRole="admin" />}
      </Route>

      <Route path="/organizer/dashboard">
        {() => <ProtectedRoute component={OrganizerDashboardPlaceholder} />}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}

export default App;
