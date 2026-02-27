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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, Trash2, X, Star } from "lucide-react";

interface SettingsData {
  platformName: string;
  platformLogo: string;
  socialTwitter: string;
  socialInstagram: string;
  socialLinkedin: string;
  socialWebsite: string;
}

interface PricingPlan {
  id: number;
  name: string;
  description: string;
  price: string;
  pricePer: string;
  features: string[];
  highlighted: boolean;
  sortOrder: number;
  isActive: boolean;
}

const defaultSettings: SettingsData = {
  platformName: "",
  platformLogo: "",
  socialTwitter: "",
  socialInstagram: "",
  socialLinkedin: "",
  socialWebsite: "",
};

function PricingPlanCard({ plan, onSave, onDelete }: { plan: PricingPlan; onSave: (data: Partial<PricingPlan>) => void; onDelete: () => void }) {
  const { t } = useI18n();
  const [form, setForm] = useState(plan);
  const [newFeature, setNewFeature] = useState("");
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setForm(plan);
    setIsDirty(false);
  }, [plan]);

  const handleChange = (key: string, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const addFeature = () => {
    if (!newFeature.trim()) return;
    handleChange("features", [...form.features, newFeature.trim()]);
    setNewFeature("");
  };

  const removeFeature = (index: number) => {
    handleChange("features", form.features.filter((_, i) => i !== index));
  };

  return (
    <Card className={`relative ${form.highlighted ? 'ring-2 ring-primary/30 border-primary' : ''}`} data-testid={`card-admin-pricing-${plan.id}`}>
      <CardContent className="pt-5 space-y-4">
        {form.highlighted && (
          <Badge className="absolute -top-2.5 left-4" data-testid={`badge-highlighted-${plan.id}`}>
            <Star className="w-3 h-3 mr-1" /> Popular
          </Badge>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">{t.admin.pricingPlanName}</Label>
            <Input
              value={form.name}
              onChange={e => handleChange("name", e.target.value)}
              data-testid={`input-plan-name-${plan.id}`}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t.admin.pricingPlanDesc}</Label>
            <Input
              value={form.description}
              onChange={e => handleChange("description", e.target.value)}
              data-testid={`input-plan-desc-${plan.id}`}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t.admin.pricingPlanPrice}</Label>
            <Input
              value={form.price}
              onChange={e => handleChange("price", e.target.value)}
              data-testid={`input-plan-price-${plan.id}`}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t.admin.pricingPlanPer}</Label>
            <Input
              value={form.pricePer}
              onChange={e => handleChange("pricePer", e.target.value)}
              data-testid={`input-plan-per-${plan.id}`}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">{t.admin.pricingPlanFeatures}</Label>
          <div className="flex flex-wrap gap-1.5">
            {form.features.map((f, i) => (
              <Badge key={i} variant="secondary" className="gap-1 text-xs" data-testid={`badge-feature-${plan.id}-${i}`}>
                {f}
                <button onClick={() => removeFeature(i)} className="ml-0.5 hover:text-destructive">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newFeature}
              onChange={e => setNewFeature(e.target.value)}
              onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addFeature())}
              placeholder={t.admin.addFeature}
              className="text-sm"
              data-testid={`input-new-feature-${plan.id}`}
            />
            <Button type="button" variant="outline" size="sm" onClick={addFeature} data-testid={`button-add-feature-${plan.id}`}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <Switch
              checked={form.highlighted}
              onCheckedChange={v => handleChange("highlighted", v)}
              data-testid={`switch-highlighted-${plan.id}`}
            />
            <Label className="text-xs">{t.admin.pricingPlanHighlighted}</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={form.isActive}
              onCheckedChange={v => handleChange("isActive", v)}
              data-testid={`switch-active-${plan.id}`}
            />
            <Label className="text-xs">{t.admin.pricingPlanActive}</Label>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs">Order</Label>
            <Input
              type="number"
              value={form.sortOrder}
              onChange={e => handleChange("sortOrder", Number(e.target.value))}
              className="w-16 text-sm"
              data-testid={`input-sort-order-${plan.id}`}
            />
          </div>
        </div>

        <div className="flex justify-between pt-2 border-t">
          <Button
            variant="destructive"
            size="sm"
            onClick={onDelete}
            data-testid={`button-delete-plan-${plan.id}`}
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            {t.admin.deletePlan}
          </Button>
          <Button
            size="sm"
            disabled={!isDirty}
            onClick={() => {
              onSave(form);
              setIsDirty(false);
            }}
            data-testid={`button-save-plan-${plan.id}`}
          >
            {t.common.save}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Settings() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [form, setForm] = useState<SettingsData>(defaultSettings);

  const { data: settings, isLoading } = useQuery<SettingsData>({
    queryKey: ["/api/admin/settings"],
  });

  const { data: pricingPlans, isLoading: plansLoading } = useQuery<PricingPlan[]>({
    queryKey: ["/api/admin/pricing"],
    queryFn: async () => {
      const res = await fetch("/api/admin/pricing");
      if (!res.ok) throw new Error("Failed to fetch pricing plans");
      return res.json();
    },
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

  const updatePlanMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<PricingPlan> & { id: number }) => {
      await apiRequest("PUT", `/api/admin/pricing/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pricing"] });
      toast({ title: t.admin.planSaved });
    },
  });

  const createPlanMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/admin/pricing", {
        name: "New Plan",
        description: "Description",
        price: "R$0",
        pricePer: "/month",
        features: [],
        highlighted: false,
        sortOrder: (pricingPlans?.length || 0),
        isActive: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pricing"] });
      toast({ title: t.admin.planCreated });
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/pricing/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pricing"] });
      toast({ title: t.admin.planDeleted });
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

        <Card data-testid="card-pricing-management">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t.admin.pricingPlans}</CardTitle>
            <Button
              size="sm"
              onClick={() => createPlanMutation.mutate()}
              disabled={createPlanMutation.isPending}
              data-testid="button-add-plan"
            >
              {createPlanMutation.isPending ? <Loader2 className="animate-spin w-4 h-4" /> : <Plus className="w-4 h-4 mr-1" />}
              {t.admin.addPlan}
            </Button>
          </CardHeader>
          <CardContent>
            {plansLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-4">
                {pricingPlans?.map(plan => (
                  <PricingPlanCard
                    key={plan.id}
                    plan={plan}
                    onSave={(data) => updatePlanMutation.mutate({ id: plan.id, ...data })}
                    onDelete={() => deletePlanMutation.mutate(plan.id)}
                  />
                ))}
                {(!pricingPlans || pricingPlans.length === 0) && (
                  <p className="text-center text-muted-foreground py-8 text-sm">
                    {t.admin.noNotifications}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
