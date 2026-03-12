"use client";

import { useState, useEffect, useSyncExternalStore, useMemo, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { popularRoadmaps, type RoadmapMeta } from "./roadmap-meta";
import { fetchRoadmapDetail, buildTopicTree, flattenTree } from "./roadmap-api";
import {
  useSkillProgress,
  useUpsertSkillProgress,
  useDeleteSkillProgress,
  type SkillProgressItem,
} from "@/hooks/useSkillProgress";
import type { SkillLevel } from "./types";

const TOPIC_COUNT_KEY = "skill-checker-topic-counts";
const TOPIC_IDS_KEY = "skill-checker-topic-ids";

type Progress = Record<string, SkillLevel>;
type TopicCounts = Record<string, number>;
type TopicIdsMap = Record<string, string[]>;

function progressItemsToMap(items: SkillProgressItem[]): Progress {
  const map: Progress = {};
  for (const item of items) {
    map[`${item.roadmap_slug}:${item.node_id}`] = item.level as SkillLevel;
  }
  return map;
}

function loadTopicCounts(): TopicCounts {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(TOPIC_COUNT_KEY);
    return raw ? (JSON.parse(raw) as TopicCounts) : {};
  } catch {
    return {};
  }
}

function saveTopicCounts(counts: TopicCounts) {
  localStorage.setItem(TOPIC_COUNT_KEY, JSON.stringify(counts));
}

function loadTopicIds(): TopicIdsMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(TOPIC_IDS_KEY);
    return raw ? (JSON.parse(raw) as TopicIdsMap) : {};
  } catch {
    return {};
  }
}

function saveTopicIds(ids: TopicIdsMap) {
  localStorage.setItem(TOPIC_IDS_KEY, JSON.stringify(ids));
}

function ProgressBar({
  done,
  learning,
  total,
}: {
  done: number;
  learning: number;
  total: number;
}) {
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
          {total > 0 ? Math.round(((done + learning * 0.5) / total) * 100) : 0}
          %
        </span>
      </div>
    </div>
  );
}

