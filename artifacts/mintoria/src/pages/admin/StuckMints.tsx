import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n/context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, AlertTriangle, ExternalLink, CheckCircle2, Trash2, Layers } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface StuckMint {
  id: number;
  dropId: number;
  chain: string;
  recipient: string;
  mintAddress: string | null;
  txHash: string | null;
  status: string;
  email: string | null;
  createdAt: string;
  dropTitle: string;
}

interface SlotStat {
  dropId: number;
  dropTitle: string;
  supply: number;
  reserved: number;
  confirmed: number;
  pending: number;
}

interface StuckMintsResponse {
  mints: StuckMint[];
  slotStats: SlotStat[];
}

function getExplorerUrl(chain: string, txHash: string): string | null {
  if (chain === "solana") return `https://explorer.solana.com/tx/${txHash}?cluster=devnet`;
  if (chain === "evm") return `https://sepolia.etherscan.io/tx/${txHash}`;
  if (chain === "stellar") return `https://stellar.expert/explorer/testnet/tx/${txHash}`;
  return null;
}

function truncateMiddle(value: string): string {
  if (!value || value.length <= 14) return value || "";
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function formatAge(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  if (mins < 1) return "<1m";
  if (mins < 60) return `${mins}m`;
  if (hours < 24) return `${hours}h ${mins % 60}m`;
  return `${days}d ${hours % 24}h`;
}

export default function StuckMints() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [confirmTarget, setConfirmTarget] = useState<StuckMint | null>(null);
  const [discardTarget, setDiscardTarget] = useState<StuckMint | null>(null);
  const [txHash, setTxHash] = useState("");

  const { data, isLoading } = useQuery<StuckMintsResponse>({
    queryKey: ["/api/admin/stuck-mints"],
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/stuck-mints"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
  };

  const confirmMutation = useMutation({
    mutationFn: async ({ id, hash }: { id: number; hash: string }) => {
      await apiRequest("POST", `/api/admin/mints/${id}/confirm`, { txHash: hash });
    },
    onSuccess: () => {
      invalidate();
      setConfirmTarget(null);
      setTxHash("");
      toast({ title: t.admin.confirmMintSuccess });
    },
    onError: (err: any) => {
      toast({ title: t.admin.confirmMintFailed, description: err?.message, variant: "destructive" });
    },
  });

  const discardMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/admin/mints/${id}/discard`);
    },
    onSuccess: () => {
      invalidate();
      setDiscardTarget(null);
      toast({ title: t.admin.discardMintSuccess });
    },
    onError: (err: any) => {
      setDiscardTarget(null);
      toast({ title: t.admin.discardMintFailed, description: err?.message, variant: "destructive" });
    },
  });

  const mints = data?.mints ?? [];
  const slotStats = (data?.slotStats ?? []).filter(s => s.reserved > 0 || s.confirmed > 0 || s.pending > 0);

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-serif font-bold text-foreground flex items-center gap-3" data-testid="text-stuck-mints-title">
            <AlertTriangle className="w-7 h-7 text-amber-500" />
            {t.admin.stuckMints}
          </h2>
          <p className="text-muted-foreground mt-2 max-w-3xl" data-testid="text-stuck-mints-description">
            {t.admin.stuckMintsDescription}
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-12" data-testid="stuck-mints-loading">
            <Loader2 className="animate-spin text-primary" />
          </div>
        ) : (
          <>
            {mints.length === 0 ? (
              <div className="text-center text-muted-foreground py-12 border border-dashed border-border rounded-lg" data-testid="text-no-stuck-mints">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-3 text-emerald-500" />
                {t.admin.noStuckMints}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border" data-testid="table-stuck-mints">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t.admin.mintStatus}</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t.admin.mintAge}</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t.admin.mintDrop}</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t.admin.mintRecipient}</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Chain</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tx</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {mints.map((mint) => {
                      const explorerUrl = mint.txHash ? getExplorerUrl(mint.chain, mint.txHash) : null;
                      return (
                        <tr key={mint.id} className="border-b border-border last:border-0" data-testid={`row-stuck-mint-${mint.id}`}>
                          <td className="px-4 py-3">
                            <Badge
                              variant={mint.status === "pending" ? "secondary" : "destructive"}
                              data-testid={`badge-mint-status-${mint.id}`}
                            >
                              {mint.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-muted-foreground" data-testid={`text-mint-age-${mint.id}`}>
                            {formatAge(mint.createdAt)}
                          </td>
                          <td className="px-4 py-3" data-testid={`text-mint-drop-${mint.id}`}>
                            {mint.dropTitle}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs" data-testid={`text-mint-recipient-${mint.id}`}>
                            <div>{truncateMiddle(mint.recipient)}</div>
                            {mint.email && <div className="text-muted-foreground">{mint.email}</div>}
                          </td>
                          <td className="px-4 py-3 capitalize">{mint.chain}</td>
                          <td className="px-4 py-3">
                            {explorerUrl ? (
                              <a
                                href={explorerUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-primary hover:underline font-mono text-xs"
                                data-testid={`link-mint-explorer-${mint.id}`}
                                title={t.admin.viewOnExplorer}
                              >
                                {truncateMiddle(mint.txHash!)}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <div className="inline-flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setConfirmTarget(mint);
                                  setTxHash(mint.txHash || "");
                                }}
                                data-testid={`button-confirm-mint-${mint.id}`}
                              >
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                {t.admin.confirmMint}
                              </Button>
                              {mint.status === "pending" && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => setDiscardTarget(mint)}
                                  data-testid={`button-discard-mint-${mint.id}`}
                                >
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  {t.admin.discardMint}
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <Card data-testid="card-slot-stats">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-primary" />
                  {t.admin.slotStats}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {slotStats.length === 0 ? (
                  <div className="text-muted-foreground text-sm" data-testid="text-no-slot-stats">—</div>
                ) : (
                  <div className="overflow-x-auto" data-testid="table-slot-stats">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left px-4 py-2 font-medium text-muted-foreground">{t.admin.mintDrop}</th>
                          <th className="text-right px-4 py-2 font-medium text-muted-foreground">{t.admin.slotsSupply}</th>
                          <th className="text-right px-4 py-2 font-medium text-muted-foreground">{t.admin.slotsReserved}</th>
                          <th className="text-right px-4 py-2 font-medium text-muted-foreground">{t.admin.slotsConfirmed}</th>
                          <th className="text-right px-4 py-2 font-medium text-muted-foreground">{t.admin.slotsPending}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {slotStats.map((s) => (
                          <tr key={s.dropId} className="border-b border-border last:border-0" data-testid={`row-slot-stats-${s.dropId}`}>
                            <td className="px-4 py-2">{s.dropTitle}</td>
                            <td className="px-4 py-2 text-right" data-testid={`text-slots-supply-${s.dropId}`}>
                              {s.supply > 0 ? s.supply : t.admin.unlimitedSupply}
                            </td>
                            <td className="px-4 py-2 text-right font-medium" data-testid={`text-slots-reserved-${s.dropId}`}>
                              {s.reserved}
                            </td>
                            <td className="px-4 py-2 text-right text-emerald-600 dark:text-emerald-400" data-testid={`text-slots-confirmed-${s.dropId}`}>
                              {s.confirmed}
                            </td>
                            <td className="px-4 py-2 text-right text-amber-600 dark:text-amber-400" data-testid={`text-slots-pending-${s.dropId}`}>
                              {s.pending}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        <Dialog open={!!confirmTarget} onOpenChange={(open) => { if (!open) { setConfirmTarget(null); setTxHash(""); } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.admin.confirmMintTitle}</DialogTitle>
              <DialogDescription>{t.admin.confirmMintDescription}</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="tx-hash-input">{t.admin.txHashLabel}</label>
              <Input
                id="tx-hash-input"
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                placeholder={t.admin.txHashPlaceholder}
                data-testid="input-tx-hash"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setConfirmTarget(null); setTxHash(""); }} data-testid="button-cancel-confirm-mint">
                {t.common.cancel}
              </Button>
              <Button
                onClick={() => confirmTarget && confirmMutation.mutate({ id: confirmTarget.id, hash: txHash.trim() })}
                disabled={!txHash.trim() || confirmMutation.isPending}
                data-testid="button-submit-confirm-mint"
              >
                {confirmMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {t.admin.confirmMint}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!discardTarget} onOpenChange={(open) => { if (!open) setDiscardTarget(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t.admin.discardMintTitle}</AlertDialogTitle>
              <AlertDialogDescription>{t.admin.discardMintWarning}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-discard-mint">
                {t.common.cancel}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => discardTarget && discardMutation.mutate(discardTarget.id)}
                disabled={discardMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-testid="button-confirm-discard-mint"
              >
                {discardMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {t.admin.discardMint}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
