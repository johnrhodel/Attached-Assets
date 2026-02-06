import { useI18n } from "@/lib/i18n/context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

const walletGroups = [
  {
    key: "evmWallets" as const,
    wallets: [
      { name: "MetaMask", url: "https://metamask.io/download/", desc: "Most popular EVM wallet" },
      { name: "Rabby", url: "https://rabby.io/", desc: "Multi-chain DeFi wallet" },
      { name: "Coinbase Wallet", url: "https://www.coinbase.com/wallet", desc: "Easy to use" },
      { name: "Rainbow", url: "https://rainbow.me/", desc: "Beautiful & simple" },
    ],
  },
  {
    key: "solanaWallets" as const,
    wallets: [
      { name: "Phantom", url: "https://phantom.app/download", desc: "Most popular Solana wallet" },
      { name: "Solflare", url: "https://solflare.com/", desc: "Advanced Solana wallet" },
      { name: "Backpack", url: "https://backpack.app/", desc: "xNFT wallet" },
    ],
  },
  {
    key: "stellarWallets" as const,
    wallets: [
      { name: "Freighter", url: "https://www.freighter.app/", desc: "Official Stellar wallet" },
      { name: "Lobstr", url: "https://lobstr.co/", desc: "Simple Stellar wallet" },
    ],
  },
];

export function WalletSuggestions({ onBack }: { onBack: () => void }) {
  const { t } = useI18n();

  return (
    <div className="w-full max-w-sm sm:max-w-md mx-auto space-y-3">
      <div className="text-center mb-4">
        <h2 className="text-xl sm:text-2xl font-serif font-bold mb-2 text-foreground">{t.walletSuggestions.title}</h2>
        <p className="text-xs sm:text-sm text-muted-foreground">{t.walletSuggestions.subtitle}</p>
      </div>

      {walletGroups.map((group) => (
        <Card key={group.key} className="border-border/50" data-testid={`card-wallet-group-${group.key}`}>
          <CardHeader className="pb-2 px-4 sm:px-6 pt-4">
            <CardTitle className="text-xs sm:text-sm font-semibold text-muted-foreground">
              {t.walletSuggestions[group.key]}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 px-4 sm:px-6 pb-4">
            {group.wallets.map((wallet) => (
              <a
                key={wallet.name}
                href={wallet.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-2 p-2.5 rounded-md hover-elevate"
                data-testid={`link-wallet-${wallet.name.toLowerCase().replace(/\s/g, '-')}`}
              >
                <div className="min-w-0">
                  <div className="font-medium text-sm">{wallet.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{wallet.desc}</div>
                </div>
                <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                  {t.walletSuggestions.downloadNow} <ExternalLink className="w-3 h-3" />
                </span>
              </a>
            ))}
          </CardContent>
        </Card>
      ))}

      <Button variant="ghost" className="w-full" onClick={onBack} data-testid="button-wallet-suggestions-back">
        {t.common.back}
      </Button>
    </div>
  );
}
