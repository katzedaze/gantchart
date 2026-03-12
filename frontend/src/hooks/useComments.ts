import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Comment, Attachment } from "@/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function useComments(issueId: string) {
  return useQuery<Comment[]>({
    queryKey: ["issues", issueId, "comments"],
    queryFn: () => apiClient.get<Comment[]>(`/issues/${issueId}/comments`),
    enabled: !!issueId,
  });
}

export function useCreateComment(issueId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { body: string; author_id: string }) =>
      apiClient.post<Comment>(`/issues/${issueId}/comments`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["issues", issueId, "comments"],
      });
    },
  });
}

export function useUpdateComment(issueId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ commentId, body }: { commentId: string; body: string }) =>
      apiClient.patch<Comment>(`/comments/${commentId}`, { body }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["issues", issueId, "comments"],
      });
    },
  });
}

export function useDeleteComment(issueId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) =>
      apiClient.delete(`/comments/${commentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["issues", issueId, "comments"],
      });
    },
  });
}

export function useAttachments(issueId: string) {
  return useQuery<Attachment[]>({
    queryKey: ["issues", issueId, "attachments"],
    queryFn: () =>
      apiClient.get<Attachment[]>(`/issues/${issueId}/attachments`),
    enabled: !!issueId,
  });
}

export function useUploadAttachment(issueId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(
        `${API_BASE_URL}/issues/${issueId}/attachments`,
        { method: "POST", body: formData }
      );
      if (!response.ok) {
        throw new Error("Upload failed");
      }
      return response.json() as Promise<Attachment>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["issues", issueId, "attachments"],
      });
    },
  });
}
