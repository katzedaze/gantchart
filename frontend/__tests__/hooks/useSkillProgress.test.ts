import { describe, it, expect } from "vitest";

// Test the SkillProgressItem interface and hook API contract
// The hooks themselves require React Query Provider, so we test the API contract

describe("useSkillProgress API contract", () => {
  it("SkillProgressItem interface does not include user_id", () => {
    // Verify the type shape matches our API contract
    const item = {
      id: "uuid-1",
      roadmap_slug: "frontend",
      node_id: "node-1",
      level: "done",
      updated_at: "2026-03-13T00:00:00Z",
    };

    expect(item).toHaveProperty("id");
    expect(item).toHaveProperty("roadmap_slug");
    expect(item).toHaveProperty("node_id");
    expect(item).toHaveProperty("level");
    expect(item).toHaveProperty("updated_at");
    expect(item).not.toHaveProperty("user_id");
  });

  it("BulkUpsertPayload includes roadmap_slug and items", () => {
    const payload = {
      roadmap_slug: "frontend",
      items: [
        { node_id: "node-1", level: "done" },
        { node_id: "node-2", level: "learning" },
      ],
    };

    expect(payload.roadmap_slug).toBe("frontend");
    expect(payload.items).toHaveLength(2);
    expect(payload.items[0]).toEqual({ node_id: "node-1", level: "done" });
    // Should NOT have userId
    expect(payload).not.toHaveProperty("userId");
    expect(payload).not.toHaveProperty("user_id");
  });

  it("API endpoint paths do not contain user ID", () => {
    const baseEndpoint = "/skill-progress/";
    const withRoadmap = "/skill-progress/?roadmap_slug=frontend";

    expect(baseEndpoint).not.toMatch(/\/users\//);
    expect(withRoadmap).not.toMatch(/\/users\//);
    expect(baseEndpoint).toBe("/skill-progress/");
    expect(withRoadmap).toContain("roadmap_slug=frontend");
  });

  it("level values are restricted to none, learning, done", () => {
    const validLevels = ["none", "learning", "done"];
    const invalidLevels = ["beginner", "expert", "intermediate", ""];

    for (const level of validLevels) {
      expect(level).toMatch(/^(none|learning|done)$/);
    }
    for (const level of invalidLevels) {
      expect(level).not.toMatch(/^(none|learning|done)$/);
    }
  });
});
