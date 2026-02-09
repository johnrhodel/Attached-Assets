import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { Activity, Users, Box, MapPin, Layers, Copy, Check, Search, ShieldCheck } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useI18n } from "@/lib/i18n/context";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface AdminStats {
  totalMints: number;
  activeDrops: number;
  totalLocations: number;
  uniqueUsers: number;
  mintsByChain: Record<string, number>;
  mintsByMonth: Record<string, number>;
  mintsByLocation: Record<string, number>;
  topUsers: Array<{
    email: string;
    mintCount: number;
    lastMint: string;
    verified: boolean;
  }>;
  recentMints: Array<{
    id: number;
    dropId: number;
    chain: string;
    recipient: string;
    txHash: string;
    status: string;
    createdAt: string;
    dropTitle: string;
  }>;
}

interface BlockchainStatus {
  stellar: {
    serverPublicKey: string;
    balance: string;
    network: string;
    healthy: boolean;
  };
}

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function truncateAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr || "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function truncateStellarAddress(addr: string): string {
  if (!addr || addr.length < 14) return addr || "";
  return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const visible = local.slice(0, 3);
  return `${visible}***@${domain}`;
}

function formatMonthLabel(key: string): string {
  const [year, month] = key.split("-");
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleDateString("en", { month: "short", year: "2-digit" });
}

