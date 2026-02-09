import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LanguageSelector } from "@/components/language-selector";
import { ExternalLink, ArrowRight, Image as ImageIcon, Layers } from "lucide-react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n/context";

function getExplorerUrl(chain: string, txHash: string): string {
  if (chain === "solana") return `https://explorer.solana.com/tx/${txHash}?cluster=devnet`;
  if (chain === "evm") return `https://sepolia.etherscan.io/tx/${txHash}`;
  if (chain === "stellar") return `https://stellar.expert/explorer/testnet/tx/${txHash}`;
  return "#";
}

function truncateHash(hash: string): string {
  if (hash.length <= 14) return hash;
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}

function getChainLabel(chain: string): string {
  if (chain === "solana") return "Solana";
  if (chain === "evm") return "EVM";
  if (chain === "stellar") return "Stellar";
  return chain;
}

export default function Gallery() {
  const [, params] = useRoute("/gallery/:locationId");
  const { t } = useI18n();

  const { data, isLoading, error } = useQuery<{
    drop: { id: number; title: string; imageUrl: string; supply: number; mintedCount: number };
    mints: Array<{ id: number; chain: string; txHash: string; createdAt: string }>;
    totalMinted: number;
  }>({
    queryKey: ["/api/gallery", params?.locationId],
    enabled: !!params?.locationId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="w-full max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-8">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-24" />
          </div>
          <Skeleton className="w-full aspect-[16/9] rounded-md mb-6" />
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-5 w-64 mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-md" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
        <div className="absolute top-4 right-4"><LanguageSelector /></div>
        <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center mb-5">
          <Layers className="w-7 h-7 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-serif font-bold mb-2 text-foreground" data-testid="text-gallery-error">
          {t.gallery.title}
        </h1>
        <p className="text-muted-foreground text-sm">{t.gallery.noMints}</p>
        <Link href="/">
          <Button variant="outline" className="mt-4" data-testid="button-back-home">{t.common.back}</Button>
        </Link>
      </div>
    );
  }

  const { drop, mints, totalMinted } = data;

  return (
    <div className="min-h-screen bg-background" data-testid="gallery-page">
      <div className="w-full max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-7 h-7 bg-primary/10 rounded-md flex items-center justify-center">
              <Layers className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="font-serif font-bold text-base text-foreground">Mintoria</span>
          </div>
          <LanguageSelector />
        </div>

        {drop.imageUrl && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full aspect-[16/9] rounded-md overflow-hidden mb-6 relative"
          >
            <img
              src={drop.imageUrl}
              alt={drop.title}
              className="w-full h-full object-cover"
              data-testid="img-drop-hero"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground mb-1" data-testid="text-drop-title">
            {drop.title}
          </h1>
          <p className="text-muted-foreground text-sm mb-3" data-testid="text-gallery-subtitle">
            {t.gallery.subtitle}
          </p>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm text-muted-foreground" data-testid="text-total-minted">
                {t.gallery.totalMinted}: <strong className="text-foreground">{totalMinted}</strong> / {drop.supply}
              </span>
            </div>
            <Link href={`/claim/${params?.locationId}`}>
              <Button data-testid="button-claim-nft">
                {t.gallery.claimNow} <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </motion.div>

        {mints.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center py-16"
          >
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <ImageIcon className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm" data-testid="text-no-mints">{t.gallery.noMints}</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="mints-grid">
            {mints.map((mint, index) => (
              <motion.div
                key={mint.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
              >
                <Card className="overflow-visible" data-testid={`card-mint-${mint.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <Badge variant="secondary" data-testid={`badge-chain-${mint.id}`}>
                        {getChainLabel(mint.chain)}
                      </Badge>
                      <span className="text-xs text-muted-foreground" data-testid={`text-date-${mint.id}`}>
                        {new Date(mint.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <code className="text-xs font-mono text-muted-foreground" data-testid={`text-txhash-${mint.id}`}>
                        {truncateHash(mint.txHash)}
                      </code>
                      <a
                        href={getExplorerUrl(mint.chain, mint.txHash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary"
                        data-testid={`link-explorer-${mint.id}`}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
