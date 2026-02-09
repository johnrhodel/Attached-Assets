import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { LayoutDashboard, MapPin, Layers, LogOut, Menu, Settings, ClipboardList, Bell } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/language-selector";
import { useI18n } from "@/lib/i18n/context";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";
import mintoriaLogo from "@assets/johnrhodel_create_a_logo_for_my_entreprise_called_mintoria_a___1770674059629.png";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);
  const { t } = useI18n();

  const navItems = [
    { href: "/admin/dashboard", label: t.nav.dashboard, icon: LayoutDashboard },
    { href: "/admin/projects", label: t.nav.projects, icon: MapPin },
    { href: "/admin/drops", label: t.nav.drops, icon: Layers },
    { href: "/admin/activity", label: t.nav.activity || "Activity", icon: ClipboardList },
    { href: "/admin/notifications", label: t.nav.notifications || "Notifications", icon: Bell },
    { href: "/admin/settings", label: t.nav.settings || "Settings", icon: Settings },
  ];

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-6 py-6 flex items-center gap-3">
        <img src={mintoriaLogo} alt="Mintoria" className="w-10 h-10 rounded-lg" />
        <h1 className="text-2xl font-serif font-bold text-primary">Mintoria</h1>
      </div>
      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
              isActive 
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}>
              <item.icon className={cn("w-5 h-5", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary")} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-border space-y-2">
        <div className="px-2">
          <LanguageSelector />
        </div>
        <Button 
          variant="ghost" 
          className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={() => logout()}
          data-testid="button-logout"
        >
          <LogOut className="w-4 h-4 mr-2" />
          {t.nav.logout}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 border-r border-border bg-card">
        <NavContent />
      </aside>

      {/* Mobile Header */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden h-16 border-b border-border bg-card flex items-center px-4 justify-between">
          <div className="flex items-center gap-2">
            <img src={mintoriaLogo} alt="Mintoria" className="w-8 h-8 rounded-lg" />
            <span className="font-serif font-bold text-primary text-xl">Mintoria</span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" data-testid="button-mobile-menu">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64">
                <NavContent />
              </SheetContent>
            </Sheet>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-accent/30">
          <div className="max-w-6xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
