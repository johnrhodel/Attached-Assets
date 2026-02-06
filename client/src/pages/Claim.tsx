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
    <div className="h-screen w-full flex flex-col items-center justify-center bg-background p-4 text-center relative">
      <img src={claimBg} alt="Scenic travel destination" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/60" />
      <div className="absolute top-4 right-4 z-20"><LanguageSelector /></div>
      <div className="relative z-10">
        <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mb-4 mx-auto">
          <Layers className="w-6 h-6 text-white" />
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

      <div className="relative z-20 w-full max-w-md flex items-center justify-between p-4 md:p-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-white/20 backdrop-blur-sm rounded-md flex items-center justify-center">
            <Layers className="w-3 h-3 text-white" />
          </div>
          <span className="font-serif font-bold text-sm text-white">Mintoria</span>
        </div>
        <LanguageSelector />
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto flex-1 flex flex-col justify-center p-4 md:p-8 pb-12">
        <AnimatePresence mode="wait">
          {view === "landing" && (
            <motion.div key="landing" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, y: -20 }} className="w-full">
              <ClaimCard className="p-0 overflow-hidden border-0 shadow-2xl">
                <div className="aspect-[4/3] w-full relative">
                  <img src={drop.imageUrl} alt={drop.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 text-white">
                    <p className="text-sm font-medium opacity-75 mb-1">{drop.month} {drop.year}</p>
                    <h1 className="text-2xl font-serif font-bold">{drop.title}</h1>
                    <p className="text-sm opacity-60 mt-1">{drop.mintedCount} / {drop.supply} {t.claim.supplyRemaining}</p>
                  </div>
                </div>
                <div className="p-6 bg-card text-center">
                  <p className="text-muted-foreground text-sm mb-5">{t.claim.subtitle}</p>
                  <Button size="lg" className="w-full text-base font-semibold" onClick={startClaim} data-testid="button-claim-start">
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
                  <Button 
                    variant="outline" 
                    className="h-auto py-5 justify-start px-5 rounded-md border group"
                    onClick={() => setView("email")}
                    data-testid="button-method-email"
                  >
                    <div className="h-9 w-9 rounded-md bg-blue-500/10 text-blue-600 flex items-center justify-center mr-4">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-foreground">{t.claim.email}</div>
                      <div className="text-xs text-muted-foreground">{t.email.devNote}</div>
                    </div>
                  </Button>

                  <Button 
                    variant="outline" 
                    className="h-auto py-5 justify-start px-5 rounded-md border group"
                    onClick={() => setView("wallet")}
                    data-testid="button-method-wallet"
                  >
                    <div className="h-9 w-9 rounded-md bg-purple-500/10 text-purple-600 flex items-center justify-center mr-4">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-foreground">{t.claim.wallet}</div>
                      <div className="text-xs text-muted-foreground">MetaMask, Phantom, Freighter</div>
                    </div>
                  </Button>

                  <Button 
                    variant="ghost" 
                    className="h-auto py-3 justify-start px-5 text-muted-foreground"
                    onClick={() => setView("walletSuggestions")}
                    data-testid="button-need-wallet"
                  >
                    <Download className="w-4 h-4 mr-3" />
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
            <motion.div key="success" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
              <div className="w-20 h-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-serif font-bold mb-3 text-white" data-testid="text-mint-success">{t.claim.mintSuccess}</h2>
              <p className="text-white/70 mb-8 max-w-xs mx-auto text-sm" data-testid="text-mint-success-desc">{t.claim.mintSuccessDesc}</p>
              <div className="p-4 bg-card rounded-xl shadow-sm border mb-4 max-w-xs mx-auto">
                <img src={drop.imageUrl} alt={`${drop.title} - NFT artwork`} className="w-full aspect-square object-cover rounded-md mb-3" />
                <p className="font-medium text-sm">{drop.title}</p>
              </div>
              <div className="flex flex-col gap-3 max-w-xs mx-auto">
                <Button 
                  size="lg"
                  className="w-full text-base font-semibold"
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
              className="h-12 text-lg"
              data-testid="input-email"
            />
          </div>
          <Button className="w-full h-12" onClick={handleSendCode} disabled={!email || start.isPending} data-testid="button-send-code">
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
      mutate({ claimToken, txHash: "0xmockhash123456789", chain }, { onSuccess });
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
            <span className="flex items-center gap-2"><div className="w-3 h-3 bg-black dark:bg-white rounded-full"/> {t.chains.stellar}</span>
            {isPending && <Loader2 className="animate-spin w-4 h-4" />}
          </Button>
        )}
        <Button variant="ghost" className="mt-2" onClick={onBack} data-testid="button-wallet-back">{t.common.back}</Button>
      </div>
    </ClaimCard>
  );
}
