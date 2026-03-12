import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Milestone } from "@/types";
import type { MilestoneCreateInput } from "@/lib/validators";

export function useMilestones(projectId: string) {
  return useQuery<Milestone[]>({
    queryKey: ["projects", projectId, "milestones"],
    queryFn: () =>
      apiClient.get<Milestone[]>(`/projects/${projectId}/milestones`),
    enabled: !!projectId,
  });
}

export function useCreateMilestone(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: MilestoneCreateInput) =>
      apiClient.post<Milestone>(`/projects/${projectId}/milestones`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projects", projectId, "milestones"],
      });
      queryClient.invalidateQueries({
        queryKey: ["projects", projectId, "gantt"],
      });
    },
  });
}

export function useUpdateMilestone(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      milestoneId,
      data,
    }: {
      milestoneId: string;
      data: Partial<MilestoneCreateInput & { status: string }>;
    }) => apiClient.patch<Milestone>(`/milestones/${milestoneId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projects", projectId, "milestones"],
      });
    },
  });
}

export function useDeleteMilestone(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (milestoneId: string) =>
      apiClient.delete(`/milestones/${milestoneId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projects", projectId, "milestones"],
      });
    },
  });
}
