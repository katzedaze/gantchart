"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { Issue, ProjectMemberWithUser, Milestone } from "@/types";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  getScheduleStatus,
  scheduleStatusColors,
  scheduleStatusLabels,
  scheduleStatusDescriptions,
  type ScheduleStatus,
} from "@/lib/gantt-utils";

interface WorkHoursTableProps {
  issues: Issue[];
  projectId: string;
  members?: ProjectMemberWithUser[];
  milestones?: Milestone[];
}

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

function varianceClass(estimated: number | null, actual: number | null): string {
  if (!estimated || !actual) return "";
  const ratio = actual / estimated;
  if (ratio > 1.2) return "text-red-600 font-medium";
  if (ratio > 1.0) return "text-amber-600";
  return "text-emerald-600";
}

function varianceTooltip(estimated: number | null, actual: number | null): string {
  if (!estimated || !actual) return "予定工数または実績工数が未設定";
  const ratio = actual / estimated;
  if (ratio > 1.2) return "実績が予定の120%超: 大幅超過";
  if (ratio > 1.0) return "実績が予定を超過";
  return "実績が予定以内: 良好";
}

export function WorkHoursTable({
  issues,
  projectId,
  members = [],
  milestones = [],
}: WorkHoursTableProps) {
  const memberMap = useMemo(
    () => new Map(members.map((m) => [m.user_id, m])),
    [members]
  );
  const milestoneMap = useMemo(
    () => new Map(milestones.map((m) => [m.id, m])),
    [milestones]
  );

  const activeIssues = useMemo(
    () => issues.filter((i) => !i.is_archived),
    [issues]
  );

  const totals = useMemo(() => {
    let estimated = 0;
    let actual = 0;
    let progressSum = 0;
    let count = 0;
    for (const issue of activeIssues) {
      if (issue.estimated_hours) estimated += Number(issue.estimated_hours);
      if (issue.actual_hours) actual += Number(issue.actual_hours);
      progressSum += issue.progress;
      count++;
    }
    return {
      estimated,
      actual,
      variance: actual - estimated,
      avgProgress: count > 0 ? Math.round(progressSum / count) : 0,
      count,
    };
  }, [activeIssues]);

  const milestoneGroups = useMemo(() => {
    const groups = new Map<string | null, Issue[]>();
    for (const issue of activeIssues) {
      const key = issue.milestone_id;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(issue);
    }
    return groups;
  }, [activeIssues]);

  if (activeIssues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-12">
        <p className="text-muted-foreground">課題がまだありません</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-6 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">凡例:</span>
          <div className="flex items-center gap-4">
            <span className="font-medium">進捗状況:</span>
            {(Object.keys(scheduleStatusLabels) as ScheduleStatus[]).map((status) => (
              <Tooltip key={status}>
                <TooltipTrigger asChild>
                  <span className="flex cursor-help items-center gap-1">
                    <span className={`inline-block h-2.5 w-2.5 rounded-full ${scheduleStatusColors[status].fill}`} />
                    {scheduleStatusLabels[status]}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{scheduleStatusDescriptions[status]}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <span className="font-medium">工数差異:</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex cursor-help items-center gap-1">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  予定以内
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>実績工数が予定工数以下で良好</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex cursor-help items-center gap-1">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500" />
                  やや超過
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>実績が予定の100〜120%で軽微な超過</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex cursor-help items-center gap-1">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />
                  大幅超過
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>実績が予定の120%超で大幅に超過</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <SummaryCard
            label="予定工数合計"
            value={`${totals.estimated.toFixed(1)}h`}
          />
          <SummaryCard
            label="実績工数合計"
            value={`${totals.actual.toFixed(1)}h`}
          />
          <SummaryCard
            label="差異"
            value={`${totals.variance >= 0 ? "+" : ""}${totals.variance.toFixed(1)}h`}
            className={
              totals.variance > 0
                ? "text-red-600"
                : totals.variance < 0
                  ? "text-emerald-600"
                  : ""
            }
          />
          <SummaryCard
            label="平均進捗率"
            value={`${totals.avgProgress}%`}
          />
        </div>

        {/* Milestone-grouped breakdown */}
        {Array.from(milestoneGroups.entries()).map(([msId, groupIssues]) => {
          const ms = msId ? milestoneMap.get(msId) : null;
          const groupEstimated = groupIssues.reduce(
            (sum, i) => sum + (Number(i.estimated_hours) || 0), 0
          );
          const groupActual = groupIssues.reduce(
            (sum, i) => sum + (Number(i.actual_hours) || 0), 0
          );
          const groupVariance = groupActual - groupEstimated;

          return (
            <div key={msId || "none"} className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">
                  {ms ? ms.name : "マイルストーンなし"}
                </h3>
                <span className="text-xs text-muted-foreground">
                  予定: {groupEstimated.toFixed(1)}h / 実績: {groupActual.toFixed(1)}h
                  <span className={groupVariance > 0 ? " text-red-600" : groupVariance < 0 ? " text-emerald-600" : ""}>
                    {" "}({groupVariance >= 0 ? "+" : ""}{groupVariance.toFixed(1)}h)
                  </span>
                </span>
              </div>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24">キー</TableHead>
                      <TableHead>タイトル</TableHead>
                      <TableHead className="w-24">ステータス</TableHead>
                      <TableHead className="w-24">担当者</TableHead>
                      <TableHead className="w-20 text-right">予定(h)</TableHead>
                      <TableHead className="w-20 text-right">実績(h)</TableHead>
                      <TableHead className="w-20 text-right">差異(h)</TableHead>
                      <TableHead className="w-28">進捗</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupIssues.map((issue) => {
                      const member = issue.assignee_id
                        ? memberMap.get(issue.assignee_id)
                        : null;
                      const est = Number(issue.estimated_hours) || 0;
                      const act = Number(issue.actual_hours) || 0;
                      const diff = act - est;
                      const schedStatus = getScheduleStatus(issue);
                      const barColor = scheduleStatusColors[schedStatus].fill;

                      return (
                        <TableRow key={issue.id}>
                          <TableCell className="font-mono text-sm">
                            <Link
                              href={`/projects/${projectId}/issues/${issue.id}`}
                              className="text-primary hover:underline"
                            >
                              {issue.issue_key}
                            </Link>
                          </TableCell>
                          <TableCell className="text-sm font-medium">
                            <Link
                              href={`/projects/${projectId}/issues/${issue.id}`}
                              className="hover:text-primary"
                            >
                              {issue.title}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={`text-[10px] ${statusColors[issue.status] || ""}`}
                            >
                              {statusLabels[issue.status] || issue.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {member ? member.user_name : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-sm">
                            {issue.estimated_hours ? `${Number(issue.estimated_hours).toFixed(1)}` : "-"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-sm">
                            {issue.actual_hours ? `${Number(issue.actual_hours).toFixed(1)}` : "-"}
                          </TableCell>
                          <TableCell>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span
                                  className={`block cursor-help text-right tabular-nums text-sm ${varianceClass(
                                    issue.estimated_hours,
                                    issue.actual_hours
                                  )}`}
                                >
                                  {issue.estimated_hours && issue.actual_hours
                                    ? `${diff >= 0 ? "+" : ""}${diff.toFixed(1)}`
                                    : "-"}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{varianceTooltip(issue.estimated_hours, issue.actual_hours)}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex cursor-help items-center gap-1.5">
                                  <div className="h-1.5 w-12 overflow-hidden rounded-full bg-muted">
                                    <div
                                      className={`h-full rounded-full ${barColor} transition-all`}
                                      style={{ width: `${issue.progress}%` }}
                                    />
                                  </div>
                                  <span className="text-xs tabular-nums text-muted-foreground">
                                    {issue.progress}%
                                  </span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{scheduleStatusLabels[schedStatus]}: {scheduleStatusDescriptions[schedStatus]}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );
}

function SummaryCard({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${className}`}>
        {value}
      </p>
    </div>
  );
}
