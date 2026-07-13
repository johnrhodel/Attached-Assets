import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Activity, Layers, MapPin, FolderOpen, Power, PowerOff } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation, useParams } from "wouter";

interface OrganizerDetailData {
  user: {
    id: number;
    email: string;
    name: string | null;
    role: string;
    isActive: boolean;
    planSlug: string | null;
    createdAt: string;
  };
  projects: Array<{
    id: number;
    name: string;
    slug: string;
    createdAt: string;
    locations: Array<{
      id: number;
      name: string;
      slug: string;
      drops: Array<{
        id: number;
        title: string;
        status: string;
        supply: number | null;
        mintCount: number;
      }>;
    }>;
  }>;
  totalMints: number;
}

function getPlanColor(plan: string): string {
  switch (plan) {
    case "starter": return "bg-blue-100 text-blue-800";
    case "professional": return "bg-purple-100 text-purple-800";
    case "enterprise": return "bg-amber-100 text-amber-800";
    default: return "bg-gray-100 text-gray-800";
  }
}

function usePlanLabel() {
  const { t } = useI18n();
  return (slug: string) => {
    const map: Record<string, string> = {
      free: t.pricing.free,
      starter: t.pricing.starter,
      professional: t.pricing.professional,
      enterprise: t.pricing.enterprise,
    };
    return map[slug] || slug;
  };
}

export default function OrganizerDetail() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const getPlanLabel = usePlanLabel();
  const params = useParams<{ id: string }>();
  const organizerId = Number(params.id);

  const { data, isLoading } = useQuery<OrganizerDetailData>({
    queryKey: ["/api/admin/organizers", organizerId],
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      apiRequest("PATCH", `/api/admin/organizers/${id}`, { active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizers", organizerId] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizers/stats"] });
      toast({ title: t.admin.statusChanged });
    },
    onError: () => {
      toast({ title: t.common.error, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6" data-testid="organizer-detail-loading">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="shadow-sm"><CardContent className="pt-6"><Skeleton className="h-8 w-20" /></CardContent></Card>
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!data) {
    return (
      <AdminLayout>
        <div className="text-center py-12 text-muted-foreground" data-testid="organizer-not-found">
          {t.admin.organizerNotFound}
        </div>
      </AdminLayout>
    );
  }

  const { user, projects: orgProjects, totalMints } = data;
  const totalLocations = orgProjects.reduce((sum, p) => sum + p.locations.length, 0);
  const totalDrops = orgProjects.reduce((sum, p) => sum + p.locations.reduce((s, l) => s + l.drops.length, 0), 0);

  return (
    <AdminLayout>
      <div className="space-y-6" data-testid="organizer-detail-content">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/admin/organizers")} data-testid="button-back-organizers">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h2 className="text-2xl font-serif font-bold text-foreground" data-testid="text-organizer-detail-title">
              {user.name || user.email}
            </h2>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getPlanColor(user.planSlug || "free")} data-testid="badge-detail-plan">
              {getPlanLabel(user.planSlug || "free")}
            </Badge>
            <Badge variant={user.isActive ? "default" : "destructive"} data-testid="badge-detail-status">
              {user.isActive ? t.admin.active : t.admin.inactive}
            </Badge>
            <Button
              variant={user.isActive ? "destructive" : "default"}
              size="sm"
              className="gap-1"
              onClick={() => toggleMutation.mutate({ id: user.id, active: !user.isActive })}
              disabled={toggleMutation.isPending}
              data-testid="button-toggle-detail"
            >
              {user.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
              {user.isActive ? t.admin.deactivate : t.admin.activate}
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t.admin.totalOrganizerMints}</CardTitle>
              <Activity className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-detail-mints">{totalMints}</div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t.admin.organizerProjects}</CardTitle>
              <FolderOpen className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-detail-projects">{orgProjects.length}</div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t.admin.organizerLocations}</CardTitle>
              <MapPin className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-detail-locations">{totalLocations}</div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t.admin.organizerDrops}</CardTitle>
              <Layers className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-detail-drops">{totalDrops}</div>
            </CardContent>
          </Card>
        </div>

        <div className="text-sm text-muted-foreground" data-testid="text-detail-joined">
          {t.admin.joined}: {new Date(user.createdAt).toLocaleDateString()}
        </div>

        {orgProjects.length > 0 ? (
          <div className="space-y-4">
            {orgProjects.map((project) => (
              <Card key={project.id} className="shadow-sm" data-testid={`card-project-${project.id}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FolderOpen className="h-5 w-5 text-primary" />
                    {project.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {project.locations.length > 0 ? (
                    <div className="space-y-3">
                      {project.locations.map((loc) => (
                        <div key={loc.id} className="border rounded-lg p-3" data-testid={`card-location-${loc.id}`}>
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="h-4 w-4 text-orange-500" />
                            <span className="font-medium">{loc.name}</span>
                          </div>
                          {loc.drops.length > 0 ? (
                            <div className="space-y-2 ml-6">
                              {loc.drops.map((drop) => (
                                <div key={drop.id} className="flex items-center gap-3 text-sm" data-testid={`row-drop-${drop.id}`}>
                                  <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span className="flex-1">{drop.title}</span>
                                  <Badge variant={drop.status === "published" ? "default" : "secondary"} className="text-xs">
                                    {drop.status}
                                  </Badge>
                                  <span className="text-muted-foreground">
                                    {drop.mintCount} / {drop.supply ?? t.admin.unlimited}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground ml-6">—</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t.admin.noProjects}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="shadow-sm">
            <CardContent className="text-center py-8 text-muted-foreground" data-testid="text-no-projects">
              <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
              {t.admin.noProjects}
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
