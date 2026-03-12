"use client";

import type { Milestone } from "@/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface GanttMilestoneProps {
  milestone: Milestone;
  x: number;
  totalHeight: number;
}

export function GanttMilestone({ milestone, x, totalHeight }: GanttMilestoneProps) {
  const isOpen = milestone.status === "open";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="absolute z-10"
            style={{ left: x - 6, top: 0, height: totalHeight }}
          >
            {/* Vertical line */}
            <div
              className={`absolute left-[5px] top-0 w-0.5 ${
                isOpen ? "bg-purple-400" : "bg-gray-400"
              }`}
              style={{ height: totalHeight }}
            />
            {/* Diamond marker */}
            <div
              className={`absolute left-0 top-[-4px] h-3 w-3 rotate-45 ${
                isOpen ? "bg-purple-500" : "bg-gray-500"
              }`}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{milestone.name}</p>
          <p className="text-xs">{milestone.due_date}</p>
          <p className="text-xs capitalize">{milestone.status}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
