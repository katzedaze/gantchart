export interface User {
  id: string;
  name: string;
  name_kana: string;
  email: string;
  avatar_url: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  id: string;
  user_id: string;
  role: string;
  is_archived: boolean;
  created_at: string;
}

export interface ProjectMemberWithUser {
  id: string;
  user_id: string;
  role: string;
  is_archived: boolean;
  user_name: string;
  user_name_kana: string;
  user_email: string;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  key: string;
  description: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  members: ProjectMember[];
}

export interface Issue {
  id: string;
  project_id: string;
  parent_id: string | null;
  milestone_id: string | null;
  assignee_id: string | null;
  issue_key: string;
  title: string;
  description: string | null;
  issue_type: "task" | "bug" | "story";
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "critical";
  start_date: string | null;
  due_date: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  progress: number;
  sort_order: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Milestone {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  due_date: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Dependency {
  id: string;
  predecessor_id: string;
  successor_id: string;
  dependency_type: string;
  created_at: string;
}

export interface CommentAuthor {
  id: string;
  name: string;
  name_kana: string;
  avatar_url: string | null;
}

export interface Comment {
  id: string;
  issue_id: string;
  author_id: string;
  body: string;
  created_at: string;
  updated_at: string;
  author: CommentAuthor | null;
}

export interface Attachment {
  id: string;
  comment_id: string | null;
  issue_id: string;
  filename: string;
  filepath: string;
  content_type: string;
  size: number;
  created_at: string;
}

export interface GanttData {
  issues: Issue[];
  milestones: Milestone[];
  dependencies: Dependency[];
}
