import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ClaimCard } from "@/components/ClaimCard";
import { LanguageSelector } from "@/components/language-selector";
import { Loader2, KeyRound, ArrowRight, Layers, QrCode, ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n/context";
import { Link } from "wouter";
import claimBg from "../assets/images/claim-bg.jpg";

export default function AccessCode() {
  const { t } = useI18n();
  const [, setLocation] = useLocation();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!code.trim()) return;
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/access-code/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.message === "INVALID_CODE") {
          setError(t.accessCode.invalidCode);
        } else {
          setError(data.message || t.accessCode.invalidCode);
        }
        return;
      }

      const data = await res.json();
      setLocation(`/claim/${data.locationId}?dropId=${data.drop.id}`);
    } catch {
      setError(t.accessCode.invalidCode);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex flex-col items-center overflow-hidden">
      <img src={claimBg} alt="Scenic travel destination" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black/70" />

      <div className="relative z-20 w-full max-w-sm sm:max-w-md flex items-center justify-between gap-3 flex-wrap px-4 py-4 sm:px-6 sm:py-5 mx-auto">
        <Link href="/">
          <div className="flex items-center gap-2 flex-wrap cursor-pointer" data-testid="link-back-home">
            <ChevronLeft className="w-4 h-4 text-white/70" />
            <div className="w-7 h-7 bg-white/20 backdrop-blur-sm rounded-md flex items-center justify-center">
              <Layers className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-serif font-bold text-base text-white">Mintoria</span>
          </div>
        </Link>
        <LanguageSelector />
      </div>

      <div className="relative z-10 w-full max-w-sm sm:max-w-md mx-auto flex-1 flex flex-col justify-center px-4 sm:px-0 pb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <ClaimCard title={t.accessCode.title}>
            <div className="space-y-4">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <KeyRound className="w-7 h-7 text-primary" />
              </div>

              {error && (
                <div className="text-xs text-center text-destructive bg-destructive/10 rounded-md py-2 px-3" data-testid="text-access-code-error">
                  {error}
                </div>
              )}

              <Input
                type="text"
                placeholder={t.accessCode.placeholder}
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === "Enter" && code && handleSubmit()}
                className="text-center tracking-widest font-mono text-lg uppercase"
                autoFocus
                data-testid="input-access-code"
              />

              <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={!code.trim() || isLoading}
                data-testid="button-submit-access-code"
              >
                {isLoading ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : <ArrowRight className="mr-2 w-4 h-4" />}
                {t.accessCode.submit}
              </Button>

              <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1.5">
                <QrCode className="w-3 h-3" />
                {t.accessCode.or}
              </p>
            </div>
          </ClaimCard>
        </motion.div>
      </div>
    </div>
  );
}
