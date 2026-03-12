# Zod v4 - Library Reference

> Source: Context7 MCP (`/colinhacks/zod/v4.0.1`)

## Version

v4.0.1

## Installation

```bash
bun add zod@^4
```

## Object Schema with Type Inference

```ts
import * as z from "zod"

const schema = z.object({
  name: z.string(),
  age: z.number().int().positive(),
  email: z.string().email(),
})

// TypeScript型の自動推論
type SchemaType = z.infer<typeof schema>
```

## String Validations

```ts
z.string().max(5)
z.string().min(5)
z.string().length(5)
z.string().regex(/^[a-z]+$/)
z.string().startsWith("aaa")
z.string().endsWith("zzz")
z.string().includes("---")
z.string().uppercase()
z.string().lowercase()
z.string().email()
z.string().url()
z.string().uuid()
```

## Date Validation

```ts
z.date().safeParse(new Date())          // success: true
z.date().safeParse("2022-01-12T...")    // success: false

z.date({
  error: issue => issue.input === undefined ? "Required" : "Invalid date"
})
```

## Custom Validation

```ts
const px = z.custom<`${number}px`>((val) => {
  return typeof val === "string" ? /^\d+px$/.test(val) : false
})
```

## Refine (Cross-field Validation)

```ts
const passwordForm = z
  .object({
    password: z.string(),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Passwords don't match",
    path: ["confirm"],
  })
```

## 本プロジェクトでの使用例

### Project Schema

```ts
export const projectCreateSchema = z.object({
  name: z.string().min(1, "プロジェクト名は必須です").max(255),
  key: z.string()
    .min(2, "キーは2文字以上")
    .max(10, "キーは10文字以下")
    .regex(/^[A-Z]+$/, "大文字英字のみ"),
  description: z.string().max(2000).optional(),
})

export type ProjectCreate = z.infer<typeof projectCreateSchema>
```

### Issue Schema

```ts
export const issueCreateSchema = z.object({
  title: z.string().min(1, "タイトルは必須です").max(500),
  description: z.string().optional(),
  issue_type: z.enum(["task", "bug", "story"]),
  status: z.enum(["open", "in_progress", "resolved", "closed"]).default("open"),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  assignee_id: z.string().uuid().optional(),
  milestone_id: z.string().uuid().optional(),
  start_date: z.string().date().optional(),
  due_date: z.string().date().optional(),
  estimated_hours: z.number().positive().optional(),
}).refine(
  (data) => {
    if (data.start_date && data.due_date) {
      return data.start_date <= data.due_date
    }
    return true
  },
  {
    message: "終了日は開始日以降にしてください",
    path: ["due_date"],
  }
)

export type IssueCreate = z.infer<typeof issueCreateSchema>
```
