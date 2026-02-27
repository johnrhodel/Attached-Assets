import { useQuery, useMutation } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n/context";
import { z } from "zod";

type VerifySessionResponse = z.infer<typeof api.claims.verifySession.responses[200]>;

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
    staleTime: 0,
  });
}

export function useCreateClaimSession() {
  const { toast } = useToast();
  const { t } = useI18n();
  return useMutation({
    mutationFn: async (locationId: number) => {
      const res = await fetch(api.claims.createSession.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locationId }),
      });
      
      if (res.status === 429) throw new Error("RATE_LIMITED");
      if (!res.ok) throw new Error("Failed to start claim session");
      
      return api.claims.createSession.responses[200].parse(await res.json());
    },
    onError: (error: Error) => {
      if (error.message === "RATE_LIMITED") {
        toast({ title: t.toasts.rateLimited, description: t.toasts.rateLimitedDesc, variant: "destructive" });
      } else {
        toast({ title: t.toasts.claimError, description: t.toasts.claimErrorDesc, variant: "destructive" });
      }
    },
  });
}

export function useWalletless() {
  const { toast } = useToast();
  const { t } = useI18n();

  const start = useMutation({
    mutationFn: async (email: string) => {
      const res = await fetch(api.walletless.start.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.status === 429) throw new Error("RATE_LIMITED");
      if (!res.ok) throw new Error("Failed to send verification code");
      return api.walletless.start.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      toast({ title: t.toasts.codeSent, description: t.toasts.codeSentDesc });
    },
    onError: (error: Error) => {
      if (error.message === "RATE_LIMITED") {
        toast({ title: t.toasts.rateLimited, description: t.toasts.rateLimitedDesc, variant: "destructive" });
      }
    },
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
      toast({ title: t.toasts.minted, description: t.toasts.mintedDesc });
    },
  });

  return { start, verify, mine };
}

export function useConfirmMint() {
  const { toast } = useToast();
  const { t } = useI18n();
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
      toast({ title: t.toasts.mintConfirmed, description: t.toasts.mintConfirmedDesc });
    },
  });
}
