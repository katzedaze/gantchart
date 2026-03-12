"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  fetchRoadmapDetail,
  fetchTopicContent,
  buildTopicTree,
  flattenTree,
} from "../roadmap-api";
import { roadmapMetaMap } from "../roadmap-meta";
import {
  useSkillProgress,
  useUpsertSkillProgress,
  useDeleteSkillProgress,
  type SkillProgressItem,
} from "@/hooks/useSkillProgress";
import type {
  RoadmapShDetail,
  RoadmapShTopic,
  TopicTreeNode,
  SkillLevel,
} from "../types";

type Progress = Record<string, SkillLevel>;

const levelConfig: Record<
  SkillLevel,
  { label: string; color: string; bg: string; icon: string; next: SkillLevel }
> = {
  none: {
    label: "未学習",
    color: "text-muted-foreground",
    bg: "",
    icon: "⬜",
    next: "learning",
  },
  learning: {
    label: "学習中",
    color: "text-yellow-700 dark:text-yellow-400",
    bg: "bg-yellow-50 dark:bg-yellow-900/20",
    icon: "📖",
    next: "done",
  },
  done: {
    label: "習得済み",
    color: "text-green-700 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-900/20",
    icon: "✅",
    next: "none",
  },
};

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
          {total > 0
            ? Math.round(((done + learning * 0.5) / total) * 100)
            : 0}
          %
        </span>
      </div>
    </div>
  );
}

