"use client";

import { use, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useIssue, useUpdateIssue, useDeleteIssue, useIssues } from "@/hooks/useIssues";
import { useProjectMembers } from "@/hooks/useMembers";
import { useMilestones } from "@/hooks/useMilestones";
import { IssueComments } from "@/components/issues/IssueComments";
import { MarkdownEditor, MarkdownContent } from "@/components/shared/MarkdownEditor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/gantt-utils";

const statusLabels: Record<string, string> = {
  open: "未着手",
  in_progress: "進行中",
  resolved: "解決済み",
  closed: "完了",
};

const priorityLabels: Record<string, string> = {
  low: "低",
  medium: "中",
  high: "高",
  critical: "緊急",
};

const typeLabels: Record<string, string> = {
  task: "タスク",
  bug: "バグ",
  story: "ストーリー",
};

const statusColors: Record<string, string> = {
  open: "bg-blue-100 text-blue-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-800",
};

export default function IssueDetailPage({
  params,
}: {
  params: Promise<{ projectId: string; issueId: string }>;
}) {
  const { projectId, issueId } = use(params);
  const router = useRouter();
  const { data: issue, isLoading } = useIssue(issueId);
  const updateIssue = useUpdateIssue(projectId);
  const deleteIssue = useDeleteIssue(projectId);
  const { data: members } = useProjectMembers(projectId);
  const { data: milestones } = useMilestones(projectId);
  const { data: issues } = useIssues(projectId);
  const [editing, setEditing] = useState(false);
  const initialForm = useMemo(() => ({
    title: issue?.title ?? "",
    description: issue?.description ?? "",
    issue_type: issue?.issue_type ?? "",
    status: issue?.status ?? "",
    priority: issue?.priority ?? "",
    assignee_id: issue?.assignee_id ?? "",
    milestone_id: issue?.milestone_id ?? "",
    parent_id: issue?.parent_id ?? "",
    start_date: issue?.start_date ?? "",
    due_date: issue?.due_date ?? "",
    estimated_hours: issue?.estimated_hours?.toString() ?? "",
    actual_hours: issue?.actual_hours?.toString() ?? "",
    progress: issue?.progress?.toString() ?? "0",
  }), [issue]);
  const [form, setForm] = useState(initialForm);
  // Reset form when issue data changes (e.g., after save or initial load)
  const [prevIssueId, setPrevIssueId] = useState(issue?.id);
  if (issue?.id !== prevIssueId) {
    setPrevIssueId(issue?.id);
    setForm(initialForm);
  }

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (!issue) return <p className="text-muted-foreground">課題が見つかりません</p>;

  const memberMap = new Map(members?.map((m) => [m.user_id, m]) || []);
  const assignee = issue.assignee_id ? memberMap.get(issue.assignee_id) : null;
  const parentIssue = issues?.find((i) => i.id === issue.parent_id);
  const childIssues = issues?.filter((i) => i.parent_id === issue.id) || [];

  // Compute descendants to exclude from parent select
  const descendantIds = new Set<string>();
  if (issues) {
    const queue = [issue.id];
    while (queue.length > 0) {
      const currentId = queue.pop()!;
      for (const i of issues) {
        if (i.parent_id === currentId && !descendantIds.has(i.id)) {
          descendantIds.add(i.id);
          queue.push(i.id);
        }
      }
    }
  }
  const availableParents = issues?.filter(
    (i) => i.id !== issueId && !descendantIds.has(i.id)
  ) || [];

  async function handleSave() {
    const data: Record<string, unknown> = {};
    if (form.title !== issue!.title) data.title = form.title;
    if (form.description !== (issue!.description || ""))
      data.description = form.description || null;
    if (form.issue_type !== issue!.issue_type) data.issue_type = form.issue_type;
    if (form.status !== issue!.status) data.status = form.status;
    if (form.priority !== issue!.priority) data.priority = form.priority;
    if (form.assignee_id !== (issue!.assignee_id || ""))
      data.assignee_id = form.assignee_id || null;
    if (form.milestone_id !== (issue!.milestone_id || ""))
      data.milestone_id = form.milestone_id || null;
    if (form.parent_id !== (issue!.parent_id || ""))
      data.parent_id = form.parent_id || null;
    if (form.start_date !== (issue!.start_date || ""))
      data.start_date = form.start_date || null;
    if (form.due_date !== (issue!.due_date || ""))
      data.due_date = form.due_date || null;
    if (form.estimated_hours !== (issue!.estimated_hours?.toString() || ""))
      data.estimated_hours = form.estimated_hours
        ? parseFloat(form.estimated_hours)
        : null;
    if (form.actual_hours !== (issue!.actual_hours?.toString() || ""))
      data.actual_hours = form.actual_hours
        ? parseFloat(form.actual_hours)
        : null;
    if (form.progress !== (issue!.progress?.toString() || "0"))
      data.progress = parseInt(form.progress) || 0;

    if (Object.keys(data).length > 0) {
      await updateIssue.mutateAsync({ issueId, data: data as never });
    }
    setEditing(false);
  }

  async function handleStatusChange(status: string) {
    await updateIssue.mutateAsync({ issueId, data: { status } as never });
  }

  async function handleDelete() {
    if (confirm("この課題を削除しますか？")) {
      await deleteIssue.mutateAsync(issueId);
      router.push(`/projects/${projectId}`);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          ← 戻る
        </Button>
        <div className="flex gap-2">
          {editing ? (
            <>
              <Button size="sm" onClick={handleSave} disabled={updateIssue.isPending}>
                {updateIssue.isPending ? "保存中..." : "保存"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
                キャンセル
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                編集
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                削除
              </Button>
            </>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm text-muted-foreground">
              {issue.issue_key}
            </span>
            {editing ? (
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="text-xl font-bold"
              />
            ) : (
              <CardTitle className="text-xl">{issue.title}</CardTitle>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status bar */}
          <div className="flex items-center gap-4">
            <Badge
              variant="secondary"
              className={`text-sm ${statusColors[issue.status] || ""}`}
            >
              {statusLabels[issue.status] || issue.status}
            </Badge>
            {!editing && (
              <Select value={issue.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                種別
              </label>
              {editing ? (
                <Select
                  value={form.issue_type}
                  onValueChange={(v) => setForm({ ...form, issue_type: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(typeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="mt-1">
                  {typeLabels[issue.issue_type] || issue.issue_type}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                優先度
              </label>
              {editing ? (
                <Select
                  value={form.priority}
                  onValueChange={(v) => setForm({ ...form, priority: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(priorityLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="mt-1">
                  <Badge variant="secondary">
                    {priorityLabels[issue.priority] || issue.priority}
                  </Badge>
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                担当者
              </label>
              {editing ? (
                <Select
                  value={form.assignee_id}
                  onValueChange={(v) =>
                    setForm({ ...form, assignee_id: v === "none" ? "" : v })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="未割当" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">未割当</SelectItem>
                    {members?.map((member) => (
                      <SelectItem key={member.user_id} value={member.user_id}>
                        {member.user_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="mt-1">
                  {assignee ? (
                    <span className="flex items-center gap-1">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-medium text-primary">
                        {assignee.user_name.charAt(0)}
                      </span>
                      {assignee.user_name}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">未割当</span>
                  )}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                マイルストーン
              </label>
              {editing ? (
                <Select
                  value={form.milestone_id}
                  onValueChange={(v) =>
                    setForm({ ...form, milestone_id: v === "none" ? "" : v })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="なし" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">なし</SelectItem>
                    {milestones?.map((ms) => (
                      <SelectItem key={ms.id} value={ms.id}>
                        {ms.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="mt-1 text-muted-foreground">
                  {milestones?.find((m) => m.id === issue.milestone_id)?.name ||
                    "なし"}
                </p>
              )}
            </div>
          </div>

          {/* Parent issue */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              親課題
            </label>
            {editing ? (
              <Select
                value={form.parent_id}
                onValueChange={(v) =>
                  setForm({ ...form, parent_id: v === "none" ? "" : v })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="なし" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">なし</SelectItem>
                  {availableParents.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.issue_key}: {i.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : parentIssue ? (
              <p className="mt-1">
                <a
                  href={`/projects/${projectId}/issues/${parentIssue.id}`}
                  className="text-primary hover:underline"
                >
                  {parentIssue.issue_key}: {parentIssue.title}
                </a>
              </p>
            ) : (
              <p className="mt-1 text-muted-foreground">なし</p>
            )}
          </div>

          {/* Child issues */}
          {childIssues.length > 0 && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                子課題 ({childIssues.length})
              </label>
              <div className="mt-1 space-y-1">
                {childIssues.map((child) => (
                  <div
                    key={child.id}
                    className="flex items-center gap-2 rounded border p-2 text-sm"
                  >
                    <Badge
                      variant="secondary"
                      className={`text-xs ${statusColors[child.status] || ""}`}
                    >
                      {statusLabels[child.status]}
                    </Badge>
                    <a
                      href={`/projects/${projectId}/issues/${child.id}`}
                      className="text-primary hover:underline"
                    >
                      {child.issue_key}
                    </a>
                    <span>{child.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                開始日
              </label>
              {editing ? (
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={(e) =>
                    setForm({ ...form, start_date: e.target.value })
                  }
                  className="mt-1"
                />
              ) : (
                <p className="mt-1">{formatDate(issue.start_date)}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                期日
              </label>
              {editing ? (
                <Input
                  type="date"
                  value={form.due_date}
                  onChange={(e) =>
                    setForm({ ...form, due_date: e.target.value })
                  }
                  className="mt-1"
                />
              ) : (
                <p className="mt-1">{formatDate(issue.due_date)}</p>
              )}
            </div>
          </div>

          {/* Hours */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                予定工数 (時間)
              </label>
              {editing ? (
                <Input
                  type="number"
                  step="0.5"
                  value={form.estimated_hours}
                  onChange={(e) =>
                    setForm({ ...form, estimated_hours: e.target.value })
                  }
                  className="mt-1"
                />
              ) : (
                <p className="mt-1">
                  {issue.estimated_hours ? `${issue.estimated_hours}h` : "-"}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                実績工数 (時間)
              </label>
              {editing ? (
                <Input
                  type="number"
                  step="0.5"
                  value={form.actual_hours}
                  onChange={(e) =>
                    setForm({ ...form, actual_hours: e.target.value })
                  }
                  className="mt-1"
                />
              ) : (
                <p className="mt-1">
                  {issue.actual_hours ? `${issue.actual_hours}h` : "-"}
                </p>
              )}
            </div>
          </div>

          {/* Progress */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              進捗率
            </label>
            {editing ? (
              <div className="mt-1 flex items-center gap-3">
                <Input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={form.progress}
                  onChange={(e) =>
                    setForm({ ...form, progress: e.target.value })
                  }
                  className="h-2 flex-1"
                />
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={form.progress}
                  onChange={(e) =>
                    setForm({ ...form, progress: e.target.value })
                  }
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            ) : (
              <div className="mt-1 flex items-center gap-3">
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${issue.progress}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{issue.progress}%</span>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              説明
            </label>
            {editing ? (
              <div className="mt-1">
                <MarkdownEditor
                  value={form.description}
                  onChange={(v) => setForm({ ...form, description: v })}
                  placeholder="課題の詳細をマークダウンで入力..."
                  rows={8}
                  issueId={issueId}
                />
              </div>
            ) : (
              <div className="mt-1 min-h-[2rem] rounded-md bg-muted/30 p-3 text-sm">
                {issue.description ? (
                  <MarkdownContent content={issue.description} />
                ) : (
                  <span className="text-muted-foreground">説明なし</span>
                )}
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="border-t pt-4 text-xs text-muted-foreground">
            <p>作成日: {formatDate(issue.created_at)}</p>
            <p>更新日: {formatDate(issue.updated_at)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Comments section */}
      <Card>
        <CardContent className="pt-6">
          <IssueComments
            issueId={issueId}
            members={members || []}
          />
        </CardContent>
      </Card>
    </div>
  );
}
