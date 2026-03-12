import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { GanttData } from "@/types";

export function useGantt(projectId: string) {
  return useQuery<GanttData>({
    queryKey: ["projects", projectId, "gantt"],
    queryFn: () =>
      apiClient.get<GanttData>(`/projects/${projectId}/gantt`),
    enabled: !!projectId,
  });
}
