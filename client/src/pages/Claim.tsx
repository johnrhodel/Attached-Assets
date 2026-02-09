import { useState, useEffect, useCallback } from "react";
import { useRoute } from "wouter";
import { useActiveDrop } from "@/hooks/use-drops";
import { useCreateClaimSession, useWalletless, useConfirmMint } from "@/hooks/use-claim";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ClaimCard } from "@/components/ClaimCard";
import { LanguageSelector } from "@/components/language-selector";
import { Loader2, CheckCircle2, Wallet, Mail, ArrowRight, Layers, ImageDown, ExternalLink, ChevronLeft, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n/context";
import { Link } from "wouter";
import claimBg from "../assets/images/claim-bg.jpg";

function useBlockchainStatus() {
  return useQuery({
    queryKey: ["/api/blockchain/status"],
    staleTime: 30000,
  });
}

function getHealthyChain(): "stellar" {
  return "stellar";
}

function ConfettiEffect() {
  const [particles, setParticles] = useState<Array<{id: number; x: number; y: number; color: string; delay: number; size: number}>>([]);
  
  useEffect(() => {
    const colors = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4"];
    const items = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -(Math.random() * 20),
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 0.5,
      size: Math.random() * 8 + 4,
    }));
    setParticles(items);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map(p => (
        <motion.div
          key={p.id}
          initial={{ x: `${p.x}vw`, y: `${p.y}vh`, opacity: 1, rotate: 0 }}
          animate={{ y: "110vh", opacity: 0, rotate: Math.random() * 720 - 360 }}
          transition={{ duration: 2.5 + Math.random(), delay: p.delay, ease: "easeIn" }}
          style={{ position: "absolute", width: p.size, height: p.size, backgroundColor: p.color, borderRadius: Math.random() > 0.5 ? "50%" : "2px" }}
        />
      ))}
    </div>
  );
}

type ClaimView = "landing" | "method" | "wallet" | "email" | "success";

interface MintResult {
  txHash: string;
  address: string;
  explorerUrl?: string;
  chain?: string;
}

