import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Project } from "@/types";
import type { ProjectCreateInput } from "@/lib/validators";

export function useProjects(includeArchived: boolean = true) {
  return useQuery<Project[]>({
    queryKey: ["projects", { includeArchived }],
    queryFn: () =>
      apiClient.get<Project[]>(
        `/projects${includeArchived ? "?include_archived=true" : ""}`
      ),
  });
}

export function useProject(projectId: string) {
  return useQuery<Project>({
    queryKey: ["projects", projectId],
    queryFn: () => apiClient.get<Project>(`/projects/${projectId}`),
    enabled: !!projectId,
  });
}

function invalidateAllProjects(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["projects"] });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ProjectCreateInput) =>
      apiClient.post<Project>("/projects", data),
    onSuccess: () => invalidateAllProjects(queryClient),
  });
}

export function useUpdateProject(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ProjectCreateInput>) =>
      apiClient.patch<Project>(`/projects/${projectId}`, data),
    onSuccess: () => {
      invalidateAllProjects(queryClient);
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) =>
      apiClient.delete(`/projects/${projectId}`),
    onSuccess: () => invalidateAllProjects(queryClient),
  });
}

export function useArchiveProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) =>
      apiClient.post<Project>(`/projects/${projectId}/archive`, {}),
    onSuccess: () => invalidateAllProjects(queryClient),
  });
}

export function useUnarchiveProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) =>
      apiClient.post<Project>(`/projects/${projectId}/unarchive`, {}),
    onSuccess: () => invalidateAllProjects(queryClient),
  });
}

export function useBulkDeleteProjects() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (projectIds: string[]) =>
      apiClient.post<void>("/projects/bulk-delete", { ids: projectIds }),
    onSuccess: () => invalidateAllProjects(queryClient),
  });
}

export function useBulkArchiveProjects() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (projectIds: string[]) =>
      apiClient.post<void>("/projects/bulk-archive", { ids: projectIds }),
    onSuccess: () => invalidateAllProjects(queryClient),
  });
}
