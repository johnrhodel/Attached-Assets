import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { LanguageSelector } from "@/components/language-selector";
import { Search, Loader2, ExternalLink, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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

interface MintItem {
  id: number;
  dropId: number;
  chain: string;
  recipient: string;
  txHash: string;
  status: string;
  createdAt: string;
  dropTitle: string;
  dropImageUrl: string;
}

export default function MyNfts() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [searchEmail, setSearchEmail] = useState("");

  const { data: nfts, isLoading, isFetched, refetch } = useQuery<MintItem[]>({
    queryKey: ["/api/my-nfts", searchEmail],
    enabled: false,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSearchEmail(email.trim());
    setTimeout(() => refetch(), 0);
  };

  return (
    <div className="min-h-screen bg-background" data-testid="my-nfts-page">
      <div className="bg-gradient-to-b from-primary/10 via-primary/5 to-transparent pb-10">
        <div className="w-full max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-8">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="w-7 h-7 bg-primary/10 rounded-md flex items-center justify-center">
                <ImageIcon className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="font-serif font-bold text-base text-foreground">Mintoria</span>
            </div>
            <LanguageSelector />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground mb-2" data-testid="text-my-nfts-title">
              {t.myNfts.title}
            </h1>
            <p className="text-muted-foreground text-sm max-w-md mx-auto" data-testid="text-my-nfts-subtitle">
              {t.myNfts.subtitle}
            </p>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onSubmit={handleSearch}
            className="flex items-center gap-3 max-w-md mx-auto"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder={t.myNfts.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9"
                data-testid="input-email"
              />
            </div>
            <Button type="submit" disabled={!email.trim() || isLoading} data-testid="button-search">
              {isLoading ? <Loader2 className="animate-spin w-4 h-4" /> : t.myNfts.search}
            </Button>
          </motion.form>
        </div>
      </div>

      <div className="w-full max-w-4xl mx-auto px-4 pb-10">
        <AnimatePresence mode="wait">
          {isLoading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center py-16"
            >
              <Loader2 className="animate-spin w-8 h-8 text-primary" />
            </motion.div>
          )}

          {!isLoading && isFetched && nfts && nfts.length === 0 && (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center py-16"
            >
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <ImageIcon className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm" data-testid="text-no-nfts">{t.myNfts.noNfts}</p>
            </motion.div>
          )}

          {!isLoading && nfts && nfts.length > 0 && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              data-testid="nfts-grid"
            >
              {nfts.map((nft, index) => (
                <motion.div
                  key={nft.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                >
                  <Card className="overflow-hidden" data-testid={`card-nft-${nft.id}`}>
                    {nft.dropImageUrl && (
                      <div className="aspect-[16/9] w-full overflow-hidden">
                        <img
                          src={nft.dropImageUrl}
                          alt={nft.dropTitle}
                          className="w-full h-full object-cover"
                          data-testid={`img-nft-${nft.id}`}
                        />
                      </div>
                    )}
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="font-serif font-bold text-sm text-foreground truncate" data-testid={`text-nft-title-${nft.id}`}>
                          {nft.dropTitle}
                        </h3>
                        <Badge variant="secondary" data-testid={`badge-chain-${nft.id}`}>
                          {getChainLabel(nft.chain)}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <code className="text-xs font-mono text-muted-foreground" data-testid={`text-txhash-${nft.id}`}>
                          {truncateHash(nft.txHash)}
                        </code>
                        <a
                          href={getExplorerUrl(nft.chain, nft.txHash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary"
                          data-testid={`link-explorer-${nft.id}`}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>

                      <p className="text-xs text-muted-foreground" data-testid={`text-date-${nft.id}`}>
                        {t.myNfts.mintedOn} {new Date(nft.createdAt).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
