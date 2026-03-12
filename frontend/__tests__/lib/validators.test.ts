import { describe, it, expect } from "vitest";
import {
  projectCreateSchema,
  issueCreateSchema,
  milestoneCreateSchema,
} from "@/lib/validators";

describe("projectCreateSchema", () => {
  it("validates correct project data", () => {
    const result = projectCreateSchema.safeParse({
      name: "Test Project",
      key: "TEST",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = projectCreateSchema.safeParse({
      name: "",
      key: "TEST",
    });
    expect(result.success).toBe(false);
  });

  it("rejects lowercase key", () => {
    const result = projectCreateSchema.safeParse({
      name: "Test",
      key: "test",
    });
    expect(result.success).toBe(false);
  });

  it("rejects key shorter than 2 chars", () => {
    const result = projectCreateSchema.safeParse({
      name: "Test",
      key: "T",
    });
    expect(result.success).toBe(false);
  });

  it("allows optional description", () => {
    const result = projectCreateSchema.safeParse({
      name: "Test",
      key: "TE",
      description: "A description",
    });
    expect(result.success).toBe(true);
  });
});

describe("issueCreateSchema", () => {
  it("validates correct issue data", () => {
    const result = issueCreateSchema.safeParse({
      title: "Fix bug",
      issue_type: "bug",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty title", () => {
    const result = issueCreateSchema.safeParse({
      title: "",
      issue_type: "task",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid issue type", () => {
    const result = issueCreateSchema.safeParse({
      title: "Test",
      issue_type: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects due_date before start_date", () => {
    const result = issueCreateSchema.safeParse({
      title: "Test",
      issue_type: "task",
      start_date: "2024-03-15",
      due_date: "2024-03-10",
    });
    expect(result.success).toBe(false);
  });

  it("allows valid date range", () => {
    const result = issueCreateSchema.safeParse({
      title: "Test",
      issue_type: "task",
      start_date: "2024-03-10",
      due_date: "2024-03-15",
    });
    expect(result.success).toBe(true);
  });
});

describe("milestoneCreateSchema", () => {
  it("validates correct milestone data", () => {
    const result = milestoneCreateSchema.safeParse({
      name: "v1.0",
      due_date: "2024-06-01",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = milestoneCreateSchema.safeParse({
      name: "",
      due_date: "2024-06-01",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty due_date", () => {
    const result = milestoneCreateSchema.safeParse({
      name: "v1.0",
      due_date: "",
    });
    expect(result.success).toBe(false);
  });
});
