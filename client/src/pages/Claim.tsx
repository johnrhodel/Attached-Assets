import { useState } from "react";
import { useRoute } from "wouter";
import { useActiveDrop } from "@/hooks/use-drops";
import { useCreateClaimSession, useWalletless, useConfirmMint } from "@/hooks/use-claim";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClaimCard } from "@/components/ClaimCard";
import { LanguageSelector } from "@/components/language-selector";
import { WalletSuggestions } from "@/components/WalletSuggestions";
import { Loader2, CheckCircle2, Wallet, Mail, ArrowRight, Download, Layers, ImageDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n/context";
import { Link } from "wouter";
import claimBg from "../assets/images/claim-bg.jpg";

type ClaimView = "landing" | "method" | "wallet" | "email" | "walletSuggestions" | "success";

export default function Claim() {
  const [, params] = useRoute("/claim/:locationId");
  const locationId = Number(params?.locationId);
  const { t } = useI18n();
  
  const { data: drop, isLoading, error } = useActiveDrop(locationId);
  const { mutateAsync: createSession } = useCreateClaimSession();
  
  const [claimToken, setClaimToken] = useState<string | null>(null);
  const [view, setView] = useState<ClaimView>("landing");

  if (isLoading) return (
    <div className="h-screen w-full flex items-center justify-center bg-background">
      <Loader2 className="animate-spin text-primary w-8 h-8" />
    </div>
  );
  
  if (!drop || error) return (
    <div className="h-screen w-full flex flex-col items-center justify-center p-4 text-center relative">
      <img src={claimBg} alt="Scenic travel destination" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/60" />
      <div className="absolute top-4 right-4 z-20"><LanguageSelector /></div>
      <div className="relative z-10 flex flex-col items-center">
        <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mb-5">
          <Layers className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-serif font-bold mb-2 text-white" data-testid="text-no-active-drop">{t.claim.noActiveDrop}</h1>
        <Link href="/">
          <Button variant="outline" className="mt-4 bg-white/10 backdrop-blur-sm border-white/20 text-white" data-testid="button-back-home">{t.common.back}</Button>
        </Link>
      </div>
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
    <div className="min-h-screen w-full relative flex flex-col items-center overflow-hidden">
      <img src={claimBg} alt="Scenic travel destination" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black/70" />

      <div className="relative z-20 w-full max-w-sm sm:max-w-md flex items-center justify-between gap-3 flex-wrap px-4 py-4 sm:px-6 sm:py-5 mx-auto">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="w-7 h-7 bg-white/20 backdrop-blur-sm rounded-md flex items-center justify-center">
            <Layers className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-serif font-bold text-base text-white">Mintoria</span>
        </div>
        <LanguageSelector />
      </div>

      <div className="relative z-10 w-full max-w-sm sm:max-w-md mx-auto flex-1 flex flex-col justify-center px-4 sm:px-0 pb-8">
        <AnimatePresence mode="wait">
          {view === "landing" && (
            <motion.div key="landing" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, y: -20 }} className="w-full">
              <ClaimCard className="p-0 overflow-hidden border-0 shadow-2xl">
                <div className="aspect-[4/3] w-full relative">
                  <img src={drop.imageUrl} alt={drop.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-5 sm:p-6 text-white">
                    <p className="text-xs sm:text-sm font-medium opacity-75 mb-1">{drop.month} {drop.year}</p>
                    <h1 className="text-xl sm:text-2xl font-serif font-bold">{drop.title}</h1>
                    <p className="text-xs sm:text-sm opacity-60 mt-1">{drop.mintedCount} / {drop.supply} {t.claim.supplyRemaining}</p>
                  </div>
                </div>
                <div className="p-5 sm:p-6 bg-card text-center">
                  <p className="text-muted-foreground text-sm mb-4 sm:mb-5">{t.claim.subtitle}</p>
                  <Button size="lg" className="w-full font-semibold" onClick={startClaim} data-testid="button-claim-start">
                    {t.claim.claimNow} <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </ClaimCard>
            </motion.div>
          )}

          {view === "method" && (
            <motion.div key="method" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <ClaimCard title={t.claim.selectMethod}>
                <div className="grid gap-3">
                  <div
                    className="flex items-center gap-3 p-4 rounded-md border border-border cursor-pointer hover-elevate"
                    onClick={() => setView("email")}
                    role="button"
                    tabIndex={0}
                    data-testid="button-method-email"
                  >
                    <div className="w-10 h-10 shrink-0 rounded-md bg-blue-500/10 text-blue-600 flex items-center justify-center">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div className="text-left min-w-0">
                      <div className="font-semibold text-foreground text-sm">{t.claim.email}</div>
                      <div className="text-xs text-muted-foreground truncate">{t.email.devNote}</div>
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-3 p-4 rounded-md border border-border cursor-pointer hover-elevate"
                    onClick={() => setView("wallet")}
                    role="button"
                    tabIndex={0}
                    data-testid="button-method-wallet"
                  >
                    <div className="w-10 h-10 shrink-0 rounded-md bg-purple-500/10 text-purple-600 flex items-center justify-center">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div className="text-left min-w-0">
                      <div className="font-semibold text-foreground text-sm">{t.claim.wallet}</div>
                      <div className="text-xs text-muted-foreground truncate">MetaMask, Phantom, Freighter</div>
                    </div>
                  </div>

                  <Button 
                    variant="ghost" 
                    onClick={() => setView("walletSuggestions")}
                    data-testid="button-need-wallet"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {t.claim.noWallet}
                  </Button>
                </div>
              </ClaimCard>
            </motion.div>
          )}

          {view === "email" && claimToken && (
            <motion.div key="email" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <EmailFlow claimToken={claimToken} drop={drop} onSuccess={() => setView("success")} onBack={() => setView("method")} />
            </motion.div>
          )}

          {view === "wallet" && claimToken && (
            <motion.div key="wallet" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <WalletFlow claimToken={claimToken} drop={drop} onSuccess={() => setView("success")} onBack={() => setView("method")} />
            </motion.div>
          )}

          {view === "walletSuggestions" && (
            <motion.div key="walletSuggestions" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <WalletSuggestions onBack={() => setView("method")} />
            </motion.div>
          )}

          {view === "success" && (
            <motion.div key="success" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center w-full">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold mb-2 text-white" data-testid="text-mint-success">{t.claim.mintSuccess}</h2>
              <p className="text-white/70 mb-6 max-w-xs mx-auto text-sm" data-testid="text-mint-success-desc">{t.claim.mintSuccessDesc}</p>
              <div className="p-3 sm:p-4 bg-card rounded-xl shadow-sm border mb-5 max-w-xs mx-auto">
                <img src={drop.imageUrl} alt={`${drop.title} - NFT artwork`} className="w-full aspect-square object-cover rounded-md mb-3" />
                <p className="font-medium text-sm">{drop.title}</p>
              </div>
              <div className="flex flex-col gap-3 max-w-xs mx-auto">
                <Button 
                  size="lg"
                  className="w-full font-semibold"
                  onClick={() => handleDownloadImage(drop.imageUrl, drop.title)}
                  data-testid="button-download-image"
                >
                  <ImageDown className="w-5 h-5 mr-2" />
                  {t.claim.downloadImage}
                </Button>
                <p className="text-white/50 text-xs" data-testid="text-download-desc">{t.claim.downloadImageDesc}</p>
                <Button onClick={() => window.location.reload()} variant="outline" className="bg-white/10 backdrop-blur-sm border-white/20 text-white" data-testid="button-claim-another">{t.common.back}</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function handleDownloadImage(imageUrl: string, title: string) {
  const link = document.createElement("a");
  link.href = imageUrl;
  link.download = `${title.replace(/\s+/g, "-").toLowerCase()}-mintoria.png`;
  link.target = "_blank";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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
        mine.mutate({ email, code, chain: "evm", claimToken }, { onSuccess });
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
              data-testid="input-email"
            />
          </div>
          <Button className="w-full" onClick={handleSendCode} disabled={!email || start.isPending} data-testid="button-send-code">
            {start.isPending ? <Loader2 className="animate-spin" /> : t.email.sendCode}
          </Button>
          <Button variant="ghost" className="w-full" onClick={onBack} data-testid="button-email-back">{t.common.back}</Button>
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
              className="text-center tracking-widest"
              data-testid="input-code"
            />
            <p className="text-xs text-center text-muted-foreground">{t.email.devNote}</p>
          </div>
          <Button className="w-full" onClick={handleVerifyAndMint} disabled={!code || verify.isPending || mine.isPending} data-testid="button-verify-mint">
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
      mutate({ claimToken, txHash: "0xmockhash123456789", chain }, { onSuccess });
    }, 1500);
  };

  return (
    <ClaimCard title={t.claim.wallet} description={t.claim.selectChain}>
      <div className="grid gap-3">
        {drop.enabledChains.includes("evm") && (
          <div
            className="flex items-center justify-between gap-3 p-4 rounded-md border border-border cursor-pointer hover-elevate"
            onClick={() => !isPending && handleMockMint("evm")}
            role="button"
            tabIndex={0}
            data-testid="button-chain-evm"
          >
            <span className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-500 rounded-full"/> <span className="text-sm font-medium">{t.chains.evm}</span></span>
            {isPending && <Loader2 className="animate-spin w-4 h-4 text-muted-foreground" />}
          </div>
        )}
        {drop.enabledChains.includes("solana") && (
          <div
            className="flex items-center justify-between gap-3 p-4 rounded-md border border-border cursor-pointer hover-elevate"
            onClick={() => !isPending && handleMockMint("solana")}
            role="button"
            tabIndex={0}
            data-testid="button-chain-solana"
          >
            <span className="flex items-center gap-2"><div className="w-3 h-3 bg-purple-500 rounded-full"/> <span className="text-sm font-medium">{t.chains.solana}</span></span>
            {isPending && <Loader2 className="animate-spin w-4 h-4 text-muted-foreground" />}
          </div>
        )}
        {drop.enabledChains.includes("stellar") && (
          <div
            className="flex items-center justify-between gap-3 p-4 rounded-md border border-border cursor-pointer hover-elevate"
            onClick={() => !isPending && handleMockMint("stellar")}
            role="button"
            tabIndex={0}
            data-testid="button-chain-stellar"
          >
            <span className="flex items-center gap-2"><div className="w-3 h-3 bg-black dark:bg-white rounded-full"/> <span className="text-sm font-medium">{t.chains.stellar}</span></span>
            {isPending && <Loader2 className="animate-spin w-4 h-4 text-muted-foreground" />}
          </div>
        )}
        <Button variant="ghost" className="mt-1" onClick={onBack} data-testid="button-wallet-back">{t.common.back}</Button>
      </div>
    </ClaimCard>
  );
}
