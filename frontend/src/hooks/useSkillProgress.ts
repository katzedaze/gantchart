import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface SkillProgressItem {
  id: string;
  roadmap_slug: string;
  node_id: string;
  level: string;
  updated_at: string;
}

interface BulkUpsertPayload {
  roadmap_slug: string;
  items: { node_id: string; level: string }[];
}

export function useSkillProgress(roadmapSlug?: string) {
  return useQuery<SkillProgressItem[]>({
    queryKey: ["skill-progress", roadmapSlug],
    queryFn: () => {
      const params = roadmapSlug ? `?roadmap_slug=${roadmapSlug}` : "";
      return apiClient.get<SkillProgressItem[]>(
        `/skill-progress/${params}`
      );
    },
  });
}

export function useUpsertSkillProgress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BulkUpsertPayload) =>
      apiClient.put<SkillProgressItem[]>(`/skill-progress/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["skill-progress"],
      });
    },
  });
}

export function useDeleteSkillProgress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (roadmapSlug?: string) => {
      const params = roadmapSlug ? `?roadmap_slug=${roadmapSlug}` : "";
      return apiClient.delete(`/skill-progress/${params}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["skill-progress"],
      });
    },
  });
}
