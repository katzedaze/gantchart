"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProjects } from "@/hooks/useProjects";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const { data: projects, isLoading } = useProjects(false);
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 border-r bg-muted/20 md:block">
      <div className="p-4">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          プロジェクト
        </h2>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : projects?.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            プロジェクトがありません
          </p>
        ) : (
          <ul className="space-y-0.5">
            {projects?.map((project) => {
              const isActive = pathname.startsWith(`/projects/${project.id}`);
              return (
                <li key={project.id}>
                  <Link
                    href={`/projects/${project.id}`}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary font-medium"
                        : "hover:bg-muted text-foreground"
                    )}
                  >
                    <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                      {project.key}
                    </span>
                    <span className="truncate">{project.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
