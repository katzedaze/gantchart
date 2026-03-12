"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProject, useUpdateProject, useDeleteProject, useArchiveProject } from "@/hooks/useProjects";
import { useIssues } from "@/hooks/useIssues";
import { useProjectMembers } from "@/hooks/useMembers";
import { useMilestones } from "@/hooks/useMilestones";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IssueTable } from "@/components/issues/IssueTable";
import { KanbanBoard } from "@/components/issues/KanbanBoard";
import { MemberList } from "@/components/members/MemberList";
import { useUsers } from "@/hooks/useUsers";

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const router = useRouter();
  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const [showArchivedIssues, setShowArchivedIssues] = useState(false);
  const { data: issues, isLoading: issuesLoading } = useIssues(projectId, undefined, showArchivedIssues);
  const { data: users } = useUsers();
  const { data: members } = useProjectMembers(projectId);
  const { data: milestones } = useMilestones(projectId);
  const updateProject = useUpdateProject(projectId);
  const deleteProject = useDeleteProject();
  const archiveProject = useArchiveProject();

  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  function openEditDialog() {
    if (project) {
      setEditName(project.name);
      setEditDescription(project.description || "");
    }
    setEditOpen(true);
  }

  async function handleEditSave() {
    const data: Record<string, string | null> = {};
    if (editName !== project?.name) data.name = editName;
    if (editDescription !== (project?.description || ""))
      data.description = editDescription || null;
    if (Object.keys(data).length > 0) {
      await updateProject.mutateAsync(data as never);
    }
    setEditOpen(false);
  }

  async function handleArchive() {
    if (!confirm("このプロジェクトと紐づく全ての課題をアーカイブしますか？")) return;
    await archiveProject.mutateAsync(projectId);
    router.push("/projects");
  }

  async function handleDelete() {
    if (!confirm("このプロジェクトを完全に削除しますか？この操作は取り消せません。")) return;
    await deleteProject.mutateAsync(projectId);
    router.push("/projects");
  }

  if (projectLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!project) {
    return <p className="text-muted-foreground">プロジェクトが見つかりません</p>;
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="font-mono">
              {project.key}
            </Badge>
            <h1 className="text-2xl font-bold">{project.name}</h1>
            {project.is_archived && (
              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                アーカイブ済み
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={openEditDialog}>
              編集
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleArchive}
              disabled={archiveProject.isPending}
            >
              アーカイブ
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
            >
              削除
            </Button>
          </div>
        </div>
        {project.description && (
          <p className="mt-2 text-muted-foreground">{project.description}</p>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>プロジェクトを編集</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">プロジェクト名</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="プロジェクト名"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">説明</label>
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="プロジェクトの説明"
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditOpen(false)}>
                キャンセル
              </Button>
              <Button
                onClick={handleEditSave}
                disabled={updateProject.isPending || !editName.trim()}
              >
                {updateProject.isPending ? "保存中..." : "保存"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="issues">
        <TabsList>
          <TabsTrigger value="issues">課題一覧</TabsTrigger>
          <TabsTrigger value="kanban">カンバン</TabsTrigger>
          <TabsTrigger value="gantt" asChild>
            <Link href={`/projects/${projectId}/gantt`}>ガントチャート</Link>
          </TabsTrigger>
          <TabsTrigger value="milestones" asChild>
            <Link href={`/projects/${projectId}/milestones`}>マイルストーン</Link>
          </TabsTrigger>
          <TabsTrigger value="members">メンバー</TabsTrigger>
        </TabsList>
        <TabsContent value="issues" className="mt-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <p className="text-sm text-muted-foreground">
                {issues?.length ?? 0} 件の課題
              </p>
              <Button
                variant={showArchivedIssues ? "secondary" : "outline"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setShowArchivedIssues(!showArchivedIssues)}
              >
                {showArchivedIssues ? "アーカイブ済みを含む" : "アーカイブ済みを表示"}
              </Button>
            </div>
            <Link href={`/projects/${projectId}/issues/new`}>
              <Button>課題を追加</Button>
            </Link>
          </div>
          {issuesLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <IssueTable
              issues={issues || []}
              projectId={projectId}
              members={members || []}
              milestones={milestones || []}
              showArchived={showArchivedIssues}
            />
          )}
        </TabsContent>
        <TabsContent value="kanban" className="mt-4">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              ドラッグ＆ドロップでステータスを変更できます
            </p>
            <Link href={`/projects/${projectId}/issues/new`}>
              <Button>課題を追加</Button>
            </Link>
          </div>
          {issuesLoading ? (
            <Skeleton className="h-96 w-full" />
          ) : (
            <KanbanBoard
              issues={issues || []}
              projectId={projectId}
              members={members || []}
            />
          )}
        </TabsContent>
        <TabsContent value="members" className="mt-4">
          <MemberList
            project={project}
            users={users || []}
            projectId={projectId}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
