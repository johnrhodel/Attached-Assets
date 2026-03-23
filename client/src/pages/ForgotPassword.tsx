import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, ChevronLeft, CheckCircle } from "lucide-react";
import { Link } from "wouter";
import { LanguageSelector } from "@/components/language-selector";
import { useI18n } from "@/lib/i18n/context";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

type Step = "email" | "code" | "newPassword" | "done";

export default function ForgotPassword() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useI18n();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.status === 429) {
        toast({ variant: "destructive", title: t.toasts.rateLimited, description: t.toasts.rateLimitedDesc });
        return;
      }
      if (!res.ok) throw new Error("Failed to send code");
      toast({ title: t.auth.forgotCodeSent, description: t.auth.forgotCodeSentDesc });
      setStep("code");
    } catch {
      toast({ variant: "destructive", title: t.common.error, description: t.auth.forgotSendFailed });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/verify-reset-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Invalid code");
      }
      setStep("newPassword");
    } catch (err: any) {
      toast({ variant: "destructive", title: t.common.error, description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Reset failed");
      }
      setStep("done");
    } catch (err: any) {
      toast({ variant: "destructive", title: t.common.error, description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-accent/20 p-4 relative">
      <div className="absolute top-4 left-4">
        <Link href="/admin/login" data-testid="link-back-login">
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
          <CardTitle className="text-3xl font-serif font-bold text-primary" data-testid="text-forgot-title">
            {t.auth.forgotTitle}
          </CardTitle>
          <CardDescription>{t.auth.forgotSubtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          {step === "done" ? (
            <div className="text-center space-y-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <p className="text-lg font-medium" data-testid="text-reset-success">{t.auth.passwordResetSuccess}</p>
              <Button className="w-full h-12" onClick={() => setLocation("/admin/login")} data-testid="button-go-login">
                {t.nav.login}
              </Button>
            </div>
          ) : step === "email" ? (
            <form onSubmit={handleSendCode} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">{t.auth.email}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12"
                  data-testid="input-forgot-email"
                />
              </div>
              <Button type="submit" className="w-full h-12 text-lg font-medium" disabled={isSubmitting} data-testid="button-send-code">
                {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : t.auth.forgotSendCode}
              </Button>
            </form>
          ) : step === "code" ? (
            <form onSubmit={handleVerifyCode} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="code">{t.auth.forgotCodeLabel}</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  maxLength={6}
                  className="h-12 text-center text-2xl tracking-widest font-mono"
                  data-testid="input-forgot-code"
                />
                <p className="text-xs text-muted-foreground">{t.auth.forgotCodeHint}</p>
              </div>
              <Button type="submit" className="w-full h-12 text-lg font-medium" disabled={isSubmitting} data-testid="button-verify-code">
                {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : t.common.next}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div className="space-y-2">
                <Label>{t.auth.forgotCodeLabel}</Label>
                <div className="h-12 flex items-center px-3 bg-muted rounded-md font-mono text-lg tracking-widest">
                  {code}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">{t.auth.forgotNewPassword}</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  className="h-12"
                  data-testid="input-new-password"
                />
                <p className="text-xs text-muted-foreground">{t.auth.passwordMin}</p>
              </div>
              <Button type="submit" className="w-full h-12 text-lg font-medium" disabled={isSubmitting} data-testid="button-reset-password">
                {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : t.auth.forgotResetButton}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