function TopicDescription({
  slug,
  nodeId,
}: {
  slug: string;
  nodeId: string;
}) {
  const [topic, setTopic] = useState<RoadmapShTopic | null>(null);
  const [translatedDesc, setTranslatedDesc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [translating, setTranslating] = useState(false);
  const [error, setError] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    setTranslatedDesc(null);
    setShowOriginal(false);

    fetchTopicContent(slug, nodeId)
      .then(async (data) => {
        if (cancelled) return;
        setTopic(data);
        setLoading(false);

        // Auto-translate description to Japanese
        if (data.description) {
          setTranslating(true);
          try {
            const { translateText } = await import("@/lib/translate");
            const cleanText = data.description
              .split("\n")
              .filter((line) => line.trim())
              .slice(0, 20)
              .map((line) => {
                const stripped = line.replace(/^#+\s*/, "");
                return stripped.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
              })
              .join("\n");
            const translated = await translateText(cleanText, "ja", "en");
            if (!cancelled) setTranslatedDesc(translated);
          } catch {
            // Translation failed - show original
          } finally {
            if (!cancelled) setTranslating(false);
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [slug, nodeId]);

  if (loading) {
    return (
      <div className="mt-2 animate-pulse space-y-2 rounded-md bg-muted/50 p-3">
        <div className="h-3 w-3/4 rounded bg-muted" />
        <div className="h-3 w-1/2 rounded bg-muted" />
      </div>
    );
  }

  if (error || !topic) {
    return (
      <div className="mt-2 rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
        説明を取得できませんでした
      </div>
    );
  }

  const originalLines = topic.description
    .split("\n")
    .filter((line) => line.trim())
    .slice(0, 20);

  const translatedLines = translatedDesc
    ? translatedDesc.split("\n").filter((line) => line.trim())
    : null;

  const displayLines = showOriginal || !translatedLines ? originalLines : null;
  const displayTranslated = !showOriginal ? translatedLines : null;

  return (
    <div className="mt-2 space-y-2 rounded-md bg-muted/30 p-3 text-sm">
      <div className="flex items-center justify-end gap-1">
        {translating && (
          <span className="text-xs text-muted-foreground animate-pulse">
            翻訳中...
          </span>
        )}
        {translatedLines && (
          <button
            onClick={() => setShowOriginal(!showOriginal)}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            {showOriginal ? "日本語で表示" : "原文を表示"}
          </button>
        )}
      </div>

      <div className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed">
        {displayTranslated
          ? displayTranslated.map((line, i) => {
              if (!line.trim()) return null;
              return <p key={i}>{line}</p>;
            })
          : displayLines?.map((line, i) => {
              const cleaned = line.replace(/^#+\s*/, "");
              if (line.startsWith("#")) {
                return (
                  <p key={i} className="font-semibold mt-1">
                    {cleaned}
                  </p>
                );
              }
              const withLinks = cleaned.replace(
                /\[([^\]]+)\]\([^)]+\)/g,
                "$1"
              );
              return <p key={i}>{withLinks}</p>;
            })}
      </div>

      {topic.resources.length > 0 && (
        <div className="border-t pt-2">
          <p className="text-xs font-semibold text-muted-foreground mb-1">
            参考リソース
          </p>
          <ul className="space-y-0.5">
            {topic.resources.slice(0, 5).map((res, i) => (
              <li key={i}>
                <a
                  href={res.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {res.title}
                  <span className="ml-1 text-muted-foreground">
                    ({res.type})
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function collectNodeIds(node: TopicTreeNode): string[] {
  const ids = [node.id];
  for (const child of node.children) {
    ids.push(...collectNodeIds(child));
  }
  return ids;
}

function TopicItem({
  node,
  slug,
  progress,
  onToggle,
  onBulkSet,
  depth,
  labelTranslations,
}: {
  node: TopicTreeNode;
  slug: string;
  progress: Progress;
  onToggle: (id: string) => void;
  onBulkSet: (nodeIds: string[], level: SkillLevel) => void;
  depth: number;
  labelTranslations: Record<string, string>;
}) {
  const [expanded, setExpanded] = useState(false);
  const level: SkillLevel = progress[`${slug}:${node.id}`] || "none";
  const config = levelConfig[level];
  const nodeKey = `${slug}:${node.id}`;
  const translatedLabel = labelTranslations[node.id];
  const hasChildren = node.children.length > 0;

  const handleBulkSet = (targetLevel: SkillLevel) => {
    const allIds = collectNodeIds(node);
    onBulkSet(allIds, targetLevel);
  };

  return (
    <div className={depth > 0 ? "ml-4 border-l border-border pl-3" : ""}>
      <div
        className={`group flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/50 ${config.bg}`}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle(nodeKey);
          }}
          className="shrink-0 text-base"
          title={`クリックで状態変更: ${config.label}`}
        >
          {config.icon}
        </button>

        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-1 text-left text-sm"
        >
          <span
            className={`${
              level === "done" ? "line-through opacity-60" : ""
            } ${node.isOptional ? "italic" : ""}`}
          >
            {translatedLabel ?? node.label}
          </span>
          {translatedLabel && (
            <span className="ml-1 text-xs text-muted-foreground">
              ({node.label})
            </span>
          )}
          {node.isOptional && (
            <span className="ml-1 text-xs text-muted-foreground">
              (任意)
            </span>
          )}
          {hasChildren && (
            <span className="ml-1 text-xs text-muted-foreground">
              ({node.children.length})
            </span>
          )}
        </button>

        {hasChildren && (
          <span className="hidden shrink-0 gap-0.5 group-hover:flex">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleBulkSet("done");
              }}
              className="rounded px-1.5 py-0.5 text-[10px] font-medium text-green-700 bg-green-100 hover:bg-green-200 dark:text-green-400 dark:bg-green-900/30 dark:hover:bg-green-900/50"
              title="すべて習得済みにする"
            >
              全✅
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleBulkSet("learning");
              }}
              className="rounded px-1.5 py-0.5 text-[10px] font-medium text-yellow-700 bg-yellow-100 hover:bg-yellow-200 dark:text-yellow-400 dark:bg-yellow-900/30 dark:hover:bg-yellow-900/50"
              title="すべて学習中にする"
            >
              全📖
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleBulkSet("none");
              }}
              className="rounded px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground bg-muted hover:bg-muted/80"
              title="すべてリセットする"
            >
              全⬜
            </button>
          </span>
        )}

        <span className={`shrink-0 text-xs font-medium ${config.color}`}>
          {config.label}
        </span>

        <span
          className="shrink-0 cursor-pointer text-xs text-muted-foreground transition-transform"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "▼" : "▶"}
        </span>
      </div>

      {expanded && (
        <div className="mb-1">
          <TopicDescription slug={slug} nodeId={node.id} />
        </div>
      )}

      {hasChildren && (
        <div className="mt-0.5">
          {node.children.map((child) => (
            <TopicItem
              key={child.id}
              node={child}
              slug={slug}
              progress={progress}
              onToggle={onToggle}
              onBulkSet={onBulkSet}
              depth={depth + 1}
              labelTranslations={labelTranslations}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function progressItemsToMap(
  items: SkillProgressItem[],
  slug: string
): Progress {
  const map: Progress = {};
  for (const item of items) {
    map[`${slug}:${item.node_id}`] = item.level as SkillLevel;
  }
  return map;
}

export default function RoadmapDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = params.slug;

  const [roadmap, setRoadmap] = useState<RoadmapShDetail | null>(null);
  const [tree, setTree] = useState<TopicTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<Progress>({});
  const [labelTranslations, setLabelTranslations] = useState<Record<string, string>>({});
  const translatingLabels = useRef(false);

  // Fetch progress from DB (no userId needed)
  const { data: progressItems } = useSkillProgress(slug);
  const upsertMutation = useUpsertSkillProgress();
  const deleteMutation = useDeleteSkillProgress();

  // Sync DB progress to local state
  useEffect(() => {
    if (progressItems) {
      setProgress(progressItemsToMap(progressItems, slug));
    }
  }, [progressItems, slug]);

  const meta = roadmapMetaMap.get(slug);

  useEffect(() => {
    let cancelled = false;

    fetchRoadmapDetail(slug)
      .then(async (data) => {
        if (cancelled) return;
        setRoadmap(data);
        const topicTree = buildTopicTree(data.nodes, data.edges);
        setTree(topicTree);
        setLoading(false);

        // Translate all labels in background
        if (!translatingLabels.current) {
          translatingLabels.current = true;
          try {
            const allIds = flattenTree(topicTree);
            const nodeMap = new Map(
              data.nodes
                .filter((n) => n.type === "topic" || n.type === "subtopic")
                .map((n) => [n.id, n.data.label])
            );

            const labelsToTranslate: { id: string; label: string }[] = [];
            for (const id of allIds) {
              const label = nodeMap.get(id);
              if (label) labelsToTranslate.push({ id, label });
            }

            if (labelsToTranslate.length > 0) {
              const { translateText } = await import("@/lib/translate");
              const separator = " ||| ";
              const joined = labelsToTranslate.map((l) => l.label).join(separator);
              const translated = await translateText(joined, "ja", "en");
              const parts = translated.split(/\s*\|\|\|\s*/);

              const translations: Record<string, string> = {};
              for (let i = 0; i < labelsToTranslate.length; i++) {
                if (parts[i] && parts[i].trim()) {
                  translations[labelsToTranslate[i].id] = parts[i].trim();
                }
              }
              if (!cancelled) setLabelTranslations(translations);
            }
          } catch {
            // Label translation failed - labels stay in English
          } finally {
            translatingLabels.current = false;
          }
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const toggleSkill = useCallback(
    (nodeKey: string) => {
      const nodeId = nodeKey.replace(`${slug}:`, "");
      setProgress((prev) => {
        const current: SkillLevel = prev[nodeKey] || "none";
        const next = levelConfig[current].next;
        const updated = { ...prev, [nodeKey]: next };
        if (next === "none") {
          delete updated[nodeKey];
        }
        upsertMutation.mutate({
          roadmap_slug: slug,
          items: [{ node_id: nodeId, level: next }],
        });
        return updated;
      });
    },
    [slug, upsertMutation]
  );

  const bulkSetSkills = useCallback(
    (nodeIds: string[], level: SkillLevel) => {
      setProgress((prev) => {
        const updated = { ...prev };
        for (const id of nodeIds) {
          const key = `${slug}:${id}`;
          if (level === "none") {
            delete updated[key];
          } else {
            updated[key] = level;
          }
        }
        return updated;
      });
      upsertMutation.mutate({
        roadmap_slug: slug,
        items: nodeIds.map((id) => ({ node_id: id, level })),
      });
    },
    [slug, upsertMutation]
  );

  const handleReset = useCallback(() => {
    setProgress((prev) => {
      const updated = { ...prev };
      const allIds = flattenTree(tree);
      for (const id of allIds) {
        delete updated[`${slug}:${id}`];
      }
      return updated;
    });
    deleteMutation.mutate(slug);
  }, [tree, slug, deleteMutation]);

  const stats = useMemo(() => {
    const allIds = flattenTree(tree);
    let done = 0;
    let learning = 0;
    for (const id of allIds) {
      const key = `${slug}:${id}`;
      if (progress[key] === "done") done++;
      else if (progress[key] === "learning") learning++;
    }
    return { total: allIds.length, done, learning };
  }, [tree, progress, slug]);

  const title =
    meta?.title ??
    (typeof roadmap?.title === "string"
      ? roadmap.title
      : roadmap?.title?.page ?? slug);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">
            {meta?.icon ?? "📚"} {meta?.title ?? slug}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            ロードマップを読み込み中...
          </p>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-12 animate-pulse rounded-lg bg-muted"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">エラー</h1>
          <p className="mt-1 text-sm text-destructive">{error}</p>
        </div>
        <Button onClick={() => router.push("/tools/skill-checker")}>
          一覧に戻る
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {meta?.icon ?? "📚"} {title}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              roadmap.sh ベースのスキルチェッカー - クリックで説明を表示、
              左のアイコンで学習状態を切り替え
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              disabled={stats.done + stats.learning === 0}
            >
              リセット
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/tools/skill-checker")}
            >
              一覧に戻る
            </Button>
          </div>
        </div>
      </div>

      {/* Progress */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">進捗</CardTitle>
        </CardHeader>
        <CardContent>
          <ProgressBar
            done={stats.done}
            learning={stats.learning}
            total={stats.total}
          />
        </CardContent>
      </Card>

      {/* Topic tree */}
      {tree.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            このロードマップにはトピックが見つかりませんでした
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-0.5">
              {tree.map((node) => (
                <TopicItem
                  key={node.id}
                  node={node}
                  slug={slug}
                  progress={progress}
                  onToggle={toggleSkill}
                  onBulkSet={bulkSetSkills}
                  depth={0}
                  labelTranslations={labelTranslations}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-6 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          ⬜ クリックで
          <span className="font-medium">未学習</span>
        </span>
        <span className="flex items-center gap-1">
          → 📖
          <span className="font-medium text-yellow-600">学習中</span>
        </span>
        <span className="flex items-center gap-1">
          → ✅
          <span className="font-medium text-green-600">習得済み</span>
        </span>
        <span className="flex items-center gap-1">
          → ⬜ に戻る
        </span>
      </div>
    </div>
  );
}
