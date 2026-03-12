import { describe, it, expect } from "vitest";
import {
  dateToPixel,
  pixelToDate,
  calculateBarWidth,
  calculateBarLeft,
  getDateRange,
  generateDateColumns,
  formatDate,
  getScheduleStatus,
} from "@/lib/gantt-utils";

const config = {
  startDate: new Date("2024-01-01"),
  pixelsPerDay: 30,
};

describe("dateToPixel", () => {
  it("converts date at start to 0", () => {
    expect(dateToPixel(new Date("2024-01-01"), config)).toBe(0);
  });

  it("converts date 10 days later to 300px", () => {
    expect(dateToPixel(new Date("2024-01-11"), config)).toBe(300);
  });

  it("converts date 1 day later to 30px", () => {
    expect(dateToPixel(new Date("2024-01-02"), config)).toBe(30);
  });
});

describe("pixelToDate", () => {
  it("converts 0px to start date", () => {
    const result = pixelToDate(0, config);
    expect(result.toISOString().split("T")[0]).toBe("2024-01-01");
  });

  it("converts 300px to 10 days later", () => {
    const result = pixelToDate(300, config);
    expect(result.toISOString().split("T")[0]).toBe("2024-01-11");
  });
});

describe("calculateBarWidth", () => {
  it("returns pixelsPerDay for null dates", () => {
    expect(calculateBarWidth(null, null, config)).toBe(30);
  });

  it("calculates correct width for date range", () => {
    const width = calculateBarWidth("2024-01-01", "2024-01-11", config);
    expect(width).toBe(300);
  });

  it("returns minimum width for same day", () => {
    const width = calculateBarWidth("2024-01-01", "2024-01-01", config);
    expect(width).toBe(30); // minimum is pixelsPerDay
  });
});

describe("calculateBarLeft", () => {
  it("returns 0 for null start date", () => {
    expect(calculateBarLeft(null, config)).toBe(0);
  });

  it("calculates correct left position", () => {
    const left = calculateBarLeft("2024-01-11", config);
    expect(left).toBe(300);
  });
});

describe("getDateRange", () => {
  it("returns default range for empty issues", () => {
    const range = getDateRange([]);
    expect(range.start).toBeInstanceOf(Date);
    expect(range.end).toBeInstanceOf(Date);
    expect(range.end > range.start).toBe(true);
  });

  it("includes padding around issue dates", () => {
    const range = getDateRange(
      [{ start_date: "2024-03-01", due_date: "2024-03-15" }],
      7
    );
    expect(range.start < new Date("2024-03-01")).toBe(true);
    expect(range.end > new Date("2024-03-15")).toBe(true);
  });

  it("handles null dates in issues", () => {
    const range = getDateRange([
      { start_date: null, due_date: null },
      { start_date: "2024-02-01", due_date: null },
    ]);
    expect(range.start).toBeInstanceOf(Date);
  });
});

describe("generateDateColumns", () => {
  it("generates columns between start and end", () => {
    const start = new Date("2024-01-01");
    const end = new Date("2024-01-05");
    const columns = generateDateColumns(start, end, 30);
    expect(columns.length).toBe(5);
    expect(columns[0].label).toBe("1/1");
    expect(columns[0].x).toBe(0);
    expect(columns[1].x).toBe(30);
  });
});

describe("formatDate", () => {
  it("returns dash for null", () => {
    expect(formatDate(null)).toBe("-");
  });

  it("formats date string", () => {
    const result = formatDate("2024-03-15");
    expect(result).toBeTruthy();
    expect(result).not.toBe("-");
  });
});

describe("getScheduleStatus", () => {
  const makeIssue = (overrides: Partial<{
    status: string;
    progress: number;
    start_date: string | null;
    due_date: string | null;
  }> = {}) => ({
    status: "in_progress",
    progress: 0,
    start_date: "2024-01-01",
    due_date: "2024-01-31",
    ...overrides,
  });

  it("returns completed for resolved issues", () => {
    expect(getScheduleStatus(makeIssue({ status: "resolved" }))).toBe("completed");
  });

  it("returns completed for closed issues", () => {
    expect(getScheduleStatus(makeIssue({ status: "closed" }))).toBe("completed");
  });

  it("returns on_track for in_progress issue when no dates", () => {
    expect(getScheduleStatus(makeIssue({ start_date: null, due_date: null }))).toBe("on_track");
  });

  it("returns not_started for open issue when no dates", () => {
    expect(getScheduleStatus(makeIssue({ status: "open", start_date: null, due_date: null }))).toBe("not_started");
  });

  it("returns not_started before start date", () => {
    const now = new Date("2023-12-15");
    expect(getScheduleStatus(makeIssue(), now)).toBe("not_started");
  });

  it("returns on_track when progress matches elapsed time", () => {
    const now = new Date("2024-01-16"); // ~50% elapsed
    expect(getScheduleStatus(makeIssue({ progress: 50 }), now)).toBe("on_track");
  });

  it("returns on_track when ahead of schedule", () => {
    const now = new Date("2024-01-16"); // ~50% elapsed
    expect(getScheduleStatus(makeIssue({ progress: 80 }), now)).toBe("on_track");
  });

  it("returns at_risk when behind schedule", () => {
    const now = new Date("2024-01-16"); // ~50% elapsed
    expect(getScheduleStatus(makeIssue({ progress: 10 }), now)).toBe("at_risk");
  });

  it("returns overdue when past due date and not complete", () => {
    const now = new Date("2024-02-15"); // past due
    expect(getScheduleStatus(makeIssue({ progress: 80 }), now)).toBe("overdue");
  });

  it("returns on_track at 100% progress even near deadline", () => {
    const now = new Date("2024-01-30"); // near end
    expect(getScheduleStatus(makeIssue({ progress: 100 }), now)).toBe("on_track");
  });

  it("returns on_track for in_progress issue without due_date", () => {
    expect(
      getScheduleStatus(makeIssue({ status: "in_progress", start_date: "2024-01-01", due_date: null }))
    ).toBe("on_track");
  });

  it("returns on_track at exactly 70% of expected progress (boundary)", () => {
    const now = new Date("2024-01-16"); // ~50% elapsed, expected ~50
    // 70% of 50 = 35, so progress=35 should be on_track
    expect(getScheduleStatus(makeIssue({ progress: 35 }), now)).toBe("on_track");
  });

  it("returns at_risk just below 70% of expected progress (boundary)", () => {
    const now = new Date("2024-01-16"); // ~50% elapsed, expected ~50
    // 70% of 50 = 35, so progress=34 should be at_risk
    expect(getScheduleStatus(makeIssue({ progress: 34 }), now)).toBe("at_risk");
  });
});
