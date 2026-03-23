import { useState } from "react";
import { OrganizerLayout } from "@/components/OrganizerLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Box, MapPin, Layers, Zap, ExternalLink, AlertTriangle, Plus, FolderOpen } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useI18n } from "@/lib/i18n/context";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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

interface OrganizerProject {
  id: number;
  name: string;
  slug: string;
  userId: number | null;
  createdAt: string;
}

interface PlanLimits {
  maxMintsPerDrop: number | null;
  maxLocations: number | null;
  planSlug: string;
  currentLocations: number;
}

interface RelativeTimeLabels {
  justNow: string;
  minutesAgo: string;
  hoursAgo: string;
  daysAgo: string;
}

function formatRelativeTime(dateStr: string, labels: RelativeTimeLabels): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return labels.justNow;
  if (diffMins < 60) return `${diffMins}${labels.minutesAgo}`;
  if (diffHours < 24) return `${diffHours}${labels.hoursAgo}`;
  if (diffDays < 30) return `${diffDays}${labels.daysAgo}`;
  return date.toLocaleDateString();
}

function StatCard({ icon: Icon, label, value, isLoading }: { icon: LucideIcon; label: string; value: number | string; isLoading: boolean }) {
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
  const org = t.organizer;
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [projectName, setProjectName] = useState("");

  const { data: stats, isLoading: statsLoading } = useQuery<OrganizerStats>({
    queryKey: ["/api/organizer/stats"],
  });

  const { data: recentMints, isLoading: mintsLoading } = useQuery<OrganizerMint[]>({
    queryKey: ["/api/organizer/mints"],
  });

  const { data: projects, isLoading: projectsLoading } = useQuery<OrganizerProject[]>({
    queryKey: ["/api/organizer/projects"],
  });

  const { data: planLimits } = useQuery<PlanLimits>({
    queryKey: ["/api/organizer/plan"],
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data: { name: string; slug: string }) => {
      const res = await apiRequest("POST", "/api/projects", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizer/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/organizer/stats"] });
      setDialogOpen(false);
      setProjectName("");
      toast({ title: t.common.success, description: org.projectCreated });
    },
    onError: () => {
      toast({ variant: "destructive", title: t.common.error, description: org.projectCreateFailed });
    },
  });

  const handleCreateProject = () => {
    if (!projectName.trim()) return;
    const slug = projectName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    createProjectMutation.mutate({ name: projectName.trim(), slug });
  };

  const mintLimitPerDrop = planLimits?.maxMintsPerDrop ?? 50;
  const locationLimit = planLimits?.maxLocations ?? 1;
  const currentLocations = planLimits?.currentLocations ?? 0;
  const planSlug = planLimits?.planSlug ?? "free";
  const hasMintLimit = planLimits?.maxMintsPerDrop !== null;
  const hasLocationLimit = planLimits?.maxLocations !== null;

  const highestDropUsage = stats?.mintsByDrop?.reduce((max, d) => {
    const supply = d.supply || mintLimitPerDrop;
    const usage = supply > 0 ? (d.mintCount / supply) * 100 : 0;
    return Math.max(max, usage);
  }, 0) ?? 0;

  const isNearLimit = hasMintLimit && highestDropUsage >= 80;
  const isAtLimit = hasMintLimit && highestDropUsage >= 100;
  const isLocationNearLimit = hasLocationLimit ? currentLocations >= locationLimit * 0.8 : false;

  const chartData = stats?.mintsByDrop.map(d => ({
    name: d.dropTitle.length > 15 ? d.dropTitle.slice(0, 15) + "…" : d.dropTitle,
    mints: d.mintCount,
  })) || [];

  const timeLabels: RelativeTimeLabels = {
    justNow: org.justNow,
    minutesAgo: org.minutesAgo,
    hoursAgo: org.hoursAgo,
    daysAgo: org.daysAgo,
  };

  return (
    <OrganizerLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold" data-testid="text-organizer-dashboard-title">
              {org.dashboardTitle}
            </h1>
            <p className="text-muted-foreground mt-1" data-testid="text-organizer-dashboard-subtitle">
              {org.dashboardSubtitle}
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-project" className="gap-2">
                <Plus className="w-4 h-4" />
                {org.createProject}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{org.createProject}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="project-name">{org.projectName}</Label>
                  <Input
                    id="project-name"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder={org.projectNamePlaceholder}
                    data-testid="input-project-name"
                  />
                </div>
                <Button
                  onClick={handleCreateProject}
                  disabled={!projectName.trim() || createProjectMutation.isPending}
                  className="w-full"
                  data-testid="button-confirm-create-project"
                >
                  {createProjectMutation.isPending ? t.common.loading : t.common.create}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isNearLimit && !isAtLimit && (
          <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950" data-testid="alert-near-limit">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800 dark:text-orange-200">
              {org.nearLimitWarning}
            </AlertDescription>
          </Alert>
        )}

        {isAtLimit && (
          <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950" data-testid="alert-at-limit">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              {org.atLimitWarning}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <StatCard icon={Zap} label={org.totalMints} value={stats?.totalMints || 0} isLoading={statsLoading} />
          <StatCard icon={Layers} label={org.activeDrops} value={stats?.activeDrops || 0} isLoading={statsLoading} />
          <StatCard icon={MapPin} label={org.totalLocations} value={stats?.totalLocations || 0} isLoading={statsLoading} />
          <StatCard icon={Box} label={org.totalProjects} value={stats?.totalProjects || 0} isLoading={statsLoading} />
        </div>

        <Card data-testid="card-plan-usage">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">{org.planUsage}</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-full" />
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{org.freePlan} — {planSlug.charAt(0).toUpperCase() + planSlug.slice(1)}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">{t.planLimits?.mintsUsed || "Mints"} (per drop)</span>
                    <span className="font-medium" data-testid="text-plan-usage-count">
                      {hasMintLimit ? mintLimitPerDrop + " max" : (t.planLimits?.unlimited || "∞")}
                    </span>
                  </div>
                  {hasMintLimit && stats?.mintsByDrop && stats.mintsByDrop.length > 0 && (
                    <div className="space-y-1">
                      {stats.mintsByDrop.map(d => {
                        const supply = d.supply || mintLimitPerDrop;
                        const pct = supply > 0 ? Math.min((d.mintCount / supply) * 100, 100) : 0;
                        return (
                          <div key={d.dropId} className="space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span className="truncate max-w-[60%]">{d.dropTitle}</span>
                              <span>{d.mintCount} / {supply}</span>
                            </div>
                            <Progress 
                              value={pct} 
                              className={`h-2 ${pct >= 100 ? '[&>div]:bg-red-500' : pct >= 80 ? '[&>div]:bg-orange-500' : ''}`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">{t.planLimits?.locationsUsed || "Locations"}</span>
                    <span className="font-medium" data-testid="text-location-usage-count">
                      {currentLocations} / {hasLocationLimit ? locationLimit : (t.planLimits?.unlimited || "∞")}
                    </span>
                  </div>
                  {hasLocationLimit && (
                    <Progress 
                      value={Math.min((currentLocations / locationLimit) * 100, 100)} 
                      className={`h-3 ${currentLocations >= locationLimit ? '[&>div]:bg-red-500' : isLocationNearLimit ? '[&>div]:bg-orange-500' : ''}`}
                      data-testid="progress-location-usage"
                    />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {org.totalMints}: {stats?.totalMints || 0}
                </p>
                {(isNearLimit || isAtLimit || isLocationNearLimit) && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      {t.planLimits?.upgradePrompt || "Upgrade your plan for more capacity"}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-projects-list">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <FolderOpen className="w-4 h-4" />
              {org.myProjects}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {projectsLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : projects && projects.length > 0 ? (
              <div className="space-y-3">
                {projects.map(project => (
                  <div key={project.id} className="flex items-center justify-between p-3 rounded-lg bg-accent/50" data-testid={`project-row-${project.id}`}>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm">{project.name}</p>
                      <p className="text-xs text-muted-foreground">/{project.slug}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-24 flex items-center justify-center text-muted-foreground text-sm">
                {org.noProjects}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <Card data-testid="card-mints-by-drop">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">{org.mintsByEvent}</CardTitle>
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
                  {org.noData}
                </div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-drops-detail">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">{org.dropsOverview}</CardTitle>
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
                  {org.noDrops}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card data-testid="card-recent-mints">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">{org.recentMints}</CardTitle>
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
                      <span className="text-xs text-muted-foreground">{formatRelativeTime(mint.createdAt, timeLabels)}</span>
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
                {org.noMints}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </OrganizerLayout>
  );
}
