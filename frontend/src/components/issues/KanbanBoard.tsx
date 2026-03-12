"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import type { Issue, ProjectMemberWithUser, Milestone } from "@/types";
import { Badge } from "@/components/ui/badge";
import { useUpdateIssue } from "@/hooks/useIssues";

const COLUMNS: { key: Issue["status"]; label: string; color: string }[] = [
  { key: "open", label: "未着手", color: "border-t-blue-500" },
  { key: "in_progress", label: "進行中", color: "border-t-yellow-500" },
  { key: "resolved", label: "解決済み", color: "border-t-green-500" },
  { key: "closed", label: "完了", color: "border-t-gray-500" },
];

const priorityLabels: Record<string, string> = {
  low: "低",
  medium: "中",
  high: "高",
  critical: "緊急",
};

const priorityColors: Record<string, string> = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};

const typeLabels: Record<string, string> = {
  task: "タスク",
  bug: "バグ",
  story: "ストーリー",
};

interface KanbanBoardProps {
  issues: Issue[];
  projectId: string;
  members?: ProjectMemberWithUser[];
  milestones?: Milestone[];
}

export function KanbanBoard({
  issues,
  projectId,
  members = [],
  milestones = [],
}: KanbanBoardProps) {
  const updateIssue = useUpdateIssue(projectId);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const memberMap = new Map(members.map((m) => [m.user_id, m]));
  const milestoneMap = new Map(milestones.map((m) => [m.id, m]));

  const handleDragStart = useCallback(
    (e: React.DragEvent, issueId: string) => {
      setDraggedId(issueId);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", issueId);
    },
    []
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, columnKey: string) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setDragOverColumn(columnKey);
    },
    []
  );

  const handleDragLeave = useCallback(() => {
    setDragOverColumn(null);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent, targetStatus: string) => {
      e.preventDefault();
      setDragOverColumn(null);
      const issueId = e.dataTransfer.getData("text/plain");
      if (!issueId) return;

      const issue = issues.find((i) => i.id === issueId);
      if (!issue || issue.status === targetStatus) {
        setDraggedId(null);
        return;
      }

      await updateIssue.mutateAsync({
        issueId,
        data: { status: targetStatus } as never,
      });
      setDraggedId(null);
    },
    [issues, updateIssue]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
    setDragOverColumn(null);
  }, []);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {COLUMNS.map((col) => {
        const columnIssues = issues.filter((i) => i.status === col.key);
        const isOver = dragOverColumn === col.key;

        return (
          <div
            key={col.key}
            className={`flex w-72 shrink-0 flex-col rounded-lg border-t-4 bg-muted/30 ${col.color} ${
              isOver ? "ring-2 ring-primary/30" : ""
            }`}
            onDragOver={(e) => handleDragOver(e, col.key)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.key)}
          >
            <div className="flex items-center justify-between px-3 py-2">
              <h3 className="text-sm font-semibold">{col.label}</h3>
              <Badge variant="secondary" className="text-xs">
                {columnIssues.length}
              </Badge>
            </div>
            <div className="flex-1 space-y-2 px-2 pb-2">
              {columnIssues.length === 0 ? (
                <div className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
                  課題をドラッグしてここにドロップ
                </div>
              ) : (
                columnIssues.map((issue) => {
                  const assignee = issue.assignee_id
                    ? memberMap.get(issue.assignee_id)
                    : null;
                  const isDragging = draggedId === issue.id;
                  return (
                    <div
                      key={issue.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, issue.id)}
                      onDragEnd={handleDragEnd}
                      className={`cursor-grab rounded-md border bg-background p-3 shadow-sm transition-all hover:shadow-md active:cursor-grabbing ${
                        isDragging ? "opacity-50" : ""
                      }`}
                    >
                      <div className="mb-1 flex items-center gap-2">
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {issue.issue_key}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {typeLabels[issue.issue_type]}
                        </span>
                      </div>
                      <Link
                        href={`/projects/${projectId}/issues/${issue.id}`}
                        className="block text-sm font-medium leading-tight hover:text-primary"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {issue.title}
                      </Link>
                      <div className="mt-2 flex items-center justify-between">
                        <Badge
                          variant="secondary"
                          className={`text-[10px] ${
                            priorityColors[issue.priority] || ""
                          }`}
                        >
                          {priorityLabels[issue.priority]}
                        </Badge>
                        {assignee && (
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-medium text-primary" title={assignee.user_name}>
                            {assignee.user_name.charAt(0)}
                          </span>
                        )}
                      </div>
                      {/* Progress bar */}
                      {issue.progress > 0 && (
                        <div className="mt-2 flex items-center gap-1.5">
                          <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-emerald-500 transition-all"
                              style={{ width: `${issue.progress}%` }}
                            />
                          </div>
                          <span className="text-[10px] tabular-nums text-muted-foreground">
                            {issue.progress}%
                          </span>
                        </div>
                      )}
                      {/* Milestone & due date */}
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {issue.milestone_id && milestoneMap.get(issue.milestone_id) && (
                          <Badge variant="outline" className="h-4 px-1 text-[9px]">
                            {milestoneMap.get(issue.milestone_id)!.name}
                          </Badge>
                        )}
                        {issue.due_date && (
                          <span className="text-[10px] text-muted-foreground">
                            期日: {issue.due_date}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
