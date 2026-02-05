import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { useActiveDrop } from "@/hooks/use-drops";
import { useCreateClaimSession, useWalletless, useConfirmMint } from "@/hooks/use-claim";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClaimCard } from "@/components/ClaimCard";
import { LanguageSelector } from "@/components/language-selector";
import { Loader2, CheckCircle2, Wallet, Mail, ArrowRight, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n/context";

export default function Claim() {
  const [, params] = useRoute("/claim/:locationId");
  const locationId = Number(params?.locationId);
  const { t } = useI18n();
  
  const { data: drop, isLoading, error } = useActiveDrop(locationId);
  const { mutateAsync: createSession } = useCreateClaimSession();
  
  const [claimToken, setClaimToken] = useState<string | null>(null);
  const [view, setView] = useState<"landing" | "method" | "wallet" | "email" | "success">("landing");

  if (isLoading) return <div className="h-screen w-full flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>;
  if (!drop || error) return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-background p-4 text-center">
      <LanguageSelector />
      <h1 className="text-2xl font-serif font-bold mb-2">{t.claim.noActiveDrop}</h1>
      <p className="text-muted-foreground">{t.claim.noActiveDrop}</p>
    </div>
  );

  const startClaim = async () => {
    try {
      const session = await createSession(locationId);
      setClaimToken(session.token);
      setView("method");
    } catch (e) {
      // Error handled by query hook toast
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f8f8fa] dark:bg-background flex flex-col items-center p-4 md:p-8 relative overflow-hidden">
      {/* Language Selector */}
      <div className="absolute top-4 right-4 z-20">
        <LanguageSelector />
      </div>

      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="z-10 w-full max-w-md mx-auto flex-1 flex flex-col justify-center pb-12">
        <header className="text-center mb-8">
          <h3 className="text-sm uppercase tracking-widest text-muted-foreground font-medium mb-2">{t.claim.title}</h3>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground">{drop.title}</h1>
        </header>

        <AnimatePresence mode="wait">
          {view === "landing" && (
            <motion.div
              key="landing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full"
            >
              <ClaimCard className="p-0 overflow-hidden border-0 shadow-2xl">
                <div className="aspect-[4/3] w-full relative">
                  <img src={drop.imageUrl} alt={drop.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-8 text-white">
                    <p className="text-lg font-medium opacity-90">{drop.month} {drop.year}</p>
                    <p className="text-sm opacity-75 mt-1">{drop.mintedCount} / {drop.supply} {t.claim.supplyRemaining}</p>
                  </div>
                </div>
                <div className="p-8 bg-card text-center">
                  <p className="text-muted-foreground mb-6">
                    {t.claim.subtitle}
                  </p>
                  <Button size="lg" className="w-full h-14 text-lg font-semibold shadow-lg shadow-primary/25 rounded-xl" onClick={startClaim} data-testid="button-claim-start">
                    {t.claim.claimNow} <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </div>
              </ClaimCard>
            </motion.div>
          )}

          {view === "method" && (
            <ClaimCard title={t.claim.selectMethod}>
              <div className="grid gap-4">
                <Button 
                  variant="outline" 
                  className="h-auto py-6 justify-start px-6 rounded-xl border-2 hover:border-primary hover:bg-primary/5 transition-all group"
                  onClick={() => setView("email")}
                  data-testid="button-method-email"
                >
                  <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-foreground text-lg">{t.claim.email}</div>
                    <div className="text-sm text-muted-foreground">{t.email.devNote}</div>
                  </div>
                </Button>

                <Button 
                  variant="outline" 
                  className="h-auto py-6 justify-start px-6 rounded-xl border-2 hover:border-primary hover:bg-primary/5 transition-all group"
                  onClick={() => setView("wallet")}
                  data-testid="button-method-wallet"
                >
                  <div className="h-10 w-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-foreground text-lg">{t.claim.wallet}</div>
                    <div className="text-sm text-muted-foreground">MetaMask, Phantom, Freighter</div>
                  </div>
                </Button>
              </div>
            </ClaimCard>
          )}

          {view === "email" && claimToken && (
            <EmailFlow claimToken={claimToken} drop={drop} onSuccess={() => setView("success")} onBack={() => setView("method")} />
          )}

          {view === "wallet" && claimToken && (
            <WalletFlow claimToken={claimToken} drop={drop} onSuccess={() => setView("success")} onBack={() => setView("method")} />
          )}

          {view === "success" && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center"
            >
              <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h2 className="text-3xl font-serif font-bold mb-4">{t.claim.mintSuccess}</h2>
              <p className="text-muted-foreground mb-8 max-w-xs mx-auto">
                {t.claim.subtitle}
              </p>
              <div className="p-4 bg-white dark:bg-card rounded-2xl shadow-sm border mb-8 max-w-xs mx-auto">
                <img src={drop.imageUrl} alt="Memory" className="w-full aspect-square object-cover rounded-xl mb-3" />
                <p className="font-medium text-sm">{drop.title}</p>
              </div>
              <Button onClick={() => window.location.reload()} variant="outline" data-testid="button-claim-another">{t.common.back}</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function EmailFlow({ claimToken, drop, onSuccess, onBack }: any) {
  const { t } = useI18n();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const { start, verify, mine } = useWalletless();

  const handleSendCode = () => {
    start.mutate(email, { onSuccess: () => setStep("code") });
  };

  const handleVerifyAndMint = () => {
    verify.mutate({ email, code }, {
      onSuccess: () => {
        mine.mutate({ email, code, chain: "evm", claimToken }, {
          onSuccess: onSuccess
        });
      }
    });
  };

  return (
    <ClaimCard title={step === "email" ? t.email.enterEmail : t.email.enterCode}>
      {step === "email" ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t.admin.email}</Label>
            <Input 
              type="email" 
              placeholder={t.email.emailPlaceholder}
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              className="h-12 text-lg"
              data-testid="input-email"
            />
          </div>
          <Button className="w-full h-12" onClick={handleSendCode} disabled={!email || start.isPending} data-testid="button-send-code">
            {start.isPending ? <Loader2 className="animate-spin" /> : t.email.sendCode}
          </Button>
          <Button variant="ghost" className="w-full" onClick={onBack} data-testid="button-back">{t.common.back}</Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t.email.enterCode}</Label>
            <Input 
              type="text" 
              placeholder={t.email.codePlaceholder}
              value={code} 
              onChange={e => setCode(e.target.value)} 
              className="h-12 text-lg text-center tracking-widest"
              data-testid="input-code"
            />
            <p className="text-xs text-center text-muted-foreground">{t.email.devNote}</p>
          </div>
          <Button className="w-full h-12" onClick={handleVerifyAndMint} disabled={!code || verify.isPending || mine.isPending} data-testid="button-verify-mint">
            {(verify.isPending || mine.isPending) ? <Loader2 className="animate-spin" /> : t.email.verifyCode}
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => setStep("email")}>{t.common.back}</Button>
        </div>
      )}
    </ClaimCard>
  );
}

