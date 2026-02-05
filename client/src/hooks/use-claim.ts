import { useQuery, useMutation } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

type VerifySessionResponse = z.infer<typeof api.claims.verifySession.responses[200]>;

// Hook to verify if a claim token is valid
export function useVerifyClaimSession(token: string | null) {
  return useQuery({
    queryKey: [api.claims.verifySession.path, token],
    queryFn: async () => {
      if (!token) return null;
      const url = buildUrl(api.claims.verifySession.path, { token });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to verify session");
      return api.claims.verifySession.responses[200].parse(await res.json());
    },
    enabled: !!token,
    staleTime: 0, // Always check freshness
  });
}

// Hook to start a new claim session
export function useCreateClaimSession() {
  return useMutation({
    mutationFn: async (locationId: number) => {
      const res = await fetch(api.claims.createSession.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locationId }),
      });
      
      if (res.status === 429) throw new Error("Too many requests. Please try again later.");
      if (!res.ok) throw new Error("Failed to start claim session");
      
      return api.claims.createSession.responses[200].parse(await res.json());
    }
  });
}

// === WALLETLESS FLOW ===
export function useWalletless() {
  const { toast } = useToast();

  const start = useMutation({
    mutationFn: async (email: string) => {
      const res = await fetch(api.walletless.start.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("Failed to send verification code");
      return api.walletless.start.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      toast({ title: "Code sent!", description: "Check your console (dev mode) or email." });
    }
  });

  const verify = useMutation({
    mutationFn: async (data: { email: string; code: string }) => {
      const res = await fetch(api.walletless.verify.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Invalid code");
      return api.walletless.verify.responses[200].parse(await res.json());
    },
  });

  const mine = useMutation({
    mutationFn: async (data: { email: string; code: string; chain: "evm" | "solana" | "stellar"; claimToken: string }) => {
      const res = await fetch(api.walletless.mine.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to mint");
      return api.walletless.mine.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      toast({ title: "Minted!", description: "Your memory has been safely stored." });
    }
  });

  return { start, verify, mine };
}

// === MINTING CONFIRMATION ===
export function useConfirmMint() {
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: { claimToken: string; txHash: string; chain: "evm" | "solana" | "stellar" }) => {
      const res = await fetch(api.mint.confirm.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to confirm mint");
      return api.mint.confirm.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      toast({ title: "Success!", description: "Memory claimed successfully." });
    }
  });
}
