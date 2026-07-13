import { AdminLayout } from "@/components/AdminLayout";
import { useI18n } from "@/lib/i18n/context";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
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

interface ActivityLog {
  id: number;
  userEmail: string;
  action: string;
  entity: string;
  details: string;
  createdAt: string;
}

function getActionBadgeVariant(action: string): "default" | "secondary" | "destructive" | "outline" {
  switch (action) {
    case "update":
      return "secondary";
    case "delete":
      return "destructive";
    case "export":
      return "outline";
    default:
      return "default";
  }
}

export default function Activity() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [showConfirm, setShowConfirm] = useState(false);

  const { data: activities, isLoading } = useQuery<ActivityLog[]>({
    queryKey: ["/api/admin/activity"],
  });

  const clearMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/admin/activity");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/activity"] });
      setShowConfirm(false);
      toast({ title: t.admin.clearActivitySuccess });
    },
    onError: () => {
      setShowConfirm(false);
      toast({ title: t.admin.clearActivityFailed, variant: "destructive" });
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-serif font-bold text-foreground" data-testid="text-activity-title">
            {t.admin.activityLog}
          </h2>
          {activities && activities.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowConfirm(true)}
              data-testid="button-clear-activity"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {t.admin.clearActivity}
            </Button>
          )}
        </div>

        <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t.admin.clearActivityConfirm}</AlertDialogTitle>
              <AlertDialogDescription>{t.admin.clearActivityWarning}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-clear-activity">
                {t.common.cancel}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => clearMutation.mutate()}
                disabled={clearMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-testid="button-confirm-clear-activity"
              >
                {clearMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {t.common.confirm}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {isLoading ? (
          <div className="flex justify-center p-12" data-testid="activity-loading">
            <Loader2 className="animate-spin text-primary" />
          </div>
        ) : !activities || activities.length === 0 ? (
          <div className="text-center text-muted-foreground py-12" data-testid="text-no-activity">
            {t.admin.noActivity}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border" data-testid="table-activity">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t.admin.date}</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t.admin.email || "User"}</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t.admin.action}</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t.admin.entity}</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t.admin.details}</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((log) => {
                  const date = new Date(log.createdAt);
                  return (
                    <tr key={log.id} className="border-b border-border last:border-0" data-testid={`row-activity-${log.id}`}>
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                        {date.toLocaleDateString()} {date.toLocaleTimeString()}
                      </td>
                      <td className="px-4 py-3" data-testid={`text-activity-user-${log.id}`}>
                        {log.userEmail}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={getActionBadgeVariant(log.action)} data-testid={`badge-action-${log.id}`}>
                          {log.action}
                        </Badge>
                      </td>
                      <td className="px-4 py-3" data-testid={`text-activity-entity-${log.id}`}>
                        {log.entity}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground" data-testid={`text-activity-details-${log.id}`}>
                        {log.details}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
