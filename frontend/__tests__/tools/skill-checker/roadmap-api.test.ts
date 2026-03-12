import { describe, it, expect } from "vitest";
import { buildTopicTree, flattenTree } from "@/app/tools/skill-checker/roadmap-api";
import type { RoadmapShNode, RoadmapShEdge, TopicTreeNode } from "@/app/tools/skill-checker/types";

function makeNode(
  id: string,
  type: string,
  label: string,
  x: number,
  y: number
): RoadmapShNode {
  return { id, type, position: { x, y }, data: { label } };
}

function makeEdge(
  source: string,
  target: string,
  opts?: { dashed?: boolean }
): RoadmapShEdge {
  return {
    id: `${source}-${target}`,
    source,
    target,
    ...(opts?.dashed ? { style: { strokeDasharray: "5 5" } } : {}),
  };
}

describe("buildTopicTree", () => {
  it("空のノード・エッジから空のツリーを返す", () => {
    const tree = buildTopicTree([], []);
    expect(tree).toEqual([]);
  });

  it("topic以外のノードをフィルタリングする", () => {
    const nodes: RoadmapShNode[] = [
      makeNode("t1", "topic", "Topic 1", 0, 0),
      makeNode("p1", "paragraph", "Paragraph", 0, 100),
      makeNode("l1", "label", "Label", 0, 200),
    ];
    const tree = buildTopicTree(nodes, []);
    expect(tree).toHaveLength(1);
    expect(tree[0].label).toBe("Topic 1");
  });

  it("エッジで接続されたtopic-subtopicの親子関係を構築する", () => {
    const nodes: RoadmapShNode[] = [
      makeNode("t1", "topic", "Parent", 0, 0),
      makeNode("s1", "subtopic", "Child 1", 100, 50),
      makeNode("s2", "subtopic", "Child 2", 100, 100),
    ];
    const edges: RoadmapShEdge[] = [
      makeEdge("t1", "s1"),
      makeEdge("t1", "s2"),
    ];
    const tree = buildTopicTree(nodes, edges);
    expect(tree).toHaveLength(1);
    expect(tree[0].id).toBe("t1");
    expect(tree[0].children).toHaveLength(2);
    expect(tree[0].children.map((c) => c.id).sort()).toEqual(["s1", "s2"]);
  });

  it("ダッシュ線のエッジでoptionalフラグを設定する", () => {
    const nodes: RoadmapShNode[] = [
      makeNode("t1", "topic", "Parent", 0, 0),
      makeNode("s1", "subtopic", "Required", 100, 50),
      makeNode("s2", "subtopic", "Optional", 100, 100),
    ];
    const edges: RoadmapShEdge[] = [
      makeEdge("t1", "s1"),
      makeEdge("t1", "s2", { dashed: true }),
    ];
    const tree = buildTopicTree(nodes, edges);
    const children = tree[0].children;
    const required = children.find((c) => c.id === "s1")!;
    const optional = children.find((c) => c.id === "s2")!;
    expect(required.isOptional).toBe(false);
    expect(optional.isOptional).toBe(true);
  });

  it("エッジなしのsubtopicを位置ベースで近いtopicにグルーピングする", () => {
    const nodes: RoadmapShNode[] = [
      makeNode("t1", "topic", "Topic A", 0, 0),
      makeNode("t2", "topic", "Topic B", 0, 1000),
      makeNode("s1", "subtopic", "Near A", 100, 50), // close to t1
    ];
    const tree = buildTopicTree(nodes, []);
    const topicA = tree.find((n) => n.id === "t1")!;
    expect(topicA.children).toHaveLength(1);
    expect(topicA.children[0].id).toBe("s1");
  });

  it("距離600以上のsubtopicをルートレベルに配置する", () => {
    const nodes: RoadmapShNode[] = [
      makeNode("t1", "topic", "Topic", 0, 0),
      makeNode("s1", "subtopic", "Far Away", 1000, 1000), // distance > 600
    ];
    const tree = buildTopicTree(nodes, []);
    // s1 should be an orphan at root level
    expect(tree).toHaveLength(2);
    const ids = tree.map((n) => n.id);
    expect(ids).toContain("t1");
    expect(ids).toContain("s1");
  });

  it("Y座標順にソートされる", () => {
    const nodes: RoadmapShNode[] = [
      makeNode("t3", "topic", "Third", 0, 300),
      makeNode("t1", "topic", "First", 0, 0),
      makeNode("t2", "topic", "Second", 0, 150),
    ];
    const tree = buildTopicTree(nodes, []);
    expect(tree.map((n) => n.id)).toEqual(["t1", "t2", "t3"]);
  });

  it("子ノードもY座標順にソートされる", () => {
    const nodes: RoadmapShNode[] = [
      makeNode("t1", "topic", "Parent", 0, 0),
      makeNode("s2", "subtopic", "Second", 100, 200),
      makeNode("s1", "subtopic", "First", 100, 50),
    ];
    const edges: RoadmapShEdge[] = [
      makeEdge("t1", "s1"),
      makeEdge("t1", "s2"),
    ];
    const tree = buildTopicTree(nodes, edges);
    expect(tree[0].children.map((c) => c.id)).toEqual(["s1", "s2"]);
  });
});

describe("flattenTree", () => {
  it("空のツリーから空の配列を返す", () => {
    expect(flattenTree([])).toEqual([]);
  });

  it("フラットなツリーのIDを返す", () => {
    const tree: TopicTreeNode[] = [
      { id: "a", label: "A", type: "topic", children: [], isOptional: false },
      { id: "b", label: "B", type: "topic", children: [], isOptional: false },
    ];
    expect(flattenTree(tree)).toEqual(["a", "b"]);
  });

  it("ネストされたツリーの全IDを深さ優先で返す", () => {
    const tree: TopicTreeNode[] = [
      {
        id: "a",
        label: "A",
        type: "topic",
        isOptional: false,
        children: [
          {
            id: "a1",
            label: "A1",
            type: "subtopic",
            children: [],
            isOptional: false,
          },
          {
            id: "a2",
            label: "A2",
            type: "subtopic",
            children: [],
            isOptional: false,
          },
        ],
      },
      {
        id: "b",
        label: "B",
        type: "topic",
        isOptional: false,
        children: [
          {
            id: "b1",
            label: "B1",
            type: "subtopic",
            children: [],
            isOptional: false,
          },
        ],
      },
    ];
    expect(flattenTree(tree)).toEqual(["a", "a1", "a2", "b", "b1"]);
  });

  it("深くネストされたツリーも正しくフラット化する", () => {
    const tree: TopicTreeNode[] = [
      {
        id: "root",
        label: "Root",
        type: "topic",
        isOptional: false,
        children: [
          {
            id: "child",
            label: "Child",
            type: "subtopic",
            isOptional: false,
            children: [
              {
                id: "grandchild",
                label: "Grandchild",
                type: "subtopic",
                children: [],
                isOptional: false,
              },
            ],
          },
        ],
      },
    ];
    expect(flattenTree(tree)).toEqual(["root", "child", "grandchild"]);
  });
});
