import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { ProjectMemberWithUser } from "@/types";

export function useProjectMembers(projectId: string) {
  return useQuery<ProjectMemberWithUser[]>({
    queryKey: ["projects", projectId, "members"],
    queryFn: () =>
      apiClient.get<ProjectMemberWithUser[]>(
        `/projects/${projectId}/members`
      ),
    enabled: !!projectId,
  });
}

export function useAddMember(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { user_id: string; role: string }) =>
      apiClient.post(`/projects/${projectId}/members`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["projects", projectId, "members"] });
    },
  });
}

export function useRemoveMember(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      apiClient.delete(`/projects/${projectId}/members/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["projects", projectId, "members"] });
    },
  });
}

function invalidateProjectMembers(queryClient: ReturnType<typeof useQueryClient>, projectId: string) {
  queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
  queryClient.invalidateQueries({ queryKey: ["projects"] });
  queryClient.invalidateQueries({ queryKey: ["projects", projectId, "members"] });
}

export function useArchiveMember(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      apiClient.post(`/projects/${projectId}/members/${userId}/archive`, {}),
    onSuccess: () => invalidateProjectMembers(queryClient, projectId),
  });
}

export function useUnarchiveMember(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      apiClient.post(`/projects/${projectId}/members/${userId}/unarchive`, {}),
    onSuccess: () => invalidateProjectMembers(queryClient, projectId),
  });
}

export function useBulkDeleteMembers(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userIds: string[]) =>
      apiClient.post<void>(`/projects/${projectId}/members/bulk-delete`, { ids: userIds }),
    onSuccess: () => invalidateProjectMembers(queryClient, projectId),
  });
}

export function useBulkArchiveMembers(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userIds: string[]) =>
      apiClient.post<void>(`/projects/${projectId}/members/bulk-archive`, { ids: userIds }),
    onSuccess: () => invalidateProjectMembers(queryClient, projectId),
  });
}
