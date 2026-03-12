"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateIssue, useIssues } from "@/hooks/useIssues";
import { useProjectMembers } from "@/hooks/useMembers";
import { useMilestones } from "@/hooks/useMilestones";
import { useProject } from "@/hooks/useProjects";
import { issueCreateSchema } from "@/lib/validators";
import { MarkdownEditor } from "@/components/shared/MarkdownEditor";
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

const typeLabels: Record<string, string> = {
  task: "タスク",
  bug: "バグ",
  story: "ストーリー",
};

const priorityLabels: Record<string, string> = {
  low: "低",
  medium: "中",
  high: "高",
  critical: "緊急",
};

export default function NewIssuePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const router = useRouter();
  const { data: project } = useProject(projectId);
  const createIssue = useCreateIssue(projectId);
  const { data: members } = useProjectMembers(projectId);
  const { data: milestones } = useMilestones(projectId);
  const { data: issues } = useIssues(projectId);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [issueType, setIssueType] = useState("task");
  const [priority, setPriority] = useState("medium");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [milestoneId, setMilestoneId] = useState<string>("");
  const [parentId, setParentId] = useState<string>("");
  const [description, setDescription] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get("title") as string,
      description: description || undefined,
      issue_type: issueType as "task" | "bug" | "story",
      priority: priority as "low" | "medium" | "high" | "critical",
      start_date: (formData.get("start_date") as string) || undefined,
      due_date: (formData.get("due_date") as string) || undefined,
      assignee_id: assigneeId || undefined,
      milestone_id: milestoneId || undefined,
      parent_id: parentId || undefined,
    };

    const result = issueCreateSchema.safeParse(data);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        fieldErrors[issue.path[0] as string] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    try {
      await createIssue.mutateAsync(result.data);
      router.push(`/projects/${projectId}`);
    } catch (err) {
      setErrors({ form: (err as Error).message });
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>
            {project ? `${project.key} - 新規課題` : "新規課題"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">
                タイトル <span className="text-destructive">*</span>
              </label>
              <Input name="title" placeholder="課題のタイトルを入力" />
              {errors.title && (
                <p className="mt-1 text-sm text-destructive">{errors.title}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">説明</label>
              <MarkdownEditor
                value={description}
                onChange={setDescription}
                placeholder="課題の詳細をマークダウンで入力..."
                rows={6}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">種別</label>
                <Select value={issueType} onValueChange={setIssueType}>
                  <SelectTrigger>
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
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  優先度
                </label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
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
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  担当者
                </label>
                <Select value={assigneeId} onValueChange={setAssigneeId}>
                  <SelectTrigger>
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
                {members?.length === 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    先にプロジェクトにメンバーを追加してください
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  マイルストーン
                </label>
                <Select value={milestoneId} onValueChange={setMilestoneId}>
                  <SelectTrigger>
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
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">親課題</label>
              <Select value={parentId} onValueChange={setParentId}>
                <SelectTrigger>
                  <SelectValue placeholder="なし" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">なし</SelectItem>
                  {issues?.map((issue) => (
                    <SelectItem key={issue.id} value={issue.id}>
                      {issue.issue_key}: {issue.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  開始日
                </label>
                <Input name="start_date" type="date" />
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
            </div>

            {errors.form && (
              <p className="text-sm text-destructive">{errors.form}</p>
            )}
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={createIssue.isPending}>
                {createIssue.isPending ? "作成中..." : "課題を作成"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                キャンセル
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
