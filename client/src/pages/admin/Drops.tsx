import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { useProjects, useLocations } from "@/hooks/use-projects";
import { useDrops, useCreateDrop, usePublishDrop } from "@/hooks/use-drops";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, Zap, QrCode, Copy, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { useI18n } from "@/lib/i18n/context";

export default function Drops() {
  const { t } = useI18n();
  const { data: projects } = useProjects();
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedLocation, setSelectedLocation] = useState<string>("");

  const { data: locations } = useLocations(Number(selectedProject));
  const { data: drops, isLoading: dropsLoading } = useDrops(Number(selectedLocation));
  const { mutate: publishDrop } = usePublishDrop();

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-serif font-bold text-foreground">{t.nav.drops}</h2>
          <p className="text-muted-foreground mt-2">{t.admin.welcome}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 bg-card p-6 rounded-xl shadow-sm border">
          <div className="w-full sm:w-[250px] space-y-2">
            <Label>{t.nav.projects}</Label>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger data-testid="select-project">
                <SelectValue placeholder={t.nav.projects} />
              </SelectTrigger>
              <SelectContent>
                {projects?.map(p => (
                  <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-[250px] space-y-2">
            <Label>{t.nav.locations}</Label>
            <Select value={selectedLocation} onValueChange={setSelectedLocation} disabled={!selectedProject}>
              <SelectTrigger data-testid="select-location">
                <SelectValue placeholder={t.nav.locations} />
              </SelectTrigger>
              <SelectContent>
                {locations?.map(l => (
                  <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="sm:ml-auto self-end">
            <CreateDropDialog locationId={Number(selectedLocation)} disabled={!selectedLocation} />
          </div>
        </div>

        {selectedLocation && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {dropsLoading ? (
              <div className="col-span-full flex justify-center p-12"><Loader2 className="animate-spin" /></div>
            ) : drops?.length === 0 ? (
              <div className="col-span-full text-center p-12 text-muted-foreground border-2 border-dashed rounded-xl">
                {t.claim.noActiveDrop}
              </div>
            ) : (
              drops?.map((drop) => (
                <DropCard key={drop.id} drop={drop} locationId={Number(selectedLocation)} onPublish={publishDrop} />
              ))
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function DropCard({ drop, locationId, onPublish }: { drop: any, locationId: number, onPublish: any }) {
  const { t } = useI18n();
  const { toast } = useToast();

  const claimUrl = `${window.location.origin}/claim/${locationId}`;
  const qrImageUrl = `/api/qr/${locationId}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(claimUrl);
      toast({ title: t.admin.linkCopied });
    } catch {
      toast({ title: t.common.error, variant: "destructive" });
    }
  };

  const handleDownloadQR = async () => {
    try {
      const response = await fetch(qrImageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `qr-claim-${locationId}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: t.common.error, variant: "destructive" });
    }
  };

  return (
    <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300 border-border/60" data-testid={`card-drop-${drop.id}`}>
      <div className="aspect-video bg-accent relative overflow-hidden">
        <img 
          src={drop.imageUrl || "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop"} 
          alt={drop.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-2 right-2">
          <Badge variant={drop.status === 'published' ? 'default' : 'secondary'} className="shadow-md">
            {drop.status === 'published' ? t.admin.published : t.admin.draft}
          </Badge>
        </div>
      </div>
      <CardHeader className="space-y-1">
        <CardTitle className="text-lg">{drop.title}</CardTitle>
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <Calendar className="w-3 h-3" /> {drop.month} {drop.year}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm mb-4">
          <span className="text-muted-foreground">{t.admin.supply}:</span>
          <span className="font-mono font-medium">{drop.mintedCount} / {drop.supply}</span>
        </div>
        <div className="flex gap-2">
          {drop.status === 'draft' && (
            <Button 
              className="flex-1" 
              onClick={() => onPublish({ id: drop.id, locationId })}
              data-testid={`button-publish-drop-${drop.id}`}
            >
              {t.admin.publish}
            </Button>
          )}
          {drop.status === 'published' && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex-1 gap-2" data-testid={`button-qr-drop-${drop.id}`}>
                  <QrCode className="w-4 h-4" />
                  {t.admin.qrCode}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t.admin.qrCode} — {drop.title}</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="bg-white p-4 rounded-lg">
                    <img
                      src={qrImageUrl}
                      alt={`QR Code for ${drop.title}`}
                      className="w-[300px] h-[300px]"
                      data-testid={`img-qr-${drop.id}`}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground break-all text-center" data-testid={`text-claim-url-${drop.id}`}>
                    {claimUrl}
                  </p>
                  <div className="flex gap-2 w-full">
                    <Button
                      variant="outline"
                      className="flex-1 gap-2"
                      onClick={handleCopyLink}
                      data-testid={`button-copy-link-${drop.id}`}
                    >
                      <Copy className="w-4 h-4" />
                      {t.admin.copyLink}
                    </Button>
                    <Button
                      variant="default"
                      className="flex-1 gap-2"
                      onClick={handleDownloadQR}
                      data-testid={`button-download-qr-${drop.id}`}
                    >
                      <Download className="w-4 h-4" />
                      {t.admin.generateQR}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CreateDropDialog({ locationId, disabled }: { locationId: number, disabled: boolean }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const { mutate, isPending } = useCreateDrop();
  const [formData, setFormData] = useState({
    title: "",
    month: "February",
    year: 2026,
    imageUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop",
    metadataUrl: "https://example.com/metadata.json",
    supply: 1000,
    status: "draft",
    enabledChains: ["evm"],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate({ locationId, ...formData }, { onSuccess: () => setOpen(false) });
  };

  const toggleChain = (chain: string) => {
    setFormData(prev => ({
      ...prev,
      enabledChains: prev.enabledChains.includes(chain) 
        ? prev.enabledChains.filter(c => c !== chain)
        : [...prev.enabledChains, chain]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={disabled} className="gap-2" data-testid="button-new-drop"><Zap className="w-4 h-4" /> {t.admin.createDrop}</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t.admin.createDrop}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <div className="space-y-2 col-span-2">
            <Label>{t.admin.dropTitle}</Label>
            <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required data-testid="input-drop-title" />
          </div>
          
          <div className="space-y-2">
            <Label>{t.admin.month}</Label>
            <Select value={formData.month} onValueChange={m => setFormData({...formData, month: m})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {['January','February','March','April','May','June','July','August','September','October','November','December'].map(m => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t.admin.year}</Label>
            <Input type="number" value={formData.year} onChange={e => setFormData({...formData, year: Number(e.target.value)})} required data-testid="input-drop-year" />
          </div>

          <div className="space-y-2 col-span-2">
            <Label>{t.admin.imageUrl}</Label>
            <Input value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} required data-testid="input-drop-image" />
          </div>
          
          <div className="space-y-2">
            <Label>{t.admin.supply}</Label>
            <Input type="number" value={formData.supply} onChange={e => setFormData({...formData, supply: Number(e.target.value)})} required data-testid="input-drop-supply" />
          </div>

          <div className="space-y-2 col-span-2">
            <Label className="mb-2 block">{t.admin.chains}</Label>
            <div className="flex gap-4 flex-wrap">
              {['evm', 'solana', 'stellar'].map(chain => (
                <div key={chain} className="flex items-center space-x-2">
                  <Checkbox 
                    id={chain} 
                    checked={formData.enabledChains.includes(chain)}
                    onCheckedChange={() => toggleChain(chain)}
                  />
                  <label htmlFor={chain} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 uppercase">
                    {chain}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <Button type="submit" className="col-span-2 mt-4" disabled={isPending} data-testid="button-submit-drop">
            {isPending ? <Loader2 className="animate-spin" /> : t.admin.createDrop}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
