"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import type { Issue, ProjectMemberWithUser, Milestone } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/gantt-utils";
import { useBulkDeleteIssues, useBulkArchiveIssues, useArchiveIssue, useUnarchiveIssue, useDeleteIssue } from "@/hooks/useIssues";

const statusLabels: Record<string, string> = {
  open: "未着手",
  in_progress: "進行中",
  resolved: "解決済み",
  closed: "完了",
};

const statusColors: Record<string, string> = {
  open: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  in_progress: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  resolved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  closed: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

const priorityLabels: Record<string, string> = {
  low: "低",
  medium: "中",
  high: "高",
  critical: "緊急",
};

const priorityColors: Record<string, string> = {
  low: "bg-slate-100 text-slate-800",
  medium: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

const typeLabels: Record<string, string> = {
  task: "タスク",
  bug: "バグ",
  story: "ストーリー",
};

type SortField = "issue_key" | "title" | "status" | "priority" | "due_date" | "start_date" | "assignee" | "progress";
type SortDirection = "asc" | "desc";

const PAGE_SIZES = [10, 25, 50];

interface IssueTableProps {
  issues: Issue[];
  projectId: string;
  members?: ProjectMemberWithUser[];
  milestones?: Milestone[];
  showArchived?: boolean;
}

interface TreeIssue extends Issue {
  depth: number;
  hasChildren: boolean;
}

function buildTree(issues: Issue[]): TreeIssue[] {
  const childrenMap = new Map<string | null, Issue[]>();
  for (const issue of issues) {
    const parentKey = issue.parent_id || null;
    if (!childrenMap.has(parentKey)) {
      childrenMap.set(parentKey, []);
    }
    childrenMap.get(parentKey)!.push(issue);
  }

  const result: TreeIssue[] = [];
  function walk(parentId: string | null, depth: number) {
    const children = childrenMap.get(parentId) || [];
    for (const issue of children) {
      const hasChildren = (childrenMap.get(issue.id) || []).length > 0;
      result.push({ ...issue, depth, hasChildren });
      walk(issue.id, depth + 1);
    }
  }
  walk(null, 0);

  const addedIds = new Set(result.map((r) => r.id));
  for (const issue of issues) {
    if (!addedIds.has(issue.id)) {
      const hasChildren = (childrenMap.get(issue.id) || []).length > 0;
      result.push({ ...issue, depth: 0, hasChildren });
    }
  }

  return result;
}

const priorityOrder: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const statusOrder: Record<string, number> = {
  open: 0,
  in_progress: 1,
  resolved: 2,
  closed: 3,
};

export function IssueTable({
  issues,
  projectId,
  members = [],
  milestones = [],
  showArchived: _showArchived = false,
}: IssueTableProps) {
  void _showArchived;
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>("issue_key");
  const [sortDir, setSortDir] = useState<SortDirection>("asc");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const bulkDelete = useBulkDeleteIssues(projectId);
  const bulkArchive = useBulkArchiveIssues(projectId);
  const archiveIssue = useArchiveIssue(projectId);
  const unarchiveIssue = useUnarchiveIssue(projectId);
  const deleteIssue = useDeleteIssue(projectId);

  // Filter states
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterAssignee, setFilterAssignee] = useState<string>("all");
  const [filterMilestone, setFilterMilestone] = useState<string>("all");

  const memberMap = useMemo(
    () => new Map(members.map((m) => [m.user_id, m])),
    [members]
  );

  const milestoneMap = useMemo(
    () => new Map(milestones.map((m) => [m.id, m])),
    [milestones]
  );

  // Apply filters
  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      if (searchText) {
        const q = searchText.toLowerCase();
        const matchTitle = issue.title.toLowerCase().includes(q);
        const matchKey = issue.issue_key.toLowerCase().includes(q);
        const matchDesc = issue.description?.toLowerCase().includes(q);
        if (!matchTitle && !matchKey && !matchDesc) return false;
      }
      if (filterStatus !== "all" && issue.status !== filterStatus) return false;
      if (filterPriority !== "all" && issue.priority !== filterPriority) return false;
      if (filterType !== "all" && issue.issue_type !== filterType) return false;
      if (filterAssignee !== "all") {
        if (filterAssignee === "unassigned") {
          if (issue.assignee_id) return false;
        } else {
          if (issue.assignee_id !== filterAssignee) return false;
        }
      }
      if (filterMilestone !== "all") {
        if (filterMilestone === "none") {
          if (issue.milestone_id) return false;
        } else {
          if (issue.milestone_id !== filterMilestone) return false;
        }
      }
      return true;
    });
  }, [issues, searchText, filterStatus, filterPriority, filterType, filterAssignee, filterMilestone]);

  const sortedIssues = useMemo(() => {
    const sorted = [...filteredIssues].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "issue_key":
          cmp = a.issue_key.localeCompare(b.issue_key, undefined, { numeric: true });
          break;
        case "title":
          cmp = a.title.localeCompare(b.title);
          break;
        case "status":
          cmp = (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99);
          break;
        case "priority":
          cmp = (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99);
          break;
        case "due_date":
          cmp = (a.due_date || "9999").localeCompare(b.due_date || "9999");
          break;
        case "start_date":
          cmp = (a.start_date || "9999").localeCompare(b.start_date || "9999");
          break;
        case "assignee": {
          const aMember = a.assignee_id ? memberMap.get(a.assignee_id) : null;
          const bMember = b.assignee_id ? memberMap.get(b.assignee_id) : null;
          const aKana = aMember?.user_name_kana || aMember?.user_name || "";
          const bKana = bMember?.user_name_kana || bMember?.user_name || "";
          cmp = aKana.localeCompare(bKana, "ja");
          break;
        }
        case "progress":
          cmp = a.progress - b.progress;
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [filteredIssues, sortField, sortDir, memberMap]);

  const treeIssues = useMemo(() => buildTree(sortedIssues), [sortedIssues]);

  const totalPages = Math.max(1, Math.ceil(treeIssues.length / pageSize));
  const safeCurrentPage = Math.min(page, totalPages - 1);
  const pagedIssues = treeIssues.slice(
    safeCurrentPage * pageSize,
    (safeCurrentPage + 1) * pageSize
  );

  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortField(field);
        setSortDir("asc");
      }
      setPage(0);
    },
    [sortField]
  );

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === pagedIssues.length) {
        return new Set();
      }
      return new Set(pagedIssues.map((i) => i.id));
    });
  }, [pagedIssues]);

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;
    if (!confirm(`${selectedIds.size} 件の課題を削除しますか？`)) return;
    await bulkDelete.mutateAsync(Array.from(selectedIds));
    setSelectedIds(new Set());
  }

  async function handleBulkArchive() {
    if (selectedIds.size === 0) return;
    if (!confirm(`${selectedIds.size} 件の課題をアーカイブしますか？`)) return;
    await bulkArchive.mutateAsync(Array.from(selectedIds));
    setSelectedIds(new Set());
  }

  async function handleArchive(issueId: string) {
    if (!confirm("この課題をアーカイブしますか？")) return;
    await archiveIssue.mutateAsync(issueId);
  }

  async function handleUnarchive(issueId: string) {
    if (!confirm("この課題のアーカイブを解除しますか？")) return;
    await unarchiveIssue.mutateAsync(issueId);
  }

  async function handleDeleteSingle(issueId: string) {
    if (!confirm("この課題を削除しますか？この操作は取り消せません。")) return;
    await deleteIssue.mutateAsync(issueId);
  }

  const hasActiveFilters =
    searchText || filterStatus !== "all" || filterPriority !== "all" ||
    filterType !== "all" || filterAssignee !== "all" || filterMilestone !== "all";

  function clearFilters() {
    setSearchText("");
    setFilterStatus("all");
    setFilterPriority("all");
    setFilterType("all");
    setFilterAssignee("all");
    setFilterMilestone("all");
    setPage(0);
  }

  const sortIcon = (field: SortField) => {
    if (sortField !== field) return <span className="ml-1 text-muted-foreground/40">↕</span>;
    return <span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>;
  };

  if (issues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-12">
        <p className="text-muted-foreground">課題がまだありません</p>
        <Link
          href={`/projects/${projectId}/issues/new`}
          className="text-sm text-primary hover:underline"
        >
          最初の課題を作成
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
        <div className="flex items-center gap-2">
          <Input
            placeholder="キーワードで検索..."
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              setPage(0);
            }}
            className="h-8 max-w-xs bg-background"
          />
          <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(0); }}>
            <SelectTrigger className="h-8 w-32 bg-background">
              <SelectValue placeholder="ステータス" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全ステータス</SelectItem>
              {Object.entries(statusLabels).map(([val, label]) => (
                <SelectItem key={val} value={val}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={(v) => { setFilterPriority(v); setPage(0); }}>
            <SelectTrigger className="h-8 w-28 bg-background">
              <SelectValue placeholder="優先度" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全優先度</SelectItem>
              {Object.entries(priorityLabels).map(([val, label]) => (
                <SelectItem key={val} value={val}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={(v) => { setFilterType(v); setPage(0); }}>
            <SelectTrigger className="h-8 w-28 bg-background">
              <SelectValue placeholder="種別" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全種別</SelectItem>
              {Object.entries(typeLabels).map(([val, label]) => (
                <SelectItem key={val} value={val}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterAssignee} onValueChange={(v) => { setFilterAssignee(v); setPage(0); }}>
            <SelectTrigger className="h-8 w-36 bg-background">
              <SelectValue placeholder="担当者" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全担当者</SelectItem>
              <SelectItem value="unassigned">未割当</SelectItem>
              {members.map((m) => (
                <SelectItem key={m.user_id} value={m.user_id}>{m.user_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterMilestone} onValueChange={(v) => { setFilterMilestone(v); setPage(0); }}>
            <SelectTrigger className="h-8 w-40 bg-background">
              <SelectValue placeholder="マイルストーン" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全マイルストーン</SelectItem>
              <SelectItem value="none">なし</SelectItem>
              {milestones.map((ms) => (
                <SelectItem key={ms.id} value={ms.id}>{ms.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={clearFilters}>
              フィルタをクリア
            </Button>
          )}
          <span className="ml-auto text-xs text-muted-foreground">
            {filteredIssues.length} / {issues.length} 件
          </span>
        </div>
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-md bg-muted/50 px-4 py-2">
          <span className="text-sm font-medium">
            {selectedIds.size} 件選択中
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkArchive}
            disabled={bulkArchive.isPending}
          >
            {bulkArchive.isPending ? "アーカイブ中..." : "一括アーカイブ"}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
            disabled={bulkDelete.isPending}
          >
            {bulkDelete.isPending ? "削除中..." : "一括削除"}
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

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <input
                  type="checkbox"
                  checked={
                    pagedIssues.length > 0 &&
                    selectedIds.size === pagedIssues.length
                  }
                  onChange={toggleAll}
                  aria-label="全選択"
                  className="h-4 w-4 cursor-pointer rounded border-2 border-gray-400 accent-blue-600"
                />
              </TableHead>
              <TableHead
                className="w-24 cursor-pointer select-none"
                onClick={() => handleSort("issue_key")}
              >
                キー
                {sortIcon("issue_key")}
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort("title")}
              >
                タイトル
                {sortIcon("title")}
              </TableHead>
              <TableHead className="w-20">種別</TableHead>
              <TableHead
                className="w-24 cursor-pointer select-none"
                onClick={() => handleSort("status")}
              >
                ステータス
                {sortIcon("status")}
              </TableHead>
              <TableHead
                className="w-20 cursor-pointer select-none"
                onClick={() => handleSort("priority")}
              >
                優先度
                {sortIcon("priority")}
              </TableHead>
              <TableHead
                className="w-28 cursor-pointer select-none"
                onClick={() => handleSort("assignee")}
              >
                担当者
                {sortIcon("assignee")}
              </TableHead>
              <TableHead className="w-28">
                マイルストーン
              </TableHead>
              <TableHead
                className="w-24 cursor-pointer select-none"
                onClick={() => handleSort("progress")}
              >
                進捗
                {sortIcon("progress")}
              </TableHead>
              <TableHead
                className="w-28 cursor-pointer select-none"
                onClick={() => handleSort("start_date")}
              >
                開始日
                {sortIcon("start_date")}
              </TableHead>
              <TableHead
                className="w-28 cursor-pointer select-none"
                onClick={() => handleSort("due_date")}
              >
                期日
                {sortIcon("due_date")}
              </TableHead>
              <TableHead className="w-24">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagedIssues.map((issue) => {
              const member = issue.assignee_id
                ? memberMap.get(issue.assignee_id)
                : null;
              const milestone = issue.milestone_id
                ? milestoneMap.get(issue.milestone_id)
                : null;
              return (
                <TableRow
                  key={issue.id}
                  className={`hover:bg-muted/50 ${
                    selectedIds.has(issue.id) ? "bg-muted/30" : ""
                  } ${issue.is_archived ? "opacity-60" : ""}`}
                >
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(issue.id)}
                      onChange={() => toggleSelect(issue.id)}
                      aria-label={`${issue.issue_key}を選択`}
                      className="h-4 w-4 cursor-pointer rounded border-2 border-gray-400 accent-blue-600"
                    />
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    <Link
                      href={`/projects/${projectId}/issues/${issue.id}`}
                      className="text-primary hover:underline"
                    >
                      {issue.issue_key}
                    </Link>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div
                      className="flex items-center"
                      style={{ paddingLeft: `${issue.depth * 20}px` }}
                    >
                      {issue.depth > 0 && (
                        <span className="mr-1.5 text-xs text-muted-foreground">
                          └
                        </span>
                      )}
                      {issue.hasChildren && (
                        <span className="mr-1.5 text-xs text-muted-foreground">
                          ▸
                        </span>
                      )}
                      <Link
                        href={`/projects/${projectId}/issues/${issue.id}`}
                        className="truncate hover:text-primary"
                      >
                        {issue.title}
                      </Link>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {typeLabels[issue.issue_type] || issue.issue_type}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={statusColors[issue.status] || ""}
                    >
                      {statusLabels[issue.status] || issue.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={priorityColors[issue.priority] || ""}
                    >
                      {priorityLabels[issue.priority] || issue.priority}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {member ? (
                      <span className="flex items-center gap-1">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-medium text-primary">
                          {member.user_name.charAt(0)}
                        </span>
                        {member.user_name}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {milestone ? (
                      <Badge variant="outline" className="text-xs">
                        {milestone.name}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-12 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all"
                          style={{ width: `${issue.progress}%` }}
                        />
                      </div>
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {issue.progress}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(issue.start_date)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(issue.due_date)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {issue.is_archived ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => handleUnarchive(issue.id)}
                        >
                          復元
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-muted-foreground"
                          onClick={() => handleArchive(issue.id)}
                        >
                          アーカイブ
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                        onClick={() => handleDeleteSingle(issue.id)}
                      >
                        削除
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">表示件数:</span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => {
              setPageSize(Number(v));
              setPage(0);
            }}
          >
            <SelectTrigger className="h-8 w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">
            全 {treeIssues.length} 件
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => setPage(Math.max(0, safeCurrentPage - 1))}
            disabled={safeCurrentPage === 0}
          >
            前へ
          </Button>
          <span className="px-3 text-sm">
            {safeCurrentPage + 1} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => setPage(Math.min(totalPages - 1, safeCurrentPage + 1))}
            disabled={safeCurrentPage >= totalPages - 1}
          >
            次へ
          </Button>
        </div>
      </div>
    </div>
  );
}
