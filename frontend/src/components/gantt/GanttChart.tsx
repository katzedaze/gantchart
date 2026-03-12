"use client";

import { useMemo, useRef, useState, useCallback } from "react";
import type { GanttData } from "@/types";
import {
  getDateRange,
  generateDateColumns,
  calculateBarLeft,
  calculateBarWidth,
} from "@/lib/gantt-utils";
import { GanttBar } from "./GanttBar";
import { GanttMilestone } from "./GanttMilestone";
import { useBulkUpdateIssues } from "@/hooks/useIssues";
import { Button } from "@/components/ui/button";

interface GanttChartProps {
  data: GanttData;
  projectId: string;
}

const ROW_HEIGHT = 40;
const LABEL_WIDTH = 240;
const ZOOM_LEVELS = [20, 30, 40, 60];
const OVERSCAN = 5;

export function GanttChart({ data, projectId }: GanttChartProps) {
  const [zoomIndex, setZoomIndex] = useState(1);
  const pixelsPerDay = ZOOM_LEVELS[zoomIndex];
  const bulkUpdate = useBulkUpdateIssues(projectId);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(600);

  const dateRange = useMemo(
    () => getDateRange(data.issues),
    [data.issues]
  );

  const columns = useMemo(
    () => generateDateColumns(dateRange.start, dateRange.end, pixelsPerDay),
    [dateRange, pixelsPerDay]
  );

  const config = useMemo(
    () => ({ startDate: dateRange.start, pixelsPerDay }),
    [dateRange.start, pixelsPerDay]
  );

  const totalWidth = columns.length * pixelsPerDay;
  const totalHeight = data.issues.length * ROW_HEIGHT;

  const todayX = useMemo(() => {
    const now = new Date();
    const diffMs = now.getTime() - dateRange.start.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return Math.round(diffDays * pixelsPerDay);
  }, [dateRange.start, pixelsPerDay]);

  const visibleRange = useMemo(() => {
    const startRow = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
    const endRow = Math.min(
      data.issues.length,
      Math.ceil((scrollTop + viewportHeight) / ROW_HEIGHT) + OVERSCAN
    );
    return { startRow, endRow };
  }, [scrollTop, viewportHeight, data.issues.length]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    setScrollTop(target.scrollTop);
    setViewportHeight(target.clientHeight);
  }, []);

  const visibleIssues = data.issues.slice(visibleRange.startRow, visibleRange.endRow);

  // Build parent-child map for indentation
  const parentMap = new Map<string, number>();
  for (const issue of data.issues) {
    if (issue.parent_id) {
      const parentLevel = parentMap.get(issue.parent_id) || 0;
      parentMap.set(issue.id, parentLevel + 1);
    } else {
      parentMap.set(issue.id, 0);
    }
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <div className="flex items-center gap-1 rounded-md border p-0.5">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setZoomIndex(Math.max(0, zoomIndex - 1))}
            disabled={zoomIndex === 0}
          >
            -
          </Button>
          <span className="px-2 text-xs text-muted-foreground">
            ズーム
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() =>
              setZoomIndex(Math.min(ZOOM_LEVELS.length - 1, zoomIndex + 1))
            }
            disabled={zoomIndex === ZOOM_LEVELS.length - 1}
          >
            +
          </Button>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-sm bg-blue-500" />
            タスク
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-sm bg-red-500" />
            バグ
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-sm bg-green-500" />
            ストーリー
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-0.5 w-3 bg-red-500" />
            今日
          </span>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className="overflow-auto rounded-lg border shadow-sm"
        style={{ maxHeight: 600 }}
        onScroll={handleScroll}
      >
        <div className="flex">
          {/* Left panel: labels */}
          <div
            className="sticky left-0 z-20 shrink-0 border-r bg-background"
            style={{ width: LABEL_WIDTH }}
          >
            <div className="sticky top-0 z-30 flex h-8 items-center border-b bg-muted/50 px-3 text-xs font-semibold text-muted-foreground">
              課題
            </div>
            <div style={{ height: totalHeight, position: "relative" }}>
              {visibleIssues.map((issue, vi) => {
                const actualIndex = visibleRange.startRow + vi;
                const indent = parentMap.get(issue.id) || 0;
                return (
                  <div
                    key={issue.id}
                    className="absolute flex w-full items-center border-b px-3 text-sm hover:bg-muted/30"
                    style={{
                      top: actualIndex * ROW_HEIGHT,
                      height: ROW_HEIGHT,
                      paddingLeft: `${12 + indent * 16}px`,
                    }}
                  >
                    {indent > 0 && (
                      <span className="mr-1 text-xs text-muted-foreground">└</span>
                    )}
                    <span className="mr-2 shrink-0 font-mono text-[10px] text-muted-foreground">
                      {issue.issue_key}
                    </span>
                    <span className="truncate text-xs">{issue.title}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right panel: chart */}
          <div className="flex-1">
            {/* Date header */}
            <div
              className="sticky top-0 z-10 relative h-8 border-b bg-muted/50"
              style={{ width: totalWidth }}
            >
              {columns.map(
                (col, i) =>
                  i % Math.max(1, Math.floor(7 / (pixelsPerDay / 20))) ===
                    0 && (
                    <div
                      key={i}
                      className="absolute top-0 flex h-full items-center text-xs text-muted-foreground"
                      style={{ left: col.x }}
                    >
                      <span className="px-1">{col.label}</span>
                    </div>
                  )
              )}
            </div>

            {/* Chart body */}
            <div
              className="relative"
              style={{
                width: totalWidth,
                height: totalHeight,
                backgroundImage: `repeating-linear-gradient(to right, var(--color-border) 0px, var(--color-border) 1px, transparent 1px, transparent ${pixelsPerDay}px), repeating-linear-gradient(to bottom, var(--color-border) 0px, var(--color-border) 1px, transparent 1px, transparent ${ROW_HEIGHT}px)`,
                backgroundSize: `${pixelsPerDay}px ${ROW_HEIGHT}px`,
              }}
            >
              {/* Today line */}
              {todayX > 0 && todayX < totalWidth && (
                <div
                  className="absolute top-0 z-10 h-full w-0.5 bg-red-500"
                  style={{ left: todayX }}
                />
              )}

              {/* Issue bars (virtualized) */}
              {visibleIssues.map((issue, vi) => {
                const actualIndex = visibleRange.startRow + vi;
                return (
                  <GanttBar
                    key={issue.id}
                    issue={issue}
                    y={actualIndex * ROW_HEIGHT + 8}
                    left={calculateBarLeft(issue.start_date, config)}
                    width={calculateBarWidth(
                      issue.start_date,
                      issue.due_date,
                      config
                    )}
                    config={config}
                    onUpdate={async (startDate, dueDate) => {
                      await bulkUpdate.mutateAsync([
                        {
                          id: issue.id,
                          start_date: startDate,
                          due_date: dueDate,
                        },
                      ]);
                    }}
                  />
                );
              })}

              {/* Milestone markers */}
              {data.milestones.map((milestone) => {
                const x = calculateBarLeft(milestone.due_date, config);
                return (
                  <GanttMilestone
                    key={milestone.id}
                    milestone={milestone}
                    x={x}
                    totalHeight={totalHeight}
                  />
                );
              })}

              {/* Dependency arrows */}
              <svg
                className="pointer-events-none absolute left-0 top-0"
                width={totalWidth}
                height={totalHeight}
              >
                {data.dependencies.map((dep) => {
                  const predIdx = data.issues.findIndex(
                    (i) => i.id === dep.predecessor_id
                  );
                  const succIdx = data.issues.findIndex(
                    (i) => i.id === dep.successor_id
                  );
                  if (predIdx === -1 || succIdx === -1) return null;

                  const pred = data.issues[predIdx];
                  const succ = data.issues[succIdx];

                  const x1 =
                    calculateBarLeft(pred.start_date, config) +
                    calculateBarWidth(pred.start_date, pred.due_date, config);
                  const y1 = predIdx * ROW_HEIGHT + ROW_HEIGHT / 2;
                  const x2 = calculateBarLeft(succ.start_date, config);
                  const y2 = succIdx * ROW_HEIGHT + ROW_HEIGHT / 2;
                  const midX = x1 + (x2 - x1) / 2;

                  return (
                    <g key={dep.id}>
                      <path
                        d={`M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`}
                        fill="none"
                        stroke="#6b7280"
                        strokeWidth={1.5}
                        markerEnd="url(#arrowhead)"
                      />
                    </g>
                  );
                })}
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="8"
                    markerHeight="6"
                    refX="8"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 8 3, 0 6" fill="#6b7280" />
                  </marker>
                </defs>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
