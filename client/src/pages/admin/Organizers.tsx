import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Users, UserCheck, UserPlus, TrendingUp, Search, Eye, Power, PowerOff } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";

interface OrganizerStats {
  totalOrganizers: number;
  activeOrganizers: number;
  newLastMonth: number;
  byPlan: Record<string, number>;
  conversionRate: number;
  totalPlatformMints: number;
}

interface OrganizerListItem {
  id: number;
  email: string;
  name: string | null;
  planSlug: string | null;
  isActive: boolean;
  createdAt: string;
  totalMints: number;
  totalProjects: number;
}

interface OrganizerListResponse {
  organizers: OrganizerListItem[];
  total: number;
}

function getPlanColor(plan: string): string {
  switch (plan) {
    case "starter": return "bg-blue-100 text-blue-800";
    case "professional": return "bg-purple-100 text-purple-800";
    case "enterprise": return "bg-amber-100 text-amber-800";
    default: return "bg-gray-100 text-gray-800";
  }
}

export default function Organizers() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [page, setPage] = useState(1);

  const { data: stats, isLoading: statsLoading } = useQuery<OrganizerStats>({
    queryKey: ["/api/admin/organizers/stats"],
  });

  const { data: organizerData, isLoading: listLoading } = useQuery<OrganizerListResponse>({
    queryKey: ["/api/admin/organizers", planFilter, searchQuery, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (planFilter !== "all") params.set("planSlug", planFilter);
      if (searchQuery) params.set("search", searchQuery);
      params.set("page", String(page));
      params.set("limit", "20");
      const res = await fetch(`/api/admin/organizers?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      apiRequest("PATCH", `/api/admin/organizers/${id}`, { active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizers/stats"] });
      toast({ title: t.admin.statusChanged });
    },
    onError: () => {
      toast({ title: t.common.error, variant: "destructive" });
    },
  });

  const metricCards = [
    { title: t.admin.totalOrganizers, value: stats?.totalOrganizers ?? 0, icon: Users, color: "text-blue-500" },
    { title: t.admin.activeOrganizers, value: stats?.activeOrganizers ?? 0, icon: UserCheck, color: "text-green-500" },
    { title: t.admin.newLastMonth, value: stats?.newLastMonth ?? 0, icon: UserPlus, color: "text-purple-500" },
    { title: t.admin.conversionRate, value: `${stats?.conversionRate ?? 0}%`, icon: TrendingUp, color: "text-orange-500" },
  ];

  if (statsLoading) {
    return (
      <AdminLayout>
        <div className="space-y-8" data-testid="organizers-loading">
          <Skeleton className="h-9 w-64" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent><Skeleton className="h-8 w-20" /></CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  const totalPages = Math.ceil((organizerData?.total ?? 0) / 20);

  return (
    <AdminLayout>
      <div className="space-y-8" data-testid="organizers-content">
        <div>
          <h2 className="text-3xl font-serif font-bold text-foreground" data-testid="text-organizers-title">
            {t.admin.organizerManagement}
          </h2>
          <p className="text-muted-foreground mt-2">
            {t.admin.totalOrganizers}: {stats?.totalOrganizers ?? 0}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {metricCards.map((stat, i) => (
            <Card key={i} className="shadow-sm" data-testid={`card-org-metric-${i}`}>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid={`text-org-metric-value-${i}`}>
                  {typeof stat.value === "number" ? stat.value.toLocaleString() : stat.value}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {stats?.byPlan && Object.keys(stats.byPlan).length > 0 && (
          <Card className="shadow-sm" data-testid="card-plan-distribution">
            <CardHeader>
              <CardTitle>{t.admin.planDistribution}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {Object.entries(stats.byPlan).map(([plan, count]) => (
                  <div key={plan} className="flex items-center gap-2">
                    <Badge className={getPlanColor(plan)}>{plan}</Badge>
                    <span className="text-lg font-bold" data-testid={`text-plan-count-${plan}`}>{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-sm" data-testid="card-organizer-list">
          <CardHeader className="space-y-4">
            <CardTitle>{t.admin.organizerList}</CardTitle>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t.admin.searchOrganizers}
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                  className="pl-9"
                  data-testid="input-search-organizers"
                />
              </div>
              <Select value={planFilter} onValueChange={(v) => { setPlanFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[180px]" data-testid="select-plan-filter">
                  <SelectValue placeholder={t.admin.filterByPlan} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.admin.allPlans}</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {listLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : (organizerData?.organizers?.length ?? 0) > 0 ? (
              <div className="space-y-0">
                <div className="hidden md:grid grid-cols-7 gap-4 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide border-b">
                  <span>{t.admin.name}</span>
                  <span>{t.admin.email}</span>
                  <span>{t.admin.plan}</span>
                  <span className="text-center">{t.admin.projects}</span>
                  <span className="text-center">{t.admin.mints}</span>
                  <span>{t.admin.status}</span>
                  <span className="text-right">{t.admin.actions}</span>
                </div>
                {organizerData!.organizers.map((org) => (
                  <div
                    key={org.id}
                    className="grid grid-cols-1 md:grid-cols-7 gap-2 md:gap-4 px-4 py-3 border-b last:border-0 items-center hover:bg-accent/50 transition-colors"
                    data-testid={`row-organizer-${org.id}`}
                  >
                    <div className="font-medium truncate" data-testid={`text-org-name-${org.id}`}>
                      {org.name || "—"}
                    </div>
                    <div className="text-sm text-muted-foreground truncate" data-testid={`text-org-email-${org.id}`}>
                      {org.email}
                    </div>
                    <div>
                      <Badge className={getPlanColor(org.planSlug || "free")} data-testid={`badge-org-plan-${org.id}`}>
                        {org.planSlug || "free"}
                      </Badge>
                    </div>
                    <div className="text-center font-medium" data-testid={`text-org-projects-${org.id}`}>
                      {org.totalProjects}
                    </div>
                    <div className="text-center font-medium" data-testid={`text-org-mints-${org.id}`}>
                      {org.totalMints}
                    </div>
                    <div>
                      <Badge variant={org.isActive ? "default" : "destructive"} data-testid={`badge-org-status-${org.id}`}>
                        {org.isActive ? t.admin.active : t.admin.inactive}
                      </Badge>
                    </div>
                    <div className="flex gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setLocation(`/admin/organizers/${org.id}`)}
                        data-testid={`button-view-org-${org.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleMutation.mutate({ id: org.id, active: !org.isActive })}
                        disabled={toggleMutation.isPending}
                        data-testid={`button-toggle-org-${org.id}`}
                      >
                        {org.isActive ? <PowerOff className="h-4 w-4 text-destructive" /> : <Power className="h-4 w-4 text-green-600" />}
                      </Button>
                    </div>
                  </div>
                ))}

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage(p => p - 1)}
                      data-testid="button-prev-page"
                    >
                      ←
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {page} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage(p => p + 1)}
                      data-testid="button-next-page"
                    >
                      →
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground" data-testid="text-no-organizers">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                {t.admin.noOrganizers}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