export default function Claim() {
  const [, params] = useRoute("/claim/:locationId");
  const locationId = Number(params?.locationId);
  const { t } = useI18n();
  
  const { data: drop, isLoading, error } = useActiveDrop(locationId);
  const { mutateAsync: createSession } = useCreateClaimSession();
  const { data: blockchainStatus } = useBlockchainStatus();
  
  const [claimToken, setClaimToken] = useState<string | null>(null);
  const [view, setView] = useState<ClaimView>("landing");
  const [mintResult, setMintResult] = useState<MintResult | null>(null);

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

  const handleMintSuccess = (result: MintResult) => {
    setMintResult(result);
    setView("success");
  };

  const currentStep = view === "landing" ? 0 : view === "method" ? 1 : view === "email" ? 2 : view === "success" ? 4 : 1;

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

      {view !== "landing" && view !== "success" && (
        <div className="relative z-20 w-full max-w-sm sm:max-w-md mx-auto px-4 sm:px-6 mb-4">
          <StepIndicator currentStep={currentStep} />
        </div>
      )}

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
                    className="flex items-center gap-3 p-4 rounded-md border border-border cursor-pointer hover-elevate relative"
                    onClick={() => setView("email")}
                    role="button"
                    tabIndex={0}
                    data-testid="button-method-email"
                  >
                    <div className="w-10 h-10 shrink-0 rounded-md bg-blue-500/10 text-blue-600 flex items-center justify-center">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div className="text-left min-w-0 flex-1">
                      <div className="font-semibold text-foreground text-sm">{t.claim.email}</div>
                      <div className="text-xs text-muted-foreground">{t.claim.emailDesc}</div>
                    </div>
                    <div className="shrink-0 px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-semibold rounded-full">{t.claim.recommended}</div>
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
                      <div className="text-xs text-muted-foreground">Freighter (Stellar)</div>
                    </div>
                  </div>

                  <Button 
                    variant="ghost" 
                    onClick={() => { setView("landing"); setClaimToken(null); }}
                    data-testid="button-method-back"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    {t.common.back}
                  </Button>
                </div>
              </ClaimCard>
            </motion.div>
          )}

          {view === "email" && claimToken && (
            <motion.div key="email" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="w-full">
              <EmailFlow 
                claimToken={claimToken} 
                drop={drop} 
                blockchainStatus={blockchainStatus}
                onSuccess={handleMintSuccess} 
                onBack={() => setView("method")} 
              />
            </motion.div>
          )}

          {view === "wallet" && claimToken && (
            <motion.div key="wallet" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <WalletFlow 
                claimToken={claimToken} 
                drop={drop} 
                blockchainStatus={blockchainStatus}
                onSuccess={handleMintSuccess} 
                onBack={() => setView("method")} 
              />
            </motion.div>
          )}

          {view === "success" && mintResult && (
            <motion.div key="success" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center w-full">
              <ConfettiEffect />
              <SuccessScreen drop={drop} mintResult={mintResult} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function StepIndicator({ currentStep }: { currentStep: number }) {
  const { t } = useI18n();
  const steps = [
    { num: 1, label: t.claim.stepMethod },
    { num: 2, label: t.claim.stepVerify },
    { num: 3, label: t.claim.stepMint },
  ];

  return (
    <div className="flex items-center justify-center gap-1" data-testid="step-indicator">
      {steps.map((step, i) => {
        const isActive = currentStep >= step.num;
        const isCurrent = currentStep === step.num;
        return (
          <div key={step.num} className="flex items-center gap-1">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
              isCurrent ? 'bg-white/20 text-white' : isActive ? 'text-white/70' : 'text-white/30'
            }`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                isActive ? 'bg-white/30' : 'bg-white/10'
              }`}>
                {isActive && currentStep > step.num ? <CheckCircle2 className="w-3 h-3" /> : step.num}
              </div>
              <span className="hidden sm:inline">{step.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-4 h-px ${isActive ? 'bg-white/40' : 'bg-white/15'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function MintingAnimation({ dropTitle }: { dropTitle: string }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-center py-8" data-testid="minting-animation">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-primary animate-pulse" />
        </div>
        <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" />
      </div>
      <h2 className="text-xl sm:text-2xl font-serif font-bold text-white mb-2">{t.claim.mintingTitle}</h2>
      <p className="text-white/60 text-sm max-w-xs">{t.claim.mintingDesc}</p>
      <p className="text-white/40 text-xs mt-3">{dropTitle}</p>
    </div>
  );
}

function SuccessScreen({ drop, mintResult }: { drop: any; mintResult: MintResult }) {
  const { t } = useI18n();
  const chainName = mintResult.chain === "solana" ? "Solana" : mintResult.chain === "evm" ? "Ethereum" : mintResult.chain === "stellar" ? "Stellar" : "Blockchain";
  const shortTx = mintResult.txHash.length > 16 ? `${mintResult.txHash.slice(0, 8)}...${mintResult.txHash.slice(-6)}` : mintResult.txHash;
  const shortAddr = mintResult.address.length > 16 ? `${mintResult.address.slice(0, 8)}...${mintResult.address.slice(-6)}` : mintResult.address;

  return (
    <>
      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-5">
        <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10" />
      </div>
      <h2 className="text-2xl sm:text-3xl font-serif font-bold mb-2 text-white" data-testid="text-mint-success">{t.claim.mintSuccess}</h2>
      <p className="text-white/70 mb-5 max-w-xs mx-auto text-sm" data-testid="text-mint-success-desc">{t.claim.mintSuccessDesc}</p>
      
      <div className="bg-card rounded-xl shadow-sm border mb-5 max-w-xs mx-auto overflow-hidden">
        <img src={drop.imageUrl} alt={`${drop.title} - NFT artwork`} className="w-full aspect-square object-cover" />
        <div className="p-4 space-y-3">
          <p className="font-serif font-bold text-sm">{drop.title}</p>
          
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">{t.claim.chain}</span>
              <span className="font-medium px-2 py-0.5 bg-primary/10 text-primary rounded-full text-[10px]" data-testid="text-chain-name">{chainName}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">{t.claim.walletAddress}</span>
              <span className="font-mono text-foreground" data-testid="text-wallet-address">{shortAddr}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">{t.claim.transaction}</span>
              <span className="font-mono text-foreground" data-testid="text-tx-hash">{shortTx}</span>
            </div>
          </div>

          {mintResult.explorerUrl && (
            <a 
              href={mintResult.explorerUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 w-full py-2 rounded-md bg-accent/50 text-xs font-medium text-foreground hover-elevate"
              data-testid="link-explorer"
            >
              {t.claim.viewOnExplorer} <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
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
        <Button onClick={() => window.location.reload()} variant="outline" className="bg-white/10 backdrop-blur-sm border-white/20 text-white" data-testid="button-claim-another">{t.common.back}</Button>
      </div>
    </>
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

function EmailFlow({ claimToken, drop, blockchainStatus, onSuccess, onBack }: { claimToken: string; drop: any; blockchainStatus: any; onSuccess: (result: MintResult) => void; onBack: () => void }) {
  const { t } = useI18n();
  const [step, setStep] = useState<"email" | "code" | "minting">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [flowError, setFlowError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const { start, mine } = useWalletless();

  const handleSendCode = async () => {
    setFlowError(null);
    setIsSending(true);
    try {
      const res = await fetch("/api/walletless/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to send code");
      }
      setStep("code");
    } catch (err: any) {
      console.error("[EmailFlow] Send code error:", err);
      setFlowError(err.message || "Failed to send verification code");
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyAndMint = async () => {
    setFlowError(null);
    setStep("minting");
    try {
      const res = await fetch("/api/walletless/mine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, chain: "stellar", claimToken }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Mint failed");
      }
      const data = await res.json();
      onSuccess({ ...data, chain: data.chain || "stellar" });
    } catch (err: any) {
      console.error("[EmailFlow] Mint error:", err);
      setFlowError(err.message || t.claim.mintFailed);
      setCode("");
      setStep("code");
    }
  };

  if (step === "minting") {
    return <MintingAnimation dropTitle={drop.title} />;
  }

  return (
    <ClaimCard title={step === "email" ? t.email.enterEmail : t.email.enterCode}>
      {step === "email" ? (
        <div className="space-y-4">
          {flowError && (
            <div className="text-xs text-center text-destructive bg-destructive/10 rounded-md py-2 px-3" data-testid="text-flow-error">
              {flowError}
            </div>
          )}
          <div className="space-y-2">
            <Input 
              type="email" 
              placeholder={t.email.emailPlaceholder}
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              onKeyDown={e => e.key === "Enter" && email && handleSendCode()}
              className="text-center"
              autoFocus
              data-testid="input-email"
            />
          </div>
          <Button className="w-full" onClick={handleSendCode} disabled={!email || isSending} data-testid="button-send-code">
            {isSending ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : <ArrowRight className="mr-2 w-4 h-4" />}
            {t.email.sendCode}
          </Button>
          <Button variant="ghost" className="w-full" onClick={onBack} data-testid="button-email-back">
            <ChevronLeft className="w-4 h-4 mr-1" />{t.common.back}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-center text-muted-foreground">{t.email.codeSentTo} <strong>{email}</strong></p>
          {flowError && (
            <div className="text-xs text-center text-destructive bg-destructive/10 rounded-md py-2 px-3" data-testid="text-mint-error">
              {flowError}
            </div>
          )}
          <div className="space-y-2">
            <Input 
              type="text" 
              placeholder={t.email.codePlaceholder}
              value={code} 
              onChange={e => setCode(e.target.value)} 
              onKeyDown={e => e.key === "Enter" && code && handleVerifyAndMint()}
              className="text-center tracking-[0.3em] font-mono text-lg"
              maxLength={6}
              autoFocus
              data-testid="input-code"
            />
            <p className="text-[10px] text-center text-muted-foreground/60">{t.email.devNote}</p>
          </div>
          <Button className="w-full" onClick={handleVerifyAndMint} disabled={!code || code.length < 6} data-testid="button-verify-mint">
            <Sparkles className="mr-2 w-4 h-4" />
            {t.claim.mintNow}
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => { setStep("email"); setFlowError(null); }} data-testid="button-code-back">
            <ChevronLeft className="w-4 h-4 mr-1" />{t.common.back}
          </Button>
        </div>
      )}
    </ClaimCard>
  );
}

function WalletFlow({ claimToken, drop, blockchainStatus, onSuccess, onBack }: { claimToken: string; drop: any; blockchainStatus: any; onSuccess: (result: MintResult) => void; onBack: () => void }) {
  const { t } = useI18n();
  const { mutate, isPending } = useConfirmMint();
  const [isMinting, setIsMinting] = useState(false);
  
  const handleMint = () => {
    setIsMinting(true);
    setTimeout(() => {
      mutate(
        { claimToken, txHash: `0x${Date.now().toString(16)}`, chain: "stellar" },
        {
          onSuccess: (data: any) => {
            onSuccess({
              txHash: data.txHash || `0x${Date.now().toString(16)}`,
              address: data.recipient || "wallet-connected",
              chain: "stellar",
            });
          },
          onError: () => { setIsMinting(false); onBack(); }
        }
      );
    }, 1500);
  };

  if (isMinting) {
    return <MintingAnimation dropTitle={drop.title} />;
  }

  const stellarHealthy = blockchainStatus?.stellar?.healthy ?? false;

  return (
    <ClaimCard title={t.claim.wallet}>
      <div className="grid gap-3">
        <div
          className={`flex items-center justify-between gap-3 p-4 rounded-md border border-border ${stellarHealthy ? 'cursor-pointer hover-elevate' : 'opacity-40 cursor-not-allowed'}`}
          onClick={() => stellarHealthy && !isPending && handleMint()}
          role="button"
          tabIndex={stellarHealthy ? 0 : -1}
          data-testid="button-chain-stellar"
        >
          <span className="flex items-center gap-2">
            <div className={`w-3 h-3 ${stellarHealthy ? 'bg-foreground' : 'bg-muted-foreground'} rounded-full`}/>
            <span className="text-sm font-medium">{t.chains.stellar}</span>
          </span>
          <div className="flex items-center gap-2">
            {stellarHealthy && (
              <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-semibold rounded-full">{t.claim.recommended}</span>
            )}
            {!stellarHealthy && (
              <span className="px-2 py-0.5 bg-muted text-muted-foreground text-[10px] font-semibold rounded-full">Offline</span>
            )}
            {isPending && <Loader2 className="animate-spin w-4 h-4 text-muted-foreground" />}
          </div>
        </div>
        <Button variant="ghost" className="mt-1" onClick={onBack} data-testid="button-wallet-back">
          <ChevronLeft className="w-4 h-4 mr-1" />{t.common.back}
        </Button>
      </div>
    </ClaimCard>
  );
}
