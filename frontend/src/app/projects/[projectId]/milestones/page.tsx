"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  useMilestones,
  useCreateMilestone,
  useDeleteMilestone,
} from "@/hooks/useMilestones";
import { useProject } from "@/hooks/useProjects";
import { milestoneCreateSchema } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatDate } from "@/lib/gantt-utils";

const statusLabels: Record<string, string> = {
  open: "進行中",
  closed: "完了",
};

export default function MilestonesPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const { data: project } = useProject(projectId);
  const { data: milestones, isLoading } = useMilestones(projectId);
  const createMilestone = useCreateMilestone(projectId);
  const deleteMilestone = useDeleteMilestone(projectId);
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      due_date: formData.get("due_date") as string,
      description: (formData.get("description") as string) || undefined,
    };

    const result = milestoneCreateSchema.safeParse(data);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        fieldErrors[issue.path[0] as string] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    await createMilestone.mutateAsync(result.data);
    setOpen(false);
    setErrors({});
  }

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

      <Tabs value="milestones">
        <TabsList>
          <TabsTrigger value="issues" asChild>
            <Link href={`/projects/${projectId}`}>課題一覧</Link>
          </TabsTrigger>
          <TabsTrigger value="kanban" asChild>
            <Link href={`/projects/${projectId}`}>カンバン</Link>
          </TabsTrigger>
          <TabsTrigger value="gantt" asChild>
            <Link href={`/projects/${projectId}/gantt`}>ガントチャート</Link>
          </TabsTrigger>
          <TabsTrigger value="milestones">マイルストーン</TabsTrigger>
          <TabsTrigger value="members" asChild>
            <Link href={`/projects/${projectId}`}>メンバー</Link>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mt-4">
        <div className="mb-6 flex items-center justify-end">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>マイルストーンを追加</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>新規マイルストーン</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">名前</label>
                  <Input name="name" placeholder="v1.0" />
                  {errors.name && (
                    <p className="mt-1 text-sm text-destructive">{errors.name}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">期日</label>
                  <Input name="due_date" type="date" />
                  {errors.due_date && (
                    <p className="mt-1 text-sm text-destructive">
                      {errors.due_date}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">説明</label>
                  <Input name="description" placeholder="任意" />
                </div>
                <Button type="submit" disabled={createMilestone.isPending}>
                  {createMilestone.isPending ? "作成中..." : "作成"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : milestones?.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-16">
            <p className="text-muted-foreground">マイルストーンがまだありません</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {milestones?.map((milestone) => (
              <Card key={milestone.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{milestone.name}</CardTitle>
                    <Badge
                      variant={
                        milestone.status === "open" ? "default" : "secondary"
                      }
                    >
                      {statusLabels[milestone.status] || milestone.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    期日: {formatDate(milestone.due_date)}
                  </p>
                  {milestone.description && (
                    <p className="mt-1 text-sm">{milestone.description}</p>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-destructive hover:text-destructive"
                    onClick={() => {
                      if (confirm("このマイルストーンを削除しますか？")) {
                        deleteMilestone.mutate(milestone.id);
                      }
                    }}
                  >
                    削除
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
