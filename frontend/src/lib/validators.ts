import { z } from "zod";

export const projectCreateSchema = z.object({
  name: z.string().min(1, "プロジェクト名は必須です").max(255),
  key: z
    .string()
    .min(2, "キーは2文字以上で入力してください")
    .max(10, "キーは10文字以下で入力してください")
    .regex(/^[A-Z]+$/, "キーは大文字英字のみ使用できます"),
  description: z.string().max(2000).optional(),
});

export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;

export const issueCreateSchema = z
  .object({
    title: z.string().min(1, "タイトルは必須です").max(500),
    description: z.string().optional(),
    issue_type: z.enum(["task", "bug", "story"]),
    status: z
      .enum(["open", "in_progress", "resolved", "closed"])
      .default("open"),
    priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
    parent_id: z.string().uuid().optional().nullable(),
    assignee_id: z.string().uuid().optional().nullable(),
    milestone_id: z.string().uuid().optional().nullable(),
    start_date: z.string().optional(),
    due_date: z.string().optional(),
    estimated_hours: z.number().positive().optional(),
    progress: z.number().int().min(0).max(100).default(0),
  })
  .refine(
    (data) => {
      if (data.start_date && data.due_date) {
        return data.start_date <= data.due_date;
      }
      return true;
    },
    {
      message: "終了日は開始日より後の日付を指定してください",
      path: ["due_date"],
    }
  );

export type IssueCreateInput = z.infer<typeof issueCreateSchema>;

export const issueUpdateSchema = z
  .object({
    title: z.string().min(1, "タイトルは必須です").max(500).optional(),
    description: z.string().optional().nullable(),
    issue_type: z.enum(["task", "bug", "story"]).optional(),
    status: z.enum(["open", "in_progress", "resolved", "closed"]).optional(),
    priority: z.enum(["low", "medium", "high", "critical"]).optional(),
    parent_id: z.string().uuid().optional().nullable(),
    assignee_id: z.string().uuid().optional().nullable(),
    milestone_id: z.string().uuid().optional().nullable(),
    start_date: z.string().optional().nullable(),
    due_date: z.string().optional().nullable(),
    estimated_hours: z.number().positive().optional().nullable(),
    actual_hours: z.number().positive().optional().nullable(),
    progress: z.number().int().min(0).max(100).optional(),
  })
  .refine(
    (data) => {
      if (data.start_date && data.due_date) {
        return data.start_date <= data.due_date;
      }
      return true;
    },
    {
      message: "終了日は開始日より後の日付を指定してください",
      path: ["due_date"],
    }
  );

export type IssueUpdateInput = z.infer<typeof issueUpdateSchema>;

export const milestoneCreateSchema = z.object({
  name: z.string().min(1, "マイルストーン名は必須です").max(255),
  description: z.string().optional(),
  due_date: z.string().min(1, "期日は必須です"),
});

export type MilestoneCreateInput = z.infer<typeof milestoneCreateSchema>;

export const KATAKANA_RE = /^[\u30A0-\u30FF\u3000\s]*$/;

export const userCreateSchema = z.object({
  name: z.string().min(1, "名前は必須です").max(255),
  name_kana: z.string().max(255).regex(KATAKANA_RE, "カタカナで入力してください").optional().default(""),
  email: z.string().email("有効なメールアドレスを入力してください"),
  avatar_url: z.string().url().optional().nullable(),
});

export type UserCreateInput = z.infer<typeof userCreateSchema>;
