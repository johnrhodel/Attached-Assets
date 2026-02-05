import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertDrop } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useDrops(locationId: number) {
  return useQuery({
    queryKey: [api.drops.list.path, locationId],
    queryFn: async () => {
      const url = buildUrl(api.drops.list.path, { locationId });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch drops");
      return api.drops.list.responses[200].parse(await res.json());
    },
    enabled: !!locationId,
  });
}

export function useCreateDrop() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ locationId, ...data }: InsertDrop & { locationId: number }) => {
      const url = buildUrl(api.drops.create.path, { locationId });
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create drop");
      return api.drops.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.drops.list.path, variables.locationId] });
      toast({ title: "Drop created", description: "New drop is ready to be published." });
    },
  });
}

export function usePublishDrop() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, locationId }: { id: number, locationId: number }) => {
      const url = buildUrl(api.drops.publish.path, { id });
      const res = await fetch(url, { method: "POST" });
      if (!res.ok) throw new Error("Failed to publish drop");
      return api.drops.publish.responses[200].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.drops.list.path, variables.locationId] });
      toast({ title: "Drop Published", description: "This drop is now live." });
    },
  });
}

// For public claim page
export function useActiveDrop(locationId: number) {
  return useQuery({
    queryKey: [api.drops.getActive.path, locationId],
    queryFn: async () => {
      const url = buildUrl(api.drops.getActive.path, { locationId });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch active drop");
      return api.drops.getActive.responses[200].parse(await res.json());
    },
    enabled: !!locationId,
    retry: false,
  });
}
