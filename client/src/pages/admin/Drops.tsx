import { useState, useRef } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { useProjects, useLocations } from "@/hooks/use-projects";
import { useDrops, useCreateDrop, usePublishDrop, useUpdateDrop, useDeleteDrop } from "@/hooks/use-drops";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, Zap, QrCode, Copy, Download, Pencil, Trash2, Upload, Image, Link2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { useI18n } from "@/lib/i18n/context";
import { apiRequest } from "@/lib/queryClient";

function ImageUploadField({
  value,
  onChange,
  testIdPrefix,
}: {
  value: string;
  onChange: (url: string) => void;
  testIdPrefix: string;
}) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [mode, setMode] = useState<"upload" | "url">(value && !value.startsWith("/uploads/") ? "url" : "upload");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: t.common.error, description: "Invalid file type", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: t.common.error, description: "File too large (max 5MB)", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const res = await apiRequest("POST", "/api/upload/image", {
            data: reader.result as string,
            filename: file.name,
          });
          const result = await res.json();
          onChange(result.url);
        } catch (err: any) {
          toast({ title: t.common.error, variant: "destructive" });
        } finally {
          setUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setUploading(false);
      toast({ title: t.common.error, variant: "destructive" });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2 col-span-2">
      <div className="flex items-center justify-between">
        <Label>{t.admin.imageUrl}</Label>
        <button
          type="button"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setMode(mode === "upload" ? "url" : "upload")}
          data-testid={`${testIdPrefix}-toggle-mode`}
        >
          {mode === "upload" ? (
            <>
              <Link2 className="w-3 h-3" />
              {t.admin.orPasteUrl}
            </>
          ) : (
            <>
              <Upload className="w-3 h-3" />
              {t.admin.uploadImage}
            </>
          )}
        </button>
      </div>

      {mode === "url" ? (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
          required
          data-testid={`${testIdPrefix}-url-input`}
        />
      ) : (
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            onChange={handleFileSelect}
            data-testid={`${testIdPrefix}-file-input`}
          />
          {value ? (
            <div className="relative group/upload">
              <div className="aspect-video rounded-md overflow-hidden border bg-accent">
                <img
                  src={value}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  data-testid={`${testIdPrefix}-preview`}
                />
              </div>
              <div
                className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/upload:opacity-100 transition-opacity rounded-md cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                data-testid={`${testIdPrefix}-change-image`}
              >
                <div className="flex items-center gap-2 text-white text-sm font-medium">
                  <Upload className="w-4 h-4" />
                  {t.admin.uploadImage}
                </div>
              </div>
            </div>
          ) : (
            <div
              className="aspect-video rounded-md border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-muted-foreground/50 transition-colors bg-accent/30"
              onClick={() => fileInputRef.current?.click()}
              data-testid={`${testIdPrefix}-upload-area`}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                  <span className="text-sm text-muted-foreground">{t.admin.uploading}</span>
                </>
              ) : (
                <>
                  <Image className="w-8 h-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{t.admin.dragOrClick}</span>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

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

function EditDropDialog({ drop, locationId }: { drop: any; locationId: number }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const { mutate, isPending } = useUpdateDrop();
  const [formData, setFormData] = useState({
    title: drop.title,
    month: drop.month,
    year: drop.year,
    imageUrl: drop.imageUrl,
    supply: drop.supply,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate({ id: drop.id, locationId, ...formData }, { onSuccess: () => setOpen(false) });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) { setFormData({ title: drop.title, month: drop.month, year: drop.year, imageUrl: drop.imageUrl, supply: drop.supply }); } }}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" data-testid={`button-edit-drop-${drop.id}`}>
          <Pencil className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t.admin.editDrop}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <div className="space-y-2 col-span-2">
            <Label>{t.admin.dropTitle}</Label>
            <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required data-testid={`input-edit-drop-title-${drop.id}`} />
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
            <Input type="number" value={formData.year} onChange={e => setFormData({...formData, year: Number(e.target.value)})} required data-testid={`input-edit-drop-year-${drop.id}`} />
          </div>
          <ImageUploadField
            value={formData.imageUrl}
            onChange={(url) => setFormData({...formData, imageUrl: url})}
            testIdPrefix={`edit-drop-image-${drop.id}`}
          />
          <div className="space-y-2">
            <Label>{t.admin.supply}</Label>
            <Input type="number" value={formData.supply} onChange={e => setFormData({...formData, supply: Number(e.target.value)})} required data-testid={`input-edit-drop-supply-${drop.id}`} />
          </div>
          <Button type="submit" className="col-span-2 mt-4" disabled={isPending} data-testid={`button-save-drop-${drop.id}`}>
            {isPending ? <Loader2 className="animate-spin" /> : t.admin.save}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteDropDialog({ drop, locationId }: { drop: any; locationId: number }) {
  const { t } = useI18n();
  const { mutate, isPending } = useDeleteDrop();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="icon" variant="ghost" data-testid={`button-delete-drop-${drop.id}`}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t.admin.deleteConfirm}</AlertDialogTitle>
          <AlertDialogDescription>{t.admin.deleteWarning}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid={`button-cancel-delete-drop-${drop.id}`}>{t.admin.cancel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => mutate({ id: drop.id, locationId })}
            disabled={isPending}
            data-testid={`button-confirm-delete-drop-${drop.id}`}
          >
            {isPending ? <Loader2 className="animate-spin" /> : t.admin.delete}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
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
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-lg">{drop.title}</CardTitle>
        <div className="flex items-center gap-1">
          <EditDropDialog drop={drop} locationId={locationId} />
          <DeleteDropDialog drop={drop} locationId={locationId} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground flex items-center gap-2 mb-4">
          <Calendar className="w-3 h-3" /> {drop.month} {drop.year}
        </div>
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
    imageUrl: "",
    metadataUrl: "https://example.com/metadata.json",
    supply: 1000,
    status: "draft",
    enabledChains: ["stellar"],
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

          <ImageUploadField
            value={formData.imageUrl}
            onChange={(url) => setFormData({...formData, imageUrl: url})}
            testIdPrefix="create-drop-image"
          />
          
          <div className="space-y-2">
            <Label>{t.admin.supply}</Label>
            <Input type="number" value={formData.supply} onChange={e => setFormData({...formData, supply: Number(e.target.value)})} required data-testid="input-drop-supply" />
          </div>

          <div className="space-y-2 col-span-2">
            <Label className="mb-2 block">{t.admin.chains}</Label>
            <div className="flex gap-4 flex-wrap">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="stellar" 
                  checked={true}
                  disabled
                />
                <label htmlFor="stellar" className="text-sm font-medium leading-none uppercase">
                  Stellar
                </label>
              </div>
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
