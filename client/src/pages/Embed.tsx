import { useState } from "react";
import { useRoute } from "wouter";
import { useActiveDrop } from "@/hooks/use-drops";
import { useCreateClaimSession } from "@/hooks/use-claim";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// Simplified version for iframes
export default function Embed() {
  const [, params] = useRoute("/embed/:locationId");
  const locationId = Number(params?.locationId);
  const { data: drop, isLoading } = useActiveDrop(locationId);

  if (isLoading) return <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>;
  if (!drop) return <div className="text-center p-4 text-sm text-muted-foreground">Unavailable</div>;

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-white border rounded-xl shadow-sm max-w-xs mx-auto font-sans">
      <img src={drop.imageUrl} className="w-full aspect-square object-cover rounded-lg mb-3" alt="Drop" />
      <h3 className="font-bold text-sm mb-1">{drop.title}</h3>
      <p className="text-xs text-muted-foreground mb-3">{drop.month} {drop.year}</p>
      <Button size="sm" className="w-full" onClick={() => window.open(`/claim/${locationId}`, '_blank')}>
        Claim Memory
      </Button>
    </div>
  );
}
