import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { IssueTable } from "@/components/issues/IssueTable";
import type { Issue } from "@/types";
import type { ReactNode } from "react";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

const mockIssues: Issue[] = [
  {
    id: "1",
    project_id: "p1",
    parent_id: null,
    milestone_id: null,
    assignee_id: null,
    issue_key: "PROJ-1",
    title: "First Issue",
    description: null,
    issue_type: "task",
    status: "open",
    priority: "high",
    start_date: "2024-03-01",
    due_date: "2024-03-15",
    estimated_hours: null,
    actual_hours: null,
    progress: 0,
    sort_order: 0,
    is_archived: false,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    project_id: "p1",
    parent_id: null,
    milestone_id: null,
    assignee_id: null,
    issue_key: "PROJ-2",
    title: "Second Issue",
    description: null,
    issue_type: "bug",
    status: "in_progress",
    priority: "critical",
    start_date: null,
    due_date: null,
    estimated_hours: null,
    actual_hours: null,
    progress: 30,
    sort_order: 1,
    is_archived: false,
    created_at: "2024-01-02T00:00:00Z",
    updated_at: "2024-01-02T00:00:00Z",
  },
];

describe("IssueTable", () => {
  it("renders issue keys and titles", () => {
    render(<IssueTable issues={mockIssues} projectId="p1" />, {
      wrapper: createWrapper(),
    });
    expect(screen.getByText("PROJ-1")).toBeInTheDocument();
    expect(screen.getByText("First Issue")).toBeInTheDocument();
    expect(screen.getByText("PROJ-2")).toBeInTheDocument();
    expect(screen.getByText("Second Issue")).toBeInTheDocument();
  });

  it("renders status badges", () => {
    render(<IssueTable issues={mockIssues} projectId="p1" />, {
      wrapper: createWrapper(),
    });
    expect(screen.getByText("未着手")).toBeInTheDocument();
    expect(screen.getByText("進行中")).toBeInTheDocument();
  });

  it("renders priority badges", () => {
    render(<IssueTable issues={mockIssues} projectId="p1" />, {
      wrapper: createWrapper(),
    });
    expect(screen.getByText("高")).toBeInTheDocument();
    expect(screen.getByText("緊急")).toBeInTheDocument();
  });

  it("shows empty message when 課題がまだありません", () => {
    render(<IssueTable issues={[]} projectId="p1" />, {
      wrapper: createWrapper(),
    });
    expect(screen.getByText(/課題がまだありません/i)).toBeInTheDocument();
  });

  it("renders correct number of rows", () => {
    render(<IssueTable issues={mockIssues} projectId="p1" />, {
      wrapper: createWrapper(),
    });
    const rows = screen.getAllByRole("row");
    // 1 header row + 2 data rows
    expect(rows.length).toBe(3);
  });
});