function RoadmapCard({
  meta,
  apiProgress,
  topicCount,
  topicIds,
  onBulkSet,
  isMutating,
}: {
  meta: RoadmapMeta;
  apiProgress: Progress;
  topicCount: number | undefined;
  topicIds: string[] | undefined;
  onBulkSet: (slug: string, nodeIds: string[], level: SkillLevel) => void;
  isMutating: boolean;
}) {
  const prefix = `${meta.slug}:`;
  const entries = Object.entries(apiProgress).filter(([k]) =>
    k.startsWith(prefix)
  );
  const done = entries.filter(([, v]) => v === "done").length;
  const learning = entries.filter(([, v]) => v === "learning").length;
  const total = topicCount ?? 0;
  const pct =
    total > 0 ? Math.round(((done + learning * 0.5) / total) * 100) : 0;
  const hasIds = topicIds && topicIds.length > 0;

  return (
    <Card className="h-full transition-all hover:shadow-md hover:border-primary/30">
      <CardContent className="p-4">
        <Link href={`/tools/skill-checker/${meta.slug}`} className="text-left block">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-2xl">{meta.icon}</span>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold truncate">{meta.title}</h3>
              <p className="text-xs text-muted-foreground">
                {meta.description}
              </p>
            </div>
            <span className="text-sm font-bold text-primary">{pct}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="flex h-full">
              <div
                className="bg-green-500 transition-all duration-300"
                style={{
                  width: `${total > 0 ? (done / total) * 100 : 0}%`,
                }}
              />
              <div
                className="bg-yellow-400 transition-all duration-300"
                style={{
                  width: `${total > 0 ? (learning / total) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {done}/{total > 0 ? total : "—"} スキル習得
          </p>
        </Link>

        {/* Bulk action buttons */}
        {hasIds && (
          <div className="mt-2 flex gap-1 border-t pt-2">
            <button
              onClick={() => onBulkSet(meta.slug, topicIds, "done")}
              disabled={isMutating}
              className="flex-1 rounded px-2 py-1 text-[11px] font-medium text-green-700 bg-green-100 hover:bg-green-200 dark:text-green-400 dark:bg-green-900/30 dark:hover:bg-green-900/50 disabled:opacity-50"
              title="すべて習得済みにする"
            >
              全て習得済み
            </button>
            <button
              onClick={() => onBulkSet(meta.slug, topicIds, "learning")}
              disabled={isMutating}
              className="flex-1 rounded px-2 py-1 text-[11px] font-medium text-yellow-700 bg-yellow-100 hover:bg-yellow-200 dark:text-yellow-400 dark:bg-yellow-900/30 dark:hover:bg-yellow-900/50 disabled:opacity-50"
              title="すべて学習中にする"
            >
              全て学習中
            </button>
            <button
              onClick={() => onBulkSet(meta.slug, topicIds, "none")}
              disabled={isMutating}
              className="flex-1 rounded px-2 py-1 text-[11px] font-medium text-muted-foreground bg-muted hover:bg-muted/80 disabled:opacity-50"
              title="すべてリセットする"
            >
              リセット
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function SkillCheckerPage() {
  const [topicCounts, setTopicCounts] = useState<TopicCounts>({});
  const [topicIds, setTopicIds] = useState<TopicIdsMap>({});
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // Fetch all progress from DB (no userId needed)
  const { data: progressItems } = useSkillProgress();
  const upsertMutation = useUpsertSkillProgress();
  const deleteMutation = useDeleteSkillProgress();

  const apiProgress = useMemo(
    () => (progressItems ? progressItemsToMap(progressItems) : {}),
    [progressItems]
  );

  useEffect(() => {
    if (!mounted) return;
    setTopicCounts(loadTopicCounts());
    setTopicIds(loadTopicIds());
  }, [mounted]);

  // Fetch topic counts and IDs for roadmaps that don't have a cached count yet
  useEffect(() => {
    if (!mounted) return;

    const missing = popularRoadmaps.filter((r) => !(r.slug in topicCounts));
    if (missing.length === 0) return;

    let cancelled = false;

    async function fetchCounts() {
      const updatedCounts = { ...topicCounts };
      const updatedIds = { ...topicIds };
      for (let i = 0; i < missing.length; i += 3) {
        if (cancelled) break;
        const batch = missing.slice(i, i + 3);
        const results = await Promise.allSettled(
          batch.map(async (r) => {
            const detail = await fetchRoadmapDetail(r.slug);
            const tree = buildTopicTree(detail.nodes, detail.edges);
            const ids = flattenTree(tree);
            return { slug: r.slug, count: ids.length, ids };
          })
        );
        for (const result of results) {
          if (result.status === "fulfilled") {
            updatedCounts[result.value.slug] = result.value.count;
            updatedIds[result.value.slug] = result.value.ids;
          }
        }
        if (!cancelled) {
          setTopicCounts({ ...updatedCounts });
          saveTopicCounts(updatedCounts);
          setTopicIds({ ...updatedIds });
          saveTopicIds(updatedIds);
        }
      }
    }

    fetchCounts();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  const globalStats = useMemo(() => {
    let total = 0;
    let done = 0;
    let learning = 0;
    for (const r of popularRoadmaps) {
      const count = topicCounts[r.slug] ?? 0;
      total += count;
      const prefix = `${r.slug}:`;
      for (const [k, v] of Object.entries(apiProgress)) {
        if (k.startsWith(prefix)) {
          if (v === "done") done++;
          else if (v === "learning") learning++;
        }
      }
    }
    return { total, done, learning };
  }, [apiProgress, topicCounts]);

  const handleBulkSet = useCallback(
    (slug: string, nodeIds: string[], level: SkillLevel) => {
      if (level === "none") {
        deleteMutation.mutate(slug);
      } else {
        upsertMutation.mutate({
          roadmap_slug: slug,
          items: nodeIds.map((id) => ({ node_id: id, level })),
        });
      }
    },
    [upsertMutation, deleteMutation]
  );

  const handleResetAll = () => {
    deleteMutation.mutate(undefined);
  };

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
        <h1 className="text-2xl font-bold">Skill Checker</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          roadmap.sh ベースのスキルチェッカー（日本語版） —
          各ロードマップをクリックすると、トピック一覧が表示されます
        </p>
      </div>

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
        {popularRoadmaps.map((meta) => (
          <RoadmapCard
            key={meta.slug}
            meta={meta}
            apiProgress={apiProgress}
            topicCount={topicCounts[meta.slug]}
            topicIds={topicIds[meta.slug]}
            onBulkSet={handleBulkSet}
            isMutating={upsertMutation.isPending || deleteMutation.isPending}
          />
        ))}
      </div>
    </div>
  );
}
