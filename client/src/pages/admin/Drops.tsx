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
import { Switch } from "@/components/ui/switch";
import { Loader2, Calendar, Image as ImageIcon, Zap } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export default function Drops() {
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
          <h2 className="text-3xl font-serif font-bold text-foreground">Drops Manager</h2>
          <p className="text-muted-foreground mt-2">Create and manage NFT drops for specific locations.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 bg-card p-6 rounded-xl shadow-sm border">
          <div className="w-full sm:w-[250px] space-y-2">
            <Label>Select Project</Label>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger>
                <SelectValue placeholder="Choose project..." />
              </SelectTrigger>
              <SelectContent>
                {projects?.map(p => (
                  <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-[250px] space-y-2">
            <Label>Select Location</Label>
            <Select value={selectedLocation} onValueChange={setSelectedLocation} disabled={!selectedProject}>
              <SelectTrigger>
                <SelectValue placeholder="Choose location..." />
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
                No drops found for this location. Create one!
              </div>
            ) : (
              drops?.map((drop) => (
                <Card key={drop.id} className="overflow-hidden group hover:shadow-lg transition-all duration-300 border-border/60">
                  <div className="aspect-video bg-accent relative overflow-hidden">
                    {/* Placeholder for image - using unsplash for demo */}
                    {/* scenery landscape nature */}
                    <img 
                      src={drop.imageUrl || "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop"} 
                      alt={drop.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-2 right-2">
                      <Badge variant={drop.status === 'published' ? 'default' : 'secondary'} className="shadow-md">
                        {drop.status}
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
                      <span className="text-muted-foreground">Supply:</span>
                      <span className="font-mono font-medium">{drop.mintedCount} / {drop.supply}</span>
                    </div>
                    {drop.status === 'draft' && (
                      <Button 
                        className="w-full" 
                        onClick={() => publishDrop({ id: drop.id, locationId: Number(selectedLocation) })}
                      >
                        Publish Drop
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function CreateDropDialog({ locationId, disabled }: { locationId: number, disabled: boolean }) {
  const [open, setOpen] = useState(false);
  const { mutate, isPending } = useCreateDrop();
  const [formData, setFormData] = useState({
    title: "",
    month: "February",
    year: 2024,
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
        <Button disabled={disabled} className="gap-2"><Zap className="w-4 h-4" /> New Drop</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Drop</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <div className="space-y-2 col-span-2">
            <Label>Title</Label>
            <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
          </div>
          
          <div className="space-y-2">
            <Label>Month</Label>
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
            <Label>Year</Label>
            <Input type="number" value={formData.year} onChange={e => setFormData({...formData, year: Number(e.target.value)})} required />
          </div>

          <div className="space-y-2 col-span-2">
            <Label>Image URL (Demo)</Label>
            <Input value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} required />
          </div>
          
          <div className="space-y-2">
            <Label>Total Supply</Label>
            <Input type="number" value={formData.supply} onChange={e => setFormData({...formData, supply: Number(e.target.value)})} required />
          </div>

          <div className="space-y-2 col-span-2">
            <Label className="mb-2 block">Enabled Chains</Label>
            <div className="flex gap-4">
              {['evm', 'solana', 'stellar'].map(chain => (
                <div key={chain} className="flex items-center space-x-2">
                  <Checkbox 
                    id={chain} 
                    checked={formData.enabledChains.includes(chain)}
                    onCheckedChange={() => toggleChain(chain)}
                  />
                  <label htmlFor={chain} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize">
                    {chain}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <Button type="submit" className="col-span-2 mt-4" disabled={isPending}>
            {isPending ? "Creating..." : "Create Drop"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
