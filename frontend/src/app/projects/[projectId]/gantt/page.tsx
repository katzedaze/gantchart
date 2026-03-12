"use client";

import { use } from "react";
import Link from "next/link";
import { useGantt } from "@/hooks/useGantt";
import { useProject } from "@/hooks/useProjects";
import { GanttChart } from "@/components/gantt/GanttChart";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function GanttPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const { data: project } = useProject(projectId);
  const { data: ganttData, isLoading } = useGantt(projectId);

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3">
          {project && (
            <>
              <Badge variant="outline" className="font-mono">
                {project.key}
              </Badge>
              <h1 className="text-2xl font-bold">{project.name}</h1>
            </>
          )}
        </div>
        {project?.description && (
          <p className="mt-2 text-muted-foreground">{project.description}</p>
        )}
      </div>

      <Tabs value="gantt">
        <TabsList>
          <TabsTrigger value="issues" asChild>
            <Link href={`/projects/${projectId}`}>課題一覧</Link>
          </TabsTrigger>
          <TabsTrigger value="kanban" asChild>
            <Link href={`/projects/${projectId}`}>カンバン</Link>
          </TabsTrigger>
          <TabsTrigger value="gantt">ガントチャート</TabsTrigger>
          <TabsTrigger value="milestones" asChild>
            <Link href={`/projects/${projectId}/milestones`}>マイルストーン</Link>
          </TabsTrigger>
          <TabsTrigger value="members" asChild>
            <Link href={`/projects/${projectId}`}>メンバー</Link>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mt-4">
        {isLoading ? (
          <Skeleton className="h-96 w-full" />
        ) : ganttData && ganttData.issues.length > 0 ? (
          <GanttChart data={ganttData} projectId={projectId} />
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed py-16">
            <p className="text-muted-foreground">
              表示するデータがありません
            </p>
            <Link href={`/projects/${projectId}/issues/new`}>
              <Button variant="outline">課題を作成してガントチャートに表示</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
