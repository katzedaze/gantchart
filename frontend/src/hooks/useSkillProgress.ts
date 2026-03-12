import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface SkillProgressItem {
  id: string;
  user_id: string;
  roadmap_slug: string;
  node_id: string;
  level: string;
  updated_at: string;
}

interface BulkUpsertPayload {
  roadmap_slug: string;
  items: { node_id: string; level: string }[];
}

const USER_ID_KEY = "skill-checker-user-id";

export function getStoredUserId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(USER_ID_KEY);
}

export function setStoredUserId(userId: string) {
  localStorage.setItem(USER_ID_KEY, userId);
}

export function useSkillProgress(userId: string | null, roadmapSlug?: string) {
  return useQuery<SkillProgressItem[]>({
    queryKey: ["skill-progress", userId, roadmapSlug],
    queryFn: () => {
      const params = roadmapSlug ? `?roadmap_slug=${roadmapSlug}` : "";
      return apiClient.get<SkillProgressItem[]>(
        `/users/${userId}/skill-progress${params}`
      );
    },
    enabled: !!userId,
  });
}

export function useUpsertSkillProgress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      data,
    }: {
      userId: string;
      data: BulkUpsertPayload;
    }) => apiClient.put<SkillProgressItem[]>(`/users/${userId}/skill-progress`, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["skill-progress", variables.userId],
      });
    },
  });
}

export function useDeleteSkillProgress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      roadmapSlug,
    }: {
      userId: string;
      roadmapSlug?: string;
    }) => {
      const params = roadmapSlug ? `?roadmap_slug=${roadmapSlug}` : "";
      return apiClient.delete(`/users/${userId}/skill-progress${params}`);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["skill-progress", variables.userId],
      });
    },
  });
}