export default function Dashboard() {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedAddress, setCopiedAddress] = useState(false);

  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: blockchainStatus } = useQuery<BlockchainStatus>({
    queryKey: ["/api/blockchain/status"],
  });

  const monthlyData = stats?.mintsByMonth
    ? Object.entries(stats.mintsByMonth)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => ({ name: formatMonthLabel(key), mints: value }))
    : [];

  const locationData = stats?.mintsByLocation
    ? Object.entries(stats.mintsByLocation).map(([name, value]) => ({ name, value }))
    : [];

  const filteredMints = stats?.recentMints?.filter((mint) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (mint.dropTitle || "").toLowerCase().includes(query) ||
      (mint.recipient || "").toLowerCase().includes(query)
    );
  }) ?? [];

  const handleCopyAddress = async (address: string) => {
    await navigator.clipboard.writeText(address);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-8" data-testid="dashboard-loading">
          <div>
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-72 mt-2" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4 shadow-sm">
              <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
              <CardContent><Skeleton className="h-[300px] w-full" /></CardContent>
            </Card>
            <Card className="col-span-3 shadow-sm">
              <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
              <CardContent><Skeleton className="h-[300px] w-full" /></CardContent>
            </Card>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const metricCards = [
    { title: t.admin.totalMints, value: stats?.totalMints ?? 0, icon: Activity, color: "text-green-500" },
    { title: t.admin.activeDrops, value: stats?.activeDrops ?? 0, icon: Layers, color: "text-blue-500" },
    { title: t.admin.totalLocations, value: stats?.totalLocations ?? 0, icon: MapPin, color: "text-orange-500" },
    { title: t.admin.uniqueUsers, value: stats?.uniqueUsers ?? 0, icon: Users, color: "text-purple-500" },
  ];

  const stellar = blockchainStatus?.stellar;

  return (
    <AdminLayout>
      <div className="space-y-8" data-testid="dashboard-content">
        <div>
          <h2 className="text-3xl font-serif font-bold text-foreground" data-testid="text-dashboard-title">
            {t.nav.dashboard}
          </h2>
          <p className="text-muted-foreground mt-2">{t.admin.welcome}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {metricCards.map((stat, i) => (
            <Card key={i} className="shadow-sm" data-testid={`card-metric-${i}`}>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid={`text-metric-value-${i}`}>
                  {stat.value.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {stellar && (
          <Card className="shadow-sm" data-testid="card-stellar-status">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle>{t.admin.stellarStatus}</CardTitle>
              <div className="flex items-center gap-2">
                <div
                  className={`h-3 w-3 rounded-full ${stellar.healthy ? "bg-green-500" : "bg-red-500"}`}
                  data-testid="indicator-stellar-health"
                />
                <span className="text-sm text-muted-foreground" data-testid="text-stellar-health">
                  {stellar.healthy ? t.admin.healthy : t.admin.unhealthy}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{t.admin.serverAddress}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono font-medium" data-testid="text-stellar-address">
                      {truncateStellarAddress(stellar.serverPublicKey)}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleCopyAddress(stellar.serverPublicKey)}
                      data-testid="button-copy-address"
                    >
                      {copiedAddress ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                    {copiedAddress && (
                      <span className="text-xs text-green-500" data-testid="text-copied">{t.admin.copied}</span>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{t.admin.balance}</p>
                  <p className="text-sm font-medium" data-testid="text-stellar-balance">
                    {stellar.balance} XLM
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{t.admin.network}</p>
                  <Badge variant="secondary" data-testid="badge-stellar-network">
                    {stellar.network}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4 shadow-sm" data-testid="card-mints-by-month">
            <CardHeader>
              <CardTitle>{t.admin.mintsByMonth}</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[300px]">
                {monthlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <XAxis
                        dataKey="name"
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value}`}
                      />
                      <Tooltip
                        cursor={{ fill: "transparent" }}
                        contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                      />
                      <Bar
                        dataKey="mints"
                        fill="currentColor"
                        radius={[4, 4, 0, 0]}
                        className="fill-primary"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground" data-testid="text-no-monthly-data">
                    {t.admin.noMints}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-3 shadow-sm" data-testid="card-mints-by-location">
            <CardHeader>
              <CardTitle>{t.admin.mintsByLocation}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {locationData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={locationData}>
                      <XAxis
                        type="number"
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        width={100}
                      />
                      <Tooltip
                        cursor={{ fill: "transparent" }}
                        contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                      />
                      <Bar
                        dataKey="value"
                        fill="currentColor"
                        radius={[0, 4, 4, 0]}
                        className="fill-primary"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground" data-testid="text-no-location-data">
                    {t.admin.noMints}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {stats?.topUsers && stats.topUsers.length > 0 && (
          <Card className="shadow-sm" data-testid="card-user-list">
            <CardHeader>
              <CardTitle>{t.admin.userList}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.topUsers.map((user, i) => (
                  <div key={i} className="flex items-center gap-4" data-testid={`row-user-${i}`}>
                    <div className="h-9 w-9 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                      <Users className="h-4 w-4 text-purple-500" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-sm font-medium leading-none truncate" data-testid={`text-user-email-${i}`}>
                        {maskEmail(user.email)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t.admin.lastMint}: {formatRelativeTime(user.lastMint)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {user.verified && (
                        <Badge variant="secondary" className="gap-1" data-testid={`badge-verified-${i}`}>
                          <ShieldCheck className="h-3 w-3" />
                          {t.admin.verified}
                        </Badge>
                      )}
                      <Badge variant="outline" data-testid={`badge-mint-count-${i}`}>
                        {user.mintCount} {t.admin.nftsCount}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-sm" data-testid="card-recent-mints">
          <CardHeader className="space-y-4">
            <CardTitle>{t.admin.recentMints}</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t.admin.searchMints}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-mints"
              />
            </div>
          </CardHeader>
          <CardContent>
            {filteredMints.length > 0 ? (
              <div className="space-y-6">
                {filteredMints.map((mint) => (
                  <div key={mint.id} className="flex items-center gap-4" data-testid={`row-mint-${mint.id}`}>
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Activity className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-sm font-medium leading-none truncate" data-testid={`text-mint-title-${mint.id}`}>
                        {mint.dropTitle || `Drop #${mint.dropId}`}
                      </p>
                      <p className="text-xs text-muted-foreground" data-testid={`text-mint-recipient-${mint.id}`}>
                        {truncateAddress(mint.recipient)}
                      </p>
                    </div>
                    <Badge variant="secondary" className="flex-shrink-0 capitalize" data-testid={`badge-chain-${mint.id}`}>
                      {mint.chain}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex-shrink-0" data-testid={`text-mint-time-${mint.id}`}>
                      {formatRelativeTime(mint.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground" data-testid="text-no-recent-mints">
                <Box className="h-8 w-8 mx-auto mb-2 opacity-50" />
                {t.admin.noMints}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
