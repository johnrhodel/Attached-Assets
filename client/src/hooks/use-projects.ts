import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertProject, InsertLocation } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// === PROJECTS ===
export function useProjects() {
  return useQuery({
    queryKey: [api.projects.list.path],
    queryFn: async () => {
      const res = await fetch(api.projects.list.path);
      if (!res.ok) throw new Error("Failed to fetch projects");
      return api.projects.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: InsertProject) => {
      const res = await fetch(api.projects.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create project");
      return api.projects.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.projects.list.path] });
      toast({ title: "Project created", description: "Your new project is ready." });
    },
  });
}

// === LOCATIONS ===
export function useLocations(projectId: number) {
  return useQuery({
    queryKey: [api.locations.list.path, projectId],
    queryFn: async () => {
      const url = buildUrl(api.locations.list.path, { projectId });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch locations");
      return api.locations.list.responses[200].parse(await res.json());
    },
    enabled: !!projectId,
  });
}

export function useCreateLocation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ projectId, ...data }: InsertLocation & { projectId: number }) => {
      const url = buildUrl(api.locations.create.path, { projectId });
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create location");
      return api.locations.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.locations.list.path, variables.projectId] });
      toast({ title: "Location added", description: "New location created successfully." });
    },
  });
}
