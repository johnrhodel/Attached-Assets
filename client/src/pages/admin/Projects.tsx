import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { useProjects, useCreateProject, useCreateLocation, useLocations } from "@/hooks/use-projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Plus, MapPin, Folder, Loader2 } from "lucide-react";

export default function Projects() {
  const { data: projects, isLoading } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-serif font-bold text-foreground">Projects</h2>
            <p className="text-muted-foreground mt-2">Manage your organizations and locations.</p>
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
        <Button className="gap-2"><Plus className="w-4 h-4" /> New Project</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Project Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Slug</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Creating..." : "Create Project"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ProjectCard({ project, onSelect, isSelected }: { project: any, onSelect: () => void, isSelected: boolean }) {
  return (
    <Card className={`transition-all duration-300 ${isSelected ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold">{project.name}</CardTitle>
        <Folder className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground mb-4">/{project.slug}</div>
        <Button variant={isSelected ? "secondary" : "outline"} className="w-full" onClick={onSelect}>
          {isSelected ? "Hide Locations" : "View Locations"}
        </Button>
        
        {isSelected && <LocationsList projectId={project.id} />}
      </CardContent>
    </Card>
  );
}

function LocationsList({ projectId }: { projectId: number }) {
  const { data: locations, isLoading } = useLocations(projectId);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const { mutate, isPending } = useCreateLocation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate({ projectId, name, slug }, { onSuccess: () => { setOpen(false); setName(""); setSlug(""); } });
  };

  if (isLoading) return <div className="py-4 text-center text-sm">Loading locations...</div>;

  return (
    <div className="mt-6 space-y-4 border-t pt-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Locations</h4>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0"><Plus className="w-4 h-4" /></Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Location</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
              <div className="space-y-2"><Label>Slug</Label><Input value={slug} onChange={(e) => setSlug(e.target.value)} required /></div>
              <Button type="submit" className="w-full" disabled={isPending}>{isPending ? "Adding..." : "Add Location"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="space-y-2">
        {locations?.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No locations yet.</p>
        ) : (
          locations?.map(loc => (
            <div key={loc.id} className="flex items-center gap-2 text-sm p-2 bg-accent/50 rounded-lg">
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
