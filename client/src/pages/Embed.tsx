import { useRoute } from "wouter";
import { useActiveDrop } from "@/hooks/use-drops";
import { Button } from "@/components/ui/button";
import { Loader2, Layers } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

export default function Embed() {
  const [, params] = useRoute("/embed/:locationId");
  const locationId = Number(params?.locationId);
  const { data: drop, isLoading } = useActiveDrop(locationId);
  const { t } = useI18n();

  if (isLoading) return <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>;
  if (!drop) return <div className="text-center p-4 text-sm text-muted-foreground">{t.claim.noActiveDrop}</div>;

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-card border rounded-xl shadow-sm max-w-xs mx-auto font-sans">
      <img src={drop.imageUrl} className="w-full aspect-square object-cover rounded-md mb-3" alt="Drop" />
      <div className="flex items-center gap-1.5 mb-1">
        <Layers className="w-3 h-3 text-primary" />
        <span className="text-[10px] font-medium text-primary">Mintoria</span>
      </div>
      <h3 className="font-bold text-sm mb-1">{drop.title}</h3>
      <p className="text-xs text-muted-foreground mb-3">{drop.month} {drop.year}</p>
      <Button size="sm" className="w-full" onClick={() => window.open(`/claim/${locationId}`, '_blank')} data-testid="button-embed-claim">
        {t.claim.claimNow}
      </Button>
    </div>
  );
}
