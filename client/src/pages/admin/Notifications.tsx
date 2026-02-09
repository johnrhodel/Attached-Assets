import { AdminLayout } from "@/components/AdminLayout";
import { useI18n } from "@/lib/i18n/context";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, AlertTriangle, Loader2 } from "lucide-react";

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export default function Notifications() {
  const { t } = useI18n();
  const { toast } = useToast();

  const { data: notificationsData, isLoading } = useQuery<{ notifications: Notification[]; unreadCount: number }>({
    queryKey: ["/api/admin/notifications"],
  });
  const notifications = notificationsData?.notifications;

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/admin/notifications/read-all");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
    },
    onError: () => {
      toast({ title: t.common.error, description: t.common.error, variant: "destructive" });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/admin/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
    },
  });

  const getIcon = (type: string) => {
    switch (type) {
      case "low_balance":
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case "new_mint":
      default:
        return <Bell className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-serif font-bold text-foreground" data-testid="text-notifications-title">
              {t.admin.notifications}
            </h2>
          </div>
          <Button
            variant="outline"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            data-testid="button-mark-all-read"
          >
            {markAllReadMutation.isPending ? <Loader2 className="animate-spin mr-2" /> : null}
            {t.admin.markAllRead}
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-12" data-testid="notifications-loading">
            <Loader2 className="animate-spin text-primary" />
          </div>
        ) : !notifications || notifications.length === 0 ? (
          <div className="text-center text-muted-foreground py-12" data-testid="text-no-notifications">
            {t.admin.noNotifications}
          </div>
        ) : (
          <div className="space-y-3" data-testid="list-notifications">
            {notifications.map((notification) => {
              const date = new Date(notification.createdAt);
              return (
                <Card
                  key={notification.id}
                  className={`cursor-pointer transition-all ${!notification.read ? "bg-accent/50" : ""}`}
                  onClick={() => {
                    if (!notification.read) {
                      markReadMutation.mutate(notification.id);
                    }
                  }}
                  data-testid={`card-notification-${notification.id}`}
                >
                  <CardContent className="flex items-start gap-4 p-4">
                    <div className="mt-0.5">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium" data-testid={`text-notification-title-${notification.id}`}>
                          {notification.title}
                        </span>
                        {!notification.read && (
                          <span
                            className="h-2 w-2 rounded-full bg-primary inline-block"
                            data-testid={`indicator-unread-${notification.id}`}
                          />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1" data-testid={`text-notification-message-${notification.id}`}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2" data-testid={`text-notification-time-${notification.id}`}>
                        {date.toLocaleDateString()} {date.toLocaleTimeString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}