import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Activity, Users, Box, MapPin, Layers } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useI18n } from "@/lib/i18n/context";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const CHAIN_COLORS: Record<string, string> = {
  stellar: "#08B5E5",
};

interface AdminStats {
  totalMints: number;
  activeDrops: number;
  totalLocations: number;
  uniqueUsers: number;
  mintsByChain: Record<string, number>;
  mintsByMonth: Record<string, number>;
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

function formatMonthLabel(key: string): string {
  const [year, month] = key.split("-");
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleDateString("en", { month: "short", year: "2-digit" });
}

export default function Dashboard() {
  const { t } = useI18n();

  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  const monthlyData = stats?.mintsByMonth
    ? Object.entries(stats.mintsByMonth)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => ({ name: formatMonthLabel(key), mints: value }))
    : [];

  const chainData = stats?.mintsByChain
    ? Object.entries(stats.mintsByChain).map(([name, value]) => ({ name, value }))
    : [];

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

          <Card className="col-span-3 shadow-sm" data-testid="card-mints-by-chain">
            <CardHeader>
              <CardTitle>{t.admin.mintsByChain}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {chainData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chainData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={4}
                        dataKey="value"
                        nameKey="name"
                      >
                        {chainData.map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={CHAIN_COLORS[entry.name] || "#8884d8"}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground" data-testid="text-no-chain-data">
                    {t.admin.noMints}
                  </div>
                )}
              </div>
              {chainData.length > 0 && (
                <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
                  {chainData.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: CHAIN_COLORS[entry.name] || "#8884d8" }}
                      />
                      <span className="text-sm text-muted-foreground capitalize">{entry.name}</span>
                      <span className="text-sm font-medium">{entry.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm" data-testid="card-recent-mints">
          <CardHeader>
            <CardTitle>{t.admin.recentMints}</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.recentMints && stats.recentMints.length > 0 ? (
              <div className="space-y-6">
                {stats.recentMints.map((mint) => (
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
