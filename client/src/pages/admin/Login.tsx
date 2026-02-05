import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { LanguageSelector } from "@/components/language-selector";
import { useI18n } from "@/lib/i18n/context";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoggingIn, user } = useAuth();
  const [, setLocation] = useLocation();
  const { t } = useI18n();

  if (user) {
    setLocation("/admin/dashboard");
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ email, password });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-accent/20 p-4 relative">
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
                placeholder="admin@memory.xyz"
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
        </CardContent>
      </Card>
    </div>
  );
}
