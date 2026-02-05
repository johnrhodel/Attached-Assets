import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { useActiveDrop } from "@/hooks/use-drops";
import { useCreateClaimSession, useWalletless, useConfirmMint } from "@/hooks/use-claim";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClaimCard } from "@/components/ClaimCard";
import { Loader2, CheckCircle2, Wallet, Mail, ArrowRight, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export default function Claim() {
  const [, params] = useRoute("/claim/:locationId");
  const locationId = Number(params?.locationId);
  
  const { data: drop, isLoading, error } = useActiveDrop(locationId);
  const { mutateAsync: createSession } = useCreateClaimSession();
  
  // State for the claim flow
  const [claimToken, setClaimToken] = useState<string | null>(null);
  const [view, setView] = useState<"landing" | "method" | "wallet" | "email" | "success">("landing");

  // If no drop found
  if (isLoading) return <div className="h-screen w-full flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>;
  if (!drop || error) return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-background p-4 text-center">
      <h1 className="text-2xl font-serif font-bold mb-2">No Active Drop Found</h1>
      <p className="text-muted-foreground">There is no memory available to claim at this location right now.</p>
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
    <div className="min-h-screen w-full bg-[#f8f8fa] flex flex-col items-center p-4 md:p-8 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="z-10 w-full max-w-md mx-auto flex-1 flex flex-col justify-center pb-12">
        <header className="text-center mb-8">
          <h3 className="text-sm uppercase tracking-widest text-muted-foreground font-medium mb-2">Memory Location</h3>
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
                    <p className="text-sm opacity-75 mt-1">{drop.mintedCount} / {drop.supply} claimed</p>
                  </div>
                </div>
                <div className="p-8 bg-card text-center">
                  <p className="text-muted-foreground mb-6">
                    You are at a verified location. Claim this commemorative digital memory to your collection.
                  </p>
                  <Button size="lg" className="w-full h-14 text-lg font-semibold shadow-lg shadow-primary/25 rounded-xl" onClick={startClaim}>
                    Claim Memory <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </div>
              </ClaimCard>
            </motion.div>
          )}

          {view === "method" && (
            <ClaimCard title="Choose Method" description="How would you like to receive your memory?">
              <div className="grid gap-4">
                <Button 
                  variant="outline" 
                  className="h-auto py-6 justify-start px-6 rounded-xl border-2 hover:border-primary hover:bg-primary/5 transition-all group"
                  onClick={() => setView("email")}
                >
                  <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-foreground text-lg">Use Email</div>
                    <div className="text-sm text-muted-foreground">I don't have a wallet yet</div>
                  </div>
                </Button>

                <Button 
                  variant="outline" 
                  className="h-auto py-6 justify-start px-6 rounded-xl border-2 hover:border-primary hover:bg-primary/5 transition-all group"
                  onClick={() => setView("wallet")}
                >
                  <div className="h-10 w-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-foreground text-lg">Connect Wallet</div>
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
              <h2 className="text-3xl font-serif font-bold mb-4">Memory Claimed!</h2>
              <p className="text-muted-foreground mb-8 max-w-xs mx-auto">
                This moment has been permanently added to your collection.
              </p>
              <div className="p-4 bg-white rounded-2xl shadow-sm border mb-8 max-w-xs mx-auto">
                <img src={drop.imageUrl} alt="Memory" className="w-full aspect-square object-cover rounded-xl mb-3" />
                <p className="font-medium text-sm">{drop.title}</p>
              </div>
              <Button onClick={() => window.location.reload()} variant="outline">Back to Start</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// === SUB-COMPONENTS for flows ===

function EmailFlow({ claimToken, drop, onSuccess, onBack }: any) {
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
        // Automatically mint to default chain (EVM for demo) after verifying
        mine.mutate({ email, code, chain: "evm", claimToken }, {
          onSuccess: onSuccess
        });
      }
    });
  };

  return (
    <ClaimCard title={step === "email" ? "Enter Email" : "Verify Code"} description="We'll create a secure vault for you.">
      {step === "email" ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Email Address</Label>
            <Input 
              type="email" 
              placeholder="you@example.com" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              className="h-12 text-lg"
            />
          </div>
          <Button className="w-full h-12" onClick={handleSendCode} disabled={!email || start.isPending}>
            {start.isPending ? <Loader2 className="animate-spin" /> : "Continue"}
          </Button>
          <Button variant="ghost" className="w-full" onClick={onBack}>Back</Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Verification Code</Label>
            <Input 
              type="text" 
              placeholder="123456" 
              value={code} 
              onChange={e => setCode(e.target.value)} 
              className="h-12 text-lg text-center tracking-widest"
            />
            <p className="text-xs text-center text-muted-foreground">Check your console in dev mode</p>
          </div>
          <Button className="w-full h-12" onClick={handleVerifyAndMint} disabled={!code || verify.isPending || mine.isPending}>
            {(verify.isPending || mine.isPending) ? <Loader2 className="animate-spin" /> : "Verify & Mint"}
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => setStep("email")}>Change Email</Button>
        </div>
      )}
    </ClaimCard>
  );
}

function WalletFlow({ claimToken, drop, onSuccess, onBack }: any) {
  const { mutate, isPending } = useConfirmMint();
  
  // Mock wallet connection for MVP
  const handleMockMint = (chain: "evm" | "solana" | "stellar") => {
    // In a real app, this would trigger wallet signature
    setTimeout(() => {
      mutate({ 
        claimToken, 
        txHash: "0xmockhash123456789", 
        chain 
      }, { onSuccess });
    }, 1500);
  };

  return (
    <ClaimCard title="Connect Wallet" description="Choose your preferred network.">
      <div className="grid gap-3">
        {drop.enabledChains.includes("evm") && (
          <Button variant="outline" className="h-14 justify-between" onClick={() => handleMockMint("evm")} disabled={isPending}>
            <span className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-500 rounded-full"/> Ethereum / Polygon</span>
            {isPending && <Loader2 className="animate-spin w-4 h-4" />}
          </Button>
        )}
        {drop.enabledChains.includes("solana") && (
          <Button variant="outline" className="h-14 justify-between" onClick={() => handleMockMint("solana")} disabled={isPending}>
            <span className="flex items-center gap-2"><div className="w-3 h-3 bg-purple-500 rounded-full"/> Solana</span>
            {isPending && <Loader2 className="animate-spin w-4 h-4" />}
          </Button>
        )}
        {drop.enabledChains.includes("stellar") && (
          <Button variant="outline" className="h-14 justify-between" onClick={() => handleMockMint("stellar")} disabled={isPending}>
            <span className="flex items-center gap-2"><div className="w-3 h-3 bg-black rounded-full"/> Stellar</span>
            {isPending && <Loader2 className="animate-spin w-4 h-4" />}
          </Button>
        )}
        <Button variant="ghost" className="mt-2" onClick={onBack}>Back</Button>
      </div>
    </ClaimCard>
  );
}
