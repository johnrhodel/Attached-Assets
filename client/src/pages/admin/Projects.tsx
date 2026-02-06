import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { useProjects, useCreateProject, useCreateLocation, useLocations } from "@/hooks/use-projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, MapPin, Folder, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

export default function Projects() {
  const { data: projects, isLoading } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const { t } = useI18n();

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-serif font-bold text-foreground">{t.nav.projects}</h2>
            <p className="text-muted-foreground mt-2">{t.admin.welcome}</p>
          </div>
          <CreateProjectDialog />
        </div>

        {isLoading ? (
          <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {projects?.map((project) => (
              <ProjectCard 
                key={project.id} 
                project={project} 
                onSelect={() => setSelectedProjectId(selectedProjectId === project.id ? null : project.id)}
                isSelected={selectedProjectId === project.id}
              />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function CreateProjectDialog() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const { mutate, isPending } = useCreateProject();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate({ name, slug }, { onSuccess: () => setOpen(false) });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2" data-testid="button-new-project"><Plus className="w-4 h-4" /> {t.admin.createProject}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.admin.createProject}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t.admin.projectName}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required data-testid="input-project-name" />
          </div>
          <div className="space-y-2">
            <Label>Slug</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} required data-testid="input-project-slug" />
          </div>
          <Button type="submit" className="w-full" disabled={isPending} data-testid="button-submit-project">
            {isPending ? <Loader2 className="animate-spin" /> : t.admin.createProject}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ProjectCard({ project, onSelect, isSelected }: { project: any, onSelect: () => void, isSelected: boolean }) {
  const { t } = useI18n();
  return (
    <Card className={`transition-all duration-300 ${isSelected ? 'ring-2 ring-primary' : ''}`} data-testid={`card-project-${project.id}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-xl font-bold">{project.name}</CardTitle>
        <Folder className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground mb-4">/{project.slug}</div>
        <Button variant={isSelected ? "secondary" : "outline"} className="w-full" onClick={onSelect} data-testid={`button-toggle-locations-${project.id}`}>
          {isSelected ? t.common.close : t.nav.locations}
        </Button>
        
        {isSelected && <LocationsList projectId={project.id} />}
      </CardContent>
    </Card>
  );
}

function LocationsList({ projectId }: { projectId: number }) {
  const { t } = useI18n();
  const { data: locations, isLoading } = useLocations(projectId);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const { mutate, isPending } = useCreateLocation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate({ projectId, name, slug }, { onSuccess: () => { setOpen(false); setName(""); setSlug(""); } });
  };

  if (isLoading) return <div className="py-4 text-center text-sm">{t.common.loading}</div>;

  return (
    <div className="mt-6 space-y-4 border-t pt-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">{t.nav.locations}</h4>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="icon" variant="ghost" data-testid="button-add-location"><Plus className="w-4 h-4" /></Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t.admin.createLocation}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2"><Label>{t.admin.locationName}</Label><Input value={name} onChange={(e) => setName(e.target.value)} required data-testid="input-location-name" /></div>
              <div className="space-y-2"><Label>Slug</Label><Input value={slug} onChange={(e) => setSlug(e.target.value)} required data-testid="input-location-slug" /></div>
              <Button type="submit" className="w-full" disabled={isPending} data-testid="button-submit-location">{isPending ? <Loader2 className="animate-spin" /> : t.admin.createLocation}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="space-y-2">
        {locations?.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">{t.claim.noActiveDrop}</p>
        ) : (
          locations?.map(loc => (
            <div key={loc.id} className="flex items-center gap-2 text-sm p-2 bg-accent/50 rounded-md" data-testid={`location-item-${loc.id}`}>
              <MapPin className="w-3 h-3 text-primary" />
              <span className="font-medium">{loc.name}</span>
              <span className="text-xs text-muted-foreground ml-auto">/{loc.slug}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
