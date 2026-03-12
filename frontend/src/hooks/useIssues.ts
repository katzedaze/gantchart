import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Issue } from "@/types";
import type { IssueCreateInput } from "@/lib/validators";

interface IssueFilters {
  status?: string;
  priority?: string;
  assignee_id?: string;
  milestone_id?: string;
}

export function useIssues(projectId: string, filters?: IssueFilters, includeArchived: boolean = false) {
  const params = new URLSearchParams();
  params.set("include_archived", includeArchived ? "true" : "false");
  if (filters?.status) params.set("status", filters.status);
  if (filters?.priority) params.set("priority", filters.priority);
  if (filters?.assignee_id) params.set("assignee_id", filters.assignee_id);
  if (filters?.milestone_id) params.set("milestone_id", filters.milestone_id);

  const queryString = params.toString();
  const endpoint = `/projects/${projectId}/issues${queryString ? `?${queryString}` : ""}`;

  return useQuery<Issue[]>({
    queryKey: ["projects", projectId, "issues", filters, { includeArchived }],
    queryFn: () => apiClient.get<Issue[]>(endpoint),
    enabled: !!projectId,
  });
}

export function useIssue(issueId: string) {
  return useQuery<Issue>({
    queryKey: ["issues", issueId],
    queryFn: () => apiClient.get<Issue>(`/issues/${issueId}`),
    enabled: !!issueId,
  });
}

export function useCreateIssue(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: IssueCreateInput) =>
      apiClient.post<Issue>(`/projects/${projectId}/issues`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projects", projectId, "issues"],
      });
      queryClient.invalidateQueries({
        queryKey: ["projects", projectId, "gantt"],
      });
    },
  });
}

export function useUpdateIssue(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ issueId, data }: { issueId: string; data: Partial<Issue> }) =>
      apiClient.patch<Issue>(`/issues/${issueId}`, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["issues", variables.issueId],
      });
      queryClient.invalidateQueries({
        queryKey: ["projects", projectId, "issues"],
      });
      queryClient.invalidateQueries({
        queryKey: ["projects", projectId, "gantt"],
      });
    },
  });
}

export function useDeleteIssue(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (issueId: string) => apiClient.delete(`/issues/${issueId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projects", projectId, "issues"],
      });
      queryClient.invalidateQueries({
        queryKey: ["projects", projectId, "gantt"],
      });
    },
  });
}

export function useBulkDeleteIssues(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (issueIds: string[]) =>
      apiClient.post<void>(`/projects/${projectId}/issues/bulk-delete`, { ids: issueIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projects", projectId, "issues"],
      });
      queryClient.invalidateQueries({
        queryKey: ["projects", projectId, "gantt"],
      });
    },
  });
}

export function useArchiveIssue(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (issueId: string) =>
      apiClient.post<Issue>(`/issues/${issueId}/archive`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", projectId, "issues"] });
      queryClient.invalidateQueries({ queryKey: ["projects", projectId, "gantt"] });
    },
  });
}

export function useUnarchiveIssue(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (issueId: string) =>
      apiClient.post<Issue>(`/issues/${issueId}/unarchive`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", projectId, "issues"] });
      queryClient.invalidateQueries({ queryKey: ["projects", projectId, "gantt"] });
    },
  });
}

export function useBulkArchiveIssues(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (issueIds: string[]) =>
      apiClient.post<void>(`/projects/${projectId}/issues/bulk-archive`, { ids: issueIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", projectId, "issues"] });
      queryClient.invalidateQueries({ queryKey: ["projects", projectId, "gantt"] });
    },
  });
}

export function useBulkUpdateIssues(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      updates: Array<{
        id: string;
        start_date?: string;
        due_date?: string;
        sort_order?: number;
      }>
    ) => apiClient.patch<Issue[]>(`/projects/${projectId}/issues/bulk`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projects", projectId, "issues"],
      });
      queryClient.invalidateQueries({
        queryKey: ["projects", projectId, "gantt"],
      });
    },
  });
}
