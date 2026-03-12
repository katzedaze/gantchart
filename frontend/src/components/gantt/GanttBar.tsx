"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Issue } from "@/types";
import type { GanttConfig } from "@/lib/gantt-utils";
import { pixelToDate } from "@/lib/gantt-utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  formatDate,
  getScheduleStatus,
  scheduleStatusColors,
  scheduleStatusLabels,
} from "@/lib/gantt-utils";

interface GanttBarProps {
  issue: Issue;
  y: number;
  left: number;
  width: number;
  config: GanttConfig;
  onUpdate: (startDate: string, dueDate: string) => Promise<void>;
}

export function GanttBar({
  issue,
  y,
  left,
  width,
  config,
  onUpdate,
}: GanttBarProps) {
  const [dragState, setDragState] = useState<{
    type: "move" | "resize-right";
    startX: number;
    origLeft: number;
    origWidth: number;
  } | null>(null);
  const [dragOffset, setDragOffset] = useState<{ dl: number; dw: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const currentLeft = dragOffset ? left + dragOffset.dl : left;
  const currentWidth = dragOffset ? width + dragOffset.dw : width;

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, type: "move" | "resize-right") => {
      e.preventDefault();
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setError(null);
      setDragState({
        type,
        startX: e.clientX,
        origLeft: left,
        origWidth: width,
      });
      setDragOffset({ dl: 0, dw: 0 });
    },
    [left, width]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragState) return;
      const dx = e.clientX - dragState.startX;

      if (dragState.type === "move") {
        const dl = Math.max(-dragState.origLeft, dx);
        setDragOffset({ dl, dw: 0 });
      } else {
        const dw = Math.max(config.pixelsPerDay - dragState.origWidth, dx);
        setDragOffset({ dl: 0, dw });
      }
    },
    [dragState, config.pixelsPerDay]
  );

  const handlePointerUp = useCallback(async () => {
    if (!dragState || !dragOffset) return;
    setDragState(null);

    const finalLeft = left + dragOffset.dl;
    const finalWidth = width + dragOffset.dw;
    setDragOffset(null);

    const newStartDate = pixelToDate(finalLeft, config);
    const newEndDate = pixelToDate(finalLeft + finalWidth, config);
    const startStr = newStartDate.toISOString().split("T")[0];
    const endStr = newEndDate.toISOString().split("T")[0];

    try {
      await onUpdate(startStr, endStr);
    } catch {
      setError("Failed to save changes");
    }
  }, [dragState, dragOffset, left, width, config, onUpdate]);

  const scheduleStatus = getScheduleStatus(issue);
  const statusColor = scheduleStatusColors[scheduleStatus];
  const BAR_HEIGHT = 24;
  const progressWidth = Math.round((issue.progress / 100) * currentWidth);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            ref={barRef}
            className={`absolute flex cursor-grab items-center rounded ${statusColor.bar} shadow-sm ${
              dragState ? "opacity-80" : ""
            } ${error ? "ring-2 ring-red-400" : ""}`}
            style={{
              left: currentLeft,
              top: y,
              width: currentWidth,
              height: BAR_HEIGHT,
            }}
            data-testid={`gantt-bar-${issue.issue_key}`}
            onPointerDown={(e) => handlePointerDown(e, "move")}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            {/* Progress fill */}
            <div
              className={`absolute left-0 top-0 h-full rounded-l ${progressWidth >= currentWidth ? "rounded-r" : ""} ${statusColor.fill}`}
              style={{ width: progressWidth }}
            />
            <span className="relative z-10 truncate px-2 text-xs text-black">
              {issue.issue_key} {issue.progress > 0 ? `${issue.progress}%` : ""}
            </span>
            {/* Resize handle */}
            <div
              className="absolute right-0 top-0 h-full w-2 cursor-col-resize"
              onPointerDown={(e) => handlePointerDown(e, "resize-right")}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{issue.title}</p>
          <p className="text-xs">
            {formatDate(issue.start_date)} - {formatDate(issue.due_date)}
          </p>
          <p className="text-xs">
            進捗: {issue.progress}% / 状態: {scheduleStatusLabels[scheduleStatus]}
          </p>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
