import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { useI18n } from "@/lib/i18n/context";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface SettingsData {
  platformName: string;
  platformLogo: string;
  socialTwitter: string;
  socialInstagram: string;
  socialLinkedin: string;
  socialWebsite: string;
}

const defaultSettings: SettingsData = {
  platformName: "",
  platformLogo: "",
  socialTwitter: "",
  socialInstagram: "",
  socialLinkedin: "",
  socialWebsite: "",
};

export default function Settings() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [form, setForm] = useState<SettingsData>(defaultSettings);

  const { data: settings, isLoading } = useQuery<SettingsData>({
    queryKey: ["/api/admin/settings"],
  });

  useEffect(() => {
    if (settings) {
      setForm({ ...defaultSettings, ...settings });
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (data: SettingsData) => {
      await apiRequest("PUT", "/api/admin/settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({ title: t.common.success, description: t.admin.settingsSaved });
    },
    onError: () => {
      toast({ title: t.common.error, description: t.common.error, variant: "destructive" });
    },
  });

  const handleChange = (key: keyof SettingsData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(form);
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-serif font-bold text-foreground" data-testid="text-settings-title">
            {t.admin.settings}
          </h2>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-12" data-testid="settings-loading">
            <Loader2 className="animate-spin text-primary" />
          </div>
        ) : (
          <Card data-testid="card-settings">
            <CardHeader>
              <CardTitle>{t.admin.settings}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="platformName">{t.admin.platformName}</Label>
                  <Input
                    id="platformName"
                    value={form.platformName}
                    onChange={(e) => handleChange("platformName", e.target.value)}
                    data-testid="input-platform-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="platformLogo">{t.admin.platformLogo}</Label>
                  <Input
                    id="platformLogo"
                    value={form.platformLogo}
                    onChange={(e) => handleChange("platformLogo", e.target.value)}
                    data-testid="input-platform-logo"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="socialTwitter">{t.admin.socialTwitter}</Label>
                  <Input
                    id="socialTwitter"
                    value={form.socialTwitter}
                    onChange={(e) => handleChange("socialTwitter", e.target.value)}
                    data-testid="input-social-twitter"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="socialInstagram">{t.admin.socialInstagram}</Label>
                  <Input
                    id="socialInstagram"
                    value={form.socialInstagram}
                    onChange={(e) => handleChange("socialInstagram", e.target.value)}
                    data-testid="input-social-instagram"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="socialLinkedin">{t.admin.socialLinkedin}</Label>
                  <Input
                    id="socialLinkedin"
                    value={form.socialLinkedin}
                    onChange={(e) => handleChange("socialLinkedin", e.target.value)}
                    data-testid="input-social-linkedin"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="socialWebsite">{t.admin.socialWebsite}</Label>
                  <Input
                    id="socialWebsite"
                    value={form.socialWebsite}
                    onChange={(e) => handleChange("socialWebsite", e.target.value)}
                    data-testid="input-social-website"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={saveMutation.isPending}
                  data-testid="button-save-settings"
                >
                  {saveMutation.isPending ? <Loader2 className="animate-spin" /> : t.common.save}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}