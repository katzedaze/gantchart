import type {
  RoadmapShListItem,
  RoadmapShDetail,
  RoadmapShTopic,
  RoadmapShNode,
  RoadmapShEdge,
  TopicTreeNode,
} from "./types";

// Use Next.js API route as proxy to avoid CORS issues
const PROXY_BASE = "/api/roadmap";

export async function fetchRoadmapList(): Promise<RoadmapShListItem[]> {
  const res = await fetch(`${PROXY_BASE}/v1-list-official-roadmaps`);
  if (!res.ok) throw new Error("Failed to fetch roadmap list");
  return res.json();
}

export async function fetchRoadmapDetail(
  slug: string
): Promise<RoadmapShDetail> {
  const res = await fetch(`${PROXY_BASE}/v1-official-roadmap/${slug}`);
  if (!res.ok) throw new Error(`Failed to fetch roadmap: ${slug}`);
  return res.json();
}

export async function fetchTopicContent(
  slug: string,
  nodeId: string
): Promise<RoadmapShTopic> {
  const res = await fetch(
    `${PROXY_BASE}/v1-official-roadmap-topic/${slug}/${nodeId}`
  );
  if (!res.ok) throw new Error(`Failed to fetch topic: ${nodeId}`);
  return res.json();
}

/**
 * Convert flat nodes/edges from roadmap.sh into a hierarchical tree structure.
 * Topics and subtopics are extracted; other node types (title, paragraph, label, etc.) are filtered out.
 */
export function buildTopicTree(
  nodes: RoadmapShNode[],
  edges: RoadmapShEdge[]
): TopicTreeNode[] {
  const topicNodes = nodes.filter(
    (n) => n.type === "topic" || n.type === "subtopic"
  );

  // Build adjacency: edge from topic -> subtopic means parent -> child
  const childMap = new Map<string, Set<string>>();
  const parentSet = new Set<string>();

  for (const edge of edges) {
    const sourceNode = nodes.find((n) => n.id === edge.source);
    const targetNode = nodes.find((n) => n.id === edge.target);

    if (!sourceNode || !targetNode) continue;

    // topic -> subtopic edge means parent-child
    if (sourceNode.type === "topic" && targetNode.type === "subtopic") {
      if (!childMap.has(sourceNode.id)) {
        childMap.set(sourceNode.id, new Set());
      }
      childMap.get(sourceNode.id)!.add(targetNode.id);
      parentSet.add(targetNode.id);
    }
  }

  // For subtopics not connected to any topic via edges, try position-based grouping
  const topics = topicNodes.filter((n) => n.type === "topic");
  const subtopics = topicNodes.filter((n) => n.type === "subtopic");

  for (const sub of subtopics) {
    if (parentSet.has(sub.id)) continue;

    // Find nearest topic by position (subtopics are usually near their parent topic)
    let nearestTopic: RoadmapShNode | null = null;
    let minDist = Infinity;

    for (const topic of topics) {
      const dx = sub.position.x - topic.position.x;
      const dy = sub.position.y - topic.position.y;
      // Subtopics are typically to the right and slightly below their parent
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist && dist < 600) {
        minDist = dist;
        nearestTopic = topic;
      }
    }

    if (nearestTopic) {
      if (!childMap.has(nearestTopic.id)) {
        childMap.set(nearestTopic.id, new Set());
      }
      childMap.get(nearestTopic.id)!.add(sub.id);
      parentSet.add(sub.id);
    }
  }

  const nodeMap = new Map(topicNodes.map((n) => [n.id, n]));

  // Determine if an edge to this node is dashed (optional)
  const optionalNodes = new Set<string>();
  for (const edge of edges) {
    if (edge.style?.strokeDasharray && edge.style.strokeDasharray !== "0") {
      optionalNodes.add(edge.target);
    }
  }

  function buildNode(node: RoadmapShNode): TopicTreeNode {
    const children = childMap.get(node.id) ?? new Set<string>();
    const childNodes = [...children]
      .map((id) => nodeMap.get(id))
      .filter((n): n is RoadmapShNode => n != null)
      .sort((a, b) => {
        // Sort by y position first, then x
        if (Math.abs(a.position.y - b.position.y) < 20) {
          return a.position.x - b.position.x;
        }
        return a.position.y - b.position.y;
      });

    return {
      id: node.id,
      label: node.data.label,
      type: node.type as "topic" | "subtopic",
      children: childNodes.map(buildNode),
      isOptional: optionalNodes.has(node.id),
    };
  }

  // Root-level topics are those not in parentSet
  const rootTopics = topics
    .filter((n) => !parentSet.has(n.id))
    .sort((a, b) => {
      // Sort by y position (top to bottom)
      if (Math.abs(a.position.y - b.position.y) < 30) {
        return a.position.x - b.position.x;
      }
      return a.position.y - b.position.y;
    });

  // Also include orphan subtopics as root-level items
  const orphanSubtopics = subtopics
    .filter((n) => !parentSet.has(n.id))
    .sort((a, b) => a.position.y - b.position.y);

  return [...rootTopics, ...orphanSubtopics].map(buildNode);
}

/** Flatten a tree to get all node IDs for progress tracking */
export function flattenTree(tree: TopicTreeNode[]): string[] {
  const ids: string[] = [];
  function walk(node: TopicTreeNode) {
    ids.push(node.id);
    node.children.forEach(walk);
  }
  tree.forEach(walk);
  return ids;
}