function WalletFlow({ claimToken, drop, onSuccess, onBack }: any) {
  const { t } = useI18n();
  const { mutate, isPending } = useConfirmMint();
  
  const handleMockMint = (chain: "evm" | "solana" | "stellar") => {
    setTimeout(() => {
      mutate({ 
        claimToken, 
        txHash: "0xmockhash123456789", 
        chain 
      }, { onSuccess });
    }, 1500);
  };

  return (
    <ClaimCard title={t.claim.wallet} description={t.claim.selectChain}>
      <div className="grid gap-3">
        {drop.enabledChains.includes("evm") && (
          <Button variant="outline" className="h-14 justify-between" onClick={() => handleMockMint("evm")} disabled={isPending} data-testid="button-chain-evm">
            <span className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-500 rounded-full"/> {t.chains.evm}</span>
            {isPending && <Loader2 className="animate-spin w-4 h-4" />}
          </Button>
        )}
        {drop.enabledChains.includes("solana") && (
          <Button variant="outline" className="h-14 justify-between" onClick={() => handleMockMint("solana")} disabled={isPending} data-testid="button-chain-solana">
            <span className="flex items-center gap-2"><div className="w-3 h-3 bg-purple-500 rounded-full"/> {t.chains.solana}</span>
            {isPending && <Loader2 className="animate-spin w-4 h-4" />}
          </Button>
        )}
        {drop.enabledChains.includes("stellar") && (
          <Button variant="outline" className="h-14 justify-between" onClick={() => handleMockMint("stellar")} disabled={isPending} data-testid="button-chain-stellar">
            <span className="flex items-center gap-2"><div className="w-3 h-3 bg-black rounded-full"/> {t.chains.stellar}</span>
            {isPending && <Loader2 className="animate-spin w-4 h-4" />}
          </Button>
        )}
        <Button variant="ghost" className="mt-2" onClick={onBack} data-testid="button-wallet-back">{t.common.back}</Button>
      </div>
    </ClaimCard>
  );
}
