export type SkillLevel = "none" | "learning" | "done";

// Existing static roadmap types
export interface Skill {
  id: string;
  name: string;
}

export interface SkillCategory {
  category: string;
  skills: Skill[];
}

export interface Roadmap {
  id: string;
  title: string;
  description: string;
  icon: string;
  categories: SkillCategory[];
}

// roadmap.sh API types
export interface RoadmapShListItem {
  id: string;
  title: string;
  description: string;
  slug: string;
  type: "role" | "skill" | "best-practice";
  order: number;
}

export interface RoadmapShNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: { label: string };
  width?: number;
  height?: number;
  style?: Record<string, string>;
}

export interface RoadmapShEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  style?: { strokeDasharray?: string };
}

export interface RoadmapShDetail {
  _id: string;
  title: string | { card?: string; page?: string };
  description: string;
  slug: string;
  nodes: RoadmapShNode[];
  edges: RoadmapShEdge[];
  dimensions: { width: number; height: number };
  type: "role" | "skill" | "best-practice";
}

export interface RoadmapShTopic {
  _id: string;
  nodeId: string;
  roadmapSlug: string;
  description: string;
  resources: { type: string; title: string; url: string }[];
}

// Tree structure for display
export interface TopicTreeNode {
  id: string;
  label: string;
  type: "topic" | "subtopic";
  children: TopicTreeNode[];
  isOptional: boolean;
}
