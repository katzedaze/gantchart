"use client";

import { useState, useSyncExternalStore, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { roadmaps, type SkillLevel, type Roadmap } from "./roadmaps";

const STORAGE_KEY = "skill-checker-progress";

type Progress = Record<string, SkillLevel>;

function loadProgress(): Progress {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Progress) : {};
  } catch {
    return {};
  }
}

function saveProgress(progress: Progress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

const levelConfig: Record<SkillLevel, { label: string; color: string; bg: string; next: SkillLevel }> = {
  none: { label: "未学習", color: "text-muted-foreground", bg: "bg-muted", next: "learning" },
  learning: { label: "学習中", color: "text-yellow-700 dark:text-yellow-400", bg: "bg-yellow-100 dark:bg-yellow-900/30", next: "done" },
  done: { label: "習得済み", color: "text-green-700 dark:text-green-400", bg: "bg-green-100 dark:bg-green-900/30", next: "none" },
};

function ProgressBar({ done, learning, total }: { done: number; learning: number; total: number }) {
  const donePct = total > 0 ? (done / total) * 100 : 0;
  const learningPct = total > 0 ? (learning / total) * 100 : 0;

  return (
    <div className="space-y-1">
      <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
        <div className="flex h-full">
          <div
            className="bg-green-500 transition-all duration-300"
            style={{ width: `${donePct}%` }}
          />
          <div
            className="bg-yellow-400 transition-all duration-300"
            style={{ width: `${learningPct}%` }}
          />
        </div>
      </div>
      <div className="flex gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
          習得済み {done}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-yellow-400" />
          学習中 {learning}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-muted-foreground/30" />
          未学習 {total - done - learning}
        </span>
        <span className="ml-auto font-medium">
          {total > 0 ? Math.round(((done + learning * 0.5) / total) * 100) : 0}%
        </span>
      </div>
    </div>
  );
}

function RoadmapStats({ roadmap, progress }: { roadmap: Roadmap; progress: Progress }) {
  const total = roadmap.categories.reduce((sum, c) => sum + c.skills.length, 0);
  const done = roadmap.categories.reduce(
    (sum, c) => sum + c.skills.filter((s) => progress[s.id] === "done").length,
    0
  );
  const learning = roadmap.categories.reduce(
    (sum, c) => sum + c.skills.filter((s) => progress[s.id] === "learning").length,
    0
  );
  return { total, done, learning };
}

export default function SkillCheckerPage() {
  const [progress, setProgress] = useState<Progress>(() => {
    if (typeof window === "undefined") return {};
    return loadProgress();
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const toggleSkill = useCallback((skillId: string) => {
    setProgress((prev) => {
      const current: SkillLevel = prev[skillId] || "none";
      const next = levelConfig[current].next;
      const updated = { ...prev, [skillId]: next };
      if (next === "none") {
        delete updated[skillId];
      }
      saveProgress(updated);
      return updated;
    });
  }, []);

  const handleResetRoadmap = useCallback((roadmap: Roadmap) => {
    setProgress((prev) => {
      const updated = { ...prev };
      for (const cat of roadmap.categories) {
        for (const skill of cat.skills) {
          delete updated[skill.id];
        }
      }
      saveProgress(updated);
      return updated;
    });
  }, []);

  const handleResetAll = useCallback(() => {
    setProgress({});
    saveProgress({});
  }, []);

  const selectedRoadmap = useMemo(
    () => roadmaps.find((r) => r.id === selectedId) ?? null,
    [selectedId]
  );

  const globalStats = useMemo(() => {
    let total = 0;
    let done = 0;
    let learning = 0;
    for (const r of roadmaps) {
      for (const c of r.categories) {
        total += c.skills.length;
        for (const s of c.skills) {
          if (progress[s.id] === "done") done++;
          else if (progress[s.id] === "learning") learning++;
        }
      }
    }
    return { total, done, learning };
  }, [progress]);

  if (!mounted) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Skill Checker</h1>
          <p className="mt-1 text-sm text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Skill Checker</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              roadmap.sh ベースのスキルチェッカー（日本語版）
            </p>
          </div>
          {selectedRoadmap && (
            <Button variant="outline" size="sm" onClick={() => setSelectedId(null)}>
              一覧に戻る
            </Button>
          )}
        </div>
      </div>

      {!selectedRoadmap ? (
        <>
          {/* Global stats */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">全体の進捗</CardTitle>
                {globalStats.done + globalStats.learning > 0 && (
                  <Button variant="ghost" size="sm" onClick={handleResetAll}>
                    全リセット
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ProgressBar
                done={globalStats.done}
                learning={globalStats.learning}
                total={globalStats.total}
              />
            </CardContent>
          </Card>

          {/* Roadmap grid */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {roadmaps.map((roadmap) => {
              const stats = RoadmapStats({ roadmap, progress });
              const pct = stats.total > 0 ? Math.round(((stats.done + stats.learning * 0.5) / stats.total) * 100) : 0;
              return (
                <button
                  key={roadmap.id}
                  onClick={() => setSelectedId(roadmap.id)}
                  className="text-left"
                >
                  <Card className="h-full transition-all hover:shadow-md hover:border-primary/30">
                    <CardContent className="p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="text-2xl">{roadmap.icon}</span>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold truncate">{roadmap.title}</h3>
                          <p className="text-xs text-muted-foreground">{roadmap.description}</p>
                        </div>
                        <span className="text-sm font-bold text-primary">{pct}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div className="flex h-full">
                          <div
                            className="bg-green-500 transition-all"
                            style={{ width: `${stats.total > 0 ? (stats.done / stats.total) * 100 : 0}%` }}
                          />
                          <div
                            className="bg-yellow-400 transition-all"
                            style={{ width: `${stats.total > 0 ? (stats.learning / stats.total) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {stats.done}/{stats.total} スキル習得
                      </p>
                    </CardContent>
                  </Card>
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <>
          {/* Roadmap detail */}
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{selectedRoadmap.icon}</span>
                  <CardTitle className="text-lg">{selectedRoadmap.title}</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleResetRoadmap(selectedRoadmap)}
                >
                  リセット
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {(() => {
                const stats = RoadmapStats({ roadmap: selectedRoadmap, progress });
                return (
                  <ProgressBar done={stats.done} learning={stats.learning} total={stats.total} />
                );
              })()}
            </CardContent>
          </Card>

          <div className="space-y-4">
            {selectedRoadmap.categories.map((category) => {
              const catDone = category.skills.filter((s) => progress[s.id] === "done").length;
              const catLearning = category.skills.filter((s) => progress[s.id] === "learning").length;
              return (
                <Card key={category.category}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold">
                        {category.category}
                      </CardTitle>
                      <span className="text-xs text-muted-foreground">
                        {catDone + catLearning}/{category.skills.length}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {category.skills.map((skill) => {
                        const level: SkillLevel = progress[skill.id] || "none";
                        const config = levelConfig[level];
                        return (
                          <button
                            key={skill.id}
                            onClick={() => toggleSkill(skill.id)}
                            className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted/50 ${config.bg}`}
                          >
                            <span className="flex items-center gap-2">
                              <span className="text-base">
                                {level === "done" ? "✅" : level === "learning" ? "📖" : "⬜"}
                              </span>
                              <span className={level === "done" ? "line-through opacity-60" : ""}>
                                {skill.name}
                              </span>
                            </span>
                            <span className={`text-xs font-medium ${config.color}`}>
                              {config.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
