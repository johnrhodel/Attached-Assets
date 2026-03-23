import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, ChevronLeft } from "lucide-react";
import { useLocation, Link } from "wouter";
import { LanguageSelector } from "@/components/language-selector";
import { useI18n } from "@/lib/i18n/context";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoggingIn, user } = useAuth();
  const [, setLocation] = useLocation();
  const { t } = useI18n();

  if (user) {
    if (user.role === "admin") {
      setLocation("/admin/dashboard");
    } else {
      setLocation("/organizer/dashboard");
    }
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ email, password });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-accent/20 p-4 relative">
      <div className="absolute top-4 left-4">
        <Link href="/" data-testid="link-back-home">
          <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground">
            <ChevronLeft className="w-4 h-4" />
            {t.common.back}
          </Button>
        </Link>
      </div>
      <div className="absolute top-4 right-4">
        <LanguageSelector />
      </div>
      <Card className="w-full max-w-md shadow-xl border-primary/10">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-serif font-bold text-primary">{t.admin.login}</CardTitle>
          <CardDescription>{t.admin.welcome}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">{t.admin.email}</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12"
                data-testid="input-login-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t.admin.password}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12"
                data-testid="input-login-password"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 text-lg font-medium" 
              disabled={isLoggingIn}
              data-testid="button-login-submit"
            >
              {isLoggingIn ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : t.admin.loginButton}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            {t.auth.noAccount}{" "}
            <Link href="/register" className="text-primary font-medium hover:underline" data-testid="link-to-register">
              {t.auth.registerLink}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
