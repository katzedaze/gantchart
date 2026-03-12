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
import { formatDate } from "@/lib/gantt-utils";

const typeColors: Record<string, string> = {
  task: "bg-blue-500",
  bug: "bg-red-500",
  story: "bg-green-500",
};

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
  const [currentLeft, setCurrentLeft] = useState(left);
  const [currentWidth, setCurrentWidth] = useState(width);
  const [error, setError] = useState<string | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dragState) {
      setCurrentLeft(left);
      setCurrentWidth(width);
    }
  }, [left, width, dragState]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, type: "move" | "resize-right") => {
      e.preventDefault();
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setError(null);
      setDragState({
        type,
        startX: e.clientX,
        origLeft: currentLeft,
        origWidth: currentWidth,
      });
    },
    [currentLeft, currentWidth]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragState) return;
      const dx = e.clientX - dragState.startX;

      if (dragState.type === "move") {
        setCurrentLeft(Math.max(0, dragState.origLeft + dx));
      } else {
        setCurrentWidth(
          Math.max(config.pixelsPerDay, dragState.origWidth + dx)
        );
      }
    },
    [dragState, config.pixelsPerDay]
  );

  const handlePointerUp = useCallback(async () => {
    if (!dragState) return;
    setDragState(null);

    const newStartDate = pixelToDate(currentLeft, config);
    const newEndDate = pixelToDate(currentLeft + currentWidth, config);
    const startStr = newStartDate.toISOString().split("T")[0];
    const endStr = newEndDate.toISOString().split("T")[0];

    try {
      await onUpdate(startStr, endStr);
    } catch {
      setCurrentLeft(left);
      setCurrentWidth(width);
      setError("Failed to save changes");
    }
  }, [dragState, currentLeft, currentWidth, config, onUpdate, left, width]);

  const barColor = typeColors[issue.issue_type] || "bg-gray-500";
  const BAR_HEIGHT = 24;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            ref={barRef}
            className={`absolute flex cursor-grab items-center rounded ${barColor} text-white shadow-sm ${
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
            <span className="truncate px-2 text-xs">{issue.issue_key}</span>
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
          {error && <p className="text-xs text-red-400">{error}</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
