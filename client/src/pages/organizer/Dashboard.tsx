import { OrganizerLayout } from "@/components/OrganizerLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Box, MapPin, Layers, Zap, ExternalLink, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useI18n } from "@/lib/i18n/context";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface OrganizerStats {
  totalMints: number;
  activeDrops: number;
  totalLocations: number;
  totalProjects: number;
  mintsByDrop: Array<{
    dropId: number;
    dropTitle: string;
    locationName: string;
    mintCount: number;
    supply: number | null;
  }>;
}

interface OrganizerMint {
  id: number;
  dropId: number;
  chain: string;
  recipient: string;
  txHash: string | null;
  status: string;
  email: string | null;
  createdAt: string;
  dropTitle: string;
  locationName: string;
}

const FREE_PLAN_LIMIT = 50;

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

function StatCard({ icon: Icon, label, value, isLoading }: { icon: any; label: string; value: number | string; isLoading: boolean }) {
  return (
    <Card>
      <CardContent className="p-4 md:p-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground truncate">{label}</p>
            {isLoading ? (
              <Skeleton className="h-7 w-16 mt-1" />
            ) : (
              <p className="text-2xl font-bold" data-testid={`stat-${label.toLowerCase().replace(/\s+/g, '-')}`}>{value}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function OrganizerDashboard() {
  const { t } = useI18n();
  const org = t.organizer || {} as any;

  const { data: stats, isLoading: statsLoading } = useQuery<OrganizerStats>({
    queryKey: ["/api/organizer/stats"],
  });

  const { data: recentMints, isLoading: mintsLoading } = useQuery<OrganizerMint[]>({
    queryKey: ["/api/organizer/mints"],
  });

  const planUsagePercent = stats ? Math.min((stats.totalMints / FREE_PLAN_LIMIT) * 100, 100) : 0;
  const isNearLimit = stats ? stats.totalMints >= FREE_PLAN_LIMIT * 0.8 : false;
  const isAtLimit = stats ? stats.totalMints >= FREE_PLAN_LIMIT : false;

  const chartData = stats?.mintsByDrop.map(d => ({
    name: d.dropTitle.length > 15 ? d.dropTitle.slice(0, 15) + "…" : d.dropTitle,
    mints: d.mintCount,
  })) || [];

  return (
    <OrganizerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold" data-testid="text-organizer-dashboard-title">
            {org.dashboardTitle || "Organizer Dashboard"}
          </h1>
          <p className="text-muted-foreground mt-1" data-testid="text-organizer-dashboard-subtitle">
            {org.dashboardSubtitle || "Manage your events and track your mints"}
          </p>
        </div>

        {isNearLimit && !isAtLimit && (
          <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950" data-testid="alert-near-limit">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800 dark:text-orange-200">
              {org.nearLimitWarning || `You've used ${stats?.totalMints} of ${FREE_PLAN_LIMIT} mints on your free plan. Consider upgrading for unlimited mints.`}
            </AlertDescription>
          </Alert>
        )}

        {isAtLimit && (
          <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950" data-testid="alert-at-limit">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              {org.atLimitWarning || `You've reached the ${FREE_PLAN_LIMIT} mint limit on your free plan. Upgrade to continue minting.`}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <StatCard icon={Zap} label={org.totalMints || "Total Mints"} value={stats?.totalMints || 0} isLoading={statsLoading} />
          <StatCard icon={Layers} label={org.activeDrops || "Active Drops"} value={stats?.activeDrops || 0} isLoading={statsLoading} />
          <StatCard icon={MapPin} label={org.totalLocations || "Locations"} value={stats?.totalLocations || 0} isLoading={statsLoading} />
          <StatCard icon={Box} label={org.totalProjects || "Projects"} value={stats?.totalProjects || 0} isLoading={statsLoading} />
        </div>

        <Card data-testid="card-plan-usage">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">{org.planUsage || "Plan Usage"}</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-full" />
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{org.freePlan || "Free Plan"}</span>
                  <span className="font-medium" data-testid="text-plan-usage-count">
                    {stats?.totalMints || 0} / {FREE_PLAN_LIMIT} {org.mintsUsed || "mints used"}
                  </span>
                </div>
                <Progress 
                  value={planUsagePercent} 
                  className={`h-3 ${isAtLimit ? '[&>div]:bg-red-500' : isNearLimit ? '[&>div]:bg-orange-500' : ''}`}
                  data-testid="progress-plan-usage"
                />
                <p className="text-xs text-muted-foreground">
                  {org.remainingMints || "Remaining"}: {Math.max(FREE_PLAN_LIMIT - (stats?.totalMints || 0), 0)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <Card data-testid="card-mints-by-drop">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">{org.mintsByEvent || "Mints by Event"}</CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="mints" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                  {org.noData || "No data yet"}
                </div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-drops-detail">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">{org.dropsOverview || "Drops Overview"}</CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : stats?.mintsByDrop && stats.mintsByDrop.length > 0 ? (
                <div className="space-y-3 max-h-[200px] overflow-y-auto">
                  {stats.mintsByDrop.map(d => (
                    <div key={d.dropId} className="flex items-center justify-between p-3 rounded-lg bg-accent/50" data-testid={`drop-row-${d.dropId}`}>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{d.dropTitle}</p>
                        <p className="text-xs text-muted-foreground truncate">{d.locationName}</p>
                      </div>
                      <div className="text-right ml-3 shrink-0">
                        <Badge variant="secondary" className="text-xs">
                          {d.mintCount}{d.supply ? ` / ${d.supply}` : ""}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                  {org.noDrops || "No drops yet"}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card data-testid="card-recent-mints">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">{org.recentMints || "Recent Mints"}</CardTitle>
          </CardHeader>
          <CardContent>
            {mintsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : recentMints && recentMints.length > 0 ? (
              <div className="space-y-2">
                {recentMints.map(mint => (
                  <div key={mint.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-accent/50 gap-2" data-testid={`mint-row-${mint.id}`}>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{mint.dropTitle}</p>
                        <Badge variant={mint.status === "confirmed" ? "default" : "secondary"} className="text-xs">
                          {mint.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{mint.locationName}</p>
                      {mint.email && (
                        <p className="text-xs text-muted-foreground truncate">{mint.email}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground">{formatRelativeTime(mint.createdAt)}</span>
                      {mint.txHash && (
                        <a
                          href={`https://stellar.expert/explorer/testnet/tx/${mint.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary/80"
                          data-testid={`link-tx-${mint.id}`}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
                {org.noMints || "No mints yet"}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </OrganizerLayout>
  );
}
