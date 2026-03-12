"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useProjects, useArchiveProject, useUnarchiveProject, useDeleteProject, useBulkDeleteProjects, useBulkArchiveProjects } from "@/hooks/useProjects";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function ProjectsPage() {
  const { data: projects, isLoading } = useProjects();
  const archiveProject = useArchiveProject();
  const unarchiveProject = useUnarchiveProject();
  const deleteProject = useDeleteProject();
  const bulkDeleteProjects = useBulkDeleteProjects();
  const bulkArchiveProjects = useBulkArchiveProjects();
  const [showArchived, setShowArchived] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const activeProjects = projects?.filter((p) => !p.is_archived) || [];
  const archivedProjects = projects?.filter((p) => p.is_archived) || [];
  const displayProjects = showArchived ? archivedProjects : activeProjects;

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === displayProjects.length) return new Set();
      return new Set(displayProjects.map((p) => p.id));
    });
  }, [displayProjects]);

  async function handleArchive(e: React.MouseEvent, projectId: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("このプロジェクトと紐づく全ての課題をアーカイブしますか？")) return;
    await archiveProject.mutateAsync(projectId);
  }

  async function handleUnarchive(e: React.MouseEvent, projectId: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("このプロジェクトと紐づく全ての課題のアーカイブを解除しますか？")) return;
    await unarchiveProject.mutateAsync(projectId);
  }

  async function handleDelete(e: React.MouseEvent, projectId: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("このプロジェクトを完全に削除しますか？この操作は取り消せません。")) return;
    await deleteProject.mutateAsync(projectId);
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;
    if (!confirm(`${selectedIds.size} 件のプロジェクトを削除しますか？この操作は取り消せません。`)) return;
    try {
      await bulkDeleteProjects.mutateAsync(Array.from(selectedIds));
      setSelectedIds(new Set());
    } catch (err) {
      console.error("一括削除に失敗しました:", err);
    }
  }

  async function handleBulkArchive() {
    if (selectedIds.size === 0) return;
    if (!confirm(`${selectedIds.size} 件のプロジェクトをアーカイブしますか？`)) return;
    try {
      await bulkArchiveProjects.mutateAsync(Array.from(selectedIds));
      setSelectedIds(new Set());
    } catch (err) {
      console.error("一括アーカイブに失敗しました:", err);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">プロジェクト</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            プロジェクトを選択して管理を開始します
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={showArchived ? "secondary" : "outline"}
            size="sm"
            onClick={() => { setShowArchived(!showArchived); setSelectedIds(new Set()); }}
          >
            {showArchived
              ? `アクティブ (${activeProjects.length})`
              : `アーカイブ済み (${archivedProjects.length})`}
          </Button>
          <Link href="/projects/new">
            <Button>新規プロジェクト</Button>
          </Link>
        </div>
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-md bg-muted/50 px-4 py-2">
          <span className="text-sm font-medium">
            {selectedIds.size} 件選択中
          </span>
          {!showArchived && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkArchive}
              disabled={bulkArchiveProjects.isPending}
            >
              {bulkArchiveProjects.isPending ? "アーカイブ中..." : "一括アーカイブ"}
            </Button>
          )}
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
            disabled={bulkDeleteProjects.isPending}
          >
            {bulkDeleteProjects.isPending ? "削除中..." : "一括削除"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedIds(new Set())}
          >
            選択解除
          </Button>
        </div>
      )}

      {/* Select all checkbox */}
      {displayProjects.length > 0 && (
        <div className="mb-3 flex items-center gap-2">
          <input
            type="checkbox"
            checked={displayProjects.length > 0 && selectedIds.size === displayProjects.length}
            onChange={toggleAll}
            aria-label="全選択"
            className="h-4 w-4 cursor-pointer rounded border-2 border-gray-400 accent-blue-600"
          />
          <span className="text-sm text-muted-foreground">全選択</span>
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : displayProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed py-16">
          <p className="text-muted-foreground">
            {showArchived
              ? "アーカイブ済みのプロジェクトはありません"
              : "プロジェクトがまだありません"}
          </p>
          {!showArchived && (
            <Link href="/projects/new">
              <Button variant="outline">最初のプロジェクトを作成</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {displayProjects.map((project) => (
            <div key={project.id} className="relative">
              <div className="absolute left-3 top-3 z-10">
                <input
                  type="checkbox"
                  checked={selectedIds.has(project.id)}
                  onChange={() => toggleSelect(project.id)}
                  aria-label={`${project.name}を選択`}
                  className="h-4 w-4 cursor-pointer rounded border-2 border-gray-400 accent-blue-600"
                />
              </div>
              <Link href={`/projects/${project.id}`}>
                <Card className={`transition-all hover:shadow-md hover:border-primary/30 ${project.is_archived ? "opacity-70" : ""}`}>
                  <CardHeader className="pl-10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">
                          {project.key}
                        </Badge>
                        <CardTitle className="text-lg">{project.name}</CardTitle>
                      </div>
                      {project.is_archived && (
                        <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs">
                          アーカイブ
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="line-clamp-2">
                      {project.description || "説明なし"}
                    </CardDescription>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-muted-foreground">
                        {project.members.length} メンバー
                      </span>
                      <div className="flex gap-1">
                        {project.is_archived ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={(e) => handleUnarchive(e, project.id)}
                          >
                            復元
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-muted-foreground"
                            onClick={(e) => handleArchive(e, project.id)}
                          >
                            アーカイブ
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                          onClick={(e) => handleDelete(e, project.id)}
                        >
                          削除
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
